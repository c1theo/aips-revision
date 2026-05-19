<script lang="ts">
  type Algo = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*';
  type Heuristic = 'Manhattan' | 'Euclidean' | 'Chebyshev' | 'Zero';
  type PaintMode = 'wall' | 'weight' | 'erase';

  const ROWS = 16;
  const COLS = 28;

  type Cell = 'empty' | 'wall' | 'start' | 'goal';

  function initGrid(): { cells: Cell[][]; weights: number[][] } {
    const cells: Cell[][] = [];
    const weights: number[][] = [];
    for (let r = 0; r < ROWS; r++) {
      cells.push(Array(COLS).fill('empty'));
      weights.push(Array(COLS).fill(1));
    }
    return { cells, weights };
  }

  function defaultGrid() {
    const { cells, weights } = initGrid();
    const start: [number, number] = [8, 3];
    const goal: [number, number] = [8, 24];
    cells[start[0]][start[1]] = 'start';
    cells[goal[0]][goal[1]] = 'goal';
    for (let r = 3; r < 14; r++) cells[r][12] = 'wall';
    for (let r = 5; r < 12; r++) cells[r][16] = 'wall';
    cells[3][12] = 'empty';
    cells[13][12] = 'empty';
    return { cells, weights, start, goal };
  }

  const initial = defaultGrid();
  let cells = $state<Cell[][]>(initial.cells);
  let weights = $state<number[][]>(initial.weights);
  let startPos = $state<[number, number]>(initial.start);
  let goalPos = $state<[number, number]>(initial.goal);
  let algo = $state<Algo>('A*');
  let heuristic = $state<Heuristic>('Manhattan');
  let diagonals = $state(false);
  let paintMode = $state<PaintMode>('wall');
  let weightValue = $state(5);
  let painting = $state<'wall' | 'empty' | 'weight' | null>(null);
  let dragging = $state<'start' | 'goal' | null>(null);
  let speed = $state(40);

  type Step = {
    frontier: Set<string>;
    explored: Set<string>;
    current: [number, number] | null;
    msg: string;
    g?: number;
    hVal?: number;
    f?: number;
    addedChildren?: { node: [number, number]; g: number; h: number; f: number }[];
    path?: [number, number][];
  };
  let steps = $state<Step[]>([]);
  let stepIdx = $state(0);
  let playing = $state(false);
  let info = $state('');

  const key = (r: number, c: number) => `${r},${c}`;

  function h(a: [number, number], b: [number, number]): number {
    const dr = Math.abs(a[0] - b[0]);
    const dc = Math.abs(a[1] - b[1]);
    if (heuristic === 'Manhattan') return dr + dc;
    if (heuristic === 'Euclidean') return Math.sqrt(dr * dr + dc * dc);
    if (heuristic === 'Chebyshev') return Math.max(dr, dc);
    return 0;
  }

  function neighbours(r: number, c: number): { node: [number, number]; cost: number }[] {
    const out: { node: [number, number]; cost: number }[] = [];
    const dirs: [number, number][] = diagonals
      ? [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
      : [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && cells[nr][nc] !== 'wall') {
        const diagonal = dr !== 0 && dc !== 0;
        const base = weights[nr][nc] || 1;
        const cost = diagonal ? base * Math.SQRT2 : base;
        out.push({ node: [nr, nc], cost });
      }
    }
    return out;
  }

  function run() {
    const s = startPos, g = goalPos;
    const steps_: Step[] = [];
    const cameFrom = new Map<string, string>();

    function fmt(node: [number, number]) { return `(${node[0]},${node[1]})`; }

    if (algo === 'BFS') {
      const frontier: [number, number][] = [s];
      const frontierSet = new Set<string>([key(...s)]);
      const explored = new Set<string>();
      let expansion = 0;
      while (frontier.length) {
        const node = frontier.shift()!;
        frontierSet.delete(key(...node));
        explored.add(key(...node));
        expansion += 1;
        const added: { node: [number, number]; g: number; h: number; f: number }[] = [];
        const isGoal = node[0] === g[0] && node[1] === g[1];
        const msg = isGoal
          ? `Step ${expansion}: GOAL ${fmt(node)} reached. Path reconstruction begins.`
          : `Step ${expansion}: Pop ${fmt(node)} (FIFO). Mark explored. Expanding…`;
        if (!isGoal) {
          for (const { node: nb } of neighbours(...node)) {
            const k = key(...nb);
            if (!explored.has(k) && !frontierSet.has(k)) {
              cameFrom.set(k, key(...node));
              frontier.push(nb); frontierSet.add(k);
              added.push({ node: nb, g: 0, h: 0, f: 0 });
            }
          }
        }
        steps_.push({ frontier: new Set(frontierSet), explored: new Set(explored), current: node, msg, addedChildren: added });
        if (isGoal) break;
      }
    } else if (algo === 'DFS') {
      const stack: [number, number][] = [s];
      const onStack = new Set<string>([key(...s)]);
      const explored = new Set<string>();
      let expansion = 0;
      while (stack.length) {
        const node = stack.pop()!;
        onStack.delete(key(...node));
        if (explored.has(key(...node))) continue;
        explored.add(key(...node));
        expansion += 1;
        const isGoal = node[0] === g[0] && node[1] === g[1];
        const added: { node: [number, number]; g: number; h: number; f: number }[] = [];
        const msg = isGoal
          ? `Step ${expansion}: GOAL ${fmt(node)} reached.`
          : `Step ${expansion}: Pop ${fmt(node)} from stack (LIFO). Mark explored.`;
        if (!isGoal) {
          for (const { node: nb } of neighbours(...node)) {
            const k = key(...nb);
            if (!explored.has(k)) {
              cameFrom.set(k, key(...node));
              stack.push(nb); onStack.add(k);
              added.push({ node: nb, g: 0, h: 0, f: 0 });
            }
          }
        }
        steps_.push({ frontier: new Set(onStack), explored: new Set(explored), current: node, msg, addedChildren: added });
        if (isGoal) break;
      }
    } else {
      type PQItem = { node: [number, number]; g: number; f: number };
      const pq: PQItem[] = [{ node: s, g: 0, f: 0 }];
      const gScore = new Map<string, number>([[key(...s), 0]]);
      const explored = new Set<string>();
      const frontierSet = new Set<string>([key(...s)]);

      function priority(item: PQItem): number {
        if (algo === 'UCS') return item.g;
        if (algo === 'Greedy') return h(item.node, g);
        return item.g + h(item.node, g);
      }

      let expansion = 0;
      while (pq.length) {
        pq.sort((a, b) => priority(a) - priority(b));
        const item = pq.shift()!;
        const k0 = key(...item.node);
        frontierSet.delete(k0);
        if (explored.has(k0)) continue;
        explored.add(k0);
        expansion += 1;
        const hv = h(item.node, g);
        const fv = algo === 'Greedy' ? hv : item.g + hv;
        const isGoal = item.node[0] === g[0] && item.node[1] === g[1];
        const added: { node: [number, number]; g: number; h: number; f: number }[] = [];
        let msg: string;
        if (isGoal) {
          msg = `Step ${expansion}: GOAL ${fmt(item.node)} reached. g=${item.g.toFixed(2)}.`;
        } else {
          const prio = algo === 'UCS' ? `g=${item.g.toFixed(2)}` : algo === 'Greedy' ? `h=${hv.toFixed(2)}` : `f=g+h=${item.g.toFixed(2)}+${hv.toFixed(2)}=${fv.toFixed(2)}`;
          msg = `Step ${expansion}: Pop ${fmt(item.node)} (lowest ${algo === 'UCS' ? 'g' : algo === 'Greedy' ? 'h' : 'f'}=${(algo === 'UCS' ? item.g : algo === 'Greedy' ? hv : fv).toFixed(2)}). ${prio}.`;
        }
        if (!isGoal) {
          for (const { node: nb, cost } of neighbours(...item.node)) {
            const kn = key(...nb);
            const tentative = item.g + cost;
            if (!gScore.has(kn) || tentative < gScore.get(kn)!) {
              gScore.set(kn, tentative);
              cameFrom.set(kn, k0);
              const nbH = h(nb, g);
              const nbF = algo === 'Greedy' ? nbH : tentative + nbH;
              pq.push({ node: nb, g: tentative, f: nbF });
              frontierSet.add(kn);
              added.push({ node: nb, g: tentative, h: nbH, f: nbF });
            }
          }
        }
        steps_.push({ frontier: new Set(frontierSet), explored: new Set(explored), current: item.node, msg, g: item.g, hVal: hv, f: fv, addedChildren: added });
        if (isGoal) break;
      }
    }

    const path: [number, number][] = [];
    let cur = key(...g);
    if (cameFrom.has(cur) || cur === key(...s)) {
      while (cur !== key(...s)) {
        const [r, c] = cur.split(',').map(Number) as [number, number];
        path.unshift([r, c]);
        if (!cameFrom.has(cur)) break;
        cur = cameFrom.get(cur)!;
      }
      path.unshift(s);
    }
    if (steps_.length > 0) steps_[steps_.length - 1] = { ...steps_[steps_.length - 1], path };

    steps = steps_;
    stepIdx = 0;
    const pathCost = path.length > 1 ? path.slice(1).reduce((sum, n, i) => {
      const prev = path[i];
      const diag = prev[0] !== n[0] && prev[1] !== n[1];
      const base = weights[n[0]][n[1]] || 1;
      return sum + (diag ? base * Math.SQRT2 : base);
    }, 0) : 0;
    info = `${algo}: ${steps_.length} expansions, path ${path.length ? path.length - 1 + ' steps · cost ' + pathCost.toFixed(2) : 'not found'}`;
  }

  $effect(() => { algo; heuristic; diagonals; run(); });

  function reset() {
    const d = defaultGrid();
    cells = d.cells;
    weights = d.weights;
    startPos = d.start;
    goalPos = d.goal;
    run();
  }
  function clearWalls() {
    cells = cells.map((row) => row.map((c) => (c === 'wall' ? 'empty' : c)));
    weights = weights.map((row) => row.map(() => 1));
    run();
  }
  function randomWalls() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cells[r][c] === 'start' || cells[r][c] === 'goal') continue;
      cells[r][c] = Math.random() < 0.28 ? 'wall' : 'empty';
      weights[r][c] = 1;
    }
    cells = cells; weights = weights;
    run();
  }

  function applyPaint(r: number, c: number) {
    if (cells[r][c] === 'start' || cells[r][c] === 'goal') return;
    if (paintMode === 'wall') { cells[r][c] = 'wall'; weights[r][c] = 1; }
    else if (paintMode === 'erase') { cells[r][c] = 'empty'; weights[r][c] = 1; }
    else if (paintMode === 'weight') { cells[r][c] = 'empty'; weights[r][c] = weightValue; }
    cells = cells; weights = weights;
  }

  function onMouseDown(r: number, c: number, e: MouseEvent) {
    e.preventDefault();
    if (cells[r][c] === 'start') { dragging = 'start'; return; }
    if (cells[r][c] === 'goal') { dragging = 'goal'; return; }
    painting = paintMode === 'erase' ? 'empty' : paintMode;
    applyPaint(r, c);
    run();
  }
  function onMouseEnter(r: number, c: number) {
    if (dragging === 'start') {
      if (cells[r][c] !== 'goal') {
        cells[startPos[0]][startPos[1]] = 'empty';
        startPos = [r, c];
        cells[r][c] = 'start';
        cells = cells;
        run();
      }
      return;
    }
    if (dragging === 'goal') {
      if (cells[r][c] !== 'start') {
        cells[goalPos[0]][goalPos[1]] = 'empty';
        goalPos = [r, c];
        cells[r][c] = 'goal';
        cells = cells;
        run();
      }
      return;
    }
    if (!painting) return;
    applyPaint(r, c);
    run();
  }
  function onMouseUp() { painting = null; dragging = null; }

  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      if (stepIdx >= steps.length - 1) { playing = false; return; }
      stepIdx += 1;
      setTimeout(tick, 200 - speed * 1.8);
    };
    tick();
  }

  function cellClass(r: number, c: number): string {
    const v = cells[r][c];
    if (v === 'start') return 'bg-emerald-500';
    if (v === 'goal') return 'bg-rose-500';
    if (v === 'wall') return 'bg-ink-700 dark:bg-ink-300';
    const step = steps[stepIdx];
    const w = weights[r][c];
    let base = 'bg-white dark:bg-ink-900';
    if (w > 1) {
      // gradient orange shades by weight
      const tint = Math.min(900, 200 + w * 60);
      base = `bg-orange-${Math.min(400, Math.round(tint / 100) * 100)} dark:bg-orange-900/40`;
    }
    if (step) {
      const k = key(r, c);
      if (step.path?.some((p) => p[0] === r && p[1] === c)) return 'bg-amber-300';
      if (step.current && step.current[0] === r && step.current[1] === c) return 'bg-violet-400';
      if (step.explored.has(k)) return 'bg-accent-200 dark:bg-accent-900/50';
      if (step.frontier.has(k)) return 'bg-accent-100 dark:bg-accent-900/30';
    }
    return base;
  }

  function cellTitle(r: number, c: number): string {
    if (weights[r][c] > 1) return `weight ${weights[r][c]}`;
    return '';
  }
