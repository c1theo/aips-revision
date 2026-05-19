import type { Block } from '../types';

// Extra content sections to splice into existing topics. From the research expansion pack.

export const deepAdditions: Record<string, Block[]> = {
  // Add to informed-search topic
  'informed-search': [
    { kind: 'md', body: `## Heuristic design patterns

How do you come up with $h$ in the first place?

### Relaxed-problem heuristics

*Theorem.* If $h$ is the cost of an optimal solution to a problem $P'$ that is a **relaxation** of $P$ (i.e., $P'$ has fewer or weaker constraints), then $h$ is **admissible** for $P$.

**8-puzzle examples:**
- Drop "tile may only slide into adjacent blank" → tile can teleport anywhere. $h_1 =$ misplaced tiles.
- Drop "destination must be empty" → tile slides through occupied squares. $h_2 =$ sum of Manhattan distances.

Both are admissible because the relaxed problem's solution is a lower bound on the original.

### Sub-problem (pattern) databases

Solve a *sub-problem* (e.g. positions of tiles 1–4 in 15-puzzle) **exactly**, hash the cost to a database. At runtime, look up the partial state's cost — admissible because solving the sub-problem is a necessary part of solving the whole.

### Additive pattern databases (Korf & Felner, 2002)

Partition tiles into **disjoint** groups. Cost of moving each group ignoring other groups can be **summed** safely (each move counted at most once). Tighter heuristic than max-of-databases.

### Maximum of admissible heuristics

If $h_1, \\ldots, h_k$ are admissible, $h = \\max_i h_i$ is admissible (proven in the proofs archive) and dominates each.

### Effective branching factor $b^*$

If A* expands $N$ nodes finding a solution at depth $d$, define $b^*$ such that a uniform tree of depth $d$ with branching $b^*$ has $N + 1$ nodes:
$$N + 1 = 1 + b^* + (b^*)^2 + \\cdots + (b^*)^d$$
Smaller $b^*$ = better heuristic. For 8-puzzle: Manhattan distance gives $b^* \\approx 1.4$; misplaced tiles $b^* \\approx 1.7$.` },
  ],

  // Add to imperfect-realtime topic
  'imperfect-realtime': [
    { kind: 'md', body: `## Quiescence search

**Horizon effect.** Static eval at a fixed cutoff depth can wildly misjudge positions where tactics are still unfolding (mid-capture in chess).

**Quiescence search.** At the cutoff, only return the static eval if the position is *quiet*. Otherwise, extend the search with only "noisy" moves (captures, checks, promotions) until quiescence. Bounded by counts on capture sequences; no fixed depth limit.

This stops the engine being "fooled" by a sacrifice it hasn't seen the response to.

## Transposition tables

Same position can be reached by different move orders. **Hash** each position via Zobrist hashing. Store $(value, depth, flag \\in \\{EXACT, LOWER, UPPER\\})$ — flag because alpha-beta cuts give bounds, not exact values.

At each node:
1. Check TT. If hit at sufficient depth with matching bound type → use cached value or tighten α/β.
2. Otherwise search; store result in TT.

**Speed-up**: in chess, ~5–10× practical gain.

## Killer heuristic + history heuristic + iterative deepening

- **Killer heuristic**: moves that caused cuts at sibling nodes are likely to cut here too — try first.
- **History heuristic**: maintain per-move "how often did this move cause a cut?" — sort moves by that.
- **Iterative deepening**: use depth $d{-}1$'s best move as the FIRST move at depth $d$ — alpha-beta is dramatically faster with good first moves.

These three combined with transposition tables give modern chess engines their move-ordering power.` },
  ],

  // Add to beyond-ac3 topic
  'beyond-ac3': [
    { kind: 'md', body: `## k-consistency hierarchy and width

**$k$-consistency**: any consistent assignment to $k - 1$ variables can be extended to a $k$-th.

| $k$ | Name |
|---|---|
| 1 | Node consistency (unary constraints) |
| 2 | Arc consistency (AC) |
| 3 | Path consistency (PC) |
| $k$ | $k$-consistency |

**Strong $k$-consistency**: $i$-consistent for all $i \\le k$.

**Width $w$ of a CSP** (under a given variable ordering): max over variables of the number of earlier-ordered variables connected to it via constraints.

**Theorem (Freuder, 1985).** If a CSP is **strong $(w+1)$-consistent**, it is solvable **backtrack-free** under the corresponding ordering.

For a **tree-CSP**, $w = 1$, so strong 2-consistency = AC + node-consistency is enough. This is why tree-CSPs are $O(nd^2)$.

## Singleton arc consistency (SAC)

Stronger than AC, weaker than PC:

For each variable $X_i$ and each value $v \\in D(X_i)$: tentatively assign $X_i = v$, run AC; if AC reports infeasibility, remove $v$ from $D(X_i)$.

Useful as preprocessing — finds "dead values" AC alone misses.

## Hall's theorem for AllDifferent

**Hall's marriage theorem.** A bipartite graph with one side $V$ has a matching saturating $V$ iff for every $S \\subseteq V$:
$$|N(S)| \\ge |S|$$
where $N(S)$ is the set of vertices on the other side adjacent to some $v \\in S$.

**Corollary for AllDifferent.** $\\text{AllDifferent}(X_1, \\ldots, X_n)$ is satisfiable iff every subset $S$ of variables has $|\\bigcup_{X_i \\in S} D_i| \\ge |S|$.

Régin's GAC algorithm essentially identifies which value-variable edges are excluded by Hall's condition.` },
  ],

  // Add to sat-problem topic
  'sat-problem': [
    { kind: 'md', body: `## SAT preprocessing (Eén & Biere 2005)

Modern SAT solvers preprocess the CNF before search. Major techniques:

**Bounded Variable Elimination (BVE).** Eliminate variable $v$ by resolving all clauses with $v$ against all clauses with $\\neg v$. Keep only if total clause count doesn't grow.
- "The most important preprocessing technique to date" — SAT Handbook 2021.

**Subsumption.** Clause $C$ subsumes $D$ iff $C \\subseteq D$. Delete $D$ — $C$ entails it.

**Self-subsuming resolution.** Clause $C \\cup \\{\\ell\\}$ together with $C \\cup \\{\\neg \\ell\\}$ allows shortening to $C$.

**Blocked-clause elimination (BCE).** Clause $C$ is *blocked* on literal $\\ell \\in C$ if every resolution of $C$ on $\\ell$ produces a tautology. Then $C$ may be removed preserving SAT (not equivalence — needs reconstruction stack to recover model).

**Vivification.** Unit-propagate to detect redundant literals in a clause; shorten the clause.

**Failed-literal detection / probing.** If assigning $x = T$ leads to conflict under UP, learn $\\neg x$ as a unit clause.

## Cardinality encodings to CNF

Encoding "at most $k$ of $\\{x_1, \\ldots, x_n\\}$ are true" into CNF for SAT:

| Encoding | Clauses | Aux vars | Property |
|---|---|---|---|
| Pairwise (AMO) | $O(n^2)$ | 0 | Simple |
| Sequential counter | $O(nk)$ | $O(nk)$ | UP-preserving |
| Totalizer / cardinality network | $O(n \\log^2 n)$ | $O(n \\log n)$ | Good propagation |
| Ladder / order encoding | $O(n)$ | $O(n)$ | UP-preserving |

Choice depends on $k$, $n$, and how many similar constraints appear.

## Plaisted–Greenbaum (PG) refinement of Tseitin

Tseitin encodes $t \\leftrightarrow \\text{subformula}$. **Plaisted–Greenbaum** observes that for many subformulas, only one direction of the biconditional is needed (e.g. if the subformula only appears positively in the parent, you only need $t \\to \\text{subformula}$). Result: roughly half the clauses of Tseitin.

## Pigeonhole formulas — DPLL/CDCL lower bound

$\\text{PHP}_n$ encodes "$n+1$ pigeons into $n$ holes, each pigeon in some hole, no hole has $\\ge 2$ pigeons" — UNSAT for any $n \\ge 1$.

**Theorem (Haken 1985).** Resolution requires exponentially many steps to refute $\\text{PHP}_n$. Since DPLL/CDCL traces correspond to resolution proofs, both have an exponential lower bound on this family.

This is why specialised algorithms (e.g. cutting-planes, extended resolution) are needed for problems with strong combinatorial structure that resolution can't compactly capture.` },
  ],
};
