import { normalise } from './score';

// Advanced CSP extractor — natural-language pattern recognition for
// scheduling, allocation, colouring, ordering, and AllDifferent-style
// problems. Goes well beyond the simple regex extractor in extract.ts.
//
// Output is a "rich" extracted CSP: tasks/resources/deadlines/durations
// alongside raw variables/constraints. A synthesiser at the bottom
// converts the rich CSP into a CSPLab spec string.

export type Val = number | string;

export interface RichVariable {
  name: string;
  domain: Val[];
  source: string;          // brief explanation of where the domain came from
  confidence: number;      // 0..100
}

export interface RichConstraint {
  src: string;             // text to pass to the solver
  kind: 'unary' | 'binary' | 'pairwise' | 'nonoverlap' | 'sum' | 'other';
  involves: string[];      // variable names
  why: string;             // explanation
  confidence: number;      // 0..100
}

export interface Task {
  id: string;          // 'task1', 't2', etc.
  varName: string;     // 's1', 'start_t1', ...
  duration?: number;
  resources?: string[];
}

export interface Resource {
  id: string;
  mutexTasks: string[];   // tasks that must not overlap on this resource
}

export interface RichCSP {
  variables: RichVariable[];
  constraints: RichConstraint[];
  tasks: Task[];
  resources: Resource[];
  deadline?: number;
  allDifferentGroups: string[][];
  notes: string[];
  totalConfidence: number;
}

// ────────────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────────────

function parseRange(s: string): number[] | null {
  const m = s.replace(/\s/g, '').match(/^(-?\d+)\s*(?:\.\.|–|-)\s*(-?\d+)$/);
  if (!m) return null;
  const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
  if (lo > hi || hi - lo > 100) return null;
  const r: number[] = [];
  for (let i = lo; i <= hi; i++) r.push(i);
  return r;
}
function parseSet(s: string): Val[] {
  return s.split(/[,;\s]+/).filter(Boolean).map((tok) => {
    const n = Number(tok);
    return Number.isFinite(n) && tok !== '' && !Number.isNaN(n) ? n : tok;
  });
}
function uniq<T>(xs: T[]): T[] { return [...new Set(xs)]; }
function intersect<T>(a: T[], b: T[]): T[] { const s = new Set(b); return a.filter((x) => s.has(x)); }

// Word-number parser ("one" → 1, "two" → 2, ...)
const NUM_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
function wordToNum(w: string): number | null { return NUM_WORDS[w.toLowerCase()] ?? null; }
function parseNumOrWord(w: string): number | null {
  const n = parseInt(w, 10);
  if (Number.isFinite(n) && !Number.isNaN(n)) return n;
  return wordToNum(w);
}

// ────────────────────────────────────────────────────────────────────
//  Pass 1: detect named-task pattern
// ────────────────────────────────────────────────────────────────────

function detectTasks(text: string, notes: string[]): { tasks: Task[]; varPrefix: string } {
  // Pattern: "tasks 1, 2, 3, 4" or "tasks 1-4" or "4 tasks"
  const tasks: Task[] = [];
  const ids = new Set<number>();
  // a) "tasks 1, 2, 3, 4"
  const list = text.match(/\btasks?\s+((?:\d+\s*(?:,\s*|\s+and\s+|\s+))+\d+)/i);
  if (list) {
    for (const id of list[1].split(/[,\s]+|and/i).map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n))) ids.add(id);
  }
  // b) "four tasks" or "4 tasks"
  if (ids.size === 0) {
    const count = text.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+tasks?\b/i);
    if (count) {
      const n = parseNumOrWord(count[1]);
      if (n && n > 0 && n < 30) for (let i = 1; i <= n; i++) ids.add(i);
    }
  }
  // c) Detect variable naming convention
  // Look for "start time of a task i is represented with a variable si"
  let varPrefix = 's';
  const conv = text.match(/\b(?:variable|denoted|called)\s+([a-z])\s*(?:_)?[i\d]/i);
  if (conv) varPrefix = conv[1];
  // Look for "s_i", "t_i", "x_i" mentions
  if (ids.size > 0) {
    for (const id of [...ids].sort((a, b) => a - b)) {
      tasks.push({ id: `task${id}`, varName: `${varPrefix}${id}` });
    }
    notes.push(`Detected ${tasks.length} tasks (variables ${tasks.map((t) => t.varName).join(', ')}).`);
  }
  return { tasks, varPrefix };
}

