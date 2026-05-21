<script lang="ts">
  import VizRenderer from '../components/VizRenderer.svelte';
  import type { VizKey } from '../types';

  const groups: { title: string; items: { key: VizKey; label: string; description: string }[] }[] = [
    {
      title: 'Search',
      items: [
        { key: 'SearchGrid', label: 'Pathfinding grid', description: 'BFS · DFS · UCS · Greedy · A* on a configurable grid with heuristic, diagonals & weighted cells.' },
        { key: 'SearchCompare', label: 'Side-by-side compare', description: 'Run any two algorithms on the same grid simultaneously.' },
        { key: 'SearchGraph', label: '🗺 Search on arbitrary graph (BFS/DFS/UCS/Greedy/A*/Weighted A*/IDS)', description: 'Define any node-edge graph with heuristics. Trace any search algorithm. Graph or tree search mode (cycle handling).' },
        { key: 'GraphImageExtractor', label: '📷 Graph-from-image extractor (experimental, classical CV + OCR)', description: 'Upload or paste an image of a node-edge diagram; pure-JS image processing detects circles + lines, Tesseract reads labels, and you get a SearchGraph spec to verify and use. No generative AI. Works best on clean printed diagrams.' },
        { key: 'HillClimbSA', label: 'Hill climb / Simulated annealing', description: '1D function landscape — watch HC get stuck, RR escape, SA explore.' },
      ],
    },
    {
      title: 'Adversarial',
      items: [
        { key: 'MinimaxTree', label: 'Minimax & alpha-beta', description: 'Backed-up values; toggle pruning; see cuts highlighted.' },
        { key: 'MCTSTree', label: 'MCTS / UCT', description: 'Watch UCB1 grow the tree iteration-by-iteration.' },
        { key: 'Expectimax', label: 'Expectimax (stochastic)', description: 'Game tree with chance nodes — backgammon-style expected values.' },
        { key: 'NormalForm', label: '🎲 Normal-form game analyser', description: 'Payoff matrices, dominant strategies (strict/weak), pure Nash equilibria, maximin/minimax for zero-sum. 6 classic presets.' },
      ],
    },
    {
      title: 'CSP',
      items: [
        { key: 'CSPLab', label: '🧪 CSP Lab — full pipeline', description: 'NC → AC-3 → backtracking, with FC/MAC, 2-way/d-way, MRV/degree/LCV, custom orderings — and a live search tree.' },
        { key: 'ConstraintGraph', label: 'Constraint graph', description: 'Draw any CSP\'s constraint graph; detect tree / cyclic / disconnected.' },
        { key: 'AC3', label: 'AC-3 stepper (NC + AC + manual queue)', description: 'Arbitrary predicates (<, >, !=, abs), unary NC phase, manual arc-picking, revision counts per arc.' },
        { key: 'AC4', label: 'AC-4 (counter-based)', description: 'Optimal O(c·d²) arc consistency with the counter data structure.' },
        { key: 'AC2001', label: 'AC-2001 / AC-3.1 (Last data structure)', description: 'Improved AC-3 with last-support pointers. Track Last[(X_i, v), X_j] live.' },
        { key: 'ReginAllDiff', label: "Régin's GAC for AllDifferent", description: 'Bipartite matching that catches deductions pairwise ≠ misses.' },
        { key: 'TreeCSP', label: 'Tree-CSP solver O(nd²)', description: 'Directional AC + assignment pass on a tree-structured CSP.' },
        { key: 'ForwardCheck', label: 'Generic Forward-Check + backtracking', description: 'Any CSP — custom variables, domains, and constraint predicates.' },
        { key: 'NQueens', label: 'N-Queens / Graph colouring backtracking', description: 'MRV / LCV / FC toggles; see the search tree.' },
        { key: 'MinConflicts', label: 'Min-conflicts', description: 'Local-search n-queens / graph colouring animation with live trace.' },
        { key: 'TwoWayBranching', label: '2-way vs d-way branching', description: 'See how branching style reshapes the search tree.' },
        { key: 'ModellingWizard', label: '🧭 CSP Modelling Wizard', description: 'Step-by-step CSP builder: 7 stages from problem text to a verified model + exam answer.' },
        { key: 'EssencePrime', label: 'Essence Prime editor', description: 'Browse, edit, and save custom models.' },
      ],
    },
    {
      title: 'Logic',
      items: [
        { key: 'TruthTable', label: 'Truth-table builder', description: 'Parse any formula and tabulate.' },
        { key: 'Resolution', label: 'Resolution proof', description: 'Step through a refutation; KB ⊨ α via dedicated query box.' },
        { key: 'HornChain', label: 'Forward / backward chaining', description: 'Both modes; watch facts propagate or goals decompose.' },
        { key: 'CNFEncoder', label: 'CNF conversion (4-step)', description: 'Equivalence-preserving, can blow up.' },
        { key: 'TseitinEncoder', label: 'Tseitin transformation', description: 'Equisatisfiable, linear-size CNF using fresh variables.' },
      ],
    },
    {
      title: 'SAT',
      items: [
        { key: 'DPLL', label: 'DPLL trace', description: 'Decision stack, unit propagation, branching, search tree.' },
        { key: 'CDCL', label: 'CDCL with implication graph', description: 'Watch conflict analysis & 1-UIP cut.' },
        { key: 'WalkSAT', label: 'WALKSAT', description: 'Random walk + greedy flip; clause-satisfaction over time.' },
        { key: 'TwoSAT', label: '2-SAT via SCC', description: 'Implication graph + SCC for polytime 2-SAT.' },
        { key: 'PhaseTransition', label: 'Phase transition', description: 'Empirical SAT probability & solve time across m/n.' },
      ],
    },
  ];

  let openKey = $state<VizKey | null>(null);
</script>

<article class="max-w-5xl">
  <h1>All visualisers</h1>
  <p class="text-ink-600 dark:text-ink-300">Every interactive tool in one place. Tap a card to expand.</p>

  {#each groups as g}
    <h2>{g.title}</h2>
    <div class="not-prose grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each g.items as it}
        <button class="card text-left cursor-pointer hover:border-accent-400 {openKey === it.key ? 'border-accent-500' : ''}" onclick={() => (openKey = openKey === it.key ? null : it.key)}>
          <div class="font-semibold">{it.label}</div>
          <div class="text-sm text-ink-500 mt-1">{it.description}</div>
        </button>
      {/each}
    </div>
    {#if g.items.some((it) => it.key === openKey)}
      {#each g.items.filter((it) => it.key === openKey) as it (it.key)}
        <VizRenderer viz={it.key} title={it.label} />
      {/each}
    {/if}
  {/each}
</article>
