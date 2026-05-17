<script lang="ts">
  import { modules } from '../content';
  import Md from '../components/Md.svelte';
  import { href } from '../router';

  let selected = $state(modules[0].slug);
  const cheat: Record<string, string> = {
    search: `## Search (Module 1)

**5-tuple:** $(s_0, \\mathrm{Actions}, \\mathrm{Result}, \\mathrm{IsGoal}, \\mathrm{Cost})$.

| Alg | Complete | Optimal | Time | Space |
|---|---|---|---|---|
| BFS | ✓ | uniform-cost | $O(b^d)$ | $O(b^d)$ |
| UCS | ✓ | ✓ | $O(b^{1+\\lfloor C^*/\\epsilon\\rfloor})$ | as time |
| DFS | with graph-search | ✗ | $O(b^m)$ | $O(bm)$ |
| IDS | ✓ | uniform | $O(b^d)$ | $O(bd)$ |
| Greedy | ✗ | ✗ | $O(b^m)$ | $O(b^m)$ |
| A* | ✓ | admissible (tree) / consistent (graph) | exp in worst | exp |

**Admissible:** $h \\le h^*$. **Consistent:** $h(n) \\le c(n,a,n') + h(n')$. Consistent ⇒ admissible.

**Max of admissibles** is admissible & dominates. **Relaxed problem** → admissible $h$.`,

    adversarial: `## Adversarial (Module 2)

**Minimax** time $O(b^m)$, space $O(bm)$.

**Alpha-beta:** β-cut at MAX when $v \\ge \\beta$. α-cut at MIN when $v \\le \\alpha$. Best case $O(b^{m/2})$ with perfect ordering.

**MCTS:** Selection (UCB1) → Expansion → Simulation → Backpropagation.

**UCB1:** $\\dfrac{W_i}{N_i} + C \\sqrt{\\dfrac{\\ln N}{N_i}}$. $C = \\sqrt 2$ for rewards in $[0,1]$.

**Final move:** most-visited child.`,

    csp: `## CSP (Module 3)

**CSP** $= (X, D, C)$. Constraint graph for binary CSPs.

**Consistency hierarchy:** node ⊂ arc ⊂ path ⊂ k.

**AC-3:** $O(c d^3)$ (or $O(cd^2)$ tighter). Queue of arcs; REVISE; re-enqueue $(X_k, X_i)$ on change.

**Backtracking:** MRV (fail-first variable), Degree (tie-break), LCV (succeed-first value), FC or MAC (propagation).

**Tree-CSPs** $O(nd^2)$. **Cutset conditioning** $O(d^{|S|} (n-|S|) d^2)$.

### Essence vs Essence Prime

| | Essence | Essence' |
|---|---|---|
| int, bool, matrix | ✓ | ✓ |
| set, mset, sequence | ✓ | ✗ |
| relation, function | ✓ | ✗ |
| partition, nesting | ✓ | ✗ |

**Pipeline:** Essence → Conjure → Essence' → Savile Row → solver.

**Viewpoints:** different variable choices for same problem. **Channeling:** $x_i = j \\Leftrightarrow d_j = i$ links them.

**Implied constraint:** logically entailed; improves propagation.

**Symmetry breaking:** lex-leader $\\forall \\sigma \\in G: X \\le_{\\text{lex}} \\sigma(X)$; value precedence; dynamic.

**Min-conflicts** for local search on CSPs: million-queens in ~50 moves.`,

    logic: `## Propositional Logic (Module 4)

**Precedence:** $\\neg, \\wedge, \\vee, \\Rightarrow, \\Leftrightarrow$.

**Entailment:** $\\alpha \\models \\beta$ iff $M(\\alpha) \\subseteq M(\\beta)$.

**Deduction:** $KB \\models \\alpha$ iff $KB \\wedge \\neg \\alpha$ unsat.

**CNF conversion:** (1) elim $\\Leftrightarrow$; (2) elim $\\Rightarrow$; (3) push $\\neg$ inward; (4) distribute $\\vee$ over $\\wedge$.

**Resolution:** $(A \\vee \\ell) + (B \\vee \\neg \\ell) \\Rightarrow (A \\vee B)$. **Refutation-complete** for CNF.

**Horn clause:** ≤ 1 positive literal. **Definite** = exactly 1. Forward / backward chaining linear-time.`,

    sat: `## SAT (Module 5)

**SAT** NP-complete; **2-SAT** in P. Phase transition at $r = m/n \\approx 4.267$ for random 3-SAT.

**DPLL:**
1. Unit propagation (BCP)
2. Pure literal elimination
3. Recurse on both polarities of a decision variable

**CDCL** = DPLL + implication graph + 1-UIP learnt clause + non-chronological backjumping + VSIDS + two-watched literals + restarts.

**1-UIP:** UIP closest to conflict. Backjump to **second-largest decision level** in learnt clause (asserting).

**VSIDS:** activity score per literal, bump on learnt-clause appearance, periodic decay.

**WALKSAT:**
1. Pick random unsatisfied clause $C$
2. With prob $p$: random flip in $C$. Else: flip variable in $C$ with minimum break-count.

**Cannot** prove UNSAT.

**Use CDCL** for industrial / UNSAT proof; **WALKSAT** for large random SAT.`,
  };
</script>

<article class="max-w-4xl">
  <h1>Cheatsheets</h1>
  <p class="text-ink-600 dark:text-ink-300">Dense one-pagers per module — designed for the day-before. Print this page to PDF.</p>

  <div class="my-4 flex gap-2 flex-wrap">
    {#each modules as m}
      <button class="btn {selected === m.slug ? 'btn-primary' : ''}" onclick={() => (selected = m.slug)}>{m.title.replace('Module ', 'M').split(' · ')[0]}</button>
    {/each}
    <button class="btn" onclick={() => window.print()}>🖨 Print</button>
  </div>

  <div class="card my-6">
    <Md src={cheat[selected]} />
  </div>

  <div class="text-sm text-ink-500">
    Want a different cut?
    <a href={href('/visualizers')} class="text-accent-600">Browse visualisers</a>
    or <a href={href('/complexity')} class="text-accent-600">view the complexity table</a>.
  </div>
</article>
