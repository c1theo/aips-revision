<script lang="ts">
  import { allTopics } from '../content';
  import { href } from '../router';

  const pitfalls = allTopics.flatMap((t) =>
    (t.pitfalls ?? []).map((p) => ({ topic: t.title, slug: t.slug, p })),
  );

  // Add hand-curated cross-cutting ones too
  const crossCutting = [
    { topic: 'Search', slug: 'informed-search', p: 'Admissible ≠ consistent. Tree-search A* needs admissibility; graph-search A* needs consistency.' },
    { topic: 'CSP', slug: 'csp-inference', p: 'AC-3 arcs are directed. Each binary constraint gives two arcs. REVISE only prunes the FIRST argument.' },
    { topic: 'CSP', slug: 'essence-prime', p: 'Essence Prime is matrix-only — no set/function/partition. Those exist in Essence and must be encoded by hand in Essence\'.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'An "implied constraint" must be logically entailed by the model. Adding a non-entailed constraint loses solutions.' },
    { topic: 'Logic', slug: 'entailment', p: 'KB ⊨ α iff KB ∧ ¬α is UNSAT — not the other way around. The negation is essential.' },
    { topic: 'Logic', slug: 'inference-rules', p: 'Resolution is refutation-complete only — not deduction-complete. Pose queries as unsatisfiability checks.' },
    { topic: 'SAT', slug: 'cdcl', p: 'Backjumping ≠ backtracking. Memorise: backjump to the SECOND-largest decision level in the learnt clause.' },
    { topic: 'SAT', slug: 'walksat', p: 'WALKSAT cannot prove UNSAT. Use it for SAT-likely instances; switch to CDCL for UNSAT or industrial structure.' },
    { topic: 'Games', slug: 'mcts', p: 'UCB1\'s constant C = √2 is only theoretically optimal for rewards in [0,1]. Reward scale changes the tuning.' },
    { topic: 'Games', slug: 'alpha-beta', p: 'Alpha-beta returns the same value as minimax. Pruning depends entirely on move ordering.' },
  ];
  const all = [...pitfalls, ...crossCutting];
</script>

<article class="max-w-3xl">
  <h1>Examiner pitfalls</h1>
  <p class="text-ink-600 dark:text-ink-300">The traps that lose marks. Read every single one before walking in.</p>

  <ul class="not-prose space-y-3 mt-6 list-none p-0">
    {#each all as { topic, slug, p }, i}
      <li class="pitfall">
        <div class="text-xs uppercase tracking-wider mb-1">{topic} · <a href={href('/topic/' + slug)}>view topic</a></div>
        <div>{p}</div>
      </li>
    {/each}
  </ul>
</article>
