<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  let { pruning: initialPruning = false, initialLeaves = '' } = $props<{ pruning?: boolean; initialLeaves?: string }>();
  let pruning = $state(initialPruning);
  $effect(() => { pruning = initialPruning; });

  interface Node {
    id: number;
    children: Node[];
    leafValue?: number;
    depth: number;
    isMax: boolean;
    value?: number;
    alpha?: number;
    beta?: number;
    pruned?: boolean;
    cut?: boolean;
    visited?: boolean;
  }

  let leafText = $state(initialLeaves || '3, 12, 8, 2, 4, 6, 14, 5, 2');
  let shapeText = $state('3, 3');   // branching per level (root → leaves); 'auto' = fit to leaf count

  function parseShape(s: string): number[] | 'auto' {
    const trimmed = s.trim().toLowerCase();
    if (trimmed === '' || trimmed === 'auto') return 'auto';
    const nums = trimmed.split(/[,\s×x*]+/).filter(Boolean).map(Number);
    if (nums.some((n) => Number.isNaN(n) || n < 1 || !Number.isFinite(n))) return 'auto';
    return nums;
  }

  function buildShapedTree(vals: number[], shape: number[]): Node {
    let nextId = 0;
    const needed = shape.reduce((a, b) => a * b, 1);
    const padded = vals.length >= needed ? vals.slice(0, needed) : Array.from({ length: needed }, (_, i) => vals[i % vals.length] ?? 0);
    let i = 0;
    function make(d: number, isMax: boolean): Node {
      const id = nextId++;
      if (d === shape.length) return { id, depth: d, isMax, children: [], leafValue: padded[i++] };
      const branching = shape[d];
      const children: Node[] = [];
      for (let k = 0; k < branching; k++) children.push(make(d + 1, !isMax));
      return { id, depth: d, isMax, children };
    }
    return make(0, true);
  }

  function fitShape(numLeaves: number): number[] {
    // Auto-derive a roughly balanced shape: try depths 2..4 with uniform branching
    if (numLeaves <= 4) return [numLeaves];
    if (numLeaves <= 9) return [3, 3].slice(0, numLeaves <= 6 ? 1 : 2);
    // pick balanced
    let depth = 2;
    let branching = Math.ceil(Math.pow(numLeaves, 1 / depth));
    while (Math.pow(branching, depth) < numLeaves && depth < 5) {
      depth += 1;
      branching = Math.ceil(Math.pow(numLeaves, 1 / depth));
    }
    return Array(depth).fill(branching);
  }

  function runMinimax(root: Node, doPrune: boolean): string[] {
    const log: string[] = [];
    function rec(n: Node, alpha: number, beta: number): number {
      n.visited = true;
      n.alpha = alpha; n.beta = beta;
      if (n.children.length === 0) { n.value = n.leafValue!; log.push(`leaf #${n.id}: ${n.value}`); return n.value; }
      if (n.isMax) {
        let v = -Infinity;
        for (let i = 0; i < n.children.length; i++) {
          const c = n.children[i];
          const cv = rec(c, alpha, beta);
          v = Math.max(v, cv);
          alpha = Math.max(alpha, v);
          n.alpha = alpha; n.beta = beta;
          if (doPrune && v >= beta) {
            for (let j = i + 1; j < n.children.length; j++) markPruned(n.children[j]);
            n.cut = true;
            log.push(`β-cut at MAX #${n.id} (v=${v} ≥ β=${beta})`);
            break;
          }
        }
        n.value = v; return v;
      } else {
        let v = Infinity;
        for (let i = 0; i < n.children.length; i++) {
          const c = n.children[i];
          const cv = rec(c, alpha, beta);
          v = Math.min(v, cv);
          beta = Math.min(beta, v);
          n.alpha = alpha; n.beta = beta;
          if (doPrune && v <= alpha) {
            for (let j = i + 1; j < n.children.length; j++) markPruned(n.children[j]);
            n.cut = true;
            log.push(`α-cut at MIN #${n.id} (v=${v} ≤ α=${alpha})`);
            break;
          }
        }
        n.value = v; return v;
      }
    }
    function markPruned(n: Node) { n.pruned = true; n.children.forEach(markPruned); }
    rec(root, -Infinity, Infinity);
    return log;
  }

  const computed = $derived.by(() => {
    const vals = leafText.split(/[,\s]+/).filter(Boolean).map(Number).filter((v) => !Number.isNaN(v));
    const safeVals = vals.length >= 2 ? vals : [3, 12, 8, 2, 4, 6, 14, 5, 2];
    const parsedShape = parseShape(shapeText);
    const shape = parsedShape === 'auto' ? fitShape(safeVals.length) : parsedShape;
    const root = buildShapedTree(safeVals, shape);
    const log = runMinimax(root, pruning);
    const needed = shape.reduce((a, b) => a * b, 1);
    return { root, log, shape, needed, supplied: vals.length };
  });

  interface Pos { x: number; y: number; node: Node }
  function layout(n: Node, c: { x: number }, d: number, ps: Pos[]): number {
    if (n.children.length === 0) {
      const x = c.x++;
      ps.push({ x, y: d, node: n });
      return x;
    }
    const xs = n.children.map((cc) => layout(cc, c, d + 1, ps));
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    ps.push({ x, y: d, node: n });
    return x;
  }
  function depthOf(n: Node): number { return n.children.length === 0 ? 0 : 1 + Math.max(...n.children.map(depthOf)); }

  const layoutData = $derived.by(() => {
    const ps: Pos[] = [];
    const c = { x: 0 };
    layout(computed.root, c, 0, ps);
    return { ps, maxX: Math.max(1, c.x - 1), maxY: depthOf(computed.root) || 1 };
  });

  let H = $state(360);
  const W = 800, PAD = 30;
  function px(x: number) { return PAD + (x / layoutData.maxX) * (W - 2 * PAD); }
  function py(y: number) { return PAD + (y / layoutData.maxY) * (H - 2 * PAD); }
  function posOf(id: number): Pos | undefined { return layoutData.ps.find((p) => p.node.id === id); }

  const edges = $derived.by(() => {
    const e: { fromId: number; toId: number; pruned: boolean }[] = [];
    function walk(n: Node) { for (const c of n.children) { e.push({ fromId: n.id, toId: c.id, pruned: !!(c.pruned || !c.visited) }); walk(c); } }
    walk(computed.root); return e;
  });

  function randomise() {
    // Pick a random shape with 9-16 leaves
    const shapes = [[3, 3], [2, 2, 2], [4, 2], [3, 2, 2], [2, 2, 3], [4, 4]];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const n = shape.reduce((a, b) => a * b, 1);
    const vals = Array.from({ length: n }, () => Math.floor(Math.random() * 20));
    leafText = vals.join(', ');
    shapeText = shape.join(', ');
  }

  const presetShapes = [
    { label: 'Auto-fit', value: 'auto' },
    { label: '3-3', value: '3, 3' },
    { label: '2-2-2', value: '2, 2, 2' },
    { label: '3-2-2', value: '3, 2, 2' },
    { label: '4-3', value: '4, 3' },
    { label: '2-2-2-2', value: '2, 2, 2, 2' },
  ];

  // Collect all internal nodes grouped by depth, in the order they appear in
  // the tree (which is the order the children were created), so we can show
  // backed-up values level by level.
  function collectByDepth(root: Node): Node[][] {
    const byDepth: Node[][] = [];
    function walk(n: Node) {
      (byDepth[n.depth] ??= []).push(n);
      for (const c of n.children) walk(c);
    }
    walk(root);
    return byDepth;
  }

  const examAnswer = $derived.by(() => {
    const { root, log, shape, needed } = computed;
    const lines: string[] = [];
    const vals = leafText.split(/[,\s]+/).filter(Boolean).map(Number).filter((v) => !Number.isNaN(v));
    const safeVals = vals.length >= 2 ? vals : [3, 12, 8, 2, 4, 6, 14, 5, 2];
    const usedLeaves = safeVals.slice(0, needed).concat(
      safeVals.length < needed ? Array.from({ length: needed - safeVals.length }, (_, i) => safeVals[(safeVals.length + i) % safeVals.length] ?? 0) : []
    );

    lines.push(`**Setup.**`);
    lines.push(`- Tree shape: [${shape.join('-')}] (root is MAX, levels alternate MAX / MIN).`);
    lines.push(`- Leaf values (left-to-right): ${usedLeaves.join(', ')}.`);
    lines.push(`- $\\alpha$-$\\beta$ pruning: **${pruning ? 'ON' : 'OFF'}**.`);
    lines.push('');

    // Backed-up values, level by level (bottom-up)
    const byDepth = collectByDepth(root);
    lines.push('**Backed-up values (bottom-up).**');
    for (let d = byDepth.length - 1; d >= 0; d--) {
      const lvl = byDepth[d];
      if (!lvl || lvl.length === 0) continue;
      const isLeafLevel = lvl[0].children.length === 0;
      if (isLeafLevel) {
        lines.push(`- Leaves (depth ${d}): ${lvl.map((n) => n.leafValue).join(', ')}.`);
        continue;
      }
      const role = lvl[0].isMax ? 'MAX' : 'MIN';
      const op = lvl[0].isMax ? 'max' : 'min';
      const parts = lvl.map((n) => {
        const childVals = n.children.map((c) => c.visited ? (c.value ?? '·') : '×');
        const visitedVals = n.children.filter((c) => c.visited).map((c) => c.value ?? '·');
        return `${op}(${childVals.join(', ')}) = ${n.value ?? '?'}`;
      });
      lines.push(`- ${role} level (depth ${d}): ${parts.join(' ; ')}.`);
    }
    lines.push('');

    lines.push(`**Root value (minimax value of the game):** $${root.value ?? '?'}$.`);
    lines.push('');

    if (pruning) {
      const cuts = log.filter((l) => l.includes('cut'));
      if (cuts.length === 0) {
        lines.push(`**Pruning.** No $\\alpha$-$\\beta$ cuts occurred for this leaf ordering — the move ordering is "worst case" for pruning.`);
      } else {
        lines.push(`**$\\alpha$-$\\beta$ cuts (${cuts.length}).**`);
        for (const c of cuts) lines.push(`- ${c}`);
      }
      lines.push('');
      const totalLeaves = needed;
      const examined = root ? countVisitedLeaves(root) : 0;
      lines.push(`**Leaves examined:** ${examined} of ${totalLeaves} (savings: ${totalLeaves - examined}).`);
    } else {
      lines.push(`**Pruning.** Disabled — plain minimax visits all ${needed} leaves. Toggle $\\alpha$-$\\beta$ ON to see how many can be cut for this leaf ordering.`);
    }

    return lines.join('\n');
  });

  function countVisitedLeaves(n: Node): number {
    if (n.children.length === 0) return n.visited ? 1 : 0;
    return n.children.reduce((s, c) => s + countVisitedLeaves(c), 0);
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm {pruning ? 'btn-primary' : ''}" onclick={() => (pruning = !pruning)}>{pruning ? 'α-β ON' : 'α-β OFF (plain minimax)'}</button>
    <button class="btn btn-sm" onclick={() => { leafText = '3, 12, 8, 2, 4, 6, 14, 5, 2'; shapeText = '3, 3'; }}>Reset</button>
    <button class="btn btn-sm" onclick={randomise}>Randomise</button>
  </div>

  <div class="grid sm:grid-cols-2 gap-2 items-start">
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Leaf values (comma-separated)</span>
      <input class="w-full px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm font-mono" bind:value={leafText} placeholder="9, 4, 2, 5, 9, 8, 2, 1, 4, 8, 5, 1" />
    </label>
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Tree shape — branching factor at each level (root → leaves). Eg. <code class="text-xs">3, 2, 2</code> = root has 3 children, each has 2, each has 2 leaves.</span>
      <div class="flex gap-1 items-stretch">
        <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm font-mono" bind:value={shapeText} placeholder="3, 2, 2 — or 'auto'" />
        <select class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-xs" onchange={(e) => (shapeText = (e.currentTarget as HTMLSelectElement).value)}>
          <option value="">Preset…</option>
          {#each presetShapes as p}
            <option value={p.value}>{p.label}</option>
          {/each}
        </select>
      </div>
    </label>
  </div>
  <div class="text-xs text-ink-500">
    Shape <span class="font-mono">[{computed.shape.join('-')}]</span> needs <b>{computed.needed}</b> leaves; you provided <b>{computed.supplied}</b>.
    {#if computed.supplied < computed.needed}<span class="text-amber-700 dark:text-amber-400"> Padded by repeating.</span>{/if}
    {#if computed.supplied > computed.needed}<span class="text-amber-700 dark:text-amber-400"> Extras ignored.</span>{/if}
  </div>

  <div class="flex gap-2 items-center text-xs text-ink-500">
    <span>Height:</span>
    <input type="range" min="240" max="700" step="20" bind:value={H} class="w-40" />
    <span class="font-mono">{H}px</span>
    <span class="ml-2">Drag to resize the tree view.</span>
  </div>

  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
    {#each edges as e}
      {@const from = posOf(e.fromId)}
      {@const to = posOf(e.toId)}
      {#if from && to}
        <line x1={px(from.x)} y1={py(from.y)} x2={px(to.x)} y2={py(to.y)}
              stroke={e.pruned ? '#cbd5e1' : '#475569'}
              stroke-dasharray={e.pruned ? '4 4' : '0'} stroke-width="1.5" />
      {/if}
    {/each}
    {#each layoutData.ps as p}
      {@const isLeaf = p.node.children.length === 0}
      <g transform="translate({px(p.x)}, {py(p.y)})">
        {#if isLeaf}
          <rect x="-18" y="-14" width="36" height="28" rx="4"
                fill={p.node.pruned ? '#e2e8f0' : '#fef3c7'}
                stroke={p.node.pruned ? '#94a3b8' : '#f59e0b'} stroke-width="1.5" />
          <text text-anchor="middle" dy="5" font-size="13" fill={p.node.pruned ? '#94a3b8' : '#000'} font-weight="bold">{p.node.leafValue}</text>
        {:else}
          {#if p.node.isMax}
            <polygon points="0,-18 -18,14 18,14"
                     fill={p.node.cut ? '#fecaca' : (p.node.visited ? '#dbeafe' : '#e2e8f0')}
                     stroke={p.node.cut ? '#dc2626' : '#1e40af'} stroke-width="1.5" />
          {:else}
            <polygon points="0,18 -18,-14 18,-14"
                     fill={p.node.cut ? '#fecaca' : (p.node.visited ? '#fce7f3' : '#e2e8f0')}
                     stroke={p.node.cut ? '#dc2626' : '#9d174d'} stroke-width="1.5" />
          {/if}
          {#if p.node.value !== undefined}
            <text text-anchor="middle" dy="5" font-size="12" fill="#000" font-weight="bold">{p.node.value}</text>
          {/if}
          {#if pruning && p.node.alpha !== undefined}
            <text text-anchor="middle" y="-22" font-size="9" fill="#475569">α={p.node.alpha === -Infinity ? '-∞' : p.node.alpha}, β={p.node.beta === Infinity ? '+∞' : p.node.beta}</text>
          {/if}
        {/if}
      </g>
    {/each}
  </svg>

  <div class="text-xs text-ink-500 flex flex-wrap gap-3">
    <span class="flex items-center gap-1"><svg width="14" height="14"><polygon points="7,1 1,12 13,12" fill="#dbeafe" stroke="#1e40af" /></svg>MAX</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><polygon points="7,13 1,2 13,2" fill="#fce7f3" stroke="#9d174d" /></svg>MIN</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><polygon points="7,1 1,12 13,12" fill="#fecaca" stroke="#dc2626" /></svg>cut</span>
    <span class="flex items-center gap-1"><svg width="14" height="14"><rect x="1" y="1" width="12" height="12" fill="#e2e8f0" stroke="#94a3b8" /></svg>pruned</span>
  </div>

  {#if computed.log.length > 0}
    <details class="card !p-3">
      <summary class="cursor-pointer text-sm font-medium">Step log ({computed.log.length} events)</summary>
      <ol class="text-xs font-mono mt-2 space-y-0.5 list-decimal pl-6">
        {#each computed.log as ev}<li>{ev}</li>{/each}
      </ol>
    </details>
  {/if}

  <ExamAnswer answer={examAnswer} summary={`${pruning ? 'α-β ON' : 'plain minimax'} · root = ${computed.root.value ?? '?'}`} />
</div>
