<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // AC-4: counter-based arc consistency.
  // Maintains counter[X_i, v, X_j] = |{w in D(X_j) : (v,w) supports constraint c(X_i, X_j)}|
  // and S queue of (variable, value) deletions to process.

  interface Constraint {
    a: string;     // first variable name
    b: string;     // second variable name
    tuples: string;    // user-input tuples (one per line, format "v, w")
  }

  let varSpec = $state(`x1 = 1, 2, 3, 4
x2 = 1, 2, 3, 4
x3 = 1, 2, 3, 4
x4 = 1, 2, 3, 4`);

  let constraintSpec = $state(`x1 - x2
1, 1
1, 2
2, 2
2, 4
3, 3
4, 2
4, 4
---
x2 - x3
1, 1
1, 2
2, 2
2, 4
3, 3
4, 2
4, 4
---
x3 - x4
1, 1
1, 2
2, 2
2, 4
3, 3
4, 2
4, 4`);

  let initialAssignment = $state(`x1 = 1`);

  type Domain = Record<string, number[]>;
  type AllowedSet = Set<string>;

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

  function parseConstraints(spec: string): { a: string; b: string; allowed: Set<string> }[] {
    const out: { a: string; b: string; allowed: Set<string> }[] = [];
    const blocks = spec.split('---').map((b) => b.trim()).filter(Boolean);
    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const header = lines[0];
      const hm = header.match(/^(\w+)\s*[-,\s]\s*(\w+)$/);
      if (!hm) continue;
      const allowed = new Set<string>();
      for (let i = 1; i < lines.length; i++) {
        const t = lines[i].split(/[,\s]+/).filter(Boolean).map(Number);
        if (t.length >= 2) allowed.add(`${t[0]},${t[1]}`);
      }
      out.push({ a: hm[1], b: hm[2], allowed });
    }
    return out;
  }

  function parseAssignments(spec: string, D: Domain): Record<string, number> {
    const out: Record<string, number> = {};
    for (const line of spec.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const m = line.match(/^(\w+)\s*=\s*(\d+)$/);
      if (m) out[m[1]] = Number(m[2]);
    }
    return out;
  }

  interface Step {
    msg: string;
    D: Domain;
    S: { var: string; val: number }[];
    counters: Record<string, number>;
    highlight?: { a: string; v: number; b: string };
  }

  function runAC4() {
    const { vars, D: D0 } = parseDomains(varSpec);
    const D: Domain = JSON.parse(JSON.stringify(D0));
    const constraints = parseConstraints(constraintSpec);
    const assigns = parseAssignments(initialAssignment, D);

    // Apply initial assignments by reducing domain
    const steps: Step[] = [];
    for (const [v, val] of Object.entries(assigns)) {
      if (!D[v] || !D[v].includes(val)) continue;
      D[v] = [val];
    }
    steps.push({
      msg: `Initial state after assignments: ${Object.entries(assigns).map(([k, v]) => `${k}=${v}`).join(', ') || '(none)'}.`,
      D: JSON.parse(JSON.stringify(D)),
      S: [],
      counters: {},
    });

    // Build counter: counter[a,v,b] = |{w in D[b] : (v,w) allowed in constraint(a,b)}|
    // (and symmetric for (b,a))
    const counter: Record<string, number> = {};

    // Initialise S = removed values to propagate
    const S: { var: string; val: number }[] = [];

    function allowed(c: { a: string; b: string; allowed: Set<string> }, va: number, vb: number) {
      return c.allowed.has(`${va},${vb}`);
    }

    // For each constraint and each value in each variable, compute support
    for (const c of constraints) {
      for (const va of D[c.a] ?? []) {
        const sup = (D[c.b] ?? []).filter((vb) => allowed(c, va, vb)).length;
        counter[`${c.a},${va},${c.b}`] = sup;
        if (sup === 0) {
          // mark for removal
          if (!S.find((e) => e.var === c.a && e.val === va)) S.push({ var: c.a, val: va });
        }
      }
      for (const vb of D[c.b] ?? []) {
        const sup = (D[c.a] ?? []).filter((va) => allowed(c, va, vb)).length;
        counter[`${c.b},${vb},${c.a}`] = sup;
        if (sup === 0) {
          if (!S.find((e) => e.var === c.b && e.val === vb)) S.push({ var: c.b, val: vb });
        }
      }
    }

    steps.push({
      msg: `Initialisation: built counter for every (variable, value, constraint-partner). Found ${S.length} unsupported value(s) → added to S.`,
      D: JSON.parse(JSON.stringify(D)),
      S: [...S],
      counters: { ...counter },
    });

    // Remove the initial unsupported values from domains
    for (const e of S) {
      if (D[e.var]) D[e.var] = D[e.var].filter((v) => v !== e.val);
    }

    // Propagate
    let safety = 0;
    while (S.length > 0 && safety++ < 200) {
      const e = S.shift()!;
      steps.push({
        msg: `Pop (${e.var} ≠ ${e.val}) from S. For every (X, v) where the constraint with ${e.var} previously had ${e.val} as a support, decrement counter and check.`,
        D: JSON.parse(JSON.stringify(D)),
        S: [...S],
        counters: { ...counter },
      });
      for (const c of constraints) {
        let otherVar: string | null = null;
        if (c.a === e.var) otherVar = c.b;
        else if (c.b === e.var) otherVar = c.a;
        else continue;

        for (const v of [...(D[otherVar] ?? [])]) {
          const supported = c.a === e.var ? allowed(c, e.val, v) : allowed(c, v, e.val);
          if (!supported) continue;
          const k = `${otherVar},${v},${e.var}`;
          counter[k] = (counter[k] ?? 0) - 1;
          if (counter[k] <= 0) {
            // Remove v from D[otherVar]
            D[otherVar] = D[otherVar].filter((x) => x !== v);
            S.push({ var: otherVar, val: v });
            steps.push({
              msg: `counter[${otherVar}, ${v}, ${e.var}] reached 0 → remove ${v} from D(${otherVar}). Add (${otherVar} ≠ ${v}) to S.`,
              D: JSON.parse(JSON.stringify(D)),
              S: [...S],
              counters: { ...counter },
              highlight: { a: otherVar, v, b: e.var },
            });
          } else {
            steps.push({
              msg: `counter[${otherVar}, ${v}, ${e.var}] = ${counter[k]} (still supported, keep ${v}).`,
              D: JSON.parse(JSON.stringify(D)),
              S: [...S],
              counters: { ...counter },
              highlight: { a: otherVar, v, b: e.var },
            });
          }
        }
      }
    }

    const finalEmpty = vars.some((v) => (D[v] ?? []).length === 0);
    steps.push({
      msg: finalEmpty ? `Some domain is empty — CSP is inconsistent.` : `AC-4 fixed point reached. All remaining (variable, value) pairs have positive support across all constraints.`,
      D: JSON.parse(JSON.stringify(D)),
      S: [],
      counters: { ...counter },
    });

    return { steps, vars, constraints };
  }

  const result = $derived.by(() => runAC4());
  let stepIdx = $state(0);
  $effect(() => { result; stepIdx = 0; });

  function step() { stepIdx = Math.min(result.steps.length - 1, stepIdx + 1); }
  function prev() { stepIdx = Math.max(0, stepIdx - 1); }

  const examAnswer = $derived.by(() => {
    const { vars, D: D0 } = parseDomains(varSpec);
    const cs = parseConstraints(constraintSpec);
    const assigns = parseAssignments(initialAssignment, D0);
    const lines: string[] = [];

    lines.push(`**Setup.**`);
    lines.push(`- Variables: ${vars.join(', ')}.`);
    lines.push(`- Initial domains: ${vars.map((v) => `$D(${v}) = \\{${(D0[v] ?? []).join(', ')}\\}$`).join('; ')}.`);
    const ckeys = Object.keys(assigns);
    if (ckeys.length) {
      lines.push(`- Initial assignment: ${ckeys.map((k) => `$${k} = ${assigns[k]}$`).join(', ')} (domains pre-restricted accordingly).`);
    } else {
      lines.push(`- Initial assignment: (none).`);
    }
    if (cs.length) {
      lines.push(`- Constraints (allowed tuples):`);
      for (const c of cs) {
        const tuples = [...c.allowed].map((t) => `(${t})`).join(', ');
        lines.push(`  - $c(${c.a}, ${c.b})$: ${tuples || '(empty)'}`);
      }
    }
    lines.push('');

    // Use the "initialisation" step (index 1) to summarise the counter initialisation.
    const initStep = result.steps[1];
    if (initStep) {
      lines.push(`**Counter initialisation.** For every $(X_i, v, X_j)$ we compute the number of supports $v$ has in $D(X_j)$ for the constraint $c(X_i, X_j)$. Values whose counter is 0 are queued for removal.`);
      lines.push('');
      const ckeys2 = Object.keys(initStep.counters);
      if (ckeys2.length && ckeys2.length <= 60) {
        lines.push('| $(X_i, v, X_j)$ | counter |');
        lines.push('|---|---|');
        for (const k of ckeys2) {
          const [a, v, b] = k.split(',');
          lines.push(`| $(${a}, ${v}, ${b})$ | ${initStep.counters[k]} |`);
        }
        lines.push('');
      }
      if (initStep.S.length) {
        lines.push(`Initial S-queue (unsupported values): ${initStep.S.map((e) => `$(${e.var} \\ne ${e.val})$`).join(', ')}.`);
      } else {
        lines.push(`Initial S-queue is empty.`);
      }
      lines.push('');
    }

    // Trace propagation steps (those with an "S" pop or counter decrement).
    const propSteps = result.steps.slice(2, result.steps.length - 1);
    if (propSteps.length) {
      lines.push(`**Propagation trace.** ${propSteps.length} step${propSteps.length === 1 ? '' : 's'} executed.`);
      lines.push('');
      if (propSteps.length <= 30) {
        lines.push('| # | Event | $|S|$ after |');
        lines.push('|---|---|---|');
        propSteps.forEach((s, i) => {
          const msg = s.msg.replace(/\|/g, '\\|');
          lines.push(`| ${i + 1} | ${msg} | ${s.S.length} |`);
        });
        lines.push('');
      }
    } else {
      lines.push(`**Propagation trace.** No further work — initial counters were already enough.`);
      lines.push('');
    }

    const last = result.steps[result.steps.length - 1];
    lines.push(`**Final domains.**`);
    for (const v of vars) {
      const d = last?.D[v] ?? [];
      lines.push(`- $D(${v}) = ${d.length === 0 ? '\\emptyset' : '\\{' + d.join(', ') + '\\}'}$`);
    }
    lines.push('');

    const infeasible = vars.some((v) => (last?.D[v] ?? []).length === 0);
    if (infeasible) {
      lines.push(`**Verdict.** A domain has been wiped out — the CSP is **infeasible** under this assignment.`);
    } else {
      lines.push(`**Verdict.** AC-4 reached a fixed point with every domain non-empty — the CSP is **arc-consistent**. (Note: this does not by itself guarantee a solution exists for non-binary CSPs, but for binary CSPs it rules out single-arc inconsistencies.)`);
    }
    lines.push('');
    lines.push(`**Complexity.** AC-4 runs in $O(c \\cdot d^2)$ — each support is processed at most once via the counters, giving the optimal worst-case bound for arc consistency.`);

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="grid sm:grid-cols-2 gap-2">
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Variables &amp; domains (Name = v1, v2, …)</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={varSpec}></textarea>
    </label>
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Initial assignments (Name = value, one per line)</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={initialAssignment}></textarea>
    </label>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Constraints (tabular). Format: each block separated by <code>---</code>; first line = "VarA - VarB", then allowed tuples (va, vb) one per line.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="14" bind:value={constraintSpec}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={prev} disabled={stepIdx === 0}>⏮ Prev</button>
    <button class="btn btn-sm btn-primary" onclick={step} disabled={stepIdx >= result.steps.length - 1}>Next ⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = result.steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{result.steps.length}</span>
  </div>

  {#if result.steps[stepIdx]}
    {@const cur = result.steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium"><MathText src={cur.msg} /></div>

      <div class="grid sm:grid-cols-3 gap-3 mt-3">
        <div>
          <div class="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-1">Domains</div>
          <div class="font-mono text-xs space-y-0.5">
            {#each result.vars as v}
              <div><span class="text-ink-500">{v}:</span> {(cur.D[v] ?? []).length === 0 ? '∅' : '{' + (cur.D[v] ?? []).join(', ') + '}'}</div>
            {/each}
          </div>
        </div>

        <div>
          <div class="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-1">Queue S ({cur.S.length})</div>
          <div class="font-mono text-xs space-y-0.5 max-h-32 overflow-y-auto">
            {#each cur.S as e}
              <div>({e.var} ≠ {e.val})</div>
            {/each}
            {#if cur.S.length === 0}<div class="text-ink-500 italic">empty</div>{/if}
          </div>
        </div>

        <div>
          <div class="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-1">Counters</div>
          <div class="font-mono text-[10px] space-y-0 max-h-32 overflow-y-auto">
            {#each Object.entries(cur.counters) as [k, v]}
              {@const [varA, val, varB] = k.split(',')}
              <div class="{cur.highlight && cur.highlight.a === varA && String(cur.highlight.v) === val && cur.highlight.b === varB ? 'bg-yellow-200 dark:bg-yellow-800 px-1' : ''}">
                ({varA}, {val}, {varB}) = {v}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="text-xs text-ink-500">
    AC-4 uses <b>counters</b> instead of REVISE: counter[X_i, v, X_j] = number of supports value <code>v</code> has in <code>D(X_j)</code> for the constraint between X_i and X_j. When a value is removed, decrement counters of its former supporters; if a counter hits 0, that value is removed too. Time $O(c \cdot d^2)$ — optimal arc-consistency complexity.
  </div>

  <ExamAnswer answer={examAnswer} summary={`${result.steps.length} steps · ${result.vars.some((v) => (result.steps[result.steps.length - 1]?.D[v] ?? []).length === 0) ? 'infeasible' : 'arc-consistent'}`} />
</div>
