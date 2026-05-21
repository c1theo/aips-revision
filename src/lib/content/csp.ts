import type { Module } from '../types';

export const cspModule: Module = {
  id: 'csp',
  title: 'Module 3 · CSPs & Constraint Programming',
  slug: 'csp',
  oneLiner: 'CSP fundamentals, AC-3, backtracking, modelling concepts, Essence Prime, Savile Row.',
  topics: [
    {
      id: 'fundamentals',
      slug: 'csp-fundamentals',
      module: 'Module 3 · CSPs',
      title: 'CSP fundamentals',
      oneLiner: 'Variables, domains, constraints — and why CSPs are useful.',
      sections: [
        {
          id: 'definition',
          title: 'Definition',
          blocks: [
            { kind: 'md', body: `A **Constraint Satisfaction Problem (CSP)** is a triple $(X, D, C)$:

- $X = \\{X_1, \\ldots, X_n\\}$ — variables.
- $D = \\{D_1, \\ldots, D_n\\}$ — domain $D_i$ for each variable (set of allowed values).
- $C = \\{C_1, \\ldots, C_m\\}$ — constraints. Each $C_j = \\langle \\mathrm{scope}_j, \\mathrm{rel}_j \\rangle$: a tuple of variables it involves and a relation specifying which value combinations are allowed.

A **state** is an assignment of values to some variables. **Consistent** = no constraint violated. **Complete** = all variables assigned. A **solution** is a complete, consistent assignment.

**Why model as a CSP?**
- Generic solvers exist and propagate constraints aggressively.
- Constraint structure ⇒ algorithmic exploitation (e.g. tree-structured CSPs are polynomial).
- Often **modelling itself is the problem** — multiple formulations exist; choice matters hugely.` },
          ],
        },
        {
          id: 'taxonomy',
          title: 'Constraint taxonomy',
          blocks: [
            { kind: 'md', body: `By arity:
- **Unary** — on one variable (e.g. $X_1 \\ne 3$). Can usually be absorbed into the domain.
- **Binary** — on two variables (e.g. $X_1 \\ne X_2$).
- **Higher-order / Global** — on $k > 2$ variables (e.g. $\\mathrm{AllDifferent}(X_1, \\ldots, X_n)$).

By domain:
- **Discrete, finite** — classic combinatorial CSPs (this module).
- **Discrete, infinite** — integer programming.
- **Continuous** — linear/non-linear programming.

By preference:
- **Hard** constraints — must hold.
- **Soft** constraints — preferences, with weights (constraint *optimisation*).` },
          ],
        },
        {
          id: 'graph',
          title: 'Constraint graph & hypergraph',
          blocks: [
            { kind: 'md', body: `For binary CSPs, the **constraint graph** has one node per variable and one edge per binary constraint. For higher-arity constraints, a **constraint hypergraph** has hyperedges spanning the variables in each constraint.

Graph structure is crucial — *tree-structured* binary CSPs are solvable in $O(nd^2)$ (see "Problem Structure"). Cycles cost more.` },
            { kind: 'viz', viz: 'ConstraintGraph', title: 'Draw any CSP\'s constraint graph', props: {} },
          ],
        },
        {
          id: 'examples',
          title: 'Canonical examples',
          blocks: [
            { kind: 'md', body: `**Map colouring (Australia).** Variables = states/territories, domain = $\\{\\text{red}, \\text{green}, \\text{blue}\\}$, constraints = adjacent regions differ. Constraint graph = map adjacency.

**n-Queens.** Variables = rows, domain = column indices $1..n$. Constraints: $X_i \\ne X_j$ (different columns) and $|X_i - X_j| \\ne |i - j|$ (different diagonals). Implicit: one queen per row.

**Sudoku.** Variables = cells, domain = $\\{1..9\\}$, constraints = AllDifferent on each row, column, $3 \\times 3$ box.

**Cryptarithmetic** (SEND + MORE = MONEY). Variables = letters, domain = $\\{0..9\\}$, constraints = AllDifferent + the arithmetic equality. The arithmetic constraint involves all 8 letters — naturally a global constraint.` },
          ],
        },
        {
          id: 'csplab',
          title: 'Interactive: complete CSP pipeline (CSPLab)',
          blocks: [
            { kind: 'md', body: `**CSPLab** runs the whole pipeline on a CSP you define — node consistency, optional AC-3 preprocessing, then backtracking with selectable propagation (None / FC / MAC), branching style (d-way / 2-way), variable ordering (top / MRV / degree / MRV+deg / custom), and value ordering (increasing / decreasing / LCV / custom). The search tree grows as you step through it.

Use it to test every "what if?" in this module:` },
            { kind: 'viz', viz: 'CSPLab', title: 'CSPLab — full CSP solver pipeline', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'cf1', q: 'What is a CSP, formally?', a: 'A triple (X, D, C): variables X_i, each with domain D_i, and constraints C_j each with a scope and a relation listing allowed value tuples.' },
        { id: 'cf2', q: 'What is a constraint graph?', a: 'For binary CSPs: nodes = variables, edges = binary constraints. Captures structure; tree-structured ⇒ polynomial.' },
        { id: 'cf3', q: 'Sudoku as a CSP — which type of constraint dominates?', a: 'AllDifferent (global constraint) over each row, column and 3×3 box.' },
      ],
      examples: [
        {
          id: 'cfex1', difficulty: 'basic', marks: 6,
          question: 'Formulate the SEND + MORE = MONEY cryptarithmetic puzzle as a CSP. State variables, domains, and the constraints.',
          answer: `**Variables:** $\\{S, E, N, D, M, O, R, Y\\}$ — 8 letters.

**Domains:** $D_X = \\{0, 1, \\ldots, 9\\}$ for each variable.

**Constraints:**
1. **AllDifferent**$(S, E, N, D, M, O, R, Y)$ — global constraint encoding "each letter is a different digit".
2. **Leading-zero** constraints: $S \\ne 0$, $M \\ne 0$ — words can't start with 0.
3. **Arithmetic constraint** (single global constraint over all 8 variables):

$$1000S + 100E + 10N + D + 1000M + 100O + 10R + E = 10000M + 1000O + 100N + 10E + Y$$

**Alternative formulation with carries** (more local, better for propagation): introduce carry variables $C_1, C_2, C_3, C_4 \\in \\{0, 1\\}$, then:

$$D + E = Y + 10 C_1$$
$$N + R + C_1 = E + 10 C_2$$
$$E + O + C_2 = N + 10 C_3$$
$$S + M + C_3 = O + 10 C_4$$
$$C_4 = M$$

This is a classic **viewpoint** choice — see the modelling topic.

**Solution.** $S=9, E=5, N=6, D=7, M=1, O=0, R=8, Y=2$. Yields 9567 + 1085 = 10652.`,
        },
        {
          id: 'cfex2', difficulty: 'intermediate', marks: 5,
          question: 'Why are global constraints (e.g. AllDifferent) usually preferred over an equivalent collection of binary constraints?',
          answer: `**Equivalence.** AllDifferent$(X_1, \\ldots, X_n)$ is logically equivalent to the $\\binom{n}{2}$ pairwise inequalities $X_i \\ne X_j$.

**Why the global form wins:**

1. **Stronger propagation.** AllDifferent supports specialised algorithms (e.g. Régin's flow-based algorithm) that achieve **arc consistency on the entire constraint at once** — pruning values that no perfect matching can use. Pairwise $\\ne$ constraints can only prune values that *some* neighbour blocks; they miss higher-arity inconsistencies.
2. **Concise model.** $\\binom{n}{2}$ inequalities for $n=10$ is 45 constraints; one AllDifferent is one. Easier to read and modify.
3. **Solver-side optimisation.** Solvers know AllDifferent intimately and apply tuned propagators with good time/space trade-offs.

**Concrete example.** Latin square completion: AllDifferent per row/col can detect infeasibility several plies earlier than pairwise inequalities — because it sees that no valid matching exists.

**Trade-off.** AllDifferent propagators have higher per-call cost than $\\ne$. Solvers may downgrade to "bounds consistency" for AllDifferent on large variables to balance speed and pruning.`,
        },
        {
          id: 'cfex3', difficulty: 'advanced', marks: 7,
          question: 'Classify these constraints by arity: (a) $X_1 < X_2$, (b) $X_1 \\ne 3$, (c) AllDifferent$(X_1, X_2, X_3)$, (d) the SEND+MORE arithmetic. Which can be normalised to binary?',
          answer: `**Arity** = number of variables in the scope.

(a) $X_1 < X_2$: **binary** (arity 2).

(b) $X_1 \\ne 3$: **unary** (arity 1) — can be absorbed into the domain.

(c) AllDifferent$(X_1, X_2, X_3)$: **ternary** (arity 3). Equivalent to three binary: $X_1 \\ne X_2, X_2 \\ne X_3, X_1 \\ne X_3$.

(d) SEND+MORE arithmetic: **8-ary** (one constraint over 8 letters), or **5-ary at most** if you introduce carries (5 constraints, each over 3–4 variables).

**Normalisation to binary.** Every CSP can be transformed to an equivalent **binary CSP** via two techniques:

1. **Dual encoding.** Each higher-arity constraint becomes a variable whose domain is its allowed tuples; binary "consistency" constraints between dual-variables enforce shared assignments. Increases variable count but reduces arity.
2. **Hidden-variable encoding.** Introduce auxiliary variables that "summarise" sub-constraints (e.g. carries in arithmetic).

**Is normalisation worth it?** Often no — global constraints have powerful specialised propagators that lose strength when split. The dual encoding can be slower in practice than handling the higher-arity constraint directly.

**Use case for normalisation.** Theoretical analysis (assuming binary CSP is a clean default) or when targeting a solver that only handles binary constraints.`,
        },
      ],
    },

    {
      id: 'inference',
      slug: 'csp-inference',
      module: 'Module 3 · CSPs',
      title: 'Inference: consistency & AC-3',
      oneLiner: 'Constraint propagation, the consistency hierarchy, and the AC-3 algorithm.',
      sections: [
        {
          id: 'hierarchy',
          title: 'The consistency hierarchy',
          blocks: [
            { kind: 'md', body: `Inference removes values from domains that *cannot* participate in any solution. Different levels of consistency consider different scopes:

- **Node consistency** — every value in $D_i$ satisfies unary constraints on $X_i$.
- **Arc consistency** — for every value $v \\in D_i$ and every binary constraint $(X_i, X_j)$, there exists $w \\in D_j$ such that $(v, w)$ satisfies the constraint. ("$X_i$ is arc-consistent w.r.t. $X_j$".)
- **Path consistency** — for every assignment to $\\{X_i, X_j\\}$ satisfying $C_{ij}$, and every third variable $X_k$, there is a value in $D_k$ satisfying $C_{ik}$ and $C_{jk}$.
- **$k$-consistency** — every consistent assignment to any $k-1$ variables can be extended to a $k$-th.
- **Strong $k$-consistency** = $k$-consistent and $(k-1)$-consistent and … and 1-consistent.

If a CSP is strong $n$-consistent (with $n$ variables), it has a backtrack-free solution.` },
            { kind: 'callout', variant: 'keyfact', title: 'Inference vs search', body: 'Inference shrinks domains. Search tries assignments. The standard architecture interleaves them: assign a value, propagate consistency, recurse.' },
          ],
        },
        {
          id: 'ac3',
          title: 'AC-3 (Mackworth, 1977)',
          blocks: [
            { kind: 'md', body: `AC-3 enforces arc consistency on the entire CSP.

\`\`\`
function AC-3(csp):
    queue := all arcs (X_i, X_j) in csp   # both directions per binary constraint
    while queue not empty:
        (X_i, X_j) := queue.pop()
        if REVISE(csp, X_i, X_j):
            if D_i is empty: return false   # CSP is unsolvable
            for each X_k in NEIGHBOURS(X_i) - {X_j}:
                queue.push((X_k, X_i))
    return true

function REVISE(csp, X_i, X_j):
    revised := false
    for each v in D_i:
        if no w in D_j satisfies the constraint (X_i, X_j) with (v, w):
            D_i := D_i \\ {v}
            revised := true
    return revised
\`\`\`

**Complexity:** $O(c \\cdot d^3)$ where $c$ = number of binary constraints and $d$ = max domain size. (Each arc revisited $O(d^2)$ times worst case; each REVISE is $O(d^2)$.)

Tighter analysis (Zhang & Yap; AC-2001/3.1) achieves $O(cd^2)$ with extra bookkeeping. AC-4 achieves $O(cd^2)$ at high memory cost.` },
            { kind: 'callout', variant: 'nightingale', title: 'AC-3 complexity quoted version', body: 'York lectures historically quote $O(ed^3)$ (Mackworth & Freuder). If the question asks for "the AC-3 complexity from the lectures", give that. Mention $O(ed^2)$ for the algorithms that improve on it.' },
            { kind: 'callout', variant: 'pitfall', title: 'Arcs are directed', body: 'Each binary constraint gives **two** arcs: $(X_i, X_j)$ and $(X_j, X_i)$. AC-3 enqueues both initially. REVISE only prunes the domain of the *first* argument.' },
          ],
        },
        {
          id: 'fc',
          title: 'Forward checking & MAC',
          blocks: [
            { kind: 'md', body: `**Forward checking (FC)**: after assigning $X_i = v$, for every unassigned $X_j$ connected to $X_i$, remove from $D_j$ values inconsistent with $v$. If any $D_j$ becomes empty, backtrack.

FC is a *one-step* propagation — local to the assigned variable's neighbours.

**Maintaining Arc Consistency (MAC)**: same trigger (after each assignment), but run **full AC-3** on the affected arcs. Strictly stronger pruning than FC; the standard choice in modern solvers.

Trade-off: MAC prunes more but costs more per step. In practice MAC wins on hard instances.` },
            { kind: 'callout', variant: 'whatif', title: 'You replace FC with MAC', body: 'Each step does more work, but the search tree shrinks. On most non-trivial CSPs this is net win.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: AC-3 / AC-4 step-by-step',
          blocks: [
            { kind: 'md', body: `The AC-3 stepper supports **unary constraints** (Phase 1: NC), **arbitrary binary predicates** (=, ≠, &lt;, &gt;, ≤, ≥, abs()), **manual arc-picking** (you choose the queue order), and **per-arc revision counts** (great for "find an order where an arc is revised &gt;1 time" exam questions).` },
            { kind: 'viz', viz: 'AC3', title: 'AC-3 stepper — NC + AC, manual queue, revision counts', props: {} },
            { kind: 'viz', viz: 'AC4', title: 'AC-4 with counter data structure', props: {} },
            { kind: 'viz', viz: 'CSPLab', title: 'CSPLab — see how MAC compares with AC-3 alone', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'i1', q: 'Define arc consistency.', a: 'X_i is arc-consistent w.r.t. X_j if for every v in D_i there exists w in D_j such that (v,w) satisfies the constraint.' },
        { id: 'i2', q: 'Complexity of AC-3?', a: 'O(c·d³) (Mackworth & Freuder); tighter analysis or AC-3.1 achieves O(c·d²).' },
        { id: 'i3', q: 'Difference between Forward Checking and MAC?', a: 'FC only propagates to immediate neighbours of the just-assigned variable. MAC runs full AC-3 over all affected arcs.' },
        { id: 'i4', q: 'When does AC-3 add arcs back to the queue?', a: 'When REVISE(X_i, X_j) actually removed a value from D_i, re-enqueue all (X_k, X_i) for k ≠ j — because X_i shrinking may break consistency for its other neighbours.' },
      ],
      examples: [
        {
          id: 'iex1', difficulty: 'intermediate', marks: 8,
          question: 'Trace AC-3 on this CSP. Variables: $X, Y, Z$ with domain $\\{1, 2, 3\\}$. Constraints: $X < Y$, $Y < Z$. Show the queue and domain reductions.',
          answer: `**Initial.** $D(X) = D(Y) = D(Z) = \\{1, 2, 3\\}$.

**Arcs** (both directions per constraint): $(X,Y), (Y,X), (Y,Z), (Z,Y)$.

**Queue (initial):** $[(X,Y), (Y,X), (Y,Z), (Z,Y)]$.

---

**Step 1.** Pop $(X, Y)$. REVISE: for each $v \\in D(X)$, is there $w \\in D(Y)$ with $v < w$?
- $v = 1$: ∃ $w = 2$ → keep.
- $v = 2$: ∃ $w = 3$ → keep.
- $v = 3$: no $w$ in $\\{1,2,3\\}$ with $3 < w$ → **remove**.

$D(X) = \\{1, 2\\}$. Re-enqueue arcs $(X_k, X)$ where $X_k \\ne Y$ — no such arcs.

Queue: $[(Y,X), (Y,Z), (Z,Y)]$.

---

**Step 2.** Pop $(Y, X)$. REVISE on $X < Y$ — but X is the second arg, so this REVISE checks: for each $w \\in D(Y)$, is there $v \\in D(X) = \\{1,2\\}$ with $v < w$?

Wait — convention: arc $(Y, X)$ means "make $Y$ consistent w.r.t. $X$". For constraint $X < Y$: keep $w \\in D(Y)$ if ∃ $v \\in D(X)$ with $v < w$.

- $w = 1$: no $v$ with $v < 1$ → **remove**.
- $w = 2$: $v = 1$ works → keep.
- $w = 3$: $v = 1$ works → keep.

$D(Y) = \\{2, 3\\}$. Re-enqueue $(X, Y)$ and $(Z, Y)$ — arcs into $Y$ from variables other than $X$.

Queue: $[(Y,Z), (Z,Y), (X,Y), (Z,Y)]$. (Duplicate $(Z,Y)$ is fine.)

---

**Step 3.** Pop $(Y, Z)$. REVISE: for each $v \\in D(Y) = \\{2, 3\\}$, is there $w \\in D(Z) = \\{1,2,3\\}$ with $v < w$?
- $v = 2$: $w = 3$ → keep.
- $v = 3$: no → **remove**.

$D(Y) = \\{2\\}$. Re-enqueue $(X, Y)$, $(Z, Y)$.

Queue: $[(Z,Y), (X,Y), (Z,Y), (X,Y), (Z,Y)]$.

---

**Step 4.** Pop $(Z, Y)$. REVISE: for each $w \\in D(Z) = \\{1,2,3\\}$, is there $v \\in D(Y) = \\{2\\}$ with $v < w$?
- $w = 1, 2$: no → **remove both**.
- $w = 3$: $v = 2$ → keep.

$D(Z) = \\{3\\}$. Re-enqueue $(Y, Z)$ (constraint $Y < Z$, arc into Z from Y — already covered, but legitimate). Actually we re-enqueue $(X_k, Z)$ for $X_k \\ne Y$ — none exist.

---

**Step 5–.** Pop remaining arcs $(X, Y), (Z, Y), (X, Y)$. Each REVISE finds no removable values (all consistent).

---

**Final domains:** $D(X) = \\{1, 2\\}, D(Y) = \\{2\\}, D(Z) = \\{3\\}$.

**Note:** the CSP is *not* yet solved — $X$ has two values. But it is arc-consistent. Search (with one more decision: $X = 1$ or $X = 2$) finishes it. Both yield solutions $(1, 2, 3)$ and $(2, ?, 3)$ — but $(2, 2, 3)$ violates $X < Y$. Search will discover that with one backtrack, or AC propagated after assigning $X = 2$ will make $D(Y) = \\{\\}$ immediately.`,
        },
        {
          id: 'iex2', difficulty: 'advanced', marks: 8,
          question: 'Derive the AC-3 complexity $O(c d^3)$. Identify which step is the bottleneck.',
          answer: `**Setup.** $c$ = number of binary constraints (so $2c$ directed arcs). $d$ = maximum domain size.

**Per-arc REVISE cost.** For arc $(X_i, X_j)$, REVISE checks each $v \\in D(X_i)$ for a support in $D(X_j)$.
- $|D(X_i)| \\le d$ values to check.
- For each, scan up to $d$ values in $D(X_j)$.
- Total per REVISE: $O(d^2)$.

**Maximum times any arc can be queued.** An arc $(X_k, X_i)$ is re-enqueued only when $D(X_i)$ shrinks. $D(X_i)$ can shrink at most $d$ times (it loses at least 1 value per shrink, starting from $\\le d$).

Each constraint has 2 arcs, so each arc can be enqueued $O(d)$ times across the run of AC-3.

**Total work** = (arcs) × (max enqueues per arc) × (per-REVISE cost)

$$= O(c) \\times O(d) \\times O(d^2) = O(c d^3)$$

**Bottleneck:** the $O(d^2)$ per-REVISE — every value of $D(X_i)$ is checked against every value of $D(X_j)$ from scratch every time.

**AC-2001 / AC-3.1 fix.** Cache, for each $v \\in D(X_i)$, the *last* support found in $D(X_j)$. On re-REVISE, start checking from that cached value. Amortised $O(d)$ per value across the lifetime → $O(c d^2)$ total.

**AC-4** uses a different data structure (counters per value) achieving the same $O(c d^2)$ bound but with heavy memory overhead — usually not worth it in practice.`,
        },
        {
          id: 'iex3', difficulty: 'intermediate', marks: 5,
          question: 'Forward checking sometimes fails to detect a future failure that arc consistency catches. Give a concrete example.',
          answer: `**Setup.** Variables $X_1, X_2, X_3$ with $D = \\{1, 2\\}$ each. Constraints: $X_1 \\ne X_2$, $X_2 \\ne X_3$, $X_1 \\ne X_3$.

This is **3-colouring a triangle with 2 colours** — UNSAT.

**Forward checking on assignment $X_1 = 1$:**
- Updates $D(X_2)$ to remove 1 → $D(X_2) = \\{2\\}$.
- Updates $D(X_3)$ to remove 1 → $D(X_3) = \\{2\\}$.
- Neither domain is empty. FC reports OK.

**FC does not propagate** between $X_2$ and $X_3$ — only between assigned and unassigned. So it doesn't notice that $X_2 = 2$ now forces $X_3 \\ne 2$ (constraint $X_2 \\ne X_3$) which would empty $D(X_3) = \\{2\\}$.

**FC must descend** and pick $X_2 = 2$ before discovering the conflict on $X_3$.

**AC-3 on the same assignment:**
- After $X_1 = 1$: same domain reductions as FC.
- Then enqueue all arcs. Process $(X_3, X_2)$: for $v = 2 \\in D(X_3)$, need $w \\in D(X_2)$ with $w \\ne 2$; but $D(X_2) = \\{2\\}$ — no support. Remove $v = 2$ from $D(X_3)$.
- $D(X_3) = \\{\\}$ → AC-3 reports infeasibility immediately.

**Lesson.** MAC (Maintain AC) catches infeasibilities one or more levels earlier than FC. Tradeoff: per-step cost is higher.`,
        },
      ],
    },

    {
      id: 'backtracking',
      slug: 'backtracking',
      module: 'Module 3 · CSPs',
      title: 'Backtracking & search heuristics',
      oneLiner: 'Generic backtracking + MRV, degree, LCV.',
      sections: [
        {
          id: 'bt',
          title: 'Backtracking search',
          blocks: [
            { kind: 'md', body: `\`\`\`
function BACKTRACK(assignment, csp):
    if assignment is complete: return assignment
    X := SELECT-UNASSIGNED-VARIABLE(csp, assignment)
    for each v in ORDER-DOMAIN-VALUES(X, assignment, csp):
        if v is consistent with assignment given constraints:
            add {X = v} to assignment
            inferences := INFERENCE(csp, X, v)         # FC or MAC, optional
            if inferences != failure:
                add inferences to assignment
                result := BACKTRACK(assignment, csp)
                if result != failure: return result
            remove {X = v} and inferences from assignment
    return failure
\`\`\`

This is the standard backtracking-with-inference skeleton. The interesting choices are the heuristics for **which variable next** and **which value first**, plus the inference strength.` },
          ],
        },
        {
          id: 'mrv',
          title: 'MRV — Minimum Remaining Values',
          blocks: [
            { kind: 'md', body: `**Choose the variable with the smallest domain remaining.** This is the **fail-first** heuristic — pick the variable most likely to fail soon, so we discover dead ends early.

If a variable has only one value left, propagating it is essentially free; if it has zero, we backtrack immediately. Either way, useful.

**Tie-break with degree heuristic.**` },
          ],
        },
        {
          id: 'degree',
          title: 'Degree heuristic (tie-break)',
          blocks: [
            { kind: 'md', body: `When MRV gives several candidates with the same domain size, pick the one **involved in the most constraints on remaining variables**.

Rationale: assigning a high-degree variable propagates further, reducing the search tree more.` },
          ],
        },
        {
          id: 'lcv',
          title: 'LCV — Least Constraining Value',
          blocks: [
            { kind: 'md', body: `Order values to try by **how few choices they remove from neighbours' domains** — try least-constraining first.

Rationale: leave flexibility for the rest of the search.

Note: LCV is for ordering, *not* selection. The variable is already chosen.` },
            { kind: 'callout', variant: 'keyfact', title: 'Fail-first vs succeed-first', body: 'MRV (variable choice) is **fail-first** — pick the hardest. LCV (value choice) is **succeed-first** — pick the easiest. Both push the search towards solutions faster.' },
          ],
        },
        {
          id: 'cbj',
          title: 'Conflict-directed backjumping (brief)',
          blocks: [
            { kind: 'md', body: `When backtracking, instead of going up one level (chronological backtrack), jump to the most recent variable in the **conflict set** — the set of previously assigned variables that conflicted with the current attempt.

Reduces wasted work when the relevant decision is far up the stack. CDCL in SAT (Module 5) is the SAT analogue, more powerful because it also *learns* a clause.` },
          ],
        },
        {
          id: 'advanced-heuristics',
          title: 'Advanced heuristics — beyond MRV / LCV / degree',
          blocks: [
            { kind: 'md', body: `Modern CSP solvers use a richer family of heuristics. Some appear directly in York exam questions, others as background knowledge.

### Variable-ordering heuristics

**MRV** (Minimum Remaining Values) — covered above. Fail-first by domain size.

**Degree** — covered above. Fail-first by static degree.

**Dom + degree** (a.k.a. **MRV + degree**) — tie-break MRV by degree.

**dom/deg** — minimise the *ratio* $|D(X)| / \\deg(X)$. Picks a variable with few values *relative to* how many constraints it participates in. Bessière & Régin showed this generalises MRV.

**wdeg (weighted degree)** — track per-constraint **wipeout counters**: every time a constraint $C$ causes a domain wipeout (in propagation or search), increment $w(C)$. The weighted degree of variable $X$ is $\\sum_{C \\ni X} w(C)$. Pick the variable with the highest wdeg. Captures *dynamic* hardness — constraints that have been failing get more attention.

**dom/wdeg** — Boussemart, Hemery, Lecoutre, Sais (2004). Minimise $|D(X)| / \\text{wdeg}(X)$. State of the art on benchmarks for decades; a strong default.

**Activity-based search** — Michel & Van Hentenryck (2012). Track per-variable activity: increment on every domain shrink, decay over time. Pick max-activity variable. Borrowed conceptually from VSIDS in SAT.

**Impact-based search** — Refalo (2004). Estimate the **impact** of assigning $X = v$ as the product of (1 - retained-fraction) over neighbours' domains. Pick the variable whose best impact is largest. Probe-then-commit variants run a forward look-ahead.

**Last-conflict** — Lecoutre, Saïs, Tabary, Vidal (2006). After a backtrack, **retry the variable that just caused the failure** as the next decision. Like a 1-step nogood learning: if $X = v$ failed at depth $d$, try $X$ first at depth $d-1$ to confirm/deny it sooner.

### Value-ordering heuristics

**LCV** (Least Constraining Value) — covered above. Try the value that rules out the **fewest** values in neighbours' domains.

**Geelen's promise** — Geelen (1992). The *promise* of value $v$ for variable $X$ is:
$$\\text{promise}(X, v) = \\prod_{Y \\ne X \\text{ unassigned}} |\\{ w \\in D(Y) : (v, w) \\text{ satisfies } C_{XY} \\}|$$
Pick the value with the **highest promise** — the value that leaves the largest product (i.e. multiplicative count) of compatible neighbour-value combinations. Equivalent intuition: maximise the size of the remaining search space; equivalent to LCV when neighbours have equal domain sizes, but quantifies "how many solutions could still extend this" more rigorously.

**LCV vs Geelen's promise — when do they differ?** Both pick a value that "leaves more room". LCV counts the **sum** of supports across neighbours; promise takes the **product**. The product punishes any neighbour that loses *all* its support more harshly — a single zero factor wipes out the promise, immediately revealing infeasibility.

**Solution-counting heuristic** — generalises promise: count the number of solutions to a relaxed sub-problem (e.g. local AC-fixpoint), pick the value with the most.

### Tie-breaks and combinations

Real solvers chain several: e.g. **dom/wdeg + Geelen-promise + lex** for variable + value + final tie-break. The win is in the *combination* — no single heuristic dominates on all benchmarks.` },
            { kind: 'callout', variant: 'nightingale', title: 'York-specific names you may see', body: `York lectures (Nightingale et al.) emphasise **MRV**, **degree**, **LCV**, plus **dom/wdeg** and **Geelen's promise** as worked examples in the "Heuristics II" lecture. Be ready to compute promise by hand on a small CSP.` },
            { kind: 'callout', variant: 'whatif', title: 'What if I don\'t know which heuristic the question wants?', body: `Default fallback: **MRV + degree tie-break + LCV** + apply MAC at every node. This combination is correct, well-known, and gets credit on virtually every exam question that doesn't *name* a specific heuristic.` },
          ],
        },
        {
          id: 'promise-worked',
          title: "Worked example — Geelen's promise vs LCV",
          blocks: [
            { kind: 'md', body: `**CSP.** $X, Y, Z \\in \\{1, 2, 3\\}$. Constraints: $X < Y$, $X < Z$.

We have just decided to assign $X$. Which value should we try first?

### LCV computation
$X = 1$ rules out 0 values from $D(Y)$ (all of $\\{2, 3\\}$ remain) and 0 from $D(Z)$. **Total ruled out: 0**.

$X = 2$ rules out 1 from $D(Y)$ (only $\\{3\\}$ left) and 1 from $D(Z)$. **Total: 2**.

$X = 3$ rules out 2 from $D(Y)$ ($\\emptyset$ left) — wipeout!

LCV order: $X = 1$ → $X = 2$ → $X = 3$.

### Geelen's promise
$X = 1$: $|D(Y) \\cap \\{w > 1\\}| \\cdot |D(Z) \\cap \\{w > 1\\}| = 2 \\cdot 2 = \\mathbf{4}$.

$X = 2$: $|\\{3\\}| \\cdot |\\{3\\}| = 1 \\cdot 1 = \\mathbf{1}$.

$X = 3$: $|\\emptyset| \\cdot |\\emptyset| = 0 \\cdot 0 = \\mathbf{0}$.

Promise order: $X = 1$ → $X = 2$ → $X = 3$. Same as LCV here.

### Where they differ — asymmetric neighbours
Now make the CSP: $X \\in \\{1, 2\\}$, $Y \\in \\{1, 2, 3, 4, 5\\}$, $Z \\in \\{1, 2\\}$. Constraint: $X \\ne Y$ and $X \\ne Z$.

**LCV:**
- $X = 1$: rules out 1 from $D(Y)$ (4 left) and 1 from $D(Z)$ (1 left). Total: 2.
- $X = 2$: rules out 1 from $D(Y)$ (4 left) and 1 from $D(Z)$ (1 left). Total: 2.

**Tie under LCV.**

**Promise:**
- $X = 1$: $4 \\cdot 1 = 4$.
- $X = 2$: $4 \\cdot 1 = 4$.

**Tie under promise too.**

### A case where promise discriminates and LCV doesn't
$X \\in \\{1, 2\\}$, $Y \\in \\{2, 3\\}$, $Z \\in \\{1\\}$ (singleton). Constraint: $X \\ne Y$, $X \\ne Z$.

**LCV:**
- $X = 1$: rules out 0 from $D(Y) = \\{2, 3\\}$, rules out 1 from $D(Z) = \\{1\\}$ → wipeout for $Z$! Total: 1.
- $X = 2$: rules out 1 from $D(Y) = \\{2, 3\\}$, rules out 0 from $D(Z) = \\{1\\}$. Total: 1.

**LCV ties.**

**Promise:**
- $X = 1$: $2 \\cdot 0 = \\mathbf{0}$ — the zero immediately shows this is a dead value.
- $X = 2$: $1 \\cdot 1 = 1$.

**Promise picks $X = 2$ — and avoids the wipeout LCV missed because LCV doesn't notice the multiplicative effect of a single zero.**

This is the standard textbook demonstration of why **product (promise) > sum (LCV)** for value ordering.` },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: backtracking with MRV/LCV/FC toggles',
          blocks: [
            { kind: 'viz', viz: 'NQueens', title: 'n-Queens / graph colouring backtracking', props: {} },
            { kind: 'viz', viz: 'ForwardCheck', title: 'Generic FC + backtracking — any CSP', props: {} },
            { kind: 'viz', viz: 'CSPLab', title: 'CSPLab — toggle FC vs MAC, d-way vs 2-way, MRV/degree/LCV', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'b1', q: 'MRV stands for?', a: 'Minimum Remaining Values — pick the variable with the smallest remaining domain. Fail-first heuristic.' },
        { id: 'b2', q: 'When does the degree heuristic kick in?', a: 'As tie-break for MRV. Picks the variable involved in the most constraints on remaining (unassigned) variables.' },
        { id: 'b3', q: 'LCV ordering — what counts as "least constraining"?', a: 'The value that rules out the fewest values in neighbouring variables\' domains.' },
      ],
      examples: [
        {
          id: 'bex1', difficulty: 'intermediate', marks: 8,
          question: 'Trace backtracking with MRV + FC on a 4-queens problem. Show the variable ordering chosen and the search tree.',
          answer: `**Formulation.** Variables $X_1, X_2, X_3, X_4$ = column of queen in row $i$. Domain $\\{1, 2, 3, 4\\}$.

**Constraints:**
- $X_i \\ne X_j$ (different columns)
- $|X_i - X_j| \\ne |i - j|$ (different diagonals)

**Initial domains:** all $\\{1, 2, 3, 4\\}$.

**MRV** ties initially (all domains size 4). Without degree to tie-break (all symmetric), pick $X_1$.

**Branch on $X_1$:**

Try $X_1 = 1$. FC: $X_2$ removes $\\{1, 2\\}$ (column 1, diag), $X_3$ removes $\\{1, 3\\}$, $X_4$ removes $\\{1, 4\\}$.

$D(X_2) = \\{3, 4\\}, D(X_3) = \\{2, 4\\}, D(X_4) = \\{2, 3\\}$.

MRV: tied at 2. Pick $X_2$ (lowest index).

Try $X_2 = 3$. FC: $X_3$ removes $\\{2, 3, 4\\}$ → $D(X_3) = \\{\\}$. **FC fails** → backtrack.

Try $X_2 = 4$. FC: $X_3$ removes $\\{3, 4\\}$ — wait, $X_3$ already has $\\{2, 4\\}$; remove 4 (col) and 3 (diag from row 2 to row 3 = 1). $D(X_3) = \\{2\\}$. $X_4$ removes $\\{3, 4\\}$ (col 4, diag 2 from row 2 to row 4): $D(X_4) = \\{2\\}$ → wait $X_4$ had $\\{2,3\\}$, remove 4 not present, remove 2 (diag from $X_2=4$ to row 4 = 2 steps, col diff $|4-?|$=2 → col 2 and col 6 — so remove col 2) → $D(X_4) = \\{3\\}$.

Recheck after $X_2 = 4$: $D(X_3) = \\{2\\}, D(X_4) = \\{3\\}$.

MRV: tied at 1 → pick $X_3$.

Try $X_3 = 2$. FC: $X_4$ removes $\\{2\\}$ (col, not present), $\\{1, 3\\}$ (diag from row 3 col 2): remove 3 → $D(X_4) = \\{\\}$. **FC fails** → backtrack.

No more values for $X_3$. Backtrack to $X_2$. No more values. Backtrack to $X_1$.

Try $X_1 = 2$. FC: $D(X_2) = \\{4\\}, D(X_3) = \\{1, 3\\}, D(X_4) = \\{1, 3, 4\\}$.

MRV: $X_2$ (size 1).

$X_2 = 4$. FC: $D(X_3) = \\{1\\}$ (remove 3 diag), $D(X_4) = \\{1, 3\\}$ (remove 4 col, no diag conflict).

MRV: $X_3$ (size 1). $X_3 = 1$. FC: $D(X_4) = \\{3\\}$ (remove 1 col, no diag).

$X_4 = 3$. **Solution: (2, 4, 1, 3)** ✓.

**Search tree summary:** 2 backtracks before finding the first solution (using MRV+FC).`,
        },
        {
          id: 'bex2', difficulty: 'advanced', marks: 6,
          question: 'When MRV and degree heuristic *both* tie, what should you do? Argue why arbitrary choice is OK.',
          answer: `**When ties remain.** Pick **any** remaining candidate (e.g. lexicographic, random). The choice is heuristic-neutral.

**Why arbitrary is OK:**

1. **Tied MRV + tied degree** means symmetric variables — by construction, none looks "harder" or "more constraining" than the others.
2. **Symmetric problems benefit from symmetry breaking** rather than careful tie-breaking. Adding a constraint like "$X_1 \\le X_2$ when interchangeable" eliminates the tie entirely.
3. **No-good learning** (CBJ, restarts with VSIDS-like activity in CDCL) eventually distinguishes the ties — picking randomly is no worse than picking deterministically.

**Empirical evidence.** On random CSP benchmarks, the runtime distribution across "random tie-break vs lexicographic" is statistically indistinguishable for hard instances.

**Practical advice:** use random tie-breaking + restarts — combines well with symmetry breaking and avoids worst-case "always picks the wrong direction" pathologies.`,
        },
        {
          id: 'bex3', difficulty: 'intermediate', marks: 5,
          question: 'Show a scenario where LCV (Least Constraining Value) leads to a faster solution than naive lexicographic value ordering.',
          answer: `**Setup.** Map colouring on 3 regions $A, B, C$ all pairwise adjacent. Domain $\\{R, G, B\\}$. Currently $D(A) = \\{R, G, B\\}$, $D(B) = \\{R, G\\}$, $D(C) = \\{R, B\\}$.

We're about to assign $A$. MRV picks $A$ (largest unassigned at the moment, in this contrived example) — let's say lex-min after some prior selection.

**Lex order tries $A = R$ first.**
After $A = R$: $D(B) = \\{G\\}, D(C) = \\{B\\}$ — both size 1 (tight) but feasible. OK.

**LCV order:** count how many values each candidate removes from others' domains.
- $A = R$: removes 1 from $D(B)$ (it had R) and 1 from $D(C)$. **Total removed: 2.**
- $A = G$: removes 1 from $D(B)$ (it had G), 0 from $D(C)$ (no G). **Total removed: 1.**
- $A = B$: removes 0 from $D(B)$, 1 from $D(C)$. **Total removed: 1.**

LCV ties at 1 → pick $A = G$ (lex). After $A = G$: $D(B) = \\{R\\}, D(C) = \\{R, B\\}$.

**Why LCV is better here:** after the assignment, $D(C)$ has 2 values instead of 1 — more flexibility downstream, fewer backtracks if later constraints conflict.

**Caveat — when LCV doesn't help:**
- If the problem is **insatisfiable**, you want fast failure. LCV picks values likely to succeed → delays discovering UNSAT.
- For UNSAT problems, the *opposite* (most constraining value) speeds detection — but at the cost of slowing SAT cases.

**Practical heuristic:** LCV for SAT-likely problems; *most-constraining* for UNSAT-likely.`,
        },
      ],
    },

    {
      id: 'modelling',
      slug: 'cp-modelling',
      module: 'Module 3 · CSPs',
      title: 'CP modelling: types, viewpoints, channeling, implied',
      oneLiner: 'Sets, sequences, relations, functions, partitions. Viewpoints, channeling, implied constraints, nesting.',
      sections: [
        {
          id: 'methodology',
          title: '🧭 Modelling methodology — a 7-step process',
          blocks: [
            { kind: 'md', body: `Modelling is a *skill* with a checkable procedure. Apply these seven steps to **any** word problem you're asked to formulate as a CSP.

### Step 1 — Identify the decisions
Read the problem and ask: **what does the modeller need to choose?** The answers are your decision variables. Different problems suggest different choices:

| Problem hint | Likely variables |
|---|---|
| "Assign $X$ to one of $Y$" | One variable per item of $X$, domain = $Y$ |
| "Find a sequence / schedule" | One variable per position, domain = items, OR one variable per item, domain = times |
| "Place $n$ objects on a board" | Position variables (row, col) for each object |
| "Partition into $k$ groups" | Group-id per element, OR set-of-elements per group |
| "Choose a subset of size $k$" | $k$ index variables + AllDifferent + lex-order to break symmetry |

### Step 2 — Choose domains
Smallest possible. Examples:

- A digit → $\\{0, 1, \\ldots, 9\\}$ — never $\\mathbb{Z}$.
- A weekday → $\\{1, 2, 3, 4, 5\\}$, not $\\{$Mon, Tue, $\\ldots\\}$ (use string names only when the order doesn't matter).
- Boolean flags → $\\{0, 1\\}$.
- Time slots within a 4-hour window → $\\{1, 2, 3, 4\\}$ (not unbounded).

Tighter domains = stronger up-front propagation.

### Step 3 — List the constraints, by source
Walk through the problem text **sentence by sentence**, turning each requirement into a constraint:

1. **Hard rules of the domain** ("two queens can't share a row" → constraint).
2. **Resource / capacity limits** ("each warehouse supplies ≤ 100 units" → sum-bounded).
3. **Mutual exclusion** ("at most one task per machine at a time" → AllDifferent or non-overlap).
4. **Ordering / precedence** ("task B must follow task A" → $s_B \\ge s_A + d_A$).
5. **Coverage** ("every shop must be supplied by some warehouse" → function totality).
6. **Quotas / counts** ("each colour used exactly $k$ times" → gcc).

### Step 4 — Pick the arity wisely
Prefer **global constraints** over decomposed binary ones — they propagate strictly stronger:

| Want | Use | Don't use |
|---|---|---|
| All variables take different values | $\\text{AllDifferent}$ | $\\binom{n}{2}$ pairwise $\\ne$ |
| Sum to $k$ | $\\sum X_i = k$ | hand-decomposed pairwise sums |
| At most $k$ true | sequential counter / totalizer | naive pairwise $\\lnot$ |
| Each value occurs in $[\\ell, u]$ | $\\text{gcc}$ | hand-counted |
| $Z$ is the $Y$-th entry of $X$ | $\\text{element}(X, Y, Z)$ | case-split |

### Step 5 — Add implied constraints
Implied (= entailed but explicit) constraints make propagation stronger:

- **Arithmetic identities** the solver can't derive: in a magic square, $\\sum_{\\text{all cells}} = N \\cdot \\mu$ is implied by row-sums + col-sums but stating it lets bounds-propagation kick in.
- **Counting bounds** that follow from the problem: "$n$ tasks, $k$ days → total work ≤ $k \\cdot$ daily capacity".
- **Domain bounds** from deadline + duration: $s_i \\le \\text{deadline} - d_i + 1$.

**Always check:** does every original solution still satisfy this? (If not, you've LOST solutions — it wasn't implied.)

### Step 6 — Break symmetries
Identify symmetry **groups** in the problem and add constraints to break them:

- Interchangeable variables → lex-order ($X_1 \\le X_2 \\le \\ldots$).
- Interchangeable values → value precedence ($\\text{firstOccurrence}(v_i) < \\text{firstOccurrence}(v_{i+1})$).
- Matrix row + column symmetry → DoubleLex.
- Geometric symmetries (n-queens reflections) → fix one queen to break a 4-fold reflection.

Symmetry breaking shrinks the search by up to $|G|$ where $G$ is the symmetry group.

### Step 7 — Sanity-check
Three quick checks:

1. **Does every solution to the original problem satisfy every constraint?** If not, you have an over-constraint — remove or fix.
2. **Does every assignment satisfying every constraint correspond to a valid solution?** If not, you have an under-constraint — add the missing one.
3. **Are there obvious propagation gaps?** Small examples by hand — does AC-3 / FC make progress, or do all variables stay full-domain until search?

If all three pass, the model is sound. Now decide on a viewpoint (next section), and proceed to solving.` },
            { kind: 'callout', variant: 'keyfact', title: 'The hardest part is Step 1', body: `Different variable choices give wildly different models. Always brainstorm 2-3 viewpoints before committing — they often have very different propagation behaviour. See "Viewpoints" below.` },
            { kind: 'callout', variant: 'pitfall', title: 'Common mistake: variables you don\'t need', body: `If the problem says "task $i$ takes $d_i$ hours", $d_i$ is a **parameter**, not a decision variable. Only model what the *modeller chooses*.` },
            { kind: 'callout', variant: 'whatif', title: 'What if the question doesn\'t give explicit domains?', body: `Derive them from the problem: a "start time within $H$ hours" → $\\{1..H\\}$. A "colour" with no count → use $\\{1..\\chi\\}$ where $\\chi$ is the chromatic number bound (e.g. $\\le \\Delta + 1$ for graph colouring).` },
          ],
        },
        {
          id: 'methodology-worked',
          title: 'Worked methodology example — bin packing',
          blocks: [
            { kind: 'md', body: `**Problem.** Given $n$ items with weights $w_1, \\ldots, w_n$, pack them into the minimum number of bins of capacity $C$.

### Step 1 — Decisions
Two natural choices:
- **(A) Bin-per-item:** $b_i$ = which bin item $i$ goes into.
- **(B) Items-per-bin:** $\\text{contents}_j$ = set of items in bin $j$.

(A) gives one integer per item — concise. (B) is set-valued and would need encoding in Essence Prime (matrix of 0/1). Pick (A).

### Step 2 — Domains
Maximum #bins ≤ $n$ (each item in its own bin). So $b_i \\in \\{1, \\ldots, n\\}$.

Tighter: $b_i \\le \\lceil n \\cdot \\bar w / C \\rceil$ where $\\bar w$ is mean weight (rough lower bound on #bins).

### Step 3 — Constraints
Walk the problem:
- "Bins of capacity $C$" → for each bin $j$, $\\sum_{i : b_i = j} w_i \\le C$. Use a **sum** constraint per bin, or **gcc** with item-weights.
- "Minimise the number of bins" → minimise $\\max_i b_i$ (or introduce $K = \\max_i b_i$ and minimise $K$).

### Step 4 — Arity
- Per-bin sum is naturally a global constraint (sum over items assigned to bin $j$).
- Alternative: indicator variables $y_{ij} \\in \\{0,1\\}$ for "item $i$ in bin $j$"; then $\\sum_i y_{ij} w_i \\le C$ for each $j$ — but this introduces $n^2$ variables. Pick the integer encoding (A).

### Step 5 — Implied constraints
- **Total weight bound:** $\\sum_i w_i \\le C \\cdot K$. Lets the solver immediately reject impossible $K$.
- **Big items separation:** items with $w_i > C/2$ cannot share a bin — add $b_i \\ne b_j$ for such pairs.

### Step 6 — Symmetry
- **Bin permutation symmetry:** bins are interchangeable. Break it by **lex-leader on bin assignments** or **value precedence**: the first item goes to bin 1, the next new bin used is bin 2, etc. Equivalently: $b_1 = 1$ and $b_i \\le \\max_{j < i} b_j + 1$.

### Step 7 — Sanity check
- Solution → all items packed, capacity respected, $K$ counted correctly. ✓
- Assignment satisfying constraints → valid packing. ✓ (need to check: nothing rules out a feasible packing.)
- Propagation: with strong bin-sum constraints and the symmetry break, early decisions immediately tighten $K$.

### Final model (Essence Prime sketch)

\`\`\`
given n : int(1..)
given C : int(1..)
given weights : matrix indexed by [int(1..n)] of int(1..C)

find b : matrix indexed by [int(1..n)] of int(1..n)
find K : int(1..n)

minimising K

such that
  forAll j : int(1..n) .
    (sum i : int(1..n) . [weights[i] | b[i] = j]) <= C,
  forAll i : int(1..n) . b[i] <= K,
  forAll i : int(1..n-1) . b[i+1] <= max([b[k] | k : int(1..i)]) + 1   $ value-precedence
\`\`\`

Reading top-to-bottom: every bin within capacity; $K$ tracks the highest used bin id; value-precedence breaks bin symmetry.` },
            { kind: 'viz', viz: 'CSPLab', title: 'CSPLab — sketch a smaller bin-packing instance to test propagation', props: {} },
          ],
        },
        {
          id: 'set-representations',
          title: 'Occurrence vs explicit set representation',
          blocks: [
            { kind: 'md', body: `When a decision variable is a **set** drawn from some universe $U = \\{1, \\ldots, q\\}$, Essence Prime forces us to choose a concrete encoding. The two canonical choices are:

### Occurrence representation

A Boolean vector indexed by $U$:
\`\`\`
find  occ : matrix indexed by [int(1..q)] of bool
\`\`\`
\`occ[v] = true\` iff $v$ is in the set. To force a set of size $p$:
\`\`\`
sum( occ ) = p
\`\`\`
**No symmetry** — each value $v$ has a fixed slot, so the representation is canonical.

### Explicit representation

A vector of $p$ integer slots:
\`\`\`
find  s : matrix indexed by [int(1..p)] of int(1..q)
\`\`\`
\`s[i]\` is the $i$-th element of the set. To enforce a SET (not multiset): add \`allDiff(s)\`. To break symmetry: add **strictly-increasing** order:
\`\`\`
forAll i : int(1..p-1) . s[i] < s[i+1]
\`\`\`
The lex constraint **simultaneously enforces no duplicates** (a strict inequality implies $\\ne$) and **breaks the $p!$ permutation symmetry** of the $p$ slots.

### Comparison

|   | Occurrence | Explicit |
|---|---|---|
| Variables | $q$ booleans | $p$ integers in $\\{1..q\\}$ |
| Symmetry | None | $p!$ permutation symmetry |
| "Size $p$" constraint | $\\sum$ occ $= p$ | Implicit (matrix size) |
| Membership test "$v \\in S$?" | $O(1)$ via \`occ[v]\` | $O(p)$ scan or use \`exists\` |
| Total size of decision space | $2^q$ | $q^p$ |
| Best when... | $p \\approx q/2$ | $p \\ll q$ |

### Worked: set of 3 elements from $\\{1..10\\}$

**Occurrence:**
\`\`\`
find occ : matrix indexed by [int(1..10)] of bool
such that sum(occ) = 3
\`\`\`

**Explicit:**
\`\`\`
find s : matrix indexed by [int(1..3)] of int(1..10)
such that forAll i : int(1..2) . s[i] < s[i+1]
\`\`\`

Both encode the same set of $\\binom{10}{3} = 120$ solutions. Choice affects propagation cost and the natural form of downstream constraints.` },
            { kind: 'callout', variant: 'keyfact', title: 'Strict < as a double-duty constraint', body: `In the explicit encoding, $s[i] < s[i+1]$ ELIMINATES BOTH duplicates AND the $p!$ symmetry of permutations of the slots — one constraint, two jobs done. This is THE standard exam answer for "encode a set of size $k$".` },
            { kind: 'callout', variant: 'pitfall', title: 'Multiset variants', body: `For a **multiset** (duplicates allowed), use $s[i] \\le s[i+1]$ (non-strict). For a **sequence** (order matters), use no ordering — but then there's no symmetry to break.` },
          ],
        },
        {
          id: 'bibd-worked',
          title: 'Worked: BIBD in both set representations',
          blocks: [
            { kind: 'md', body: `**BIBD** = Balanced Incomplete Block Design. Parameters $(v, b, r, k, \\lambda)$:

- $v$ — number of objects.
- $b$ — number of blocks.
- $r$ — each object appears in exactly $r$ blocks.
- $k$ — each block has exactly $k$ objects.
- $\\lambda$ — every pair of objects appears together in exactly $\\lambda$ blocks.

Relations: $bk = vr$ and $r(k-1) = \\lambda(v-1)$.

### Occurrence model (standard)

Each block is a set of $k$ objects; encode as a matrix:
\`\`\`
given v, b, r, k, lambda : int
find  X : matrix indexed by [int(1..v), int(1..b)] of bool

such that
  $ each block has exactly k objects
  forAll j : int(1..b) . sum(X[.., j]) = k,
  $ each object appears in exactly r blocks
  forAll i : int(1..v) . sum(X[i, ..]) = r,
  $ every pair of objects appears in exactly lambda blocks
  forAll i1, i2 : int(1..v) . i1 < i2 ->
    (sum j : int(1..b) . X[i1, j] /\\ X[i2, j]) = lambda
\`\`\`

The variable \`X[i, j]\` = "object $i$ is in block $j$" (occurrence of object $i$ in block $j$).

### Explicit model (alternative)

For each **object**, the set of blocks it belongs to. The set has size $r$ (since each object appears in $r$ blocks):
\`\`\`
given v, b, r, k, lambda : int
find  Y : matrix indexed by [int(1..v), int(1..r)] of int(1..b)

such that
  $ each object's r blocks are distinct + lex-ordered (set encoded explicitly)
  forAll i : int(1..v) . forAll p : int(1..r-1) . Y[i, p] < Y[i, p+1],
  $ each block has exactly k objects (counted across all object-rows)
  forAll j : int(1..b) .
    (sum i : int(1..v) . exists p : int(1..r) . Y[i, p] = j) = k,
  $ every pair of objects shares exactly lambda blocks
  forAll i1, i2 : int(1..v) . i1 < i2 ->
    (sum p1, p2 : int(1..r) . Y[i1, p1] = Y[i2, p2]) = lambda
\`\`\`

### Comparing the two models

The **explicit** model produces $vr$ integer variables (each in $\\{1..b\\}$); the **occurrence** model produces $vb$ booleans. For typical $(v, b, r, k, \\lambda)$ where $r < b$, explicit is more compact in variable count, but the per-block "exactly $k$" constraint becomes awkward (must count across object-rows via \`exists\`).

### Symmetries to break

1. **Object symmetry** — objects are interchangeable. Add lex-ordering on rows of $X$ (occurrence) or on the rows of $Y$ (explicit).
2. **Block symmetry** — blocks are interchangeable too. Add lex-ordering on columns of $X$ (occurrence). For explicit: the per-object lex on $Y[i, \\cdot]$ already orders each object's block list, but doesn't break the inter-object block symmetry — that requires a separate constraint relating across $Y$'s rows (harder).

### What you notice

In the **occurrence** model, lex-ordering columns ($X$'s blocks) and rows ($X$'s objects) gives DoubleLex — a clean, well-known pattern.

In the **explicit** model, the per-object lex-ordering on $Y[i, \\cdot]$ orders the $r$ blocks for each object internally — but this DOES NOT correspond to the same ordering as the occurrence model's column lex. The two lex constraints **break different symmetries** at different granularities:
- Occurrence column lex: orders ALL blocks consistently across all objects (global).
- Explicit per-row lex: orders each object's own block list (local, per-object).

The explicit model's per-row lex breaks LESS symmetry than the occurrence model's DoubleLex — there are residual symmetries that occurrence-DoubleLex catches.` },
            { kind: 'callout', variant: 'whatif', title: 'What if you swap "object" and "block" roles?', body: `You get the dual model: for each **block**, encode the set of objects in it explicitly (a vector of $k$ object IDs per block). This is a third viewpoint, and channeling between it and either of the above is a possible strong combination.` },
          ],
        },
        {
          id: 'meb-worked',
          title: 'Worked: Minimum Energy Broadcast (tree modelling)',
          blocks: [
            { kind: 'md', body: `**Minimum Energy Broadcast (MEB)** — find a tree such that a message broadcast from a root node reaches every leaf with minimum total cost.

Input: $n$ nodes, root $r$, transmission cost $c(i, j)$ from node $i$ to node $j$.

Output: a directed tree rooted at $r$, spanning all $n$ nodes, minimising the sum of *per-transmitter* costs.

### Modelling the tree

A **rooted tree** on $n$ nodes is equivalent to a **function** $\\text{parent} : \\{2, \\ldots, n\\} \\to \\{1, \\ldots, n\\}$ (every non-root node has exactly one parent). This is the **function modelling pattern** — encoded in Essence Prime as a matrix indexed by the non-root nodes, with values in the node set:

\`\`\`
given n : int(1..)
given root : int(1..n)
given cost : matrix indexed by [int(1..n), int(1..n)] of int(0..)

find parent : matrix indexed by [int(1..n)] of int(0..n)
\`\`\`

We use \`int(0..n)\` and set \`parent[root] = 0\` as a sentinel (root has no parent). All non-root nodes have a parent in $\\{1..n\\}$.

### Constraints (ignoring acyclicity for now)

\`\`\`
parent[root] = 0,
forAll i : int(1..n) . i != root -> parent[i] != 0,
forAll i : int(1..n) . i != root -> parent[i] != i      $ no self-loop
\`\`\`

### Adding acyclicity

The challenge: ensure the parent function forms a **tree**, not a forest with cycles. Approaches:

1. **Depth encoding.** Add \`depth : matrix indexed by [int(1..n)] of int(0..n-1)\` with \`depth[root] = 0\` and \`forAll i : i != root -> depth[i] = depth[parent[i]] + 1\`. This ALONE forbids cycles (depth would be unbounded) and forces connectivity to root.

2. **Reachability encoding.** Add boolean matrix \`reach\` and enforce $r$ reaches every node via parent chain — heavier propagation, more variables.

3. **Order encoding.** Number nodes so that every parent has a smaller number than its child (DAG order). Forces tree structure.

### Cost objective

Each node $i$ transmits to its set of children — paying $\\max_{c \\text{ child of } i} \\text{cost}(i, c)$ (one transmission reaches all children within radius). Total cost = sum over transmitting nodes.

\`\`\`
$ for each potential transmitter i, find the max cost to any of its children
find maxOut : matrix indexed by [int(1..n)] of int(0..maxCost)

such that
  forAll i, c : int(1..n) . parent[c] = i -> maxOut[i] >= cost[i, c],
  forAll i, c : int(1..n) . parent[c] != i -> $ no constraint on maxOut[i] from c

minimising sum( maxOut )
\`\`\`

### Modelling pattern summary

- **Tree** = **function** $\\{$non-root$\\} \\to \\{$all nodes$\\}$ (parent pointers).
- Acyclicity needs an auxiliary depth/order encoding.
- Connectivity to root falls out for free given depth + parent.` },
            { kind: 'callout', variant: 'nightingale', title: 'Key modelling insight', body: `When the problem says "find a tree", the **function-as-array** pattern (parent pointers) is the canonical Essence Prime encoding. Acyclicity requires an auxiliary depth or order variable — it's not automatic.` },
          ],
        },
        {
          id: 'modelling-wizard',
          title: '🧭 Interactive: CSP Modelling Wizard',
          blocks: [
            { kind: 'md', body: `The wizard walks you through the 7-step methodology for **any** word problem. Each step is editable and the model auto-builds into a CSPLab-ready spec plus an exam-paper-style answer.` },
            { kind: 'viz', viz: 'ModellingWizard', title: 'Build a CSP from scratch, step-by-step', props: {} },
          ],
        },
        {
          id: 'types',
          title: 'Abstract decision-variable types',
          blocks: [
            { kind: 'md', body: `When *modelling* in a high-level language (Essence), you can declare decision variables of these abstract types:

| Type | Definition | Example use |
|---|---|---|
| **Set** of $T$ | unordered, no duplicates | "find a set of 3 students" |
| **Multiset (mset)** of $T$ | unordered, duplicates allowed | "find a multiset of bills summing to £100" |
| **Sequence** of $T$ | ordered, duplicates | "find a sequence of moves" |
| **Relation** of $(D_1 \\times \\cdots \\times D_k)$ | set of tuples | "who knows whom" |
| **Function** $D_1 \\to D_2$ | each element of $D_1$ maps to one of $D_2$ | "assign each worker a task" |
| **Partition** from $D$ | disjoint non-empty subsets covering $D$ | "split golfers into groups" |

Function annotations: \`total\` / \`partial\`, \`injective\` (1-1), \`surjective\` (onto), \`bijective\` (= total + injective + surjective when $|D_1| = |D_2|$).

Partition annotations: \`regular\` (all parts equal size), \`numParts k\` (exactly $k$ parts), \`partSize s\` (each part of size $s$).

These types **live in full Essence, not in Essence'**. Essence Prime only has \`int\`, \`bool\`, \`matrix\`. See [Essence Prime](#topic/essence-prime).` },
            { kind: 'callout', variant: 'nightingale', title: 'Likely exam target', body: 'Knowing which abstract types belong to Essence vs Essence Prime is a classic Nightingale-style distinction. Essence Prime = matrix-only.' },
          ],
        },
        {
          id: 'viewpoints',
          title: 'Viewpoints',
          blocks: [
            { kind: 'md', body: `Smith (HCP Ch. 11) defines:

> A **viewpoint** is a selection of variables with associated domains sufficient to characterise the solutions to the problem.

For one problem there are typically **several valid viewpoints**, each with different variables, domains and natural constraints.

**Classic example: n-queens.**

| Viewpoint | Variables | Domain |
|---|---|---|
| Row viewpoint | $x_1, \\ldots, x_n$ = column of queen in row $i$ | $\\{1..n\\}$ |
| Column viewpoint (dual) | $y_1, \\ldots, y_n$ = row of queen in column $j$ | $\\{1..n\\}$ |
| Boolean / cell | $b_{i,j} \\in \\{0,1\\}$ per cell | $\\{0,1\\}$ |

The row viewpoint **builds in** one-queen-per-row by construction — that constraint disappears entirely. The cell viewpoint must add sum-of-row $= 1$ constraints.

Each viewpoint has different:
- Branching factor (8 vs 8 vs 64 variables)
- Constraint expression (succinct vs verbose)
- Propagation strength
- Compatibility with global constraints (cell viewpoint can use \`sum\`; row viewpoint can use \`allDiff\`)` },
            { kind: 'callout', variant: 'keyfact', title: 'No single best viewpoint', body: 'Trade-off: more variables (cell) = more flexibility for constraints, but more search. Fewer variables (row) = compact search but you can only express what the smaller variable set supports.' },
          ],
        },
        {
          id: 'channeling',
          title: 'Channeling constraints',
          blocks: [
            { kind: 'md', body: `Once you have two viewpoints, you can **combine** them — keeping both sets of variables — to exploit propagation in both.

**Channeling constraints** logically link the viewpoints. For a *permutation problem*, the classic channeling between primal $x_i = j$ and dual $d_j = i$ is:

$$x_i = j \\iff d_j = i$$

For n-queens with row and column viewpoints:

\`\`\`
forAll i, j : int(1..n) . (x[i] = j) <-> (y[j] = i)
\`\`\`

**Why combine?** Each viewpoint propagates differently. The combined model gets the union of both — sometimes far stronger than either alone. (Smith / Walsh's permutation-problem channeling result.)

**Cost:** more variables, more constraints. Worth it when the combined propagation prunes substantially more.` },
          ],
        },
        {
          id: 'implied',
          title: 'Implied (redundant) constraints',
          blocks: [
            { kind: 'md', body: `> "Implied constraints are constraints that are implied by the constraints defining the problem. They do not change the set of solutions and hence are logically redundant. The aim in adding them is to reduce the search effort." — Smith (A4CP 2008)

**Two canonical examples:**

**1. Magic square.** In an order-$N$ magic square, each row, column and diagonal sums to $\\mu = N(N^2+1)/2$. Since each cell appears in exactly one row, the sum of all row-sums equals the **total of all cells** = $N \\cdot \\mu$. Adding this **single global sum** constraint is logically implied but lets the solver propagate bounds on any cell from the others.

**2. Social golfers.** The primary constraint is "no pair plays in the same group more than once". Implied constraints:
- "In each week, each golfer is in exactly one group" — true by definition of partition, but stating it as a \`gcc\` makes propagation much stronger.
- Counting bound: total pair-coincidences $= w \\cdot g \\cdot \\binom{s}{2}$, which must be $\\le \\binom{g \\cdot s}{2}$ for feasibility.

**General principle:** if you can derive an arithmetic identity that the model satisfies but doesn't say explicitly, posting it explicitly often *prunes* dramatically because solver propagation works locally and can't always derive global identities.` },
            { kind: 'callout', variant: 'whatif', title: 'You add a logically wrong "implied" constraint', body: 'You break the model: solutions are lost. "Implied" means logically entailed by the existing constraints — verify before posting.' },
          ],
        },
        {
          id: 'symmetry',
          title: 'Symmetry & symmetry breaking',
          blocks: [
            { kind: 'md', body: `**Variable symmetry** — a permutation of variables that maps every solution to a solution. Example: matrix model where rows are interchangeable.

**Value symmetry** — a permutation of values that maps every solution to a solution. Example: graph colouring — colour names $\\{1, 2, 3\\}$ are interchangeable.

**The problem:** the solver re-explores symmetric copies of dead ends. If a partial assignment fails, every symmetric image fails too — re-discovering this wastes time.

**Three families of symmetry-breaking techniques:**

1. **Static / a-priori — Lex-leader constraints.** For a symmetry group $G$, add $\\forall \\sigma \\in G . X \\le_{\\text{lex}} \\sigma(X)$ to force only the lexicographically least canonical solution. For matrix models with row & column symmetry, **DoubleLex** constraint (rows lex-ordered, columns lex-ordered).
2. **Value precedence** (Law & Lee, Walsh). For indistinguishable values $1..m$: first occurrence of value $i$ precedes first occurrence of value $i+1$. In Essence Prime: \`precedence(X, [1,2,…])\`.
3. **Dynamic** — during search, remember nogoods or use SBDD/SBDS. Doesn't conflict with branching heuristics (a downside of static methods) but prunes less.

**Savile Row \`-S2\`** runs an automorphism solver (Saucy/nauty) on the model graph and posts lex-leader constraints automatically.` },
            { kind: 'callout', variant: 'pitfall', title: 'Static symmetry breaking + search heuristic = conflict', body: 'Lex-leader forces the lex-least solution. If your branching heuristic prefers values in a different order, the two fight each other. Dynamic methods avoid this.' },
          ],
        },
        {
          id: 'nesting',
          title: 'Nesting (Essence only)',
          blocks: [
            { kind: 'md', body: `Full Essence allows arbitrary nesting of abstract types:

- \`set of partition from D\` — used in Social Golfers (a set of partitions of golfers, one per week)
- \`function (X -> set of Y)\` — each element of X gets a *set* of Y values
- \`partition from (set of D)\` — partition of subsets

**Why this matters:** the modelling expressivity of full Essence sits on this nesting. The price is that Conjure must choose a concrete representation for each layer.

Essence Prime has **no nesting** — every variable is a matrix of int or bool.` },
          ],
        },
      ],
      flashcards: [
        { id: 'm1', q: 'Which abstract decision-variable types exist in Essence but NOT Essence Prime?', a: 'set, mset (multiset), sequence, relation, function, partition. Essence Prime has only int, bool, matrix.' },
        { id: 'm2', q: 'Define a viewpoint.', a: 'A selection of variables with associated domains sufficient to characterise solutions. One problem has many possible viewpoints.' },
        { id: 'm3', q: 'Permutation problem channeling — write the constraint.', a: 'x[i] = j ↔ d[j] = i for all i,j.' },
        { id: 'm4', q: 'Define an implied constraint.', a: 'A constraint logically entailed by the existing model — doesn\'t change solutions, but added to speed up propagation.' },
        { id: 'm5', q: 'Two examples of implied constraints in classical models?', a: 'Magic square: total-sum = N·μ. Social golfers: each golfer in exactly one group per week (stated as gcc).' },
        { id: 'm6', q: 'Variable vs value symmetry?', a: 'Variable symmetry: a permutation of variables maps solutions to solutions (e.g. interchangeable rows). Value symmetry: a permutation of values does (e.g. interchangeable colour names).' },
        { id: 'm7', q: 'Lex-leader constraint, in words?', a: 'For each symmetry σ in the group, require X ≤_lex σ(X). Forces the search to find only the lex-least representative in each symmetry orbit.' },
        { id: 'm8', q: 'Downside of static symmetry breaking?', a: 'It can conflict with the branching heuristic — both try to impose orderings on the search.' },
        { id: 'm9', q: 'Seven-step modelling methodology?', a: '1. Identify decisions → variables. 2. Choose smallest domains. 3. List constraints by source (rules, capacity, mutex, precedence, coverage, quotas). 4. Pick arity (global > binary). 5. Add implied constraints. 6. Break symmetries. 7. Sanity-check both directions.' },
        { id: 'm10', q: 'How do you encode a "subset of size k from D" in a CSP?', a: 'k variables with domain D + AllDifferent + lex-ordering (strict <) to break the k! permutation symmetry. Alternative: boolean indicator vector indexed by D with sum = k.' },
        { id: 'm11', q: 'When is a parameter not a variable?', a: 'When its value is given as input (problem data, e.g. durations, capacities, weights). Only model what the modeller CHOOSES — decisions, not inputs.' },
        { id: 'm12', q: 'Why is global AllDifferent strictly stronger than pairwise ≠?', a: "Pairwise only sees one pair at a time and misses pigeonhole infeasibility (n vars in <n values). Régin's GAC for AllDifferent detects it via Hall's theorem on the variable-value bipartite graph." },
        { id: 'm13', q: 'Bin packing — how to break the bin permutation symmetry?', a: 'Value precedence: b₁ = 1 and bᵢ ≤ max(b₁,…,bᵢ₋₁) + 1. Forces bins to be "used" in order: the first item to use a new bin must use the lowest unused id.' },
        { id: 'm14', q: 'Job-shop scheduling — what is the makespan-bound implied constraint?', a: 'Total job duration must fit within deadline: sⱼ,₁ + Σ dⱼ,ₖ ≤ T for each job j. Lets the solver tighten the first-op start time from above immediately.' },
        { id: 'm15', q: 'For a permutation problem, what does channelling do?', a: 'Links primal (x_i = value at position i) and dual (d_j = position of value j) variables via x_i = j ⇔ d_j = i. Propagation flows both ways — together strictly stronger than either alone.' },
        { id: 'm16', q: 'What does "Step 7: sanity check" verify?', a: 'Two directions: (a) every original solution satisfies every posted constraint (no over-constraint), and (b) every assignment satisfying all constraints is a valid solution (no under-constraint).' },
        { id: 'm17', q: 'When should you NOT decompose a global constraint?', a: "Always, when a specialised propagator exists (AllDifferent → Régin's GAC, Sum → bounds consistency, gcc, element, cumulative). Decomposition loses propagation strength irreversibly." },
      ],
      examples: [
        {
          id: 'mex1', difficulty: 'intermediate', marks: 8,
          question: 'For n-queens, compare three viewpoints: (a) row → column matrix, (b) column → row matrix, (c) Boolean cell matrix. Discuss variable count, natural constraint expression, and which viewpoint(s) the dual encoding combines.',
          answer: `**(a) Row viewpoint.** Variables $x_1, \\ldots, x_n$ where $x_i \\in \\{1..n\\}$ is the column of the queen in row $i$.
- **Variable count:** $n$.
- **"One queen per row"** is built in by construction.
- **Constraints:** AllDifferent (different columns), plus two AllDifferent-on-transformed for diagonals: $\\text{AllDifferent}([x_i + i])$ and $\\text{AllDifferent}([x_i - i])$.

**(b) Column viewpoint (dual).** Variables $y_1, \\ldots, y_n$ where $y_j$ is the row of the queen in column $j$.
- **Variable count:** $n$.
- **"One queen per column"** is built in.
- **Constraints:** symmetric to (a) but with rows/columns swapped.

**(c) Boolean cell viewpoint.** Variables $b_{i,j} \\in \\{0, 1\\}$ per cell.
- **Variable count:** $n^2$.
- **Constraints:**
  - Row: $\\sum_j b_{i,j} = 1$ for each $i$.
  - Column: $\\sum_i b_{i,j} = 1$ for each $j$.
  - Diagonal: $\\sum_{(i,j) \\in \\text{diag}} b_{i,j} \\le 1$ for each diagonal.

**Combined (dual encoding):** keep both row $x_i$ and column $y_j$ variables, linked by channeling:

$$\\forall i, j : x_i = j \\Leftrightarrow y_j = i$$

**Why combine?** Pruning in either viewpoint triggers pruning in the other via channeling. For some problems (large $n$ with hard instances), the combined model achieves much stronger propagation than either alone.

**Practical:** for small $n$ (≤ 50), the row viewpoint alone is usually fastest. For larger or harder instances, dual encoding (or pure local search) wins.`,
        },
        {
          id: 'mex2', difficulty: 'advanced', marks: 10,
          question: 'For the magic square problem (order $n$), state the *implied* constraint that improves propagation. Justify why posting it explicitly is helpful even though it\'s logically redundant.',
          answer: `**Setup.** Magic square of order $n$: $n \\times n$ matrix of variables $M_{i,j}$ with domain $\\{1..n^2\\}$, all different, with row, column and diagonal sums all equal to the **magic constant**:

$$\\mu = \\frac{n(n^2+1)}{2}$$

**Implied constraint.** The total sum of all cells:

$$\\sum_{i,j} M_{i,j} = 1 + 2 + \\cdots + n^2 = \\frac{n^2(n^2+1)}{2} = n \\mu$$

This is **logically implied** because:
1. Each cell appears in exactly one row.
2. Therefore $\\sum_{i,j} M_{i,j} = \\sum_i (\\text{row } i \\text{ sum}) = \\sum_i \\mu = n\\mu$.

So the total-sum constraint follows from "all values in $\\{1..n^2\\}$, distinct" combined with the row constraints. No new solutions are added or removed.

**Why post it anyway:**

1. **Stronger propagation.** Constraint propagators are local — they look at one constraint at a time. A solver checking row sums one by one doesn't see that the total must equal $n\\mu$. Posting it explicitly gives the propagator direct access.
2. **Earlier detection of infeasibility.** If a partial assignment has values summing too high/low to fit within the remaining cells' value-sum, the implied total-sum constraint catches the infeasibility immediately. The row/col constraints alone may not — they only see local sums.
3. **Bounds tightening.** From the implied constraint, you can derive bounds on individual cells: e.g. $M_{i,j} \\ge n\\mu - \\text{(max possible from other cells)}$.

**General lesson.** Implied constraints sit at the boundary of *redundant* (logically) and *active* (computationally). Adding them is one of the cheapest ways to make a model run faster without changing solutions.`,
        },
        {
          id: 'mex3', difficulty: 'intermediate', marks: 6,
          question: 'For graph $k$-colouring, the colour labels $\\{1, 2, \\ldots, k\\}$ are interchangeable. Explain two symmetry-breaking techniques to eliminate the resulting redundancy.',
          answer: `**Symmetry.** Any solution with colours $(1, 2, 3)$ on three vertices remains a solution under any permutation of $\\{1, 2, 3\\}$. With $k$ colours, every solution has $k!$ equivalent siblings.

**Technique 1 — Lex-leader.** Fix a canonical variable order (e.g. vertices in input order) and add a constraint forcing **the first occurrence of each colour to be in order**. Equivalently, for symmetry $\\sigma$ in the colour-permutation group: $\\text{colour-vector} \\le_\\text{lex} \\sigma(\\text{colour-vector})$.

In Essence Prime:
\`\`\`
$ for k colours, add k-1 precedence constraints
$ first occurrence of colour i must precede first of i+1
\`\`\`

Effect: among the $k!$ symmetric solutions, only one (the lex-least) is found. Reduces search by factor $k!$.

**Technique 2 — Value precedence (Law & Lee, 2004).** For each pair $(i, i+1)$ in the colour ordering: the first occurrence of value $i$ must precede the first occurrence of value $i+1$ in the variable sequence.

In Essence Prime (if supported as a global): \`precedence(colours, [1,2,3,...,k])\`.

Effect: same as lex-leader but expressed as a global constraint with a specialised propagator — usually faster to enforce.

**Comparison.**
- Both eliminate the $k!$ colour-renaming symmetry.
- Value precedence interacts better with branching heuristics that pick lowest available value first.
- Lex-leader generalises to *any* symmetry group, not just value permutations.

**For graph colouring specifically:** value precedence is the standard choice. For richer symmetries (e.g. matrix problems with row + column interchanges), lex-leader or DoubleLex.`,
        },
        {
          id: 'mex4', difficulty: 'advanced', marks: 8,
          question: 'Explain "channeling constraints" for the *dual* viewpoint of a permutation problem. Why do they often *improve* propagation strength?',
          answer: `**Setup.** A permutation problem has $n$ variables $x_1, \\ldots, x_n$ each with domain $\\{1, \\ldots, n\\}$, with AllDifferent$(x_1, \\ldots, x_n)$.

**Primal viewpoint.** $x_i = j$ means "the $i$th element maps to position $j$".

**Dual viewpoint.** $d_j = i$ means "position $j$ has element $i$ assigned to it".

**Channeling.** Keep both sets of variables. Link them:

$$\\forall i, j : x_i = j \\iff d_j = i$$

In Essence Prime:
\`\`\`
forAll i, j : int(1..n) . (x[i] = j) <-> (d[j] = i)
\`\`\`

**Why propagation improves.** Constraints in CSP solvers propagate **locally**. With only the primal viewpoint, a deduction from $x_i$'s constraints stays in $x_i$'s neighbourhood. But many natural constraints are easier to express in one viewpoint than another:

- **Primal-natural:** "$x_3 < 5$" (positions $x_3$ takes are restricted).
- **Dual-natural:** "position 7 isn't used by element 3" — i.e. $d_7 \\ne 3$.

By including both, you can post each constraint in its most natural form *and* propagation crosses between viewpoints via the channeling.

**Stronger pruning example.** Consider a permutation problem where you've propagated $x_1 \\in \\{2, 5\\}$ and $x_2 \\in \\{2, 5\\}$. AllDifferent doesn't prune anything yet. But in the dual, channeling forces $d_2 \\in \\{1, 2\\}$ and $d_5 \\in \\{1, 2\\}$. AllDifferent on the duals (it's a permutation, so duals also satisfy AllDifferent) propagates: $d_3 \\ne 1, 2$ and $d_4 \\ne 1, 2$, etc. — back to primal: $x_3, x_4 \\ne 2, 5$.

**Cost.** Doubled variable count + the channeling constraints. Worth it for hard instances where pruning gains beat the per-step overhead.`,
        },
        {
          id: 'mex5-jobshop', difficulty: 'advanced', marks: 12,
          question: `**Job-shop scheduling.** $n$ jobs, each consisting of an ordered sequence of $m$ operations. Each operation needs a specific machine and takes a fixed duration. A machine can only process one operation at a time. All jobs must finish by makespan $T$.

(i) [6 marks] Formulate as a CSP: variables, domains, constraints.
(ii) [3 marks] Identify and add **two implied constraints** that strengthen propagation.
(iii) [3 marks] Identify a symmetry and explain how to break it.`,
          answer: `## (i) CSP formulation — 6 marks

**Variables.** $s_{j,k}$ = start time of operation $k$ of job $j$, for each $j \\in \\{1..n\\}$, $k \\in \\{1..m\\}$.

**Domains.** $s_{j,k} \\in \\{0..T - d_{j,k}\\}$ where $d_{j,k}$ is the (parametric) duration.

**Constraints.**
1. **Job precedence** (within each job, operations are ordered):
   $$s_{j,k+1} \\ge s_{j,k} + d_{j,k} \\quad \\forall j, k = 1..m-1$$
2. **Machine non-overlap** (operations on the same machine cannot overlap). Using the standard formulation:
   $$\\forall (j_1, k_1), (j_2, k_2) \\text{ on same machine}: \\quad s_{j_1,k_1} + d_{j_1,k_1} \\le s_{j_2,k_2} \\;\\lor\\; s_{j_2,k_2} + d_{j_2,k_2} \\le s_{j_1,k_1}$$
   In Essence Prime, prefer the global \`cumulative\` constraint per machine for stronger propagation.
3. **Makespan**: $s_{j,m} + d_{j,m} \\le T$ for each job $j$.

## (ii) Implied constraints — 3 marks

**Implied 1: Job makespan lower bound.** $s_{j,1} + \\sum_{k=1}^{m} d_{j,k} \\le T$. Total job duration must fit within $T - s_{j,1}$. Immediately tightens $s_{j,1}$ from above.

**Implied 2: Machine load bound.** For each machine, $\\sum_{(j,k) \\text{ on machine}} d_{j,k} \\le T$. If total operations on machine $\\mu$ exceed $T$, infeasibility is detected without search. (And gives a sharper lower bound on $T$.)

## (iii) Symmetry — 3 marks

If two jobs $j_1, j_2$ have **identical operation sequences** (same machines, same durations in same order), they are interchangeable. Any solution with start times $(s_{j_1, \\cdot}, s_{j_2, \\cdot})$ has a partner with start times swapped.

**Break the symmetry** by adding a lex-ordering constraint between the two job's start-time vectors:
$$[s_{j_1,1}, s_{j_1,2}, \\ldots, s_{j_1,m}] \\le_{\\text{lex}} [s_{j_2,1}, s_{j_2,2}, \\ldots, s_{j_2,m}]$$

Reduces search by factor 2 for each identical-job pair. In Essence Prime: \`row_j1 <=lex row_j2\`.`,
          tags: ['scheduling', 'cumulative', 'precedence', 'symmetry'],
        },
        {
          id: 'mex6-knapsack', difficulty: 'intermediate', marks: 8,
          question: `**Knapsack.** $n$ items with weights $w_1..w_n$ and values $v_1..v_n$. Choose a subset with total weight $\\le W$ maximising total value. Formulate as a CSP/COP. Discuss two viewpoints and how they differ in propagation.`,
          answer: `## CSP/COP formulation

**Viewpoint A — Boolean inclusion vector.**
- **Variables.** $x_i \\in \\{0, 1\\}$ for each item.
- **Constraint.** $\\sum_i w_i x_i \\le W$.
- **Objective.** $\\text{maximise } \\sum_i v_i x_i$.

**Viewpoint B — Subset-as-array.**
- **Variables.** $y_1, \\ldots, y_k \\in \\{1..n\\}$ for some unknown $k$, plus $k$ itself.
- **Symmetry-breaking.** $y_i < y_{i+1}$ (strict order; also implies AllDifferent).
- **Constraint.** $\\sum_i w_{y_i} \\le W$.
- **Objective.** $\\text{maximise } \\sum_i v_{y_i}$.

## Comparison

| Aspect | Viewpoint A (Boolean) | Viewpoint B (Subset array) |
|---|---|---|
| Variable count | $n$ | $\\le n + 1$ ($y$'s + length) |
| Sum constraint | Direct, simple | Indirect via \`element\` |
| Propagation | Strong via sum bounds — knapsack-style propagator can prune $x_i$ once $\\sum w$ is tight | Weaker — value of $y_i$ doesn't directly bound weight |
| Branching | One binary decision per item | Pick item, then next item, etc |

**A is the standard choice** — directly maps to ILP, gets strong sum-propagation, and Boolean variables work well with SAT-based encodings.

## Implied constraint
**Upper bound on number of items:** $|\\{i : x_i = 1\\}| \\le \\lfloor W / \\min_j w_j \\rfloor$. Tightens $\\sum x_i$ from above.

## Symmetry
None inherent — items have distinct $(w_i, v_i)$. If two items are identical (same $w$ and $v$), pick them as a pair (lex-order them).`,
          tags: ['knapsack', 'COP', 'viewpoints', 'sum constraint'],
        },
        {
          id: 'mex7-latin', difficulty: 'intermediate', marks: 9,
          question: `**Latin square.** An $n \\times n$ grid filled with values from $\\{1, \\ldots, n\\}$ such that each row and each column contains every value exactly once.

(i) [3 marks] Give a CSP formulation with one variable per cell.
(ii) [3 marks] Identify the natural global constraint and explain why it propagates more strongly than the binary decomposition.
(iii) [3 marks] Latin squares have many symmetries — list three and indicate which are easiest to break.`,
          answer: `## (i) CSP — 3 marks

**Variables.** $X_{i,j} \\in \\{1..n\\}$ for each cell $(i, j) \\in [n] \\times [n]$.

**Constraints.**
- Each row: $\\text{AllDifferent}(X_{i,1}, X_{i,2}, \\ldots, X_{i,n})$ for each $i$.
- Each column: $\\text{AllDifferent}(X_{1,j}, X_{2,j}, \\ldots, X_{n,j})$ for each $j$.

## (ii) Global constraint — 3 marks

**AllDifferent** with Régin's GAC algorithm enforces the **Hall condition**: every subset $S$ of variables must have $|D(S)| \\ge |S|$.

Decomposing into $\\binom{n}{2}$ pairwise $\\ne$ constraints only catches local violations — a value-pair conflict. It **cannot detect** that, say, 3 variables have only 2 values between them (a pigeonhole violation that GAC catches instantly).

Empirically: for $n = 30$ Latin squares, GAC prunes ~50× more search nodes than pairwise.

## (iii) Symmetries — 3 marks

1. **Row permutations** ($n!$): swapping any two rows gives a Latin square.
2. **Column permutations** ($n!$): swapping any two columns gives a Latin square.
3. **Value permutations** ($n!$): relabelling values gives a Latin square.
4. **Transpose** (group of order 2): the transpose of a Latin square is a Latin square.

Total symmetry group size: $(n!)^3 \\cdot 2$ (the "isotopy-with-transpose" group).

**Easiest to break:**
- **Value precedence** on the first row: $X_{1,1} < X_{1,2} < \\ldots < X_{1,n}$ — instantly fixes the first row to the identity $(1, 2, \\ldots, n)$. Breaks all $n!$ value symmetries AND a row symmetry by anchoring "row 1".
- **Lex-order rows**: $X_{1,\\cdot} \\le_{\\text{lex}} X_{2,\\cdot} \\le_{\\text{lex}} \\cdots$ — breaks row permutations.
- **Lex-order columns** similarly.

Combined (value precedence on row 1 + lex on rows + lex on columns) is the standard DoubleLex+ValuePrecedence pattern, very effective on Latin squares.`,
          tags: ['latin square', 'AllDifferent', 'symmetry'],
        },
        {
          id: 'mex8-graph-coloring', difficulty: 'basic', marks: 6,
          question: `Formulate the **graph $k$-colouring** problem as a CSP. Given a graph $G = (V, E)$, assign one of $k$ colours to each vertex such that adjacent vertices have different colours.

(i) [3 marks] State variables, domains and constraints.
(ii) [3 marks] If $k = $ chromatic number, what symmetry exists and how do you break it?`,
          answer: `## (i) CSP — 3 marks

**Variables.** $C_v \\in \\{1, \\ldots, k\\}$ for each $v \\in V$.

**Constraints.** $C_u \\ne C_v$ for each edge $\\{u, v\\} \\in E$.

(That's it — no AllDifferent here unless the graph is the complete graph $K_n$, in which case $\\text{AllDifferent}(C_1, \\ldots, C_n)$ replaces all pairwise constraints and gives stronger propagation.)

## (ii) Symmetry — 3 marks

**Colour-permutation symmetry:** the $k$ colour labels are interchangeable. Every solution has $k!$ equivalent siblings obtained by permuting the colour labels.

**Break it** with **value precedence**: the first vertex (in some fixed order, e.g. by index) takes colour 1; if any vertex takes colour 2, some earlier vertex must already use colour 1; etc.

In Essence Prime: \`precedence(C, [1, 2, 3, ..., k])\`.

Effect: search space shrinks by $k!$ at no cost to solution count — among the $k!$ equivalent colourings, exactly one (the canonical one) is returned.`,
          tags: ['graph colouring', 'value precedence', 'symmetry'],
        },
        {
          id: 'mex9-warehouse', difficulty: 'advanced', marks: 14,
          question: `**Warehouse-shop allocation.** $w$ warehouses each with capacity $\\text{cap}_j$. $s$ shops, each with demand $d_i$, must each be supplied by exactly one warehouse (no splitting).

(i) [3 marks] Identify the modelling pattern.
(ii) [4 marks] Give two distinct viewpoints with their variables/domains.
(iii) [4 marks] State the constraints for both viewpoints, including capacity.
(iv) [3 marks] Channel between them; explain why the channel improves propagation.`,
          answer: `## (i) Pattern — 3 marks

The shop → warehouse mapping is a **total function** $f : \\text{Shops} \\to \\text{Warehouses}$:
- Total because every shop must be supplied.
- Functional because each shop has exactly one supplier.
- Not injective in general — multiple shops can share a warehouse (and $w$ might be < $s$).

## (ii) Viewpoints — 4 marks

**Viewpoint A — Shop-indexed (function-as-array).**
- $\\text{supplier}_i \\in \\{1..w\\}$ for each shop $i$.

**Viewpoint B — Warehouse-indexed (assignment matrix).**
- $A_{i,j} \\in \\{0, 1\\}$, with $A_{i,j} = 1$ iff shop $i$ is supplied by warehouse $j$.

## (iii) Constraints — 4 marks

**Viewpoint A constraints.**
- Capacity per warehouse: $\\sum_{i : \\text{supplier}_i = j} d_i \\le \\text{cap}_j$ for each $j$.
- Implicit "exactly one supplier" — built into the variable.

**Viewpoint B constraints.**
- Exactly one supplier per shop: $\\sum_j A_{i,j} = 1$ for each $i$.
- Capacity: $\\sum_i A_{i,j} \\cdot d_i \\le \\text{cap}_j$ for each $j$.

Viewpoint A is more compact. Viewpoint B exposes Boolean indicator variables that may help downstream propagators (e.g. linking with binary inclusion in larger models).

## (iv) Channelling — 3 marks

$$\\text{supplier}_i = j \\;\\;\\Longleftrightarrow\\;\\; A_{i,j} = 1$$

(Equivalently: for each $j$, $A_{i,j} = 1$ if $\\text{supplier}_i = j$, else $A_{i,j} = 0$.)

**Why it helps:**
1. The capacity constraint is more naturally expressed in B (linear sum); the variable model is more compact in A. Channeling lets us post each in its preferred form.
2. Propagation flows both ways: pruning $A_{i,j} = 0$ removes $j$ from $D(\\text{supplier}_i)$; pruning $\\text{supplier}_i \\ne j$ forces $A_{i,j} = 0$.
3. The capacity sum constraint in B propagates bounds-consistency on the warehouse counts, which can then prune the function domain in A.`,
          tags: ['allocation', 'function', 'channelling', 'capacity'],
        },
        {
          id: 'mex10-stable-marriage', difficulty: 'advanced', marks: 10,
          question: `**Stable marriage.** $n$ men and $n$ women each rank the other group in a strict preference list. Find a matching such that no unmatched man-woman pair both prefer each other to their current partner.

Formulate as a CSP: variables, domains, the stability constraint. Discuss why this is naturally a *constraint* problem rather than purely a *search* problem.`,
          answer: `## CSP formulation

**Variables.** $\\text{wife}_m \\in \\{1..n\\}$ for each man $m \\in \\{1..n\\}$ — the index of the woman matched to man $m$.

**Domains.** $\\text{wife}_m \\in \\{1..n\\}$.

**Constraints.**
1. **Matching is a permutation:** $\\text{AllDifferent}(\\text{wife}_1, \\ldots, \\text{wife}_n)$.
2. **Stability** (no blocking pair): for every man $m$ and every woman $w$, IF $m$ prefers $w$ over his current wife (i.e. $\\text{rank}_m(w) < \\text{rank}_m(\\text{wife}_m)$) THEN $w$ prefers her current husband over $m$ (where husband = $\\text{wife}^{-1}(w)$).

   In propositional form: $\\text{rank}_m(w) < \\text{rank}_m(\\text{wife}_m) \\Rightarrow \\text{rank}_w(\\text{husband}(w)) < \\text{rank}_w(m)$ for every $(m, w)$ pair.

## Why constraint, not search

1. **Globally-defined feasibility.** Stability is a property of the *entire* matching — you can't check it incrementally without considering all pairs.
2. **Many feasible solutions in general** — Gale-Shapley gives the man-optimal (or woman-optimal) one in polynomial time, but ALL stable matchings form a lattice and can be enumerated via constraint propagation.
3. **Soft / weighted variants** become COPs naturally — minimise total dissatisfaction, etc. The CSP frame extends to these.
4. **Side constraints.** Real problems often have additional constraints (couples want to be near each other; some matches are forbidden) that destroy Gale-Shapley's algorithmic structure but fit naturally in a CSP solver.

The CSP view scales to richer variants where Gale-Shapley breaks down.`,
          tags: ['matching', 'AllDifferent', 'stability'],
        },
        {
          id: 'mex11-sudoku', difficulty: 'basic', marks: 5,
          question: `Formulate Sudoku as a CSP. Variables, domains, constraints, and one implied constraint that helps propagation.`,
          answer: `## CSP

**Variables.** $X_{i,j} \\in \\{1, \\ldots, 9\\}$ for each cell $(i, j) \\in [9] \\times [9]$. Pre-filled cells have singleton domains.

**Constraints.**
- Row: $\\text{AllDifferent}(X_{i,1}, X_{i,2}, \\ldots, X_{i,9})$ for each $i$.
- Column: $\\text{AllDifferent}(X_{1,j}, X_{2,j}, \\ldots, X_{9,j})$ for each $j$.
- Box: $\\text{AllDifferent}(\\{X_{i,j} : (i-1) \\div 3 = b_r, (j-1) \\div 3 = b_c\\})$ for each of the 9 boxes.

## Implied constraint

**Pair / triple "hidden singles":** if value $v$ can only fit in one cell of a row (or column / box), assign it. Stated as a global constraint: \`gcc(X_row, [1..9], [1,1,1,1,1,1,1,1,1])\`.

This is implied (already follows from AllDifferent on rows/cols/boxes + domain restrictions) but the gcc propagator is stronger than AllDifferent at detecting hidden singles — particularly when domains have already been pruned by pre-filled clues.`,
          tags: ['sudoku', 'AllDifferent', 'gcc'],
        },
      ],
    },

    {
      id: 'essence-prime',
      slug: 'essence-prime',
      module: 'Module 3 · CSPs',
      title: 'Essence Prime',
      oneLiner: 'Syntax, types, operators, global constraints — the language Savile Row consumes.',
      sections: [
        {
          id: 'pipeline',
          title: 'Where Essence Prime sits',
          blocks: [
            { kind: 'md', body: `The Conjure / Savile Row toolchain:

$$\\text{Essence} \\xrightarrow{\\text{Conjure}} \\text{Essence'} \\xrightarrow{\\text{Savile Row}} \\text{solver (Minion / SAT / MiniZinc / SMT / MaxSAT)}$$

- **Essence** — high-level, abstract types (sets, functions, partitions, nesting).
- **Conjure** — chooses concrete representations, lowers to Essence'.
- **Essence Prime** (\`.eprime\`) — restricted, matrix-only specification language.
- **Savile Row** — flattens, optimises (CSE, AC-CSE, aggregation, tabulation, domain filtering), emits solver-native form.
- **Minion / SAT / etc.** — solves.

Authors: **Peter Nightingale**, **Ian Miguel**, and collaborators (St Andrews → York).` },
          ],
        },
        {
          id: 'structure',
          title: 'File structure & keywords',
          blocks: [
            { kind: 'md', body: `Every model starts with:

\`\`\`
language ESSENCE' 1.0
\`\`\`

Top-level statements (any order, but conventional flow header → givens → lettings → finds → such that → objective):

| Keyword | Purpose |
|---|---|
| \`given\` | Parameter (instance data) with a domain |
| \`where\` | Restrict allowed parameter values |
| \`letting\` | Define a constant or a named domain |
| \`find\` | Decision variable with a domain |
| \`such that\` | Constraints (comma-separated = conjunction) |
| \`minimising\` / \`maximising\` | Objective for optimisation |
| \`branching on\` | Static variable ordering for search |
| \`heuristic\` | Dynamic search heuristic (Minion: \`srf\`, \`domoverwdeg\`) |

A class-level model is a \`.eprime\` file; instance parameters are in a \`.param\` file. Together they specify a concrete instance.` },
          ],
        },
        {
          id: 'types',
          title: 'Type system (matrix-only)',
          blocks: [
            { kind: 'md', body: `| Type | Syntax | Notes |
|---|---|---|
| Bounded integer | \`int(lb..ub)\` | half-open ranges, comma-listed values: \`int(1, 4, 9)\` |
| Boolean | \`bool\` | also coercible to 0/1 via \`toInt\` |
| Matrix | \`matrix indexed by [D1, ..., Dk] of T\` | $k$-dimensional |

That's it. There are no \`set\`, \`mset\`, \`sequence\`, \`relation\`, \`function\` or \`partition\` types in Essence Prime — these belong to full Essence.

**Encodings** (what you write by hand in Essence Prime to simulate abstract types):

| Abstract type | Essence' encoding |
|---|---|
| Set of size $k$ from $D$ | matrix of $k$ ints in $D$, strictly increasing (breaks symmetry) — OR boolean matrix indexed by $D$ (occurrence) |
| Multiset of size $k$ from $D$ | matrix of $k$ ints in $D$, non-decreasing — OR integer matrix of counts |
| Function $D_1 \\to D_2$ (total) | \`matrix indexed by [D1] of D2\` — add \`allDiff\` for injective |
| Relation on $D_1 \\times D_2$ | \`matrix indexed by [D1, D2] of bool\` |
| Partition into $k$ parts | \`matrix indexed by [D] of int(1..k)\` (part-ID per element) |` },
            { kind: 'callout', variant: 'nightingale', title: 'Memorise the encodings', body: 'Exam questions often ask "model X in Essence Prime" where X is naturally a set/function/partition. You convert by hand using these encodings. The partition-as-part-ID-matrix is especially common.' },
          ],
        },
        {
          id: 'operators',
          title: 'Operators & quantifiers',
          blocks: [
            { kind: 'md', body: `**Arithmetic:** \`+ - * / % ** |x|\` and \`min(a,b)\`, \`max(a,b)\`.

- Division is **floor**: \`-3 / 2 = -2\`.
- Modulo defined as $a - b \\cdot \\lfloor a/b \\rfloor$.
- \`/\`, \`%\`, \`**\`, \`!\`, matrix indexing, slicing are **partial** — Savile Row generates definedness guards.

**Boolean:** \`/\\\` (and), \`\\/\` (or), \`->\` (implies), \`<->\` (iff), \`!\` (not). Comma between such-that clauses is lower-precedence conjunction.

**Comparison:** \`= != < <= > >=\`, plus \`in\` for membership in a domain. Lexicographic on 1-D matrices: \`<lex <=lex >lex >=lex\` — used for symmetry breaking.

**Quantifiers:**

\`\`\`
forAll i : domain . expr
exists i : domain . expr
sum    i : domain . expr
\`\`\`

Multiple bound variables: \`forAll i, j : int(1..n) . expr\`.

**Aggregates over matrices:** \`sum(M)\`, \`product(M)\`, \`and(M)\`, \`or(M)\`, \`min(M)\`, \`max(M)\`, \`flatten(M)\`.

**Comprehensions:** \`[ expr | i : dom, guard ]\` — builds a matrix.

**Slicing:** \`M[.., 5]\` (column 5), \`M[3, ..]\` (row 3).` },
          ],
        },
        {
          id: 'globals',
          title: 'Global constraints',
          blocks: [
            { kind: 'md', body: `| Constraint | Meaning |
|---|---|
| \`allDiff(X)\` | All entries of 1-D matrix $X$ pairwise distinct |
| \`alldifferent_except(X, v)\` | Distinct, except value $v$ may repeat |
| \`gcc(X, Vals, C)\` | Global cardinality: value \`Vals[i]\` occurs exactly \`C[i]\` times |
| \`atleast(X, C, Vals)\` | Each value \`Vals[i]\` occurs $\\ge$ \`C[i]\` times |
| \`atmost(X, C, Vals)\` | $\\le$ \`C[i]\` times |
| \`table(X, T)\` | $X$ is one of the listed tuples (extensional constraint) |
| \`cumulative(Starts, Durs, Resources, Bound)\` | Scheduling with resource limit |
| \`X <lex Y\`, \`<=lex\`, etc. | Lex ordering on 1-D matrices |

Savile Row's **aggregation pass** can also *introduce* globals from primitive constraints — a clutch of pairwise \`!=\` can be collapsed into one \`allDiff\`.` },
          ],
        },
        {
          id: 'savilerow-passes',
          title: 'Savile Row transformations',
          blocks: [
            { kind: 'md', body: `Selectable via \`-O0\` … \`-O3\` (default \`-O2\`):

1. Type-checking, parameter substitution, instantiation.
2. Quantifier and comprehension unrolling.
3. **Identical CSE** — replace repeated expressions with one auxiliary variable.
4. **Active CSE** — De Morgan rewrites to expose semantically equivalent subexpressions.
5. **AC-CSE** (Associative-Commutative; Nightingale et al. 2014/2017) — re-order $+, *, /\\, \\\\/$ operands to find common subexpressions.
6. **Domain filtering** (\`-reduce-domains\`) — invoke Minion to tighten bounds.
7. **Variable unification/deletion** — collapse equal-to-constant or equal variables.
8. **Aggregation** — combine into \`allDiff\`/\`gcc\`.
9. **Tabulation** (default at \`-O3\`) — small subexpressions → \`table\` constraints (cap ~10,000 tuples).
10. **Flattening** to solver-native form (CNF for SAT with order-encoding; FlatZinc; SMT-LIB).
11. **Symmetry breaking** (\`-S1\` removes redundant vars; \`-S2\` runs automorphism solver and posts lex-leader).` },
            { kind: 'callout', variant: 'keyfact', title: 'Why model rewriting matters', body: 'Semantically identical models can have wildly different solver performance. The "Automatically Improving Constraint Models in Savile Row" paper (Nightingale et al. AIJ 2017) is the empirical case for this whole pipeline.' },
          ],
        },
        {
          id: 'editor',
          title: 'Interactive: Essence Prime editor',
          blocks: [
            { kind: 'viz', viz: 'EssencePrime', title: 'Browse and edit canonical models', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'ep1', q: 'Three types Essence Prime allows for decision variables?', a: 'int(lb..ub), bool, and matrix indexed by [...] of T. No abstract types.' },
        { id: 'ep2', q: 'The full Conjure/Savile Row pipeline?', a: 'Essence → Conjure → Essence Prime → Savile Row → solver (Minion / SAT / MiniZinc / SMT / MaxSAT).' },
        { id: 'ep3', q: 'How do you encode a function in Essence Prime?', a: 'As a matrix indexed by the source domain, containing values in the target domain. Add allDiff for an injective function.' },
        { id: 'ep4', q: 'How do you encode a partition into k parts in Essence Prime?', a: 'A matrix indexed by D containing int(1..k) — a[i] = j means element i is in part j.' },
        { id: 'ep5', q: 'Name three Savile Row optimisation passes.', a: 'CSE (identical/active/AC-CSE), domain filtering, aggregation, tabulation, variable unification, symmetry breaking via automorphism (any three).' },
        { id: 'ep6', q: 'Essence Prime division on negative numbers?', a: 'Floor division. -3/2 = -2.' },
      ],
      examples: [
        {
          id: 'epex1', difficulty: 'basic', marks: 6,
          question: 'Write an Essence Prime model for n-queens (with n parameterised). Use the row viewpoint.',
          answer: `\`\`\`
language ESSENCE' 1.0

given n : int(1..)
letting DOM be domain int(1..n)

find queens : matrix indexed by [DOM] of DOM

such that
    allDiff(queens),                              $ different columns
    allDiff([queens[i] + i | i : DOM]),           $ different / diagonals
    allDiff([queens[i] - i | i : DOM])            $ different \\\\ diagonals
\`\`\`

**Explanation:**
- \`given n\` declares $n$ as a parameter — supplied in a \`.param\` file at solve time.
- \`letting DOM be domain int(1..n)\` defines a named domain.
- \`find queens : matrix indexed by [DOM] of DOM\` — the only decision variable, a 1-D array indexed by row, containing column indices.
- Three \`allDiff\` constraints: columns, then transformed values for the two diagonal families.
- "One queen per row" is **built into the model by construction** — there's exactly one variable per row.

**Sample param file** (\`n-queens-8.param\`):
\`\`\`
language ESSENCE' 1.0
letting n be 8
\`\`\`

Run: \`savilerow nqueens.eprime n-queens-8.param -minion\``,
        },
        {
          id: 'epex2', difficulty: 'intermediate', marks: 8,
          question: 'In *full Essence*, you might declare \`find P : partition (regular, numParts 3) from int(1..9)\`. Encode the equivalent in Essence Prime.',
          answer: `**Goal:** decision variable representing a partition of $\\{1, \\ldots, 9\\}$ into 3 equal-sized parts (size 3 each).

**Essence Prime encoding (part-ID array):**

\`\`\`
language ESSENCE' 1.0

letting U be domain int(1..9)
letting K be domain int(1..3)
letting partSize be 3

$ a[i] = j means element i belongs to part j
find a : matrix indexed by [U] of K

$ each part has exactly partSize elements — global cardinality
such that
    gcc(a, [1, 2, 3], [partSize, partSize, partSize])
\`\`\`

**Alternative — boolean occurrence matrix:**

\`\`\`
find b : matrix indexed by [U, K] of bool

such that
    $ each element is in exactly one part
    forAll i : U . (sum k : K . toInt(b[i, k])) = 1,

    $ each part has exactly 3 elements
    forAll k : K . (sum i : U . toInt(b[i, k])) = 3
\`\`\`

**Comparison:**
- Part-ID: $n$ integer variables of domain $\\{1..k\\}$ — compact.
- Boolean occurrence: $n \\cdot k$ boolean variables — more flexible (easy to add "element $i$ not in part $j$") but bigger.

**Symmetry note.** Both encodings preserve the *part interchange* symmetry (relabel parts) that the abstract \`partition\` type does not. Add \`a[1] = 1\` (or value precedence) to break it.

**Why Essence Prime is harder.** Full Essence: 1 line for the partition declaration. Essence Prime: 6+ lines including the GCC and symmetry breaking. Conjure automates this when compiling Essence → Essence'.`,
        },
        {
          id: 'epex3', difficulty: 'advanced', marks: 8,
          question: 'Sketch what Savile Row\'s "tabulation" pass does. When does it help, when does it hurt?',
          answer: `**Tabulation.** Convert a subset of constraints into a single **table constraint** by enumerating all satisfying tuples.

E.g. the constraint $(x + y = z) \\land (x \\le 3) \\land (y \\le 3) \\land (z \\le 6)$ with $x, y, z \\in \\{1..3\\}$ can be replaced by:

\`\`\`
table([x, y, z], [
  (1, 1, 2),
  (1, 2, 3),
  (1, 3, 4),
  (2, 1, 3),
  (2, 2, 4),
  (2, 3, 5),
  (3, 1, 4),
  (3, 2, 5),
  (3, 3, 6)
])
\`\`\`

**Why it helps:**
1. **Generalised arc consistency** is achievable on table constraints with optimised propagators (e.g. STR2, STR3, MDD-based). Faster than naive checking of multiple primitive constraints.
2. **Single constraint** vs many — less work in propagation queue management.
3. **Captures complex relationships** that primitive constraints cannot express compactly.

**Why it hurts:**
1. **Exponential tuple count.** If the scope is large with large domains, tuple count blows up — Savile Row caps tabulation at ~10,000 tuples by default.
2. **Memory.** Storing all tuples uses more memory than expressing the constraint symbolically.
3. **Diminishing returns** for already-efficient primitive constraints (e.g. AllDifferent has specialised propagators that beat table).

**When Savile Row applies it.** At \`-O3\` (the most aggressive optimisation), it tabulates small "compound" expressions: a few \`+\`, \`*\`, comparisons whose Cartesian product of domains stays under the limit.

**Result.** Often 2–5× speedup on the solver's runtime — worth it because the cost is paid once at compile time.`,
        },
      ],
    },

    {
      id: 'local-csp',
      slug: 'local-csp',
      module: 'Module 3 · CSPs',
      title: 'Local search for CSPs',
      oneLiner: 'Min-conflicts and the n-queens-in-50-moves trick.',
      sections: [
        {
          id: 'min-conflicts',
          title: 'Min-conflicts',
          blocks: [
            { kind: 'md', body: `Complete-state formulation: every variable is assigned. A move = re-assign one variable.

**Min-conflicts heuristic:** pick a variable in conflict (violating ≥1 constraint), reassign it to the value that minimises conflicts.

\`\`\`
function MIN-CONFLICTS(csp, max_steps):
    current := random complete assignment
    for i in 1..max_steps:
        if current is a solution: return current
        X := random variable in conflict
        v := value in D_X minimising conflicts of X
        current[X] := v
    return failure
\`\`\`

**Famous result:** min-conflicts solves million-queens in $\\sim 50$ moves on average. Random-start hill-climb finds n-queens in $O(n)$ moves.

**Why it works:** the constraint topology is benign — most starting positions are "near" a solution.` },
            { kind: 'callout', variant: 'whatif', title: 'You break the random-restart tie', body: 'Pure min-conflicts can get stuck in plateaux. Random tie-breaking on the value with min conflicts, or restart when no progress, fixes this.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: min-conflicts on n-queens',
          blocks: [
            { kind: 'viz', viz: 'MinConflicts', title: 'Watch min-conflicts solve n-queens', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'mc1', q: 'Min-conflicts heuristic, in one sentence.', a: 'Re-assign a conflicted variable to the value that minimises the number of constraint violations.' },
        { id: 'mc2', q: 'What is the empirical performance of min-conflicts on n-queens?', a: 'Solves million-queens in ~50 moves on average. Linear-time in n in practice.' },
      ],
    },

    {
      id: 'structure',
      slug: 'csp-structure',
      module: 'Module 3 · CSPs',
      title: 'Problem structure',
      oneLiner: 'Tree-structured CSPs and cutset conditioning.',
      sections: [
        {
          id: 'trees',
          title: 'Tree-structured CSPs',
          blocks: [
            { kind: 'md', body: `If the constraint graph is a **tree**, the CSP is solvable in $O(nd^2)$:

1. Choose a root.
2. Order variables in BFS/DFS order from root.
3. Apply **directional arc consistency** from leaves to root: for each node $X_i$, make $X_{\\text{parent}(i)}$ arc-consistent with $X_i$ (remove from parent's domain any value with no support in $X_i$).
4. Assign variables root-to-leaf — guaranteed conflict-free.

Total: $O(n)$ arcs, $O(d^2)$ per REVISE.` },
          ],
        },
        {
          id: 'tree-viz',
          title: 'Interactive: tree-CSP solver',
          blocks: [
            { kind: 'viz', viz: 'TreeCSP', title: 'Directional AC + assignment pass on a tree CSP', props: {} },
          ],
        },
        {
          id: 'cutset',
          title: 'Cutset conditioning',
          blocks: [
            { kind: 'md', body: `If the graph isn't a tree, find a small **cutset** $S$ of variables whose removal makes the remaining graph a tree. Then:

1. For every assignment to $S$ (try all $d^{|S|}$):
   - Restrict each non-cutset variable's domain consistently with $S$.
   - The remaining tree CSP can be solved in $O((n - |S|) d^2)$.

Total: $O(d^{|S|} \\cdot (n - |S|) d^2)$.

Useful when a *small* cutset exists. Finding the **minimum cutset** is NP-hard, but heuristics give good ones.

**Tree decomposition** generalises this — decompose the graph into a tree whose nodes are *subsets* of variables; complexity is exponential in the *width* of the decomposition.` },
          ],
        },
      ],
      flashcards: [
        { id: 's1', q: 'Time complexity for a tree-structured CSP?', a: 'O(nd²). Directional arc consistency from leaves to root, then linear assignment.' },
        { id: 's2', q: 'What is cutset conditioning?', a: 'Find a small set S of variables whose removal yields a tree. Try all d^|S| assignments to S, solving the resulting tree-CSP for each.' },
      ],
    },
  ],
};
