<script lang="ts">
  // DPLL with unit propagation, pure literal, splitting.
  // Input: CNF as clauses of literals (positive int = variable, negative = negation).

  let input = $state(`1 2 3
-1 2
-2 3
-3 1
-1 -2 -3`);

  interface Step {
    n: number;
    msg: string;
    assignment: Record<number, boolean>;
    activeClauses: number[][]; // remaining unsatisfied clauses (with falsified literals removed)
    decision?: number; // literal decided
    upLit?: number; // literal forced by unit propagation
    pureLit?: number;
  }
  let steps = $state<Step[]>([]);
  let result = $state<string>('');
  let stepIdx = $state(0);

  function parse(s: string): number[][] {
    const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => l.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n) && n !== 0));
  }

  function simplify(clauses: number[][], assignment: Record<number, boolean>): number[][] | null {
    const out: number[][] = [];
    for (const c of clauses) {
      const newC: number[] = [];
      let satisfied = false;
      for (const lit of c) {
        const v = Math.abs(lit);
        if (assignment[v] === undefined) newC.push(lit);
        else if ((lit > 0) === assignment[v]) { satisfied = true; break; }
      }
      if (satisfied) continue;
      if (newC.length === 0) return null; // empty clause
      out.push(newC);
    }
    return out;
  }

  function dpll(clauses: number[][], assignment: Record<number, boolean>, depth: number, log: Step[]): boolean {
    let cur = simplify(clauses, assignment);
    if (cur === null) {
      log.push({ n: log.length, msg: `Empty clause derived — backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
      return false;
    }

    // unit propagate
    let progressed = true;
    while (progressed && cur && cur.length > 0) {
      progressed = false;
      const unit = cur.find((c) => c.length === 1);
      if (unit) {
        const lit = unit[0];
        const v = Math.abs(lit);
        assignment[v] = lit > 0;
        log.push({ n: log.length, msg: `Unit propagate: ${lit > 0 ? '' : '¬'}x${v} forced.`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), upLit: lit });
        cur = simplify(clauses, assignment);
        if (cur === null) {
          log.push({ n: log.length, msg: `Conflict after unit propagation — backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
          return false;
        }
        progressed = true;
      }
    }

    // pure literal
    if (cur && cur.length > 0) {
      const positivity: Record<number, Set<number>> = {};
      for (const c of cur) for (const lit of c) {
        const v = Math.abs(lit);
        (positivity[v] ??= new Set()).add(Math.sign(lit));
      }
      for (const [vStr, signs] of Object.entries(positivity)) {
        const v = Number(vStr);
        if (signs.size === 1 && assignment[v] === undefined) {
          const lit = v * [...signs][0];
          assignment[v] = lit > 0;
          log.push({ n: log.length, msg: `Pure literal: ${lit > 0 ? '' : '¬'}x${v}.`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), pureLit: lit });
          cur = simplify(clauses, assignment);
          if (cur === null) {
            log.push({ n: log.length, msg: `Conflict after pure literal — backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
            return false;
          }
        }
      }
    }

    if (cur && cur.length === 0) {
      log.push({ n: log.length, msg: `All clauses satisfied — SAT.`, assignment: { ...assignment }, activeClauses: [] });
      return true;
    }

    // decide
    let v = -1;
    for (const c of cur!) {
      for (const lit of c) {
        if (assignment[Math.abs(lit)] === undefined) { v = Math.abs(lit); break; }
      }
      if (v !== -1) break;
    }
    if (v === -1) {
      log.push({ n: log.length, msg: `All vars assigned but clauses remain — SAT vacuously.`, assignment: { ...assignment }, activeClauses: [] });
      return true;
    }
    log.push({ n: log.length, msg: `Decide x${v} = true (depth ${depth}).`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), decision: v });
    const a1 = { ...assignment, [v]: true };
    if (dpll(clauses, a1, depth + 1, log)) {
      Object.assign(assignment, a1); return true;
    }
    log.push({ n: log.length, msg: `Try x${v} = false (depth ${depth}).`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), decision: -v });
    const a2 = { ...assignment, [v]: false };
    if (dpll(clauses, a2, depth + 1, log)) { Object.assign(assignment, a2); return true; }
    return false;
  }

  function run() {
    const clauses = parse(input);
    const log: Step[] = [];
    const ass: Record<number, boolean> = {};
    const ok = dpll(clauses, ass, 0, log);
    steps = log; stepIdx = 0;
    result = ok ? `SAT — model: ${Object.entries(ass).map(([k, v]) => `x${k}=${v ? 'T' : 'F'}`).join(', ')}` : 'UNSAT';
  }
  $effect(() => { input; run(); });

  function fmtClause(c: number[]) { return '(' + c.map((l) => (l < 0 ? '¬' : '') + 'x' + Math.abs(l)).join(' ∨ ') + ')'; }
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CNF — one clause per line; integers are variables, negative for negation</span>
    <textarea class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={input}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    Examples:
    <button class="btn btn-sm" onclick={() => (input = '1 2 3\n-1 2\n-2 3\n-3 1\n-1 -2 -3')}>SAT (5 clauses)</button>
    <button class="btn btn-sm" onclick={() => (input = '1 2\n-1 2\n1 -2\n-1 -2')}>UNSAT</button>
    <button class="btn btn-sm" onclick={() => (input = '1 -2 3\n-1 2\n2 -3\n-2 3\n-1 -3')}>Random</button>
  </div>

  <div class="font-medium text-sm">{result}</div>

  <div class="flex gap-2">
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))}>⏮</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.min(steps.length - 1, stepIdx + 1))}>⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{steps.length}</span>
  </div>

  {#if steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium">{steps[stepIdx].msg}</div>
      <div class="grid sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Assignment</div>
          {#each Object.entries(steps[stepIdx].assignment) as [k, v]}
            <span class="inline-block mr-2">x{k}={v ? 'T' : 'F'}</span>
          {/each}
          {#if Object.keys(steps[stepIdx].assignment).length === 0}<span class="text-ink-500 italic">empty</span>{/if}
        </div>
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Remaining clauses</div>
          {#each steps[stepIdx].activeClauses as c}
            <div>{fmtClause(c)}</div>
          {/each}
          {#if steps[stepIdx].activeClauses.length === 0}<span class="text-ink-500 italic">none — SAT</span>{/if}
        </div>
      </div>
    </div>
  {/if}
</div>
