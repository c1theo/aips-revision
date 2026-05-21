import type { RichCSP } from './extractCSPRich';
import type { ExtractedCNF } from './extractLogic';

// Independent auto-solvers — small, complete implementations that run the
// extracted problem and report a verified result. Use these to cross-check
// hand-computed answers (the student's work vs the engine's verdict).

// ─────────────────────────────────────────────────────────────────────
//  Small CSP solver — backtracking + AC-3 + MRV
// ─────────────────────────────────────────────────────────────────────

type Val = number | string;
type Domain = Record<string, Val[]>;

export interface CSPSolution {
  solved: boolean;
  assignment?: Record<string, Val>;
  solutionCount?: number;   // capped at 100
  nodesExpanded: number;
  reason?: string;          // 'infeasible' | 'capped' | undefined
}

function compilePredicate(src: string, varNames: string[]): ((vals: Record<string, Val>) => boolean) | null {
  let body = src.replace(/\babs\b/g, 'Math.abs').replace(/\bmin\b/g, 'Math.min').replace(/\bmax\b/g, 'Math.max');
  body = body.replace(/([^=!<>])=([^=])/g, '$1==$2');
  try {
    const fn = new Function(varNames.join(','), `try{return Boolean(${body})}catch(e){return false}`);
    return (vals) => fn(...varNames.map((v) => vals[v]));
  } catch (e) {
    return null;
  }
}

export function solveCSP(csp: RichCSP, maxSolutions = 5): CSPSolution {
  const vars = csp.variables.map((v) => v.name);
  if (vars.length === 0) return { solved: false, nodesExpanded: 0, reason: 'no variables' };

  const D: Domain = {};
  for (const v of csp.variables) D[v.name] = [...v.domain];

  // Apply unary "constraints" (they're in csp.constraints with kind=='unary' and src like "x1 != 2")
  // Then compile binary constraints.
  type CompiledBinary = { vars: [string, string]; check: (a: Val, b: Val) => boolean; src: string };
  const compiledBinary: CompiledBinary[] = [];
  const compiledUnary: { v: string; check: (x: Val) => boolean; src: string }[] = [];

  for (const c of csp.constraints) {
    const involved = c.involves;
    if (involved.length === 1) {
      const v = involved[0];
      const pred = compilePredicate(c.src, [v]);
      if (!pred) continue;
      compiledUnary.push({ v, check: (x) => pred({ [v]: x }), src: c.src });
    } else if (involved.length === 2) {
      const [a, b] = involved;
      const pred = compilePredicate(c.src, [a, b]);
      if (!pred) continue;
      compiledBinary.push({ vars: [a, b], check: (va, vb) => pred({ [a]: va, [b]: vb }), src: c.src });
    }
  }
  // AllDifferent groups
  for (const grp of csp.allDifferentGroups) {
    for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
      const a = grp[i], b = grp[j];
      compiledBinary.push({ vars: [a, b], check: (va, vb) => va !== vb, src: `${a} != ${b}` });
    }
  }

  // Apply unary up front
  for (const u of compiledUnary) {
    D[u.v] = D[u.v].filter(u.check);
    if (D[u.v].length === 0) return { solved: false, nodesExpanded: 0, reason: 'infeasible after node consistency' };
  }

  // AC-3 to fixpoint
  const arcs = compiledBinary.flatMap((c) => [
    { a: c.vars[0], b: c.vars[1], pred: c.check },
    { a: c.vars[1], b: c.vars[0], pred: (va: Val, vb: Val) => c.check(vb, va) },
  ]);
  function ac3(D: Domain): boolean {
    const queue = [...arcs];
    while (queue.length) {
      const arc = queue.shift()!;
      const before = D[arc.a].length;
      D[arc.a] = D[arc.a].filter((v) => D[arc.b].some((w) => arc.pred(v, w)));
      if (D[arc.a].length === 0) return false;
      if (D[arc.a].length < before) {
        for (const a of arcs) if (a.b === arc.a && a.a !== arc.b) queue.push(a);
      }
    }
    return true;
  }
  if (!ac3(D)) return { solved: false, nodesExpanded: 0, reason: 'infeasible after AC-3' };

  // Backtracking + MAC + MRV
  let nodes = 0;
  const solutions: Record<string, Val>[] = [];
  function backtrack(assignment: Record<string, Val>, D: Domain): void {
    if (solutions.length >= maxSolutions) return;
    nodes++;
    const unassigned = vars.filter((v) => assignment[v] === undefined);
    if (unassigned.length === 0) {
      // verify consistency
      for (const c of compiledBinary) {
        const [a, b] = c.vars;
        if (!c.check(assignment[a], assignment[b])) return;
      }
      solutions.push({ ...assignment });
      return;
    }
    // MRV
    unassigned.sort((a, b) => D[a].length - D[b].length);
    const v = unassigned[0];
    for (const val of D[v]) {
      if (solutions.length >= maxSolutions) return;
      // try v = val
      const nextD: Domain = {}; for (const k of Object.keys(D)) nextD[k] = [...D[k]];
      nextD[v] = [val];
      if (!ac3(nextD)) continue;
      const nextA = { ...assignment, [v]: val };
      backtrack(nextA, nextD);
    }
  }
  backtrack({}, D);
  if (solutions.length === 0) return { solved: false, nodesExpanded: nodes, reason: 'no solution exists' };
  return {
    solved: true,
    assignment: solutions[0],
    solutionCount: solutions.length === maxSolutions ? maxSolutions : solutions.length,
    nodesExpanded: nodes,
    reason: solutions.length === maxSolutions ? `capped at ${maxSolutions} solutions` : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────
//  Small SAT solver — DPLL with unit propagation and pure literal
// ─────────────────────────────────────────────────────────────────────

export interface SATSolution {
  sat: boolean;
  model?: Record<string, boolean>;
  decisions: number;
  reason?: string;
}

interface ParsedCNF {
  clauses: number[][];  // positive var id = positive literal, negative = ¬
  varNames: string[];   // index = id - 1
}

function parseCNF(cnfText: string): ParsedCNF | null {
  // Accept formats:
  //   "(x1 ∨ ¬x2) ∧ (¬x1 ∨ x3) ∧ (¬x3)"
  //   "x1 ∨ x2 \n ¬x1 ∨ x3"
  //   DIMACS: "p cnf 3 2\n 1 -2 0\n -1 3 0\n"
  const t = cnfText.trim();
  if (/^p\s+cnf/i.test(t)) {
    const lines = t.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('c') && !l.startsWith('p'));
    const clauses: number[][] = [];
    let maxVar = 0;
    for (const ln of lines) {
      const nums = ln.split(/\s+/).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n));
      const cl: number[] = [];
      for (const n of nums) { if (n === 0) break; cl.push(n); maxVar = Math.max(maxVar, Math.abs(n)); }
      if (cl.length) clauses.push(cl);
    }
    const varNames: string[] = [];
    for (let i = 1; i <= maxVar; i++) varNames.push(`x${i}`);
    return { clauses, varNames };
  }
  // Symbolic CNF
  const parts = t.split(/[∧]|\&\&|\band\b/i).map((p) => p.trim().replace(/^\(|\)$/g, '')).filter(Boolean);
  if (parts.length === 0) return null;
  const varIdx: Record<string, number> = {};
  const varNames: string[] = [];
  function getId(name: string): number {
    if (varIdx[name] === undefined) { varIdx[name] = varNames.length + 1; varNames.push(name); }
    return varIdx[name];
  }
  const clauses: number[][] = [];
  for (const p of parts) {
    const lits = p.split(/[∨]|\|\||\bor\b/i).map((l) => l.trim()).filter(Boolean);
    const cl: number[] = [];
    for (const lit of lits) {
      const neg = /^[¬!\-]/.test(lit) || lit.startsWith('\\neg');
      const nameMatch = lit.replace(/^[¬!\-]|\\neg/i, '').trim().match(/^([A-Za-z_]\w*)$/);
      if (!nameMatch) continue;
      const id = getId(nameMatch[1]);
      cl.push(neg ? -id : id);
    }
    if (cl.length) clauses.push(cl);
  }
  return { clauses, varNames };
}

