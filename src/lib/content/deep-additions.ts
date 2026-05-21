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

    { kind: 'md', body: `## 📖 Phrasebook — informed search (A* etc.)

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace A*" | Maintain frontier ordered by $f(n) = g(n) + h(n)$; expand lowest-f | Show f at every popped node |
| "Use Manhattan distance" | $h = \\sum_i |x_i - x_i^*|$ for grid problems | Admissible + consistent if unit costs |
| "Is this heuristic admissible?" | Prove $h(n) \\le h^*(n)$ via relaxation (drop a constraint, solve relaxed) | Standard relaxation argument |
| "Is this heuristic consistent?" | Prove $h(n) \\le c(n, n') + h(n')$ for every successor | Stronger than admissibility |
| "A* with tree search vs graph search" | Tree: admissibility suffices for optimality. Graph: need consistency (or re-open closed) | Common pitfall |
| "Greedy best-first vs A*" | Greedy expands by $h(n)$ alone — not optimal | A* combines with $g(n)$ |
| "Heuristic dominance" | $h_2$ dominates $h_1$ iff $h_2 \\ge h_1$ pointwise (both admissible) → expands fewer nodes | Use $\\max(h_1, h_2)$ for a stronger admissible |
| "Effective branching factor" | $b^*$ such that uniform tree of depth $d$ with branching $b^*$ has $N+1$ nodes | Smaller = better |
| "Pattern database / sub-problem heuristic" | Solve a relaxed sub-problem exhaustively, hash costs | Admissible by construction |

## How this connects

- A* is the **goal-directed** version of uniform-cost search: UCS = A* with $h = 0$.
- The admissibility / consistency distinction mirrors **AC vs strong-AC** in CSPs: a stronger property gives stronger guarantees.
- **Sub-problem heuristics** = pre-computed propagation for the relaxed problem (analogous to AC at the root of CSP search).
- **IDA*** swaps A*'s exponential memory for time — similar to BFS↔IDS trade.` },
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

    { kind: 'md', body: `## 📖 Phrasebook — imperfect / real-time games

| If the question says... | Do... | Notes |
|---|---|---|
| "Horizon effect" | The static evaluator at fixed depth misjudges mid-tactic positions | Solution: quiescence search |
| "Quiescence search" | Don't return static eval at cutoff if position is "noisy"; extend on captures / checks | Bounded by capture-sequence length |
| "Transposition table" | Cache positions: $(value, depth, flag)$ where flag ∈ {EXACT, LOWER, UPPER} | Hash via Zobrist |
| "Why flag types?" | α-β returns bounds (not exact values) when it cuts; the cached value's role depends on which cut | Critical for correct re-use |
| "Iterative deepening for games" | Search at depth 1, 2, ..., $d$; use earlier best moves to seed move ordering at depth $d$ | Massive α-β speedup |
| "Killer heuristic" | Per-depth list of "moves that caused cuts at sibling nodes" — try first | O(1) per node |
| "History heuristic" | Per-move cumulative count of cuts caused; sort moves by this | Smoother than killer |
| "Static evaluation function" | $\\text{eval}(s) = \\sum_i w_i f_i(s)$ with weighted features | Tune by hand or self-play |
| "Branching factor in chess" | $b \\approx 35$. Depth ~6 plies needed for grandmaster strength | α-β: ~$b^{d/2} = 35^3 \\approx 40k$ leaves/turn |` },
  ],

  // Add to csp-fundamentals: global vs local consistency, plus heavy what-if pack
  'csp-fundamentals': [
    { kind: 'md', body: `## Local vs global node consistency (and why the same split applies to AC)

A common point of confusion — and a frequent exam phrasing.

### Local node consistency

**Local node consistency at $X_i$.** $D(X_i)$ contains only values that satisfy every unary constraint involving $X_i$. It is a property of one variable.

### Global node consistency

**Global node consistency** (also called *network node consistency*) holds when **every** variable in the CSP is locally node-consistent. It is a property of the whole CSP.

For unary constraints, the two are equivalent up to iteration: enforcing local NC at every variable in sequence gives global NC in a single pass (unary constraints don't interact).

### Why the distinction matters

The same split appears for arc consistency, and there it matters more:

| Property | Holds at | Achieved by |
|---|---|---|
| **Local arc consistency** for arc $(X_i, X_j)$ | one directed arc | a single \`REVISE($X_i$, $X_j$)\` call |
| **Global arc consistency** | the whole CSP | AC-3 / AC-4 / AC-2001 — iterate until fixpoint |

A REVISE call enforces *local* AC for one arc. AC-3 iterates REVISE calls (re-enqueueing affected arcs on each shrink) until every arc is locally AC, at which point the network is **globally** arc-consistent.

### Exam wording cheatsheet

- "Enforce global node consistency" = apply every unary constraint to its variable's domain. Stop when no unary constraint can prune any further value.
- "Enforce node consistency at $X_i$" = local NC: prune $D(X_i)$ by all unary constraints on $X_i$ only.
- "Enforce global arc consistency" = run an AC algorithm (AC-3 etc.) until fixpoint.
- "Enforce arc consistency on arc $(X_i, X_j)$" = one REVISE call.` },

    { kind: 'callout', variant: 'pitfall', title: 'Subtle global-vs-local pitfall', body: `If a question says "enforce node consistency on this CSP" with no qualifier, it usually means **global** — every variable. If it says "enforce node consistency at $X_3$", that's **local** — only prune $D(X_3)$.` },

    { kind: 'md', body: `## What-if pack: CSP fundamentals

A grab-bag of "what if I change one thing?" questions to develop intuition. Try each by editing the CSPLab visualiser.

### What if a constraint has arity 3?
Two options:
1. **Encode as binary**: introduce a "tuple variable" $T$ whose domain is the set of allowed 3-tuples, plus binary equality constraints linking each $X_i$ to the $i$-th coordinate of $T$ (the **hidden variable encoding** / *dual encoding*).
2. **Keep as global constraint** and use a custom propagator (GAC) — usually faster.

### What if two constraints are between the same two variables?
Conjoin into one constraint with allowed tuples = intersection of the two. The constraint graph still has one edge.

### What if a variable has an empty domain initially?
The CSP is trivially unsatisfiable. AC-3 detects it in 0 work (NC phase already prunes to ∅, or you spot it before search).

### What if all domains are singletons?
You have an *assignment*; check feasibility by evaluating each constraint. CSP solving = constraint checking = polytime.

### What if the constraint graph is disconnected?
Each connected component is an independent sub-CSP. Solve each separately; combine. Total cost = sum, not product.

### What if I replace a constraint $X_1 \\le X_2$ with $X_1 < X_2$?
For integer domains, AC-3 may prune *more* values: the strict inequality removes the diagonal $(v, v)$, often killing extra values at domain boundaries.

### What if I add an "implied constraint" that's already entailed?
Doesn't change the set of solutions. But it can *increase propagation* — exactly the role of redundant constraints in CP modelling.

### What if I add a "redundant" constraint that's NOT entailed?
You lose solutions. Always test: if your "implied constraint" rejects a solution to the original, it isn't implied.` },

    { kind: 'md', body: `## 🔗 Cross-module synthesis — how CSP, SAT, Search, Logic, Adversarial all connect

This module's algorithms are not isolated. The same ideas reappear across the syllabus — recognising the connections lets you transfer intuition AND answer questions that span topics.

### Propagation ≈ unit propagation ≈ constant folding

| Module | Equivalent |
|---|---|
| **CSP** | Arc consistency (AC-3) — propagate domain reductions to fixpoint |
| **SAT** | Unit propagation in DPLL — propagate forced literals to fixpoint |
| **Logic** | Forward chaining for Horn KB — derive facts to closure |
| **Compilers** | Constant folding + dead-code elimination |

All four "propagate cheap conclusions to fixpoint before doing anything expensive". Same engineering trick.

### Backtracking ≈ DPLL ≈ depth-first game search

| Module | Algorithm | Decide → propagate → recurse → fail-undo |
|---|---|---|
| **CSP** | BT + FC / BT + MAC | Decide $X = v$ → FC/MAC → recurse → on wipeout undo |
| **SAT** | DPLL | Decide $\\ell$ → UP → recurse → on conflict undo |
| **Adversarial** | Minimax depth-first | Decide move → recurse to opponent → on cut-off undo |

The "decide-propagate-recurse-undo" skeleton is the SAME. Differences: what propagation does, what "fail" means, what backtrack does.

### Learning ≈ memoisation ≈ implied constraints

| Module | Mechanism |
|---|---|
| **CSP** | Nogood recording (CBJ); implied constraints (modelling) |
| **SAT** | Learnt clause (CDCL) |
| **Adversarial** | Transposition table |
| **Search** | Pattern databases for A* heuristics |

All four are "remember work you did so you don't redo it". CDCL formalises this: every learnt clause is a proven implication.

### Local search ≈ stochastic SAT ≈ MCTS rollouts

| Module | Algorithm |
|---|---|
| **CSP** | Min-conflicts |
| **SAT** | WALKSAT (+ noise) |
| **Optimisation** | Simulated annealing |
| **Adversarial** | MCTS rollouts (random play to terminal) |

All four sample the search space rather than enumerate it. None can prove infeasibility.

### Decomposition vs global propagator

| Module | Decompose | Global |
|---|---|---|
| **CSP** | Pairwise ≠ | AllDifferent (Régin GAC) |
| **SAT** | $n^2$ at-most-one clauses | Cardinality encoding (totalizer) |
| **Logic** | Resolve each pair | Cutting-plane reasoning |

Globals propagate strictly stronger (Hall, totalizer, etc.); decomposition is simpler but weaker. Same trade-off everywhere.

### Heuristics on variables vs on values

| Module | Variable heuristic | Value heuristic |
|---|---|---|
| **CSP** | MRV / dom-wdeg / activity / last-conflict | LCV / Geelen's promise / solution-counting |
| **SAT** | VSIDS / activity / phase-saving | Phase-saving (which polarity to try) |
| **Adversarial** | Killer / history (move ordering) | (move = both variable + value at once) |

Variable choice: "where to decide" (fail-first). Value choice: "what to try first" (succeed-first).

### Phase transition

| Module | Threshold |
|---|---|
| **SAT** (random 3-SAT) | $m/n \\approx 4.27$ — hardest, P(SAT) crossover |
| **CSP** (random binary) | Similar empirical phenomenon |
| **Graph colouring** | $k/n$ crossover where $k$ = colours, $n$ = vertices |

Universality: large random combinatorial problems are usually easy except in a narrow critical region.

### Complexity classes

- **Polynomial islands**: tree-CSPs (DAC), 2-SAT (SCC), Horn-SAT (chaining), bipartite matching (Hopcroft-Karp).
- **NP-hard general cases**: general CSP, SAT, k-colouring, scheduling.
- **Resolution lower bounds (Haken)**: pigeonhole takes exponential time to refute — pushes both DPLL and CDCL.

Same algorithm complexity story across modules: identify the polynomial fragment, fall back to NP-hard methods only when needed.

### Take-aways

1. Recognise which "shape" your question fits — CSP / SAT / logic / search / adversarial — then apply the *module-specific algorithm* and its connections.
2. Many ideas (propagation, decision-propagate-recurse, nogood learning, decomposition vs global, fail-first heuristics) repeat. Transfer intuition.
3. If you're stuck on a hard problem, look at the "polynomial-island" fragments first (tree-CSP, 2-SAT, Horn) — many real instances live in them.` },
  ],

  // CSP inference (AC-3 page) — what-if and global/local
  'csp-inference': [
    { kind: 'md', body: `## What-if: AC-3 specifically

These map cleanly to one click in the **AC-3 stepper** or **CSPLab**.

### What if I process the arcs in a different order?
The final domains are **identical** — AC-3 reaches the same fixpoint regardless of arc order. But the **number of REVISE calls** changes: bad orders re-revise arcs many times, good orders finish quickly. (Try Manual mode in the AC-3 stepper.)

### What if I skip the re-enqueueing step?
You only achieve **one-pass arc consistency** — not full AC. Counterexample: a domain shrinks, but downstream arcs aren't re-checked, so values that lost their only support remain.

### What if AC-3 prunes a domain to a singleton — is the CSP solved?
**No.** AC-3 enforces arc consistency, not satisfiability. The classic counter-example is the **cycle of three variables** with domain $\\{1, 2, 3\\}$ and pairwise $\\ne$ — AC-3 leaves the singletons alone but a cycle of three pairwise-distinct variables with a 3-element domain is satisfiable; flip to a 4-vertex cycle with domain $\\{1, 2\\}$ and pairwise $\\ne$: AC stays at $\\{1, 2\\}$ but no satisfying assignment exists. Always backtrack to confirm.

### What if I run AC-3 inside backtracking after each decision?
That's **MAC**. Stronger pruning than FC because MAC propagates *transitively* — FC only checks the directly-constrained neighbours of the decision variable.

### What if I'm using only equality constraints? Does AC-3 do anything useful?
Equality constraints are *easy* — they don't prune unless the intersection of two domains is smaller than either. AC-3 finishes immediately. The interesting case is **disequality** ($\\ne$): chains of $\\ne$ propagate cleanly through AC-3 once at least one domain shrinks.

### What if my arcs are *directional* — is AC-3 still correct?
Directional AC (DAC) is a *weaker* property: only arcs in one direction of the ordering need be consistent. DAC is enough for tree-CSPs (with a topological variable order); for general CSPs you need bidirectional AC.

### What if the same arc is in the queue twice?
AC-3 explicitly checks before re-enqueueing — duplicates are skipped. The queue is a set, not a multiset.

### What if I process arcs in DFS instead of BFS order?
Same final fixpoint. The total *work* may differ, but neither order is uniformly better — depends on which arcs cascade.

### What if I run AC-3 on a CSP with no binary constraints?
Phase 1 (NC) might prune unary-violating values; Phase 2 (AC) has an empty queue and does nothing. The CSP is solved iff each $D_i$ is non-empty after NC.` },

    { kind: 'md', body: `## AC-3 worked walkthrough — the small CSP

**Problem.** Variables $x_1, x_2, x_3$, each with domain $\\{1, 2, 3\\}$. Constraints:

- $C_1$: $x_1 < x_2$
- $C_2$: $x_2 < x_3$
- $C_3$: $x_3 > 1$
- $C_4$: $x_1 \\ne 2$

**Step 1: Global node consistency** (phase 1).

- $C_3$ removes $1$ from $D(x_3)$: $D(x_3) = \\{2, 3\\}$.
- $C_4$ removes $2$ from $D(x_1)$: $D(x_1) = \\{1, 3\\}$.

After NC: $D(x_1) = \\{1, 3\\}$, $D(x_2) = \\{1, 2, 3\\}$, $D(x_3) = \\{2, 3\\}$.

**Step 2: Global arc consistency**.

Binary arcs: $(x_1, x_2), (x_2, x_1), (x_2, x_3), (x_3, x_2)$.

Running AC-3 in FIFO order from the initial queue:

| # | Arc | Action | Resulting domains |
|---|---|---|---|
| 1 | $(x_1, x_2)$ | $v=3$ has no $w>3$ in $D(x_2)$ → remove $3$ | $D(x_1) = \\{1\\}$, re-enqueue $(x_2, x_1)$ |
| 2 | $(x_2, x_1)$ | $v=1$ has no $w<1$ in $D(x_1)$ → remove $1$ | $D(x_2) = \\{2, 3\\}$, re-enqueue $(x_1, x_2), (x_3, x_2)$ |
| 3 | $(x_2, x_3)$ | $v=3$ has no $w>3$ in $D(x_3)$ → remove $3$ | $D(x_2) = \\{2\\}$, re-enqueue $(x_1, x_2), (x_3, x_2)$ |
| 4 | $(x_3, x_2)$ | $v=2$ has no $w<2$ in $D(x_2)$ → remove $2$ | $D(x_3) = \\{3\\}$, re-enqueue $(x_2, x_3)$ |
| 5 | $(x_1, x_2)$ | $v=1$, $w=2$ ✓ | no change |
| 6 | $(x_3, x_2)$ | $v=3$, $w=2$ ✓ | no change |
| 7 | $(x_2, x_3)$ | $v=2$, $w=3$ ✓ | no change |

Final: $D(x_1) = \\{1\\}, D(x_2) = \\{2\\}, D(x_3) = \\{3\\}$.

**Step 3: An arc revised more than once.** Look at the table — $(x_1, x_2)$ appears at #1 and #5. So does $(x_2, x_3)$ at #3 and #7. Either is a valid answer.

A *cleaner* ordering that forces a re-revision: start with $(x_2, x_3)$ first.

\`\`\`
[(x2,x3), (x3,x2), (x1,x2), (x2,x1), (x1,x2)*, (x3,x2)*, (x2,x3)*]
\`\`\`

The starred entries are the re-revisions. Try this order in the **AC-3 stepper** with **Manual queue mode**.` },

    { kind: 'callout', variant: 'keyfact', title: 'Why arcs get re-revised', body: `An arc $(X_k, X_i)$ is re-enqueued **whenever $D(X_i)$ shrinks**, because some value of $X_k$ might have been supported only by the value just removed from $D(X_i)$. Any ordering that shrinks one variable's domain in *two* separate REVISE calls forces all its incoming arcs to be processed twice.` },

    { kind: 'md', body: `## 📖 Phrasebook — CSP inference / arc consistency

| If the question says... | Do... | Notes |
|---|---|---|
| "Enforce global node consistency" | Apply every unary constraint to its variable's domain | Phase 1 of CSPLab |
| "Enforce node consistency at $X_i$" | Local NC: prune $D(X_i)$ only | Less common phrasing |
| "Enforce arc consistency" / "establish AC" | Run AC-3 to fixpoint | Standard default |
| "Apply AC-3 / AC-4 / AC-2001" | Use the named algorithm | AC-2001 → show Last data structure |
| "REVISE($X_i, X_j$)" | One arc revision: drop values in $D(X_i)$ with no support in $D(X_j)$ | Local AC on one arc |
| "Re-enqueue after a shrink" | Add all $(X_k, X_i)$ for $k \\ne j$ — incoming arcs only | Never re-enqueue the just-processed direction |
| "An arc revised more than once" | Show an arc ordering where domain shrinks cascade | Standard exam question |
| "AC-3 complexity" | $O(c \\cdot d^3)$ (Mackworth & Freuder) | $c$ = #binary constraints, $d$ = max domain |
| "AC-4 / AC-2001 complexity" | $O(c \\cdot d^2)$ — optimal | AC-4: counter-based; AC-2001: Last pointers |
| "Does AC-3 solve the CSP?" | NO — it enforces AC. Backtracking still needed (except tree-CSP with DAC) | Big pitfall |
| "Path consistency (PC)" | Strengthen AC: every variable pair extendable through a third | PC-2 algorithm, $O(n^3 d^5)$ |
| "Singleton AC (SAC)" | Per-value: probe assign + AC; remove if wipeout | Preprocessing, stronger than AC |
| "GAC for AllDifferent" | Use Régin's bipartite-matching algorithm | Strictly stronger than pairwise ≠ |
| "Compare AC-3 with FC" | AC: full propagation. FC: just neighbours of current decision | FC is weaker but cheaper |
| "Compare AC-3 with AC-4" | AC-3: $O(c d^3)$, simple. AC-4: $O(c d^2)$, more memory | Use AC-4 only at scale |

## How this connects

- **MAC** during backtracking = "run AC-3 at every decision". Standard for modern CSP solvers.
- **DPLL's unit propagation** is the SAT analogue — both propagate single-variable conclusions to fixpoint.
- The **Régin pigeonhole detection** for AllDifferent is the CSP analogue of cardinality-encoding propagation in SAT.
- Tree-CSPs admit **directional AC** (one pass leaves-to-root) — analogous to topological-sort algorithms for DAGs.` },
  ],

  // Backtracking page — what-if FC vs MAC, heuristics
  'backtracking': [
    { kind: 'md', body: `## What-if: backtracking & heuristics

Use the **CSPLab** visualiser to test each of these by flipping one toggle.

### What if I use plain backtracking (no propagation)?
Every decision is validated against the partial assignment, but no domain pruning happens between decisions. Often blows up on hard CSPs — the search tree is essentially the cross-product of domains until a violation is hit.

### What if I add **Forward Checking** (FC)?
After each $X_i = v_i$ decision, prune every unassigned neighbour $X_j$'s domain by removing values inconsistent with $v_i$ via the constraint $C_{ij}$. Catches single-variable wipeouts early. Roughly 5–10× fewer nodes than plain BT on medium-hard CSPs.

### What if I upgrade FC to **MAC**?
MAC = Maintaining Arc Consistency = run AC-3 to fixpoint after every decision, not just one step. **Strictly stronger than FC**: every wipeout FC detects, MAC also detects, plus more (it catches transitive infeasibilities).

**Cost.** MAC per node ≈ $O(c \\cdot d^3)$ vs FC ≈ $O(n \\cdot d)$. The break-even is when the *node count saved* by MAC's stronger pruning outweighs the per-node overhead. On hard CSPs, MAC nearly always wins.

### What if FC and MAC behave identically?
Happens when no transitive propagation is available — e.g. when the constraint graph is a star (every variable connected only to the decision variable). FC's one-step look-ahead is then equivalent to AC.

### What if I switch from d-way to 2-way branching?
Same complete tree (every assignment is reachable). 2-way's RIGHT branch ($X \\ne v$) triggers AC-3 propagation immediately — often catching infeasibility that d-way's "try next value" doesn't.

### What if I drop MRV and just go top-to-bottom?
On easy CSPs: same answer, slightly more nodes. On hard CSPs: catastrophic blowup. MRV's "fail-first" principle is one of the most robust improvements in CSP solving.

### What if I use **degree** ordering instead of MRV?
Degree picks the variable involved in the most constraints with *unassigned* others. Good as an initial tie-breaker (when MRV ties) or when domains start equal-sized. Often paired: **MRV + degree** as primary + tie-breaker.

### What if I use **LCV** (least-constraining value)?
LCV picks the value that rules out the fewest values in neighbours. Encourages early success — useful when you only need *one* solution. Counterproductive if you need *all* solutions (then you want fail-first on values too).

### What if my CSP has many symmetries?
LCV often picks symmetric values that all explore equivalent subtrees. Use **symmetry breaking** constraints (e.g. force $X_1 < X_2$ for symmetric pairs) or specialised techniques (SBDS, lex-leader).

### What if I have a tie under MRV?
Common — many variables have the same minimal remaining domain. Tie-break by **degree** (most constrained), then lexicographic. Modern solvers also use **weighted-degree** (\`wdeg\`): track how often each constraint has caused a wipeout; pick the variable with the highest sum of its constraints' weights.

### What if I solve with random restarts?
Standard in modern solvers: cap the backtrack budget; if exceeded, restart from scratch with shuffled variable/value heuristics. Combined with **nogood learning** (carry learnt no-goods across restarts), this gives near-state-of-the-art on hard CSPs.` },

    { kind: 'md', body: `## Cost-benefit table — propagation choices

| Propagation | Per-node cost | Pruning strength | When it wins |
|---|---|---|---|
| None (pure BT) | $O(1)$ | None (just checks consistency) | Trivial CSPs; pedagogical only |
| Forward Checking (FC) | $O(n \\cdot d)$ | Single-step neighbour pruning | Sparse constraint graphs; small $d$ |
| **MAC** | $O(c \\cdot d^3)$ | Full arc consistency at every node | Dense graphs; large search trees |
| MAC + GAC (global) | + cost of GAC propagators | Strongest local consistency | When global constraints (AllDifferent, sum) appear |
| MAC + restart + wdeg | + neglible | + learning across restarts | Industrial-strength CSP solving |` },

    { kind: 'callout', variant: 'whatif', title: 'What if MAC and FC give different first solutions?', body: `They can! Both find *some* solution, but the order in which decisions hit infeasibility differs, so the search tree shape differs. The set of solutions is identical (FC and MAC are both *sound*); only the order of exploration changes.` },

    { kind: 'md', body: `## 📖 Phrasebook — backtracking & search heuristics

| If the question says... | Do... | Notes |
|---|---|---|
| "Backtracking" | DFS over variable assignments; on conflict, undo last decision and try next value | Check consistency after EVERY decision, not just leaves |
| "With forward checking" | After each decision, prune neighbour domains of just-fixed variable | One-step propagation |
| "With MAC / maintaining arc consistency" | After each decision, run AC-3 to fixpoint | Strictly stronger than FC |
| "MRV (minimum remaining values)" | Pick variable with smallest current domain | Fail-first heuristic |
| "Degree heuristic" | Pick variable with most constraints to unassigned others | Tie-break for MRV; static |
| "LCV (least-constraining value)" | Pick value ruling out fewest neighbour values | Succeed-first; sum-based |
| "Geelen's promise" | Pick value maximising the **product** of remaining neighbour supports | Stronger than LCV when zero factor appears |
| "dom/wdeg" | Pick variable minimising $|D|$ / wdeg (weighted by constraint failures) | State of the art |
| "Last-conflict heuristic" | After a backtrack, retry the variable that just caused failure first | Cheap memoisation |
| "d-way branching" | One child per value of chosen variable | Variable branching factor |
| "2-way branching" | LEFT: $X = v$. RIGHT: $X \\ne v$ (recurse) | Binary tree; right propagates immediately |
| "Compare BT, BT+FC, BT+MAC" | None < FC < MAC in pruning strength; cost per node rises | Test in CSPLab |
| "Backjumping (CBJ)" | On failure, jump to most recent variable in conflict set (not chronological) | Like CDCL but no clause learning |
| "Symmetry-breaking constraints" | Lex-leader / value precedence; can conflict with heuristic | Discussed in cp-modelling |
| "How many nodes in the search tree?" | Count tries + failures. Display via CSPLab's tree viz | Compare across propagation settings |

## How this connects

- **MAC ≈ DPLL**: both decide-then-propagate-to-fixpoint-then-recurse.
- **FC ≈ DPLL's unit propagation** restricted to constraint-neighbours of the decision variable.
- **CBJ ≈ CDCL's backjump** (without clause learning).
- **MRV ≈ VSIDS** in spirit: fail-first / decision-importance-based.
- **2-way branching ≈ DPLL decision**: LEFT/RIGHT mirror the polarity choice; RIGHT propagates via AC just as DPLL's RIGHT propagates via UP.` },
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

    { kind: 'md', body: `## What-if pack: GAC, 2-way and propagation

### What if my constraint has arity 5 — should I use AC-3?
**No.** AC-3 is binary-only. Options:
1. Decompose into binary constraints via *dual encoding* (introduce a tuple-variable per constraint, equality constraints to coordinates). Loses propagation strength.
2. Use a **propagator** that enforces **GAC** directly. Standard for AllDifferent, sum, table, element, gcc.

### What if I use AC instead of GAC on AllDifferent?
You only get **pairwise** $\\ne$ propagation. Famous counter-example: $X_1, X_2, X_3 \\in \\{1, 2\\}$, pairwise $\\ne$. AC says everything's fine — but pigeonhole means UNSAT. Régin's GAC catches it instantly.

### What if I use bounds consistency (BC) instead of GAC?
**BC** only ensures the endpoints of each domain interval are extendable. Cheaper than GAC, weaker pruning. Good default for sum / linear constraints; usually too weak for AllDifferent.

### What if my solver gives me a choice of *propagator strength*?
- **AC / pairwise-AC**: cheap, weak. Default for $\\ne$.
- **GAC**: full unary-deduction. Strong.
- **Range consistency / BC**: cheap intermediate.
- **Strong path consistency / k-consistency**: very strong; usually only as preprocessing because per-call cost is high.

In practice modern solvers expose all of these and choose based on the constraint family.

### What if I switch from d-way to 2-way branching with weak propagation?
Often no benefit — the right branch's $X \\ne v$ only triggers extra propagation if the solver can use it. With pure backtracking and no AC, both branchings behave the same.

### What if I switch from d-way to 2-way *with MAC*?
This is where 2-way shines. The right branch $X \\ne v$ shrinks $D(X)$ by one value, immediately enqueueing arcs into $X$ — MAC then propagates the shrink across the network. Often catches infeasibility that d-way's silent "try next value" misses.

### What if I add a "branch on the negation" rule to 2-way?
You get **dichotomy-based search** (e.g. branch $X \\le k$ vs $X > k$ instead of $X = v$ vs $X \\ne v$). Useful for ordered domains — splits in half rather than peeling off values.` },

    { kind: 'md', body: `## Worked example: pairwise $\\ne$ misses what GAC catches

**Variables**: $X_1, X_2, X_3 \\in \\{a, b\\}$.
**Constraint**: $\\text{AllDifferent}(X_1, X_2, X_3)$.

### Pairwise $\\ne$ propagation
Three binary $\\ne$ constraints. Each arc is consistent:
- $(X_1, X_2)$: $X_1 = a$ has support $X_2 = b$; $X_1 = b$ has support $X_2 = a$. No prune.
- $(X_1, X_3)$: same — no prune.
- $(X_2, X_3)$: same — no prune.

**Pairwise AC reports: no pruning.** All domains unchanged. Searches and discovers UNSAT only at depth 3.

### Régin's GAC
Build bipartite graph: variables $\\{X_1, X_2, X_3\\}$ vs values $\\{a, b\\}$. Maximum matching has size **2** (only two values; three variables). $\\text{AllDifferent}$ requires a matching of size 3 — **fail immediately**.

So GAC detects UNSAT at the root; pairwise needs full search.

This is **the** poster child for why GAC ≠ AC on global constraints.` },
  ],

  // CP modelling — what-if pack on modelling choices
  'cp-modelling': [
    { kind: 'md', body: `## What-if pack: CP modelling

Modelling is half the battle. Try each of these by tweaking the CSPLab or building a small Essence Prime model.

### What if I use a smaller domain?
Smaller domains = stronger constraints baked in. E.g. encode "x must be a digit" as $D(x) = \\{0, \\ldots, 9\\}$ instead of $D(x) = \\mathbb{Z}$ plus $0 \\le x \\le 9$ — same solutions, but the solver doesn't waste effort exploring out-of-range values.

### What if I split one variable into two?
**Channelling**. E.g. for n-queens, model both "queen-in-row $i$ is in column $X_i$" and "queen-in-column $j$ is in row $Y_j$", linked by $X_i = j \\Leftrightarrow Y_j = i$. Channelling doubles the constraint surface and lets propagation flow in both directions — often huge speed-up.

### What if I add an obviously-implied constraint?
Same solutions, but the solver gets a free lookahead. Example: in scheduling with $X_1 + X_2 + X_3 = T$, adding $X_3 = T - X_1 - X_2$ as a redundant constraint can let AC propagate sums two ways.

### What if I use AllDifferent instead of pairwise $\\ne$?
**Always do this.** Pairwise $\\ne$ has only pairwise propagation; AllDifferent with Régin's algorithm enforces GAC and catches Hall-violations early.

### What if I drop symmetry-breaking constraints?
The search tree grows by the size of the symmetry group. For n-queens, ignoring 4-fold reflectional symmetry quadruples the work.

### What if I switch from search variables to view variables?
*View variables* let you write constraints over derived quantities (e.g. $|X - Y|$) without introducing new search vars — solver pruning happens on the underlying $X, Y$.

### What if I encode "at most $k$" as a sum?
A sum is fine for *checking*, but propagation is **bounds-consistent at best**. For strong propagation, use a dedicated **count** / **gcc** (global cardinality constraint) propagator.

### What if my Essence Prime model uses an unsupported construct (e.g. set, function)?
Essence Prime supports **matrices only** — no sets, functions, multisets, partitions. Re-encode by hand:
- **Set of size $k$** → matrix of $k$ distinct elements + AllDifferent + symmetry-breaking $\\le$ chain.
- **Function $f: A \\to B$** → matrix indexed by $A$ with entries in $B$.
- **Partition** → matrix \`part[i] = which block i belongs to\`.

### What if my problem has continuous variables?
Out of scope for finite CSPs — use LP / MILP / non-linear programming. Some hybrid CP/LP solvers (SCIP, OR-Tools) accept both.

### What if I have a hard-to-state global constraint?
Three options:
1. **Decompose** into known constraints (lossy on propagation).
2. **Write a custom propagator** (Choco, Minion let you).
3. **Encode as table** (extensional list of allowed tuples) — universal but blows up for large arities.` },

    { kind: 'callout', variant: 'whatif', title: 'What if my model has 10× the solutions of the original?', body: `Often it's a **symmetry** — the model is admitting equivalent assignments as distinct. Adding lex-leader ordering on symmetric variables collapses each equivalence class to one canonical representative.` },

    { kind: 'md', body: `## 📖 Phrasebook — CP modelling

| If the question says... | Do... | Notes |
|---|---|---|
| "Model as a CSP" | 7-step methodology: decisions / domains / constraints / arity / implied / symmetry / sanity-check | Use ModellingWizard |
| "State variables" | Decision variables only — NOT parameters (inputs) | Common confusion |
| "State domains" | Smallest possible, derived from constraints | Tight domains = strong propagation |
| "Identify a modelling pattern" | sequence / multiset / set / function / partition / relation | Examiner expects you to NAME the pattern |
| "Use AllDifferent" | One global constraint, not pairwise ≠ | Régin GAC catches pigeonhole |
| "Channel between viewpoints" | Add $x_i = j \\Leftrightarrow y_j = i$ for permutation problems | Propagation flows both ways |
| "Implied constraint" | Logically entailed; doesn't change solutions; improves propagation | Verify entailment on known-valid solution |
| "Symmetry-breaking constraint" | Lex-leader / value precedence / DoubleLex | Can conflict with branching heuristic |
| "What's the symmetry group?" | Variable permutations × value permutations × geometric | Identify before breaking |
| "Use Essence Prime" | Matrix-only — encode sets / functions / partitions by hand | No nesting |
| "Compare viewpoints" | Variable count vs natural constraint expression vs propagation strength | n-queens classic example |
| "Why use a global over decomposition?" | Strictly stronger propagation (Régin Hall etc.) | Standard answer |

## How this connects

- Modelling sits BEFORE inference and search — a bad model breaks every downstream algorithm.
- The same problem can have multiple valid models with **vastly different** solver performance.
- Channelling combines two viewpoints' propagation strengths — analogous to combining heuristics via $\\max(h_1, h_2)$.
- Implied constraints play the same role as **learnt clauses** in CDCL — explicit memos of derivable facts to strengthen propagation.` },
  ],

  // Tree/structure exploits — what-if
  'csp-structure': [
    { kind: 'md', body: `## What-if pack: CSP structure

### What if my constraint graph is a tree?
$O(nd^2)$ via two passes:
1. **Order** variables in a topological (parent-first) order from any root.
2. **Backward pass**: apply DAC from leaves up — for each parent $X$ and child $Y$, REVISE $(X, Y)$.
3. **Forward pass**: assign root any value; assign each child a value consistent with its parent.

No backtracking needed if the tree is arc-consistent.

### What if my graph is *nearly* a tree (small cycle cutset)?
**Cutset conditioning** (Dechter). Pick a small set $S$ of variables that breaks all cycles when removed. Enumerate over all assignments of $S$ ($|S|$ variables, $d^{|S|}$ choices); for each, solve the remaining tree-structured CSP in $O((n-|S|) d^2)$. Total: $O(d^{|S|+2} \\cdot n)$.

Cycle cutset of size $c$: best when $c \\ll n$.

### What if my graph has small treewidth $w$?
**Tree decomposition** (Dechter): merge variables into "buckets" arranged in a tree; intra-bucket constraint is the join of the originals. Solve in $O(n \\cdot d^{w+1})$.

Treewidth 1 = tree; treewidth 2 = series-parallel; treewidth $n-1$ = complete graph.

### What if my CSP is disconnected?
Each connected component is independent. Solve each separately — total cost = sum, not product.

### What if I add an edge that creates a triangle?
The graph is no longer a tree; cycle count rises by 1. May need full backtracking.

### What if my graph is bipartite (variables on two sides, all constraints between sides)?
**Matching** algorithms apply. AllDifferent on one side becomes a bipartite-matching problem; Hall's theorem gives a polynomial feasibility test.

### What if I'm asked to identify the *tightest* propagation method for a given structure?
Use this decision tree:

\`\`\`
Tree-structured?  →  Directional AC (one pass)
Bipartite?  →  Matching
Cycle cutset small?  →  Cutset conditioning
Treewidth ≤ 5?  →  Tree decomposition
Otherwise  →  MAC + heuristics + restart
\`\`\`` },

    { kind: 'callout', variant: 'keyfact', title: 'Tree-CSP shortcut', body: `For tree-CSPs, you don't even need full AC-3. **Directional AC** (one pass from leaves to root) suffices, in $O(n d^2)$. The reason: with strong $(w+1)$-consistency for $w = 1$, the tree is solvable backtrack-free.` },
  ],

  // local search — what-if
  'local-csp': [
    { kind: 'md', body: `## What-if pack: local search on CSPs

### What if min-conflicts can't escape a local minimum?
Add **random restarts** (every $k$ steps, restart from a random assignment) or **random walk** (with probability $p$, pick a *random* conflicted variable's value instead of the min-conflicts one). The combination is called **WALKSAT** — same trick used in SAT.

### What if my CSP has no solution and I run min-conflicts?
Min-conflicts loops forever (or until you cap iterations). It can't prove UNSAT — only finds solutions. **Use CDCL / MAC for UNSAT detection.**

### What if I increase the number of conflicted variables to consider?
With "max-conflicts" instead of "min", you bounce between bad assignments. With "first-conflict" (just pick any conflicted variable), you trade quality for speed. Pure min-conflicts is the sweet spot on most CSP benchmarks.

### What if I weight constraints?
**Weighted min-conflicts**. Track how often each constraint has been violated; weight its contribution to "number of conflicts" by its history. Over time, hard constraints get heavier — search focuses on them. Same idea as **wdeg** for systematic search.

### What if my CSP is over-constrained (no solution)?
Switch to a **partial-assignment** formulation: minimise the number of violated constraints. Min-conflicts then converges to a *best partial solution*. This is **MAX-CSP**.

### What if I want all solutions?
Local search is a **terrible** choice — it can revisit solutions and never proves it's seen them all. Use systematic search (DPLL/MAC) which prunes once-explored regions.` },
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

    { kind: 'md', body: `## 📖 Phrasebook — SAT (general)

| If the question says... | Do... | Notes |
|---|---|---|
| "Is φ satisfiable?" | Try to find a model; if none after exhaustive search → UNSAT | Use DPLL or CDCL |
| "Encode in CNF" | 4-step (equiv) or Tseitin (equisat) | Equiv can blow up |
| "DIMACS format" | One clause per line; integers as literals; negative = ¬; 0 terminator | Standard SAT format |
| "k-SAT" | Every clause has exactly $k$ literals | 2-SAT polytime, 3-SAT NP-complete |
| "2-SAT in polytime" | Build implication graph, find SCCs, check no var in same SCC as its negation | Use SCC algorithm — not DPLL |
| "Phase transition" | Empirical SAT probability vs $m/n$ ratio; hardest near $\\approx 4.27$ for 3-SAT | Easy-hard-easy curve |
| "Pure literal elimination" | Variable in only one polarity → satisfy it | Optional, always safe |
| "Unit propagation" | Unit clause $(\\ell)$ forces $\\ell$; cascade | Common to DPLL, CDCL |
| "Compare WALKSAT and DPLL" | WALKSAT: incomplete, fast on random SAT. DPLL: complete, slower on hard, can prove UNSAT | Choose by use case |
| "Two-watched literals" | Each clause tracks 2 non-False watchers; O(1) amortised UP | Critical for modern solvers |
| "VSIDS" | Activity-based branching: bump in learnt clauses, decay periodically | Default in MiniSat/Glucose |
| "Restart strategy" | Luby sequence preserved across restarts | Escape bad subtrees |
| "Preprocessing" | BVE, subsumption, vivification, blocked-clause elim, failed-literal probing | Standard pre-search |
| "Cardinality encoding" | Pairwise / sequential / totalizer / ladder | Choose by $n$, $k$, query frequency |
| "Pigeonhole formula" | $\\text{PHP}_n$: exponential lower bound for resolution & CDCL | Need cutting-planes |

## How this connects

- **SAT** is the propositional fragment of **logic**; SAT-solving is the algorithmic engine of automated theorem proving.
- **DPLL/CDCL on CNF** mirrors **BT/MAC on CSP**: same decide-propagate-recurse skeleton.
- **WALKSAT** is the SAT analogue of **min-conflicts** for CSPs.
- **2-SAT polytime** parallels **tree-CSP polytime** — both are structural polynomial fragments of NP-hard problems.
- **CDCL's learnt clauses** are the SAT analogue of **implied constraints** in CP modelling — explicit memos of derivable facts.
- **Phase transition** appears in CSPs too (random binary CSPs show the same easy-hard-easy curve).` },
  ],

  // ════════════════════════════════════════════════════════════════════
  //   DECISION RULES — "if the question says X, do Y"
  //   One phrasebook per topic. Covers exam-language → action mapping
  //   plus a "How this connects" section that builds knowledge across
  //   algorithms.
  // ════════════════════════════════════════════════════════════════════

  'search-formulation': [
    { kind: 'md', body: `## 📖 Phrasebook — "if the question says..., do..."

| If the question says... | Do... | Why |
|---|---|---|
| "Formulate as a search problem" | List: state representation · initial state · goal test · actions · transition model · step cost | Standard 6-tuple |
| "What is a state?" | A single configuration — enough to determine future possibilities | Markov-style description |
| "What's the branching factor?" | $b$ = max # successors any state has | Affects time complexity $O(b^d)$ |
| "What's the state-space size?" | Estimate by combinatorial count (often huge) | Sanity-check tractability |
| "Goal test as predicate" | Write as $\\text{GOAL}(s) = (\\text{some condition})$ | Not just enumerated goals |
| "Step cost / path cost" | Per-action vs sum-along-path | Don't confuse |
| "Is this state-space finite/infinite?" | Argue from action space and reachable states | Sokoban finite; chess infinite (repetition) |

## How this connects

- **Search formulation** is the prerequisite for **all** of [Uninformed search](#topic/uninformed-search), [Informed search](#topic/informed-search), and [Local search](#topic/local-search).
- A poorly-formulated state representation (e.g. forgetting to include the player's facing direction) makes downstream search incorrect — no algorithm fixes a wrong model.
- The "step cost" choice determines whether you can use BFS (uniform cost) or need UCS / A* (varying).
- **CSP** is a *factored* state representation: rather than monolithic states, you have variables + domains + constraints. Same formulation skeleton, just structured.` },
  ],

  'uninformed-search': [
    { kind: 'md', body: `## 📖 Phrasebook — uninformed search

| If the question says... | Use... | Notes |
|---|---|---|
| "Shortest path" (uniform cost) | **BFS** | First goal found = shortest |
| "Shortest path with varying costs" | **UCS** | Pop lowest g(n); same as BFS when all costs = 1 |
| "Depth-first / exhaustive exploration" | **DFS** | $O(bd)$ space; not optimal; can loop on infinite |
| "Memory-constrained but complete" | **IDS** (iterative deepening) | $O(bd)$ space, complete, optimal in uniform-cost |
| "Two-sided search from start and goal" | **Bidirectional** | $O(b^{d/2})$ when both fringes meet |
| "Trace BFS on this graph" | FIFO queue, expand in level order | Show frontier + explored each step |
| "What's the worst-case complexity of DFS?" | Time $O(b^m)$ where $m$ = max depth; space $O(bm)$ | $m$ may be infinite |
| "Compare BFS vs DFS" | BFS: complete, optimal-uniform, $O(b^d)$ space. DFS: incomplete on infinite, not optimal, $O(bd)$ space | Memory is the big difference |

## How this connects

- **BFS** is the special case of **UCS** with unit costs and the special case of **A*** with $h = 0$.
- **IDS** combines DFS's low memory with BFS's completeness — typically the right uninformed choice when memory matters.
- **DFS** is the engine inside **backtracking** for CSP — the LIFO order matches "try a value, recurse, backtrack on fail".
- The **frontier vs explored** distinction (graph search) avoids re-exploring states; missing it = potential infinite loop on cyclic state spaces.` },
  ],

  'local-search': [
    { kind: 'md', body: `## 📖 Phrasebook — local search

| If the question says... | Use... | Notes |
|---|---|---|
| "Hill climbing" | Move to best neighbour; stop at local max | Gets stuck on plateaus / ridges |
| "Hill climbing with sideways moves" | Allow N consecutive equal moves before giving up | Escapes plateaus |
| "Random-restart hill climbing" | When stuck, restart from random state | Effectively complete given enough time |
| "Simulated annealing" | Random neighbour; accept always if better, else with $e^{-\\Delta E / T}$; cool $T$ | Boltzmann-style acceptance |
| "Genetic algorithm / GA" | Population + crossover + mutation + selection | Distinct from SA |
| "Local beam search" | Track $k$ best states each step | Diversity vs greediness |

## How this connects

- **Min-conflicts** (covered in [local-csp](#topic/local-csp)) is HC for CSPs.
- **WALKSAT** is SA-style for SAT: random walk + greedy flip mix.
- Local search shares philosophy with **MCTS rollouts** — both sample the search space rather than systematically enumerate.
- Always note: local search **cannot prove UNSAT** — only finds solutions. Use systematic (DPLL/MAC) for unsatisfiability proofs.` },
  ],

  // Append to existing 'imperfect-realtime' entry
  'minimax': [
    { kind: 'md', body: `## 📖 Phrasebook — minimax

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace minimax on this tree" | Bottom-up: MIN takes min of children, MAX takes max | Label every node by its level type |
| "Apply alpha-beta pruning" | Maintain $\\alpha$ (best MAX), $\\beta$ (best MIN); cut when $\\alpha \\ge \\beta$ | Same root value as plain minimax |
| "Find the optimal move at root" | Root value comes from the child that achieves it; that child is the move | Don't forget which child |
| "Best-case α-β complexity" | $O(b^{d/2})$ — perfect move ordering | Sqrt-factor over plain |
| "Worst-case α-β complexity" | $O(b^d)$ — same as plain minimax | Bad ordering = no cuts |
| "Compute backed-up values level-by-level" | Write $\\min(a_1, a_2), \\max(\\ldots)$ explicitly per level | Examiner wants the arithmetic shown |
| "Will α-β return the same value as minimax?" | YES — always | Common confusion |
| "List all cuts" | A β-cut at MAX when $\\alpha \\ge \\beta$; α-cut at MIN; identify pivot literal | Mark on the tree |

## How this connects

- **MCTS** replaces exhaustive enumeration with sampled rollouts — useful when minimax tree is too big to enumerate (Go, modern chess endgames).
- **Expectimax** generalises minimax to stochastic games via $\\text{CHANCE}$ nodes computing expected values.
- **Move ordering** for α-β (killer / history / iterative-deepening) is the game-tree analogue of CSP **variable ordering** (MRV / dom-wdeg).
- **Cut-off depth + evaluation function** generalises minimax to real-time / large games (chess). [imperfect-realtime](#topic/imperfect-realtime) covers this.` },
  ],

  'alpha-beta': [
    { kind: 'md', body: `## 📖 Phrasebook — alpha-beta specifically

| If the question says... | Do... | Pitfall |
|---|---|---|
| "Show α and β at every node" | Track $[\\alpha, \\beta]$ window passed down; update on return | Don't confuse with the backed-up value |
| "Show the cuts" | Highlight: β-cut at MAX (child ≥ β), α-cut at MIN (child ≤ α) | Cuts happen at the *internal* node, not the cut child |
| "Does pruning depend on move order?" | YES. Best order → $b^{d/2}$. Random → $b^{3d/4}$. Worst → $b^d$ | This is the *whole* point of move ordering heuristics |
| "Does α-β change correctness?" | NO — α-β returns minimax's root value exactly | Cuts only remove provably-irrelevant subtrees |
| "What if leaves repeat?" | Use a **transposition table** with $(value, depth, flag)$ where flag ∈ {EXACT, LOWER, UPPER} | Hash via Zobrist |
| "Tighten the eval function" | Cut-off + quiescence search + linear eval $\\sum w_i f_i(s)$ | Quiescence avoids horizon effect |

## How this connects

- α-β is the **pruning** of minimax; minimax is the **value-iteration** of game trees.
- The α-β bound window is conceptually similar to **AC-3's** support-checking — both prune what can't help.
- **Killer move heuristic** mirrors CSP's **last-conflict heuristic**: re-use what just failed/worked.` },
  ],

  'mcts': [
    { kind: 'md', body: `## 📖 Phrasebook — MCTS / UCT

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace MCTS for $N$ iterations" | Loop $N$ times: Selection → Expansion → Simulation → Backprop | Show counts per node |
| "Use UCB1 / UCT" | $\\bar{X}_i + C\\sqrt{\\ln N_p / N_i}$ at each non-terminal child | $C = \\sqrt 2$ optimal for rewards in [0,1] |
| "Recommend a move at root" | The **most-visited** child of root (robust child) | NOT the highest-mean — visits are more stable |
| "Why explore vs exploit?" | UCB1's second term adds a "bonus" for under-visited nodes — guarantees occasional sampling | Mean alone = pure exploit, gets stuck |
| "What does $C$ control?" | $C$ small → exploitation. $C$ large → exploration | Re-tune for reward scales outside [0,1] |
| "Cost per iteration" | One root-to-leaf path, one rollout (random play), one backprop pass | $O(d)$ per iter — much cheaper than full subtree |

## How this connects

- **MCTS** is the answer when **minimax** is intractable (too-big tree). It approximates minimax via sampling.
- The **exploration term** is conceptually similar to **simulated annealing's** temperature — both promote diversity over pure greediness.
- **AlphaGo** = MCTS + neural-network policy/value → out of scope here (would be generative AI).` },
  ],

  'game-formulation': [
    { kind: 'md', body: `## 📖 Phrasebook — game formulation

| If the question says... | Do... | Notes |
|---|---|---|
| "Formulate as a game" | Players · initial state · ACTIONS(s) · RESULT(s,a) · TERMINAL-TEST · UTILITY | Zero-sum vs general |
| "Zero-sum game" | $U_{\\text{MAX}}(s) = -U_{\\text{MIN}}(s)$ | Minimax applies directly |
| "Perfect information" | All players see full state | Chess yes, poker no |
| "Stochastic / chance" | Add CHANCE nodes with probabilities | Use expectimax |
| "Imperfect information" | Beyond this module | Belief states, POMDPs |
| "Utility / payoff function" | Numeric value at terminal states | Often $\\{+1, 0, -1\\}$ for win/draw/loss |

## How this connects

- Game formulation extends **search formulation**: now you have an adversary modelled at MIN nodes.
- The same algorithmic skeleton (backed-up values, exploration strategy) applies — just with MIN-MAX alternation instead of cost minimisation.` },
  ],

  // ─────────────────────────────────────────────────────────────────────
  //   PROPOSITIONAL LOGIC
  // ─────────────────────────────────────────────────────────────────────

  'propositional-syntax': [
    { kind: 'md', body: `## 📖 Phrasebook — propositional syntax & semantics

| If the question says... | Do... | Notes |
|---|---|---|
| "Define entailment" | $\\Gamma \\models \\varphi$ iff every model of $\\Gamma$ is a model of $\\varphi$ | Semantic definition |
| "Define validity" | $\\models \\varphi$ iff $\\varphi$ is true in every interpretation | Tautology |
| "Define satisfiability" | $\\varphi$ is SAT iff some interpretation makes it true | UNSAT = contradiction |
| "Classify this formula" | Tautology / contradiction / contingent | Use truth table |
| "Apply De Morgan" | $\\neg (a \\land b) = \\neg a \\lor \\neg b$ and dual | Standard |
| "Distribute ∨ over ∧" | $a \\lor (b \\land c) = (a \\lor b) \\land (a \\lor c)$ | Core CNF conversion step |
| "Eliminate →" | $a \\to b \\equiv \\neg a \\lor b$ | Step 1 of CNF |
| "Eliminate ↔" | $a \\leftrightarrow b \\equiv (a \\to b) \\land (b \\to a)$ | Pre-step before → elim |
| "Soundness vs completeness" | Sound: $\\vdash \\Rightarrow \\models$. Complete: $\\models \\Rightarrow \\vdash$ | Distinct properties |

## How this connects

- Truth tables are exhaustive but $2^n$ — fine for $n \\le 5$, useless beyond.
- Resolution is the algorithmic complement to truth tables: instead of enumerating models, derive ⊥.
- The CNF→DPLL pipeline is the practical path when truth tables become intractable.` },
  ],

  'kb-agents': [
    { kind: 'md', body: `## 📖 Phrasebook — KB agents

| If the question says... | Do... | Notes |
|---|---|---|
| "Knowledge base / KB" | A set of sentences (axioms + observations) | Often conjunction of clauses |
| "KB-agent loop" | TELL observations + ASK query each step | Standard "wumpus-world" pattern |
| "Inference" | Derive new sentences from KB | Two ways: model-checking vs proof |
| "Model checking" | Enumerate models satisfying KB; check if α holds in all | $O(2^n)$ |
| "Theorem proving" | Apply inference rules to derive α from KB | Polynomial for some fragments, undecidable in general for FOL |

## How this connects

- The KB is the agent's **knowledge representation**; queries against the KB drive its decisions.
- For **Horn** KBs, forward / backward chaining is polynomial.
- For **general propositional** KBs, resolution is refutation-complete.
- For **first-order** KBs (out of module), unification + resolution still works but is undecidable.` },
  ],

  'entailment': [
    { kind: 'md', body: `## 📖 Phrasebook — entailment

| If the question says... | Do... | Notes |
|---|---|---|
| "Prove KB ⊨ α" | Show KB ∪ {¬α} is UNSAT (refutation) | Negate the query — standard trick |
| "KB entails α" | Same as ⊨ — semantic relation | Differs from ⊢ (syntactic) |
| "Show ⊨ α (validity)" | Show ¬α is UNSAT, or every interpretation satisfies α | Tautology check |
| "By resolution" | CNF-ify KB ∪ {¬α}, resolve, derive ⊥ | Refutation completeness |
| "By model checking" | Enumerate $2^n$ models; α holds in every KB-model | Exact but $2^n$ |
| "By forward chaining" | Only if KB is Horn; iterate to fixpoint | Polynomial for Horn |
| "Find a model satisfying KB" | Existential — use DPLL / WalkSAT | "Is the KB consistent?" |
| "Soundness of resolution" | Every derivable clause is entailed | Trust the proof |
| "Completeness of resolution" | Refutation-complete: if KB ⊨ α then resolution derives ⊥ from KB∧¬α | NOT deduction-complete |

## How this connects

- $\\models$ is semantic; $\\vdash$ is syntactic. Sound + complete = they coincide.
- The refutation pattern (negate query, derive ⊥) is the bridge between resolution (refutes) and entailment (asserts).
- **DPLL** decides SAT; entailment reduces to (un)SAT via $\\Gamma \\models \\varphi \\iff \\Gamma \\land \\neg \\varphi$ is UNSAT.
- **Horn KBs** admit polynomial entailment via chaining.` },
  ],

  'inference-rules': [
    { kind: 'md', body: `## 📖 Phrasebook — propositional inference rules

| If the question says... | Use... | Pitfall |
|---|---|---|
| "Modus ponens" | From $p$ and $p \\to q$, derive $q$ | Easy to overlook in CNF |
| "Resolution" | From $(\\ldots \\lor \\ell)$ and $(\\ldots \\lor \\neg \\ell)$, derive the disjunction without $\\ell$ | Only resolves on ONE literal |
| "Refutation by resolution" | Add $\\neg \\alpha$ to KB; if you derive $\\Box$ (empty clause), KB ⊨ α | Sign matters — negate first |
| "And-elimination" | From $p \\land q$ derive $p$, derive $q$ | Trivial but needed in tableaux |
| "Or-introduction" | From $p$ derive $p \\lor q$ for any $q$ | Useful in constructive proofs |
| "Compare resolution and DPLL" | Both are sound + (refutation-)complete on CNF. DPLL is a SEARCH-based algorithm; resolution is a calculus | DPLL traces correspond to resolution proofs |
| "Resolution is refutation-complete but not deduction-complete" | Always pose as "is KB ∪ {¬α} UNSAT?" rather than "derive α directly" | Standard pitfall |

## How this connects

- **Resolution** is the propositional version of a more general FOL resolution.
- **DPLL** can be seen as resolution with a search strategy: each decision + UP corresponds to a chain of resolution steps.
- **CDCL's learnt clauses** are explicit resolution derivations.
- For **Horn KBs**, forward/backward chaining is a *restriction* of resolution that's polynomial.` },
  ],

  'horn-chaining': [
    { kind: 'md', body: `## 📖 Phrasebook — Horn chaining

| If the question says... | Do... | Notes |
|---|---|---|
| "Horn clause" | Clause with $\\le 1$ positive literal (i.e. $\\neg a_1 \\lor \\ldots \\lor \\neg a_k \\lor b$ or $\\neg a_1 \\lor \\ldots$ or just $b$) | Definite Horn = exactly one positive |
| "Forward chaining" | Start from facts; fire any rule whose body is satisfied; add head; repeat to fixpoint | Goal-agnostic; data-driven |
| "Backward chaining" | Start from goal; find rule with goal as head; recurse on body | Goal-driven |
| "Which is more efficient?" | Forward if many queries / few facts. Backward if focused query / many facts | Depends on use case |
| "Prove KB ⊨ p where p is a fact" | Run forward chaining to fixpoint; check if $p$ in closure | Polynomial |
| "Why is Horn polytime?" | Each fact derived at most once; bounded by $|$KB$|^2$ in size | Vs propositional in general, NP-hard |

## How this connects

- Horn fragment is a polynomial-time **island** in the otherwise NP-hard propositional logic landscape.
- **Datalog** (databases) is essentially Horn forward chaining with relational predicates.
- **Prolog** uses backward chaining (SLD resolution) on Horn clauses.
- **Unit propagation in DPLL** is forward chaining on the binary fragment.` },
  ],

  // ─────────────────────────────────────────────────────────────────────
  //   SAT
  // ─────────────────────────────────────────────────────────────────────

  'dpll': [
    { kind: 'md', body: `## 📖 Phrasebook — DPLL

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace DPLL on this CNF" | UP to fixpoint → pure literal → decide → recurse | Show stack levels |
| "Unit propagation" | A clause with one unassigned literal forces that literal's value | Cascades — propagate to fixpoint |
| "Pure literal" | Variable appearing in one polarity only → assign to satisfy | Optional, always safe |
| "Decide" | Pick any unassigned variable, set to a value, increment depth | Strategy = heuristic |
| "Backtrack on conflict" | Chronological: pop one decision, flip its value, continue | Backjumping = CDCL |
| "Find a model" | If all clauses satisfied → return the assignment | Order: UP → pure → decide |
| "Verify UNSAT" | If at depth 0 and conflict → UNSAT | All decisions exhausted |
| "Why is DPLL complete?" | Search exhausts all $2^n$ assignments in worst case | Tree search of decisions |

## How this connects

- **CDCL** = DPLL + **clause learning** + **backjumping** — vastly faster on industrial problems.
- **Unit propagation** is the SAT analogue of **arc consistency** in CSP.
- **DPLL on a 2-CNF** is polynomial only because the implication graph has special structure (use [TwoSAT viz](#topic/sat-problem)).
- **MAC** for CSP = DPLL for SAT in spirit: decide a variable, propagate to fixpoint, recurse on conflict.` },
  ],

  'cdcl': [
    { kind: 'md', body: `## 📖 Phrasebook — CDCL

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace CDCL" | UP / decide as DPLL, but on conflict: build implication graph, find 1-UIP, learn clause, backjump | Major upgrade from DPLL |
| "Implication graph" | Nodes = assigned literals at the conflict; edges = "this literal was implied by this clause + these antecedents" | Built bottom-up from conflict |
| "1-UIP" | The unique implication point CLOSEST to the conflict | Not closest to decision |
| "Learnt clause" | The set of literals on the "reason side" of the 1-UIP cut, negated | An asserting clause |
| "Backjump level" | The SECOND-largest decision level in the learnt clause | NOT the largest |
| "VSIDS" | Activity-based branching: bump variables in learnt clauses, decay periodically | $\\rho \\approx 0.95$ |
| "Two-watched literals" | Each clause watches 2 non-False literals; only re-check on flip | $O(1)$ amortised UP |
| "Restart strategy" | Luby or geometric schedule; keep learnt clauses | Escapes bad subtrees |

## How this connects

- CDCL is the SAT analogue of **conflict-directed backjumping** (CBJ) in CSP — but CDCL **learns** the conflict as a clause, CBJ doesn't.
- The **learnt clause** is a resolvent of the conflicting clauses with their antecedents — explicit proof step.
- **PHP$_n$** (pigeonhole) has exponential CDCL lower bound — same family-level barrier as resolution.` },
  ],

  // ─────────────────────────────────────────────────────────────────────
  //   WalkSAT, etc.
  // ─────────────────────────────────────────────────────────────────────

  'walksat': [
    { kind: 'md', body: `## 📖 Phrasebook — WALKSAT

| If the question says... | Do... | Notes |
|---|---|---|
| "Trace WALKSAT" | Start random; pick an unsat clause; with prob $p$ flip random var in it; else flip greedily | Hybrid random/greedy |
| "Noise parameter $p$" | $p = 0$ → pure greedy (gets stuck). $p = 1$ → random walk. Optimum $\\approx 0.5$ for random 3-SAT | Tunable |
| "Why can't WALKSAT prove UNSAT?" | It just samples assignments; no completeness guarantee | Use DPLL/CDCL for UNSAT |
| "Compare WALKSAT with DPLL" | WALKSAT: faster on SAT-likely random instances. DPLL: better on structured / UNSAT | Empirical |
| "When does WALKSAT win?" | Random 3-SAT near phase transition; large industrial SAT with much symmetry | Heavy-tailed |

## How this connects

- WALKSAT is to SAT what **min-conflicts** is to CSP — both are local-search satisfaction algorithms.
- The noise parameter is the WALKSAT analogue of SA's temperature.
- Modern SAT solvers (Survey Propagation, etc.) extend these ideas with message-passing.` },
  ],

  // ─────────────────────────────────────────────────────────────────────
  //   ESSENCE PRIME / MODELLING — phrasebook
  // ─────────────────────────────────────────────────────────────────────

  'essence-prime': [
    { kind: 'md', body: `## 📖 Phrasebook — Essence Prime

| If the question says... | Do... | Notes |
|---|---|---|
| "Model in Essence Prime" | Use \`int\`, \`bool\`, \`matrix indexed by [..] of T\` ONLY | No set / function / multiset / partition — encode by hand |
| "Encode a set of $k$ elements" | Matrix of $k$ ints with strict-increasing order | Breaks $k!$ permutation symmetry simultaneously |
| "Encode a function $A \\to B$" | Matrix indexed by $A$, values in $B$ | Add \`allDiff\` if injective |
| "Encode a partition into $k$ blocks" | Matrix \`part[i]\` containing $\\text{int}(1..k)$ | Add value precedence to break block symmetry |
| "Encode a relation $A \\times B$" | 2D boolean matrix | Or list-of-pairs (less standard) |
| "Identify modelling pattern" | sequence / multiset / set / function / partition / relation | Examiner expects you to NAME the pattern |
| "Run Savile Row with -S2" | Automorphism detection + lex-leader breaking | Adds symmetry breaking automatically |
| "Why use \`-O2\`?" | Default optimisation level: aggregation, CSE, etc. | $-O3$ adds tabulation |
| "What is the Conjure→Savile Row→solver pipeline?" | Essence → Conjure → Essence Prime → Savile Row → Minion/SAT/SMT/MaxSAT | Know each arrow |

## How this connects

- Essence Prime is what you actually WRITE for Nightingale-style exam questions.
- The [ModellingWizard viz](#topic/cp-modelling) auto-generates Essence Prime-compatible specs.
- Savile Row's pre-processing (CSE, aggregation, tabulation) is the **automatic version** of doing implied-constraint discovery + global-upgrade by hand.` },
  ],

};
