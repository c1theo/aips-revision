<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';

  // Minimal tree-search stepper over a hard-coded sample tree.
  // The pedagogical heavy lifting lives in SearchGrid; this view exists so the
  // user can see the classic OPEN/CLOSED expansion order on a small tree.

  type Algo = 'BFS' | 'DFS' | 'UCS';
  let algo = $state<Algo>('BFS');

  // Sample tree: each node has children, optional edge cost (default 1), and a label.
  // S is start, G1/G2 are goals. Tree shape:
  //         S
  //       /   \
  //      A     B
  //     / \   / \
  //    C  D  E   F
  //       |      |
  //      G1     G2
  const tree: Record<string, { children: { node: string; cost: number }[]; goal?: boolean }> = {
    S:  { children: [{ node: 'A', cost: 1 }, { node: 'B', cost: 4 }] },
    A:  { children: [{ node: 'C', cost: 2 }, { node: 'D', cost: 5 }] },
    B:  { children: [{ node: 'E', cost: 1 }, { node: 'F', cost: 1 }] },
    C:  { children: [] },
    D:  { children: [{ node: 'G1', cost: 3 }] },
    E:  { children: [] },
    F:  { children: [{ node: 'G2', cost: 2 }] },
    G1: { children: [], goal: true },
    G2: { children: [], goal: true },
  };

  function run(algo: Algo) {
    const expansionOrder: string[] = [];
    const parent: Record<string, string | null> = { S: null };
    const gCost: Record<string, number> = { S: 0 };
    let goalFound: string | null = null;
    if (algo === 'BFS') {
      const q: string[] = ['S'];
      const seen = new Set(['S']);
      while (q.length) {
        const n = q.shift()!;
        expansionOrder.push(n);
        if (tree[n].goal) { goalFound = n; break; }
        for (const ch of tree[n].children) {
          if (!seen.has(ch.node)) { seen.add(ch.node); parent[ch.node] = n; gCost[ch.node] = (gCost[n] ?? 0) + ch.cost; q.push(ch.node); }
        }
      }
    } else if (algo === 'DFS') {
      const stack: string[] = ['S'];
      const seen = new Set<string>();
      while (stack.length) {
        const n = stack.pop()!;
        if (seen.has(n)) continue;
        seen.add(n);
        expansionOrder.push(n);
        if (tree[n].goal) { goalFound = n; break; }
        // push children right-to-left so left is popped first
        const kids = tree[n].children.slice().reverse();
        for (const ch of kids) {
          if (!seen.has(ch.node)) { parent[ch.node] = n; gCost[ch.node] = (gCost[n] ?? 0) + ch.cost; stack.push(ch.node); }
        }
      }
    } else {
      // UCS
      const pq: { node: string; g: number }[] = [{ node: 'S', g: 0 }];
      const seen = new Set<string>();
      while (pq.length) {
        pq.sort((a, b) => a.g - b.g);
        const cur = pq.shift()!;
        if (seen.has(cur.node)) continue;
        seen.add(cur.node);
        expansionOrder.push(cur.node);
        if (tree[cur.node].goal) { goalFound = cur.node; break; }
        for (const ch of tree[cur.node].children) {
          const newG = cur.g + ch.cost;
          if (!(ch.node in gCost) || newG < gCost[ch.node]) { gCost[ch.node] = newG; parent[ch.node] = cur.node; }
          pq.push({ node: ch.node, g: newG });
        }
      }
    }
    const path: string[] = [];
    if (goalFound) {
      let cur: string | null = goalFound;
      while (cur !== null) { path.unshift(cur); cur = parent[cur] ?? null; }
    }
    return { expansionOrder, goalFound, path, cost: goalFound ? gCost[goalFound] : null };
  }

  const result = $derived(run(algo));

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push('**Setup.**');
    lines.push('- Tree (edges labelled with step cost):');
    for (const n of Object.keys(tree)) {
      const kids = tree[n].children;
      if (kids.length === 0) continue;
      lines.push(`  - ${n} → ${kids.map((k) => `${k.node} (cost ${k.cost})`).join(', ')}`);
    }
    const goals = Object.entries(tree).filter(([, v]) => v.goal).map(([k]) => k);
    lines.push(`- Start: \`S\`; goals: ${goals.map((g) => '`' + g + '`').join(', ')}.`);
    lines.push(`- Algorithm: **${algo}**.`);
    lines.push('');

    lines.push(`**Expansion order.**`);
    result.expansionOrder.forEach((n, i) => lines.push(`${i + 1}. \`${n}\``));
    lines.push('');

    if (result.goalFound) {
      lines.push(`**Path found.** \`${result.path.join(' → ')}\` (cost = ${result.cost}).`);
    } else {
      lines.push(`**No goal reached.**`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex gap-2 items-center text-xs">
    <span>Algorithm:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      {#each ['BFS','DFS','UCS'] as a (a)}
        <button class="px-2 py-1 {algo === a ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (algo = a as Algo)}>{a}</button>
      {/each}
    </div>
    <span class="text-ink-500 ml-2">A small fixed tree; switch algorithms to see how expansion order differs.</span>
  </div>

  <div class="card !p-3 text-xs font-mono">
    <div class="text-ink-500 mb-1 font-sans uppercase tracking-wider text-[10px]">Expansion order</div>
    {result.expansionOrder.join(' → ')}
  </div>

  <div class="card !p-3 text-xs">
    {#if result.goalFound}
      <div><span class="text-ink-500">Goal reached:</span> <span class="font-mono font-bold text-emerald-700 dark:text-emerald-300">{result.goalFound}</span></div>
      <div><span class="text-ink-500">Path:</span> <span class="font-mono">{result.path.join(' → ')}</span> &middot; <span class="text-ink-500">cost</span> = {result.cost}</div>
    {:else}
      <div class="text-rose-600">No goal reached.</div>
    {/if}
  </div>

  <ExamAnswer answer={examAnswer} summary={`${algo} · ${result.expansionOrder.length} expansions${result.goalFound ? ` · ${result.goalFound} (cost ${result.cost})` : ''}`} />
</div>
