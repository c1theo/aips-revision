import type { Module } from '../types';

export const searchModule: Module = {
  id: 'search',
  title: 'Module 1 · Problem Solving by Search',
  slug: 'search',
  oneLiner: 'Classical state-space search: formulation, uninformed algorithms, heuristics and A*.',
  topics: [
    {
      id: 'formulation',
      slug: 'search-formulation',
      module: 'Module 1 · Search',
      title: 'Problem formulation',
      oneLiner: 'Turning a real problem into a state-space search problem.',
      sections: [
        {
          id: 'components',
          title: 'The five components of a search problem',
          blocks: [
            { kind: 'md', body: `A *search problem* is a 5-tuple:

- **Initial state** $s_0$ — where the agent starts.
- **Actions** $\\mathrm{Actions}(s)$ — set of actions applicable in state $s$.
- **Transition model** $\\mathrm{Result}(s, a)$ — the state reached by doing $a$ in $s$.
- **Goal test** $\\mathrm{IsGoal}(s)$ — predicate on states. May be explicit (one state) or implicit (any state satisfying a property, e.g. n-queens "no two queens attack").
- **Action cost** $\\mathrm{Cost}(s, a, s')$ — non-negative, often $1$ for uniform problems.

A **solution** is a sequence of actions leading from $s_0$ to a goal state. An **optimal solution** minimises total cost.` },
            { kind: 'callout', variant: 'keyfact', title: 'State space vs search tree', body: `The **state space** is a *graph*: nodes are states, edges are actions. The **search tree** is what an algorithm builds — the same state can appear at many tree nodes (different paths). **Repeated-state checking** ("graph search") collapses them; without it ("tree search") you can explore forever on cyclic graphs.` },
          ],
        },
        {
          id: 'examples',
          title: 'Standard example problems',
          blocks: [
            { kind: 'md', body: `**Toy problems (used in lectures and exams):**

| Problem | State | Actions | Goal | Cost |
|---|---|---|---|---|
| Vacuum world | (robot loc, dirt set) | Left, Right, Suck | no dirt | 1/action |
| 8-puzzle | tile permutation | slide blank ↕↔ | sorted | 1/move |
| 8-queens (incremental) | k queens placed | add queen in col k+1 | k=8, none attack | uniform |
| 8-queens (complete) | 8 queens placed | move any queen | none attack | uniform |
| Route in Romania | current city | drive to neighbour | reach Bucharest | km |

**Real problems:** route finding (Google Maps), VLSI layout, automated assembly, protein design, robot navigation.` },
            { kind: 'callout', variant: 'pitfall', title: 'Incremental vs complete-state formulations', body: `For n-queens, the *incremental* formulation has state space $O(n!)$ but small branching factor; the *complete-state* formulation has $n^n$ states but enables local search. Choosing the formulation is part of solving the problem.` },
          ],
        },
      ],
      flashcards: [
        { id: 'f1', q: 'What are the five components of a search problem?', a: 'Initial state, Actions(s), Result(s,a), IsGoal(s), Cost(s,a,s\').' },
        { id: 'f2', q: 'Difference between state space and search tree?', a: 'State space is a graph (one node per state). Search tree is what the algorithm builds; the same state can appear in many tree nodes via different paths.' },
        { id: 'f3', q: 'Why prefer the complete-state formulation of n-queens?', a: 'It enables local search (min-conflicts, hill-climbing) over a fixed-size state.' },
      ],
    },

    {
      id: 'uninformed',
      slug: 'uninformed-search',
      module: 'Module 1 · Search',
      title: 'Uninformed search',
      oneLiner: 'BFS, DFS, IDS, UCS — algorithms that use no problem-specific knowledge.',
      sections: [
        {
          id: 'tree-graph',
          title: 'Tree-Search and Graph-Search skeletons',
          blocks: [
            { kind: 'md', body: `Both maintain a **frontier** (open list) of generated-but-not-expanded nodes. Graph-search adds a **reached** set ("closed list") to avoid re-expanding states.

\`\`\`
function GRAPH-SEARCH(problem, frontier):
    add start to frontier
    reached := { start }
    while frontier not empty:
        node := frontier.pop()         # ← which one we pop defines the algorithm
        if IsGoal(node.state): return path(node)
        for action in Actions(node.state):
            child := Result(node, action)
            if child.state not in reached:
                add child.state to reached
                add child to frontier
    return failure
\`\`\`

The data structure used for \`frontier\` controls behaviour:

| Frontier | Algorithm |
|---|---|
| FIFO queue | Breadth-first search |
| LIFO stack | Depth-first search |
| Priority queue on $g(n)$ | Uniform-cost search (Dijkstra) |
| Priority queue on $f(n)=g(n)+h(n)$ | A\\* |
` },
          ],
        },
        {
          id: 'bfs',
          title: 'Breadth-First Search (BFS)',
          blocks: [
            { kind: 'md', body: `Pop **shallowest** unexpanded node. Goal test on **generation**, not expansion (the AIMA 4e convention) — saves expanding nodes that are goals.

**Properties** (with branching factor $b$, depth of shallowest goal $d$):

- **Complete:** yes (if $b$ finite)
- **Optimal:** yes if action costs are uniform (or non-decreasing in depth)
- **Time:** $O(b^d)$
- **Space:** $O(b^d)$ (must keep the whole frontier)

**Pitfall:** BFS is **not** optimal for general action costs. For "cheapest" you need UCS.` },
          ],
        },
        {
          id: 'dfs',
          title: 'Depth-First Search (DFS)',
          blocks: [
            { kind: 'md', body: `Pop **deepest** node. Implementation: recursion or explicit stack.

- **Complete:** no (infinite loops in infinite spaces; even cycles in finite without graph-search)
- **Optimal:** no
- **Time:** $O(b^m)$ where $m$ is max depth
- **Space:** $O(bm)$ — *much better* than BFS

**When DFS wins:** memory-bounded settings; finite spaces with many solutions at moderate depth.` },
            { kind: 'callout', variant: 'pitfall', title: 'DFS tree-search on graphs', body: 'Without graph-search bookkeeping, DFS on a graph with cycles can loop forever. Always say which variant you mean.' },
          ],
        },
        {
          id: 'ids',
          title: 'Iterative Deepening (IDS)',
          blocks: [
            { kind: 'md', body: `Run depth-limited DFS for limits $\\ell = 0, 1, 2, \\ldots$ until a goal is found.

- **Complete:** yes (if $b$ finite)
- **Optimal:** yes for uniform costs
- **Time:** $O(b^d)$ — same as BFS asymptotically
- **Space:** $O(bd)$ — DFS-like

**Why the time is OK:** the last (deepest) iteration dominates. Re-expanding shallow levels costs at most a constant factor more (proof: geometric series).

This is the **standard choice for unknown-depth problems with bounded memory**.` },
            { kind: 'callout', variant: 'keyfact', title: 'IDS = best of BFS + DFS', body: 'BFS-style completeness and optimality with DFS-style memory.' },
          ],
        },
        {
          id: 'ucs',
          title: 'Uniform-Cost Search (UCS)',
          blocks: [
            { kind: 'md', body: `Expand the node with **lowest path cost** $g(n)$. Equivalent to **Dijkstra's algorithm**.

- **Complete:** yes if every step has cost $\\ge \\epsilon > 0$
- **Optimal:** yes (for non-negative costs)
- **Time/Space:** $O(b^{1+\\lfloor C^*/\\epsilon \\rfloor})$ where $C^*$ is the optimal solution cost

**Goal test on expansion**, not generation — because a cheaper path to the goal may arrive later.

This is the right algorithm when actions have **non-uniform costs** but you have no heuristic.` },
          ],
        },
        {
          id: 'comparison',
          title: 'Comparison table',
          blocks: [
            { kind: 'md', body: `| Algorithm | Complete? | Optimal? | Time | Space |
|---|---|---|---|---|
| BFS | yes (finite b) | yes (uniform costs) | $O(b^d)$ | $O(b^d)$ |
| UCS | yes | yes | $O(b^{1+\\lfloor C^*/\\epsilon\\rfloor})$ | as time |
| DFS | no (infinite); yes if graph-search + finite | no | $O(b^m)$ | $O(bm)$ |
| Depth-limited DFS ($\\ell$) | no if $\\ell < d$ | no | $O(b^\\ell)$ | $O(b\\ell)$ |
| IDS | yes | yes (uniform costs) | $O(b^d)$ | $O(bd)$ |
| Bidirectional (BFS×BFS) | yes | yes (uniform costs) | $O(b^{d/2})$ | $O(b^{d/2})$ |
` },
            { kind: 'callout', variant: 'pitfall', title: 'Time complexity counts', body: 'AIMA: time is *nodes generated*, not nodes expanded. With BFS goal-test-on-generation the two differ; pick a convention and stick with it.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: side-by-side search on a grid',
          blocks: [
            { kind: 'viz', viz: 'SearchGrid', title: 'Pathfinding playground (BFS · DFS · UCS · Greedy · A*)', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'u1', q: 'Time and space complexity of BFS?', a: 'Both O(b^d). BFS keeps the whole frontier.' },
        { id: 'u2', q: 'Is BFS optimal for general action costs?', a: 'No. BFS is only optimal when costs are uniform (or non-decreasing in depth). Use UCS otherwise.' },
        { id: 'u3', q: 'What is IDS and why does its time complexity equal BFS\'s?', a: 'Iterative-deepening DFS: run DLS with limit 0,1,2,... until goal. The deepest iteration dominates (geometric series), so total work is O(b^d).' },
        { id: 'u4', q: 'When does UCS apply its goal test?', a: 'On expansion (popping from the priority queue), not generation — a cheaper path to the goal may arrive later.' },
        { id: 'u5', q: 'Why does DFS have O(bm) space?', a: 'It only needs to remember the current path plus the unexpanded siblings at each level.' },
      ],
    },

    {
      id: 'informed',
      slug: 'informed-search',
      module: 'Module 1 · Search',
      title: 'Informed search & A*',
      oneLiner: 'Heuristic functions, A*, admissibility, consistency, dominance.',
      sections: [
        {
          id: 'heuristics',
          title: 'Heuristics',
          blocks: [
            { kind: 'md', body: `A **heuristic function** $h(n)$ estimates the cost of the cheapest path from node $n$ to a goal.

By convention: $h(n) = 0$ if $n$ is a goal. Heuristics are problem-specific.

**Classic examples:**

- **Misplaced tiles** in 8-puzzle — count tiles not in their goal position.
- **Manhattan distance** in 8-puzzle — sum of $|x_i - x_i^*| + |y_i - y_i^*|$ over tiles.
- **Straight-line distance** for route planning — Euclidean distance to goal.

**How to design heuristics:**
1. **Relaxation:** drop a constraint of the original problem and compute exact cost in the relaxed problem (relaxed cost $\\le$ true cost, so admissible).
2. **Pattern databases:** precompute exact costs in sub-problems and add them.
3. **Learning** from solved instances.` },
          ],
        },
        {
          id: 'greedy',
          title: 'Greedy best-first',
          blocks: [
            { kind: 'md', body: `Expand the node with smallest $h(n)$. **Ignores $g$.**

- **Complete:** no (can loop)
- **Optimal:** no
- **Time/Space:** worst $O(b^m)$; in practice often very fast

Greedy can be wildly suboptimal because it never looks back at path cost so far. It's mainly pedagogical.` },
          ],
        },
        {
          id: 'astar',
          title: 'A* search',
          blocks: [
            { kind: 'md', body: `Expand the node with smallest **$f(n) = g(n) + h(n)$**, where $g(n)$ is the cost from start to $n$ and $h(n)$ is the heuristic estimate from $n$ to a goal.

A* is **the** combination: it uses the path cost so far *and* an estimate of what remains.` },
            { kind: 'callout', variant: 'keyfact', title: 'A* optimality conditions', body: `**Tree-search A* is optimal if $h$ is admissible.**

**Graph-search A* is optimal if $h$ is consistent** (some textbooks: also admissible + closed-list reopening permitted).` },
          ],
        },
        {
          id: 'admissibility',
          title: 'Admissibility',
          blocks: [
            { kind: 'md', body: `**$h$ is admissible** iff $h(n) \\le h^*(n)$ for every $n$, where $h^*(n)$ is the true optimal cost from $n$ to a goal.

In words: $h$ **never overestimates**.

A consequence: $h(\\mathrm{goal}) = 0$ (true cost is zero from a goal).` },
            { kind: 'callout', variant: 'whatif', title: 'h overestimates', body: 'If $h$ is *not* admissible, A* may return a suboptimal solution. It can still terminate and the path may be acceptable in practice — many practical solvers deliberately use inadmissible heuristics for speed. But you lose the optimality guarantee.' },
          ],
        },
        {
          id: 'consistency',
          title: 'Consistency / monotonicity',
          blocks: [
            { kind: 'md', body: `**$h$ is consistent (monotone)** iff for every node $n$ and every successor $n'$ produced by action $a$:

$$h(n) \\le c(n, a, n') + h(n')$$

This is a **triangle inequality**.

**Consequences:**
- Consistency $\\Rightarrow$ admissibility (proof: induction along an optimal path to a goal).
- $f$ is **non-decreasing along any path**: $f(n') = g(n') + h(n') = g(n) + c + h(n') \\ge g(n) + h(n) = f(n)$.
- Therefore the first time A* expands a node, it has the optimal $g$ — no need to reopen closed nodes.
- **Graph-search A* with a consistent $h$ is optimal.**` },
            { kind: 'callout', variant: 'pitfall', title: 'Admissible ≠ consistent', body: 'Consistent implies admissible, not the reverse. Almost every "natural" heuristic (Manhattan distance, straight-line) is consistent. Pattern-database heuristics can be admissible without being consistent.' },
          ],
        },
        {
          id: 'optimality-proof',
          title: 'A* optimality proof (tree search, admissible h)',
          blocks: [
            { kind: 'md', body: `**Claim:** If $h$ is admissible, tree-search A* returns an optimal goal.

**Proof.** Suppose for contradiction A* returns a suboptimal goal $G_2$ with $g(G_2) > C^*$, where $C^*$ is the optimal cost. Let $n$ be a node on the optimal path that is currently on the frontier when A* selects $G_2$.

Then by admissibility:
$$f(n) = g(n) + h(n) \\le g(n) + h^*(n) = C^*.$$

And for the suboptimal goal:
$$f(G_2) = g(G_2) + h(G_2) = g(G_2) > C^*$$
(since $h(G_2) = 0$).

So $f(n) < f(G_2)$, contradicting A*'s choice of $G_2$. $\\blacksquare$` },
            { kind: 'callout', variant: 'nightingale', title: 'This is the AIMA proof — present it this way', body: 'York lectures follow AIMA notation. Set up by contradiction; identify $n$ on the optimal path that\'s on the frontier; apply admissibility; show $f(n) \\le C^* < f(G_2)$.' },
          ],
        },
        {
          id: 'dominance',
          title: 'Dominance',
          blocks: [
            { kind: 'md', body: `**$h_1$ dominates $h_2$** iff $h_1(n) \\ge h_2(n)$ for all $n$ (and both admissible).

Higher = closer to $h^*$ = better. A dominant heuristic **expands no more nodes** than the dominated one (modulo tie-breaking).

**How to get one:** take the max of several admissible heuristics. Since each $\\le h^*$, their max is also $\\le h^*$, hence admissible — and it dominates each.` },
            { kind: 'callout', variant: 'keyfact', title: 'Max of admissibles is admissible', body: 'If $h_1, h_2$ are admissible, so is $h(n) = \\max(h_1(n), h_2(n))$. And it dominates both. Free win.' },
          ],
        },
        {
          id: 'ida',
          title: 'IDA* — memory-bounded A*',
          blocks: [
            { kind: 'md', body: `Iterative-deepening on $f$. Each iteration runs DFS but cuts off when $f(n) > \\text{threshold}$; the next threshold is the smallest $f$-value that exceeded the previous threshold.

- **Memory:** linear, like DFS — $O(bd)$
- **Optimal:** yes, if $h$ admissible
- **Time:** can be much higher than A* if $f$-values are real-valued (each iteration adds only one new $f$-level)

Used historically for puzzles (15-puzzle, Rubik's cube) where memory mattered.` },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: A* vs UCS vs Greedy on a grid',
          blocks: [
            { kind: 'viz', viz: 'SearchGrid', title: 'Compare informed and uninformed search', props: { mode: 'informed' } },
          ],
        },
      ],
      flashcards: [
        { id: 'i1', q: 'Define admissible and consistent.', a: 'Admissible: h(n) ≤ h*(n) for all n. Consistent: h(n) ≤ c(n,a,n\') + h(n\') for every successor (triangle inequality). Consistent ⇒ admissible.' },
        { id: 'i2', q: 'When is graph-search A* guaranteed optimal?', a: 'When h is consistent. (Tree-search A* needs only admissibility.)' },
        { id: 'i3', q: 'Sketch A*\'s optimality proof.', a: 'Assume A* returns suboptimal G2 with g(G2)>C*. Pick frontier node n on optimal path. By admissibility f(n)≤C*. f(G2)=g(G2)>C*. So f(n)<f(G2), contradicting A*\'s choice.' },
        { id: 'i4', q: 'How do you combine two admissible heuristics safely?', a: 'h(n) = max(h1(n), h2(n)). Still admissible, dominates both.' },
        { id: 'i5', q: 'Why is f non-decreasing along a path under consistency?', a: 'f(n\') = g(n) + c + h(n\') ≥ g(n) + h(n) = f(n), by the consistency inequality h(n) ≤ c + h(n\').' },
      ],
      pitfalls: [
        'Admissible ≠ consistent. Memorise which property is needed for tree-search vs graph-search.',
        'A* with an inadmissible heuristic can still terminate and look right — but the answer may be suboptimal.',
        'Greedy and A* have different goal-test placement conventions; AIMA tests on generation for some, expansion for others — check before answering.',
      ],
    },

    {
      id: 'local',
      slug: 'local-search',
      module: 'Module 1 · Search',
      title: 'Local search',
      oneLiner: 'Hill climbing, simulated annealing, beam search — when you only need a state, not a path.',
      sections: [
        {
          id: 'overview',
          title: 'When the path doesn\'t matter',
          blocks: [
            { kind: 'md', body: `Local search keeps a **single current state** (or a small population), and improves it by local moves. No frontier, no path memory.

Right when:
- The path is irrelevant (n-queens, scheduling, VLSI layout — you want the final configuration).
- The state space is huge and complete-state.
- You can compute an **objective** $f(s)$ on every state.` },
          ],
        },
        {
          id: 'hillclimb',
          title: 'Hill climbing',
          blocks: [
            { kind: 'md', body: `Move to the best neighbour. Stop when no neighbour improves $f$.

**Failure modes:**
- **Local maxima** — neighbours are all worse, but global max is elsewhere.
- **Plateaux** — neighbours are equal; you wander aimlessly.
- **Ridges** — sequence of local maxima oriented diagonally to the available moves.

**Variants:**
- **Stochastic hill climbing** — pick a random uphill move (faster convergence on some problems).
- **First-choice** — generate successors one at a time, accept first improvement (good for huge branching).
- **Random restart** — run hill climbing many times from random starts; keep the best. If single-restart succeeds with probability $p$, expected restarts is $1/p$.` },
          ],
        },
        {
          id: 'annealing',
          title: 'Simulated annealing',
          blocks: [
            { kind: 'md', body: `Like hill climbing, but with a *temperature* $T$ that allows downhill moves with probability $e^{\\Delta E / T}$ (Metropolis criterion), with $\\Delta E < 0$ being the energy change for a worsening move.

$T$ is gradually decreased per a **cooling schedule**. At high $T$ the walk is essentially random; at low $T$ it becomes hill climbing.

**Guarantee:** if $T$ decreases slowly enough, finds the global optimum with probability 1. In practice, schedules are heuristic.` },
          ],
        },
        {
          id: 'beam',
          title: 'Local beam search',
          blocks: [
            { kind: 'md', body: `Keep $k$ states (not one). Generate all successors of all $k$. Keep the $k$ best.

Not the same as $k$ parallel hill climbings — information shares: useful states attract resources.

**Stochastic beam search:** pick $k$ successors with probability proportional to fitness (anticipates genetic algorithms).` },
          ],
        },
        {
          id: 'ga',
          title: 'Genetic algorithms (brief)',
          blocks: [
            { kind: 'md', body: `Population of states, each encoded as a *chromosome*. Each step: select parents (fitness-proportional), **crossover** (combine substrings), **mutate** (random bit flip).

Use cases: where the encoding admits meaningful crossover and the fitness landscape is rugged.

**Critique:** in many domains, GAs are slower than well-tuned simulated annealing or hill-climbing-with-restarts. Use when crossover is genuinely informative.` },
            { kind: 'callout', variant: 'whatif', title: 'You forget to mutate', body: 'No mutation = no escape from local optima collectively reached by the population; you converge prematurely.' },
          ],
        },
      ],
      flashcards: [
        { id: 'l1', q: 'Three failure modes of hill climbing.', a: 'Local maxima, plateaux, ridges.' },
        { id: 'l2', q: 'Simulated annealing acceptance probability for a worse move?', a: 'exp(ΔE/T) where ΔE<0. High T → mostly random walk; low T → hill climbing.' },
        { id: 'l3', q: 'Difference between local beam search and k independent hill climbs?', a: 'Beam shares successor candidates; successful states attract resources.' },
      ],
    },
  ],
};
