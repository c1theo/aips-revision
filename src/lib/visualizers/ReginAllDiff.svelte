<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Régin's GAC for AllDifferent — bipartite matching visualization.

  let { initialSpec = '' } = $props<{ initialSpec?: string }>();

  // AllDifferent's UI only needs variable/domain lines; the implicit
  // constraint is "all variables distinct". CSPLab specs may include
  // unary:/binary: blocks — drop those.
  function extractVarLines(src: string): string {
    const out: string[] = [];
    let inSpecialSection = false;
    for (const raw of src.split('\n')) {
      const line = raw.replace(/#.*$/, '').trim();
      if (!line) continue;
      const lower = line.toLowerCase();
      if (lower === 'binary:' || lower === 'unary:') { inSpecialSection = true; continue; }
      if (inSpecialSection) continue;
      if (/^\w+\s*=\s*.+$/.test(line)) out.push(line);
    }
    return out.join('\n');
  }

  const _initialVarLines = initialSpec ? extractVarLines(initialSpec) : '';

  let spec = $state(_initialVarLines || `X1 = a, b
X2 = a, b
X3 = a, b, c`);

  function parse(s: string): { vars: string[]; D: Record<string, string[]> } {
    const vars: string[] = [];
    const D: Record<string, string[]> = {};
    for (const line of s.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const m = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (m) {
        vars.push(m[1]);
        D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean);
      }
    }
    return { vars, D };
  }

  function maximumMatching(vars: string[], D: Record<string, string[]>): Map<string, string> {
    // Standard bipartite matching via augmenting paths
    const matchingVarToVal = new Map<string, string>();
    const matchingValToVar = new Map<string, string>();

    function tryAugment(v: string, visited: Set<string>): boolean {
      for (const val of D[v] ?? []) {
        if (visited.has(val)) continue;
        visited.add(val);
        const occupant = matchingValToVar.get(val);
        if (!occupant || tryAugment(occupant, visited)) {
          matchingVarToVal.set(v, val);
          matchingValToVar.set(val, v);
          return true;
        }
      }
      return false;
    }

    for (const v of vars) tryAugment(v, new Set<string>());
    return matchingVarToVal;
  }

  // For each (var, val) edge, check if it's in *some* maximum matching.
  // Approach: try a matching that uses this edge; if max matching with this constraint is full size, edge is supported.
  function edgesInSomeMaxMatching(vars: string[], D: Record<string, string[]>, maxSize: number): Set<string> {
    const supported = new Set<string>();
    for (const v of vars) {
      for (const val of D[v] ?? []) {
        // Try to find a matching of size maxSize that uses (v, val)
        const newD: Record<string, string[]> = {};
        for (const [k, vs] of Object.entries(D)) newD[k] = [...vs];
        // Force v to use val: remove all other choices for v
        newD[v] = [val];
        // Remove val from all other vars' domains
        for (const w of vars) if (w !== v) newD[w] = newD[w].filter((x) => x !== val);
        const m = maximumMatching(vars, newD);
        if (m.size === maxSize) supported.add(`${v}|${val}`);
      }
    }
    return supported;
  }

  const result = $derived.by(() => {
    const { vars, D } = parse(spec);
    const matching = maximumMatching(vars, D);
    const maxSize = matching.size;
    const supported = maxSize === vars.length ? edgesInSomeMaxMatching(vars, D, vars.length) : new Set<string>();
    const removed: { var: string; val: string }[] = [];
    for (const v of vars) {
      for (const val of D[v] ?? []) {
        if (!supported.has(`${v}|${val}`)) removed.push({ var: v, val });
      }
    }
    return { vars, D, matching, maxSize, supported, removed, feasible: maxSize === vars.length };
  });

  // Layout for bipartite graph
  function layout(vars: string[], allVals: string[]) {
    const W = 600, H = 360;
    const varPos = vars.map((v, i) => ({ name: v, x: 100, y: 40 + i * (H - 80) / Math.max(1, vars.length - 1) }));
    const valPos = allVals.map((v, i) => ({ name: v, x: 500, y: 40 + i * (H - 80) / Math.max(1, allVals.length - 1) }));
    return { varPos, valPos };
  }

  const allVals = $derived([...new Set(result.vars.flatMap((v) => result.D[v] ?? []))].sort());
  const positions = $derived(layout(result.vars, allVals));

  // Hall's condition check: find a witness subset S of vars whose combined
  // domain has fewer values than |S| — that proves infeasibility.
  function findHallWitness(vars: string[], D: Record<string, string[]>): { S: string[]; N: string[] } | null {
    const n = vars.length;
    // Enumerate non-empty subsets (only safe for small n; we cap at 12 to be safe).
    if (n > 12) return null;
    for (let mask = 1; mask < (1 << n); mask++) {
      const S: string[] = [];
      for (let i = 0; i < n; i++) if (mask & (1 << i)) S.push(vars[i]);
      const N = [...new Set(S.flatMap((v) => D[v] ?? []))];
      if (N.length < S.length) return { S, N };
    }
    return null;
  }

  const examAnswer = $derived.by(() => {
    const r = result;
    const lines: string[] = [];

    lines.push(`**Setup.** AllDifferent constraint over variables ${r.vars.join(', ')}.`);
    lines.push('');
    lines.push(`**Variables and domains.**`);
    for (const v of r.vars) {
      lines.push(`- $D(${v}) = \\{${(r.D[v] ?? []).join(', ')}\\}$`);
    }
    lines.push('');

    lines.push(`**Bipartite matching.** Build a bipartite graph with variables on the left, values on the right, and an edge $(X_i, v)$ whenever $v \\in D(X_i)$. Run maximum-cardinality matching (e.g. Hopcroft-Karp, $O(\\sqrt{|V|} \\cdot |E|)$).`);
    lines.push('');
    lines.push(`- Matching size: **${r.maxSize}**`);
    lines.push(`- Number of variables: **${r.vars.length}**`);
    if (r.matching.size > 0) {
      const ms = [...r.matching.entries()].map(([v, val]) => `$(${v}, ${val})$`).join(', ');
      lines.push(`- One maximum matching: ${ms}`);
    }
    lines.push('');

    if (!r.feasible) {
      const w = findHallWitness(r.vars, r.D);
      lines.push(`**Hall's condition.** A perfect matching of variables to distinct values exists **iff** for every $S \\subseteq \\{X_1, \\dots, X_n\\}$, $|N(S)| \\ge |S|$ where $N(S) = \\bigcup_{X \\in S} D(X)$.`);
      lines.push('');
      lines.push(`Maximum matching has size ${r.maxSize} < ${r.vars.length} = number of variables → **Hall's condition is violated** → AllDifferent is **infeasible**.`);
      if (w) {
        lines.push('');
        lines.push(`**Hall witness.** $S = \\{${w.S.join(', ')}\\}$, with $N(S) = \\{${w.N.join(', ')}\\}$, and $|N(S)| = ${w.N.length} < ${w.S.length} = |S|$.`);
      }
      lines.push('');
      lines.push(`**Verdict.** ✗ **Infeasible** — no GAC pruning is performed (the constraint is already unsatisfiable).`);
    } else {
      lines.push(`**Hall's condition holds** — a perfect matching exists, so AllDifferent is satisfiable.`);
      lines.push('');
      lines.push(`**Régin's GAC step.** For each edge $(X_i, v)$, check whether it lies in **some** maximum matching. Equivalently, build the residual graph from one maximum matching: an edge is in some max matching iff it is in $M$ OR it lies on an alternating cycle / path from a free value. Edges that do not — these values cannot participate in any AllDifferent solution — are **removed** from the corresponding variable's domain.`);
      lines.push('');

      if (r.removed.length === 0) {
        lines.push(`**Edges removed by GAC.** None — every (variable, value) edge already participates in some maximum matching, so the constraint is already GAC.`);
      } else {
        lines.push(`**Edges removed by GAC (${r.removed.length}).**`);
        for (const rem of r.removed) {
          lines.push(`- remove $${rem.val}$ from $D(${rem.var})$`);
        }
      }
      lines.push('');
      lines.push(`**Verdict.** ✓ **Feasible**, and the constraint is now generalised-arc-consistent. Régin's algorithm runs in polynomial time and catches pruning that pairwise $\\ne$ propagation (AC-3 over the $\\binom{n}{2}$ binary $\\ne$ constraints) systematically misses.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Variables &amp; domains</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={spec}></textarea>
  </label>

  <div class="flex gap-2 flex-wrap text-xs">
    Try:
    <button class="btn btn-sm" onclick={() => (spec = 'X1 = a, b\nX2 = a, b\nX3 = a, b, c')}>Classic (3 vars, sparse)</button>
    <button class="btn btn-sm" onclick={() => (spec = 'X1 = 1, 2\nX2 = 1, 2\nX3 = 1, 2\nX4 = 1, 2, 3')}>4 vars, tight</button>
    <button class="btn btn-sm" onclick={() => (spec = 'X1 = 1, 2, 3\nX2 = 1, 2, 3\nX3 = 1, 2, 3')}>Underconstrained')</button>
    <button class="btn btn-sm" onclick={() => (spec = 'X1 = 1\nX2 = 1\nX3 = 1')}>UNSAT (3 vars, 1 value)</button>
  </div>

  <div class="text-sm">
    {#if result.feasible}
      <span class="text-emerald-700 dark:text-emerald-300">✓ Feasible — maximum matching size {result.maxSize} = number of variables.</span>
    {:else}
      <span class="text-rose-600">✗ INFEASIBLE — max matching size {result.maxSize} &lt; {result.vars.length} variables. AllDifferent unsatisfiable.</span>
    {/if}
  </div>

  <svg viewBox="0 0 600 360" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: 360px">
    <!-- All edges -->
    {#each result.vars as v}
      {@const vp = positions.varPos.find((p) => p.name === v)}
      {#each result.D[v] ?? [] as val}
        {@const wp = positions.valPos.find((p) => p.name === val)}
        {#if vp && wp}
          {@const inSomeMatching = result.supported.has(`${v}|${val}`)}
          {@const inCurrentMatching = result.matching.get(v) === val}
          {@const removed = !inSomeMatching && result.feasible}
          <line x1={vp.x} y1={vp.y} x2={wp.x} y2={wp.y}
            stroke={inCurrentMatching ? '#16a34a' : (removed ? '#dc2626' : '#cbd5e1')}
            stroke-width={inCurrentMatching ? 3 : 1.5}
            stroke-dasharray={removed ? '4 3' : '0'} />
        {/if}
      {/each}
    {/each}

    <!-- Variable nodes -->
    {#each positions.varPos as p}
      <circle cx={p.x} cy={p.y} r="18" fill="#dbeafe" stroke="#1e40af" stroke-width="2" />
      <text x={p.x} y={p.y + 4} text-anchor="middle" font-size="11" font-weight="bold">{p.name}</text>
    {/each}

    <!-- Value nodes -->
    {#each positions.valPos as p}
      <circle cx={p.x} cy={p.y} r="18" fill="#fef3c7" stroke="#a16207" stroke-width="2" />
      <text x={p.x} y={p.y + 4} text-anchor="middle" font-size="11" font-weight="bold">{p.name}</text>
    {/each}

    <text x="100" y="20" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Variables</text>
    <text x="500" y="20" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Values</text>
  </svg>

  <div class="text-xs text-ink-500 flex gap-3 flex-wrap">
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#16a34a" stroke-width="3" /></svg>in current max matching</span>
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#cbd5e1" stroke-width="1.5" /></svg>edge in graph, in some max matching</span>
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 2" /></svg>NOT in any max matching → REMOVED</span>
  </div>

  {#if result.removed.length > 0}
    <div class="card !p-3 bg-rose-50 dark:bg-rose-900/20 border-rose-300">
      <div class="text-xs uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-300 mb-1">GAC removals ({result.removed.length})</div>
      <ul class="font-mono text-xs space-y-0.5 list-none p-0">
        {#each result.removed as r}
          <li>· remove <b>{r.val}</b> from D({r.var}) — not in any max matching</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="text-xs text-ink-500">
    <b>Régin's algorithm.</b> Bipartite graph: variables on left, values on right, edge iff value in domain. Find a maximum matching (e.g. Hopcroft-Karp). Any edge NOT in some maximum matching ↔ that value cannot participate in any AllDifferent satisfying assignment → remove from the variable's domain. Achieves <b>generalised arc consistency</b> for AllDifferent in polynomial time, catching deductions that pairwise ≠ propagation misses.
  </div>

  <ExamAnswer answer={examAnswer} summary={`matching ${result.maxSize}/${result.vars.length} · ${result.feasible ? 'feasible' : 'INFEASIBLE'} · ${result.removed.length} edge${result.removed.length === 1 ? '' : 's'} pruned`} />
</div>
