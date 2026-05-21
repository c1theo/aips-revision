<script lang="ts">
  import { allTopics } from '../content';
  import { href } from '../router';
  import InlineMd from '../components/InlineMd.svelte';

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
    { topic: 'Games', slug: 'alpha-beta', p: 'Alpha-beta returns the same value as minimax. Pruning depends entirely on move ordering. Worst case (bad ordering) is O(b^d), best case (perfect ordering) O(b^(d/2)). Don\'t conflate them.' },
    { topic: 'Search', slug: 'informed-search', p: 'A* graph-search with admissible-but-INCONSISTENT heuristic: optimality is lost unless you re-open closed nodes (or use tree-search). Many students claim "A* with admissible h is always optimal" — false on graph-search.' },
    { topic: 'CSP', slug: 'csp-inference', p: 'AC-3 does NOT solve a CSP — it enforces arc consistency. Backtracking is still needed (except on tree-CSPs with directional AC).' },
    { topic: 'CSP', slug: 'backtracking', p: 'MRV vs LCV — opposite goals. MRV is a *variable*-ordering heuristic (fail-first); LCV is a *value*-ordering heuristic (succeed-first). Applied at different points.' },
    { topic: 'CSP', slug: 'beyond-ac3', p: 'Pairwise ≠ is NOT GAC of AllDifferent. Example: x,y,z ∈ {1,2}; pairwise ≠ is arc-consistent, but the global AllDifferent is infeasible (pigeonhole). Régin\'s matching catches this; pairwise doesn\'t.' },
    { topic: 'CSP', slug: 'beyond-ac3', p: 'Strong k-consistency ≠ k-consistency. Strong k = i-consistent for all i ≤ k. AC = 2-consistency. PC = 3-consistency (not strong-2). For width-w CSPs, strong (w+1)-consistency permits backtrack-free search.' },
    { topic: 'SAT', slug: 'cdcl', p: '1-UIP is the UIP CLOSEST TO THE CONFLICT, not closest to the decision. Walking back further (e.g. to the decision-cut) gives a longer learnt clause and a different (often worse) backjump level.' },
    { topic: 'Search', slug: 'local-search', p: 'GA ≠ SA with a population. GAs have *crossover* (recombination); SA has *temperature-controlled probabilistic acceptance*. Distinct families.' },
    { topic: 'SAT', slug: 'sat-problem', p: '2-SAT polytime — argue via implication graph + SCC, NOT via DPLL. DPLL works but doesn\'t prove polynomial time.' },
    { topic: 'CSP', slug: 'beyond-ac3', p: 'When counting clauses in a CDCL learnt clause, COUNT LITERALS FROM ALL DECISION LEVELS TOUCHED, not just the conflict.' },
    // CSP modelling pitfalls
    { topic: 'CSP', slug: 'cp-modelling', p: 'Parameters are NOT variables. If the problem says "task i takes 3 hours", `3` is a parameter (input data), not a decision variable. Only model what the modeller *chooses*.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Domains should be the smallest possible. If a "weekday" → {1..5}, not Z. Wide domains waste search and weaken propagation.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Always upgrade pairwise ≠ to AllDifferent when you have ≥3 variables. AllDifferent is strictly stronger (Régin GAC catches pigeonhole; pairwise doesn\'t).' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Always sanity-check models in BOTH directions: (a) every original solution satisfies every constraint (no over-constraint), AND (b) every assignment satisfying every constraint is a real solution (no under-constraint). Most modelling errors are under-constraint.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Symmetry-breaking constraints can CONFLICT with the branching heuristic — both impose orderings on the search. Test combinations before committing.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'For scheduling problems with durations: non-overlap is NOT simply |sᵢ - sⱼ| ≥ k unless both tasks have the same duration k. The correct form is (sᵢ + dᵢ ≤ sⱼ) ∨ (sⱼ + dⱼ ≤ sᵢ). The symmetric form is only an over-approximation.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Tightening domains via deadlines: max start = T − d + 1, not T − d. The "+ 1" accounts for the task starting AT the boundary slot.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Two viewpoints CHANNELLED together (e.g. row-indexed + col-indexed for n-queens) often propagate strictly stronger than either alone. The cost is more variables; the benefit is bidirectional pruning through the channel.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Value precedence breaks colour/value symmetry by forcing the FIRST occurrence of value i to come before the first occurrence of value i+1. It interacts well with branching heuristics that try lowest values first.' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Lex-leader symmetry breaking takes O(|G|) constraints in general (one per symmetry σ in the group G). For matrix row+col symmetry, DoubleLex with O(rows + cols) constraints is the standard tractable approximation.' },
    { topic: 'CSP', slug: 'cp-modelling', p: '"Implied constraint" means logically entailed. Test on a known valid solution: does it satisfy the candidate constraint? If yes — implied, post it. If no — it removes solutions, do NOT post.' },
    { topic: 'CSP', slug: 'essence-prime', p: 'Encoding sets in Essence Prime: matrix of k ints with strict-increasing ordering. This handles BOTH the no-duplicate constraint (AllDifferent implied by strict order) AND the symmetry-breaking (the lex order picks one representative per orbit of permutations).' },
    { topic: 'CSP', slug: 'cp-modelling', p: 'Selecting variables: the same problem usually has 2-3 distinct viewpoints with different variable sets. Brainstorm them all before committing — they typically have very different propagation behaviour.' },
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
        <div><InlineMd src={p} /></div>
      </li>
    {/each}
  </ul>
</article>
