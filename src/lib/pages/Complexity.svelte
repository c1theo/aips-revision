<script lang="ts">
  interface Row {
    name: string;
    module: string;
    complete?: string;
    optimal?: string;
    time?: string;
    space?: string;
    notes?: string;
  }
  const rows: Row[] = [
    { name: 'BFS', module: 'Search', complete: 'yes (b finite)', optimal: 'uniform costs', time: 'O(b^d)', space: 'O(b^d)', notes: 'FIFO frontier' },
    { name: 'DFS', module: 'Search', complete: 'no (infinite); yes if graph-search + finite', optimal: 'no', time: 'O(b^m)', space: 'O(bm)', notes: 'LIFO' },
    { name: 'Depth-limited DFS', module: 'Search', complete: 'no if ℓ<d', optimal: 'no', time: 'O(b^ℓ)', space: 'O(bℓ)' },
    { name: 'IDS', module: 'Search', complete: 'yes', optimal: 'uniform costs', time: 'O(b^d)', space: 'O(bd)', notes: 'best of BFS+DFS' },
    { name: 'UCS', module: 'Search', complete: 'yes if step ≥ ε', optimal: 'yes', time: 'O(b^{1+⌊C*/ε⌋})', space: 'as time', notes: 'goal test on expansion' },
    { name: 'Bidirectional BFS', module: 'Search', complete: 'yes', optimal: 'uniform', time: 'O(b^{d/2})', space: 'O(b^{d/2})' },
    { name: 'Greedy best-first', module: 'Search', complete: 'no', optimal: 'no', time: 'O(b^m)', space: 'O(b^m)', notes: 'f = h' },
    { name: 'A* (tree)', module: 'Search', complete: 'yes', optimal: 'admissible h', time: 'exp (problem-dep)', space: 'exp', notes: 'f = g + h' },
    { name: 'A* (graph)', module: 'Search', complete: 'yes', optimal: 'consistent h', time: 'exp (problem-dep)', space: 'exp' },
    { name: 'IDA*', module: 'Search', complete: 'yes', optimal: 'admissible', time: 'depends on f-values', space: 'O(bd)' },
    { name: 'Minimax', module: 'Games', time: 'O(b^m)', space: 'O(bm)' },
    { name: 'Alpha-beta (best order)', module: 'Games', time: 'O(b^{m/2})', space: 'O(bm)', notes: '√b branching' },
    { name: 'Alpha-beta (random order)', module: 'Games', time: 'O(b^{3m/4})', space: 'O(bm)' },
    { name: 'MCTS', module: 'Games', notes: 'anytime; convergence in expectation' },
    { name: 'AC-3', module: 'CSP', time: 'O(c · d³) (orig); O(cd²) tighter / AC-3.1', space: 'O(c)', notes: 'Mackworth 1977' },
    { name: 'AC-4', module: 'CSP', time: 'O(cd²)', space: 'O(cd²)' },
    { name: 'Backtracking + FC', module: 'CSP', time: 'exp', space: 'O(n)' },
    { name: 'Backtracking + MAC', module: 'CSP', time: 'exp (but smaller tree)', space: 'O(n)' },
    { name: 'Min-conflicts', module: 'CSP', notes: 'million-queens ≈ 50 moves; incomplete' },
    { name: 'Tree CSP', module: 'CSP', time: 'O(nd²)', notes: 'directional arc consistency' },
    { name: 'Cutset cond.', module: 'CSP', time: 'O(d^{|S|} · (n-|S|) d²)' },
    { name: 'Truth-table model check', module: 'Logic', time: 'O(2^n)', space: 'O(n)' },
    { name: 'Forward chaining (Horn)', module: 'Logic', time: 'O(KB)', space: 'O(KB)' },
    { name: 'Backward chaining (Horn)', module: 'Logic', time: 'O(KB)', space: 'O(KB)', notes: 'tabling for cycles' },
    { name: 'Resolution (refutation)', module: 'Logic', time: 'exp (in worst case)', notes: 'refutation-complete' },
    { name: '2-SAT', module: 'SAT', time: 'O(n + m)', notes: 'SCC on implication graph' },
    { name: 'DPLL', module: 'SAT', time: 'O(2^n) worst', space: 'O(n)' },
    { name: 'CDCL', module: 'SAT', time: 'O(2^n) worst', space: 'O(n + |learnt|)', notes: 'industrial workhorse' },
    { name: 'WALKSAT', module: 'SAT', time: 'incomplete (no UNSAT proof)', space: 'O(n)' },
  ];

  let filter = $state('');
  const filtered = $derived(
    filter.trim() === ''
      ? rows
      : rows.filter((r) =>
          JSON.stringify(r).toLowerCase().includes(filter.toLowerCase()),
        ),
  );
</script>

<article class="max-w-5xl">
  <h1>Complexity & properties table</h1>
  <p class="text-ink-600 dark:text-ink-300">All algorithms, side by side. Filter to narrow down.</p>

  <input bind:value={filter} type="text" placeholder="Filter…" class="w-full mt-4 px-3 py-2 rounded-md border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />

  <div class="overflow-x-auto mt-4 prose max-w-none">
    <table class="text-sm">
      <thead>
        <tr><th>Algorithm</th><th>Module</th><th>Complete</th><th>Optimal</th><th>Time</th><th>Space</th><th>Notes</th></tr>
      </thead>
      <tbody>
        {#each filtered as r}
          <tr>
            <td class="font-medium">{r.name}</td>
            <td class="text-ink-500">{r.module}</td>
            <td>{r.complete ?? ''}</td>
            <td>{r.optimal ?? ''}</td>
            <td class="font-mono">{r.time ?? ''}</td>
            <td class="font-mono">{r.space ?? ''}</td>
            <td class="text-ink-500">{r.notes ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</article>
