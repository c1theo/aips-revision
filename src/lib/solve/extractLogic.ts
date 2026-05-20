import { normalise } from './score';

// Extractors for logic / SAT vizes:
//   - propositional formula (for TruthTable / CNFEncoder / TseitinEncoder)
//   - CNF clauses (for DPLL / CDCL / WalkSAT / TwoSAT)
//   - Horn KB (facts + rules + goal) for HornChain
//   - Resolution problem: KB + query for Resolution viz
// All non-AI; pattern + regex parsing only.

// ────────────────────────────────────────────────────────────────────
//  Propositional formula extractor
// ────────────────────────────────────────────────────────────────────

export interface ExtractedFormula {
  formula: string;                 // normalised, ready for TruthTable / CNFEncoder
  variables: string[];
  warnings: string[];
  confidence: number;
}

function normaliseLogicSyntax(s: string): string {
  let t = s;
  // Convert common spellings of operators
  t = t.replace(/\b(?:and|AND)\b/g, '∧');
  t = t.replace(/\b(?:or|OR)\b/g, '∨');
  t = t.replace(/\b(?:not|NOT)\b/g, '¬');
  t = t.replace(/\b(?:iff|IFF|equivalent\s+to)\b/g, '↔');
  t = t.replace(/\b(?:implies|IMPLIES|then)\b/g, '→');
  t = t.replace(/&&|&/g, '∧');
  t = t.replace(/\|\|/g, '∨');
  t = t.replace(/!=|<>/g, '≠');
  t = t.replace(/!\s*([A-Za-z_])/g, '¬$1');
  t = t.replace(/<->|<=>/g, '↔');
  t = t.replace(/->|=>/g, '→');
  return t;
}

export function extractFormula(rawText: string): ExtractedFormula {
  const text = normalise(rawText);
  const warnings: string[] = [];
  // Look for "formula α = ..." or "let φ = ..."
  const namedRe = /\b(?:formula|let|consider|the\s+formula|alpha|phi|α|φ|ψ|propositional\s+formula)\s*[α-ωa-z]?\s*[:=]\s*([^.\n]{4,200})/i;
  const m1 = text.match(namedRe);
  let raw = m1 ? m1[1] : '';
  // Or a single inline expression on its own line
  if (!raw) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const l of lines) {
      // A line that looks like a formula
      if (/^[¬!\(\s]*[A-Za-z_]\w*\s*(?:∧|∨|→|↔|⊕|=>|->|\|\||&&|<->|<=>|\bAND\b|\bOR\b|\bIMPLIES\b|\bIFF\b|\bNOT\b|!|¬)/i.test(l)) {
        raw = l; break;
      }
    }
  }
  if (!raw) {
    warnings.push('No propositional formula detected; provide one inline (e.g. "α = (p ∧ q) → r").');
    return { formula: '', variables: [], warnings, confidence: 0 };
  }
  const formula = normaliseLogicSyntax(raw.trim());
  const vars = uniqVars(formula);
  let conf = 30;
  if (vars.length >= 2) conf += 30;
  if (/[∧∨¬→↔]/.test(formula)) conf += 30;
  return { formula, variables: vars, warnings, confidence: Math.min(100, conf) };
}

function uniqVars(formula: string): string[] {
  const matches = formula.match(/\b[A-Za-z_]\w*\b/g) ?? [];
  const RESERVED = new Set(['and', 'or', 'not', 'implies', 'iff', 'true', 'false', 'T', 'F']);
  return [...new Set(matches.filter((w) => !RESERVED.has(w.toLowerCase())))];
}

// ────────────────────────────────────────────────────────────────────
//  CNF clauses extractor (improved)
// ────────────────────────────────────────────────────────────────────

export interface ExtractedCNF {
  clauses: string[];        // each clause as " l1 ∨ l2 ∨ ¬l3 "
  variables: string[];
  warnings: string[];
  confidence: number;
}

