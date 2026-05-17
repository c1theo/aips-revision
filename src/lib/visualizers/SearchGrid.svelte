<script lang="ts">
  // BFS/DFS/UCS/Greedy/A* on a grid. Walls toggle by click. Start/goal draggable.
  type Algo = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*';

  const ROWS = 16;
  const COLS = 28;

  type Cell = 'empty' | 'wall' | 'start' | 'goal';

  function initGrid(): Cell[][] {
    const g: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) row.push('empty');
      g.push(row);
    }
    return g;
  }

  function defaultGrid(): { grid: Cell[][]; start: [number, number]; goal: [number, number] } {
    const grid = initGrid();
    const start: [number, number] = [8, 3];
    const goal: [number, number] = [8, 24];
    grid[start[0]][start[1]] = 'start';
    grid[goal[0]][goal[1]] = 'goal';
    // sample walls
    for (let r = 3; r < 14; r++) grid[r][12] = 'wall';
    for (let r = 5; r < 12; r++) grid[r][16] = 'wall';
    grid[3][12] = 'empty';
    grid[13][12] = 'empty';
    return { grid, start, goal };
  }

  let { grid, start, goal } = defaultGrid();
  let cells = $state<Cell[][]>(grid);
  let startPos = $state<[number, number]>(start);
  let goalPos = $state<[number, number]>(goal);
  let algo = $state<Algo>('A*');
  let painting = $state<'wall' | 'empty' | null>(null);
  let dragging = $state<'start' | 'goal' | null>(null);
  let speed = $state(40);

  // Search state
  type Step = {
    frontier: Set<string>;
    explored: Set<string>;
    current: [number, number] | null;
    path?: [number, number][];
  };
  let steps = $state<Step[]>([]);
  let stepIdx = $state(0);
  let playing = $state(false);
  let info = $state('');

  const key = (r: number, c: number) => `${r},${c}`;

  function manhattan(a: [number, number], b: [number, number]) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  function neighbours(r: number, c: number): [number, number][] {
    const out: [number, number][] = [];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && cells[nr][nc] !== 'wall') out.push([nr, nc]);
    }
    return out;
  }

  function run() {
    const s = startPos, g = goalPos;
    const steps_: Step[] = [];
    const cameFrom = new Map<string, string>();

    if (algo === 'BFS') {
      const frontier: [number, number][] = [s];
      const frontierSet = new Set<string>([key(...s)]);
      const explored = new Set<string>();
      while (frontier.length) {
        const node = frontier.shift()!;
        frontierSet.delete(key(...node));
        explored.add(key(...node));
        steps_.push({ frontier: new Set(frontierSet), explored: new Set(explored), current: node });
        if (node[0] === g[0] && node[1] === g[1]) break;
        for (const nb of neighbours(...node)) {
          const k = key(...nb);
          if (!explored.has(k) && !frontierSet.has(k)) {
            cameFrom.set(k, key(...node));
            frontier.push(nb); frontierSet.add(k);
          }
        }
      }
    } else if (algo === 'DFS') {
      const stack: [number, number][] = [s];
      const onStack = new Set<string>([key(...s)]);
      const explored = new Set<string>();
      while (stack.length) {
        const node = stack.pop()!;
        onStack.delete(key(...node));
        if (explored.has(key(...node))) continue;
        explored.add(key(...node));
        steps_.push({ frontier: new Set(onStack), explored: new Set(explored), current: node });
        if (node[0] === g[0] && node[1] === g[1]) break;
        for (const nb of neighbours(...node)) {
          const k = key(...nb);
          if (!explored.has(k)) {
            cameFrom.set(k, key(...node));
            stack.push(nb); onStack.add(k);
          }
        }
      }
    } else {
      // UCS, Greedy, A* — priority queue (array, sort lazily)
      type PQItem = { node: [number, number]; g: number; f: number };
      const pq: PQItem[] = [{ node: s, g: 0, f: 0 }];
      const gScore = new Map<string, number>([[key(...s), 0]]);
      const explored = new Set<string>();
      const frontierSet = new Set<string>([key(...s)]);

      function priority(item: PQItem): number {
        if (algo === 'UCS') return item.g;
        if (algo === 'Greedy') return manhattan(item.node, g);
        return item.g + manhattan(item.node, g); // A*
      }

      while (pq.length) {
        pq.sort((a, b) => priority(a) - priority(b));
        const item = pq.shift()!;
        const k0 = key(...item.node);
        frontierSet.delete(k0);
        if (explored.has(k0)) { continue; }
        explored.add(k0);
        steps_.push({ frontier: new Set(frontierSet), explored: new Set(explored), current: item.node });
        if (item.node[0] === g[0] && item.node[1] === g[1]) break;
        for (const nb of neighbours(...item.node)) {
          const kn = key(...nb);
          const tentative = item.g + 1;
          if (!gScore.has(kn) || tentative < gScore.get(kn)!) {
            gScore.set(kn, tentative);
            cameFrom.set(kn, k0);
            pq.push({ node: nb, g: tentative, f: priority({ node: nb, g: tentative, f: 0 }) });
            frontierSet.add(kn);
          }
        }
      }
    }

    // path reconstruct
    const path: [number, number][] = [];
    let cur = key(...g);
    if (cameFrom.has(cur) || (cur === key(...s))) {
      while (cur !== key(...s)) {
        const [r, c] = cur.split(',').map(Number) as [number, number];
        path.unshift([r, c]);
        if (!cameFrom.has(cur)) break;
        cur = cameFrom.get(cur)!;
      }
      path.unshift(s);
    }
    steps_[steps_.length - 1] = { ...steps_[steps_.length - 1], path };

    steps = steps_;
    stepIdx = 0;
    info = `${algo}: ${steps_.length} steps, path length ${path.length ? path.length - 1 : 'no path'}`;
  }

  $effect(() => {
    if (algo) run();
  });

  function reset() {
    const d = defaultGrid();
    cells = d.grid;
    startPos = d.start;
    goalPos = d.goal;
    run();
  }
  function clearWalls() {
    cells = cells.map((row) => row.map((c) => (c === 'wall' ? 'empty' : c)));
    run();
  }
  function randomWalls() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (cells[r][c] === 'start' || cells[r][c] === 'goal') continue;
      cells[r][c] = Math.random() < 0.28 ? 'wall' : 'empty';
    }
    cells = cells;
    run();
  }

  function onMouseDown(r: number, c: number, e: MouseEvent) {
    e.preventDefault();
    if (cells[r][c] === 'start') { dragging = 'start'; return; }
    if (cells[r][c] === 'goal') { dragging = 'goal'; return; }
    painting = cells[r][c] === 'wall' ? 'empty' : 'wall';
    cells[r][c] = painting;
    cells = cells;
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
    if (cells[r][c] === 'start' || cells[r][c] === 'goal') return;
    cells[r][c] = painting;
    cells = cells;
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
    if (step) {
      const k = key(r, c);
      if (step.path?.some((p) => p[0] === r && p[1] === c)) return 'bg-amber-300';
      if (step.current && step.current[0] === r && step.current[1] === c) return 'bg-violet-400';
      if (step.explored.has(k)) return 'bg-accent-200 dark:bg-accent-900/50';
      if (step.frontier.has(k)) return 'bg-accent-100 dark:bg-accent-900/30';
    }
    return 'bg-white dark:bg-ink-900';
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

  <div class="flex gap-2 items-center text-xs">
    <span>Speed</span>
    <input type="range" min="1" max="100" bind:value={speed} class="w-32" />
    <span class="text-ink-500 ml-3">{stepIdx + 1} / {steps.length}</span>
    <button class="btn btn-sm ml-auto" onclick={reset}>Reset</button>
    <button class="btn btn-sm" onclick={clearWalls}>Clear walls</button>
    <button class="btn btn-sm" onclick={randomWalls}>Random walls</button>
  </div>

  <div
    class="inline-block select-none border border-ink-200 dark:border-ink-700 rounded overflow-hidden"
    onmouseup={onMouseUp}
    role="presentation"
  >
    {#each cells as row, r}
      <div class="flex">
        {#each row as _, c}
          <button
            type="button"
            class="w-5 h-5 border border-ink-100 dark:border-ink-800 cursor-pointer transition-colors {cellClass(r, c)}"
            onmousedown={(e) => onMouseDown(r, c, e)}
            onmouseenter={() => onMouseEnter(r, c)}
            aria-label="cell"
          ></button>
        {/each}
      </div>
    {/each}
  </div>

  <div class="text-xs text-ink-500 flex flex-wrap gap-3 mt-1">
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-emerald-500 rounded-sm"></span>start</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-rose-500 rounded-sm"></span>goal</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-ink-700 rounded-sm"></span>wall</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-violet-400 rounded-sm"></span>current</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-accent-200 rounded-sm"></span>explored</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-accent-100 border border-accent-200 rounded-sm"></span>frontier</span>
    <span class="flex items-center gap-1"><span class="inline-block w-3 h-3 bg-amber-300 rounded-sm"></span>path</span>
    <span class="ml-auto">Tip: click to toggle walls; drag <b>start</b>/<b>goal</b> to move.</span>
  </div>
</div>
