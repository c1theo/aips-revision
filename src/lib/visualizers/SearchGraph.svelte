<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';

  // SearchGraph — arbitrary node/edge/heuristic search visualiser.
  // Build any state-space graph via a small text spec; pick any of
  // BFS / DFS / UCS / Greedy / A* / IDS / IDA* / Weighted A*; step through
  // the full algorithm trace; auto-generate the exam-paper answer.

  type Algo = 'BFS' | 'DFS' | 'UCS' | 'Greedy' | 'A*' | 'IDS' | 'Weighted A*';
  let algo = $state<Algo>('A*');
  let weight = $state(2);
  let searchMode = $state<'graph' | 'tree'>('graph');

  let spec = $state(`# Spec format:
# nodes: NAME(heuristic-to-goal) ...
# edges: A-B 3   (bidirectional, cost 3)
# start: A
# goal: H
nodes: A(7) B(5) C(4) D(2) E(2) F(7) G(4) H(0)
edges:
A-B 12
A-F 9
B-C 10
B-D 14
B-E 25
C-D 8
D-H 13
E-F 13
E-H 11
F-G 7
G-E 5
start: A
goal: H`);

  type Preset = 'cycling' | 'romania' | 'small' | 'custom';
  let preset = $state<Preset>('cycling');
  $effect(() => {
    if (preset === 'cycling') spec = `nodes: A(7) B(5) C(4) D(2) E(2) F(7) G(4) H(0)
edges:
A-B 12
A-F 9
B-C 10
B-D 14
B-E 25
C-D 8
D-H 13
E-F 13
E-H 11
F-G 7
G-E 5
start: A
goal: H`;
    else if (preset === 'romania') spec = `# Subset of Romania map (AIMA classic)
nodes: Arad(366) Bucharest(0) Craiova(160) Dobreta(242) Eforie(161) Fagaras(176) Hirsova(151) Iasi(226) Lugoj(244) Neamt(234) Oradea(380) Pitesti(100) RimnicuVilcea(193) Sibiu(253) Timisoara(329) Urziceni(80) Vaslui(199) Zerind(374)
edges:
Arad-Zerind 75
Arad-Sibiu 140
Arad-Timisoara 118
Zerind-Oradea 71
Oradea-Sibiu 151
Sibiu-Fagaras 99
Sibiu-RimnicuVilcea 80
Fagaras-Bucharest 211
RimnicuVilcea-Pitesti 97
RimnicuVilcea-Craiova 146
Pitesti-Bucharest 101
Pitesti-Craiova 138
Timisoara-Lugoj 111
Lugoj-Dobreta 70
Dobreta-Craiova 120
Bucharest-Giurgiu 90
Bucharest-Urziceni 85
Urziceni-Vaslui 142
Urziceni-Hirsova 98
Vaslui-Iasi 92
Iasi-Neamt 87
Hirsova-Eforie 86
start: Arad
goal: Bucharest`;
    else if (preset === 'small') spec = `nodes: S(7) A(6) B(2) C(4) G(0)
edges:
S-A 3
S-B 5
A-B 2
A-C 4
B-C 1
B-G 6
C-G 2
start: S
goal: G`;
  });

  // ── Parse the spec ──
  interface Graph { nodes: Record<string, { h: number }>; edges: { a: string; b: string; cost: number }[]; start: string; goal: string }
  function parseSpec(s: string): Graph {
    const g: Graph = { nodes: {}, edges: [], start: '', goal: '' };
    let mode: 'nodes' | 'edges' | null = null;
    for (const raw of s.split('\n')) {
      const line = raw.split('#')[0].trim();
      if (!line) continue;
      if (line.startsWith('nodes:')) {
        mode = 'nodes';
        const body = line.slice(6).trim();
        if (body) parseNodes(body, g);
        continue;
      }
      if (line.startsWith('edges:')) { mode = 'edges'; continue; }
      if (line.startsWith('start:')) { g.start = line.slice(6).trim(); continue; }
      if (line.startsWith('goal:')) { g.goal = line.slice(5).trim(); continue; }
      if (mode === 'nodes') parseNodes(line, g);
      else if (mode === 'edges') {
        const m = line.match(/^(\w+)\s*[-\s]\s*(\w+)\s+(\d+(?:\.\d+)?)/);
        if (m) g.edges.push({ a: m[1], b: m[2], cost: parseFloat(m[3]) });
      }
    }
    return g;
  }
  function parseNodes(line: string, g: Graph) {
    const re = /(\w+)\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      g.nodes[m[1]] = { h: parseFloat(m[2]) };
    }
  }

  const graph = $derived.by(() => parseSpec(spec));

  // ── Algorithms ──
  type FrontierItem = { node: string; path: string[]; g: number; f: number; depth: number };

  interface Step {
    action: string;
    frontier: FrontierItem[];
    explored: string[];
    currentPath?: string[];
    pathCost?: number;
    success?: boolean;
    cutoff?: boolean;          // IDS reached cutoff
    iteration?: number;        // IDS iteration
  }

  function neighbours(g: Graph, n: string): { node: string; cost: number }[] {
    const out: { node: string; cost: number }[] = [];
    for (const e of g.edges) {
      if (e.a === n) out.push({ node: e.b, cost: e.cost });
      else if (e.b === n) out.push({ node: e.a, cost: e.cost });
    }
    return out.sort((a, b) => a.node.localeCompare(b.node));
  }

  function compareFor(a: FrontierItem, b: FrontierItem): number {
    if (algo === 'BFS') return a.path.length - b.path.length;       // FIFO by depth
    if (algo === 'DFS') return -(a.path.length - b.path.length);    // LIFO by depth
    if (algo === 'UCS') return a.g - b.g;
    if (algo === 'Greedy') return graph.nodes[a.node].h - graph.nodes[b.node].h;
    if (algo === 'A*') return a.f - b.f;
    if (algo === 'Weighted A*') return a.f - b.f;  // already weighted in f
    return a.f - b.f;
  }

  function evalF(g: Graph, item: { node: string; g: number }): number {
    if (algo === 'BFS') return item.g;
    if (algo === 'DFS') return item.g;
    if (algo === 'UCS') return item.g;
    if (algo === 'Greedy') return g.nodes[item.node].h;
    if (algo === 'A*') return item.g + g.nodes[item.node].h;
    if (algo === 'Weighted A*') return item.g + weight * g.nodes[item.node].h;
    return item.g;
  }

  function runStandard(g: Graph): Step[] {
    if (!g.start || !g.goal || !g.nodes[g.start] || !g.nodes[g.goal]) return [{ action: 'Invalid graph: missing start or goal node.', frontier: [], explored: [] }];

    const steps: Step[] = [];
    const startItem: FrontierItem = { node: g.start, path: [g.start], g: 0, f: evalF(g, { node: g.start, g: 0 }), depth: 0 };
    let frontier: FrontierItem[] = [startItem];
    const explored = new Set<string>();
    steps.push({ action: `Initialise frontier with start node ${g.start} (f = ${startItem.f}).`, frontier: [...frontier], explored: [] });

    let safety = 1000;
    while (frontier.length > 0 && safety-- > 0) {
      // Sort frontier by algorithm-specific priority, alphabetical tie-break
      frontier.sort((a, b) => {
        const cmp = compareFor(a, b);
        if (cmp !== 0) return cmp;
        return a.node.localeCompare(b.node);
      });
      const item = frontier.shift()!;
      steps.push({
        action: `Pop ${item.node} (path: ${item.path.join('→')}, g=${item.g}, f=${item.f}).`,
        frontier: [...frontier], explored: [...explored], currentPath: item.path,
      });
      if (item.node === g.goal) {
        steps.push({ action: `✓ Goal reached. Path: ${item.path.join(' → ')}, cost = ${item.g}.`, frontier: [...frontier], explored: [...explored], currentPath: item.path, pathCost: item.g, success: true });
        return steps;
      }
      if (searchMode === 'graph') {
        if (explored.has(item.node)) {
          steps.push({ action: `${item.node} already explored — skip.`, frontier: [...frontier], explored: [...explored] });
          continue;
        }
        explored.add(item.node);
      }
      const nbrs = neighbours(g, item.node);
      const added: FrontierItem[] = [];
      for (const nb of nbrs) {
        if (searchMode === 'graph' && explored.has(nb.node)) continue;
        if (searchMode === 'tree' && item.path.includes(nb.node)) continue;  // cycle prevention
        const newG = item.g + nb.cost;
        const newItem: FrontierItem = {
          node: nb.node,
          path: [...item.path, nb.node],
          g: newG,
          f: evalF(g, { node: nb.node, g: newG }),
          depth: item.depth + 1,
        };
        // Graph search: replace existing frontier copy if cheaper
        if (searchMode === 'graph') {
          const existing = frontier.findIndex((it) => it.node === nb.node);
          if (existing >= 0) {
            if (newItem.f < frontier[existing].f) { frontier[existing] = newItem; added.push(newItem); }
          } else { frontier.push(newItem); added.push(newItem); }
        } else {
          frontier.push(newItem); added.push(newItem);
        }
      }
      if (added.length) {
        steps.push({
          action: `Expand ${item.node} → added ${added.map((it) => `${it.node}(f=${it.f})`).join(', ')}.`,
          frontier: [...frontier], explored: [...explored],
        });
      } else {
        steps.push({
          action: `Expand ${item.node} → no new children (all already explored or are ancestors).`,
          frontier: [...frontier], explored: [...explored],
        });
      }
    }
    steps.push({ action: 'Frontier empty — no solution.', frontier: [], explored: [...explored] });
    return steps;
  }

  function runIDS(g: Graph): Step[] {
    if (!g.start || !g.goal || !g.nodes[g.start] || !g.nodes[g.goal]) return [{ action: 'Invalid graph.', frontier: [], explored: [] }];
    const steps: Step[] = [];
    for (let limit = 0; limit < 30; limit++) {
      steps.push({ action: `--- Depth limit = ${limit} ---`, frontier: [], explored: [], iteration: limit });
      const result = dls(g, g.start, [g.start], 0, limit, steps);
      if (result) return steps;
    }
    return steps;
  }
  function dls(g: Graph, current: string, path: string[], cost: number, limit: number, steps: Step[]): boolean {
    if (current === g.goal) {
      steps.push({ action: `✓ Goal reached at depth ${path.length - 1}. Path: ${path.join(' → ')}, cost = ${cost}.`, frontier: [], explored: [...path], currentPath: path, pathCost: cost, success: true });
      return true;
    }
    if (path.length - 1 >= limit) {
      steps.push({ action: `Cutoff at ${current} (depth ${path.length - 1}).`, frontier: [], explored: [...path], currentPath: path, cutoff: true });
      return false;
    }
    const nbrs = neighbours(g, current);
    for (const nb of nbrs) {
      if (path.includes(nb.node)) continue;  // ancestor cycle prevention
      steps.push({ action: `Explore ${current} → ${nb.node} (depth ${path.length}, cost so far ${cost + nb.cost}).`, frontier: [], explored: [...path, nb.node], currentPath: [...path, nb.node] });
      if (dls(g, nb.node, [...path, nb.node], cost + nb.cost, limit, steps)) return true;
    }
    return false;
  }

  const result = $derived.by(() => {
    if (algo === 'IDS') return runIDS(graph);
    return runStandard(graph);
  });

  let stepIdx = $state(0);
  $effect(() => { result; stepIdx = 0; });

  const cur = $derived(result[stepIdx]);

  // ── SVG layout ──
  // Simple circle layout: place nodes evenly on a circle
  const layout = $derived.by(() => {
    const names = Object.keys(graph.nodes);
    const positions: Record<string, { x: number; y: number }> = {};
    const cx = 250, cy = 200, r = 170;
    names.forEach((name, i) => {
      const angle = (2 * Math.PI * i) / names.length - Math.PI / 2;
      positions[name] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    return positions;
  });

  function nodeFill(name: string): string {
    if (cur?.success && cur?.currentPath?.includes(name)) return '#86efac';   // path
    if (cur?.explored?.includes(name)) return '#cbd5e1';                       // explored
    if (cur?.frontier?.some((f) => f.node === name)) return '#bae6fd';         // frontier
    if (name === graph.start) return '#fde68a';                                // start
    if (name === graph.goal) return '#fca5a5';                                  // goal
    return '#f1f5f9';
  }
  function nodeStroke(name: string): string {
    if (cur?.currentPath?.[cur.currentPath.length - 1] === name) return '#f59e0b';
    if (name === graph.start) return '#ca8a04';
    if (name === graph.goal) return '#dc2626';
    return '#64748b';
  }
  function edgeColor(a: string, b: string): string {
    if (cur?.currentPath) {
      for (let i = 0; i < cur.currentPath.length - 1; i++) {
        if ((cur.currentPath[i] === a && cur.currentPath[i + 1] === b) ||
            (cur.currentPath[i] === b && cur.currentPath[i + 1] === a)) return '#f59e0b';
      }
    }
    return '#cbd5e1';
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Algorithm.** ${algo}${algo === 'Weighted A*' ? ` with weight $w = ${weight}$` : ''}, ${searchMode}-search.`);
    lines.push(`**Graph.** ${Object.keys(graph.nodes).length} nodes, ${graph.edges.length} edges.`);
    lines.push(`**Start.** ${graph.start}. **Goal.** ${graph.goal}.`);
    lines.push('');
    lines.push(`**Heuristic values.** ${Object.entries(graph.nodes).map(([n, v]) => `h(${n}) = ${v.h}`).join(', ')}.`);
    lines.push('');
    lines.push('**Trace.**');
    lines.push('');
    lines.push('| # | Action |');
    lines.push('|---|---|');
    result.forEach((s, i) => lines.push(`| ${i + 1} | ${s.action.replace(/\|/g, '\\|')} |`));
    lines.push('');
    const lastStep = result[result.length - 1];
    if (lastStep?.success) {
      lines.push(`**Solution found.** Path: ${lastStep.currentPath?.join(' → ')}. Cost: ${lastStep.pathCost}.`);
    } else {
      lines.push(`**No solution found.**`);
    }
    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Preset:</span>
    {#each ['cycling','romania','small','custom'] as p}
      <button class="px-2 py-1 rounded border {preset === p ? 'bg-accent-100 dark:bg-accent-900/40 border-accent-400' : 'border-ink-300 dark:border-ink-700'}" onclick={() => (preset = p as Preset)}>{p}</button>
    {/each}
    <span class="ml-3">Algorithm:</span>
    <select class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={algo}>
      <option value="BFS">BFS</option>
      <option value="DFS">DFS</option>
      <option value="UCS">UCS (uniform-cost)</option>
      <option value="Greedy">Greedy best-first</option>
      <option value="A*">A*</option>
      <option value="Weighted A*">Weighted A*</option>
      <option value="IDS">IDS</option>
    </select>
    {#if algo === 'Weighted A*'}
      <label class="flex items-center gap-1">w =
        <input type="number" min="1" max="10" step="0.5" class="w-16 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={weight} />
      </label>
    {/if}
    {#if algo !== 'IDS'}
      <span>Mode:</span>
      <div class="flex rounded border border-ink-300 dark:border-ink-700 overflow-hidden">
        <button class="px-2 py-1 {searchMode === 'graph' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (searchMode = 'graph')}>Graph</button>
        <button class="px-2 py-1 {searchMode === 'tree' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (searchMode = 'tree')}>Tree</button>
      </div>
    {/if}
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Graph spec — nodes with heuristic, edges with costs, start, goal.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="10" bind:value={spec}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}>⏮ Prev</button>
    <button class="btn btn-sm btn-primary" onclick={() => (stepIdx = Math.min(result.length - 1, stepIdx + 1))} disabled={stepIdx >= result.length - 1}>Next ⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = result.length - 1)}>End</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = 0)}>Reset</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{result.length}</span>
  </div>

  <div class="text-sm font-medium"><MathText src={cur?.action ?? ''} /></div>

  <div class="grid lg:grid-cols-2 gap-3">
    <div class="card !p-2">
      <svg viewBox="0 0 500 400" class="w-full h-auto">
        {#each graph.edges as e}
          {@const a = layout[e.a]}
          {@const b = layout[e.b]}
          {#if a && b}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={edgeColor(e.a, e.b)} stroke-width={cur?.currentPath?.includes(e.a) && cur?.currentPath?.includes(e.b) ? '3' : '1.5'} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} font-size="10" fill="#64748b" text-anchor="middle" dy="-3">{e.cost}</text>
          {/if}
        {/each}
        {#each Object.keys(graph.nodes) as name}
          {@const p = layout[name]}
          {#if p}
            <circle cx={p.x} cy={p.y} r="20" fill={nodeFill(name)} stroke={nodeStroke(name)} stroke-width="2" />
            <text x={p.x} y={p.y + 4} text-anchor="middle" font-size="11" font-weight="bold">{name}</text>
            <text x={p.x} y={p.y + 36} text-anchor="middle" font-size="9" fill="#64748b">h={graph.nodes[name].h}</text>
          {/if}
        {/each}
      </svg>
      <div class="text-[10px] text-ink-500 mt-1">
        <span class="inline-block w-3 h-3 bg-yellow-200 border border-yellow-600 align-middle"></span> start ·
        <span class="inline-block w-3 h-3 bg-red-300 border border-red-600 align-middle"></span> goal ·
        <span class="inline-block w-3 h-3 bg-sky-200 border border-sky-500 align-middle"></span> frontier ·
        <span class="inline-block w-3 h-3 bg-slate-300 border border-slate-500 align-middle"></span> explored ·
        <span class="inline-block w-3 h-3 bg-emerald-300 border border-emerald-500 align-middle"></span> path (final)
      </div>
    </div>

    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-1">Frontier ({cur?.frontier.length ?? 0})</h4>
      <div class="text-xs font-mono max-h-32 overflow-y-auto">
        {#each cur?.frontier ?? [] as f, i}
          <div class="px-1 {i === 0 ? 'bg-accent-100 dark:bg-accent-900/30 rounded' : ''}">{f.node}: g={f.g}, f={f.f}, path={f.path.join('→')}</div>
        {/each}
        {#if (cur?.frontier?.length ?? 0) === 0}<div class="text-ink-500 italic">empty</div>{/if}
      </div>
      <h4 class="text-sm font-semibold mt-3 mb-1">Explored ({cur?.explored.length ?? 0})</h4>
      <div class="text-xs font-mono">{cur?.explored.join(', ') ?? ''}</div>
    </div>
  </div>

  <details class="card !p-2">
    <summary class="cursor-pointer text-sm font-semibold">Full trace ({result.length} steps)</summary>
    <ol class="text-xs font-mono mt-2 space-y-0.5 max-h-64 overflow-y-auto">
      {#each result as s, i}
        <li class="{i === stepIdx ? 'font-semibold text-accent-700 dark:text-accent-300 bg-accent-50/50' : ''}">{i + 1}. <MathText src={s.action} /></li>
      {/each}
    </ol>
  </details>

  <ExamAnswer answer={examAnswer} summary={`${algo} · ${searchMode}-search · ${Object.keys(graph.nodes).length} nodes · ${result[result.length - 1]?.success ? '✓' : '✗'}`} />
</div>
