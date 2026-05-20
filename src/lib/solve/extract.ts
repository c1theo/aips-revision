import { normalise } from './score';

// Structured extraction: parse a question text into a CSP / SAT / game spec
// using regex + small grammar fragments. No generative AI.

export interface ExtractedCSP {
  variables: { name: string; domain: (string | number)[] }[];
  unary: { src: string; var: string }[];                       // `s1 != 2`, `s3 > 1`
  binary: { src: string; vars: [string, string] }[];           // `s1 < s2`
  allDifferent?: { vars: string[] };
  warnings: string[];
  confidence: number; // 0..100 — how cleanly we extracted
}

// ────────────────────────────────────────────────────────────────────
//  Domain notation
// ────────────────────────────────────────────────────────────────────

function parseDomainExpr(expr: string): (string | number)[] {
  const e = expr.trim();
  // Range `1..4` or `1-4`
  const rangeMatch = e.match(/^(-?\d+)\s*(?:\.\.|–|-)\s*(-?\d+)$/);
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10), hi = parseInt(rangeMatch[2], 10);
    if (lo <= hi && hi - lo < 1000) {
      const out: number[] = [];
      for (let i = lo; i <= hi; i++) out.push(i);
      return out;
    }
  }
  // Set `1, 2, 3` or `R, G, B`
  return e.split(/[,;\s]+/).filter(Boolean).map((tok) => {
    const n = Number(tok);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : tok;
  });
}

// ────────────────────────────────────────────────────────────────────
//  CSP extractor
// ────────────────────────────────────────────────────────────────────

export function extractCSP(rawText: string): ExtractedCSP {
  const text = normalise(rawText);
  const variables: { name: string; domain: (string | number)[] }[] = [];
  const seenVar = new Set<string>();
  const unary: { src: string; var: string }[] = [];
  const binary: { src: string; vars: [string, string] }[] = [];
  const warnings: string[] = [];
  let allDifferent: { vars: string[] } | undefined;

  // 1. Direct domain declarations:
  //    D(x) = {1,2,3}    or    x ∈ {1,2,3}    or    x = {1,2,3}
  const directDomain = /\b(?:D\s*\(\s*([A-Za-z_]\w*)\s*\)|([A-Za-z_]\w*)\s*(?:∈|in)\s*|([A-Za-z_]\w*)\s*=)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = directDomain.exec(text)) !== null) {
    const name = m[1] ?? m[2] ?? m[3];
    if (!name || seenVar.has(name)) continue;
    const dom = parseDomainExpr(m[4]);
    if (dom.length === 0) continue;
    variables.push({ name, domain: dom });
    seenVar.add(name);
  }

  // 2. "x ∈ {1..N}" range-style
  const rangeDomain = /\b([A-Za-z_]\w*)\s*(?:∈|in)\s*\{?\s*(-?\d+)\s*(?:\.\.|–|-)\s*(-?\d+)\s*\}?/g;
  while ((m = rangeDomain.exec(text)) !== null) {
    const name = m[1];
    if (seenVar.has(name)) continue;
    const dom = parseDomainExpr(`${m[2]}..${m[3]}`);
    if (dom.length === 0) continue;
    variables.push({ name, domain: dom });
    seenVar.add(name);
  }

  // 3. "the start time variables have domain {1..4}" — phrasing with collected vars
  //    Pre-extract "variables s1, s2, s3 have domain {1..4}"
  const groupDomain = /(?:variables?|tasks?)\s+((?:[A-Za-z_]\w*\s*(?:,\s*|\s+and\s+|\s+))+?[A-Za-z_]\w*)\s+(?:have|with)?\s*domains?\s+\{?\s*([^.}]+)\}?/gi;
  while ((m = groupDomain.exec(text)) !== null) {
    const names = m[1].split(/[,\s]+|and/i).map((s) => s.trim()).filter((s) => /^[A-Za-z_]\w*$/.test(s));
    const dom = parseDomainExpr(m[2].replace(/[}.]/g, '').trim());
    if (dom.length === 0) continue;
    for (const n of names) {
      if (seenVar.has(n)) continue;
      variables.push({ name: n, domain: dom });
      seenVar.add(n);
    }
  }

  // 4. Inequality / equality constraints
  //    a < b, a > b, a <= b, a != b, a = b   between variables
  const binaryC = /\b([A-Za-z_]\w*)\s*(<=|>=|!=|<|>|=)\s*([A-Za-z_]\w*)\b/g;
  while ((m = binaryC.exec(text)) !== null) {
    const a = m[1], op = m[2], b = m[3];
    if (a === b) continue;
    if (!seenVar.has(a) || !seenVar.has(b)) continue;
    const normalOp = op === '=' ? '=' : op;
    binary.push({ src: `${a} ${normalOp} ${b}`, vars: [a, b] });
  }

  // 5. Unary constraints: a < n, a != n, a > n, a <= n, a >= n
  const unaryC = /\b([A-Za-z_]\w*)\s*(<=|>=|!=|<|>|=)\s*(-?\d+)\b/g;
  while ((m = unaryC.exec(text)) !== null) {
    const a = m[1], op = m[2], n = m[3];
    if (!seenVar.has(a)) continue;
    unary.push({ src: `${a} ${op} ${n}`, var: a });
  }

  // 6. AllDifferent / pairwise distinct
  const ad = /\b(?:AllDifferent|pairwise\s+(?:distinct|different)|all\s+different)\s*\(?\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*\)?/i;
  const adMatch = text.match(ad);
  if (adMatch) {
    const vars = adMatch[1].split(/\s*,\s*/).filter((v) => seenVar.has(v));
    if (vars.length >= 2) allDifferent = { vars };
  }

  // Confidence heuristic
  let conf = 0;
  if (variables.length >= 2) conf += 40;
  if (variables.length >= 3) conf += 10;
  if (unary.length + binary.length >= 1) conf += 30;
  if (unary.length + binary.length >= 3) conf += 10;
  if (allDifferent) conf += 10;
  conf = Math.min(100, conf);

  if (variables.length === 0) warnings.push('No variables with explicit domains detected.');
  if (binary.length + unary.length === 0 && !allDifferent) warnings.push('No constraints detected — they may be phrased in natural language and need manual entry.');

  return { variables, unary, binary, allDifferent, warnings, confidence: conf };
}

