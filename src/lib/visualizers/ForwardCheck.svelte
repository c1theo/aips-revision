<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Generic Forward-Checking + backtracking with d-way branching.
  // User specifies variables, domains, and constraints as algebraic predicates.

  let varSpec = $state(`x1 = 2, 4, 7
x2 = 1, 2, 5, 7
x3 = 2, 3, 7`);

  let constraintSpec = $state(`abs(x1 - x2) >= 3
abs(x1 - x3) >= 3
abs(x2 - x3) >= 3`);

  let valueOrdering = $state<'increasing' | 'decreasing'>('increasing');
  let varOrderingMode = $state<'top-to-bottom' | 'mrv' | 'custom'>('top-to-bottom');
  let customVarOrder = $state('');

  type Domain = Record<string, number[]>;
  type Assignment = Record<string, number>;

  interface Step {
    msg: string;
    assignment: Assignment;
    domains: Domain;
    decisionVar?: string;
    triedVal?: number;
    outcome?: 'ok' | 'fail' | 'solution';
    fcRemovals?: { var: string; removed: number[] }[];
  }

  function parseDomains(spec: string): { vars: string[]; D: Domain } {
    const vars: string[] = [];
    const D: Domain = {};
    for (const line of spec.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const m = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (!m) continue;
      vars.push(m[1]);
      D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean).map(Number).filter((v) => !Number.isNaN(v));
    }
    return { vars, D };
  }

  function parseConstraints(spec: string): { src: string; vars: string[]; fn: (a: Assignment) => boolean | null }[] {
    const lines = spec.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((src) => {
      const usedVars = [...new Set(src.match(/\b[a-zA-Z_]\w*\b/g) ?? [])].filter((w) => !['abs', 'min', 'max', 'true', 'false', 'and', 'or', 'not'].includes(w));
      // Try to compile a JS function
      try {
        // Substitute Math equivalents
        const body = src.replace(/abs/g, 'Math.abs').replace(/min/g, 'Math.min').replace(/max/g, 'Math.max');
        const argList = usedVars.join(', ');
        const fn = new Function(...usedVars, `try { return Boolean(${body}); } catch (e) { return null; }`);
        return {
          src, vars: usedVars,
          fn: (a: Assignment) => {
            const args = usedVars.map((v) => a[v]);
            if (args.some((x) => x === undefined)) return null;
            return fn(...args);
          },
        };
      } catch (e) {
        return { src, vars: usedVars, fn: () => null };
      }
    });
  }

  function pickVariable(unassigned: string[], D: Domain): string {
    if (varOrderingMode === 'mrv') {
      return [...unassigned].sort((a, b) => D[a].length - D[b].length)[0];
    }
    if (varOrderingMode === 'custom') {
      const order = customVarOrder.split(/[,\s]+/).filter(Boolean);
      for (const v of order) if (unassigned.includes(v)) return v;
    }
    return unassigned[0];
  }

  function runFC() {
    const { vars, D: D0 } = parseDomains(varSpec);
    const constraints = parseConstraints(constraintSpec);
    const steps: Step[] = [];

    const D = JSON.parse(JSON.stringify(D0));
    const assignment: Assignment = {};

    steps.push({ msg: `Start. Variable ordering: ${varOrderingMode}. Value ordering: ${valueOrdering}.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)) });

    function forwardCheck(): { ok: boolean; removals: { var: string; removed: number[] }[] } {
      // For each unassigned variable, prune values inconsistent with current assignment
      const removals: { var: string; removed: number[] }[] = [];
      for (const v of vars) {
        if (assignment[v] !== undefined) continue;
        const before = [...D[v]];
        D[v] = D[v].filter((candidate: number) => {
          const test = { ...assignment, [v]: candidate };
          for (const c of constraints) {
            const all = c.vars.every((cv) => test[cv] !== undefined);
            if (!all) continue;
            if (c.fn(test) === false) return false;
          }
          return true;
        });
        const removed = before.filter((x) => !D[v].includes(x));
        if (removed.length > 0) removals.push({ var: v, removed });
        if (D[v].length === 0) return { ok: false, removals };
      }
      return { ok: true, removals };
    }

    function recurse(idx: number): boolean {
      const unassigned = vars.filter((v) => assignment[v] === undefined);
      if (unassigned.length === 0) {
        steps.push({ msg: `✓ All variables assigned. Solution: ${vars.map((v) => `${v}=${assignment[v]}`).join(', ')}.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), outcome: 'solution' });
        return true;
      }
      const v = pickVariable(unassigned, D);
      const savedDomains: Domain = JSON.parse(JSON.stringify(D));
      const order = valueOrdering === 'increasing' ? [...D[v]].sort((a, b) => a - b) : [...D[v]].sort((a, b) => b - a);
      steps.push({ msg: `Try variable ${v} with current domain {${D[v].join(', ')}} in ${valueOrdering} order.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), decisionVar: v });

      for (const val of order) {
        assignment[v] = val;
        steps.push({ msg: `Assign ${v} = ${val}.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), decisionVar: v, triedVal: val });
        // Restrict D[v] to just val
        const beforeD = D[v]; D[v] = [val];
        const fc = forwardCheck();
        if (fc.ok) {
          const removalDesc = fc.removals.length === 0 ? 'no values pruned by FC' : fc.removals.map((r) => `D(${r.var}) loses {${r.removed.join(',')}}`).join('; ');
          steps.push({ msg: `FC after ${v}=${val}: ${removalDesc}. Continue.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), decisionVar: v, triedVal: val, outcome: 'ok', fcRemovals: fc.removals });
          if (recurse(idx + 1)) return true;
        } else {
          const failed = fc.removals.find((r) => savedDomains[r.var].length === r.removed.length || D[r.var].length === 0);
          steps.push({ msg: `FC after ${v}=${val}: D(${failed?.var ?? '?'}) becomes empty → backtrack.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), decisionVar: v, triedVal: val, outcome: 'fail', fcRemovals: fc.removals });
        }
        // Undo
        delete assignment[v];
        // Restore domains
        for (const k of Object.keys(D)) D[k] = [...savedDomains[k]];
      }
      steps.push({ msg: `All values for ${v} exhausted. Backtrack from ${v}.`, assignment: { ...assignment }, domains: JSON.parse(JSON.stringify(D)), decisionVar: v, outcome: 'fail' });
      return false;
    }

    const ok = recurse(0);   // idx no longer used with dynamic var picking
    if (!ok && !steps.some((s) => s.outcome === 'solution')) {
      steps.push({ msg: '✗ No solution exists.', assignment: {}, domains: JSON.parse(JSON.stringify(D0)) });
    }
    return { steps, vars };
  }

  const result = $derived.by(() => { varOrderingMode; customVarOrder; valueOrdering; varSpec; constraintSpec; return runFC(); });
  let stepIdx = $state(0);
  $effect(() => { result; stepIdx = 0; });

  function step() { stepIdx = Math.min(result.steps.length - 1, stepIdx + 1); }
  function prev() { stepIdx = Math.max(0, stepIdx - 1); }

  const examAnswer = $derived.by(() => {
    const { vars, D: D0 } = parseDomains(varSpec);
    const cs = parseConstraints(constraintSpec);
    const lines: string[] = [];

    lines.push(`**Setup.**`);
    lines.push(`- Variables: ${vars.join(', ')}.`);
    lines.push(`- Initial domains: ${vars.map((v) => `$D(${v}) = \\{${(D0[v] ?? []).join(', ')}\\}$`).join('; ')}.`);
    if (cs.length) {
      lines.push(`- Constraints: ${cs.map((c) => '`' + c.src + '`').join(', ')}.`);
    }
    lines.push('');

    lines.push(`**Settings.** Variable order = **${varOrderingMode}**${varOrderingMode === 'custom' ? ` (\`${customVarOrder}\`)` : ''}; value order = **${valueOrdering}**; algorithm = backtracking + forward-checking (d-way branching).`);
    lines.push('');

    // Pull decisions: each "Assign X = v" step with its FC outcome.
    const decisions: { step: number; depth: number; v: string; val: number; ok: boolean | null; fc: string; failVar?: string }[] = [];
    let lastAssign: { step: number; v: string; val: number } | null = null;
    result.steps.forEach((s, i) => {
      if (s.decisionVar && s.triedVal !== undefined && /^Assign /.test(s.msg)) {
        lastAssign = { step: i, v: s.decisionVar, val: s.triedVal };
      } else if (s.outcome === 'ok' && lastAssign && s.fcRemovals) {
        const fcDesc = s.fcRemovals.length === 0 ? 'no values pruned' : s.fcRemovals.map((r) => `$D(${r.var})$ loses \\{${r.removed.join(',')}\\}`).join('; ');
        decisions.push({ step: lastAssign.step, depth: Object.keys(s.assignment).length, v: lastAssign.v, val: lastAssign.val, ok: true, fc: fcDesc });
        lastAssign = null;
      } else if (s.outcome === 'fail' && lastAssign && s.fcRemovals) {
        const failVar = s.fcRemovals.find((r) => true)?.var;
        decisions.push({ step: lastAssign.step, depth: Object.keys(s.assignment).length, v: lastAssign.v, val: lastAssign.val, ok: false, fc: `$D(${failVar ?? '?'})$ wiped`, failVar });
        lastAssign = null;
      }
    });

    const backtracks = result.steps.filter((s) => s.outcome === 'fail').length;
    const totalNodes = decisions.length;

    lines.push(`**BT + FC trace.** ${totalNodes} decision node${totalNodes === 1 ? '' : 's'} expanded, ${backtracks} backtrack${backtracks === 1 ? '' : 's'}.`);
    lines.push('');

    if (decisions.length && decisions.length <= 25) {
      lines.push('| # | Depth | Decision | FC result |');
      lines.push('|---|---|---|---|');
      decisions.forEach((d, i) => {
        const outcome = d.ok ? d.fc : `✗ ${d.fc} → backtrack`;
        lines.push(`| ${i + 1} | ${d.depth} | $${d.v} = ${d.val}$ | ${outcome} |`);
      });
      lines.push('');
    }

    const sol = result.steps.find((s) => s.outcome === 'solution');
    if (sol) {
      lines.push(`**Solution found.**`);
      lines.push('');
      lines.push(`$$${vars.map((v) => `${v} = ${sol.assignment[v]}`).join(', \\quad ')}$$`);
    } else {
      lines.push(`**No solution.** The search tree was exhausted under BT + FC with these orderings.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="grid sm:grid-cols-2 gap-2">
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Variables &amp; domains</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="5" bind:value={varSpec}></textarea>
    </label>
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Constraints (JS-like; use <code>abs</code>, <code>min</code>, <code>max</code>, <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>, <code>==</code>, <code>!=</code>, <code>&lt;=</code>, <code>&gt;=</code>)</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="5" bind:value={constraintSpec}></textarea>
    </label>
  </div>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Variable ordering:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {varOrderingMode === 'top-to-bottom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (varOrderingMode = 'top-to-bottom')}>Top-to-bottom</button>
      <button class="px-2 py-1 {varOrderingMode === 'mrv' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (varOrderingMode = 'mrv')}>MRV</button>
      <button class="px-2 py-1 {varOrderingMode === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (varOrderingMode = 'custom')}>Custom</button>
    </div>
    {#if varOrderingMode === 'custom'}
      <input class="font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 w-48" bind:value={customVarOrder} placeholder="e.g. x3, x1, x2" />
    {/if}
    <span>Value:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {valueOrdering === 'increasing' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (valueOrdering = 'increasing')}>Increasing</button>
      <button class="px-2 py-1 {valueOrdering === 'decreasing' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (valueOrdering = 'decreasing')}>Decreasing</button>
    </div>
  </div>

  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={prev} disabled={stepIdx === 0}>⏮ Prev</button>
    <button class="btn btn-sm btn-primary" onclick={step} disabled={stepIdx >= result.steps.length - 1}>Next ⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = result.steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{result.steps.length}</span>
  </div>

  {#if result.steps[stepIdx]}
    {@const cur = result.steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium {cur.outcome === 'solution' ? 'text-emerald-700 dark:text-emerald-300' : cur.outcome === 'fail' ? 'text-rose-600' : ''}"><MathText src={cur.msg} /></div>
      <div class="grid sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Current assignment</div>
          {#each result.vars as v}
            <div>
              <span class="text-ink-500">{v}</span>:
              {#if cur.assignment[v] !== undefined}
                <span class="font-bold">= {cur.assignment[v]}</span>
              {:else}
                <span class="text-ink-500">unassigned</span>
              {/if}
            </div>
          {/each}
        </div>
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Current domains</div>
          {#each result.vars as v}
            <div>
              <span class="text-ink-500">D({v})</span> = {cur.domains[v].length === 0 ? '∅' : '{' + cur.domains[v].join(', ') + '}'}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="card !p-3">
    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Full trace ({result.steps.length} steps)</div>
    <ol class="font-mono text-[11px] space-y-0.5 list-none p-0 max-h-44 overflow-y-auto">
      {#each result.steps as st, i}
        <li class="{i === stepIdx ? 'font-semibold text-accent-700 dark:text-accent-300 bg-accent-50/50 dark:bg-accent-900/20 px-1' : 'text-ink-500'}">{i + 1}. <MathText src={st.msg} /></li>
      {/each}
    </ol>
  </div>

  <div class="text-xs text-ink-500">
    Variable order = top to bottom in the spec. Each variable is assigned values in the chosen order; after each assignment, forward-checking prunes neighbours' domains. If any becomes empty → backtrack and try the next value. <b>d-way branching</b> means each level tries each value in turn (rather than 2-way's X=v / X≠v split).
  </div>

  <ExamAnswer answer={examAnswer} summary={`BT + FC · ${varOrderingMode} / ${valueOrdering} · ${result.steps.some((s) => s.outcome === 'solution') ? 'solution found' : 'no solution'}`} />
</div>
