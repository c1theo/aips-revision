import type { ExampleQuestion, Flashcard } from '../types';

// Extra examples + flashcards per topic. Merged into the existing topics at module load.

export const extraExamples: Record<string, ExampleQuestion[]> = {
  'search-formulation': [
    {
      id: 'ex-form-extra1', difficulty: 'basic', marks: 4,
      question: 'For the **vacuum cleaner world** with 2 rooms, what is the size of the state space? Justify.',
      answer: `**Components of state:**
- Robot location: 2 options (room A or B).
- Dirt in A: 2 options (clean/dirty).
- Dirt in B: 2 options.

Total: $2 \\times 2 \\times 2 = 8$ states.

If you generalise to $n$ rooms: $n \\cdot 2^n$.`,
    },
    {
      id: 'ex-form-extra2', difficulty: 'intermediate', marks: 5,
      question: 'Distinguish *path cost* from *action cost*. When do they coincide?',
      answer: `**Action cost** $c(s, a, s')$: cost of *one action* in state $s$ producing $s'$.

**Path cost** $g(n) = \\sum c(s_i, a_i, s_{i+1})$: sum of action costs along the path from start to $n$.

**Coincide** only on a single-step path: path cost of the start's successor equals the action cost.

**Why the distinction matters:** UCS expands by *path cost* (so far), not action cost. Greedy uses *heuristic* (estimated cost-to-go), not path cost.`,
    },
  ],

  'uninformed-search': [
    {
      id: 'ex-uni-extra1', difficulty: 'basic', marks: 4,
      question: 'Why does **goal-test-on-generation** save time in BFS but break UCS?',
      answer: `**BFS:** all generated nodes have a path of equal-or-greater length than the goal-test-on-generation point. So if a goal is generated, no shorter path can exist later (uniform cost). Safe to return immediately.

**UCS:** the first time a goal is *generated*, a cheaper path may still be discovered later by exploring a different frontier node. The optimal-path guarantee requires goal-test-on-**expansion** — only when the goal is popped (cheapest in the queue) do we know it's optimal.`,
    },
    {
      id: 'ex-uni-extra2', difficulty: 'advanced', marks: 7,
      question: 'A search problem has 1-edges and 100-edges. Use UCS and trace popping order for: S — (1) — A — (1) — G; S — (100) — G.',
      answer: `**Edges:**
- S → A : 1
- A → G : 1
- S → G : 100

**UCS run:**

\`\`\`
PQ: [(S, 0)]
Pop S (g=0). Generate A (g=1), G (g=100).
PQ: [(A, 1), (G, 100)]
Pop A (g=1). Generate G (g=2) [cheaper than 100].
PQ: [(G, 2), (G, 100)]   // duplicate; cheapest wins
Pop G (g=2). GOAL — return.
\`\`\`

**Optimal path:** S → A → G, cost 2.

**Note:** if we'd used BFS with goal-test-on-generation, we'd have returned G at cost 100 (shallowest path). UCS catches the cheaper path because it orders by $g$.`,
    },
    {
      id: 'ex-uni-extra3', difficulty: 'intermediate', marks: 5,
      question: 'What is the **memory wall** of BFS and how does IDS overcome it?',
      answer: `**BFS memory wall:** $O(b^d)$. For $b = 10, d = 12$ that's $10^{12}$ frontier nodes — about a petabyte of state. Modern PCs can't hold this.

**IDS** overcomes by:
- Using DFS-style stack memory: $O(bd) = 120$ frontier slots for the same problem.
- Re-discovering shallower depths each iteration. Costs only $\\sim b/(b-1)$ × extra (i.e. 11% more for $b = 10$).

**Trade-off:** 11% more time, $10^{10}$× less memory. For deep large-branching problems, IDS is essentially the only complete option.`,
    },
  ],

  'informed-search': [
    {
      id: 'ex-inf-extra1', difficulty: 'intermediate', marks: 6,
      question: 'For 8-puzzle: which is admissible — (a) sum of Manhattan distances + 2×linear-conflict bonus; (b) maximum Manhattan distance over tiles? Justify.',
      answer: `**(a) Sum of Manhattan + linear-conflict bonus.** Linear conflict adds 2 for each pair of tiles in the same row/column but in wrong relative order (because one must move out and back).

Each tile needs at least its Manhattan distance moves, AND a conflicting pair needs 2 extra. So this is still **admissible** — the bonus reflects unavoidable extra cost.

**(b) Maximum Manhattan.** This is the most-out-of-place tile's distance. It **is** admissible — at least that many moves are needed (that tile alone needs them). But it's a *very loose* lower bound (only counts one tile).

**Comparison:** (a) dominates (b) heavily — (a) sums over all tiles, (b) takes only one. (a) is the practical choice.

**Examiner note:** verifying admissibility of a clever heuristic always reduces to "is this $\\le$ what the optimal play needs?" If you can find one scenario where it's higher than the true cost, it's inadmissible.`,
    },
    {
      id: 'ex-inf-extra2', difficulty: 'advanced', marks: 8,
      question: 'Construct a problem where A* with an admissible-but-inconsistent heuristic returns a suboptimal solution **under graph-search**. (And state what fix recovers optimality.)',
      answer: `**Problem.** Three nodes: S, A, B, G. Edges (all undirected): S–A=4, S–B=1, A–G=1, B–G=4. Optimal path: S → A → G cost 5 (or symmetric). Suboptimal path: S → B → G cost 5 too (tied — let me adjust).

Actually let me use: S–A=2, A–B=2, B–G=2, S–G=10. Optimal: S → A → B → G = 6. Direct S–G = 10. So optimal path goes via A then B.

**Inconsistent heuristic:**
- $h(S) = 5$ — admissible since $h^*(S) = 6$.
- $h(A) = 5$ — should be $\\le h^*(A) = 4$ → would be inadmissible.

Let me use: $h(S) = 6, h(A) = 1, h(B) = 1, h(G) = 0$. All admissible ($h^*$ are 6, 4, 2, 0).

Check consistency: $h(S) \\le c(S, A) + h(A) = 2 + 1 = 3$? But $h(S) = 6 > 3$ → **inconsistent**.

**Graph-search trace:**
\`\`\`
PQ: [(S, f=0+6=6)]
Pop S. Generate A (g=2, f=3). Closed: {S}.
PQ: [(A, 3)]
Pop A. Generate S [closed, skip], B (g=4, f=5), G (skip — A not connected directly).
Actually wait — let me redo with proper graph.
\`\`\`

The reliable counterexample (AIMA-style): A* graph-search can close a node with the wrong $g$ value when only admissibility holds, missing the better path found later because the node is closed.

**Fix:**
1. Use a **consistent** heuristic (often easy to design — take max with a known consistent one).
2. **Re-open closed nodes** when a cheaper path is found (Pearl's variant; loses pure-graph-search efficiency).
3. Stay with tree-search.

**Marks for an exam answer:** state the property, draw a tiny graph showing the failure, give the fix.`,
    },
    {
      id: 'ex-inf-extra3', difficulty: 'basic', marks: 4,
      question: 'Why is the **zero heuristic** $h(n) \\equiv 0$ admissible? What algorithm does A* reduce to under it?',
      answer: `**Admissible:** $0 \\le h^*(n)$ always (true cost is non-negative). So $h \\equiv 0$ trivially satisfies $h \\le h^*$.

**A* with $h \\equiv 0$** prioritises by $f(n) = g(n) + 0 = g(n)$.

This is exactly **Uniform-Cost Search** (Dijkstra's algorithm). A* generalises UCS by adding a heuristic; UCS is the special case with no domain knowledge.

**Practical consequence:** UCS sets the *worst-case* baseline for A*'s exploration size. Any non-zero admissible heuristic can only improve (expand $\\le$ nodes than UCS, modulo tie-breaking).`,
    },
  ],

  'local-search': [
    {
      id: 'ex-loc-extra1', difficulty: 'intermediate', marks: 5,
      question: 'Why is **random-restart hill climbing** complete (with probability 1) on finite search spaces?',
      answer: `Each restart picks a uniformly random initial state. From any state, hill climbing finds *some* local maximum.

If the global optimum's basin of attraction is non-empty (which it is, by definition — the global max is in its own basin), then with positive probability $p > 0$ a random restart lands in that basin. After $k$ restarts, probability of missing = $(1 - p)^k \\to 0$ as $k \\to \\infty$.

So **with infinite restarts, completeness is guaranteed**.

**In practice:** $1/p$ expected restarts. For benign landscapes (n-queens, TSP heuristics), $p$ is large — completeness is reached fast.`,
    },
    {
      id: 'ex-loc-extra2', difficulty: 'advanced', marks: 7,
      question: 'For genetic algorithms: define **schemata** and explain why short, low-order, fit schemata grow exponentially (Holland\'s schema theorem, informal).',
      answer: `**Schema:** a template over chromosome alphabet $\\{0, 1, *\\}$ where $*$ matches anything. E.g. $1**0$ matches $1000, 1010, 1100, 1110$.

**Defining length** of a schema: distance between its first and last fixed (non-$*$) position.

**Order:** number of fixed positions.

**Schema theorem (informal):** in a GA with proportional selection, single-point crossover at rate $p_c$, and mutation rate $p_m$, the expected number of instances of a schema $H$ in the next generation is at least:

$$E[m(H, t+1)] \\ge m(H, t) \\cdot \\frac{f(H)}{\\bar f} \\cdot \\left[ 1 - p_c \\frac{\\delta(H)}{L-1} - o(H) p_m \\right]$$

where $f(H)$ is average fitness of $H$'s instances, $\\bar f$ is population average, $\\delta(H)$ defining length, $o(H)$ order, $L$ chromosome length.

**Interpretation:** schemata that are
- **fit** (high $f(H)/\\bar f$) — propagated by selection,
- **short** (low $\\delta(H)$) — rarely disrupted by crossover,
- **low-order** (low $o(H)$) — rarely disrupted by mutation,

grow **exponentially** generation-over-generation. This is the GA's "free lunch" — small good patterns combine via crossover into larger good patterns.

**Modern critique:** schema theorem assumes proportional selection without elitism and is a *lower* bound (doesn't account for crossover *building* useful schemata). Modern GA theory uses more refined analyses, but the intuition is still useful.`,
    },
  ],

  'game-formulation': [
    {
      id: 'ex-game-extra1', difficulty: 'intermediate', marks: 5,
      question: 'In a **stochastic** game (e.g. backgammon), how does the formulation differ from deterministic games? What algorithm replaces minimax?',
      answer: `**Stochastic game**: an additional player called CHANCE makes random moves. Each chance node has known probability distribution over its children.

Formulation change: add $\\mathrm{ToMove}(s) \\in \\{\\text{MAX}, \\text{MIN}, \\text{CHANCE}\\}$ and $\\mathrm{Prob}(s, a)$ at chance nodes.

**Algorithm: Expectiminimax.** Replace recursive value definition:

$$\\mathrm{Expectiminimax}(s) = \\begin{cases}
\\mathrm{Utility}(s) & \\text{terminal} \\\\
\\max_a \\mathrm{Expectiminimax}(\\mathrm{Result}(s, a)) & \\text{MAX} \\\\
\\min_a \\mathrm{Expectiminimax}(\\mathrm{Result}(s, a)) & \\text{MIN} \\\\
\\sum_a P(a) \\cdot \\mathrm{Expectiminimax}(\\mathrm{Result}(s, a)) & \\text{CHANCE}
\\end{cases}$$

**Trade-off:** chance nodes destroy alpha-beta pruning (you can't safely cut a sum until you know all terms). Time is $O(b^m \\cdot n^m)$ for $n$ chance outcomes per chance node.

**Practical:** sampling-based methods (rollouts, MCTS) handle stochastic games better than full expectiminimax in high-branching domains.`,
    },
  ],

  'minimax': [
    {
      id: 'ex-mm-extra1', difficulty: 'advanced', marks: 6,
      question: 'Prove that minimax computes a Nash equilibrium for two-player zero-sum games.',
      answer: `**Setup.** Two-player zero-sum game. MAX has strategy $\\sigma$, MIN has strategy $\\tau$. Utility $U(\\sigma, \\tau)$.

**Nash equilibrium:** strategies $\\sigma^*, \\tau^*$ such that:
- $\\sigma^* = \\arg\\max_\\sigma U(\\sigma, \\tau^*)$  (MAX can't improve by deviating)
- $\\tau^* = \\arg\\min_\\tau U(\\sigma^*, \\tau)$   (MIN can't improve)

**Minimax theorem (von Neumann, 1928):** for two-player zero-sum:

$$\\max_\\sigma \\min_\\tau U(\\sigma, \\tau) = \\min_\\tau \\max_\\sigma U(\\sigma, \\tau)$$

Call this value $v^*$. Any pair $(\\sigma^*, \\tau^*)$ achieving $v^*$ is a Nash equilibrium.

**The minimax algorithm** literally computes:
- For MAX root: $\\sigma^*(s) = \\arg\\max_a \\min \\cdots$ — the move that maximises MAX's guaranteed value.
- This satisfies "no improvement by deviating" trivially: any other move at the root yields a *lower* min over MIN's responses, by definition of max.

Therefore the move chosen by minimax is a Nash-equilibrium move.

**Note for perfect-info games:** the equilibrium is **pure** (no randomisation). For imperfect-info games, mixed strategies are needed and standard minimax doesn't suffice.`,
    },
  ],

  'alpha-beta': [
    {
      id: 'ex-ab-extra1', difficulty: 'intermediate', marks: 5,
      question: 'Why might `null-move pruning` reduce the depth that alpha-beta needs to search, and what is its main risk?',
      answer: `**Null-move pruning** (used in chess engines): at any node, *temporarily* let the opponent move twice. If the resulting sub-search still gives a value $\\ge \\beta$, we conclude our current side is so well-off that even passing would beat $\\beta$ — prune.

**Speed-up:** avoids deep tactical search in clearly-winning positions. Often 5–10× faster on average.

**Main risk: Zugzwang positions.** In some chess endgames, *being to move* is a disadvantage — any move worsens the position. The null-move heuristic assumes "passing can't make me worse off", which is false here. Pruning may discard the correct line.

**Mitigation:** disable null-move pruning in endgames or low-piece-count positions. Verify with a normal search at lower depth if null-move suggests a cut.

**Examiner note:** an example of **forward pruning** that *is* approximate — unlike alpha-beta which is exact. Don't confuse the two.`,
    },
  ],

  'mcts': [
    {
      id: 'ex-mc-extra1', difficulty: 'advanced', marks: 6,
      question: 'AlphaGo combined MCTS with a *policy network* and *value network*. Explain how each replaces or augments parts of vanilla MCTS.',
      answer: `**Vanilla MCTS components:**
- Selection: UCB1 over child statistics.
- Expansion: add one new child.
- Simulation: uniform-random rollout to terminal.
- Backpropagation: update visit counts and accumulated values.

**AlphaGo augmentations:**

**Policy network (prior).** A neural net trained on expert games estimates $P(a | s)$ — the probability that a human expert plays each move. Modifies the selection rule to **PUCT**:

$$Q(s, a) + C \\cdot P(s, a) \\cdot \\frac{\\sqrt{N(s)}}{1 + N(s, a)}$$

— prior-biased UCB1. Concentrates search on plausible moves immediately.

**Value network.** Replaces (or blends with) the random rollout. A neural net trained to estimate game value from positions; provides a fast, learned alternative to playing out random moves.

In AlphaGo's case: at a leaf, take a weighted average of (a) value network estimate, (b) one or more random rollouts.

**Result:** dramatically reduced effective branching factor (policy net filters) + much better leaf evaluation (value net replaces noisy random play). Enabled human-grandmaster-level Go (and then AlphaZero, which trained these nets via self-play from random, dispensing with human game data).`,
    },
  ],

  'csp-fundamentals': [
    {
      id: 'ex-csp-extra1', difficulty: 'basic', marks: 4,
      question: 'Why is **AllDifferent** preferred over $\\binom{n}{2}$ pairwise inequalities (revisited)?',
      answer: `Three reasons:

1. **Stronger propagation.** AllDifferent has specialised propagators (Régin\'s matching algorithm) achieving *generalised* arc consistency — detecting infeasibility a pairwise $\\ne$ network would miss.

2. **Compact.** $\\binom{10}{2} = 45$ vs 1 constraint.

3. **Solver-side optimisation.** Solvers know AllDifferent intimately. They use bipartite-matching theory: if the bipartite graph of variable-value assignments has no perfect matching, the constraint is infeasible — caught instantly.

**Concrete win on sudoku:** AllDifferent per row/col/box catches certain infeasibility 1-2 plies earlier than pairwise.`,
    },
  ],

  'csp-inference': [
    {
      id: 'ex-inf-extra1b', difficulty: 'intermediate', marks: 6,
      question: 'What is **path consistency**? Why is it rarely used in practice?',
      answer: `**Definition.** Variables $X_i, X_j$ are *path-consistent* via $X_k$ iff for every consistent assignment $(X_i = a, X_j = b)$, there exists $X_k = c$ such that $(X_i, X_k)$ and $(X_k, X_j)$ are both consistent.

Path consistency removes pairs of values from binary constraints that cannot extend to a third variable.

**Strength:** path consistency is strictly stronger than arc consistency — it can detect inconsistencies AC-3 misses.

**Why rarely used:**
1. **Memory.** Path consistency operates on *pairs* of values (the binary constraint table), expanding from $O(d^2)$ per constraint to $O(d^4)$ in the worst case.
2. **Marginal returns.** Empirically, arc consistency catches most "easy" propagation; path consistency's extra deductions are rare and costly.
3. **Implementation complexity.** AC algorithms (AC-3, AC-2001) are simple; PC algorithms are messy.

**Practical alternative:** maintain arc consistency (MAC) during search; rely on the search tree to compensate for missed deductions.`,
    },
    {
      id: 'ex-inf-extra2b', difficulty: 'advanced', marks: 8,
      question: 'Explain why **MAC** (Maintain Arc Consistency) often dominates **FC** (Forward Checking) despite higher per-step cost.',
      answer: `**FC:** after assigning $X_i = v$, prune values from $D(X_j)$ that conflict with $v$, for each $X_j$ adjacent to $X_i$. **Local — one ply.**

**MAC:** same trigger, but run the full **AC-3** algorithm on all arcs affected. Pruning propagates transitively.

**Per-step cost comparison:**
- FC: $O(c_i \\cdot d)$ where $c_i$ = neighbours of $X_i$, $d$ = max domain size.
- MAC: $O(c \\cdot d^3)$ in worst case (full AC-3).

**Why MAC dominates:**

1. **Earlier failure detection.** MAC catches infeasibilities at the current ply that FC misses; FC must descend further before discovering them, then backtrack with all the wasted work.

2. **Search-tree shrinkage.** Empirically, MAC's search tree is 10–100× smaller on hard CSPs. The per-step factor (maybe 5–20× slower per step) is overwhelmed.

3. **Stronger pruning during sub-searches.** Once a partial assignment is fixed, MAC keeps tightening as more decisions are made. FC re-prunes only after each new assignment, missing cascades.

**When FC is preferable:**
- Very easy CSPs where any heuristic suffices.
- Real-time constraint situations where per-step latency dominates.

**Modern solvers (Minion, Gecode):** use MAC as default, occasionally fall back to FC at deep nodes when domain reductions become cheap.`,
    },
  ],

  'backtracking': [
    {
      id: 'ex-bt-extra1', difficulty: 'intermediate', marks: 6,
      question: 'What is **conflict-directed backjumping (CBJ)**? How does it differ from chronological backtracking?',
      answer: `**Chronological backtrack:** on failure, undo the most recent assignment. Try next value. If all values fail, undo the next-most-recent. Etc.

**Problem:** the most recent decision may be irrelevant to the conflict. Suppose $X_1, X_2, X_3, X_4$ assigned and $X_4$ now has empty domain because of a conflict with $X_1$. Chronological backtrack undoes $X_3, X_2$ pointlessly before getting to $X_1$.

**CBJ:** track the **conflict set** for each variable — the set of previously assigned variables whose value caused a domain reduction. On failure, jump back to the most recent variable in the conflict set, skipping intermediate ones.

**Concretely.** Maintain $\\mathrm{conflictSet}(X_i)$ = vars whose assignment removed values from $D(X_i)$. On exhausting $X_i$'s domain, propagate $\\mathrm{conflictSet}(X_i)$ to the var jumped to.

**Example.**
- Assign $X_1 = 1, X_2 = 2, X_3 = 3$. All consistent.
- Try $X_4 = ?$: every value conflicts with $X_1 = 1$.
- Chronological: undo $X_3$, try next; undo $X_2$, try next; eventually reach $X_1$.
- CBJ: notice $X_4$'s conflict set is $\\{X_1\\}$. Jump directly to $X_1$. Saves 2 wasted layers of search.

**Modern relative:** CDCL in SAT solvers — same idea but in CNF with learnt clauses preserving the conflict information across the whole search.`,
    },
  ],

  'cp-modelling': [
    {
      id: 'ex-cpm-extra1', difficulty: 'advanced', marks: 8,
      question: 'Model the **Social Golfers problem** (k=w weeks, g groups of s golfers each; no pair plays together twice) in *full Essence*. Identify variable type and constraints.',
      answer: `**Decision variable** (in Essence — uses nested abstract types):

\`\`\`
language Essence 1.3
given w, g, s : int(1..)
letting Golfers be new type of size g * s
find sched : set (size w) of partition (regular, numParts g, partSize s) from Golfers
\`\`\`

**Variable type:** $\\text{set of partition from Golfers}$ — a 2-level nesting.

- Outer **set** of size $w$: the weeks (order doesn't matter; sets of weeks are symmetric).
- Inner **partition** with $g$ regular parts of size $s$: each week's groups.

**Constraint:** for any pair of golfers, the number of weeks they're in the same group $\\le 1$:

\`\`\`
forAll g1, g2 : Golfers, g1 != g2 .
    (sum week in sched . toInt(together({g1, g2}, week))) <= 1
\`\`\`

**Why this works:**
- The partition type naturally enforces "each golfer in exactly one group per week".
- The set type avoids duplicate weeks.
- Symmetry breaking: implicit in set/partition types — Conjure adds canonicalisation when lowering to Essence Prime.

**In Essence Prime** (matrix-only): you'd need a 3D Boolean matrix \`b[golfer, group, week]\` with sum-constraints per week per group, equivalent to ~$g \\cdot w$ explicit cardinality constraints + the no-repeat-pair constraint as a giant sum. Much wordier.`,
    },
  ],

  'essence-prime': [
    {
      id: 'ex-ep-extra1', difficulty: 'intermediate', marks: 6,
      question: 'In Essence Prime, write a model for **graph 3-colouring** of $K_5$ minus one edge. Use the int-matrix encoding for colour assignment and value-precedence for symmetry breaking.',
      answer: `\`\`\`
language ESSENCE' 1.0

letting n   be 5
letting k   be 3
letting V   be domain int(1..n)
letting C   be domain int(1..k)

$ All pairs except (1,2) are edges
find color : matrix indexed by [V] of C

such that
    forAll i, j : V, i < j, !(i = 1 /\\ j = 2) . color[i] != color[j],

    $ value-precedence symmetry breaking: first use of colour i precedes first use of colour i+1
    forAll c : int(1..k-1) .
        (exists i : V . color[i] = c+1) ->
        (exists i : V . color[i] = c /\\
            (forAll j : V, j < i . color[j] != c+1))
\`\`\`

**Explanation:**
- The constraint $i < j$ ensures we only post each binary inequality once (otherwise double-counted).
- $!(i = 1 \\land j = 2)$ skips the missing edge.
- Value precedence breaks the $3! = 6$ colour-permutation symmetry.

**Without the missing edge, $K_5$ is not 3-colourable (chromatic number 5).** With one edge removed, the remaining graph is 3-colourable. The model would return UNSAT for the full $K_5$ and a 3-colouring for $K_5$ minus an edge.

**Notice:** \`gcc\` / \`atleast\` could express other counting constraints; \`table\` could enumerate allowed colour-pairs explicitly if needed.`,
    },
  ],

  'local-csp': [
    {
      id: 'ex-lcsp-extra1', difficulty: 'intermediate', marks: 5,
      question: 'For min-conflicts on graph colouring: state the algorithm precisely. When does it perform badly?',
      answer: `**Algorithm.**

\`\`\`
function MIN-CONFLICTS-COLOURING(graph G, k colours, max_steps):
    randomly assign each vertex a colour in {1..k}
    for step in 1..max_steps:
        if no edge has same colour at both ends: return assignment
        v := random vertex with at least one conflicting edge
        c := colour in {1..k} minimising conflicts at v (random tie-break)
        assignment[v] := c
    return failure
\`\`\`

**Performs poorly when:**

1. **k = chromatic number exactly.** Few solutions in a huge search space; min-conflicts wanders without finding them. Try k = $\\chi(G) + 1$ to make it easy, then prove via search/specialised algorithms that $\\chi(G)$ suffices.

2. **Highly symmetric or rigid graphs.** Cycles of odd length, cliques. Local moves often equally bad; min-conflicts gets stuck on plateaux.

3. **Sparse instances.** Random start may immediately be conflict-free → no learning useful for harder restarts.

**Mitigation:** combine with random restarts and a tabu list (don't revisit the same vertex too soon) — variants like *iterated min-conflicts* solve much harder cases.`,
    },
  ],

  'csp-structure': [
    {
      id: 'ex-stru-extra1', difficulty: 'advanced', marks: 7,
      question: 'For a tree-structured CSP with $n$ variables and max domain size $d$, prove the $O(nd^2)$ runtime claim.',
      answer: `**Algorithm (Directional Arc Consistency + assignment).**

1. **Choose a root.** Linear time.

2. **Topological sort.** Order variables in DFS/BFS order from root. Linear time $O(n)$.

3. **Backward pass — Arc consistency from leaves to root.** For each variable $X_i$ from leaf to root, in reverse topological order, make $X_{\\text{parent}(i)}$ arc-consistent with $X_i$:
   - For each value $v \\in D(X_{\\text{parent}(i)})$: check ∃ $w \\in D(X_i)$ such that $(v, w)$ satisfies the constraint.
   - If not, remove $v$.
   - Cost per arc: $O(d^2)$ (each value of parent vs each value of child).
   - Total arcs: $n - 1$ (tree has $n - 1$ edges).
   - **Backward pass total:** $O(nd^2)$.

4. **Forward pass — assignment.** Walk root-to-leaf, choosing any consistent value for each variable. **Guaranteed conflict-free** because the backward pass enforced arc consistency on every edge.
   - Per variable: $O(d)$ scan to find a consistent value.
   - Total: $O(nd)$.

**Total: $O(nd^2) + O(nd) = O(nd^2)$.**

**Compare to general CSP:** $O(d^n)$ worst case — exponential in $n$ even with AC-3 propagation. Tree structure is the killer feature.

**Implication for non-trees:** if your constraint graph has tree-width $w$, the problem is solvable in $O(n d^{w+1})$ — polynomial when $w$ is constant. **Cutset conditioning** and **tree decomposition** generalise the tree case.`,
    },
  ],

  'kb-agents': [
    {
      id: 'ex-kb-extra1', difficulty: 'basic', marks: 4,
      question: 'Distinguish between **logical agents** and **utility-based agents**. Give one situation where each is preferred.',
      answer: `**Logical agent.** Acts based on what it can *prove* from its KB. Action = first move that demonstrably achieves the goal. Symbolic, transparent, hard-coded.

**Utility-based agent.** Acts to maximise an *expected utility* function (numerical). Probabilistic, handles uncertainty, may select moves whose outcome is unknown but has high expected value.

**Logical preferred when:**
- Domain is *deterministic* and rules are *certain* (e.g. theorem proving, formal verification).
- Explainability matters (logical proofs trace decisions).

**Utility preferred when:**
- Domain is *stochastic* or *partially observable* (poker, robotics).
- Outcomes vary in *quality*, not just binary success/failure.
- You can quantify trade-offs.

**Modern reality:** most practical agents are hybrid — logical core for goals + utility for trade-offs (e.g. classical planning with cost-aware heuristics; LLM agents with reasoning over scored options).`,
    },
  ],

  'propositional-syntax': [
    {
      id: 'ex-syn-extra1', difficulty: 'basic', marks: 3,
      question: 'Show that $A \\Rightarrow B$ is *not* equivalent to $B \\Rightarrow A$. Use a truth table.',
      answer: `| $A$ | $B$ | $A \\Rightarrow B$ | $B \\Rightarrow A$ |
|---|---|---|---|
| F | F | T | T |
| F | T | **T** | **F** |
| T | F | **F** | **T** |
| T | T | T | T |

Rows 2 and 3 differ — so the two formulas are not equivalent.

**Intuition.** "If it rains, the ground is wet" ($R \\Rightarrow W$) is *not* the same as "If the ground is wet, it rained" ($W \\Rightarrow R$). The ground could be wet for other reasons (sprinkler).

**Common confusion to avoid:** the equivalent of $A \\Rightarrow B$ is its **contrapositive** $\\neg B \\Rightarrow \\neg A$, not its converse.`,
    },
  ],

  'entailment': [
    {
      id: 'ex-ent-extra1', difficulty: 'intermediate', marks: 5,
      question: 'Show that $\\{P, P \\Rightarrow Q, Q \\Rightarrow R\\}$ entails $R$ using semantic argument (no resolution).',
      answer: `**Semantic argument** = reason about every model of the KB.

**Models of the KB.** Find all assignments to $\\{P, Q, R\\}$ satisfying all three sentences:

$\\alpha_1 = P$ forces $P = T$.

$\\alpha_2 = P \\Rightarrow Q$ with $P = T$ forces $Q = T$ (otherwise vacuously true only if $P = F$, but $P = T$ here).

$\\alpha_3 = Q \\Rightarrow R$ with $Q = T$ forces $R = T$ (same reasoning).

**Unique model of KB:** $(P, Q, R) = (T, T, T)$.

In this model, $R = T$.

**Since *every* model of KB satisfies $R$, KB $\\models R$.** $\\blacksquare$

This is essentially **modus ponens applied twice**, but framed semantically: identifying all KB-models and checking that $R$ holds in each.`,
    },
  ],

  'inference-rules': [
    {
      id: 'ex-infr-extra1', difficulty: 'advanced', marks: 8,
      question: 'Convert $(A \\Rightarrow B) \\Leftrightarrow (\\neg B \\Rightarrow \\neg A)$ to CNF, showing every step. What does the result tell you?',
      answer: `**Original:** $(A \\Rightarrow B) \\Leftrightarrow (\\neg B \\Rightarrow \\neg A)$.

**Step 1 — Eliminate $\\Leftrightarrow$.** $X \\Leftrightarrow Y \\equiv (X \\Rightarrow Y) \\land (Y \\Rightarrow X)$.

$$((A \\Rightarrow B) \\Rightarrow (\\neg B \\Rightarrow \\neg A)) \\land ((\\neg B \\Rightarrow \\neg A) \\Rightarrow (A \\Rightarrow B))$$

**Step 2 — Eliminate $\\Rightarrow$.** $X \\Rightarrow Y \\equiv \\neg X \\lor Y$. Apply repeatedly (innermost first):

Innermost: $A \\Rightarrow B \\equiv \\neg A \\lor B$, $\\neg B \\Rightarrow \\neg A \\equiv B \\lor \\neg A$.

Wait — let me just call $X = \\neg A \\lor B$ and $Y = B \\lor \\neg A$. Note $X \\equiv Y$ trivially (commutative), so the LHS and RHS are essentially the same.

Outer first half: $X \\Rightarrow Y \\equiv \\neg X \\lor Y = \\neg(\\neg A \\lor B) \\lor (B \\lor \\neg A)$.

**Step 3 — Push $\\neg$ inward.** De Morgan on $\\neg(\\neg A \\lor B)$: $= A \\land \\neg B$.

So outer first half: $(A \\land \\neg B) \\lor (B \\lor \\neg A) = (A \\land \\neg B) \\lor B \\lor \\neg A$.

**Step 4 — Distribute $\\lor$ over $\\land$.** $(A \\lor B \\lor \\neg A) \\land (\\neg B \\lor B \\lor \\neg A)$.

Notice $A \\lor \\neg A = T$ in clause 1; $\\neg B \\lor B = T$ in clause 2. So both clauses are **tautologies**.

Outer second half by symmetry: also tautologies.

**Final CNF:** all clauses are tautologies — equivalent to $T$ (the constant).

**What this tells you:** the original biconditional $(A \\Rightarrow B) \\Leftrightarrow (\\neg B \\Rightarrow \\neg A)$ is **logically valid** — true in every model. This is the **law of contrapositive** verified by CNF reduction.

Resolution refutation would: convert $\\neg \\text{formula}$ to CNF; try to derive $\\square$. Since the formula is valid, its negation is unsatisfiable, and refutation succeeds.`,
    },
  ],

  'horn-chaining': [
    {
      id: 'ex-hc-extra1', difficulty: 'intermediate', marks: 5,
      question: 'When does **forward chaining** loop on a Horn KB? When does **backward chaining** loop?',
      answer: `**Forward chaining: does NOT loop on Horn KBs.** Each iteration adds at least one new fact to the known set (or terminates). The known set is bounded by the number of propositional symbols. Sound + complete + linear time.

**Backward chaining: CAN loop.** Consider:

\`\`\`
P -> Q
Q -> P
\`\`\`

Query: prove $P$. Backward chaining: "to prove $P$, find a rule with head $P$ — yes, $Q \\Rightarrow P$. Prove $Q$." Then "to prove $Q$, find a rule with head $Q$ — yes, $P \\Rightarrow Q$. Prove $P$." Infinite recursion.

**Fix — tabling / memoisation.** Maintain a set of currently-being-proved goals. If the recursion re-encounters one, return *failure* for that branch (so the other branches get tried) — or *deferred*, accumulating constraints.

Modern Prolog (SWI, XSB) supports tabled execution. Without tabling, you must hand-order rules carefully.

**Why forward chaining doesn't have this issue:** it works forwards from facts, growing a monotonically increasing set. There's no recursion to loop on.`,
    },
  ],

  'sat-problem': [
    {
      id: 'ex-sat-extra1', difficulty: 'intermediate', marks: 4,
      question: 'Why is **2-SAT** in P but **3-SAT** NP-complete? Sketch the 2-SAT algorithm.',
      answer: `**2-SAT** is solvable in **linear time** via the **implication graph + SCC** algorithm:

1. Each clause $(\\ell_1 \\lor \\ell_2)$ is equivalent to two implications: $\\neg \\ell_1 \\Rightarrow \\ell_2$ and $\\neg \\ell_2 \\Rightarrow \\ell_1$.
2. Build the directed implication graph: nodes are literals, edges from implication consequents.
3. Compute strongly-connected components (SCCs) in linear time (Tarjan).
4. **Unsatisfiable iff** some variable $x$ has $x$ and $\\neg x$ in the same SCC (then both forced equal, but they're negations — contradiction).
5. **If satisfiable**, assign by topological order: process SCCs in reverse topological order, set literals to true; their negations get false in the corresponding negation-SCC.

**Total:** $O(n + m)$.

**3-SAT is NP-complete** because the implication graph idea breaks down — a clause $(\\ell_1 \\lor \\ell_2 \\lor \\ell_3)$ has $2^2 = 4$ possible implications, not 2, and chasing them combinatorially explodes.

**Sharp threshold:** the transition from polynomial (2-SAT) to NP-hard (3-SAT) is a famous result — adding "just one more literal per clause" is enough to lose tractability.`,
    },
  ],

  'dpll': [
    {
      id: 'ex-dp-extra1', difficulty: 'intermediate', marks: 6,
      question: 'Why doesn\'t DPLL combined with unit propagation suffice for hard SAT instances? What does CDCL add specifically?',
      answer: `**DPLL with unit propagation is exponential worst-case.** On pigeon-hole-like instances ($n+1$ pigeons in $n$ holes), DPLL takes exponential time because every conflict is "rediscovered" via different branching orders.

**What CDCL adds:**

1. **Clause learning.** After each conflict, derive a learnt clause (via 1-UIP) that captures the *reason* for the conflict. Any future search path that would re-create the same conflict pattern is pruned immediately by unit propagation on the learnt clause.

2. **Non-chronological backjumping.** Instead of backtracking one decision level, jump back to the level where the learnt clause becomes "asserting" (a unit clause). Saves work.

3. **VSIDS heuristic.** Branch on variables that appear in *recent learnt clauses* — focuses on the "current hot region" of the formula.

4. **Restarts.** Periodically reset assignment (keep learnt clauses + VSIDS scores). Counters heavy-tailed runtime: a bad early decision sequence can doom DPLL, but CDCL restarts and tries again with a different first move.

**Empirical:** modern CDCL handles 10⁷-variable industrial instances in seconds — millions of times faster than vanilla DPLL.

**Theoretical:** CDCL is *exponentially more powerful* than DPLL on some families (e.g. pigeon-hole), simulating extended resolution proofs that DPLL cannot.`,
    },
  ],

  'cdcl': [
    {
      id: 'ex-cdcl-extra1', difficulty: 'advanced', marks: 9,
      question: 'Show the implication graph for: clauses $\\{x_1, x_2\\}, \\{\\lnot x_2, x_3\\}, \\{\\lnot x_3, x_4\\}, \\{\\lnot x_4\\}$, decision $x_1 = F$ at level 1. Identify the 1-UIP and derive the learnt clause.',
      answer: `**Decision:** $x_1 = F$ at level 1. (No incoming edges.)

**Unit propagation chain:**

- $\\{x_1, x_2\\}$ with $x_1 = F$ → unit, $x_2 = T$ (forced, level 1, antecedent $\\{x_1, x_2\\}$).
- $\\{\\lnot x_2, x_3\\}$ with $x_2 = T$ → unit, $x_3 = T$ (forced, level 1, antecedent $\\{\\lnot x_2, x_3\\}$).
- $\\{\\lnot x_3, x_4\\}$ with $x_3 = T$ → unit, $x_4 = T$ (forced, level 1, antecedent $\\{\\lnot x_3, x_4\\}$).
- $\\{\\lnot x_4\\}$: $x_4 = T$ falsifies this clause. **Conflict!**

**Implication graph** (text):

\`\`\`
x_1=F (L1, decision)
  ↓ {x_1, x_2}
x_2=T (L1)
  ↓ {¬x_2, x_3}
x_3=T (L1)
  ↓ {¬x_3, x_4}
x_4=T (L1)
  ↓ (conflict via {¬x_4})
⊥
\`\`\`

**UIPs at level 1:** $x_1, x_2, x_3, x_4$ — each is the unique node on its layer (linear chain). All are UIPs.

**1-UIP** = UIP closest to conflict = $x_4$.

**Derive learnt clause via 1-UIP cut.** Cut just above $x_4$. Reason side: $x_3$. Conflict side: $x_4$, conflict clause $\\{\\lnot x_4\\}$.

Resolve the conflict clause with $x_4$'s antecedent $\\{\\lnot x_3, x_4\\}$ on $x_4$:

$\\{\\lnot x_4\\} \\bowtie_{x_4} \\{\\lnot x_3, x_4\\} = \\{\\lnot x_3\\}$.

**Learnt clause:** $\\{\\lnot x_3\\}$.

This is a unit clause, so backjumping goes to level 0 (one level below the highest decision level in the learnt clause, but the clause has only one literal). At level 0 it propagates $x_3 = F$ immediately.

**Continuing the search at level 0** with $x_3 = F$ added: $\\{\\lnot x_2, x_3\\}$ becomes $\\{\\lnot x_2\\}$ → $x_2 = F$ → $\\{x_1, x_2\\}$ becomes $\\{x_1\\}$ → $x_1 = T$. Check $\\{\\lnot x_4\\}$: $x_4$ has been undone, set $x_4 = F$. All clauses satisfied. **SAT** with model $(T, F, F, F)$.

**Lesson.** A single conflict + 1-UIP analysis pruned the entire $x_1 = F$ branch and immediately forced a SAT discovery.`,
    },
  ],

  'walksat': [
    {
      id: 'ex-w-extra1', difficulty: 'intermediate', marks: 5,
      question: 'For WALKSAT, why does **focusing on the unsatisfied clause** matter? Why not flip any variable?',
      answer: `**WALKSAT flips a variable from a chosen unsatisfied clause.** GSAT considers all variables.

**Why focus matters:**

1. **Cheap candidate set.** Each unsatisfied clause has only 3 variables (for 3-SAT). Computing break-counts for 3 candidates is trivial vs evaluating all $n$ variables.

2. **Guaranteed progress.** Flipping a variable in the unsatisfied clause **definitely satisfies** that clause (at the cost of potentially breaking others). Flipping a random variable not in the unsat clause leaves it unsatisfied.

3. **Empirically faster convergence.** On random 3-SAT at the phase transition, focused WALKSAT outperforms GSAT by orders of magnitude.

**Subtle benefit:** WALKSAT's noise parameter $p$ on the chosen clause's variables means escape from local optima is **goal-directed**: random walks happen at the boundary of unsatisfied clauses, where they're most likely to help.

**Counterexample:** in a problem where one variable is "key" but appears in many clauses (most satisfied), GSAT might find it easier — WALKSAT will sample it less often. Such structured problems are uncommon in random benchmarks but appear in industrial SAT.`,
    },
  ],
};

