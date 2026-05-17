<script lang="ts">
  // MCTS demo on a simple "binary tree game" with known terminal outcomes.
  // Iteration: Selection (UCB1) → Expansion → Simulation (random) → Backprop.

  interface MNode {
    id: number;
    children: MNode[];
    parent?: MNode;
    N: number; // visits
    W: number; // accumulated reward in [0,1]
    move: number; // 0 or 1
    depth: number;
    // ground-truth (hidden) — for the "true" win-probability of random rollout from here
    leafValue?: number; // 0 or 1
  }
  let nextId = 0;
  function makeLeaves(depth: number, maxDepth: number, leafVals: number[], i: { v: number }): MNode {
    if (depth === maxDepth) {
      return { id: nextId++, children: [], N: 0, W: 0, move: 0, depth, leafValue: leafVals[i.v++ % leafVals.length] };
    }
    const n: MNode = { id: nextId++, children: [], N: 0, W: 0, move: 0, depth };
    const c0 = makeLeaves(depth + 1, maxDepth, leafVals, i);
    const c1 = makeLeaves(depth + 1, maxDepth, leafVals, i);
    c0.move = 0; c1.move = 1;
    c0.parent = n; c1.parent = n;
    n.children = [c0, c1];
    return n;
  }

  function reset(): MNode {
    nextId = 0;
    const leaves = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0]; // tweakable
    return makeLeaves(0, 4, leaves, { v: 0 });
  }
  let root = $state(reset());
  let C = $state(Math.SQRT2);
  let iter = $state(0);
  let lastLog = $state<string[]>([]);

  function ucb1(child: MNode, parentN: number): number {
    if (child.N === 0) return Infinity;
    return child.W / child.N + C * Math.sqrt(Math.log(parentN) / child.N);
  }

  function selectChild(n: MNode): MNode {
    if (n.children.length === 0) return n;
    return n.children.reduce((a, b) => (ucb1(a, n.N) > ucb1(b, n.N) ? a : b));
  }

  function isLeaf(n: MNode): boolean { return n.children.length === 0; }

  function iterate() {
    const log: string[] = [];
    // 1. Selection
    let node = root;
    while (!isLeaf(node) && node.children.every((c) => c.N > 0)) {
      const child = selectChild(node);
      log.push(`select child ${child.move} (UCB1=${ucb1(child, node.N).toFixed(3)})`);
      node = child;
    }
    // 2. Expansion — if non-leaf, pick unvisited child
    if (!isLeaf(node)) {
      const unv = node.children.filter((c) => c.N === 0);
      const expand = unv[Math.floor(Math.random() * unv.length)];
      log.push(`expand child ${expand.move}`);
      node = expand;
    }
    // 3. Simulation: random rollout to a leaf
    let sim = node;
    while (!isLeaf(sim)) {
      sim = sim.children[Math.floor(Math.random() * sim.children.length)];
    }
    const reward = sim.leafValue ?? 0;
    log.push(`simulate → leaf #${sim.id} value ${reward}`);

    // 4. Backpropagation
    let cur: MNode | undefined = node;
    while (cur) {
      cur.N += 1; cur.W += reward;
      cur = cur.parent;
    }
    log.push('backprop along path');
    iter += 1;
    lastLog = log;
    root = root;
  }

  let playing = $state(false);
  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      iterate();
      setTimeout(tick, 200);
    };
    tick();
  }

  // Layout
  interface Pos { x: number; y: number; node: MNode }
  function layout(n: MNode, c: { x: number }, d: number, ps: Pos[]) {
    if (n.children.length === 0) {
      ps.push({ x: c.x++, y: d, node: n });
      return ps[ps.length - 1].x;
    }
    const xs = n.children.map((cc) => layout(cc, c, d + 1, ps));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    ps.push({ x, y: d, node: n });
    return x;
  }
  const layoutData = $derived.by(() => {
    const ps: Pos[] = [];
    const c = { x: 0 };
    layout(root, c, 0, ps);
    return { ps, maxX: Math.max(1, c.x - 1), maxY: 4 };
  });
  const W = 800, H = 320, PAD = 24;
  function px(x: number) { return PAD + (x / layoutData.maxX) * (W - 2 * PAD); }
  function py(y: number) { return PAD + (y / layoutData.maxY) * (H - 2 * PAD); }
  function posOf(id: number) { return layoutData.ps.find((p) => p.node.id === id)!; }
  const edges = $derived.by(() => {
    const e: { a: number; b: number }[] = [];
    function walk(n: MNode) { for (const c of n.children) { e.push({ a: n.id, b: c.id }); walk(c); } }
    walk(root); return e;
  });

  function resetAll() {
    root = reset();
    iter = 0; lastLog = [];
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm btn-primary" onclick={iterate}>+1 iteration</button>
    <button class="btn btn-sm" onclick={play}>{playing ? '⏸ Pause' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={resetAll}>Reset</button>
    <span class="text-xs text-ink-500">iterations: <b>{iter}</b></span>
    <label class="text-xs ml-3 flex items-center gap-1">C =
      <input type="number" min="0" step="0.1" bind:value={C} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
  </div>

  <svg width={W} height={H} class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
    {#each edges as e}
      {@const a = posOf(e.a)}
      {@const b = posOf(e.b)}
      <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="#94a3b8" stroke-width="1" />
    {/each}
    {#each layoutData.ps as p}
      {@const n = p.node}
      {@const isLeafN = n.children.length === 0}
      <g transform="translate({px(p.x)},{py(p.y)})">
        <circle r="14"
          fill={n.N > 0 ? (n.W / Math.max(1, n.N) > 0.5 ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}
          stroke={n.N > 0 ? '#1d4ed8' : '#94a3b8'} stroke-width="1.5" />
        <text text-anchor="middle" dy="-1" font-size="10" font-weight="bold" fill="#000">{n.N}</text>
        {#if n.N > 0 && !isLeafN}
          <text text-anchor="middle" y="10" font-size="8" fill="#1e3a8a">{(n.W / n.N).toFixed(2)}</text>
        {/if}
        {#if isLeafN}
          <text text-anchor="middle" y="10" font-size="8" fill="#000">v={n.leafValue}</text>
        {/if}
      </g>
    {/each}
  </svg>

  <div class="text-xs text-ink-500">
    Node label: <b>visits N</b>. Green = mean &gt; 0.5, red = mean ≤ 0.5. Watch how visits concentrate on high-mean subtrees, with exploration spreading to under-visited siblings.
  </div>

  {#if lastLog.length > 0}
    <details class="card !p-3" open>
      <summary class="cursor-pointer text-sm font-medium">Last iteration log</summary>
      <ol class="text-xs font-mono mt-2 list-decimal pl-6 space-y-0.5">
        {#each lastLog as l}<li>{l}</li>{/each}
      </ol>
    </details>
  {/if}
</div>
