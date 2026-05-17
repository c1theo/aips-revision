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
      ],
      flashcards: [
        { id: 'cf1', q: 'What is a CSP, formally?', a: 'A triple (X, D, C): variables X_i, each with domain D_i, and constraints C_j each with a scope and a relation listing allowed value tuples.' },
        { id: 'cf2', q: 'What is a constraint graph?', a: 'For binary CSPs: nodes = variables, edges = binary constraints. Captures structure; tree-structured ⇒ polynomial.' },
        { id: 'cf3', q: 'Sudoku as a CSP — which type of constraint dominates?', a: 'AllDifferent (global constraint) over each row, column and 3×3 box.' },
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
          title: 'Interactive: AC-3 step-by-step',
          blocks: [
            { kind: 'viz', viz: 'AC3', title: 'AC-3 on map colouring', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'i1', q: 'Define arc consistency.', a: 'X_i is arc-consistent w.r.t. X_j if for every v in D_i there exists w in D_j such that (v,w) satisfies the constraint.' },
        { id: 'i2', q: 'Complexity of AC-3?', a: 'O(c·d³) (Mackworth & Freuder); tighter analysis or AC-3.1 achieves O(c·d²).' },
        { id: 'i3', q: 'Difference between Forward Checking and MAC?', a: 'FC only propagates to immediate neighbours of the just-assigned variable. MAC runs full AC-3 over all affected arcs.' },
        { id: 'i4', q: 'When does AC-3 add arcs back to the queue?', a: 'When REVISE(X_i, X_j) actually removed a value from D_i, re-enqueue all (X_k, X_i) for k ≠ j — because X_i shrinking may break consistency for its other neighbours.' },
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
          id: 'viz',
          title: 'Interactive: backtracking with MRV/LCV/FC toggles',
          blocks: [
            { kind: 'viz', viz: 'NQueens', title: 'n-Queens with backtracking', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'b1', q: 'MRV stands for?', a: 'Minimum Remaining Values — pick the variable with the smallest remaining domain. Fail-first heuristic.' },
        { id: 'b2', q: 'When does the degree heuristic kick in?', a: 'As tie-break for MRV. Picks the variable involved in the most constraints on remaining (unassigned) variables.' },
        { id: 'b3', q: 'LCV ordering — what counts as "least constraining"?', a: 'The value that rules out the fewest values in neighbouring variables\' domains.' },
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
