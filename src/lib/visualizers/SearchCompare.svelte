<script lang="ts">
  type Algo = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*';
  const ROWS = 14, COLS = 22;
  type Cell = 'empty' | 'wall' | 'start' | 'goal';

  function initial() {
    const cells: Cell[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('empty') as Cell[]);
    cells[7][2] = 'start'; cells[7][19] = 'goal';
    for (let r = 2; r < 12; r++) cells[r][10] = 'wall';
    cells[7][10] = 'empty';
    return { cells, start: [7, 2] as [number, number], goal: [7, 19] as [number, number] };
  }
  const init = initial();
  let cells = $state<Cell[][]>(init.cells);
  let startPos = $state(init.start);
  let goalPos = $state(init.goal);
  let leftAlgo = $state<Algo>('BFS');
  let rightAlgo = $state<Algo>('A*');
  let painting = $state<'wall' | 'empty' | null>(null);
  let dragging = $state<'start' | 'goal' | null>(null);

  const key = (r: number, c: number) => `${r},${c}`;
  function manhattan(a: [number, number], b: [number, number]) { return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]); }
  function neighbours(r: number, c: number): [number, number][] {
    const o: [number, number][] = [];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
      const nr = r+dr, nc = c+dc;
      if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&cells[nr][nc]!=='wall') o.push([nr, nc]);
    }
    return o;
  }

  function runOne(algo: Algo) {
    const s = startPos, g = goalPos;
    const explored = new Set<string>();
    const cameFrom = new Map<string, string>();
    if (algo === 'BFS' || algo === 'DFS') {
      const data: [number, number][] = [s];
      const seen = new Set<string>([key(...s)]);
      while (data.length) {
        const node = algo === 'BFS' ? data.shift()! : data.pop()!;
        explored.add(key(...node));
        if (node[0] === g[0] && node[1] === g[1]) break;
        for (const nb of neighbours(...node)) {
          const k = key(...nb);
          if (!seen.has(k)) { seen.add(k); cameFrom.set(k, key(...node)); data.push(nb); }
        }
      }
    } else {
      type PQ = { node: [number, number]; g: number; f: number };
      const pq: PQ[] = [{ node: s, g: 0, f: 0 }];
      const gScore = new Map<string, number>([[key(...s), 0]]);
      while (pq.length) {
        pq.sort((a, b) => a.f - b.f);
        const it = pq.shift()!;
        const k0 = key(...it.node);
        if (explored.has(k0)) continue;
        explored.add(k0);
        if (it.node[0] === g[0] && it.node[1] === g[1]) break;
        for (const nb of neighbours(...it.node)) {
          const tent = it.g + 1;
          const kn = key(...nb);
          if (!gScore.has(kn) || tent < gScore.get(kn)!) {
            gScore.set(kn, tent);
            cameFrom.set(kn, k0);
            const heur = algo === 'UCS' ? 0 : manhattan(nb, g);
            const f = algo === 'Greedy' ? heur : tent + heur;
            pq.push({ node: nb, g: tent, f });
          }
        }
      }
    }
    // path
    const path: [number, number][] = [];
    let cur = key(...g);
    if (cameFrom.has(cur) || cur === key(...s)) {
      while (cur !== key(...s)) {
        const [r,c] = cur.split(',').map(Number) as [number, number];
        path.unshift([r,c]);
        if (!cameFrom.has(cur)) break;
        cur = cameFrom.get(cur)!;
      }
      path.unshift(s);
    }
    return { explored, path };
  }

  const left = $derived(runOne(leftAlgo));
  const right = $derived(runOne(rightAlgo));

  function cellClass(r: number, c: number, side: 'l' | 'r'): string {
    const v = cells[r][c];
    if (v === 'start') return 'bg-emerald-500';
    if (v === 'goal') return 'bg-rose-500';
    if (v === 'wall') return 'bg-ink-700 dark:bg-ink-300';
    const res = side === 'l' ? left : right;
    const k = key(r, c);
    if (res.path.some((p) => p[0] === r && p[1] === c)) return 'bg-amber-300';
    if (res.explored.has(k)) return 'bg-accent-200 dark:bg-accent-900/50';
    return 'bg-white dark:bg-ink-900';
  }

  function onMouseDown(r: number, c: number, e: MouseEvent) {
    e.preventDefault();
    if (cells[r][c] === 'start') { dragging = 'start'; return; }
    if (cells[r][c] === 'goal') { dragging = 'goal'; return; }
    painting = cells[r][c] === 'wall' ? 'empty' : 'wall';
    cells[r][c] = painting; cells = cells;
  }
  function onMouseEnter(r: number, c: number) {
    if (dragging === 'start') {
      if (cells[r][c] !== 'goal') { cells[startPos[0]][startPos[1]] = 'empty'; startPos = [r, c]; cells[r][c] = 'start'; cells = cells; }
      return;
    }
    if (dragging === 'goal') {
      if (cells[r][c] !== 'start') { cells[goalPos[0]][goalPos[1]] = 'empty'; goalPos = [r, c]; cells[r][c] = 'goal'; cells = cells; }
      return;
    }
    if (!painting) return;
    if (cells[r][c] === 'start' || cells[r][c] === 'goal') return;
    cells[r][c] = painting; cells = cells;
  }
  function onMouseUp() { painting = null; dragging = null; }

  function reset() { const i = initial(); cells = i.cells; startPos = i.start; goalPos = i.goal; }
  function randomWalls() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cells[r][c] === 'start' || cells[r][c] === 'goal') continue;
      cells[r][c] = Math.random() < 0.28 ? 'wall' : 'empty';
    }
    cells = cells;
  }
</script>

<div class="space-y-3" onmouseleave={onMouseUp} role="presentation">
  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={reset}>Reset</button>
    <button class="btn btn-sm" onclick={randomWalls}>Random walls</button>
    <span class="text-xs text-ink-500 ml-auto">Click to paint walls; drag start/goal to move. Both sides update live.</span>
  </div>

  <div class="grid sm:grid-cols-2 gap-3">
    {#each [{ side: 'l' as const, algo: leftAlgo, res: left, set: (a: Algo) => (leftAlgo = a) }, { side: 'r' as const, algo: rightAlgo, res: right, set: (a: Algo) => (rightAlgo = a) }] as panel}
      <div>
        <div class="flex flex-wrap gap-1 mb-2 items-center">
          {#each ['BFS','DFS','UCS','Greedy','A*'] as a (a)}
            <button class="btn btn-sm {panel.algo === a ? 'btn-primary' : ''}" onclick={() => panel.set(a as Algo)}>{a}</button>
          {/each}
          <span class="text-xs text-ink-500 ml-auto">{panel.res.explored.size} explored · path {panel.res.path.length > 0 ? panel.res.path.length - 1 + ' steps' : 'none'}</span>
        </div>
        <div class="inline-block border border-ink-200 dark:border-ink-700 rounded overflow-hidden">
          {#each cells as row, r}
            <div class="flex">
              {#each row as _, c}
                <button type="button" class="w-4 h-4 border border-ink-100 dark:border-ink-800 cursor-pointer {cellClass(r, c, panel.side)}" onmousedown={(e) => onMouseDown(r, c, e)} onmouseenter={() => onMouseEnter(r, c)} aria-label="cell"></button>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
