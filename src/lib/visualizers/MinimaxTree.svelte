<script lang="ts">
  let { pruning: initialPruning = false } = $props<{ pruning?: boolean }>();
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

  let leafText = $state('3, 12, 8, 2, 4, 6, 14, 5, 2');

  function buildTreeFromLeaves(vals: number[], branching: number, depth: number): Node {
    let nextId = 0;
    let i = 0;
    function make(d: number, isMax: boolean): Node {
      const id = nextId++;
      if (d === depth) return { id, depth: d, isMax, children: [], leafValue: vals[i++ % vals.length] };
      const children: Node[] = [];
      for (let k = 0; k < branching; k++) children.push(make(d + 1, !isMax));
      return { id, depth: d, isMax, children };
    }
    return make(0, true);
  }

  function fitTree(numLeaves: number): { branching: number; depth: number } {
    let b = 2, d = 2;
    while (Math.pow(b, d) < numLeaves) {
      if (b < 4) b += 1; else d += 1;
    }
    return { branching: b, depth: d };
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
    const { branching, depth } = fitTree(safeVals.length);
    const root = buildTreeFromLeaves(safeVals, branching, depth);
    const log = runMinimax(root, pruning);
    return { root, log };
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

  const W = 800, H = 360, PAD = 30;
  function px(x: number) { return PAD + (x / layoutData.maxX) * (W - 2 * PAD); }
  function py(y: number) { return PAD + (y / layoutData.maxY) * (H - 2 * PAD); }
  function posOf(id: number): Pos | undefined { return layoutData.ps.find((p) => p.node.id === id); }

  const edges = $derived.by(() => {
    const e: { fromId: number; toId: number; pruned: boolean }[] = [];
    function walk(n: Node) { for (const c of n.children) { e.push({ fromId: n.id, toId: c.id, pruned: !!(c.pruned || !c.visited) }); walk(c); } }
    walk(computed.root); return e;
  });

  function randomise() {
    const n = 9;
    const vals = Array.from({ length: n }, () => Math.floor(Math.random() * 20));
    leafText = vals.join(', ');
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm {pruning ? 'btn-primary' : ''}" onclick={() => (pruning = !pruning)}>{pruning ? 'α-β ON' : 'α-β OFF (plain minimax)'}</button>
    <button class="btn btn-sm" onclick={() => (leafText = '3, 12, 8, 2, 4, 6, 14, 5, 2')}>Reset</button>
    <button class="btn btn-sm" onclick={randomise}>Randomise</button>
    <input class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm flex-1 min-w-[200px]" bind:value={leafText} placeholder="Leaf values" />
  </div>

  <svg width={W} height={H} class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
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
</div>
