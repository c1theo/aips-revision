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
      examples: [
        {
          id: 'fex1', difficulty: 'basic', marks: 4,
          question: 'Formulate the 8-puzzle as a search problem. State all five components.',
          answer: `**States.** Any of the $9!/2 = 181440$ reachable permutations of tiles 0..8 (where 0 represents the blank), arranged in a $3 \\times 3$ grid.

**Initial state.** Any specified starting configuration.

**Actions.** Move the blank Up / Down / Left / Right (subject to the blank not being on the relevant edge). It is conventionally the *blank* that moves, not the tiles — this gives a uniform branching factor of 2–4.

**Transition model.** \`Result(s, a)\` swaps the blank with the tile in the direction of action $a$.

**Goal test.** Tiles in the canonical sorted configuration (e.g. blank then 1..8 in reading order).

**Action cost.** $1$ per move (so path cost = number of moves).

State-space size $9!/2$ comes from parity: only half of all permutations are reachable from any given start.`,
        },
        {
          id: 'fex2', difficulty: 'intermediate', marks: 6,
          question: 'For Romania route-finding (cities + roads with km), compare the *incremental* formulation against an alternative where states are *sequences of cities visited so far*. Which is preferable and why?',
          answer: `**Incremental (standard).** State = current city. Transition = drive to a neighbour. State space size = number of cities. Constraint: optimal path forbids cycles, but the search algorithm needs to handle repeated states.

**Sequence formulation.** State = ordered list of cities visited. Transition = append a neighbour. State space size = infinite (sequences can be arbitrarily long) and exponential in path length even after restricting to acyclic.

**Preferred:** the incremental formulation. It has a tiny state space, allows graph-search to share work across paths that re-converge at the same city, and supports A* with a heuristic like straight-line distance.

The sequence formulation is wasteful: two paths that arrive at Bucharest via different routes are *different states*, so the search cannot consolidate them. Graph-search optimisations (closed list, transposition tables) become useless.

**General rule:** make the state the minimum information needed to predict the future, not a record of the past.`,
        },
        {
          id: 'fex3', difficulty: 'advanced', marks: 8,
          question: 'Vacuum cleaner agent: 2 rooms (A, B), each clean or dirty. Robot in one room at a time. Actions: Left, Right, Suck. Draw the state space graph, then list the actions in the shortest plan from "robot in A, both dirty" to "both clean".',
          answer: `**States** (8 total): each is a triple (robot location, A clean?, B clean?).

Label states as e.g. \`A-DD\` = robot in A, A dirty, B dirty.

**Transitions:**
- From any state, \`Left\` → robot in A (no-op if already in A).
- From any state, \`Right\` → robot in B.
- \`Suck\` in A: marks A clean. In B: marks B clean.

**Compact graph (locations and dirt status):**

\`\`\`
A-DD ─Suck─ A-CD ─Right─ B-CD ─Suck─ B-CC  ✓
   │           │            │
 Right       Right         Left
   │           │            │
B-DD ─Suck─ B-DC ─Left──── A-DC ─Suck─ A-CC ✓ (alt goal)
\`\`\`

(Two goal states because the robot's final location doesn't matter for "both clean".)

**Shortest plan from A-DD to all-clean** (3 actions):
$$\\text{Suck} \\to \\text{Right} \\to \\text{Suck}$$

Trace:
- A-DD → \`Suck\` → A-CD
- A-CD → \`Right\` → B-CD
- B-CD → \`Suck\` → B-CC ✓

Path cost 3. (Alternative: Right, Suck, Left, Suck — cost 4 — is suboptimal.)`,
        },
        {
          id: 'fex4', difficulty: 'intermediate', marks: 5,
          question: 'Distinguish "tree-search" and "graph-search" formulations. Give one search problem where each is appropriate.',
          answer: `**Tree-search:** maintains only a frontier; can revisit states reached by different paths, generating them as separate tree nodes.

**Graph-search:** additionally maintains a *reached* (closed) set so each state is expanded at most once.

**When tree-search is fine:**
- The state space *is* a tree (no cycles, no repeated states) — e.g. partial assignments for n-queens row by row.
- Memory is critically tight and re-exploration is cheap.

**When graph-search is essential:**
- The state space has cycles or many paths converge — e.g. route finding on a road network, the 8-puzzle.

**Penalty for choosing wrong:** tree-search on a graph with cycles is *not complete* (can loop forever on cyclic paths) and explores exponentially more nodes on graphs with many merging paths.`,
        },
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
      examples: [
        {
          id: 'uex1', difficulty: 'basic', marks: 6,
          question: 'For a tree with branching factor $b=10$ and shallowest goal at depth $d=4$: state BFS\'s and IDS\'s time and space complexity (numbers, not big-O) and explain why IDS is preferred when memory is constrained.',
          answer: `**BFS.** Time = $1 + b + b^2 + b^3 + b^4 = 11{,}111$ nodes generated. Space = $O(b^d) = 10{,}000$ (the frontier at depth 4).

**IDS.** Time = $(d+1) \\cdot 1 + d \\cdot b + (d-1) \\cdot b^2 + (d-2) \\cdot b^3 + 1 \\cdot b^4 = 5 + 40 + 300 + 2{,}000 + 10{,}000 = 12{,}345$ nodes.

So IDS does roughly **11% more work** for huge savings in memory: it needs only $O(bd) = 40$ frontier nodes vs BFS's $10{,}000$.

**Why preferred under memory pressure:** the deepest iteration dominates (geometric series), so the overhead of re-expanding shallower levels stays bounded by a small constant factor $b/(b-1) \\approx 1.1$. With $b=10$, that's 10% overhead for a 250× memory saving.`,
        },
        {
          id: 'uex2', difficulty: 'intermediate', marks: 7,
          question: 'Run UCS on this graph from S to G. Edges (undirected): S-A=2, S-B=5, A-C=3, B-C=1, B-G=8, C-G=4. Show the priority queue after each expansion. State the optimal path and cost.',
          answer: `Notation: \`(node, g)\` in the priority queue, expanded in increasing $g$ order. Goal test on **expansion**.

\`\`\`
Start:    PQ = [(S, 0)]
Expand S: generate (A, 2), (B, 5).            PQ = [(A, 2), (B, 5)]
Expand A: generate (C, 5), (S, 4) [skip - in reached].
                                              PQ = [(C, 5), (B, 5)]
Expand C: generate (G, 9), (A, 8) [skip], (B, 6) [worse than 5, skip].
                                              PQ = [(B, 5), (G, 9)]
Expand B: generate (S, 10) [skip], (C, 6) [worse than 5, skip], (G, 13) [worse, skip].
                                              PQ = [(G, 9)]
Expand G: goal — return.
\`\`\`

**Optimal path:** S → A → C → G with cost $2 + 3 + 4 = 9$.

Note: UCS expanded G only when it was the minimum-$g$ node in the queue. Generating G via B earlier (cost 13) didn't terminate the search.`,
        },
        {
          id: 'uex3', difficulty: 'advanced', marks: 8,
          question: 'Prove that BFS is *not* optimal in general when action costs are non-uniform. Show a counterexample and explain why IDS suffers the same flaw.',
          answer: `**Counterexample.** Consider:

\`\`\`
       S
      / \\
  c=1/   \\c=100
    /     \\
   A       G   (shallow but expensive)
   |c=1
   G'         (deep but cheap)
\`\`\`

State S, two children: A (edge cost 1) and G (cost 100, but G is a goal). A has child G' which is also a goal (edge cost 1).

BFS expands by depth: at depth 1 it finds G with path cost 100. With **goal-test-on-generation**, BFS returns G immediately with cost 100.

But the optimal solution is $S \\to A \\to G'$ with cost $1 + 1 = 2$.

**Why IDS suffers the same flaw.** IDS = iterated depth-limited DFS, and DFS at any given depth finds the first goal it hits, not the cheapest. With depth limit 1, IDS finds G at cost 100. Both rely on path-*length* as the optimality criterion.

**Fix:** use UCS (or A*) which orders the frontier by $g$ (path cost), not depth.`,
        },
        {
          id: 'uex4', difficulty: 'intermediate', marks: 5,
          question: 'When can DFS be made complete? When can it be made optimal?',
          answer: `**Complete.** DFS is complete in a **finite** state space, provided we use **graph-search** (closed-list / visited-set) to prevent cycling. In infinite spaces (e.g. infinite integer state spaces), no fixed-depth DFS is complete.

**Optimal.** DFS is **not optimal** under any standard convention — it returns the first goal it encounters, which may be deep and expensive.

To recover both:
- **For completeness without graph-search:** use **iterative deepening DFS (IDS)** — it visits each depth fresh, can't cycle within a single iteration, and terminates at the first depth where a goal exists.
- **For optimality:** add a cost ordering (use UCS or A*) — pure DFS will never be optimal.

The distinction matters: DFS is useful when **memory is the bottleneck and any solution is fine**, e.g. SAT solving (DPLL), classical AI planning where solution depth bounds are known.`,
        },
        {
          id: 'uex5', difficulty: 'advanced', marks: 6,
          question: 'Why is bidirectional BFS attractive for problems with a unique start and unique goal, but problematic for problems with many goal states?',
          answer: `**Attraction.** Bidirectional BFS searches forward from $s_0$ and backward from $g$ simultaneously, meeting in the middle. Total work is roughly $2 \\cdot b^{d/2}$ instead of $b^d$ — **exponentially better in $d$**.

For Romania route-finding (one start, one goal), this is a clear win.

**Why "many goals" breaks it.** The backward search must be initialised with the goal set. If there are many goals (or worse, the goal is *implicitly* defined by a predicate like "no two queens attack"), the backward frontier starts huge and grows uncontrollably. The "meet in the middle" advantage disappears.

**Other complications:**
1. **Reverse-action problem.** Predecessor states aren't always derivable from the transition model — many problems have many possible predecessors per state (so backward branching factor $\\gg$ forward).
2. **Memory.** Both halves of the search must store their explored set, doubling memory.
3. **Intersection check.** Detecting a "meet" requires fast set membership against the opposite frontier.

In practice, bidirectional search is used in route planning (where both directions are well-defined and goal is a single state) but rare in puzzle/CSP-style problems.`,
        },
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
      examples: [
        {
          id: 'iex1', difficulty: 'basic', marks: 4,
          question: 'For the 8-puzzle, give two admissible heuristics and explain why one *dominates* the other.',
          answer: `**$h_1$ — Misplaced tiles.** Number of tiles not in their goal position (excluding blank).

**$h_2$ — Manhattan distance (sum of city-block distances).** For each tile, $|x - x^*| + |y - y^*|$ to its goal position; summed over all tiles.

**Both admissible** because:
- A tile out of place must be moved at least once → $h_1 \\le h^*$.
- A tile must travel at least its Manhattan distance, one step per move → $h_2 \\le h^*$.

**$h_2$ dominates $h_1$.** For every state, $h_2(n) \\ge h_1(n)$: each misplaced tile contributes at least 1 to both, but a tile far from its goal contributes more to $h_2$.

**Consequence:** A* with $h_2$ expands no more nodes than with $h_1$ (modulo tie-breaking). Empirically on 15-puzzle, $h_2$ is dramatically better — orders of magnitude fewer nodes.`,
        },
        {
          id: 'iex2', difficulty: 'intermediate', marks: 8,
          question: 'Prove that if $h$ is consistent, then for any node $n$ and any successor $n\'$ of $n$, $f(n\') \\ge f(n)$ — i.e. $f$-values are non-decreasing along any path.',
          answer: `**Setup.** Let $n'$ be the successor of $n$ via action $a$ with cost $c(n, a, n')$. Then $g(n') = g(n) + c(n, a, n')$.

**Consistency** says: $h(n) \\le c(n, a, n') + h(n')$.

**Compute $f(n')$:**

$$f(n') = g(n') + h(n') = g(n) + c(n, a, n') + h(n')$$

By consistency, $c(n, a, n') + h(n') \\ge h(n)$. Substituting:

$$f(n') \\ge g(n) + h(n) = f(n) \\quad \\blacksquare$$

**Significance.** Because $f$ is non-decreasing, the first time A* expands a node it has the optimal $g$-value: any other path arriving at the same node will appear later in the priority queue with $f$-value $\\ge$ this first one. So **graph-search A*** doesn't need to reopen closed nodes — and is optimal.

Without consistency (admissible only), A* graph-search may close a node prematurely and miss the optimal path; recovery requires *reopening* closed nodes or using tree-search.`,
        },
        {
          id: 'iex3', difficulty: 'advanced', marks: 10,
          question: 'Prove that A* tree-search is optimal under admissibility. State the assumptions you need.',
          answer: `**Assumptions.**
1. Heuristic $h$ is admissible: $h(n) \\le h^*(n)$ for all $n$ where $h^*(n)$ is the true cheapest cost to a goal.
2. Action costs are non-negative.
3. There exists at least one solution with finite cost $C^*$.

**Proof by contradiction.** Suppose A* returns a goal $G_2$ with $g(G_2) > C^*$ (a suboptimal solution).

Let $n$ be any node currently on the frontier that lies on an optimal path to an optimal goal $G^*$. Such an $n$ exists: A* hasn't yet expanded any optimal goal, so the optimal path's frontier extension is somewhere on the frontier.

Consider $f$-values:

$$f(n) = g(n) + h(n)$$

By admissibility, $h(n) \\le h^*(n)$, where $h^*(n)$ is the true cost from $n$ to $G^*$ along the optimal path. So:

$$f(n) \\le g(n) + h^*(n) = C^*$$

(The right-hand side is the total cost of the optimal path through $n$, which equals $C^*$ since $n$ is on an optimal path.)

For the goal $G_2$:

$$f(G_2) = g(G_2) + h(G_2) = g(G_2) > C^*$$

(Since $h(G_2) = 0$ by admissibility and $G_2$ is a goal.)

Combining: $f(n) \\le C^* < f(G_2)$.

But A* always expands the node with smallest $f$. So A* would have expanded $n$ before $G_2$ — contradicting A*'s choice. $\\blacksquare$

**Note.** This proves *tree-search* optimality. Graph-search additionally requires consistency (else closed-list bookkeeping may discard a better path).`,
        },
        {
          id: 'iex4', difficulty: 'intermediate', marks: 6,
          question: 'Design an admissible heuristic for the *travelling salesman problem* (visit every city exactly once and return to start) using the *relaxed-problem* technique. Justify admissibility.',
          answer: `**Relaxed problem.** Drop the constraint that each city is visited exactly once and the tour is a single cycle. What remains is: find a set of edges so that every city is connected.

The cheapest such set is a **Minimum Spanning Tree (MST)** of the city graph.

**Heuristic:** $h(\\text{partial tour ending at city } c) = \\text{MST cost of unvisited cities, plus a shortest-edge from } c \\text{ and back to start}$.

A common simpler version:

$$h(n) = \\text{MST cost of unvisited cities including the start and current end}$$

**Admissibility.** Any TSP tour visiting the remaining cities is a *connected subgraph* spanning them, with cost $\\ge$ the MST cost (MST is by definition the cheapest spanning subgraph). So:

$$h(n) \\le \\text{true cost-to-complete} = h^*(n)$$

**Practical note.** This is the classical example of relaxation-derived admissibility. MST computation is $O(V^2)$ per heuristic evaluation, which may dominate runtime — a trade-off A* practitioners weigh constantly.`,
        },
        {
          id: 'iex5', difficulty: 'advanced', marks: 8,
          question: 'You have heuristics $h_1$, $h_2$, $h_3$, all admissible. Construct a new admissible heuristic that dominates all three. Prove dominance.',
          answer: `**Construction.** Define $h(n) = \\max(h_1(n), h_2(n), h_3(n))$.

**Admissibility.** Each $h_i$ is admissible: $h_i(n) \\le h^*(n)$. Therefore:

$$h(n) = \\max_i h_i(n) \\le \\max_i h^*(n) = h^*(n)$$

So $h$ is admissible.

**Dominance.** For each $i$: $h(n) = \\max_j h_j(n) \\ge h_i(n)$. So $h$ dominates each $h_i$.

**Optimality consequence.** A* using $h$ expands no more nodes than A* using any $h_i$ (excluding tie-breaking).

**Practical caveat.** Each heuristic evaluation now costs the sum of evaluating all three. If the $h_i$ are expensive (e.g. pattern databases), the per-node cost may outweigh the search-tree reduction. Profile before committing.

**Extension.** Same trick works for *consistent* heuristics: $\\max$ of consistent heuristics is consistent (sketch: triangle inequality holds componentwise; the max preserves it).`,
        },
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
      examples: [
        {
          id: 'lex1', difficulty: 'intermediate', marks: 6,
          question: 'For 8-queens, why is the complete-state formulation (8 queens, one per column, reassign) better than the incremental (place one queen at a time)? Which algorithm does each formulation suggest?',
          answer: `**Complete-state.** 8 variables, one per column, each with domain $\\{1..8\\}$ = row index. State space size $8^8 = 16{,}777{,}216$. Always a complete (if not consistent) configuration.

**Incremental.** Place queens left-to-right, backtracking on conflicts. State space is the *partial* assignment tree.

**Why complete-state wins for n-queens:**
1. Allows **local search** (min-conflicts, hill climbing) — fast in practice; min-conflicts solves million-queens in ~50 moves on average.
2. The state space is **structured benignly** for local search: most random starts are "near" a solution; few deep local optima.

**Which suggests which algorithm:**
- Complete-state → **local search** (min-conflicts is the killer app).
- Incremental → **backtracking search** with FC or MAC.

For *n*-queens specifically, local search dominates for large $n$. For small $n$, both are fine; backtracking + MRV/FC will also find all solutions quickly.`,
        },
        {
          id: 'lex2', difficulty: 'advanced', marks: 8,
          question: 'Simulated annealing with cooling schedule $T_k = T_0 / \\log(1+k)$ — what guarantee does this give? Why is exponential cooling $T_k = T_0 \\alpha^k$ used in practice?',
          answer: `**Geman & Geman (1984) theoretical result.** For Markov-chain Monte-Carlo on a finite state space, if $T_k$ decreases as

$$T_k \\ge \\frac{C}{\\log(1 + k)}$$

for a problem-dependent constant $C$, then the chain converges to the global optimum in probability as $k \\to \\infty$.

**Practical issue.** The constant $C$ is huge for non-trivial problems, and the cooling is glacially slow — requires astronomical iteration counts.

**Exponential cooling** ($T_k = T_0 \\alpha^k$, $\\alpha \\in [0.95, 0.99]$) is used because:
1. **Empirically much faster** — converges in tractable time.
2. The Geman-Geman bound is *worst-case*. Real cost landscapes have structure exploiting which is faster.
3. **No optimality guarantee**, but well-tuned exponential schedules find near-optimal solutions reliably on problems like TSP, scheduling, VLSI placement.

**Trade-off summary:** $\\log$-schedule → optimal but impractical; exponential → fast but no guarantee. Engineering practice tunes $\\alpha$ and starting $T_0$ per problem.`,
        },
        {
          id: 'lex3', difficulty: 'intermediate', marks: 5,
          question: 'For genetic algorithms, why is mutation rate kept low (often 1/length)? What happens if it\'s too high or too low?',
          answer: `**Target rate:** $\\approx 1/L$ where $L$ = chromosome length. Each offspring suffers $\\sim 1$ bit-flip on average.

**Too low (e.g. 0).** Population diversity collapses. Once all individuals share a defect, crossover cannot generate variants — the GA stalls at a local optimum determined by the initial population.

**Too high (e.g. 0.5).** Each offspring is essentially randomised. Selection cannot lock in good substructures because mutation destroys them faster than crossover can combine them. GA degenerates into random search.

**Why $1/L$ specifically:** rough information-theoretic argument — you want to perturb one feature on average. If $L=100$, then $p_m \\approx 0.01$ gives one expected flip per chromosome, preserving most of the parent's structure while injecting innovation.

Real-world practice often tunes $p_m$ adaptively (decrease over generations) or per-locus (high $p_m$ for "noisy" loci).`,
        },
      ],
    },
  ],
};
