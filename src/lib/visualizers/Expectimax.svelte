<script lang="ts">
  // Expectimax: minimax + chance nodes. For stochastic games like backgammon.

  interface Node {
    id: number;
    kind: 'max' | 'min' | 'chance' | 'leaf';
    children: { node: Node; prob?: number }[];
    value?: number;
    leafValue?: number;
  }

  let nextId = 0;

  let leafText = $state('3, 8, 4, 6, 12, 5');
  let probsText = $state('0.5, 0.5');

  // Build: MAX root with 2 actions (children); each leads to a CHANCE node with 2 outcomes;
  // each outcome leads to a MIN node with 2 actions; each MIN action is a leaf.
  // Leaves: 8 total. Probs: 2 per chance node.
  function buildTree(): Node {
    nextId = 0;
    const vals = leafText.split(/[,\s]+/).filter(Boolean).map(Number);
    const safeVals = vals.length >= 4 ? vals : [3, 8, 4, 6, 12, 5, 7, 2];
    const probs = probsText.split(/[,\s]+/).filter(Boolean).map(Number);
    const p1 = probs[0] ?? 0.5, p2 = probs[1] ?? 0.5;

    let i = 0;
    function makeMin(): Node {
      const c1: Node = { id: nextId++, kind: 'leaf', children: [], leafValue: safeVals[i++ % safeVals.length] };
      const c2: Node = { id: nextId++, kind: 'leaf', children: [], leafValue: safeVals[i++ % safeVals.length] };
      return { id: nextId++, kind: 'min', children: [{ node: c1 }, { node: c2 }] };
    }
    function makeChance(): Node {
      return { id: nextId++, kind: 'chance', children: [{ node: makeMin(), prob: p1 }, { node: makeMin(), prob: p2 }] };
    }
    const left = makeChance();
    const right = makeChance();
    return { id: nextId++, kind: 'max', children: [{ node: left }, { node: right }] };
  }

  function evaluate(n: Node): number {
    if (n.kind === 'leaf') return n.value = n.leafValue!;
    if (n.kind === 'max') return n.value = Math.max(...n.children.map((c) => evaluate(c.node)));
    if (n.kind === 'min') return n.value = Math.min(...n.children.map((c) => evaluate(c.node)));
    // chance
    let v = 0;
    for (const c of n.children) v += (c.prob ?? 0) * evaluate(c.node);
    return n.value = v;
  }

  const tree = $derived.by(() => {
    const t = buildTree();
    evaluate(t);
    return t;
  });

  // Layout
  interface Pos { x: number; y: number; node: Node }
  function layout(n: Node, c: { x: number }, d: number, ps: Pos[]): number {
    if (n.children.length === 0) {
      const x = c.x++;
      ps.push({ x, y: d, node: n });
      return x;
    }
    const xs = n.children.map((cc) => layout(cc.node, c, d + 1, ps));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    ps.push({ x, y: d, node: n });
    return x;
  }
  function maxDepth(n: Node): number {
    if (n.children.length === 0) return 0;
    return 1 + Math.max(...n.children.map((c) => maxDepth(c.node)));
  }
  const layoutData = $derived.by(() => {
    const ps: Pos[] = [];
    const c = { x: 0 };
    layout(tree, c, 0, ps);
    return { ps, maxX: Math.max(1, c.x - 1), maxY: maxDepth(tree) };
  });

  const W = 700, H = 420, PAD = 30;
  function px(x: number) { return PAD + (x / layoutData.maxX) * (W - 2 * PAD); }
  function py(y: number) { return PAD + (y / layoutData.maxY) * (H - 2 * PAD); }
  function posOf(id: number): Pos | undefined { return layoutData.ps.find((p) => p.node.id === id); }

  const edges = $derived.by(() => {
    const e: { from: number; to: number; prob?: number }[] = [];
    function walk(n: Node) {
      for (const c of n.children) {
        e.push({ from: n.id, to: c.node.id, prob: c.prob });
        walk(c.node);
      }
    }
    walk(tree);
    return e;
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <label class="flex-1">Leaf values:
      <input class="font-mono w-full px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 mt-0.5" bind:value={leafText} />
    </label>
    <label>Chance probs:
      <input class="font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 w-32" bind:value={probsText} />
    </label>
  </div>

  <svg viewBox="0 0 {W} {H}" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
    {#each edges as e}
      {@const from = posOf(e.from)}
      {@const to = posOf(e.to)}
      {#if from && to}
        <line x1={px(from.x)} y1={py(from.y)} x2={px(to.x)} y2={py(to.y)} stroke="#475569" stroke-width="1.5" />
        {#if e.prob !== undefined}
          <text x={(px(from.x) + px(to.x)) / 2 + 5} y={(py(from.y) + py(to.y)) / 2} font-size="9" fill="#dc2626" font-weight="bold">{e.prob.toFixed(2)}</text>
        {/if}
      {/if}
    {/each}
    {#each layoutData.ps as p}
      <g transform="translate({px(p.x)},{py(p.y)})">
        {#if p.node.kind === 'leaf'}
          <rect x="-18" y="-14" width="36" height="28" rx="4" fill="#fef3c7" stroke="#a16207" stroke-width="1.5" />
          <text text-anchor="middle" dy="5" font-size="12" font-weight="bold">{p.node.leafValue}</text>
        {:else if p.node.kind === 'max'}
          <polygon points="0,-18 -18,14 18,14" fill="#dbeafe" stroke="#1e40af" stroke-width="1.5" />
          <text text-anchor="middle" dy="5" font-size="11" font-weight="bold">{p.node.value?.toFixed(2)}</text>
        {:else if p.node.kind === 'min'}
          <polygon points="0,18 -18,-14 18,-14" fill="#fce7f3" stroke="#9d174d" stroke-width="1.5" />
          <text text-anchor="middle" dy="5" font-size="11" font-weight="bold">{p.node.value?.toFixed(2)}</text>
        {:else}
          <circle r="18" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5" />
          <text text-anchor="middle" dy="5" font-size="11" font-weight="bold">{p.node.value?.toFixed(2)}</text>
        {/if}
      </g>
    {/each}
  </svg>

  <div class="text-xs text-ink-500 flex flex-wrap gap-3">
    <span class="flex items-center gap-1"><svg width="14" height="14"><polygon points="7,1 1,12 13,12" fill="#dbeafe" stroke="#1e40af" /></svg>MAX</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><polygon points="7,13 1,2 13,2" fill="#fce7f3" stroke="#9d174d" /></svg>MIN</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#fed7aa" stroke="#c2410c" /></svg>CHANCE</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><rect x="1" y="3" width="12" height="8" fill="#fef3c7" stroke="#a16207" /></svg>terminal</span>
  </div>

  <div class="text-xs text-ink-500">
    <b>Expectimax</b> generalises minimax to stochastic games. MAX maximises, MIN minimises, CHANCE computes the <b>expected value</b> $\sum_a P(a) \cdot \mathrm{Expectimax}(\mathrm{Result}(s, a))$ over weighted children. Used in backgammon, poker (partial info if combined with belief states). <b>Alpha-beta does NOT prune chance nodes</b> without bounds on the expected sum, so expectimax is typically slower.
  </div>
</div>