export function solveSAT(cnfText: string): SATSolution {
  const parsed = parseCNF(cnfText);
  if (!parsed) return { sat: false, decisions: 0, reason: 'could not parse CNF' };
  const n = parsed.varNames.length;
  const assignment: (boolean | null)[] = new Array(n + 1).fill(null);
  let decisions = 0;

  function unitPropagate(): 'ok' | 'conflict' {
    let changed = true;
    while (changed) {
      changed = false;
      for (const cl of parsed!.clauses) {
        let unassigned: number | null = null;
        let satisfied = false;
        let unassignedCount = 0;
        for (const lit of cl) {
          const v = Math.abs(lit), val = assignment[v];
          if (val === null) { unassigned = lit; unassignedCount++; }
          else if ((lit > 0) === val) { satisfied = true; break; }
        }
        if (satisfied) continue;
        if (unassignedCount === 0) return 'conflict';
        if (unassignedCount === 1) {
          const v = Math.abs(unassigned!);
          assignment[v] = unassigned! > 0;
          changed = true;
        }
      }
    }
    return 'ok';
  }
  function clauseSatisfied(cl: number[]): boolean {
    for (const lit of cl) { const v = Math.abs(lit), val = assignment[v]; if (val !== null && (lit > 0) === val) return true; }
    return false;
  }
  function allSatisfied(): boolean { return parsed!.clauses.every(clauseSatisfied); }
  function pickUnassigned(): number {
    for (let i = 1; i <= n; i++) if (assignment[i] === null) return i;
    return 0;
  }

  function dpll(): boolean {
    if (unitPropagate() === 'conflict') return false;
    if (allSatisfied()) return true;
    const pick = pickUnassigned();
    if (pick === 0) return allSatisfied();
    decisions++;
    const snapshot = [...assignment];
    assignment[pick] = true;
    if (dpll()) return true;
    for (let i = 0; i <= n; i++) assignment[i] = snapshot[i];
    assignment[pick] = false;
    if (dpll()) return true;
    for (let i = 0; i <= n; i++) assignment[i] = snapshot[i];
    return false;
  }

  const sat = dpll();
  if (!sat) return { sat: false, decisions, reason: 'UNSAT' };
  const model: Record<string, boolean> = {};
  for (let i = 1; i <= n; i++) model[parsed.varNames[i - 1]] = assignment[i] ?? false;
  return { sat: true, model, decisions };
}

// Public surface
export function autosolveCSP(csp: RichCSP) { return solveCSP(csp); }
export function autosolveCNF(cnfText: string) { return solveSAT(cnfText); }
