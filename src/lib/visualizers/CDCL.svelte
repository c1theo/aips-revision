<script lang="ts">
  // Simplified CDCL with implication graph, 1-UIP-ish learning, non-chronological backjump.

  let input = $state(`1 2 -3
-2 4
-3 -4 5
-1 -5
-1 6
-2 -6
3 5 -6`);

  interface AssignedLit {
    var: number;
    val: boolean;
    decisionLevel: number;
    antecedent?: number[]; // clause that caused unit propagation
  }
  interface Step {
    msg: string;
    assignments: AssignedLit[];
    decisionLevel: number;
    learnt: number[][];
    conflict?: { clause: number[]; antecedents: number[][] };
    backjumpTo?: number;
  }

  let steps = $state<Step[]>([]);
  let result = $state('');
  let stepIdx = $state(0);

  function parse(s: string): number[][] {
    return s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n) && n !== 0));
  }

  function evalLit(lit: number, assignment: Map<number, boolean>): boolean | null {
    const v = Math.abs(lit);
    if (!assignment.has(v)) return null;
    return assignment.get(v) === (lit > 0);
  }

  function clauseStatus(c: number[], assignment: Map<number, boolean>): 'sat' | 'unsat' | 'unit' | 'open' {
    let unassigned: number[] = [];
    for (const lit of c) {
      const v = evalLit(lit, assignment);
      if (v === true) return 'sat';
      if (v === null) unassigned.push(lit);
    }
    if (unassigned.length === 0) return 'unsat';
    if (unassigned.length === 1) return 'unit';
    return 'open';
  }

  function run() {
    const clauses = parse(input);
    const learnt: number[][] = [];
    const log: Step[] = [];
    const assignment = new Map<number, boolean>();
    const trail: AssignedLit[] = [];
    let decisionLevel = 0;
    const allVars = new Set<number>();
    clauses.forEach((c) => c.forEach((l) => allVars.add(Math.abs(l))));

    function snapshot(msg: string, conflict?: Step['conflict'], backjumpTo?: number) {
      log.push({
        msg,
        assignments: trail.map((a) => ({ ...a })),
        decisionLevel,
        learnt: learnt.map((c) => [...c]),
        conflict,
        backjumpTo,
      });
    }

    function allClauses() { return [...clauses, ...learnt]; }

    function propagate(): { conflict?: { clause: number[]; antecedents: number[][] } } {
      let progressed = true;
      while (progressed) {
        progressed = false;
        for (const c of allClauses()) {
          const st = clauseStatus(c, assignment);
          if (st === 'unsat') {
            // conflict
            return { conflict: { clause: c, antecedents: c.map((l) => {
              const v = Math.abs(l);
              const t = trail.find((a) => a.var === v);
              return t?.antecedent ?? [];
            }) } };
          }
          if (st === 'unit') {
            const lit = c.find((l) => evalLit(l, assignment) === null)!;
            const v = Math.abs(lit);
            assignment.set(v, lit > 0);
            trail.push({ var: v, val: lit > 0, decisionLevel, antecedent: c });
            snapshot(`Unit propagate ${lit > 0 ? '' : '¬'}x${v} (level ${decisionLevel}, antecedent ${fmtClause(c)}).`);
            progressed = true;
          }
        }
      }
      return {};
    }

    function pickVar(): number | undefined {
      for (const v of allVars) if (!assignment.has(v)) return v;
      return undefined;
    }

    function analyze(conflict: number[]): { learnt: number[]; backjumpLevel: number } {
      // Walk trail backwards, resolving until exactly one literal from current level remains (1-UIP simplification).
      let cl = [...conflict];
      const currentLevelLits = () => cl.filter((l) => trail.find((a) => a.var === Math.abs(l))?.decisionLevel === decisionLevel);
      while (currentLevelLits().length > 1) {
        // Find latest assigned literal in cl
        let latestIdx = -1;
        let latestLit = 0;
        for (let i = trail.length - 1; i >= 0; i--) {
          const t = trail[i];
          if (cl.some((l) => Math.abs(l) === t.var)) {
            // is it a propagated one (has antecedent)?
            if (t.antecedent && t.decisionLevel === decisionLevel) {
              latestIdx = i; latestLit = t.var; break;
            }
          }
        }
        if (latestIdx === -1) break;
        const t = trail[latestIdx];
        const ant = t.antecedent!;
        // Resolve cl with ant on variable t.var
        const next: number[] = [];
        for (const l of cl) if (Math.abs(l) !== t.var) next.push(l);
        for (const l of ant) if (Math.abs(l) !== t.var && !next.includes(l)) next.push(l);
        cl = next;
      }
      // Determine backjump level = second-highest level in cl (or 0 if only one literal)
      const levels = cl.map((l) => trail.find((a) => a.var === Math.abs(l))?.decisionLevel ?? 0);
      const sorted = [...new Set(levels)].sort((a, b) => b - a);
      const backjumpLevel = sorted.length > 1 ? sorted[1] : 0;
      return { learnt: cl, backjumpLevel };
    }

    let safety = 0;
    while (safety++ < 500) {
      const { conflict } = propagate();
      if (conflict) {
        if (decisionLevel === 0) {
          snapshot(`Conflict at level 0 — UNSAT.`, conflict);
          result = 'UNSAT';
          steps = log; return;
        }
        const { learnt: lc, backjumpLevel } = analyze(conflict.clause);
        snapshot(`Conflict! Learn clause ${fmtClause(lc)}; backjump from level ${decisionLevel} to ${backjumpLevel}.`, conflict, backjumpLevel);
        learnt.push(lc);
        // undo trail to backjumpLevel
        while (trail.length > 0 && trail[trail.length - 1].decisionLevel > backjumpLevel) {
          const t = trail.pop()!;
          assignment.delete(t.var);
        }
        decisionLevel = backjumpLevel;
        continue;
      }
      if (assignment.size === allVars.size) {
        snapshot(`All vars assigned — SAT.`);
        result = 'SAT — ' + [...assignment.entries()].map(([v, b]) => `x${v}=${b ? 'T' : 'F'}`).join(', ');
        steps = log; return;
      }
      const v = pickVar();
      if (v === undefined) break;
      decisionLevel += 1;
      assignment.set(v, true);
      trail.push({ var: v, val: true, decisionLevel });
      snapshot(`Decide x${v} = true (level ${decisionLevel}).`);
    }

    result = 'iteration limit';
    steps = log;
  }
  $effect(() => { input; run(); });

  function fmtClause(c: number[]) {
    if (c.length === 0) return '□';
    return '(' + c.map((l) => (l < 0 ? '¬' : '') + 'x' + Math.abs(l)).join(' ∨ ') + ')';
  }
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CNF — one clause per line; integers are variables, negative for negation</span>
    <textarea class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="8" bind:value={input}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    Examples:
    <button class="btn btn-sm" onclick={() => (input = '1 2 -3\n-2 4\n-3 -4 5\n-1 -5\n-1 6\n-2 -6\n3 5 -6')}>Example (forces learning)</button>
    <button class="btn btn-sm" onclick={() => (input = '1 2\n-1 2\n1 -2\n-1 -2')}>UNSAT</button>
    <button class="btn btn-sm" onclick={() => (input = '1 -2 3\n-1 2\n2 -3')}>SAT (simple)</button>
  </div>

  <div class="text-sm font-medium">{result}</div>

  <div class="flex gap-2">
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))}>⏮</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.min(steps.length - 1, stepIdx + 1))}>⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{steps.length}</span>
  </div>

  {#if steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium {steps[stepIdx].conflict ? 'text-rose-600' : ''}">{steps[stepIdx].msg}</div>
      <div class="grid sm:grid-cols-2 gap-4 mt-3">
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Decision trail (level)</div>
          <div class="font-mono text-xs space-y-0.5">
            {#each steps[stepIdx].assignments as a}
              <div class="flex gap-2">
                <span class="text-ink-500 w-8">L{a.decisionLevel}</span>
                <span class="w-12">{a.val ? '' : '¬'}x{a.var}</span>
                <span class="text-ink-500">{a.antecedent ? 'prop ' + fmtClause(a.antecedent) : 'decided'}</span>
              </div>
            {/each}
          </div>
        </div>
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Learnt clauses ({steps[stepIdx].learnt.length})</div>
          <div class="font-mono text-xs">
            {#each steps[stepIdx].learnt as c, i}
              <div>{i + 1}. {fmtClause(c)}</div>
            {/each}
            {#if steps[stepIdx].learnt.length === 0}<span class="text-ink-500 italic">none yet</span>{/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="text-xs text-ink-500">A simplified CDCL (no VSIDS, no two-watched literals, no restarts). The learning step uses 1-UIP-style resolution on the implication graph to derive an asserting learnt clause, then backjumps to the second-highest decision level.</div>
</div>
