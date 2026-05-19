<script lang="ts">
  import { href } from '../router';

  interface Node { id: string; label: string; module: string; topic?: string; x: number; y: number; r?: number }
  interface Edge { from: string; to: string; label?: string }

  const nodes: Node[] = [
    // Search
    { id: 'bfs', label: 'BFS', module: 'Search', topic: 'uninformed-search', x: 100, y: 80 },
    { id: 'dfs', label: 'DFS', module: 'Search', topic: 'uninformed-search', x: 100, y: 140 },
    { id: 'ids', label: 'IDS', module: 'Search', topic: 'uninformed-search', x: 200, y: 110 },
    { id: 'ucs', label: 'UCS', module: 'Search', topic: 'uninformed-search', x: 100, y: 200 },
    { id: 'greedy', label: 'Greedy', module: 'Search', topic: 'informed-search', x: 280, y: 200 },
    { id: 'astar', label: 'A*', module: 'Search', topic: 'informed-search', x: 200, y: 250 },
    { id: 'idastar', label: 'IDA*', module: 'Search', topic: 'informed-search', x: 300, y: 270 },
    { id: 'localsearch', label: 'Hill climb / SA', module: 'Search', topic: 'local-search', x: 380, y: 100 },
    { id: 'adm', label: 'Admissibility', module: 'Search', topic: 'informed-search', x: 80, y: 280, r: 22 },
    { id: 'cons', label: 'Consistency', module: 'Search', topic: 'informed-search', x: 80, y: 340, r: 22 },

    // Adversarial
    { id: 'minimax', label: 'Minimax', module: 'Adv', topic: 'minimax', x: 580, y: 80 },
    { id: 'ab', label: 'Alpha-beta', module: 'Adv', topic: 'alpha-beta', x: 580, y: 150 },
    { id: 'mcts', label: 'MCTS', module: 'Adv', topic: 'mcts', x: 700, y: 140 },
    { id: 'ucb1', label: 'UCB1', module: 'Adv', topic: 'mcts', x: 800, y: 100, r: 20 },
    { id: 'expectimax', label: 'Expectimax', module: 'Adv', topic: 'imperfect-realtime', x: 700, y: 80 },

    // CSP
    { id: 'csp', label: 'CSP', module: 'CSP', topic: 'csp-fundamentals', x: 1000, y: 150, r: 30 },
    { id: 'ac3', label: 'AC-3', module: 'CSP', topic: 'csp-inference', x: 920, y: 240 },
    { id: 'ac4', label: 'AC-4', module: 'CSP', topic: 'beyond-ac3', x: 1000, y: 280 },
    { id: 'ac2001', label: 'AC-2001', module: 'CSP', topic: 'beyond-ac3', x: 1080, y: 240 },
    { id: 'fc', label: 'FC', module: 'CSP', topic: 'backtracking', x: 920, y: 320 },
    { id: 'mac', label: 'MAC', module: 'CSP', topic: 'backtracking', x: 1000, y: 360 },
    { id: 'mrv', label: 'MRV', module: 'CSP', topic: 'backtracking', x: 1080, y: 320 },
    { id: 'gac', label: 'GAC / Régin', module: 'CSP', topic: 'beyond-ac3', x: 1180, y: 280 },
    { id: 'twoway', label: '2-way / d-way', module: 'CSP', topic: 'beyond-ac3', x: 1180, y: 360 },
    { id: 'essence', label: "Essence'", module: 'CSP', topic: 'essence-prime', x: 1100, y: 100 },
    { id: 'savilerow', label: 'Savile Row', module: 'CSP', topic: 'essence-prime', x: 1200, y: 100 },
    { id: 'treecsp', label: 'Tree-CSP', module: 'CSP', topic: 'csp-structure', x: 900, y: 80 },
    { id: 'minconf', label: 'Min-conflicts', module: 'CSP', topic: 'local-csp', x: 900, y: 420 },

    // Logic
    { id: 'cnf', label: 'CNF', module: 'Logic', topic: 'inference-rules', x: 100, y: 500 },
    { id: 'resolution', label: 'Resolution', module: 'Logic', topic: 'inference-rules', x: 200, y: 530 },
    { id: 'horn', label: 'Horn', module: 'Logic', topic: 'horn-chaining', x: 300, y: 480 },
    { id: 'fwdchain', label: 'Fwd-chain', module: 'Logic', topic: 'horn-chaining', x: 380, y: 510 },
    { id: 'bwdchain', label: 'Bwd-chain', module: 'Logic', topic: 'horn-chaining', x: 380, y: 560 },
    { id: 'tseitin', label: 'Tseitin', module: 'Logic', topic: 'inference-rules', x: 100, y: 580 },

    // SAT
    { id: 'sat', label: 'SAT', module: 'SAT', topic: 'sat-problem', x: 600, y: 500, r: 28 },
    { id: 'twosat', label: '2-SAT', module: 'SAT', topic: 'sat-problem', x: 500, y: 460 },
    { id: 'dpll', label: 'DPLL', module: 'SAT', topic: 'dpll', x: 700, y: 460 },
    { id: 'cdcl', label: 'CDCL', module: 'SAT', topic: 'cdcl', x: 800, y: 500 },
    { id: 'oneuip', label: '1-UIP', module: 'SAT', topic: 'cdcl', x: 900, y: 480, r: 20 },
    { id: 'vsids', label: 'VSIDS', module: 'SAT', topic: 'cdcl', x: 900, y: 540, r: 20 },
    { id: 'walksat', label: 'WALKSAT', module: 'SAT', topic: 'walksat', x: 700, y: 560 },
    { id: 'gsat', label: 'GSAT', module: 'SAT', topic: 'walksat', x: 800, y: 590, r: 20 },
    { id: 'phasetrans', label: 'Phase transition', module: 'SAT', topic: 'sat-problem', x: 600, y: 600, r: 22 },
  ];

  const edges: Edge[] = [
    // Search hierarchies
    { from: 'bfs', to: 'ucs', label: 'unit costs' },
    { from: 'bfs', to: 'ids', label: 'iterative' },
    { from: 'dfs', to: 'ids', label: 'iterative' },
    { from: 'ucs', to: 'astar', label: 'add h' },
    { from: 'greedy', to: 'astar', label: 'add g' },
    { from: 'astar', to: 'idastar', label: 'iterative' },
    { from: 'astar', to: 'adm' },
    { from: 'astar', to: 'cons' },
    { from: 'cons', to: 'adm', label: '⇒' },
    // Adversarial
    { from: 'minimax', to: 'ab', label: 'prune' },
    { from: 'minimax', to: 'expectimax', label: '+chance' },
    { from: 'mcts', to: 'ucb1' },
    // CSP
    { from: 'csp', to: 'ac3', label: 'inference' },
    { from: 'ac3', to: 'ac4', label: 'O(cd²)' },
    { from: 'ac4', to: 'ac2001', label: 'less mem' },
    { from: 'csp', to: 'fc', label: 'search' },
    { from: 'fc', to: 'mac', label: 'stronger' },
    { from: 'mrv', to: 'fc' },
    { from: 'ac3', to: 'gac', label: 'generalise' },
    { from: 'gac', to: 'twoway' },
    { from: 'csp', to: 'essence' },
    { from: 'essence', to: 'savilerow', label: 'compile' },
    { from: 'csp', to: 'treecsp', label: 'special case' },
    { from: 'csp', to: 'minconf', label: 'local search' },
    { from: 'localsearch', to: 'minconf', label: 'specialise' },
    // Logic / SAT
    { from: 'cnf', to: 'resolution' },
    { from: 'cnf', to: 'tseitin', label: 'linear-size' },
    { from: 'horn', to: 'fwdchain' },
    { from: 'horn', to: 'bwdchain' },
    { from: 'cnf', to: 'sat', label: 'decide' },
    { from: 'sat', to: 'twosat', label: 'polytime' },
    { from: 'sat', to: 'dpll' },
    { from: 'dpll', to: 'cdcl', label: 'learn' },
    { from: 'cdcl', to: 'oneuip' },
    { from: 'cdcl', to: 'vsids' },
    { from: 'sat', to: 'walksat', label: 'local' },
    { from: 'gsat', to: 'walksat', label: 'focused' },
    { from: 'sat', to: 'phasetrans' },
    // Cross-module
    { from: 'resolution', to: 'sat', label: 'refute → SAT' },
    { from: 'mcts', to: 'astar', label: 'tree search' },
  ];

  const moduleColors: Record<string, { fill: string; stroke: string }> = {
    Search: { fill: '#dbeafe', stroke: '#1e40af' },
    Adv: { fill: '#fce7f3', stroke: '#9d174d' },
    CSP: { fill: '#fef3c7', stroke: '#a16207' },
    Logic: { fill: '#dcfce7', stroke: '#166534' },
    SAT: { fill: '#fce7f3', stroke: '#86198f' },
  };

  function posOf(id: string): Node | undefined { return nodes.find((n) => n.id === id); }

  let hovered = $state<string | null>(null);
  let selected = $state<string | null>(null);

  const W = 1320, H = 680;