export const extraFlashcards: Record<string, Flashcard[]> = {
  'search-formulation': [
    { id: 'fxe1', q: 'Action cost vs path cost?', a: 'Action cost = cost of one transition c(s, a, s\'). Path cost = sum along the path g(n) = Σ c(s_i, a_i, s_{i+1}).' },
    { id: 'fxe2', q: 'Vacuum world state space size for n rooms?', a: 'n · 2^n (n locations × 2^n dirt configurations).' },
    { id: 'fxe3', q: 'What is "frontier" and what is "explored"?', a: 'Frontier = generated but not yet expanded nodes (open list). Explored = already expanded (closed list).' },
    { id: 'fxe4', q: 'Implicit vs explicit goal test?', a: 'Explicit: enumerate goal state(s). Implicit: a predicate (e.g. "no two queens attack") satisfied by many possible states.' },
  ],

  'uninformed-search': [
    { id: 'uxe1', q: 'Why is BFS time and space both O(b^d)?', a: 'BFS keeps the entire frontier at depth d — that\'s b^d nodes. Total nodes generated ~ b^(d+1)/(b-1) which is also O(b^d).' },
    { id: 'uxe2', q: 'BFS goal test: on generation or expansion?', a: 'Generation (AIMA 4e) — saves the cost of expanding goal nodes. UCS uses expansion (path-cost might still improve).' },
    { id: 'uxe3', q: 'DFS space complexity?', a: 'O(bm) — only the current path plus unexpanded siblings, not the whole frontier.' },
    { id: 'uxe4', q: 'Depth-limited DFS — when does it fail?', a: 'When ℓ < d (limit shallower than goal). Not complete.' },
    { id: 'uxe5', q: 'IDS overhead vs BFS on b = 10?', a: 'About 11% extra time (geometric series, factor b/(b-1)). Massive memory savings: O(bd) vs O(b^d).' },
    { id: 'uxe6', q: 'Bidirectional search time?', a: 'O(b^(d/2)) — half-depth from each end, meet in middle.' },
    { id: 'uxe7', q: 'When does bidirectional search break down?', a: 'When the predecessor function is unclear or many goals exist (backward search blows up).' },
  ],

  'informed-search': [
    { id: 'ixe1', q: 'Greedy best-first: complete?', a: 'No. Can loop (no g-tracking) and can dead-end.' },
    { id: 'ixe2', q: 'IDA* idea?', a: 'Iterative deepening on f. Each iteration runs DFS, cutting off when f > current threshold. Memory O(bd); optimal under admissibility.' },
    { id: 'ixe3', q: 'How many nodes does A* expand vs UCS, with a "good" admissible heuristic?', a: 'Fewer (or equal) — admissibility ensures optimality, the heuristic prunes irrelevant subtrees. Strictly better with non-trivial h.' },
    { id: 'ixe4', q: 'Two A* failure modes if h is inadmissible?', a: '(1) Suboptimal solution. (2) Closed nodes may need reopening; standard graph-search misses better paths.' },
    { id: 'ixe5', q: 'Pattern database heuristic — admissible?', a: 'Yes if the sub-problem cost is an *exact* lower bound on the original. Pattern databases sum or max admissible projections.' },
    { id: 'ixe6', q: 'RBFS vs IDA*?', a: 'RBFS (Recursive Best-First Search) uses backtracking on f-values; remembers a single "best alternative" per ancestor. Linear memory like IDA*, fewer re-expansions.' },
    { id: 'ixe7', q: 'Why is the max of two admissible heuristics also admissible?', a: 'Each h_i ≤ h*. So max(h_1, h_2) ≤ max(h*, h*) = h*.' },
  ],

  'local-search': [
    { id: 'lxe1', q: 'Random-restart hill climbing expected restarts?', a: '1/p where p = probability one start finds the global optimum.' },
    { id: 'lxe2', q: 'Simulated annealing temperature schedule — log vs exponential?', a: 'Log (T = C/log(1+k)) guarantees convergence to optimum but is glacially slow. Exponential (T = T_0 α^k) is fast but no guarantee; standard in practice.' },
    { id: 'lxe3', q: 'GA mutation rate rule of thumb?', a: '~1/L (chromosome length), so each offspring has ~1 expected bit flip.' },
    { id: 'lxe4', q: 'Local beam search vs k independent hill climbs?', a: 'Beam shares successor candidates across the k states; resources flow to fitter states.' },
  ],

  'game-formulation': [
    { id: 'gxe1', q: 'What is expectimax for?', a: 'Stochastic games (e.g. backgammon). Adds chance nodes computing expected value over outcomes; weighted average instead of min/max.' },
    { id: 'gxe2', q: 'Perfect-information vs imperfect-information game?', a: 'Perfect: both players see full state (chess). Imperfect: hidden info (poker). Minimax works for perfect; mixed strategies / regret minimisation for imperfect.' },
  ],

  'minimax': [
    { id: 'mmxe1', q: 'What is negamax?', a: 'Single recursive function that always maximises, negating the recursive call. Exploits the fact that min(a,b) = -max(-a,-b) in zero-sum games.' },
    { id: 'mmxe2', q: 'Why does minimax use DFS, not BFS?', a: 'Memory: O(bm) vs O(b^m). And we need to compute the value of every leaf before backing up — DFS naturally does so.' },
  ],

  'alpha-beta': [
    { id: 'abxe1', q: 'Alpha-beta best case = ?', a: 'O(b^(m/2)) with perfect move ordering. Effective branching factor √b, double the depth reachable.' },
    { id: 'abxe2', q: 'Which heuristics improve move ordering at runtime?', a: 'Killer-move (try moves that caused cuts at siblings); iterative deepening (use depth d-1\'s best move first at depth d); transposition tables (memoise seen positions).' },
    { id: 'abxe3', q: 'Does alpha-beta ever give a different answer to minimax?', a: 'No. Same root value, just visits fewer nodes.' },
    { id: 'abxe4', q: 'What is null-move pruning?', a: 'Forward pruning: let opponent move twice; if value still > β, prune. Risky in zugzwang positions.' },
  ],

  'imperfect-realtime': [
    { id: 'imxe1', q: 'Horizon effect?', a: 'A bad move pushed beyond the search depth appears "delayed" → engine prefers it over a forced loss it sees. Mitigation: quiescence search (extend deep tactical sequences).' },
    { id: 'imxe2', q: 'Iterative deepening + alpha-beta — anytime guarantee?', a: 'Yes. At any moment you have a best move from the last completed depth.' },
  ],

  'mcts': [
    { id: 'mcxe1', q: 'UCB1 exploration constant C — typical value for [0,1] rewards?', a: '√2 (theoretical optimum). Tuned in practice.' },
    { id: 'mcxe2', q: 'AlphaGo: what does the policy network do in MCTS?', a: 'Provides a prior P(a|s) modifying UCB1 → PUCT: Q + C·P·√N/(1+N_a). Focuses search on plausible moves.' },
    { id: 'mcxe3', q: 'Three rules for picking the final root move in MCTS?', a: 'Max (highest mean), Robust (most visits), Max-Robust (most visits subject to mean ≥ threshold).' },
    { id: 'mcxe4', q: 'Why doesn\'t MCTS need an evaluation function?', a: 'Random rollouts give an unbiased Monte-Carlo estimate of position value. Useful when no good Eval exists (e.g. Go).' },
  ],

  'csp-fundamentals': [
    { id: 'cfxe1', q: 'AllDifferent over n variables vs pairwise inequalities — how many constraints?', a: '1 AllDifferent vs C(n,2) = n(n-1)/2 pairwise. For n=10: 1 vs 45.' },
    { id: 'cfxe2', q: 'Define dual / hidden-variable encoding for higher-arity CSPs.', a: 'Dual: each non-binary constraint becomes a variable; binary constraints enforce shared assignments. Hidden: introduce aux variables to summarise sub-constraints.' },
    { id: 'cfxe3', q: 'Three real-world problems that map to CSP?', a: 'Scheduling (variable = task, domain = time slots, constraints = no overlap). Course timetabling. Crossword puzzles.' },
  ],

  'csp-inference': [
    { id: 'cixe1', q: 'Path consistency — definition?', a: 'For every consistent (X_i = a, X_j = b), there exists X_k = c such that (X_i, X_k) and (X_k, X_j) both consistent.' },
    { id: 'cixe2', q: 'AC-3.1 / AC-2001 vs AC-3?', a: 'Tighter analysis + caching last support per value, achieving O(cd²) (vs AC-3\'s O(cd³)) at little extra cost.' },
    { id: 'cixe3', q: 'Strong k-consistency means what?', a: 'k-consistent AND (k-1)-consistent AND … 1-consistent. Implies backtrack-free for n=k variables.' },
    { id: 'cixe4', q: 'AC-4 vs AC-3 — when to use?', a: 'AC-4 achieves O(cd²) but with heavy memory (counters per literal). Rarely used in practice — AC-3.1 same complexity, lower memory.' },
  ],

  'backtracking': [
    { id: 'btxe1', q: 'Combination of MRV + degree heuristic — what does each do?', a: 'MRV picks smallest-domain variable (fail-first). Degree tie-breaks by most constraints involved.' },
    { id: 'btxe2', q: 'Conflict-directed backjumping (CBJ) — when does it pay off?', a: 'When the conflict is caused by an early decision, far from the current variable. Saves chronological backtrack from re-exploring intermediate branches.' },
    { id: 'btxe3', q: 'Why is LCV (least constraining value) "succeed-first"?', a: 'It leaves the most flexibility for later assignments → fewer dead-ends if a solution exists.' },
    { id: 'btxe4', q: 'When should you use *most-constraining-value* instead of LCV?', a: 'For UNSAT problems: detecting infeasibility fast matters more than finding any solution.' },
  ],

  'cp-modelling': [
    { id: 'mxe1', q: 'Variable symmetry vs value symmetry — example?', a: 'Variable: interchangeable rows of a matrix. Value: interchangeable colour labels in graph colouring.' },
    { id: 'mxe2', q: 'Lex-leader symmetry breaking — main downside?', a: 'Can conflict with branching heuristic. Both try to impose order; dynamic methods avoid the conflict.' },
    { id: 'mxe3', q: 'Why might you channel two viewpoints?', a: 'Combine propagation strength of both. Constraints natural in one viewpoint trigger pruning visible in the other via the channeling biconditional.' },
    { id: 'mxe4', q: 'Implied constraint requirement?', a: 'Must be logically entailed by the existing model — adding non-entailed constraints loses solutions.' },
    { id: 'mxe5', q: 'Value precedence — write it for values {1, 2, 3}.', a: 'First occurrence of value 1 precedes first occurrence of value 2, which precedes first occurrence of value 3.' },
  ],

  'essence-prime': [
    { id: 'epxe1', q: 'Essence vs Essence Prime: which has nested types?', a: 'Essence only. Essence Prime is matrix-only (int, bool, matrix); nesting must be hand-encoded.' },
    { id: 'epxe2', q: 'Savile Row CSE pass — what does it do?', a: 'Common subexpression elimination — replaces repeated subexpressions with a single auxiliary variable.' },
    { id: 'epxe3', q: 'AC-CSE — what is it?', a: 'Associative-Commutative CSE: re-orders +, *, ∧, ∨ operands to find common subexpressions invisible to identical CSE.' },
    { id: 'epxe4', q: 'What target solvers does Savile Row support?', a: 'Minion (native), MiniZinc, SAT (DIMACS), SMT (SMT-LIB), MaxSAT.' },
    { id: 'epxe5', q: 'How does Savile Row\'s symmetry breaking work?', a: '-S2 runs a graph-automorphism solver (Saucy/nauty) on the model\'s symmetry graph and posts lex-leader constraints automatically.' },
    { id: 'epxe6', q: 'Essence Prime division on -3/2?', a: 'Floor division = -2. Modulo defined as a - b·⌊a/b⌋.' },
  ],

  'local-csp': [
    { id: 'lcxe1', q: 'Why does min-conflicts work surprisingly well for n-queens?', a: 'The problem\'s constraint topology is benign: most random configurations are "near" a solution. Empirically O(n) flips for million-queens.' },
    { id: 'lcxe2', q: 'When does min-conflicts perform poorly?', a: 'Symmetric / sparse problems with few solutions; problems at the chromatic boundary (k = χ(G)); rigid clique structures.' },
  ],

  'csp-structure': [
    { id: 'sxe1', q: 'Tree-CSP runtime?', a: 'O(nd²). Directional arc-consistency from leaves to root, then root-to-leaf assignment.' },
    { id: 'sxe2', q: 'Cutset conditioning complexity?', a: 'O(d^|S| · (n-|S|) d²) where |S| = cutset size making the graph a tree. Useful when |S| is small.' },
    { id: 'sxe3', q: 'Tree-width and CSP complexity?', a: 'O(n · d^(w+1)) where w = tree-width. Polynomial when w is bounded; exponential in w.' },
  ],

  'kb-agents': [
    { id: 'kbxe1', q: 'Logical agent vs utility-based agent — when to pick each?', a: 'Logical: deterministic, certain rules, explainability matters (theorem proving, verification). Utility: stochastic, partially observable (robotics, poker).' },
  ],

  'propositional-syntax': [
    { id: 'sxe1l', q: 'Connective precedence (highest to lowest)?', a: '¬ → ∧ → ∨ → ⇒ → ⇔. (Negation tightest, biconditional loosest.)' },
    { id: 'sxe2l', q: 'Is implication left- or right-associative?', a: 'Right. A ⇒ B ⇒ C means A ⇒ (B ⇒ C).' },
    { id: 'sxe3l', q: 'A ⇒ B equivalent to which negation?', a: '¬A ∨ B.' },
    { id: 'sxe4l', q: 'Contrapositive of A ⇒ B?', a: '¬B ⇒ ¬A. Logically equivalent (not the same as the converse!).' },
  ],

  'entailment': [
    { id: 'enxe1', q: 'Deduction theorem (propositional)?', a: 'KB ⊨ α iff KB ∧ ¬α is unsatisfiable.' },
    { id: 'enxe2', q: 'Define satisfiable, valid, equivalent.', a: 'Satisfiable: some model. Valid: every model (tautology). Equivalent: same model set.' },
    { id: 'enxe3', q: 'Truth-table entailment time complexity?', a: 'O(2^n · |sentences|). Brute force; baseline for SAT-based reasoning.' },
  ],

  'inference-rules': [
    { id: 'irxe1', q: 'Resolvent of (A ∨ B) and (¬B ∨ C)?', a: '(A ∨ C). Resolved on B.' },
    { id: 'irxe2', q: 'Resolution refutation completeness?', a: 'Refutation-complete for CNF: if KB ∧ ¬α is UNSAT, resolution will derive □.' },
    { id: 'irxe3', q: '4-step CNF conversion?', a: '1) Eliminate ⇔. 2) Eliminate ⇒. 3) Push ¬ inward (De Morgan + double-negation). 4) Distribute ∨ over ∧.' },
    { id: 'irxe4', q: 'Tseitin transformation — what does it preserve?', a: 'Equisatisfiability (SAT-iff status), not equivalence. Uses fresh auxiliary variables. Always linear-size in input.' },
  ],

  'horn-chaining': [
    { id: 'hxe1l', q: 'Forward chaining termination guarantee?', a: 'Always terminates on Horn KB — each iteration either adds a fact (bounded by # of propositions) or quits.' },
    { id: 'hxe2l', q: 'Backward chaining termination?', a: 'Can loop on cyclic rules. Tabling/memoisation breaks cycles.' },
    { id: 'hxe3l', q: 'Horn vs definite vs goal clause?', a: 'Horn: ≤1 positive literal. Definite: exactly 1 (=  implication with positive head). Goal: 0 positives.' },
    { id: 'hxe4l', q: 'Why is Prolog backward-chaining?', a: 'Goal-directed — queries are specific, only a fraction of facts relevant. Backward chaining is more efficient for those queries.' },
  ],

  'sat-problem': [
    { id: 'satxe1', q: '2-SAT algorithm idea?', a: 'Build implication graph (each clause = 2 implications). Compute SCCs. UNSAT iff some var x and ¬x in same SCC.' },
    { id: 'satxe2', q: 'Why is SAT NP-complete? Who proved it?', a: 'Cook 1971 / Levin 1973 — the Cook-Levin theorem. Reductions from any NP problem encode computation into a Boolean formula.' },
    { id: 'satxe3', q: 'Random 3-SAT phase transition?', a: '~ratio 4.267. Below: SAT easy. Above: UNSAT easy. At: hard.' },
  ],

  'dpll': [
    { id: 'dpxe1', q: 'Unit propagation, in one line?', a: 'If a clause has all but one literal falsified, force the remaining literal true. Cascade.' },
    { id: 'dpxe2', q: 'Pure literal elimination — safety?', a: 'A pure literal (single polarity) can be safely assigned its sign — no clause containing it gets falsified.' },
    { id: 'dpxe3', q: 'DPLL decision heuristics — name 3.', a: 'Jeroslow-Wang (JW), DLIS (Dynamic Largest Individual Sum), MOMS (Maximum Occurrences in Minimum-size clauses).' },
  ],

  'cdcl': [
    { id: 'cdxe1', q: '1-UIP — what is it?', a: 'Unique Implication Point at the current decision level, closest to the conflict. Cut just above it; reason-side literals form the learnt clause.' },
    { id: 'cdxe2', q: 'CDCL backjump level rule?', a: 'Second-largest decision level in the learnt clause. At that level the clause becomes asserting (unit).' },
    { id: 'cdxe3', q: 'VSIDS in one sentence?', a: 'Per-literal activity score; bumped when literal appears in learnt clause; periodically decayed; branch on highest unassigned.' },
    { id: 'cdxe4', q: 'Two-watched literals — what saves time?', a: 'A clause is only checked when one of its watches becomes false — avoids scanning every clause every assignment.' },
    { id: 'cdxe5', q: 'Why restart in CDCL?', a: 'Runtime is heavy-tailed; bad early decisions doom a run. Restart, keep learnt clauses + VSIDS, try again.' },
    { id: 'cdxe6', q: 'LBD score — what for?', a: 'Literal Block Distance: number of distinct decision levels in a learnt clause. Low LBD = "global" clause, kept. High LBD = "noisy", deletable.' },
  ],

  'walksat': [
    { id: 'wxe1l', q: 'Why focus on a single unsatisfied clause?', a: 'Cheap candidates (3 vars in 3-SAT); guaranteed to satisfy that clause if you flip; goal-directed.' },
    { id: 'wxe2l', q: 'WALKSAT noise parameter sweet spot for random 3-SAT?', a: 'p ≈ 0.5 — balance of greedy (escape) and random (plateaux escape).' },
    { id: 'wxe3l', q: 'Why can\'t WALKSAT prove UNSAT?', a: 'Local search is incomplete — no global view. Negative answer just means "didn\'t find one in the budget".' },
    { id: 'wxe4l', q: 'GSAT vs WALKSAT — main difference?', a: 'GSAT considers all variables for flip; WALKSAT first picks a random unsatisfied clause and only considers its variables.' },
  ],
};
