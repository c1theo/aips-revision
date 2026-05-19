<script lang="ts">
  // Simplified CDCL with implication graph, 1-UIP-ish learning, non-chronological backjump.

  let input = $state(`1 2 -3
-2 4
-3 -4 5
-1 -5
-1 6
-2 -6
3 5 -6`);
  let heuristic = $state<'first' | 'vsids'>('first');
  let vsidsScores = new Map<number, number>();

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
    vsidsScores = new Map();
    // initial scoring (DLIS-like)
    clauses.forEach((c) => c.forEach((l) => {
      const v = Math.abs(l);
      vsidsScores.set(v, (vsidsScores.get(v) ?? 0) + 1);
    }));

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
      const unassigned = [...allVars].filter((v) => !assignment.has(v));
      if (unassigned.length === 0) return undefined;
      if (heuristic === 'first') return unassigned[0];
      // VSIDS — pick highest-scored
      unassigned.sort((a, b) => (vsidsScores.get(b) ?? 0) - (vsidsScores.get(a) ?? 0));
      return unassigned[0];
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
        // VSIDS bump for each literal in learnt clause
        for (const lit of lc) {
          const v = Math.abs(lit);
          vsidsScores.set(v, (vsidsScores.get(v) ?? 0) + 1);
        }
        // periodic decay
        if (log.length % 8 === 0) for (const k of vsidsScores.keys()) vsidsScores.set(k, vsidsScores.get(k)! * 0.95);
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
  $effect(() => { input; heuristic; run(); });

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
    <label class="flex items-center gap-1 ml-3">Branching:
      <select bind:value={heuristic} class="px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option value="first">First unassigned</option>
        <option value="vsids">VSIDS</option>
      </select>
    </label>
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

      {#if steps[stepIdx].assignments.length > 0}
        {@const trail = steps[stepIdx].assignments}
        {@const levels = [...new Set(trail.map((a) => a.decisionLevel))].sort((a, b) => a - b)}
        {@const xByLevel = Object.fromEntries(levels.map((l, i) => [l, 80 + i * 130]))}
        {@const yByVar = Object.fromEntries(trail.map((a, i) => [a.var, 30 + (i % 6) * 40]))}
        {@const W = Math.max(500, 80 + (levels.length + 1) * 130)}
        {@const H = Math.max(220, 60 + Math.min(6, trail.length) * 40)}
        <div class="mt-4">
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Implication graph</div>
          <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
            <!-- level columns -->
            {#each levels as l}
              <line x1={xByLevel[l]} y1="10" x2={xByLevel[l]} y2={H - 10} stroke="#cbd5e1" stroke-dasharray="2 2" />
              <text x={xByLevel[l]} y="14" font-size="9" fill="#64748b" text-anchor="middle">L{l}</text>
            {/each}
            <!-- edges from antecedents -->
            {#each trail as a}
              {#if a.antecedent}
                {#each a.antecedent.filter((l: number) => Math.abs(l) !== a.var) as antLit}
                  {@const fromVar = Math.abs(antLit)}
                  {@const fromTrail = trail.find((t) => t.var === fromVar)}
                  {#if fromTrail}
                    <line x1={xByLevel[fromTrail.decisionLevel]} y1={yByVar[fromVar]} x2={xByLevel[a.decisionLevel]} y2={yByVar[a.var]} stroke="#64748b" stroke-width="1" marker-end="url(#arrow)" />
                  {/if}
                {/each}
              {/if}
            {/each}
            <!-- conflict edges -->
            {#if steps[stepIdx].conflict}
              {#each steps[stepIdx].conflict.clause.filter((l: number) => trail.find((t) => t.var === Math.abs(l))) as cLit}
                {@const v = Math.abs(cLit)}
                {@const fromTrail = trail.find((t) => t.var === v)}
                {#if fromTrail}
                  <line x1={xByLevel[fromTrail.decisionLevel]} y1={yByVar[v]} x2={W - 30} y2={H / 2} stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 2" />
                {/if}
              {/each}
              <circle cx={W - 30} cy={H / 2} r="14" fill="#fecaca" stroke="#dc2626" stroke-width="2" />
              <text x={W - 30} y={H / 2 + 4} font-size="10" font-weight="bold" text-anchor="middle" fill="#991b1b">⊥</text>
            {/if}
            <!-- nodes -->
            {#each trail as a}
              {@const isDecision = !a.antecedent}
              <circle cx={xByLevel[a.decisionLevel]} cy={yByVar[a.var]} r="14" fill={isDecision ? '#dbeafe' : '#f1f5f9'} stroke={isDecision ? '#1e40af' : '#475569'} stroke-width={isDecision ? 2 : 1} />
              <text x={xByLevel[a.decisionLevel]} y={yByVar[a.var] + 4} font-size="10" font-weight="bold" text-anchor="middle" fill="#0f172a">{a.val ? '' : '¬'}x{a.var}</text>
            {/each}
            <defs>
              <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" fill="#64748b" />
              </marker>
            </defs>
          </svg>
          <div class="text-xs text-ink-500 mt-1">
            Blue nodes = decisions (no incoming edges). Grey = propagated. Red ⊥ = conflict node.
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="text-xs text-ink-500">A simplified CDCL (no VSIDS, no two-watched literals, no restarts). The learning step uses 1-UIP-style resolution on the implication graph to derive an asserting learnt clause, then backjumps to the second-highest decision level.</div>
</div>