</script>

<article class="max-w-6xl">
  <h1>Concept map</h1>
  <p class="text-ink-600 dark:text-ink-300">
    All major algorithms and concepts. Edges show "is-a", "specialises", "uses" or "generalises" relationships.
    Click any node to jump to its topic; hover to highlight.
  </p>

  <div class="overflow-x-auto my-6 border border-ink-200 dark:border-ink-700 rounded">
    <svg viewBox="0 0 {W} {H}" class="w-full bg-ink-50 dark:bg-ink-900" style="height: {H}px; min-width: 1000px">
      <!-- Module backgrounds -->
      <rect x="40" y="40" width="380" height="320" rx="12" fill="#dbeafe22" stroke="#dbeafe" />
      <text x="50" y="60" font-size="12" font-weight="bold" fill="#1e40af">Module 1 — Search</text>

      <rect x="440" y="40" width="430" height="160" rx="12" fill="#fce7f322" stroke="#fce7f3" />
      <text x="450" y="60" font-size="12" font-weight="bold" fill="#9d174d">Module 2 — Adversarial</text>

      <rect x="880" y="40" width="430" height="420" rx="12" fill="#fef3c722" stroke="#fef3c7" />
      <text x="890" y="60" font-size="12" font-weight="bold" fill="#a16207">Module 3 — CSPs</text>

      <rect x="40" y="440" width="430" height="200" rx="12" fill="#dcfce722" stroke="#dcfce7" />
      <text x="50" y="460" font-size="12" font-weight="bold" fill="#166534">Module 4 — Logic</text>

      <rect x="480" y="440" width="500" height="200" rx="12" fill="#fce7f322" stroke="#fce7f3" />
      <text x="490" y="460" font-size="12" font-weight="bold" fill="#86198f">Module 5 — SAT</text>

      <!-- Edges -->
      {#each edges as e}
        {@const a = posOf(e.from)}
        {@const b = posOf(e.to)}
        {#if a && b}
          {@const highlight = selected && (selected === e.from || selected === e.to)}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={highlight ? '#dc2626' : '#94a3b8'} stroke-width={highlight ? 2 : 1} opacity={hovered && hovered !== e.from && hovered !== e.to ? 0.2 : 0.8} />
          {#if e.label}
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 2} font-size="8" fill="#475569" text-anchor="middle">{e.label}</text>
          {/if}
        {/if}
      {/each}

      <!-- Nodes -->
      {#each nodes as n}
        {@const color = moduleColors[n.module]}
        {@const r = n.r ?? 24}
        {@const dimmed = hovered && hovered !== n.id && !edges.some((e) => (e.from === hovered && e.to === n.id) || (e.to === hovered && e.from === n.id))}
        <g
          transform="translate({n.x},{n.y})"
          onmouseenter={() => (hovered = n.id)}
          onmouseleave={() => (hovered = null)}
          onclick={() => { selected = n.id; if (n.topic) window.location.hash = '#/topic/' + n.topic; }}
          style:cursor="pointer"
          opacity={dimmed ? 0.3 : 1}
        >
          <circle r={r} fill={color.fill} stroke={selected === n.id ? '#dc2626' : color.stroke} stroke-width={selected === n.id ? 3 : 1.5} />
          <text text-anchor="middle" dy="3" font-size="10" font-weight="bold" fill="#0f172a">{n.label}</text>
        </g>
      {/each}
    </svg>
  </div>

  {#if hovered}
    {@const n = posOf(hovered)}
    {#if n}
      <div class="card">
        <div class="font-semibold">{n.label}</div>
        {#if n.topic}
          <a class="text-sm text-accent-600 hover:underline" href={href('/topic/' + n.topic)}>Open topic →</a>
        {/if}
      </div>
    {/if}
  {/if}
</article>