// ────────────────────────────────────────────────────────────────────
//  Pass 2: durations
// ────────────────────────────────────────────────────────────────────

function detectDurations(text: string, tasks: Task[], notes: string[]) {
  // "task X takes Y hours" or "tasks X, Y each take Z hours" or "X and Y each take 1 hour"
  // capture "tasks 1, 2 ... take 1 hour" and "tasks 3, 4 ... take 2 hours"
  const dur = /\btasks?\s+((?:\d+\s*(?:,\s*|\s+and\s+|\s+))*\d+)\s*(?:each\s+)?(?:take|takes|need|needs|require|requires)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:hour|hr|day|min|minute|second|sec|unit)s?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = dur.exec(text)) !== null) {
    const taskIds = m[1].split(/[,\s]+|and/i).map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
    const d = parseNumOrWord(m[2]);
    if (!d) continue;
    for (const id of taskIds) {
      const t = tasks.find((tk) => tk.id === `task${id}`);
      if (t) {
        t.duration = d;
        notes.push(`Task ${id} duration = ${d}.`);
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────
//  Pass 3: resource mutexes
// ────────────────────────────────────────────────────────────────────

function detectResources(text: string, tasks: Task[], notes: string[]): Resource[] {
  const resources: Resource[] = [];
  // Pattern: "Tasks N, M ... require ... machine X" / "all require the same machine X"
  // "no pair of them can be running at the same time"
  // "they cannot be running at the same time"

  // Find all sentences mentioning a "machine X" and the tasks that need it.
  // "Tasks 2, 3, and 4 all require the same machine m2, so no pair of them can be running at the same time."
  const re = /\btasks?\s+((?:\d+\s*(?:,\s*|\s+and\s+|\s+))*\d+)\s*(?:all\s+)?(?:require|need)s?\s+(?:the\s+same\s+)?(?:machine|resource)\s+([A-Za-z_]\w*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const taskIds = m[1].split(/[,\s]+|and/i).map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
    const resourceId = m[2];
    const taskNames = taskIds.map((id) => `task${id}`).filter((tn) => tasks.some((t) => t.id === tn));
    if (taskNames.length < 2) continue;
    const existing = resources.find((r) => r.id === resourceId);
    if (existing) {
      for (const tn of taskNames) if (!existing.mutexTasks.includes(tn)) existing.mutexTasks.push(tn);
    } else {
      resources.push({ id: resourceId, mutexTasks: taskNames });
    }
    notes.push(`Resource ${resourceId}: mutex on tasks ${taskIds.join(', ')}.`);
  }
  return resources;
}

// ────────────────────────────────────────────────────────────────────
//  Pass 4: deadline
// ────────────────────────────────────────────────────────────────────

function detectDeadline(text: string, notes: string[]): number | undefined {
  // "all tasks must be completed within 4 hours" / "finish by hour N" / "deadline N"
  const m = text.match(/\b(?:all\s+tasks?\s+(?:must\s+be\s+)?(?:completed?|finished?)\s+(?:within|by|in)\s+(\d+)\s*(?:hours?|days?|units?)?|deadline\s+(?:is\s+)?(\d+)|finish(?:ed)?\s+by\s+(?:hour\s+)?(\d+))/i);
  if (m) {
    const n = parseInt(m[1] || m[2] || m[3], 10);
    if (Number.isFinite(n)) {
      notes.push(`Detected deadline = ${n}.`);
      return n;
    }
  }
  return undefined;
}

// ────────────────────────────────────────────────────────────────────
//  Pass 5: explicit domain declarations (for our variables)
// ────────────────────────────────────────────────────────────────────

function detectExplicitDomains(text: string, tasks: Task[], variables: RichVariable[], notes: string[]) {
  // Patterns:
  // "For tasks 1 and 2, the start time variables have domain {1..4}"
  // "For tasks 3 and 4, the start time variables have domain {1..3}"
  // "s1, s2 ∈ {1..4}"
  // "D(s1) = {1, 2, 3, 4}"

  const taskListDomain = /for\s+tasks?\s+((?:\d+\s*(?:,\s*|\s+and\s+|\s+))*\d+)[^.]*?domain\s+\{?\s*([^}.\n]+?)\s*\}?/gi;
  let m: RegExpExecArray | null;
  while ((m = taskListDomain.exec(text)) !== null) {
    const taskIds = m[1].split(/[,\s]+|and/i).map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
    const domStr = m[2].trim();
    const dom = parseRange(domStr) ?? parseSet(domStr);
    if (dom.length === 0) continue;
    for (const id of taskIds) {
      const t = tasks.find((tk) => tk.id === `task${id}`);
      if (!t) continue;
      const existing = variables.find((v) => v.name === t.varName);
      if (existing) { existing.domain = dom; existing.source = `explicit (for tasks ${taskIds.join(', ')})`; existing.confidence = 95; }
      else variables.push({ name: t.varName, domain: dom, source: `explicit (for tasks ${taskIds.join(', ')})`, confidence: 95 });
    }
    notes.push(`Explicit domain {${dom.join(', ')}} for tasks ${taskIds.join(', ')}.`);
  }

  // Direct: "D(x1) = {1, 2, 3}"  or  "x1 ∈ {1, 2, 3}"  or  "x1 = {1, 2, 3}"
  // (already done by the simple extractor; here we add any not yet seen)
  const direct = /\b(?:D\s*\(\s*([A-Za-z_]\w*)\s*\)|([A-Za-z_]\w*)\s*(?:∈|in)|([A-Za-z_]\w*)\s*=)\s*\{\s*([^}]+)\}/g;
  while ((m = direct.exec(text)) !== null) {
    const name = m[1] ?? m[2] ?? m[3];
    if (!name) continue;
    const dom = parseSet(m[4]) ?? [];
    if (dom.length === 0) continue;
    if (!variables.some((v) => v.name === name)) {
      variables.push({ name, domain: dom, source: 'explicit declaration', confidence: 95 });
    }
  }
  // "x in {1..4}" range form
  const rangeDirect = /\b([A-Za-z_]\w*)\s*(?:∈|in)\s*\{?\s*(-?\d+)\s*(?:\.\.|–|-)\s*(-?\d+)\s*\}?/g;
  while ((m = rangeDirect.exec(text)) !== null) {
    const name = m[1];
    if (variables.some((v) => v.name === name)) continue;
    const dom = parseRange(`${m[2]}..${m[3]}`);
    if (!dom) continue;
    variables.push({ name, domain: dom, source: 'explicit range', confidence: 90 });
  }
}

// ────────────────────────────────────────────────────────────────────
//  Pass 6: simple binary constraints "x1 < x2"
// ────────────────────────────────────────────────────────────────────

function detectSimpleConstraints(text: string, variables: RichVariable[], constraints: RichConstraint[]) {
  const varNames = new Set(variables.map((v) => v.name));
  // binary: a OP b   where OP in <,>,<=,>=,!=,=
  const binRe = /\b([A-Za-z_]\w*)\s*(<=|>=|!=|<|>|=)\s*([A-Za-z_]\w*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = binRe.exec(text)) !== null) {
    const a = m[1], op = m[2], b = m[3];
    if (a === b) continue;
    if (!varNames.has(a) || !varNames.has(b)) continue;
    const src = `${a} ${op} ${b}`;
    if (constraints.some((c) => c.src === src)) continue;
    constraints.push({ src, kind: 'binary', involves: [a, b], why: 'direct relation in question text', confidence: 95 });
  }
  // unary: a OP n
  const unRe = /\b([A-Za-z_]\w*)\s*(<=|>=|!=|<|>|=)\s*(-?\d+)\b/g;
  while ((m = unRe.exec(text)) !== null) {
    const a = m[1], op = m[2], n = m[3];
    if (!varNames.has(a)) continue;
    const src = `${a} ${op} ${n}`;
    if (constraints.some((c) => c.src === src)) continue;
    constraints.push({ src, kind: 'unary', involves: [a], why: 'direct relation in question text', confidence: 95 });
  }
}