</script>

<div class="space-y-3" onmouseleave={onMouseUp} role="presentation">
  <div class="flex flex-wrap gap-2 items-center">
    {#each ['BFS','DFS','UCS','Greedy','A*'] as a (a)}
      <button class="btn btn-sm {algo === a ? 'btn-primary' : ''}" onclick={() => (algo = a as Algo)}>{a}</button>
    {/each}
    <span class="text-xs text-ink-500 mx-2">{info}</span>
    <div class="ml-auto flex gap-2 items-center">
      <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}>⏮</button>
      <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶'}</button>
      <button class="btn btn-sm" onclick={() => (stepIdx = Math.min(steps.length - 1, stepIdx + 1))} disabled={stepIdx >= steps.length - 1}>⏭</button>
      <button class="btn btn-sm" onclick={() => (stepIdx = steps.length - 1)}>End</button>
    </div>
  </div>

  <div class="flex flex-wrap gap-3 items-center text-xs">
    <label class="flex items-center gap-1">Heuristic
      <select bind:value={heuristic} class="px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option>Manhattan</option><option>Euclidean</option><option>Chebyshev</option><option>Zero</option>
      </select>
    </label>
    <label class="flex items-center gap-1"><input type="checkbox" bind:checked={diagonals}>Diagonals (cost √2)</label>
    <span>Paint:</span>
    <div class="flex rounded-md overflow-hidden border border-ink-300 dark:border-ink-700">
      <button class="px-2 py-0.5 {paintMode === 'wall' ? 'bg-accent-100 dark:bg-accent-900/30' : ''}" onclick={() => (paintMode = 'wall')}>Wall</button>
      <button class="px-2 py-0.5 {paintMode === 'weight' ? 'bg-accent-100 dark:bg-accent-900/30' : ''}" onclick={() => (paintMode = 'weight')}>Weight</button>
      <button class="px-2 py-0.5 {paintMode === 'erase' ? 'bg-accent-100 dark:bg-accent-900/30' : ''}" onclick={() => (paintMode = 'erase')}>Erase</button>
    </div>
    {#if paintMode === 'weight'}
      <label class="flex items-center gap-1">cost
        <input type="number" min="2" max="20" bind:value={weightValue} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
    {/if}
    <span>Speed</span>
    <input type="range" min="1" max="100" bind:value={speed} class="w-24" />
    <span class="text-ink-500">{stepIdx + 1} / {steps.length}</span>
    <button class="btn btn-sm ml-auto" onclick={reset}>Reset</button>
    <button class="btn btn-sm" onclick={clearWalls}>Clear</button>
    <button class="btn btn-sm" onclick={randomWalls}>Random walls</button>
  </div>

  <div
    class="inline-block select-none border border-ink-200 dark:border-ink-700 rounded overflow-auto max-w-full"
    onmouseup={onMouseUp}
    role="presentation"
  >
    {#each cells as row, r}
      <div class="flex">
        {#each row as _, c}
          <button
            type="button"
            class="w-5 h-5 border border-ink-100 dark:border-ink-800 cursor-pointer transition-colors text-[8px] flex items-center justify-center {cellClass(r, c)}"
            onmousedown={(e) => onMouseDown(r, c, e)}
            onmouseenter={() => onMouseEnter(r, c)}
            aria-label="cell"
            title={cellTitle(r, c)}
          >{weights[r][c] > 1 && cells[r][c] !== 'wall' && cells[r][c] !== 'start' && cells[r][c] !== 'goal' ? weights[r][c] : ''}</button>
        {/each}
      </div>
    {/each}
  </div>

  <div class="text-xs text-ink-500 flex flex-wrap gap-3 mt-1">
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-emerald-500 rounded-sm"></span>start</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-rose-500 rounded-sm"></span>goal</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-ink-700 rounded-sm"></span>wall</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-orange-300 rounded-sm"></span>weighted</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-violet-400 rounded-sm"></span>current</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-accent-200 rounded-sm"></span>explored</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-accent-100 border border-accent-200 rounded-sm"></span>frontier</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-amber-300 rounded-sm"></span>path</span>
  </div>

  {#if steps[stepIdx]}
    {@const cur = steps[stepIdx]}
    <div class="grid lg:grid-cols-3 gap-3 mt-2">
      <div class="card !p-3 lg:col-span-2">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Live trace — current step</div>
        <div class="text-sm font-medium">{cur.msg}</div>
        {#if cur.addedChildren && cur.addedChildren.length > 0}
          <div class="mt-2 text-xs">
            <div class="text-ink-500 font-semibold mb-0.5">Children added to frontier:</div>
            <ul class="font-mono text-xs space-y-0.5">
              {#each cur.addedChildren as ch}
                <li>· ({ch.node[0]},{ch.node[1]}) — {algo === 'BFS' || algo === 'DFS' ? '' : `g=${ch.g.toFixed(2)}, h=${ch.h.toFixed(2)}, f=${ch.f.toFixed(2)}`}</li>
              {/each}
            </ul>
          </div>
        {/if}
        <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-ink-500 font-semibold mb-0.5">Frontier ({cur.frontier.size})</div>
            <div class="font-mono text-[10px] max-h-20 overflow-y-auto leading-tight">
              {[...cur.frontier].map((k) => '(' + k + ')').join(', ') || '(empty)'}
            </div>
          </div>
          <div>
            <div class="text-ink-500 font-semibold mb-0.5">Explored ({cur.explored.size})</div>
            <div class="text-ink-500 text-[11px]">{cur.explored.size} cells visited so far</div>
          </div>
        </div>
      </div>
      <div class="card !p-3">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Recent expansions</div>
        <ol class="font-mono text-[11px] space-y-0.5 list-none p-0 max-h-44 overflow-y-auto">
          {#each steps.slice(Math.max(0, stepIdx - 9), stepIdx + 1).reverse() as st, i}
            <li class="{i === 0 ? 'font-semibold text-accent-700 dark:text-accent-300' : 'text-ink-500'}">{st.msg}</li>
          {/each}
        </ol>
      </div>
    </div>
  {/if}
</div>
