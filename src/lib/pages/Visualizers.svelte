<script lang="ts">
  import VizRenderer from '../components/VizRenderer.svelte';
  import type { VizKey } from '../types';

  const groups: { title: string; items: { key: VizKey; label: string; description: string }[] }[] = [
    {
      title: 'Search',
      items: [
        { key: 'SearchGrid', label: 'Pathfinding grid', description: 'BFS · DFS · UCS · Greedy · A* side-by-side on a configurable grid.' },
      ],
    },
    {
      title: 'Adversarial',
      items: [
        { key: 'MinimaxTree', label: 'Minimax & alpha-beta', description: 'Backed-up values; toggle pruning; see cuts highlighted.' },
        { key: 'MCTSTree', label: 'MCTS / UCT', description: 'Watch UCB1 grow the tree iteration-by-iteration.' },
      ],
    },
    {
      title: 'CSP',
      items: [
        { key: 'AC3', label: 'AC-3 stepper', description: 'Map colouring + arc queue, step or autoplay.' },
        { key: 'NQueens', label: 'N-Queens backtracking', description: 'MRV / LCV / FC / MAC toggles; see the search tree.' },
        { key: 'MinConflicts', label: 'Min-conflicts', description: 'Local-search n-queens animation.' },
        { key: 'EssencePrime', label: 'Essence Prime editor', description: 'Browse and edit canonical models.' },
      ],
    },
    {
      title: 'Logic',
      items: [
        { key: 'TruthTable', label: 'Truth-table builder', description: 'Parse any formula and tabulate.' },
        { key: 'Resolution', label: 'Resolution proof', description: 'Step through a refutation; derive ⊥.' },
        { key: 'HornChain', label: 'Forward chaining', description: 'Watch facts propagate through Horn rules.' },
      ],
    },
    {
      title: 'SAT',
      items: [
        { key: 'DPLL', label: 'DPLL trace', description: 'Decision stack, unit propagation, branching.' },
        { key: 'CDCL', label: 'CDCL with implication graph', description: 'Watch conflict analysis & 1-UIP cut.' },
        { key: 'WalkSAT', label: 'WALKSAT', description: 'Random walk + greedy flip; clause-satisfaction over time.' },
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
