export interface CuratedQuestion {
  id: string;
  paperYear: string;
  topicSlug: string;
  question: string;
  answer: string;
}

export const curatedQuestions: CuratedQuestion[] = [
  {
    id: 'cu-search-01',
    paperYear: 'Curated · Search',
    topicSlug: 'informed-search',
    question: `(a) Define an admissible heuristic. (b) Define a consistent heuristic. (c) Show that consistency implies admissibility. (d) Why is consistency required for A* graph-search to be optimal, while admissibility suffices for tree-search?`,
    answer: `**(a) Admissibility.** $h$ is admissible iff $h(n) \\le h^*(n)$ for all $n$, where $h^*(n)$ is the true cheapest cost from $n$ to a goal.

**(b) Consistency (monotonicity).** $h$ is consistent iff for every node $n$ and every successor $n'$ via action with cost $c(n, a, n')$: $h(n) \\le c(n, a, n') + h(n')$.

**(c) Consistency ⇒ admissibility.** Take any node $n$ and the optimal path to a goal $G$: $n \\to n_1 \\to \\cdots \\to G$. By repeated application of consistency:
- $h(n) \\le c(n, n_1) + h(n_1)$
- $h(n_1) \\le c(n_1, n_2) + h(n_2)$
- ...
- $h(n_k) \\le c(n_k, G) + h(G) = c(n_k, G) + 0$

Summing: $h(n) \\le \\sum c(\\cdot) = h^*(n)$. Hence admissible.

**(d) Why graph-search needs consistency.** Graph-search maintains a closed list and never re-expands closed nodes. Under consistency, the first time A* expands a node it has the optimal $g$-value (because $f$ is non-decreasing along any path). Without consistency (admissible only), a node may be closed with a suboptimal $g$, and a better path discovered later is rejected — losing optimality unless the algorithm reopens closed nodes.

Tree-search never closes anything — every path is fresh — so admissibility alone suffices: the optimality proof (see [examples on the A* topic](#/topic/informed-search)) only needs $f(n) \\le C^*$ for any frontier node on the optimal path.`,
  },

  {
    id: 'cu-search-02',
    paperYear: 'Curated · Search',
    topicSlug: 'uninformed-search',
    question: `Compare BFS and IDS in terms of completeness, optimality, and space complexity. Under what conditions would you prefer IDS over BFS?`,
    answer: `| | BFS | IDS |
|---|---|---|
| Complete | yes ($b$ finite) | yes ($b$ finite) |
| Optimal | uniform costs | uniform costs |
| Time | $O(b^d)$ | $O(b^d)$ |
| Space | $O(b^d)$ | $O(bd)$ |

**Choose IDS when memory is constrained.** BFS keeps the entire frontier at depth $d$ in memory — for $b = 10, d = 6$ that's $10^6$ nodes, often gigabytes. IDS uses depth-first style storage: $O(bd) = 60$ nodes.

The time penalty is small. Repeated work at shallower levels sums to a geometric series with ratio $1/b$, so total time $\\le \\frac{b}{b-1} \\cdot b^d$ — i.e. at most $\\approx 11\\%$ overhead for $b = 10$.

**Don't choose IDS when:**
- Memory is plentiful and you want the shortest possible wall-clock time (BFS slightly faster, no overhead).
- The problem benefits from random-access to past states (transposition tables — depth-first doesn't share state info across iterations cleanly).`,
  },

  {
    id: 'cu-adv-01',
    paperYear: 'Curated · Adversarial',
    topicSlug: 'alpha-beta',
    question: `Apply alpha-beta pruning to the following game tree (MAX at root, depth 3, branching 3). Leaves left-to-right: 5, 6, 7 | 4, 5, 3 | 6, 6, 9 | 7, 4, 5 | 2, 1, 8 | 6, 4, 1 | 2, 3, 5 | 9, 3, 4 | 9, 5, 7. State which leaves are NOT examined and the minimax value of the root.`,
    answer: `Group leaves into 9 MIN nodes (3 leaves each), then 3 MAX nodes (3 MIN children each), then root.

**MIN-level values** (just for reference; alpha-beta will not compute all):
- $M_1 = \\min(5,6,7) = 5$, $M_2 = \\min(4,5,3) = 3$, $M_3 = \\min(6,6,9) = 6$
- $M_4 = \\min(7,4,5) = 4$, $M_5 = \\min(2,1,8) = 1$, $M_6 = \\min(6,4,1) = 1$
- $M_7 = \\min(2,3,5) = 2$, $M_8 = \\min(9,3,4) = 3$, $M_9 = \\min(9,5,7) = 5$

**Depth-2 MAX values:**
- Left MAX: $\\max(M_1, M_2, M_3) = \\max(5, 3, 6) = 6$
- Mid MAX: $\\max(M_4, M_5, M_6) = \\max(4, 1, 1) = 4$
- Right MAX: $\\max(M_7, M_8, M_9) = \\max(2, 3, 5) = 5$

**Root MAX:** $\\max(6, 4, 5) = 6$.

**Alpha-beta trace** (key cuts; left-to-right DFS):
- After $M_1 = 5$ at left MAX: $\\alpha$ at that node = 5.
- At $M_2$ (a MIN), upper bound $\\beta = +\\infty$; first leaf 4 → MIN's $\\beta = 4$. Need $\\beta \\le \\alpha = 5$? Wait — at the MIN node, **α-cut** if $v \\le \\alpha$. $v = 4 \\le 5$ → **cut**. Leaves 5, 3 of $M_2$ **not examined**.
- $M_3$ proceeds: leaves 6, 6, 9 give $\\beta$ progression. At leaf 9, MIN's $\\beta = 6$ (set by first leaf). $6 > 5$, no cut.
- Left MAX returns 6. Root $\\alpha = 6$.
- Mid MAX: inherits $\\alpha = 6$, $\\beta = +\\infty$. $M_4$: MIN's $\\beta$ updates to 4 (first leaf 7 then 4). $\\beta = 4 \\le \\alpha = 6$ → **α-cut**. Leaf 5 of $M_4$ **not examined**. MIN returns ≤ 4.
- MAX's $v = 4 < \\alpha = 6$. No update. But MAX continues to $M_5$ (it must check if a better MIN exists).
- $M_5$: leaves 2, 1, 8. First leaf 2 sets $\\beta = 2 \\le 6$ → **α-cut**. Leaves 1, 8 **not examined**.
- Similarly $M_6$: leaf 6 sets $\\beta = 6$ — not $\\le 6$, no cut yet (strict). leaf 4 sets $\\beta = 4$ → cut. Leaf 1 of $M_6$ **not examined**.
- Mid MAX value = max(4, 2, 4) = 4 < 6, doesn't improve. Or under typical implementations: MAX could have cut entire mid subtree but only after evaluating one child fully.
- Right MAX: inherits $\\alpha = 6$, $\\beta = +\\infty$. $M_7$: leaves 2 sets $\\beta = 2 \\le 6$ → cut. Leaves 3, 5 of $M_7$ **not examined**.
- $M_8$: leaves 9, 3 — at 3, $\\beta = 3 \\le 6$ → cut. Leaf 4 of $M_8$ **not examined**.
- $M_9$: leaves 9, 5, 7. $\\beta$ goes 9 → 5; $5 \\le 6$ → cut. Leaf 7 of $M_9$ **not examined**.

**Root value = 6**, same as minimax.

**Leaves not examined** (8): $M_2$'s 5,3; $M_4$'s 5; $M_5$'s 1,8; $M_6$'s 1; $M_7$'s 3,5; $M_8$'s 4; $M_9$'s 7. (Count varies slightly by implementation tie-breaking; ~9 of 27 leaves pruned ≈ 33%.)

**Examiner note:** the exact prune set depends on whether you use $\\ge$ or $>$ for the cut test and the precise left-to-right order. Show your working carefully.`,
  },

  {
    id: 'cu-csp-01',
    paperYear: 'Curated · CSPs',
    topicSlug: 'csp-inference',
    question: `(a) State the AC-3 algorithm in pseudocode. (b) Apply AC-3 to a CSP with $X_1, X_2, X_3 \\in \\{1, 2, 3\\}$ and constraints $X_1 \\ne X_2, X_2 < X_3, X_1 \\ne X_3$. (c) State its worst-case time complexity and explain where it comes from.`,
    answer: `**(a) AC-3.**

\`\`\`
function AC-3(csp):
    queue := all arcs (X_i, X_j)  # both directions per constraint
    while queue not empty:
        (X_i, X_j) := queue.pop()
        if REVISE(csp, X_i, X_j):
            if D_i is empty: return false
            for X_k in NEIGHBOURS(X_i) - {X_j}:
                queue.push((X_k, X_i))
    return true

function REVISE(csp, X_i, X_j):
    revised := false
    for v in D_i:
        if no w in D_j satisfies constraint(X_i, X_j) with (v, w):
            D_i := D_i \\ {v}
            revised := true
    return revised
\`\`\`

**(b) Trace.** Initial: $D = \\{1, 2, 3\\}$ all. Queue: 6 arcs (one per direction per constraint = 3 × 2 = 6).

The constraint $X_2 < X_3$ propagates first via REVISE($X_2$, $X_3$): for $X_2 = 3$, no $X_3 > 3$ → remove 3. $D(X_2) = \\{1, 2\\}$. Re-enqueue arcs into $X_2$ from $X_1, X_3$.

REVISE($X_3$, $X_2$): for $X_3 = 1$, no $X_2 < 1$ → remove 1. $D(X_3) = \\{2, 3\\}$. Re-enqueue arcs into $X_3$.

REVISE($X_2$, $X_3$) again: $X_2 = 2$ needs $X_3 > 2$; $D(X_3) = \\{2, 3\\}$ has 3, OK. $X_2 = 1$ has 2 or 3, OK. No removals.

REVISE($X_3$, $X_2$): $X_3 = 2$ needs $X_2 < 2$; $D(X_2) = \\{1, 2\\}$ has 1, OK. $X_3 = 3$ similarly fine. No removals.

The $\\ne$ constraints don't prune further given current sizes.

**Final domains:** $D(X_1) = \\{1, 2, 3\\}, D(X_2) = \\{1, 2\\}, D(X_3) = \\{2, 3\\}$.

**(c) Complexity.** $O(c \\cdot d^3)$ where $c$ = constraints, $d$ = max domain size.

**Derivation:** each arc may be re-enqueued at most $O(d)$ times (each enqueue follows a domain reduction; each domain shrinks at most $d$ times). REVISE is $O(d^2)$ (each value of $D_i$ checked against each of $D_j$). Number of arcs is $O(c)$. Total: $O(c) \\times O(d) \\times O(d^2) = O(cd^3)$.

(AC-3.1 / AC-2001 achieves $O(cd^2)$ by caching the last support for each value.)`,
  },

  {
    id: 'cu-csp-02',
    paperYear: 'Curated · CSPs',
    topicSlug: 'cp-modelling',
    question: `Distinguish *full Essence* from *Essence Prime (Essence')*. Give a concrete example where Essence allows a more natural modelling and show how the same model is encoded in Essence Prime.`,
    answer: `**Essence** is a high-level constraint specification language with abstract decision-variable types: \`set\`, \`mset\`, \`sequence\`, \`relation\`, \`function\` (with annotations: total/partial/injective/surjective/bijective), \`partition\` (regular/numParts/partSize), and arbitrary nesting (e.g. \`set of partition from D\`).

**Essence Prime (Essence')** is a deliberately restricted **matrix-only** subset: only \`int\`, \`bool\`, and \`matrix indexed by [...] of T\`. All abstract types must be encoded by hand as matrices.

**Pipeline:** Essence → Conjure (chooses representations) → Essence' → Savile Row (flattens / optimises) → solver.

**Concrete example: 3 students grouped into 2 teams of "size at least 1".**

**In Essence:**
\`\`\`
language Essence 1.3
letting Students be new type of size 3
find teams : partition (numParts 2) from Students
\`\`\`

**In Essence Prime (part-ID encoding):**
\`\`\`
language ESSENCE' 1.0
letting numStudents be 3
letting numTeams be 2
find team : matrix indexed by [int(1..numStudents)] of int(1..numTeams)
such that
    $ each team has at least 1 member
    forAll t : int(1..numTeams) .
        (sum s : int(1..numStudents) . toInt(team[s] = t)) >= 1,
    $ break value symmetry between equivalent teams
    team[1] = 1
\`\`\`

**Observations.**
1. The partition type in Essence is 1 line; Essence Prime needs 6 lines.
2. The team-symmetry (relabel teams) is **implicit** in the Essence \`partition\` type. In Essence', you must add a symmetry-breaking constraint (here, \`team[1] = 1\`) explicitly.
3. Per-team constraints (e.g. "team 2 has Alice") that are awkward in the abstract type become straightforward in the part-ID matrix.

**Why does Essence Prime exist?** It's the **target language for Savile Row**, which performs CSE, AC-CSE, aggregation, tabulation, etc. Working at the matrix level enables these optimisations.`,
  },

  {
    id: 'cu-logic-01',
    paperYear: 'Curated · Logic',
    topicSlug: 'inference-rules',
    question: `(a) State the resolution inference rule. (b) Prove via resolution refutation that $\\{P \\Rightarrow Q,\\; Q \\Rightarrow R,\\; \\lnot R\\} \\models \\lnot P$. Show CNF conversion and every resolution step.`,
    answer: `**(a) Resolution rule.** From clauses $(A_1 \\lor \\cdots \\lor A_k \\lor \\ell)$ and $(B_1 \\lor \\cdots \\lor B_m \\lor \\lnot \\ell)$, derive the resolvent $(A_1 \\lor \\cdots \\lor A_k \\lor B_1 \\lor \\cdots \\lor B_m)$.

In CNF/set notation: from clauses $C_1$ and $C_2$ with complementary literals $\\ell \\in C_1$, $\\lnot \\ell \\in C_2$, derive $(C_1 \\setminus \\{\\ell\\}) \\cup (C_2 \\setminus \\{\\lnot \\ell\\})$.

**(b) Strategy.** Convert KB $\\cup \\{P\\}$ (KB ∧ negation of query) to CNF and derive the empty clause.

**CNF conversion of KB ∧ P:**
- $P \\Rightarrow Q$ ≡ $\\lnot P \\lor Q$. Clause: $\\{\\lnot P, Q\\}$.
- $Q \\Rightarrow R$ ≡ $\\lnot Q \\lor R$. Clause: $\\{\\lnot Q, R\\}$.
- $\\lnot R$ ≡ $\\lnot R$. Clause: $\\{\\lnot R\\}$.
- Negated query: $\\lnot \\lnot P$ ≡ $P$. Clause: $\\{P\\}$.

**Initial clause set:**
- $C_1 = \\{\\lnot P, Q\\}$
- $C_2 = \\{\\lnot Q, R\\}$
- $C_3 = \\{\\lnot R\\}$
- $C_4 = \\{P\\}$

**Resolution derivation:**
1. Resolve $C_2$ and $C_3$ on $R$: $\\{\\lnot Q\\}$. Call $C_5$.
2. Resolve $C_1$ and $C_5$ on $Q$: $\\{\\lnot P\\}$. Call $C_6$.
3. Resolve $C_4$ and $C_6$ on $P$: $\\{\\}$ — **empty clause** ✓.

**Conclusion.** $\\text{KB} \\land P$ is unsatisfiable, therefore $\\text{KB} \\models \\lnot P$. $\\blacksquare$

**Alternative shorter path:**
1. $C_1, C_4$ on $P$: $\\{Q\\}$.
2. $\\{Q\\}, C_2$ on $Q$: $\\{R\\}$.
3. $\\{R\\}, C_3$ on $R$: $\\{\\}$.

Both are valid. Marks would be awarded for any correct derivation reaching $\\square$.`,
  },

  {
    id: 'cu-sat-01',
    paperYear: 'Curated · SAT',
    topicSlug: 'cdcl',
    question: `Describe the four main differences between DPLL and CDCL. For each, briefly explain why CDCL\'s version is more effective on industrial instances.`,
    answer: `**1. Conflict analysis with learnt clauses.**
- **DPLL:** on conflict, undo the last decision (chronological backtrack) and try the opposite value. No information saved.
- **CDCL:** build an implication graph; find the **1-UIP** cut; derive a **learnt clause** that captures the cause of the conflict.
- **Why effective:** the learnt clause is permanent. Future search paths that would re-create the same conflict are pruned immediately by unit propagation through the learnt clause. On structured instances, learnt clauses compound — a few thousand can replace exponential search.

**2. Non-chronological backjumping.**
- **DPLL:** go back exactly one decision level on conflict.
- **CDCL:** jump to the **second-highest decision level** present in the learnt clause — often skipping many levels.
- **Why effective:** when the relevant cause of a conflict is far back, chronological backtrack wastes time undoing irrelevant intermediate decisions. CDCL\'s "asserting clause" property guarantees the jump is safe and immediately useful.

**3. VSIDS branching heuristic.**
- **DPLL:** classic heuristics like Jeroslow-Wang, MOMS, DLIS — score by clause occurrences in the current formula.
- **CDCL:** **VSIDS** maintains per-variable activity scores that bump when the variable appears in a learnt clause and decay periodically. Branches on highest-activity unassigned variable.
- **Why effective:** VSIDS focuses the search on the "currently hot" region of the formula — the variables that are causing trouble. Cheap O(log n) update with a priority queue.

**4. Two-watched literals.**
- **DPLL:** after each assignment, scan every clause to find new unit clauses.
- **CDCL:** each clause "watches" two of its non-false literals. A clause is only checked when one of its watches becomes false. No scan otherwise.
- **Why effective:** propagation per assignment drops from O(|clauses|) to O(|clauses touching the just-flipped variable|). On large instances, this is the difference between propagation taking 1 ms vs 1 s per step.

**Together** these turn an exponential-worst-case algorithm into one that solves industrial instances with millions of variables.`,
  },

  {
    id: 'cu-sat-02',
    paperYear: 'Curated · SAT',
    topicSlug: 'walksat',
    question: `Explain why WALKSAT cannot prove a formula is unsatisfiable. Why is this acceptable in practice?`,
    answer: `**WALKSAT is a local search algorithm.** It starts from a random assignment and repeatedly flips variables to reduce the number of unsatisfied clauses. It terminates when:
1. All clauses are satisfied (SAT — returns the assignment); OR
2. A maximum flip / restart budget is exhausted (returns "unknown").

**It cannot return UNSAT** because it never explores the assignment space exhaustively. A negative answer from WALKSAT means "I couldn't find an assignment in my budget" — not "no assignment exists".

**Why this is acceptable:**

1. **WALKSAT targets SAT-likely instances.** It excels at random 3-SAT below the phase transition and certain industrial SAT instances. For these, finding *a* satisfying assignment is the goal — proving UNSAT is unnecessary.

2. **For UNSAT proofs, use CDCL.** Industrial SAT often combines both: a portfolio runs WALKSAT and CDCL in parallel, returning whichever finishes first. WALKSAT handles satisfiable instances; CDCL handles unsatisfiable.

3. **Many real-world problems are known SAT a priori.** E.g. test-case generation for software verification — the formula encodes "there exists a buggy input"; you only care if WALKSAT finds one.

4. **WALKSAT is cheaper.** Sometimes finding a satisfying assignment is *much* cheaper than the proof-search done by CDCL. When you only need a witness, paying for a proof is wasteful.

**Theoretical aside:** WALKSAT *can* be made probabilistically complete (Schöning's algorithm achieves $\\tilde O(1.334^n)$ for 3-SAT with random restarts) but the proof of failure still requires exhausting an exponential budget — not a real-world UNSAT proof, just an upper bound on solve time.`,
  },
];
