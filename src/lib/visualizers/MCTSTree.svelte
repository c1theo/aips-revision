<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
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
  let branching = $state(2);
  let maxDepth = $state(4);
  let leafText = $state('1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0');
  let useCustomLeaves = $state(false);
  type RolloutPolicy = 'random' | 'always-true' | 'always-false' | 'leftmost' | 'rightmost';
  let rolloutPolicy = $state<RolloutPolicy>('random');

  function makeLeaves(depth: number, leafVals: number[], i: { v: number }): MNode {
    if (depth === maxDepth) {
      return { id: nextId++, children: [], N: 0, W: 0, move: 0, depth, leafValue: leafVals[i.v++ % leafVals.length] };
    }
    const n: MNode = { id: nextId++, children: [], N: 0, W: 0, move: 0, depth };
    const children: MNode[] = [];
    for (let k = 0; k < branching; k++) {
      const c = makeLeaves(depth + 1, leafVals, i);
      c.move = k;
      c.parent = n;
      children.push(c);
    }
    n.children = children;
    return n;
  }

  function reset(): MNode {
    nextId = 0;
    const totalLeaves = Math.pow(branching, maxDepth);
    let leaves: number[];
    if (useCustomLeaves) {
      const parsed = leafText.split(/[,\s]+/).filter(Boolean).map((v) => Math.max(0, Math.min(1, Number(v)))).filter((v) => !Number.isNaN(v));
      if (parsed.length === 0) {
        leaves = Array.from({ length: totalLeaves }, () => Math.random() < 0.5 ? 1 : 0);
      } else {
        leaves = Array.from({ length: totalLeaves }, (_, i) => parsed[i % parsed.length]);
      }
    } else {
      leaves = Array.from({ length: totalLeaves }, () => Math.random() < 0.5 ? 1 : 0);
    }
    return makeLeaves(0, leaves, { v: 0 });
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
    // 3. Simulation: rollout to a leaf using the selected policy
    let sim = node;
    while (!isLeaf(sim)) {
      let pickIdx: number;
      if (rolloutPolicy === 'leftmost') pickIdx = 0;
      else if (rolloutPolicy === 'rightmost') pickIdx = sim.children.length - 1;
      else pickIdx = Math.floor(Math.random() * sim.children.length);
      sim = sim.children[pickIdx];
    }
    let reward: number;
    if (rolloutPolicy === 'always-true') reward = 1;
    else if (rolloutPolicy === 'always-false') reward = 0;
    else reward = sim.leafValue ?? 0;
    log.push(`simulate (${rolloutPolicy}) → leaf #${sim.id} value=${sim.leafValue ?? 0}, reward=${reward}`);

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
    return { ps, maxX: Math.max(1, c.x - 1), maxY: maxDepth };
  });
  let H = $state(320);
  const W = 800, PAD = 24;
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

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Setup.**`);
    lines.push(`- Game tree: branching factor $b = ${branching}$, depth $d = ${maxDepth}$ ⇒ $${Math.pow(branching, maxDepth)}$ leaves.`);
    lines.push(`- Exploration constant $C = ${C.toFixed(3)}$ (UCB1: $\\bar{X}_i + C\\sqrt{\\ln N / N_i}$).`);
    lines.push(`- Rollout policy: **${rolloutPolicy}**${rolloutPolicy === 'random' ? ' (uniform random descent to a leaf; reward = leaf value).' : rolloutPolicy === 'always-true' ? ' (every rollout returns reward = 1 regardless of leaf).' : rolloutPolicy === 'always-false' ? ' (every rollout returns reward = 0 regardless of leaf).' : rolloutPolicy === 'leftmost' ? ' (descend leftmost child; reward = leaf value).' : ' (descend rightmost child; reward = leaf value).'}`);
    lines.push(`- Leaf values: ${useCustomLeaves ? '**custom** (' + leafText + ')' : '**random** (re-seeded on reset)'}.`);
    lines.push(`- Iterations run so far: **${iter}**.`);
    lines.push('');

    if (iter === 0 || root.N === 0) {
      lines.push(`No iterations yet — click "+1 iteration" or "▶ Auto" to populate visit counts.`);
      return lines.join('\n');
    }

    lines.push(`**Root statistics.** $N_{\\text{root}} = ${root.N}$, mean reward $= ${(root.W / root.N).toFixed(3)}$.`);
    lines.push('');

    lines.push(`**Root children — visit counts and mean rewards.**`);
    lines.push('');
    lines.push('| Move | Visits $N_i$ | Mean $\\bar{X}_i = W_i/N_i$ | UCB1 |');
    lines.push('|---|---|---|---|');
    for (const c of root.children) {
      const mean = c.N === 0 ? '—' : (c.W / c.N).toFixed(3);
      const ucb = c.N === 0 ? '$+\\infty$' : ucb1(c, root.N).toFixed(3);
      lines.push(`| ${c.move} | ${c.N} | ${mean} | ${ucb} |`);
    }
    lines.push('');

    // Recommended action = most-visited root child (robust child)
    const best = [...root.children].sort((a, b) => b.N - a.N)[0];
    if (best) {
      lines.push(`**Recommended move.** MCTS plays the **most-visited** root child (robust-child rule): **move ${best.move}** with $N = ${best.N}$ visits and mean reward $${(best.W / Math.max(1, best.N)).toFixed(3)}$.`);
    }
    lines.push('');

    lines.push(`**Why most-visited (not highest mean)?** In MCTS the most-visited child is the one the bandit policy converged to as best — using mean directly is noisy when some children have very few visits. Tournament-strength MCTS engines (AlphaGo, etc.) all use the visit-count rule at the root.`);

    return lines.join('\n');
  });
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
    <label class="text-xs flex items-center gap-1">branching b =
      <select bind:value={branching} onchange={resetAll} class="px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
      </select>
    </label>
    <label class="text-xs flex items-center gap-1">depth d =
      <select bind:value={maxDepth} onchange={resetAll} class="px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option value={3}>3</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
      </select>
    </label>
    <span class="text-xs text-ink-500">→ {Math.pow(branching, maxDepth)} leaves</span>
    {#if Math.pow(branching, maxDepth) > 128}
      <span class="text-xs text-amber-700 dark:text-amber-400">(large tree — visualisation will be crowded)</span>
    {/if}
  </div>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <label class="flex items-center gap-1">Rollout policy:
      <select bind:value={rolloutPolicy} class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option value="random">Random (default)</option>
        <option value="always-true">Always-true (reward = 1)</option>
        <option value="always-false">Always-false (reward = 0)</option>
        <option value="leftmost">Leftmost-descent</option>
        <option value="rightmost">Rightmost-descent</option>
      </select>
    </label>
    <span class="text-ink-500 italic">Bias the simulation step to see how rollout policy affects convergence.</span>
  </div>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <label class="flex items-center gap-1"><input type="checkbox" bind:checked={useCustomLeaves} onchange={resetAll}>Custom leaf values (override hidden 0/1 wins)</label>
    {#if useCustomLeaves}
      <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 font-mono" bind:value={leafText} placeholder="0/1 values, left-to-right, e.g. 1, 0, 1, 0, ..." />
      <button class="btn btn-sm" onclick={resetAll}>Apply</button>
    {/if}
    {#if useCustomLeaves}
      <span class="basis-full text-ink-500 italic">Padded by repetition if too few; extras ignored. Useful for "given these leaves, what does MCTS converge to?" exam questions.</span>
    {/if}
  </div>

  <div class="flex gap-2 items-center text-xs text-ink-500">
    <span>Height:</span>
    <input type="range" min="240" max="900" step="20" bind:value={H} class="w-40" />
    <span class="font-mono">{H}px</span>
    <span class="ml-2">Drag for deeper/wider trees.</span>
  </div>

  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
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

  <ExamAnswer answer={examAnswer} summary={`${iter} iterations · b=${branching}, d=${maxDepth} · ${rolloutPolicy} rollout · C=${C.toFixed(2)}`} />
</div>