export function extractCNF(rawText: string): ExtractedCNF {
  const text = normaliseLogicSyntax(normalise(rawText));
  const clauses: string[] = [];
  const vars = new Set<string>();
  const warnings: string[] = [];

  // 1. Parenthesised disjunctions  ( l1 ∨ l2 ∨ ¬l3 )
  const re = /\(([^)]+?)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const body = m[1].trim();
    // Must contain at least one ∨ to be a clause (single literals are unit clauses)
    if (body.split(/[∨]/).length < 1) continue;
    const cleaned = body.replace(/\s+/g, ' ').trim();
    // Reject anything with conjunctions inside the parens (likely a sub-formula, not a clause)
    if (/[∧]/.test(cleaned)) continue;
    // Reject parens that look like function calls D(x) or REVISE(...)
    if (/[a-z]\($/i.test(text.slice(0, m.index + 1))) continue;
    clauses.push(cleaned);
    for (const lit of cleaned.split(/[∨]/)) {
      const cleanedLit = lit.replace(/[¬!\-\s]/g, '');
      if (/^[A-Za-z_]\w*$/.test(cleanedLit)) vars.add(cleanedLit);
    }
  }

  // 2. Named clauses C1 = ..., C2 = ... not in parens
  const namedRe = /\bC(\d+)\s*[:=]\s*([^.\n]{3,80})/gi;
  while ((m = namedRe.exec(text)) !== null) {
    const body = m[2].trim().replace(/^[\(\{]\s*|\s*[\)\}]$/g, '');
    if (/[∨∧¬!\-]/.test(body) || /\b(?:or|and|not)\b/i.test(body)) {
      const normal = normaliseLogicSyntax(body);
      if (!clauses.includes(normal)) clauses.push(normal);
      for (const lit of normal.split(/[∨]/)) {
        const cleanedLit = lit.replace(/[¬!\-\s]/g, '');
        if (/^[A-Za-z_]\w*$/.test(cleanedLit)) vars.add(cleanedLit);
      }
    }
  }

  // 3. Implications "x → y" → clause "(¬x ∨ y)"
  const implRe = /\b([A-Za-z_]\w*)\s*→\s*([A-Za-z_]\w*)/g;
  while ((m = implRe.exec(text)) !== null) {
    const cl = `¬${m[1]} ∨ ${m[2]}`;
    if (!clauses.includes(cl)) clauses.push(cl);
    vars.add(m[1]); vars.add(m[2]);
  }

  let conf = 0;
  if (clauses.length >= 1) conf += 50;
  if (clauses.length >= 3) conf += 30;
  if (vars.size >= 2) conf += 20;
  if (conf === 0) warnings.push('No CNF clauses detected. Provide them as (l1 ∨ l2) ∧ (l3 ∨ ¬l4) or as C1: l1 ∨ l2.');
  return { clauses, variables: [...vars], warnings, confidence: Math.min(100, conf) };
}

// Convert CNF clauses to DIMACS-ish text the SAT vizes accept
export function cnfToDpllSpec(cnf: ExtractedCNF): string {
  if (!cnf.clauses.length) return '';
  return cnf.clauses.map((c) => '(' + c + ')').join(' ∧ ');
}

// ────────────────────────────────────────────────────────────────────
//  Horn KB extractor (facts + rules + goal)
// ────────────────────────────────────────────────────────────────────

export interface ExtractedHorn {
  facts: string[];                 // atomic
  rules: { head: string; body: string[]; src: string }[];
  goal: string | null;
  warnings: string[];
  confidence: number;
}

export function extractHorn(rawText: string): ExtractedHorn {
  const text = normaliseLogicSyntax(normalise(rawText));
  const facts: string[] = [];
  const rules: { head: string; body: string[]; src: string }[] = [];
  const warnings: string[] = [];
  let goal: string | null = null;

  // Patterns:
  //   "fact: p"  or  bare line "p"
  //   "rule: p ∧ q → r"  or  "p ∧ q → r"
  //   "goal: r" or "prove r" or "query: r"
  const lines = text.split(/[\n;]/).map((l) => l.trim()).filter(Boolean);
  for (const raw of lines) {
    const line = raw.replace(/^\d+\.\s*/, '');
    if (/^goal\s*[:=]|^query\s*[:=]|^prove\s+/i.test(line)) {
      const m = line.match(/[:=]\s*([A-Za-z_]\w*)|prove\s+([A-Za-z_]\w*)/i);
      if (m) goal = m[1] || m[2];
      continue;
    }
    if (/^fact\s*[:=]/i.test(line)) {
      const m = line.match(/[:=]\s*(.+)$/);
      if (m) facts.push(m[1].trim());
      continue;
    }
    if (/^rule\s*[:=]/i.test(line)) {
      const m = line.match(/[:=]\s*(.+)$/);
      if (m) processRule(m[1].trim(), rules, facts);
      continue;
    }
    // Bare rule: "p ∧ q → r"  or  bare fact "p"
    if (/→/.test(line)) processRule(line, rules, facts);
    else if (/^[A-Za-z_]\w*\s*\.?$/.test(line)) facts.push(line.replace(/\.$/, ''));
  }

  const conf =
    (facts.length ? 30 : 0) +
    (rules.length ? 40 : 0) +
    (goal ? 30 : 0);
  if (conf === 0) warnings.push('No Horn KB detected. Provide facts as bare propositions and rules as "p ∧ q → r"; query as "goal: x".');
  return { facts, rules, goal, warnings, confidence: Math.min(100, conf) };
}