// ────────────────────────────────────────────────────────────────────
//  Pass 7: AllDifferent / pairwise distinct
// ────────────────────────────────────────────────────────────────────

function detectAllDifferent(text: string, variables: RichVariable[], groups: string[][]) {
  // Explicit: AllDifferent(s1, s2, s3)
  const re1 = /\b(?:AllDifferent|pairwise\s+(?:distinct|different)|all\s+different)\s*\(?\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*\)?/i;
  const m = text.match(re1);
  if (m) {
    const vars = m[1].split(/\s*,\s*/).filter((v) => variables.some((vv) => vv.name === v));
    if (vars.length >= 2) groups.push(vars);
  }
}

// ────────────────────────────────────────────────────────────────────
//  Pass 8: derive constraints from resources + durations
// ────────────────────────────────────────────────────────────────────

function deriveSchedulingConstraints(tasks: Task[], resources: Resource[], constraints: RichConstraint[], notes: string[]) {
  // For every mutex group on a resource:
  //   for every pair (i, j) of tasks in the group, with durations d_i, d_j:
  //     no-overlap: (s_i + d_i <= s_j) OR (s_j + d_j <= s_i)
  //   simplification:
  //     - if d_i = d_j = 1 and integers, equivalent to s_i != s_j
  //     - if d_i = d_j = k, |s_i - s_j| >= k
  for (const r of resources) {
    for (let i = 0; i < r.mutexTasks.length; i++) {
      for (let j = i + 1; j < r.mutexTasks.length; j++) {
        const ti = tasks.find((t) => t.id === r.mutexTasks[i]);
        const tj = tasks.find((t) => t.id === r.mutexTasks[j]);
        if (!ti || !tj) continue;
        const si = ti.varName, sj = tj.varName;
        const di = ti.duration, dj = tj.duration;
        let src = '';
        let why = '';
        if (di !== undefined && dj !== undefined) {
          if (di === 1 && dj === 1) {
            src = `${si} != ${sj}`;
            why = `mutex on ${r.id} (both 1-unit) → ${si} ≠ ${sj}`;
          } else if (di === dj) {
            src = `abs(${si} - ${sj}) >= ${di}`;
            why = `mutex on ${r.id} (both ${di}-unit) → no overlap requires |${si}-${sj}| ≥ ${di}`;
          } else {
            // Asymmetric durations: exact non-overlap is the DISJUNCTION
            //   (s_i + d_i <= s_j) OR (s_j + d_j <= s_i)
            // CSPLab's predicate compiler accepts JS, so use || and <=.
            src = `(${si} + ${di} <= ${sj}) || (${sj} + ${dj} <= ${si})`;
            why = `mutex on ${r.id} (durations ${di}, ${dj}) → non-overlap (${si}+${di}≤${sj}) ∨ (${sj}+${dj}≤${si})`;
          }
        } else {
          // No duration info — just pairwise ≠
          src = `${si} != ${sj}`;
          why = `mutex on ${r.id} (durations unknown — assume both 1-unit)`;
        }
        if (!constraints.some((c) => c.src === src)) {
          constraints.push({ src, kind: 'nonoverlap', involves: [si, sj], why, confidence: 80 });
        }
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────
//  Pass 9: ensure variables for all tasks; apply deadline-shrinking
// ────────────────────────────────────────────────────────────────────

function ensureTaskVariables(tasks: Task[], variables: RichVariable[], deadline: number | undefined, notes: string[]) {
  for (const t of tasks) {
    let existing = variables.find((v) => v.name === t.varName);
    if (!existing) {
      // Default domain {1..deadline} if known, else {1..10}
      const hi = deadline ?? 10;
      const dom: number[] = [];
      for (let i = 1; i <= hi; i++) dom.push(i);
      existing = { name: t.varName, domain: dom, source: `default {1..${hi}}${deadline ? ' from deadline' : ''}`, confidence: 50 };
      variables.push(existing);
    }
    // Apply deadline: if duration known and not already shrunk, ensure max start time ≤ deadline - duration + 1
    if (t.duration && deadline) {
      const maxStart = deadline - t.duration + 1;
      const pruned = existing.domain.filter((v) => typeof v !== 'number' || v <= maxStart);
      if (pruned.length < existing.domain.length) {
        existing.domain = pruned;
        notes.push(`Domain of ${t.varName} pruned to {1..${maxStart}} via deadline ${deadline} − duration ${t.duration} + 1.`);
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────
//  Main rich extractor
// ────────────────────────────────────────────────────────────────────

export function extractRichCSP(rawText: string): RichCSP {
  const text = normalise(rawText);
  const notes: string[] = [];
  const variables: RichVariable[] = [];
  const constraints: RichConstraint[] = [];
  const allDifferentGroups: string[][] = [];

  const { tasks } = detectTasks(text, notes);
  detectDurations(text, tasks, notes);
  const resources = detectResources(text, tasks, notes);
  const deadline = detectDeadline(text, notes);
  detectExplicitDomains(text, tasks, variables, notes);
  ensureTaskVariables(tasks, variables, deadline, notes);
  detectSimpleConstraints(text, variables, constraints);
  detectAllDifferent(text, variables, allDifferentGroups);
  deriveSchedulingConstraints(tasks, resources, constraints, notes);

  // Total confidence: average of variable confidences scaled by # of constraints found
  let totalConfidence = 0;
  if (variables.length) {
    totalConfidence = variables.reduce((a, v) => a + v.confidence, 0) / variables.length;
    if (constraints.length >= 2) totalConfidence = Math.min(100, totalConfidence + 10);
    if (constraints.length === 0 && allDifferentGroups.length === 0) totalConfidence = Math.min(totalConfidence, 30);
  }
  return { variables, constraints, tasks, resources, deadline, allDifferentGroups, notes, totalConfidence: Math.round(totalConfidence) };
}

// ────────────────────────────────────────────────────────────────────
//  Synthesise CSPLab spec from rich CSP
// ────────────────────────────────────────────────────────────────────

export function richToLabSpec(csp: RichCSP): string {
  const lines: string[] = [];
  if (csp.notes.length) {
    lines.push('# Auto-extracted from the question. Edit as needed.');
    for (const n of csp.notes) lines.push('# - ' + n);
    lines.push('');
  }
  for (const v of csp.variables) {
    lines.push(`${v.name} = ${v.domain.join(', ')}`);
  }
  const unary = csp.constraints.filter((c) => c.kind === 'unary');
  const binary = csp.constraints.filter((c) => c.kind !== 'unary');
  if (unary.length) {
    lines.push('unary:');
    for (const u of unary) lines.push(u.src);
  }
  if (binary.length || csp.allDifferentGroups.length) {
    lines.push('binary:');
    for (const b of binary) lines.push(b.src);
    for (const grp of csp.allDifferentGroups) {
      for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
        lines.push(`${grp[i]}-${grp[j]}`);
      }
    }
  }
  return lines.join('\n');
}
