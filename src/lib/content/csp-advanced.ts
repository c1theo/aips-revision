import type { Topic } from '../types';

export const advancedTopics: Topic[] = [
  {
    id: 'beyond-ac3',
    slug: 'beyond-ac3',
    module: 'Module 3 · CSPs',
    title: 'Beyond AC-3: GAC, propagators & 2-way branching',
    oneLiner: 'Generalised arc consistency, custom propagators, search-tree shape, and modern propagation theory.',
    sections: [
      {
        id: '2way',
        title: '2-way branching vs d-way branching',
        blocks: [
          { kind: 'md', body: `Classical backtracking on a CSP variable $X$ with domain $D = \\{v_1, \\ldots, v_d\\}$ creates a **$d$-way branch** — one child per value. Each child tries $X = v_i$.

**2-way branching** instead creates exactly two children at every choice point:

- **Left child:** $X = v$ (commit to one chosen value).
- **Right child:** $X \\ne v$ (rule out that value; $X$ may take any remaining value in $D \\setminus \\{v\\}$).

The search tree becomes a **binary** tree of choices rather than a tree with variable branching factor.` },
          { kind: 'callout', variant: 'keyfact', title: 'Why 2-way is interesting', body: `1. **Uniform tree shape.** Every node has 0 or 2 children — simpler to analyse, often faster propagation per node.

2. **Powerful inference on the *right* branch.** $X \\ne v$ removes one value from $D(X)$, triggering AC-3 propagation immediately. In $d$-way branching, the corresponding "try the next value" doesn't propagate anything — you just try.

3. **Same complete tree, possibly different exploration order.** Both find the same solutions but the search pattern differs — 2-way often discovers infeasibility earlier on hard instances.` },
          { kind: 'md', body: `**When 2-way wins.** Hard CSPs with strong value-ordering heuristics — the chosen $v$ is likely to fail, so the right branch ($X \\ne v$) prunes the value across all subsequent attempts, not just one.

**When $d$-way wins.** Easy CSPs with many solutions — $d$-way finds them in fewer total expansions.

**Modern solvers** (Minion, Choco, Gecode) typically use 2-way branching by default because of (2).` },
          { kind: 'callout', variant: 'nightingale', title: 'Likely exam target', body: `Knowing the *difference between 2-way and d-way* and *why 2-way enables stronger propagation on the right branch* is a classic CSP-lecture point. Memorise the right-branch propagation argument.` },
        ],
      },

      {
        id: 'gac',
        title: 'Generalised Arc Consistency (GAC)',
        blocks: [
          { kind: 'md', body: `**Arc consistency (AC)** as defined for AC-3 applies only to **binary** constraints. For higher-arity constraints (AllDifferent, table, sum, gcc), we need a generalisation.

**Generalised Arc Consistency (GAC).** A constraint $C$ over variables $X_1, \\ldots, X_k$ is GAC iff for every variable $X_i$ and every value $v \\in D(X_i)$, there exists an assignment to the other variables in $C$'s scope that satisfies $C$ and gives $X_i = v$.

In words: every value in every variable's domain has *some* extension to a satisfying assignment of the whole constraint.

GAC enforces the strongest possible *unary* deduction from $C$ — any value that can't participate in any satisfying tuple is removed.` },
          { kind: 'callout', variant: 'keyfact', title: 'GAC and AC agree on binary constraints', body: 'For a binary constraint, GAC = AC. The "generalised" only matters for arity ≥ 3.' },
          { kind: 'md', body: `**Achieving GAC.** For different constraint families:

- **AllDifferent**: Régin's algorithm (1994) — based on bipartite matching. Find a maximum matching in the variable-value bipartite graph; remove any value-edge not in some maximum matching. $O(d^{2.5} n)$ via Hopcroft-Karp.

- **Table constraint** (extensional): direct scan over allowed tuples. STR2, STR3 algorithms — Simple Tabular Reduction.

- **Element constraint** ($Z = X[Y]$ — Z is the Y-th entry of array X): specialised algorithm.

- **Sum / linear constraints**: bounds consistency variant (cheaper than full GAC, often sufficient).

**Cost-benefit.** GAC enforces stronger pruning than weaker forms (e.g. bounds consistency), but the per-call cost can be high. Modern solvers expose both.` },
        ],
      },

      {
        id: 'propagators',
        title: 'Propagators',
        blocks: [
          { kind: 'md', body: `A **propagator** is the algorithm a solver uses to enforce a particular constraint's consistency.

Solvers maintain a **propagator queue**: when a variable's domain changes, all propagators involving that variable are queued for re-execution. Each propagator runs to fixpoint or until it makes no further changes, then the next propagator runs. The queue continues until empty (fixpoint reached for all constraints) or a domain becomes empty (failure).

**Pseudocode:**

\`\`\`
function PROPAGATE(csp):
    queue := all propagators
    while queue not empty:
        p := queue.pop()
        changed := p.execute()      // returns the set of vars whose domains changed
        if any D_i is empty: return FAILURE
        for each var X in changed:
            for each propagator p' involving X:
                if p' not in queue: queue.push(p')
    return OK
\`\`\`

**Granularity.** Each constraint type has its own propagator implementation. The framework is generic; the per-constraint logic is specialised.` },
          { kind: 'callout', variant: 'keyfact', title: 'Why specialised propagators?', body: 'Generic AC-3 over an extensional encoding of e.g. AllDifferent has cost O(d^n) for n variables — exponential. Régin\'s specialised propagator runs in polynomial time using matching theory. The solver chooses the algorithm best-suited to each constraint.' },
          { kind: 'md', body: `**Properties of a good propagator:**

1. **Sound.** Removes only values that cannot extend to a solution.
2. **Idempotent (often).** Running it again at fixpoint changes nothing.
3. **Monotonic.** Removing a value only removes more values — never adds back.
4. **Confluent (with others).** Running propagators in different orders reaches the same fixpoint.

**Levels of consistency** a propagator may achieve (weakest → strongest):
- **Bounds consistency**: only the min/max of each domain are made consistent.
- **Range consistency**: all values in $[\\min, \\max]$ are consistent.
- **Domain consistency / GAC**: every individual value is consistent.

Stronger consistency = more pruning = higher per-call cost.` },
        ],
      },

      {
        id: 'beyond-ac3-algos',
        title: 'AC-3, AC-4, AC-2001: a family',
        blocks: [
          { kind: 'md', body: `**AC-3** (Mackworth 1977) is the textbook algorithm: $O(c d^3)$.

**AC-4** (Mohr & Henderson 1986) achieves the optimal $O(c d^2)$ by maintaining a **counter** per (variable, value, constraint) triple: how many supports each value has in each neighbour. When a support drops to zero, the value is removed. Memory: $O(c d^2)$.

**AC-2001 / AC-3.1** (Bessière & Régin 2001; Zhang & Yap 2001) — same $O(c d^2)$ time as AC-4 but with much less memory and simpler implementation:

- For each (variable, value) and each constraint, cache the **last support found** in the neighbour's domain.
- On re-REVISE, start checking from the cached value (it might still be a support; if not, search from there onwards).
- Amortised $O(d)$ work per value per constraint over the whole run.

| Algorithm | Time | Space | Practical |
|---|---|---|---|
| AC-3 | $O(c d^3)$ | $O(c)$ | Textbook |
| AC-4 | $O(c d^2)$ | $O(c d^2)$ | Optimal time, heavy memory |
| AC-2001 | $O(c d^2)$ | $O(c d)$ | **Practical winner** |

**Modern solvers** use AC-2001 or a variant specialised per constraint type.` },
          { kind: 'callout', variant: 'pitfall', title: 'Don\'t confuse algorithm and consistency level', body: 'AC-3, AC-4, AC-2001 all enforce *the same* consistency level — arc consistency. They differ only in time and memory complexity. *Path consistency* is a different (stronger) level of consistency that requires a different algorithm family.' },
        ],
      },

      {
        id: 'advanced-heuristics',
        title: 'Advanced variable-ordering heuristics',
        blocks: [
          { kind: 'md', body: `Beyond MRV and Degree (Module 3.4), modern solvers use *adaptive* heuristics that exploit search history.

**1. dom/deg.** Score $= |D(X_i)| / \\deg(X_i)$ — minimise. Combines fail-first (small domain) with most-constrained (high degree).

**2. dom/wdeg (Boussemart et al., 2004).** Replace static degree with **weighted degree**:
- Initialise each constraint's weight to 1.
- Each time a constraint causes a domain wipe-out (propagator detects $D = \\emptyset$), increment its weight.
- Variable's wdeg = sum of weights of constraints it participates in.
- Score = $|D(X_i)| / \\text{wdeg}(X_i)$.

**Effect:** the heuristic learns which constraints are "tight" (cause failures) and prioritises variables involved in them — fail-first on steroids. Empirically the strongest general-purpose CSP heuristic.

**3. Activity / impact-based** (Refalo, 2004): track each variable's **impact** = average reduction in search space when it's assigned. Prefer high-impact variables.

**4. CHB (Conflict History-Based)**: smoothed per-conflict weight similar to VSIDS in SAT.

**5. Last-Conflict** (Lecoutre et al., 2009): after a backtrack, always pick the *same* variable that just caused the conflict. Drills into the trouble spot.

**For value ordering:** beyond LCV, **solution-counting** estimates choose values most likely to lead to solutions (expensive but effective on hard instances).` },
          { kind: 'callout', variant: 'nightingale', title: 'York-relevant', body: 'dom/wdeg and last-conflict are taught as state-of-the-art alternatives to MRV in CP courses worldwide. Know them by name and the intuition: "learn which constraints are tight, prioritise their variables".' },
        ],
      },

      {
        id: 'mac-graphical',
        title: 'MAC with graphical interpretation',
        blocks: [
          { kind: 'md', body: `**MAC** = Maintaining Arc Consistency. After every assignment, run AC-3 (or AC-2001) to fixpoint on all affected arcs.

**Graphical intuition.** Think of the constraint graph as a network of pipes carrying domain reductions:

1. Assignment fixes one node's value (constricts its pipe).
2. Constriction propagates through arc-consistency to neighbours.
3. Each neighbour's domain shrinks — its constraints to *its* neighbours re-fire.
4. Reduction ripples through the network until fixpoint.

**Visually:** an "ink-blot" of reductions spreading from the assignment.

**Comparison with FC:**

- **FC** only fires the first ripple — direct neighbours of the assigned variable.
- **MAC** lets the wave propagate fully.

For tightly-constrained problems, the wave reaches across most of the graph and shrinks many domains, cutting the search tree dramatically.

**Cost.** Each MAC call: $O(c d^2)$ with AC-2001. Per backtracking step: this can be the bottleneck. But MAC pays for itself many times over by avoiding deeper futile descents.` },
          { kind: 'callout', variant: 'whatif', title: 'You replace MAC with a single round of AC at the root only', body: '"Preprocessing": prune unsupported values once, then backtrack without further propagation. Much weaker than MAC but cheaper. Standard for some sparse CSPs.' },
        ],
      },

      {
        id: 'viz-2way',
        title: 'Interactive: 2-way vs d-way branching',
        blocks: [
          { kind: 'viz', viz: 'TwoWayBranching', title: 'n-queens: 2-way vs d-way search tree', props: {} },
        ],
      },

      {
        id: 'combining',
        title: 'Combining search and propagation',
        blocks: [
          { kind: 'md', body: `The interleaved architecture used by modern CP solvers:

\`\`\`
function CP-SOLVE(csp):
    if PROPAGATE(csp) = FAILURE: return FAILURE
    if all variables assigned: return SOLUTION
    X := SELECT-VARIABLE(csp)         // MRV / dom-wdeg / etc.
    v := SELECT-VALUE(X, csp)         // LCV / solution-count / etc.
    save state
    add X = v
    result := CP-SOLVE(csp)
    if result != FAILURE: return result
    restore state
    add X ≠ v                         // 2-way branching
    return CP-SOLVE(csp)
\`\`\`

**Two intertwined loops:**

1. **Outer loop (search):** decide variable + value, recurse on both branches.
2. **Inner loop (propagation):** within each node, propagators run to fixpoint, possibly detecting infeasibility before any further decisions.

**Why the combination works.** Search alone is exponential. Propagation alone is polynomial but doesn't make assignments — leaves variables in choosable-but-unassigned state. Their combination is the workhorse of CSP: propagation aggressively prunes within each search node; search systematically explores when propagation alone can't decide.` },
          { kind: 'callout', variant: 'keyfact', title: 'The CSP-solver mantra', body: '"Propagate as much as possible, then branch on the hardest decision."' },
        ],
      },
    ],
    flashcards: [
      { id: 'ba1', q: 'Difference between 2-way and d-way branching?', a: '2-way creates exactly 2 children per node: X = v and X ≠ v. d-way creates one per value. 2-way enables strong propagation on the right branch.' },
      { id: 'ba2', q: 'What is GAC?', a: 'Generalised Arc Consistency: for every value of every variable in a (possibly non-binary) constraint\'s scope, there exists a satisfying extension of the other variables.' },
      { id: 'ba3', q: 'Régin\'s algorithm computes GAC for what?', a: 'AllDifferent. Uses bipartite matching to identify values not part of any maximum matching → remove them.' },
      { id: 'ba4', q: 'Three levels of consistency a propagator may achieve?', a: 'Bounds consistency (min/max only), range consistency (all in [min,max]), domain consistency / GAC (every individual value).' },
      { id: 'ba5', q: 'AC-3 vs AC-2001 — what changes?', a: 'AC-2001 caches the last support found per (variable, value, constraint) triple. Same O(cd²) complexity as AC-4 but much less memory.' },
      { id: 'ba6', q: 'dom/wdeg in one sentence?', a: 'Score = |D(X)| / weighted-degree(X), where constraint weights are incremented each time a constraint causes a domain wipe-out. Adaptive fail-first.' },
      { id: 'ba7', q: 'Last-conflict heuristic?', a: 'After a backtrack, always branch on the variable that just caused the conflict — drills into the trouble spot.' },
      { id: 'ba8', q: 'CP solver inner / outer loop?', a: 'Outer: search (variable + value choice, recurse). Inner: propagation (fix-point of propagator queue within each node).' },
    ],
    examples: [
      {
        id: 'ba-ex1', difficulty: 'intermediate', marks: 7,
        question: 'For a CSP with variable $X \\in \\{1, 2, 3, 4\\}$, show the **2-way** search tree compared to the **4-way** tree at the first branching decision. What pruning advantage does 2-way have?',
        answer: `**4-way tree:**

\`\`\`
            X
        /  |  |  \\
     X=1  X=2 X=3  X=4
\`\`\`

Each child tries one specific value. Failure of one branch tries the next.

**2-way tree (with value-ordering picking, say, $X = 2$):**

\`\`\`
            X
           / \\
        X=2   X≠2
              ╱ |  \\
            X=1 X=3  X=4   (subsequent branches on the right branch)
\`\`\`

The right branch ($X \\ne 2$) **propagates immediately**: $D(X) := \\{1, 3, 4\\}$. All AC-3 arcs touching $X$ re-fire. Any value of any other variable that *required* $X = 2$ as a support is pruned.

**Pruning advantage of 2-way:**
- In **d-way**: when $X = 2$ fails, we try $X = 3$ next. But the failure of $X = 2$ doesn't tell us anything about $X = 3$'s other consequences. We rediscover.
- In **2-way**: on the right branch, $X = 2$ is forbidden *for the whole subtree*. Any future deduction "if Y = 5 then X must be 2" is immediately broken — $Y \\ne 5$ propagates.

**Empirical:** on hard instances with a good value heuristic, 2-way is 2–10× faster.

**Caveat:** for easy or under-constrained problems, 4-way wins because it finds solutions on direct branches without the overhead of right-branch propagation.`,
      },
      {
        id: 'ba-ex2', difficulty: 'advanced', marks: 10,
        question: 'Sketch Régin\'s algorithm for GAC on AllDifferent. Why does it use bipartite matching?',
        answer: `**Setup.** AllDifferent$(X_1, \\ldots, X_n)$ with domains $D_1, \\ldots, D_n$.

**Bipartite graph $G$.**
- Left nodes: variables $X_1, \\ldots, X_n$.
- Right nodes: values $v$ appearing in any $D_i$.
- Edge $(X_i, v)$ iff $v \\in D_i$.

A **perfect matching** in $G$ assigns each variable a distinct value — exactly an AllDifferent satisfying assignment.

**Régin's GAC algorithm.**

1. **Find a maximum matching $M$** in $G$ (Hopcroft-Karp, $O(\\sqrt{n + d} \\cdot |E|)$).

2. If $|M| < n$: AllDifferent is **infeasible** — fail.

3. **For each edge $(X_i, v) \\in G$**, check: is $(X_i, v)$ part of *some* maximum matching?
   - If yes: $v$ is supported in $D_i$ — keep.
   - If no: $v$ cannot be in any satisfying assignment — **remove from $D_i$**.

4. **Efficient check** (step 3): build the **alternating-cycle graph**. An edge $(X_i, v)$ is in some max matching iff it lies on an alternating cycle or alternating path from a free node in some specially-oriented direction. SCC computation answers this in $O(|V| + |E|)$.

**Total:** $O(n \\cdot d^{1.5})$ in practice (matching dominates).

**Why matching theory?** AllDifferent is fundamentally a *bipartite perfect matching* problem dressed up as constraint:

> "Assign each variable a distinct value" ≡ "Find a perfect matching in the variable-value bipartite graph".

Therefore: anything matching theory says (König's theorem, Hopcroft-Karp, Hall's marriage condition) applies. GAC for AllDifferent is exactly *finding values participating in some perfect matching*.

**Pruning power.** A naive O(n²) pairwise-inequality propagator misses these deductions:
- It only knows "no two equal", not "the whole assignment must be a permutation of available values".
- E.g. 3 variables, domains $\\{1,2\\}, \\{1,2\\}, \\{1,2,3\\}$ — Régin instantly removes 1 and 2 from $X_3$'s domain (no max matching covers them at $X_3$); pairwise propagation cannot.`,
      },
      {
        id: 'ba-ex3', difficulty: 'intermediate', marks: 6,
        question: 'Explain **dom/wdeg** with a concrete example. Why is it adaptive?',
        answer: `**Setup.** Each constraint $c_j$ has a weight $w_j$, initialised to 1.

**On every domain wipe-out** (some variable's domain becomes empty during propagation), find the propagator responsible and increment its constraint's weight: $w_j \\mathrel{+}= 1$.

**Variable score:** $\\text{wdeg}(X_i) = \\sum_{c_j \\ni X_i} w_j$.

**dom/wdeg heuristic:** branch on $\\arg\\min_i |D(X_i)| / \\text{wdeg}(X_i)$.

**Concrete example.** 5 variables, 4 constraints. Initial weights all 1.

After 10 backtracks, weights have grown: $w_1 = 1, w_2 = 7, w_3 = 4, w_4 = 1$. Constraints $c_2$ and $c_3$ have caused the most failures.

Variable $X_a$ is in $c_1, c_4$: wdeg = 2.
Variable $X_b$ is in $c_2, c_3$: wdeg = 11.

If $|D(X_a)| = |D(X_b)| = 4$:
- MRV ties.
- Degree gives $X_a$ and $X_b$ equal scores (both in 2 constraints).
- **dom/wdeg picks $X_b$** (smaller dom/wdeg = 4/11 = 0.36 vs 4/2 = 2.0) — it's involved in the constraints that have been causing trouble.

**Why adaptive:** as the search runs, the heuristic *learns* which constraints are tight (cause failures) and re-prioritises. Static heuristics (MRV, degree) can't adapt.

**Empirical performance:** dom/wdeg dominates on hard / industrial CSP benchmarks. Almost every modern CSP solver supports it.`,
      },
    ],
  },
];
