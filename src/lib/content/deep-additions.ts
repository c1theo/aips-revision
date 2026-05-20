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
  ],
};
