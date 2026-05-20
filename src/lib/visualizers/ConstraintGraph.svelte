<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Draw the constraint graph for any CSP. Highlight tree-structured vs cyclic vs disconnected.

  let spec = $state(`x1 = 1, 2, 3
x2 = 1, 2, 3
x3 = 1, 2, 3
x4 = 1, 2, 3
x5 = 1, 2, 3
edges:
x1-x2
x1-x3
x2-x4
x3-x5`);

  type Edge = { a: string; b: string };

  function parse(s: string): { vars: { name: string; domain: number[] }[]; edges: Edge[] } {
    const vars: { name: string; domain: number[] }[] = [];
    const edges: Edge[] = [];
    let edgeMode = false;
    for (const line of s.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
      if (line.toLowerCase() === 'edges:') { edgeMode = true; continue; }
      if (!edgeMode) {
        const m = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (m) vars.push({ name: m[1], domain: m[2].split(/[,\s]+/).filter(Boolean).map(Number) });
      } else {
        const parts = line.split(/[-,\s]+/).filter(Boolean);
        if (parts.length === 2) edges.push({ a: parts[0], b: parts[1] });
      }
    }
    return { vars, edges };
  }

  const { vars, edges } = $derived(parse(spec));

  // Check if graph is tree (connected and |E| = n-1)
  function analyze(): { isTree: boolean; isConnected: boolean; cycleCount: number; components: number } {
    const adj = new Map<string, Set<string>>();
    for (const v of vars) adj.set(v.name, new Set());
    for (const e of edges) {
      adj.get(e.a)?.add(e.b);
      adj.get(e.b)?.add(e.a);
    }
    const seen = new Set<string>();
    let components = 0;
    for (const v of vars) {
      if (seen.has(v.name)) continue;
      components += 1;
      const stack = [v.name];
      while (stack.length) {
        const n = stack.pop()!;
        if (seen.has(n)) continue;
        seen.add(n);
        for (const m of adj.get(n) ?? []) if (!seen.has(m)) stack.push(m);
      }
    }
    const isConnected = components === 1;
    const isTree = isConnected && edges.length === vars.length - 1;
    const cycleCount = edges.length - vars.length + components;   // = |E| - |V| + components
    return { isTree, isConnected, cycleCount, components };
  }

  const stats = $derived(analyze());

  // Layout: circular for small graphs, otherwise spring-style approximation
  function layout() {
    const n = vars.length;
    const W = 600, H = 360;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.4;
    return vars.map((v, i) => ({
      name: v.name,
      domain: v.domain,
      x: cx + r * Math.cos(2 * Math.PI * i / Math.max(1, n) - Math.PI / 2),
      y: cy + r * Math.sin(2 * Math.PI * i / Math.max(1, n) - Math.PI / 2),
    }));
  }

  const positions = $derived(layout());
  const posMap = $derived(new Map(positions.map((p) => [p.name, p])));

  // Per-component sizes (variables / edges) for the writeup.
  function componentSizes(): { vars: number; edges: number }[] {
    const adj = new Map<string, Set<string>>();
    for (const v of vars) adj.set(v.name, new Set());
    for (const e of edges) { adj.get(e.a)?.add(e.b); adj.get(e.b)?.add(e.a); }
    const seen = new Set<string>();
    const out: { vars: number; edges: number }[] = [];
    for (const v of vars) {
      if (seen.has(v.name)) continue;
      const stack = [v.name];
      const compVars: string[] = [];
      while (stack.length) {
        const n = stack.pop()!;
        if (seen.has(n)) continue;
        seen.add(n);
        compVars.push(n);
        for (const m of adj.get(n) ?? []) if (!seen.has(m)) stack.push(m);
      }
      const compVarSet = new Set(compVars);
      const compEdges = edges.filter((e) => compVarSet.has(e.a) && compVarSet.has(e.b)).length;
      out.push({ vars: compVars.length, edges: compEdges });
    }
    return out;
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    const n = vars.length;
    const e = edges.length;
    const s = stats;

    // Identify structure
    let structure: string;
    if (n === 0) structure = '*(empty graph)*';
    else if (!s.isConnected && s.cycleCount === 0) structure = `**forest / disconnected** (${s.components} connected components, no cycles)`;
    else if (!s.isConnected && s.cycleCount > 0) structure = `**disconnected with cycles** (${s.components} components, ${s.cycleCount} independent cycle${s.cycleCount === 1 ? '' : 's'})`;
    else if (s.isTree) structure = `**tree** (connected, $|E| = |V| - 1 = ${n - 1}$, acyclic)`;
    else structure = `**cyclic** (connected, ${s.cycleCount} independent cycle${s.cycleCount === 1 ? '' : 's'})`;

    lines.push(`**Constraint graph.**`);
    lines.push(`- Variables: ${vars.map((v) => v.name).join(', ') || '(none)'}.`);
    lines.push(`- Edges (binary constraint scopes): ${edges.length ? edges.map((eg) => `$${eg.a}$–$${eg.b}$`).join(', ') : '(none)'}.`);
    lines.push('');

    lines.push(`**Structural summary.**`);
    lines.push(`- Nodes: **${n}**`);
    lines.push(`- Edges: **${e}**`);
    lines.push(`- Connected components: **${s.components}**`);
    lines.push(`- Independent cycles: **${s.cycleCount}** (from the cyclomatic formula $|E| - |V| + C$).`);
    lines.push(`- Structure: ${structure}`);
    lines.push('');

    if (s.components > 1) {
      const sizes = componentSizes();
      lines.push(`**Per-component breakdown.**`);
      sizes.forEach((c, i) => lines.push(`- Component ${i + 1}: ${c.vars} variable${c.vars === 1 ? '' : 's'}, ${c.edges} edge${c.edges === 1 ? '' : 's'}.`));
      lines.push('');
    }

    lines.push(`**Algorithmic implication.**`);
    if (n === 0) {
      lines.push(`*(no variables to solve)*`);
    } else if (s.isTree) {
      lines.push(`The constraint graph is a tree, so the CSP is solvable in **$O(n d^2)$** via the tree-CSP algorithm: choose any root, run a single backward pass of directional arc consistency from leaves to root, then assign root → leaves with no backtracking required.`);
    } else if (!s.isConnected) {
      const sizes = componentSizes();
      const allTrees = sizes.every((c) => c.edges === c.vars - 1);
      lines.push(`The graph is disconnected — **decompose into ${s.components} independent sub-CSPs** and solve each in isolation. The full solution is the cross-product of the per-component solutions.${allTrees ? ' Each sub-CSP is itself a tree, so the whole problem solves in $O(n d^2)$.' : ''}`);
    } else {
      lines.push(`The graph is connected with ${s.cycleCount} independent cycle${s.cycleCount === 1 ? '' : 's'} — directional arc consistency is **not sufficient**, so the CSP **needs full backtracking** (e.g. BT + FC, BT + MAC). Polynomial alternatives: **cutset conditioning** (remove a cycle-cutset of size $k$, leaving a tree — $O(d^k \\cdot (n - k) d^2)$) or **tree decomposition** ($O(n d^{w+1})$ where $w$ is the treewidth).`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CSP spec — variables (Name = domain) then <code>edges:</code> then edges (A-B)</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="10" bind:value={spec}></textarea>
  </label>

  <div class="text-xs flex flex-wrap gap-2">
    <span class="chip">{vars.length} vars</span>
    <span class="chip">{edges.length} edges</span>
    {#if stats.isConnected}<span class="chip !bg-emerald-100 dark:!bg-emerald-900/30 !text-emerald-800 dark:!text-emerald-200">connected</span>{:else}<span class="chip !bg-amber-100 dark:!bg-amber-900/30 !text-amber-800 dark:!text-amber-200">{stats.components} components</span>{/if}
    {#if stats.isTree}<span class="chip !bg-emerald-100 dark:!bg-emerald-900/30 !text-emerald-800 dark:!text-emerald-200">tree — O(nd²) solvable</span>{:else if stats.cycleCount > 0}<span class="chip !bg-rose-100 dark:!bg-rose-900/30 !text-rose-800 dark:!text-rose-200">{stats.cycleCount} independent cycles</span>{/if}
  </div>

  <svg viewBox="0 0 600 360" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: 360px">
    {#each edges as e}
      {@const pa = posMap.get(e.a)}
      {@const pb = posMap.get(e.b)}
      {#if pa && pb}
        <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#64748b" stroke-width="1.5" />
      {/if}
    {/each}
    {#each positions as p}
      <circle cx={p.x} cy={p.y} r="22" fill="#dbeafe" stroke="#1e40af" stroke-width="2" />
      <text x={p.x} y={p.y + 3} text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">{p.name}</text>
      <text x={p.x} y={p.y + 36} text-anchor="middle" font-size="9" fill="#64748b">{p.domain.join(',')}</text>
    {/each}
  </svg>

  <div class="text-xs text-ink-500">
    <b>Why it matters.</b> The constraint graph's structure determines tractability. A <b>tree</b> (n-1 edges, connected) is solved in $O(nd^2)$ by directional arc-consistency. Cycles force exponential worst-case unless cutset conditioning or tree decomposition is applied. Disconnected → solve each component independently.
  </div>

  <ExamAnswer answer={examAnswer} summary={`${vars.length} nodes · ${edges.length} edges · ${stats.isTree ? 'tree (O(nd²))' : !stats.isConnected ? `${stats.components} components` : `${stats.cycleCount} cycle${stats.cycleCount === 1 ? '' : 's'} (needs BT)`}`} />
</div>
