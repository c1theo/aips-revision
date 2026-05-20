<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Visualize 2-way vs d-way branching on a small CSP (n-queens fragment or graph colouring).

  let n = $state(4);
  let mode = $state<'2way' | 'dway'>('2way');

  type Node = {
    id: number;
    label: string;
    domains: number[][];
    assignment: number[];
    children: Node[];
    outcome?: 'sat' | 'unsat' | 'open';
  };
  let nodeIdCounter = 0;

  function attacks(r1: number, c1: number, r2: number, c2: number) {
    return c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2);
  }

  function fcPropagate(assignment: number[], domains: number[][]): number[][] | null {
    const out = domains.map((d) => [...d]);
    for (let r = 0; r < n; r++) {
      if (assignment[r] !== -1) continue;
      out[r] = [];
      for (let c = 0; c < n; c++) {
        let conflict = false;
        for (let r2 = 0; r2 < n; r2++) {
          if (assignment[r2] !== -1 && attacks(r, c, r2, assignment[r2])) { conflict = true; break; }
        }
        if (!conflict) out[r].push(c);
      }
      if (out[r].length === 0) return null;
    }
    return out;
  }

  function selectVar(assignment: number[], domains: number[][]): number {
    let best = -1, bestSize = Infinity;
    for (let r = 0; r < n; r++) {
      if (assignment[r] === -1 && domains[r].length < bestSize) { best = r; bestSize = domains[r].length; }
    }
    return best;
  }

  function solveTree(assignment: number[], domains: number[][], depth: number): Node {
    const node: Node = { id: nodeIdCounter++, label: '', domains: domains.map((d) => [...d]), assignment: [...assignment], children: [], outcome: 'open' };
    if (assignment.every((x) => x !== -1)) { node.outcome = 'sat'; node.label = '✓ SAT'; return node; }
    const r = selectVar(assignment, domains);
    if (r === -1) { node.outcome = 'sat'; node.label = '✓ SAT'; return node; }
    const vals = domains[r];
    if (vals.length === 0) { node.outcome = 'unsat'; node.label = '✗ empty'; return node; }
    node.label = `row ${r}, dom={${vals.join(',')}}`;
    if (mode === 'dway') {
      for (const v of vals) {
        const newA = [...assignment]; newA[r] = v;
        const newD = fcPropagate(newA, domains);
        if (newD === null) {
          node.children.push({ id: nodeIdCounter++, label: `r${r}=${v} → ✗`, domains: [], assignment: newA, children: [], outcome: 'unsat' });
        } else {
          const child = solveTree(newA, newD, depth + 1);
          child.label = `r${r}=${v} → ` + (child.outcome === 'sat' ? '✓' : child.outcome === 'unsat' ? '✗' : child.label);
          node.children.push(child);
        }
        if (node.children.some((c) => c.outcome === 'sat') && depth < 100) break;
      }
      if (node.children.some((c) => c.outcome === 'sat')) node.outcome = 'sat';
      else node.outcome = 'unsat';
    } else {
      // 2-way: try left (X=v) and right (X≠v).
      const v = vals[0];
      const newA = [...assignment]; newA[r] = v;
      const newD = fcPropagate(newA, domains);
      const leftChild: Node = newD === null
        ? { id: nodeIdCounter++, label: `r${r}=${v} → ✗`, domains: [], assignment: newA, children: [], outcome: 'unsat' }
        : solveTree(newA, newD, depth + 1);
      leftChild.label = `r${r}=${v} → ` + (leftChild.outcome === 'sat' ? '✓' : leftChild.outcome === 'unsat' ? '✗' : leftChild.label);
      node.children.push(leftChild);

      if (leftChild.outcome === 'sat') { node.outcome = 'sat'; return node; }

      // Right branch: remove v from domains[r]
      const newD2 = domains.map((d) => [...d]);
      newD2[r] = newD2[r].filter((x) => x !== v);
      // Propagate: re-run FC just on the assignment-so-far (no new assignment, but smaller D[r] may enable AC)
      // For simplicity, just check if domains[r] is empty.
      if (newD2[r].length === 0) {
        node.children.push({ id: nodeIdCounter++, label: `r${r}≠${v} → ✗ empty`, domains: [], assignment: [...assignment], children: [], outcome: 'unsat' });
        node.outcome = 'unsat';
      } else {
        const rightChild = solveTree(assignment, newD2, depth + 1);
        rightChild.label = `r${r}≠${v} → ` + (rightChild.outcome === 'sat' ? '✓' : rightChild.outcome === 'unsat' ? '✗' : rightChild.label);
        node.children.push(rightChild);
        node.outcome = rightChild.outcome === 'sat' ? 'sat' : 'unsat';
      }
    }
    return node;
  }

  function reset(): Node {
    nodeIdCounter = 0;
    const assignment = new Array(n).fill(-1);
    const domains: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, (_, i) => i));
    return solveTree(assignment, domains, 0);
  }

  const tree = $derived.by(() => { mode; n; return reset(); });

  function countNodes(t: Node): number { return 1 + t.children.reduce((s, c) => s + countNodes(c), 0); }
  function countLeaves(t: Node): number { return t.children.length === 0 ? 1 : t.children.reduce((s, c) => s + countLeaves(c), 0); }
  function maxDepth(t: Node): number { return t.children.length === 0 ? 0 : 1 + Math.max(...t.children.map(maxDepth)); }
  function maxBranching(t: Node): number {
    if (t.children.length === 0) return 0;
    return Math.max(t.children.length, ...t.children.map(maxBranching));
  }

  const examAnswer = $derived.by(() => {
    const t = tree;
    const total = countNodes(t);
    const leaves = countLeaves(t);
    const depth = maxDepth(t);
    const branchFactor = maxBranching(t);

    // Also compute the opposite-mode tree for the comparison table.
    const other = buildTreeWith(mode === 'dway' ? '2way' : 'dway');
    const otherTotal = countNodes(other);
    const otherLeaves = countLeaves(other);
    const otherDepth = maxDepth(other);
    const otherBranch = maxBranching(other);

    const labels = mode === '2way'
      ? { cur: '2-way (X = v / X ≠ v)', other: 'd-way (X = v_1 / v_2 / …)' }
      : { cur: 'd-way (X = v_1 / v_2 / …)', other: '2-way (X = v / X ≠ v)' };

    const lines: string[] = [];

    lines.push(`**CSP.** $n$-queens with $n = ${n}$ — variables $V_1, \\dots, V_n$ for each row's column, with constraints $V_i \\ne V_j$ and $|V_i - V_j| \\ne |i - j|$. Initial domains $D(V_i) = \\{0, \\dots, ${n - 1}\\}$. MRV variable selection; forward checking after every assignment.`);
    lines.push('');

    lines.push(`**Search-tree shape (current setting: ${labels.cur}).**`);
    lines.push(`- Total nodes: **${total}**`);
    lines.push(`- Leaves: **${leaves}**`);
    lines.push(`- Maximum depth: **${depth}**`);
    lines.push(`- Maximum branching factor at a node: **${branchFactor}**`);
    lines.push(`- Outcome: **${t.outcome === 'sat' ? 'SAT (solution found)' : 'UNSAT'}**`);
    lines.push('');

    lines.push(`**Side-by-side: ${mode === '2way' ? 'd-way (opposite)' : '2-way (opposite)'}.**`);
    lines.push('');
    lines.push(`| Metric | ${labels.cur} *(current)* | ${labels.other} |`);
    lines.push('|---|---|---|');
    lines.push(`| Total nodes | ${total} | ${otherTotal} |`);
    lines.push(`| Leaves | ${leaves} | ${otherLeaves} |`);
    lines.push(`| Max depth | ${depth} | ${otherDepth} |`);
    lines.push(`| Max width (branching) | ${branchFactor} | ${otherBranch} |`);
    lines.push('');

    lines.push(`**Discussion.** With **d-way** branching every decision node has up to $d$ children (one per remaining value) and the **depth equals the number of variables** ($n$). With **2-way** branching each decision splits into two children ($X = v$ on the left, $X \\ne v$ on the right), so trees are **at most binary** but can be **deeper** because $X \\ne v$ doesn't assign $X$ — that variable can be revisited until its domain is forced. In the SAT case both styles often produce comparably-sized trees once a solution is found; on UNSAT or hard instances 2-way branching can prune more aggressively because the right branch keeps $X$ unassigned and lets propagation strengthen the rest of the network before $X$ is forced.`);

    return lines.join('\n');
  });

  // Build a tree under a CHOSEN branching mode (used for side-by-side comparison
  // without touching the reactive `mode` state — which would cause loops).
  function buildTreeWith(branchMode: '2way' | 'dway'): Node {
    let localCounter = 0;
    function selectVarL(assignment: number[], domains: number[][]): number {
      let best = -1, bestSize = Infinity;
      for (let r = 0; r < n; r++) {
        if (assignment[r] === -1 && domains[r].length < bestSize) { best = r; bestSize = domains[r].length; }
      }
      return best;
    }
    function solve(assignment: number[], domains: number[][], depth: number): Node {
      const node: Node = { id: localCounter++, label: '', domains: domains.map((d) => [...d]), assignment: [...assignment], children: [], outcome: 'open' };
      if (assignment.every((x) => x !== -1)) { node.outcome = 'sat'; node.label = '✓ SAT'; return node; }
      const r = selectVarL(assignment, domains);
      if (r === -1) { node.outcome = 'sat'; node.label = '✓ SAT'; return node; }
      const vals = domains[r];
      if (vals.length === 0) { node.outcome = 'unsat'; node.label = '✗ empty'; return node; }
      if (branchMode === 'dway') {
        for (const v of vals) {
          const newA = [...assignment]; newA[r] = v;
          const newD = fcPropagate(newA, domains);
          if (newD === null) {
            node.children.push({ id: localCounter++, label: '', domains: [], assignment: newA, children: [], outcome: 'unsat' });
          } else {
            node.children.push(solve(newA, newD, depth + 1));
          }
          if (node.children.some((c) => c.outcome === 'sat') && depth < 100) break;
        }
        node.outcome = node.children.some((c) => c.outcome === 'sat') ? 'sat' : 'unsat';
      } else {
        const v = vals[0];
        const newA = [...assignment]; newA[r] = v;
        const newD = fcPropagate(newA, domains);
        const left: Node = newD === null
          ? { id: localCounter++, label: '', domains: [], assignment: newA, children: [], outcome: 'unsat' }
          : solve(newA, newD, depth + 1);
        node.children.push(left);
        if (left.outcome === 'sat') { node.outcome = 'sat'; return node; }
        const newD2 = domains.map((d) => [...d]);
        newD2[r] = newD2[r].filter((x) => x !== v);
        if (newD2[r].length === 0) {
          node.children.push({ id: localCounter++, label: '', domains: [], assignment: [...assignment], children: [], outcome: 'unsat' });
          node.outcome = 'unsat';
        } else {
          const right = solve(assignment, newD2, depth + 1);
          node.children.push(right);
          node.outcome = right.outcome === 'sat' ? 'sat' : 'unsat';
        }
      }
      return node;
    }
    const a = new Array(n).fill(-1);
    const d: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, (_, i) => i));
    return solve(a, d, 0);
  }

  function layout(root: Node, W: number, H: number) {
    const nodes: { x: number; y: number; node: Node }[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number; label: string }[] = [];
    const totalLeaves = countLeaves(root);
    const maxD = maxDepth(root);
    let nextX = 0;
    function walk(n: Node, depth: number): number {
      const y = 30 + depth * Math.max(40, (H - 60) / Math.max(1, maxD));
      if (n.children.length === 0) {
        const x = 30 + (nextX++ / Math.max(1, totalLeaves - 1)) * (W - 60);
        nodes.push({ x, y, node: n });
        return x;
      }
      const xs = n.children.map((c) => walk(c, depth + 1));
      const x = (xs[0] + xs[xs.length - 1]) / 2;
      nodes.push({ x, y, node: n });
      for (let i = 0; i < n.children.length; i++) {
        edges.push({ x1: x, y1: y + 14, x2: xs[i], y2: y + Math.max(40, (H - 60) / Math.max(1, maxD)) - 14, label: '' });
      }
      return x;
    }
    walk(root, 0);
    return { nodes, edges };
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-3 items-center text-xs">
    <span>Branching:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {mode === '2way' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (mode = '2way')}>2-way (X=v / X≠v)</button>
      <button class="px-2 py-1 {mode === 'dway' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (mode = 'dway')}>d-way (X=v₁ / v₂ / …)</button>
    </div>
    <label>n =
      <input type="number" min="3" max="7" bind:value={n} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <span class="text-ink-500 ml-2">n-queens with MRV + FC</span>
  </div>

  {#key mode + n}
    {@const total = countNodes(tree)}
    {@const leaves = countLeaves(tree)}
    {@const depth = maxDepth(tree)}
    <div class="text-sm font-mono">{total} nodes · {leaves} leaves · depth {depth} · outcome: <b>{tree.outcome === 'sat' ? '✓ SAT' : '✗ UNSAT'}</b></div>

    {@const W = Math.max(500, leaves * 60)}
    {@const H = Math.max(220, (depth + 1) * 55)}
    {@const pos = layout(tree, W, H)}
    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {Math.min(H, 500)}px">
      {#each pos.edges as e}
        <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#94a3b8" />
      {/each}
      {#each pos.nodes as p}
        <circle cx={p.x} cy={p.y} r="16"
                fill={p.node.outcome === 'sat' ? '#bbf7d0' : p.node.outcome === 'unsat' ? '#fecaca' : '#e2e8f0'}
                stroke={p.node.outcome === 'sat' ? '#166534' : p.node.outcome === 'unsat' ? '#991b1b' : '#475569'} stroke-width="1.5" />
        <text x={p.x} y={p.y + 3} text-anchor="middle" font-size="9" font-weight="bold">{p.node.label.length > 20 ? p.node.label.slice(0, 18) + '…' : p.node.label}</text>
      {/each}
    </svg>
  {/key}

  <div class="text-xs text-ink-500">
    n-queens with MRV variable choice and forward-checking propagation. Toggle branching to compare the search-tree shape. For SAT instances both styles produce trees of similar size; for hard / UNSAT instances 2-way can prune more.
  </div>

  <ExamAnswer answer={examAnswer} summary={`n=${n} · ${mode === '2way' ? '2-way' : 'd-way'} · ${countNodes(tree)} nodes · depth ${maxDepth(tree)}`} />
</div>