function processRule(src: string, rules: { head: string; body: string[]; src: string }[], facts: string[]) {
  const [lhsRaw, rhsRaw] = src.split('→').map((s) => s.trim());
  if (!lhsRaw || !rhsRaw) return;
  const head = rhsRaw.replace(/[.\s]+$/, '');
  if (!/^[A-Za-z_]\w*$/.test(head)) return;  // Horn rules have atomic head
  const body = lhsRaw.split(/[∧,]/).map((s) => s.replace(/^¬/, '').trim()).filter(Boolean);
  if (body.length === 0) facts.push(head);
  else rules.push({ head, body, src });
}

export function hornToSpec(h: ExtractedHorn): string {
  const out: string[] = [];
  if (h.facts.length) {
    out.push('# Facts');
    for (const f of h.facts) out.push(f + '.');
  }
  if (h.rules.length) {
    out.push('# Rules');
    for (const r of h.rules) out.push(r.body.join(' ∧ ') + ' → ' + r.head);
  }
  if (h.goal) out.push('# Query', 'goal: ' + h.goal);
  return out.join('\n');
}

// ────────────────────────────────────────────────────────────────────
//  Resolution problem extractor (KB + α)
// ────────────────────────────────────────────────────────────────────

export interface ExtractedResolution {
  kbClauses: string[];
  query: string | null;       // α as a literal/formula
  warnings: string[];
  confidence: number;
}

export function extractResolutionProblem(rawText: string): ExtractedResolution {
  const text = normaliseLogicSyntax(normalise(rawText));
  // Look for "KB = { ... }" or "KB: ..."
  const kbClauses: string[] = [];
  const warnings: string[] = [];
  const kbBlock = text.match(/\bKB\s*[=:]\s*\{([^}]+)\}/);
  if (kbBlock) {
    const inner = kbBlock[1];
    // Split by comma but only outside parens
    let depth = 0; let acc = ''; const parts: string[] = [];
    for (const ch of inner) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(acc.trim()); acc = ''; }
      else acc += ch;
    }
    if (acc.trim()) parts.push(acc.trim());
    for (const p of parts) {
      const cleaned = p.replace(/^\(|\)$/g, '').trim();
      if (cleaned) kbClauses.push(cleaned);
    }
  }
  // Also accept the simple CNF extractor's clauses
  if (kbClauses.length === 0) {
    const cnf = extractCNF(rawText);
    for (const c of cnf.clauses) kbClauses.push(c);
  }
  // Query α
  let query: string | null = null;
  const qm = text.match(/\b(?:α|alpha|query|prove|show)\s*[:=]?\s*([¬!\-]?\s*[A-Za-z_]\w*(?:\s*[∨∧]\s*[¬!\-]?[A-Za-z_]\w*)*)/i);
  if (qm) query = normaliseLogicSyntax(qm[1].trim());

  let conf = 0;
  if (kbClauses.length >= 1) conf += 50;
  if (query) conf += 40;
  if (kbClauses.length >= 3) conf += 10;
  if (conf === 0) warnings.push('No resolution problem detected. Try "KB = {(p ∨ q), (¬p ∨ r), (¬q ∨ r)}, α = r".');
  return { kbClauses, query, warnings, confidence: Math.min(100, conf) };
}

// ────────────────────────────────────────────────────────────────────
//  Game tree leaves (improved)
// ────────────────────────────────────────────────────────────────────

export interface ExtractedLeaves {
  leaves: number[];
  depth: number;
  branchingFactor: number;
  warnings: string[];
  confidence: number;
}

export function extractLeaves(rawText: string): ExtractedLeaves {
  const text = normalise(rawText);
  const warnings: string[] = [];
  let leaves: number[] = [];
  const patterns = [
    /\bleaf?\s*(?:values?)?\s*(?:are|:|=)\s*((?:-?\d+\s*[,\s]\s*)+-?\d+)/i,
    /\bleaves?(?:\s+left[-\s]to[-\s]right)?\s*[:=]?\s*((?:-?\d+\s*[,\s]\s*)+-?\d+)/i,
    /\butilit(?:y|ies)\s*(?:are|:|=)\s*((?:-?\d+\s*[,\s]\s*)+-?\d+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      leaves = m[1].split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
      if (leaves.length >= 2) break;
    }
  }
  // Branching + depth
  const bf = text.match(/\bbranching\s+factor\s*(?:of\s*)?(\d+)/i);
  const branchingFactor = bf ? parseInt(bf[1], 10) : 2;
  const d = text.match(/\bdepth\s+(\d+)/i);
  const depth = d ? parseInt(d[1], 10) : Math.round(Math.log2(Math.max(leaves.length, 2)));
  let conf = 0;
  if (leaves.length >= 4) conf += 60;
  if (branchingFactor >= 2 && Math.abs(leaves.length - Math.pow(branchingFactor, depth)) <= 1) conf += 30;
  if (leaves.length === 0) warnings.push('No leaf values detected. Provide them as "leaves: 4, 6, 1, 9, 2, 7, 8, 3".');
  return { leaves, depth, branchingFactor, warnings, confidence: Math.min(100, conf) };
}