// ────────────────────────────────────────────────────────────────────
//  Convert extracted CSP to CSPLab spec
// ────────────────────────────────────────────────────────────────────

export function cspToLabSpec(csp: ExtractedCSP): string {
  const lines: string[] = [];
  for (const v of csp.variables) lines.push(`${v.name} = ${v.domain.join(', ')}`);

  if (csp.unary.length) {
    lines.push('unary:');
    for (const u of csp.unary) lines.push(u.src);
  }

  const binBlock: string[] = [];
  for (const b of csp.binary) binBlock.push(b.src);
  if (csp.allDifferent) {
    const vs = csp.allDifferent.vars;
    for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) {
      binBlock.push(`${vs[i]}-${vs[j]}`);
    }
  }
  if (binBlock.length) {
    lines.push('binary:');
    for (const b of binBlock) lines.push(b);
  }
  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────
//  SAT / CNF extractor
// ────────────────────────────────────────────────────────────────────

export interface ExtractedCNF {
  clauses: string[];            // raw clause strings
  varCount: number;
  warnings: string[];
  confidence: number;
}

export function extractCNF(rawText: string): ExtractedCNF {
  const text = normalise(rawText);
  const clauses: string[] = [];
  const vars = new Set<string>();

  // Look for clauses like (¬x1 ∨ x2 ∨ ¬x3) or (-x1 ∨ x2)
  const clauseRe = /\(([^)]+(?:∨|or|\|\||v)[^)]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = clauseRe.exec(text)) !== null) {
    const c = m[1].replace(/\s+/g, ' ').trim();
    clauses.push(c);
    const lits = c.split(/∨|\bor\b|\|\||v/i);
    for (const l of lits) {
      const cleaned = l.replace(/[¬!\-\\neg\s]/g, '');
      if (/^[A-Za-z_]\w*$/.test(cleaned)) vars.add(cleaned);
    }
  }

  let conf = 0;
  if (clauses.length >= 1) conf += 60;
  if (clauses.length >= 3) conf += 25;
  if (vars.size >= 2) conf += 15;
  conf = Math.min(100, conf);

  const warnings: string[] = [];
  if (clauses.length === 0) warnings.push('No clauses detected in (literal ∨ literal ∨ ...) form.');

  return { clauses, varCount: vars.size, warnings, confidence: conf };
}

// ────────────────────────────────────────────────────────────────────
//  Game tree leaves extractor (for MinimaxTree)
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
  // Look for "leaves: 4, 6, 1, 9, 2, 7, 8, 3" or "leaf values 4, 6, ..."
  const m1 = text.match(/\bleaves?(?:\s+(?:are|=|:|values))?\s*[:=]?\s*((?:-?\d+\s*[,\s]\s*)+-?\d+)/i);
  if (m1) {
    leaves = m1[1].split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
  }
  // Branching factor: "branching factor 2"
  const bf = text.match(/\bbranching\s+factor\s*(?:of\s*)?(\d+)/i);
  const branchingFactor = bf ? parseInt(bf[1], 10) : 2;
  // Depth: "depth 3"
  const d = text.match(/\bdepth\s+(\d+)/i);
  const depth = d ? parseInt(d[1], 10) : Math.round(Math.log2(Math.max(leaves.length, 2)));

  let conf = 0;
  if (leaves.length >= 4) conf += 60;
  if (leaves.length === Math.pow(branchingFactor, depth)) conf += 30;
  conf = Math.min(100, conf);

  if (leaves.length === 0) warnings.push('No leaf values detected in the question text.');

  return { leaves, depth, branchingFactor, warnings, confidence: conf };
}
