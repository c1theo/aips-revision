import type { Module } from './profiles';
import type { VizKey } from '../types';

// Topic playbooks — fallback content for the question router.
// When the router can't pick a single algorithm with confidence, it shows
// the relevant topic playbook: general rules + steps + pitfalls + a
// recommended answer skeleton. Covers every topic the module touches.

export interface Pointer {
  kind: 'viz' | 'topic' | 'example';
  key: string;          // VizKey, topic slug, or example id
  label: string;
}

export interface Playbook {
  id: string;
  topic: string;            // human-readable topic name
  module: Module;
  subtask: string;          // 'Model the problem as a CSP', etc.
  whenItApplies: string[];  // signals to look for
  steps: string[];          // numbered general procedure
  pitfalls: string[];       // common mistakes
  pointers: Pointer[];      // related vizes / topics / examples
  answerTemplate: string;   // markdown skeleton the user can fill in
  triggers: string[];       // free-text triggers (lowercased substring match)
}

// Convenience: build markdown bullet lists in answer templates without escaping headaches.
const NL = '\n';

export const playbooks: Playbook[] = [

  // ───────────────────────────────────────────────────────────────────
  //  SEARCH
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'search-formulate',
    topic: 'Search', module: 'search', subtask: 'Formulate a search problem',
    whenItApplies: [
      'The question asks you to set up a search problem rather than run it.',
      'Words like "formulate", "state space", "initial state", "goal test", "actions", "transition model".',
    ],
    steps: [
      'Identify the **state representation** — what data structure captures a single configuration?',
      'Define the **initial state**.',
      'Define the **goal test** — a predicate over states.',
      'List the **actions** available in each state and their **transition model**.',
      'Give the **step cost** (per-action) and the **path cost** (sum along a path).',
      'Optionally: estimate the state-space size to argue about feasibility.',
    ],
    pitfalls: [
      'Mixing up state with action — actions transition between states.',
      'Forgetting that the same state can be reached by different paths (graph search needs explored set).',
      'Defining goal test as a single goal state when actually any state satisfying some predicate is acceptable.',
    ],
    pointers: [
      { kind: 'topic', key: 'search-formulation', label: 'Topic: Search formulation' },
      { kind: 'viz', key: 'SearchGrid', label: 'Visualiser: pathfinding grid' },
    ],
    answerTemplate:
`**State representation.** _<describe the data structure>_

**Initial state.** _<the starting config>_

**Goal test.** _<predicate on states>_

**Actions.** _<list, with preconditions>_

**Transition model.** $\\text{Result}(s, a) = ${'\\ldots'}$

**Step cost.** _<per-action cost>_

**Path cost.** Sum of step costs along the path.

**State-space size (estimate).** _<rough count>_`,
    triggers: ['formulate', 'state space', 'initial state', 'goal test', 'transition model'],
  },
  {
    id: 'search-run',
    topic: 'Search', module: 'search', subtask: 'Trace a search algorithm',
    whenItApplies: [
      'You are asked to run BFS / DFS / UCS / Greedy / A* on a small problem.',
      'Question shows a small graph or grid and asks for expansion order or final path.',
    ],
    steps: [
      'List the **initial state** in the frontier.',
      'Pop according to the algorithm\'s rule (FIFO=BFS, LIFO=DFS, lowest g=UCS, lowest h=Greedy, lowest f=A*).',
      'If popped node is goal → terminate; report the path.',
      'Otherwise: mark **explored**; **expand** children (one row per child).',
      'For each child: compute path cost g(n); if A*, also compute heuristic h(n) and f(n) = g(n) + h(n).',
      'Add child to frontier *unless* already in explored set with equal-or-better cost.',
      'Repeat until goal found or frontier empty (= no solution).',
    ],
    pitfalls: [
      'Tree-search vs graph-search: tree-search may revisit; graph-search uses an explored set.',
      'A* graph-search needs **consistency** (not just admissibility) for guaranteed optimality without re-opening.',
      'Greedy is **not optimal**, not even with admissible h — it ignores g(n).',
      'Ties in f: most implementations break by h or insertion order — state which.',
    ],
    pointers: [
      { kind: 'viz', key: 'SearchGrid', label: 'Visualiser: pathfinding grid' },
      { kind: 'viz', key: 'SearchTree', label: 'Visualiser: tree-search expansion order' },
      { kind: 'topic', key: 'informed-search', label: 'Topic: Informed search' },
      { kind: 'topic', key: 'uninformed-search', label: 'Topic: Uninformed search' },
    ],
    answerTemplate:
`**Algorithm.** _<BFS / DFS / UCS / Greedy / A*>_

**Frontier ordering.** _<FIFO / LIFO / lowest g / lowest f>_

| Step | Pop | g(n) | h(n) | f(n) | Children added |
|---|---|---|---|---|---|
| 1 | _start_ | 0 | _h(start)_ | _h(start)_ | _<list>_ |
| 2 | … | … | … | … | … |

**Goal reached at step _<n>_.**

**Path.** _<sequence of nodes>_ with cost _<value>_.`,
    triggers: ['bfs', 'dfs', 'ucs', 'a*', 'a star', 'greedy', 'pathfinding', 'shortest path', 'expansion order'],
  },
  {
    id: 'search-local',
    topic: 'Search', module: 'search', subtask: 'Local search (HC / SA / GA)',
    whenItApplies: [
      'Question mentions hill climbing, simulated annealing, random restart, sideways move, genetic algorithm.',
      'You\'re asked to find a "good" solution without proving optimality.',
    ],
    steps: [
      'Identify the **state** and a **neighbourhood function** (small perturbations).',
      'Define the **objective function** to maximise / minimise.',
      'Hill climbing: at each step, move to the **best neighbour**; stop at a local max.',
      'Simulated annealing: pick a **random neighbour**; accept always if better, else with probability $\\exp(-\\Delta E / T)$; cool T per schedule.',
      'Random restart: when stuck, start from a new random state.',
      'Report best state found, value, and iteration count.',
    ],
    pitfalls: [
      'Plain HC gets stuck on plateaus and ridges, not just local maxima.',
      'SA temperature schedule matters — too fast cooling = HC, too slow = random walk.',
      'GAs need crossover + mutation; SA with a population is NOT a GA.',
    ],
    pointers: [
      { kind: 'viz', key: 'HillClimbSA', label: 'Visualiser: hill climb & simulated annealing' },
      { kind: 'viz', key: 'MinConflicts', label: 'Visualiser: min-conflicts (CSP local search)' },
    ],
    answerTemplate:
`**State.** _<representation>_

**Objective.** _<function to optimise>_

**Neighbourhood.** _<perturbation>_

**Algorithm.** _<HC / SA / GA / random-restart>_

**Trace.**
| Iteration | State | Value | Accepted? | Notes |
|---|---|---|---|---|
| 0 | _initial_ | … | yes | seed |
| 1 | … | … | … | … |

**Best state.** _<value, count of iterations to find>_`,
    triggers: ['hill climbing', 'simulated annealing', 'local search', 'random restart', 'genetic algorithm'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  ADVERSARIAL
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'adv-minimax',
    topic: 'Adversarial', module: 'adversarial', subtask: 'Trace minimax (with or without α-β)',
    whenItApplies: [
      'A game tree is given (leaves with utility values, branching factor, depth).',
      'Words: "minimax", "alpha-beta", "ply", "MAX/MIN", "backed-up value".',
    ],
    steps: [
      'Label every internal node by depth: root = MAX, level 1 = MIN, alternating.',
      'Compute leaves\' utility values (given).',
      'Bottom-up: at MIN nodes take the **minimum** of children; at MAX nodes take the **maximum**.',
      'For α-β: track $\\alpha$ (best MAX so far on the path) and $\\beta$ (best MIN so far). Initially $\\alpha = -\\infty, \\beta = +\\infty$.',
      'At MAX: update $\\alpha = \\max(\\alpha, \\text{child value})$; if $\\alpha \\ge \\beta$ → **β-cut**, prune remaining siblings.',
      'At MIN: update $\\beta = \\min(\\beta, \\text{child value})$; if $\\alpha \\ge \\beta$ → **α-cut**, prune remaining siblings.',
      'Report root value and the move that achieves it.',
    ],
    pitfalls: [
      'α-β returns the SAME value as plain minimax — pruning only saves work, not correctness.',
      'Pruning depends on **move order**. Worst case: $O(b^d)$. Best case (perfect order): $O(b^{d/2})$.',
      'Don\'t prune at the root — you still need to know which move achieves the root value.',
      'Remember which player gets which type: root is MAX; at any depth $i$, node type alternates.',
    ],
    pointers: [
      { kind: 'viz', key: 'MinimaxTree', label: 'Visualiser: minimax & alpha-beta' },
      { kind: 'topic', key: 'minimax', label: 'Topic: minimax' },
      { kind: 'topic', key: 'alpha-beta', label: 'Topic: alpha-beta' },
    ],
    answerTemplate:
`**Tree shape.** Depth _<d>_, branching _<b>_, root = MAX.

**Leaves (left → right):** _<list>_

**Bottom-up evaluation.**

- MIN level (depth $d-1$): $\\min(\\ldots) = \\ldots$
- … (continue per level) …
- Root (MAX): $\\max(\\ldots) = \\textbf{<root value>}$

**α-β cuts** (if pruning on):
- β-cut at node _<id>_: $\\alpha = \\ldots \\ge \\beta = \\ldots$
- …

**Best move at root:** _<child>_`,
    triggers: ['minimax', 'alpha-beta', 'alpha beta', 'game tree', 'ply', 'backed-up'],
  },
  {
    id: 'adv-mcts',
    topic: 'Adversarial', module: 'adversarial', subtask: 'Trace MCTS / UCT',
    whenItApplies: [
      'MCTS, UCT, UCB1, rollout, simulation, exploration constant.',
    ],
    steps: [
      'Initialise tree with just the root.',
      'Repeat for $N$ iterations: **Selection** (descend by UCB1: $\\bar X_i + C\\sqrt{\\ln N_p / N_i}$) → **Expansion** (add one new child) → **Simulation** (random rollout to a terminal) → **Backpropagation** (increment N, update mean along the path).',
      'After $N$ iterations: recommend the **most-visited** child of the root (robust child).',
    ],
    pitfalls: [
      'UCB1\'s $C = \\sqrt 2$ is only theoretically optimal for rewards in [0,1]. Re-tune for other scales.',
      'Selection follows UCB1 *down* the tree, not greedy-best-mean.',
      'Backprop updates ALL ancestors of the simulated leaf, with the simulation\'s outcome.',
    ],
    pointers: [
      { kind: 'viz', key: 'MCTSTree', label: 'Visualiser: MCTS / UCT' },
      { kind: 'topic', key: 'mcts', label: 'Topic: MCTS' },
    ],
    answerTemplate:
`**Setup.** Root = _<initial state>_, exploration constant $C = \\sqrt 2$.

**Iteration trace.**
| Iter | Selected path | Expanded leaf | Simulation result | Updated counts |
|---|---|---|---|---|
| 1 | … | … | … | … |

**After $N$ iterations:** root child visit counts: _<list>_. Recommended action: **_<highest-visit child>_**.`,
    triggers: ['mcts', 'monte carlo tree search', 'uct', 'ucb1', 'rollout'],
  },
  {
    id: 'adv-stochastic',
    topic: 'Adversarial', module: 'adversarial', subtask: 'Stochastic game (expectimax)',
    whenItApplies: ['Chance nodes, dice, probability of outcomes, backgammon-style game.'],
    steps: [
      'Build the game tree with **CHANCE** nodes interleaved between MAX/MIN nodes.',
      'Bottom-up: MAX = max, MIN = min, CHANCE = $\\sum p_i \\cdot v_i$ (expected value).',
      'Report root value and best action.',
    ],
    pitfalls: [
      'α-β does NOT extend cleanly to chance nodes (no monotonicity); use *interval-* or *star*-pruning variants.',
      'Don\'t forget to weight by probability at CHANCE nodes.',
    ],
    pointers: [{ kind: 'viz', key: 'Expectimax', label: 'Visualiser: expectimax' }],
    answerTemplate:
`**Tree.** _<draw or list>_, with chance probabilities at CHANCE nodes.

**Evaluation (bottom-up).**
- CHANCE → $E = \\sum_i p_i v_i = \\ldots$
- MIN / MAX as usual

**Root value.** _<>_. **Best move.** _<>_.`,
    triggers: ['expectimax', 'chance node', 'stochastic game'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  CSP — model
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'csp-model',
    topic: 'CSP', module: 'csp', subtask: 'Model a problem as a CSP',
    whenItApplies: [
      'Words like "write a CSP", "model as a CSP", "formulate as a constraint problem".',
      'Real-world scenario (scheduling, allocation, colouring) without an explicit constraint listing.',
    ],
    steps: [
      'List the **decisions** — what does the modeller need to choose? These become variables.',
      'Give each variable a **domain** (finite, discrete in this module).',
      'Translate each requirement into a **constraint**. Decide arity: unary (one var) / binary (two vars) / global (≥3 vars).',
      'Prefer **global constraints** (AllDifferent, sum, gcc) where applicable — better propagation than decomposing into binary.',
      'Add **symmetry-breaking** constraints if the problem has obvious symmetries (lex-ordering, value precedence).',
      'Add **implied constraints** that are logically entailed but speed up propagation.',
      'Sanity-check: does some non-solution satisfy every constraint? Add the missing one.',
    ],
    pitfalls: [
      'Adding a constraint that is *not* entailed when claiming it is implied → loses solutions.',
      'Decomposing AllDifferent into pairwise ≠ — propagation is weaker; misses pigeonhole infeasibility.',
      'Forgetting to enforce that the chosen modelling pattern fits (function vs relation vs partition).',
    ],
    pointers: [
      { kind: 'topic', key: 'cp-modelling', label: 'Topic: CP modelling' },
      { kind: 'viz', key: 'EssencePrime', label: 'Visualiser: Essence Prime editor' },
      { kind: 'viz', key: 'CSPLab', label: 'Visualiser: CSPLab — test your model' },
    ],
    answerTemplate:
`**Variables.** $X_1, X_2, \\ldots$ with meaning: _<one line each>_

**Domains.** $D(X_i) = \\{\\ldots\\}$

**Constraints.**
1. $C_1$: _<formal statement>_ — _<why>_
2. $C_2$: _<…>_ — _<…>_
3. AllDifferent($\\ldots$) — _<why this captures the requirement>_

**Implied / symmetry-breaking.** _<list if any>_

**Sanity check.** _<argue no non-solution satisfies all constraints; no real solution is excluded>_`,
    triggers: ['model as csp', 'write a csp', 'write out the csp', 'formulate the csp', 'cp model', 'modelling pattern'],
  },
  {
    id: 'csp-nc-ac',
    topic: 'CSP', module: 'csp', subtask: 'Enforce node + arc consistency',
    whenItApplies: [
      '"Enforce global node consistency", "enforce arc consistency", "apply AC-3 / AC-4 / AC-2001".',
      'You are given a CSP and asked for the post-propagation domains.',
    ],
    steps: [
      '**Phase 1 — NC.** For every unary constraint, remove violating values from the variable\'s domain. Iterate until no more removals.',
      '**Phase 2 — AC.** Initialise the queue with every directed arc $(X_i, X_j)$ — each binary constraint contributes 2 arcs.',
      'Pop an arc, call REVISE($X_i, X_j$): for each $v \\in D(X_i)$, drop $v$ if no $w \\in D(X_j)$ supports the constraint.',
      'If $D(X_i)$ shrunk, re-enqueue all $(X_k, X_i)$ for $k \\ne j$ — never the outgoing arc you just processed.',
      'If $D(X_i) = \\emptyset$ → **infeasibility**. Stop.',
      'Continue until queue empty → **arc-consistent fixpoint** reached.',
      'For AC-3.1 / AC-2001: maintain $\\text{Last}[X_i, v, X_j]$ — the last support found. Resume from that index next time.',
    ],
    pitfalls: [
      'Arc consistency is NOT solving — singleton-domain CSPs may still be unsat; tree-CSPs always solvable.',
      'REVISE only prunes the **first** argument of the arc.',
      'Don\'t forget the **reverse** arc — each binary constraint is two arcs.',
      'NC and AC at "global" level mean *every* variable / *every* arc is consistent (not just one).',
    ],
    pointers: [
      { kind: 'viz', key: 'AC3', label: 'Visualiser: AC-3 stepper (with manual queue + revision counts)' },
      { kind: 'viz', key: 'AC4', label: 'Visualiser: AC-4 (counter-based)' },
      { kind: 'viz', key: 'AC2001', label: 'Visualiser: AC-2001 / AC-3.1 (Last data structure)' },
      { kind: 'viz', key: 'CSPLab', label: 'Visualiser: CSPLab — full pipeline' },
      { kind: 'topic', key: 'csp-inference', label: 'Topic: CSP inference & AC-3' },
    ],
    answerTemplate:
`**Phase 1 — global node consistency.**

- $C_i$ (unary): remove _<values>_ from $D(X_j)$.
- … (one bullet per unary constraint)

Post-NC: $D(X_1) = \\{\\ldots\\}, \\ldots$

**Phase 2 — global arc consistency.**

Initial queue: _<list arcs>_.

| # | Arc | REVISE outcome | Domains after |
|---|---|---|---|
| 1 | $(X_i, X_j)$ | remove _<v>_ from $D(X_i)$ → re-enqueue _<arcs>_ | $\\ldots$ |
| 2 | … | … | … |

**Final domains.** $D(X_1) = \\{\\ldots\\}, \\ldots$

**Arcs revised more than once:** _<list with counts>_`,
    triggers: ['enforce node consistency', 'enforce arc consistency', 'ac-3', 'ac3', 'ac-4', 'ac4', 'ac-2001', 'ac2001', 'ac-3.1', 'ac3.1', 'arc consistency', 'node consistency', 'last data structure'],
  },
  {
    id: 'csp-bt-fc-mac',
    topic: 'CSP', module: 'csp', subtask: 'Search the CSP (backtracking + FC / MAC)',
    whenItApplies: [
      '"Search for a solution", "perform backtracking", "use FC", "use MAC", "d-way", "2-way".',
      'A small CSP plus a variable/value ordering plus a propagation choice.',
    ],
    steps: [
      'Apply NC + (optional) AC-3 at the root to shrink domains before search.',
      '**Pick variable** — top-to-bottom / MRV / degree / MRV + degree tie-break / custom.',
      '**Pick value** — increasing / decreasing / LCV / custom.',
      '**Branch.** d-way: one child per remaining value. 2-way: LEFT child $X = v$, RIGHT child $X \\ne v$.',
      'After each decision: validate against the partial assignment. If propagation = FC, prune neighbours\' domains (one step). If = MAC, run AC-3 to fixpoint on affected arcs.',
      'On wipeout (some $D(X) = \\emptyset$) → fail, backtrack and try next value/branch.',
      'On all-assigned + consistent → solution. Report.',
      'Compare node counts across propagation settings to argue tradeoffs.',
    ],
    pitfalls: [
      'Pure backtracking (no propagation) **must still check consistency** of each new decision against the existing assignment — failure to do so wastes work.',
      'MAC > FC > pure BT in pruning strength but per-node cost rises.',
      'd-way and 2-way explore the same complete tree but in different orders; 2-way\'s RIGHT branch propagates immediately via AC.',
      'LCV finds *one* solution faster; MRV is fail-first.',
    ],
    pointers: [
      { kind: 'viz', key: 'CSPLab', label: 'Visualiser: CSPLab — full BT/FC/MAC pipeline' },
      { kind: 'viz', key: 'ForwardCheck', label: 'Visualiser: generic FC + BT' },
      { kind: 'viz', key: 'NQueens', label: 'Visualiser: n-queens with MRV/LCV/FC' },
      { kind: 'topic', key: 'backtracking', label: 'Topic: Backtracking & heuristics' },
    ],
    answerTemplate:
`**Settings.** Propagation = _<None / FC / MAC>_, Branching = _<d-way / 2-way>_, Var order = _<…>_, Val order = _<…>_.

**Pre-search.** NC + AC-3 → $D(X_1) = \\ldots$ etc.

**Search trace.**

| # | Depth | Decision | Outcome | Reason |
|---|---|---|---|---|
| 1 | 0 | _<root expansion>_ | continue | — |
| 2 | 1 | $X = v$ | ✓ continue / ✗ backtrack | _<propagation result>_ |
| … | … | … | … | … |

**Solution.** $X_1 = \\ldots, X_2 = \\ldots$ (or **no solution exists**).

**Comparison.** Nodes expanded: _<N>_. Backtracks: _<K>_. With _<other propagation>_, would have been _<>_.`,
    triggers: ['backtracking', 'forward checking', 'fc', 'mac', 'maintaining arc consistency', 'd-way', '2-way', 'mrv', 'lcv', 'degree heuristic'],
  },
  {
    id: 'csp-heuristics',
    topic: 'CSP', module: 'csp', subtask: 'Choose / apply a CSP heuristic',
    whenItApplies: [
      'Question names a specific heuristic: MRV, degree, LCV, Geelen\'s promise, dom/wdeg, last-conflict, activity-based.',
      'Question asks "which value should be tried first?" or "which variable should be chosen next?"',
    ],
    steps: [
      '**Variable-ordering** (which variable to assign next):',
      '— MRV (minimum remaining values): smallest |D(X)|. **Fail-first.**',
      '— Degree: variable in most constraints to *unassigned* others. Tie-break MRV.',
      '— **dom/deg** or **dom/wdeg** (Boussemart 2004): minimise |D(X)| / wdeg(X). State of the art on benchmarks.',
      '— **Last-conflict**: after a backtrack, retry the variable that caused the failure as the next decision.',
      '— Activity-based / impact-based: dynamic priorities updated by propagation work.',
      '**Value-ordering** (which value to try first):',
      '— **LCV**: minimise the **sum** of values it rules out across neighbours.',
      '— **Geelen\'s promise**: maximise the **product** $\\prod_{Y} |\\{w \\in D(Y) : (v, w) \\text{ supports the constraint}\\}|$. A single zero factor reveals infeasibility immediately — strictly more powerful than LCV.',
      '— Solution counting: pick the value with the most local extensions to a satisfying assignment.',
      '**Combine** — real solvers chain several: e.g. dom/wdeg + Geelen + lex-tiebreak.',
    ],
    pitfalls: [
      'MRV with all-equal domains gives no information — fall back to degree or wdeg.',
      'LCV picks "least-constraining" *only* when you want one solution — if you need all solutions it actively wastes work.',
      'Promise differs from LCV: sum vs product. Product is harsher on neighbours that lose all support.',
      'wdeg starts at 0 — first few decisions are effectively random until weights accumulate.',
    ],
    pointers: [
      { kind: 'viz', key: 'CSPLab', label: 'Visualiser: CSPLab — toggle inc/dec/LCV/promise + MRV/degree/dom-wdeg' },
      { kind: 'topic', key: 'backtracking', label: 'Topic: backtracking & heuristics (incl. advanced-heuristics section)' },
    ],
    answerTemplate:
`**Heuristic chosen.** _<MRV / degree / LCV / Geelen's promise / dom-wdeg>_

**At this decision point.** Variable _<X>_, candidate values _<list>_.

**Computation per value.**
| value | sum ruled out (LCV) | product remaining (promise) | $|D|$ × neighbours |
|---|---|---|---|

**Order chosen.** _<v1, v2, …>_ (best first).

**Reasoning.** _<why this heuristic separates these candidates here>_`,
    triggers: ['mrv', 'lcv', 'degree heuristic', 'least constraining', 'geelen', 'promise heuristic', 'dom/wdeg', 'wdeg', 'weighted degree', 'last-conflict', 'activity-based', 'impact-based'],
  },
  {
    id: 'csp-tree-structure',
    topic: 'CSP', module: 'csp', subtask: 'Exploit problem structure',
    whenItApplies: [
      '"Tree-structured CSP", "cycle cutset", "tree decomposition", "directional arc consistency".',
      'The constraint graph is special-shaped.',
    ],
    steps: [
      'Draw the **constraint graph** — nodes = vars, edges = binary constraints.',
      'Classify: **tree** (n-1 edges, connected) / **cyclic** / **disconnected**.',
      '**Tree-CSP**: pick a root → topological order → apply DAC from leaves to root → assign in topological order. $O(nd^2)$.',
      '**Disconnected**: solve each component independently; combine.',
      '**Small cycle cutset $S$**: enumerate $|S|$-var assignments to $S$ ($d^{|S|}$ tries), each leaving a tree-CSP to solve.',
      '**Small treewidth $w$**: tree decomposition gives $O(n d^{w+1})$.',
    ],
    pitfalls: [
      'Tree-CSP requires only DAC (one pass), not full AC.',
      'Cutset conditioning is exponential in $|S|$ — only useful when $|S| \\ll n$.',
    ],
    pointers: [
      { kind: 'viz', key: 'TreeCSP', label: 'Visualiser: tree-CSP solver O(nd²)' },
      { kind: 'viz', key: 'ConstraintGraph', label: 'Visualiser: constraint graph' },
      { kind: 'topic', key: 'csp-structure', label: 'Topic: CSP structure' },
    ],
    answerTemplate:
`**Constraint graph.** Nodes _<list>_, edges _<list>_.

**Classification.** _<tree / cyclic / disconnected>_

**Approach.** _<DAC + assignment / cutset conditioning / tree decomposition>_

**Steps.**
1. Topological order: _<>_.
2. DAC pass from leaves: _<show shrinks>_.
3. Forward assignment: _<>_.

**Complexity.** $O(\\ldots)$.`,
    triggers: ['tree csp', 'tree-structured', 'cutset', 'tree decomposition', 'directional arc consistency'],
  },
  {
    id: 'csp-global-constraint',
    topic: 'CSP', module: 'csp', subtask: 'Reason about a global constraint (AllDifferent etc.)',
    whenItApplies: [
      'AllDifferent, gcc, table, element, sum constraints.',
      'Questions about GAC vs pairwise / bounds consistency.',
    ],
    steps: [
      'Identify the global constraint and its scope.',
      'For AllDifferent: build the bipartite **var-value graph**; find a maximum matching. Feasible iff matching saturates the variables (Hall\'s condition).',
      'For GAC: remove any value-edge NOT in some maximum matching.',
      'Pairwise ≠ alone misses **pigeonhole** infeasibility (e.g. $n$ vars in $n-1$ values).',
    ],
    pitfalls: [
      'AC on AllDifferent (decomposed pairwise) is strictly weaker than GAC via Régin.',
      'Bounds consistency on AllDifferent only checks domain endpoints — weaker still.',
    ],
    pointers: [
      { kind: 'viz', key: 'ReginAllDiff', label: "Visualiser: Régin's GAC for AllDifferent" },
      { kind: 'topic', key: 'beyond-ac3', label: 'Topic: Beyond AC-3 / GAC' },
    ],
    answerTemplate:
`**Global constraint.** _<name and scope>_.

**Bipartite graph.** Variables on one side, values on the other; edges = current domain memberships.

**Maximum matching.** Size _<k>_; need size _<n vars>_.

**Verdict.** _<feasible — every var matched / infeasible — Hall's condition fails on subset S = …>_.

**Edges removed by GAC.** _<list — none in any max matching>_.`,
    triggers: ['alldifferent', 'all different', 'regin', "régin", 'gac', 'global constraint', 'pairwise', 'pigeonhole'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  LOGIC
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'logic-truth-table',
    topic: 'Logic', module: 'logic', subtask: 'Build a truth table / classify a formula',
    whenItApplies: [
      'Classify as tautology / contradiction / contingent.',
      'Find satisfying assignments by exhaustion.',
    ],
    steps: [
      'List the $n$ propositional variables.',
      'Build $2^n$ rows of assignments.',
      'For each subformula, compute its value per row.',
      'Compute the top formula per row.',
      'Classify: all True → tautology, all False → contradiction, mixed → contingent.',
    ],
    pitfalls: [
      'Operator precedence: ¬ > ∧ > ∨ > → > ↔.',
      '$A \\to B$ is equivalent to $\\neg A \\lor B$ — often easier to compute.',
    ],
    pointers: [{ kind: 'viz', key: 'TruthTable', label: 'Visualiser: truth table builder' }],
    answerTemplate:
`**Variables.** $p, q, r$ — $2^n = \\ldots$ rows.

| $p$ | $q$ | … | sub | top |
|---|---|---|---|---|
| T | T | T | _<>_ | _<>_ |

**Verdict.** _<tautology / contradiction / contingent>_.

**Satisfying assignments:** _<list rows>_ (if contingent).`,
    triggers: ['truth table', 'tautology', 'contradiction', 'satisfiable formula'],
  },
  {
    id: 'logic-entailment',
    topic: 'Logic', module: 'logic', subtask: 'Prove KB ⊨ α (entailment)',
    whenItApplies: [
      'KB and a query α; "prove", "show that", "by resolution".',
    ],
    steps: [
      'Convert KB ∪ {¬α} to CNF.',
      'Apply **resolution**: at each step pick two clauses with complementary literals, resolve to a new clause.',
      'If you derive the **empty clause** $\\Box$ → KB ⊨ α.',
      'If saturated without deriving $\\Box$ → KB ⊭ α.',
      'Alternative for Horn KB: forward chaining or backward chaining (polytime).',
    ],
    pitfalls: [
      'Resolution is **refutation-complete** but not deduction-complete — always prove by negation.',
      'Don\'t forget to add ¬α to the KB before refuting.',
      'In Horn forward chaining: only derive facts that appear as conclusions of definite clauses.',
    ],
    pointers: [
      { kind: 'viz', key: 'Resolution', label: 'Visualiser: resolution refutation' },
      { kind: 'viz', key: 'HornChain', label: 'Visualiser: forward / backward chaining' },
      { kind: 'topic', key: 'entailment', label: 'Topic: entailment' },
    ],
    answerTemplate:
`**Goal.** Prove KB ⊨ α (i.e. show KB ∪ {¬α} is UNSAT).

**CNF of KB ∪ {¬α}.**
1. $C_1 = \\ldots$
2. $C_2 = \\ldots$

**Resolution steps.**
| # | Resolved on | Parents | New clause |
|---|---|---|---|
| 1 | $p$ | $C_1, C_2$ | _<>_ |
| 2 | … | … | … |

Derived $\\Box$ at step _<n>_ → KB ⊨ α. ✓`,
    triggers: ['entail', 'kb ⊨', 'kb |=', 'resolution proof', 'refutation', 'horn'],
  },
  {
    id: 'logic-cnf-tseitin',
    topic: 'Logic', module: 'logic', subtask: 'CNF conversion / Tseitin transformation',
    whenItApplies: [
      'Convert a formula to CNF for a SAT solver.',
      'Question mentions Tseitin / equisatisfiable / fresh variables.',
    ],
    steps: [
      '**Equivalence CNF (4 steps):** 1) eliminate $\\leftrightarrow, \\to$, 2) push $\\neg$ inwards via De Morgan, 3) distribute $\\lor$ over $\\land$, 4) collect clauses.',
      'Equivalence CNF can be exponential.',
      '**Tseitin (equisatisfiable):** for each subformula $\\varphi$ introduce a fresh variable $t_\\varphi$, add clauses for $t_\\varphi \\leftrightarrow \\text{(operator over children)}$, finalise with the top variable as a unit clause.',
      'Result: linear-size CNF, **equisatisfiable** (model can be recovered) but not equivalent.',
      'Plaisted-Greenbaum: halve the clauses if subformula appears only positively/negatively in parent.',
    ],
    pitfalls: [
      'Equivalence CNF can blow up — always note this when asked about size.',
      'Tseitin variables are AUXILIARY — don\'t treat them as original problem variables.',
      'PG only correct if polarity tracking is exhaustive.',
    ],
    pointers: [
      { kind: 'viz', key: 'CNFEncoder', label: 'Visualiser: CNF 4-step conversion' },
      { kind: 'viz', key: 'TseitinEncoder', label: 'Visualiser: Tseitin transformation' },
    ],
    answerTemplate:
`**Input formula.** $\\varphi = \\ldots$

**CNF (4-step).**
Step 1: eliminate $\\to, \\leftrightarrow$ → $\\ldots$
Step 2: push $\\neg$ inwards → $\\ldots$
Step 3: distribute $\\lor$ over $\\land$ → $\\ldots$
Step 4: clauses → $\\ldots$

**Tseitin (equisatisfiable).**
- Fresh variables: $t_1, t_2, \\ldots$ for subformulas $\\psi_1, \\psi_2, \\ldots$
- Equivalence clauses: $t_i \\leftrightarrow \\ldots$
- Top: unit clause $(t_{\\text{root}})$

**Sizes.** Equivalence CNF: _<k>_ clauses. Tseitin: _<k\'>_ clauses. Ratio: _<>_×.`,
    triggers: ['cnf', 'convert to cnf', 'tseitin', 'equisatisfiable', 'plaisted'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  SAT
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'sat-dpll',
    topic: 'SAT', module: 'sat', subtask: 'Trace DPLL on a CNF',
    whenItApplies: [
      'Small CNF given, asked to determine SAT / UNSAT.',
      'Words "DPLL", "unit propagation", "pure literal", "decide".',
    ],
    steps: [
      'Pre-process: **unit propagation** (UP) — for any unit clause $(\\ell)$, set $\\ell = T$, simplify.',
      '**Pure-literal elimination** — variable appearing in only one polarity, set to satisfy.',
      'If empty clause appears → conflict, backtrack to last decision, try opposite polarity.',
      'If all clauses satisfied → SAT. Report model.',
      'Otherwise: **decide** an unassigned variable (any heuristic), set value, recurse.',
      'Document decision stack with depth labels.',
    ],
    pitfalls: [
      'UP can cascade — propagate to fixpoint after every assignment.',
      'Distinguish *decision* from *propagation* in your trace; they\'re at different depths conceptually.',
      'Pure literal elimination is OPTIONAL but always safe (and quick).',
    ],
    pointers: [
      { kind: 'viz', key: 'DPLL', label: 'Visualiser: DPLL trace' },
      { kind: 'topic', key: 'dpll', label: 'Topic: DPLL' },
    ],
    answerTemplate:
`**CNF.** _<list clauses>_

**Trace.**
| Step | Type | Action | Resulting state |
|---|---|---|---|
| 1 | UP | _<>_ | _<>_ |
| 2 | decide | $x_i = T$ | depth 1 |
| 3 | UP | … | … |

**Verdict.** SAT with model _<>_ / UNSAT.`,
    triggers: ['dpll', 'unit propagation', 'pure literal', 'sat solver'],
  },
  {
    id: 'sat-cdcl',
    topic: 'SAT', module: 'sat', subtask: 'Trace CDCL (conflict analysis + clause learning)',
    whenItApplies: ['CDCL, 1-UIP, learnt clause, backjump, implication graph.'],
    steps: [
      'Run UP + decisions like DPLL until a conflict (some clause becomes empty).',
      'Build the **implication graph** at the conflict.',
      'Find the **1-UIP** — the unique implication point closest to the conflict.',
      'Cut the graph at 1-UIP → the literals on the reason side form the **learnt clause**.',
      '**Backjump** to the second-largest decision level among the learnt-clause literals.',
      'Add learnt clause to the database; continue UP from the backjump level.',
    ],
    pitfalls: [
      '1-UIP = closest to **conflict**, not closest to the decision.',
      'Backjump level = SECOND-largest decision level in the learnt clause.',
      'A learnt clause can entirely replace the original conflict reason in future solves.',
    ],
    pointers: [
      { kind: 'viz', key: 'CDCL', label: 'Visualiser: CDCL with implication graph' },
      { kind: 'topic', key: 'cdcl', label: 'Topic: CDCL' },
    ],
    answerTemplate:
`**Decisions made.** $d_1, d_2, \\ldots$ at levels $1, 2, \\ldots$.

**Conflict reached at level $k$.** Conflicting clause: _<>_

**Implication graph (around conflict).** _<list reasons>_

**1-UIP cut.** Pivot literal: _<>_. Learnt clause: $(\\ldots)$.

**Backjump to level _<k-1 or earlier>_.** Continue UP.`,
    triggers: ['cdcl', '1-uip', 'learnt clause', 'backjump', 'implication graph', 'conflict-driven'],
  },
  {
    id: 'sat-walksat',
    topic: 'SAT', module: 'sat', subtask: 'Local-search SAT (WALKSAT)',
    whenItApplies: ['WALKSAT, stochastic SAT, noise probability, random flip.'],
    steps: [
      'Start from a random assignment.',
      'Repeat: pick a **random unsatisfied clause**; with probability $p$ flip a random variable in it; otherwise flip the variable whose flip satisfies the most clauses (greedy).',
      'Terminate when all clauses satisfied or iteration cap reached.',
      'WALKSAT cannot prove UNSAT — use only when SAT is likely.',
    ],
    pitfalls: [
      'No restart? Then a bad seed can stall. Modern variants restart often.',
      'Choosing $p = 0$ → pure greedy, gets stuck. $p = 1$ → pure random walk.',
    ],
    pointers: [{ kind: 'viz', key: 'WalkSAT', label: 'Visualiser: WALKSAT' }],
    answerTemplate:
`**Initial assignment (random).** _<>_

**Iterations.**
| # | Picked clause | Flip kind | Var flipped | # unsat after |
|---|---|---|---|---|
| 1 | _<>_ | greedy / random | $x_3$ | _<>_ |

**Result.** Satisfied at iteration _<k>_ with model _<>_ / hit cap.`,
    triggers: ['walksat', 'stochastic local search', 'noise probability'],
  },
  {
    id: 'sat-2sat',
    topic: 'SAT', module: 'sat', subtask: '2-SAT in polynomial time',
    whenItApplies: ['2-SAT, implication graph, SCC, Tarjan, Kosaraju, polytime SAT.'],
    steps: [
      'Each 2-clause $(\\ell_1 \\lor \\ell_2)$ → two implications $\\neg \\ell_1 \\to \\ell_2$ and $\\neg \\ell_2 \\to \\ell_1$.',
      'Build implication graph with nodes for every literal.',
      'Run Tarjan/Kosaraju SCC.',
      'UNSAT iff some variable $x$ has $x$ and $\\neg x$ in the **same SCC**.',
      'SAT: assign each variable based on the **reverse topological order** of SCCs (later SCC → True).',
    ],
    pitfalls: [
      'Don\'t prove 2-SAT polytime via DPLL — use SCC argument.',
      'Implication graph has $2n$ nodes and $2m$ edges, runtime is linear.',
    ],
    pointers: [{ kind: 'viz', key: 'TwoSAT', label: 'Visualiser: 2-SAT via SCC' }],
    answerTemplate:
`**Clauses.** _<list>_

**Implication graph edges.** _<list both implications per clause>_

**SCCs.** $\\{\\ldots\\}, \\{\\ldots\\}, \\ldots$

**Check.** _<no variable has x and ¬x in same SCC ⇒ SAT / some variable does ⇒ UNSAT>_

**Model (if SAT).** _<assignment via reverse-topo of SCCs>_`,
    triggers: ['2-sat', '2sat', 'implication graph', 'tarjan', 'scc'],
  },
  {
    id: 'sat-phase',
    topic: 'SAT', module: 'sat', subtask: 'Phase transition / hardness analysis',
    whenItApplies: ['Phase transition, hardness peak, easy-hard-easy, clause/variable ratio.'],
    steps: [
      'Pick a value of $n$ (variables) and a range of $m/n$ (clause-variable ratio).',
      'Sample many random $k$-SAT formulas per ratio.',
      'For each: solve, record SAT/UNSAT and solver work (decisions, conflicts).',
      'Plot $P(\\text{SAT})$ and median work vs $m/n$.',
      '3-SAT critical ratio $\\approx 4.27$ — peak hardness.',
    ],
    pitfalls: ['Hardness peak ≠ phase transition exactly — close but tunable by problem class.'],
    pointers: [{ kind: 'viz', key: 'PhaseTransition', label: 'Visualiser: SAT phase transition' }],
    answerTemplate:
`**Setup.** $n = $ _<>_, $m/n$ swept over _<range>_, samples per ratio _<>_.

**Results.**
| $m/n$ | $P(\\text{SAT})$ | median work |
|---|---|---|

**Observations.**
- Crossover at $m/n \\approx \\ldots$.
- Hardest at $m/n \\approx 4.27$ for 3-SAT.`,
    triggers: ['phase transition', 'hardness peak', 'easy-hard-easy', '4.27'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  ESSENCE PRIME
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'csp-essence',
    topic: 'CSP', module: 'csp', subtask: 'Essence Prime model (Savile Row)',
    whenItApplies: ['Essence Prime, Essence′, Savile Row, "matrix indexed by", Nightingale.'],
    steps: [
      'Choose abstract types: parameters (`given`) and decision variables (`find`).',
      'Variables are **matrices indexed by integer ranges** — no set/function/multiset/partition (those are Essence-only).',
      'Encode complex types: set-of-k-elements → matrix + AllDifferent + lex; function $A → B$ → matrix indexed by $A$ with entries in $B$; partition → matrix `part[i]` = block id.',
      'Use `such that` for constraints; group with `\\` and `/` and `=` etc.',
      'Test small instances via Savile Row + Minion.',
    ],
    pitfalls: [
      'Don\'t use `set`/`function`/`multiset` in Essence Prime — they\'re Essence-only constructs.',
      'Lex-ordering on representative variables breaks set-of-k symmetries.',
    ],
    pointers: [
      { kind: 'viz', key: 'EssencePrime', label: 'Visualiser: Essence Prime editor' },
      { kind: 'topic', key: 'essence-prime', label: 'Topic: Essence Prime' },
    ],
    answerTemplate:
`\`\`\`
given n : int(1..)
given <data> : matrix indexed by [int(1..n)] of int(1..)

find x : matrix indexed by [int(1..n)] of int(1..n)

such that
  allDiff(x),
  forAll i : int(1..n-1) . x[i] < x[i+1]
\`\`\``,
    triggers: ['essence prime', "essence'", 'savile row', 'minion', 'matrix indexed by'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  SEARCH — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'search-heuristic-design',
    topic: 'Search', module: 'search', subtask: 'Design a heuristic; argue admissibility / consistency / dominance',
    whenItApplies: ['Question mentions heuristic, admissible, consistent, monotonic, dominate, Manhattan, Euclidean, relaxed problem, pattern database.'],
    steps: [
      'Choose / state your heuristic $h(n)$.',
      '**Admissibility**: prove $h(n) \\le h^*(n)$ — the true distance to goal — for every $n$. Standard trick: relax the problem (drop a constraint) and show $h$ is the cost of an optimal solution to the relaxation.',
      '**Consistency** (a.k.a. monotonicity): prove $h(n) \\le c(n, n\') + h(n\')$ for every successor $n\'$. Consistency ⇒ admissibility.',
      '**Dominance**: $h_2$ dominates $h_1$ iff $h_2(n) \\ge h_1(n)$ for every $n$, both admissible. A dominating heuristic expands no more nodes than the dominated one.',
      '**Max-of-admissibles**: if $h_1, h_2$ admissible, so is $\\max(h_1, h_2)$ — strictly dominates both.',
      '**Pattern databases** / sub-problem heuristics: solve a relaxed sub-problem exhaustively, store costs in a table. Admissible by construction.',
    ],
    pitfalls: [
      'Admissibility ≠ consistency: an admissible heuristic can be non-consistent (creates trouble for A* graph-search).',
      'Consistency is the property that guarantees A* with graph-search is optimal without re-opening closed nodes.',
      'Manhattan distance is consistent for unit-cost grids; if you change costs, re-check.',
    ],
    pointers: [
      { kind: 'topic', key: 'informed-search', label: 'Topic: informed search' },
      { kind: 'viz', key: 'SearchGrid', label: 'Visualiser: A* with selectable heuristic' },
    ],
    answerTemplate:
`**Heuristic.** $h(n) = $ _<formula or description>_

**Admissibility argument.** $h$ is the cost of an optimal solution to the **relaxed problem** $P\'$ (we dropped constraint _<X>_). Therefore $h(n) \\le h^*(n)$ for every $n$. ✓

**Consistency check.** For every successor $n\'$ via action $a$: $h(n) \\le c(n, n\') + h(n\')$. _<argue / show>_.

**Dominance.** Comparing to $h_1$: $h(n) \\ge h_1(n)$ everywhere → dominates.

**Effective branching factor $b^*$.** $b^* \\approx \\ldots$ (smaller is better).`,
    triggers: ['heuristic', 'admissible', 'consistent', 'manhattan distance', 'euclidean', 'pattern database', 'dominance', 'relaxed problem', 'monotonic'],
  },
  {
    id: 'search-complexity',
    topic: 'Search', module: 'search', subtask: 'Complexity / optimality / completeness analysis',
    whenItApplies: ['What is the time / space complexity?', 'Is BFS / DFS / IDS / A* complete / optimal?'],
    steps: [
      'State the search strategy.',
      'For tree-search, give time and space in $O(b^d)$ where $b$ = branching factor, $d$ = solution depth.',
      'Completeness: BFS / IDS / UCS (positive costs) / A* (finite branching) — yes. DFS — no on infinite trees.',
      'Optimality: BFS optimal if uniform costs; UCS / A* (admissible) optimal in general.',
      'Memory: BFS / UCS / A* $O(b^d)$ space → prohibitive. IDS / DFS $O(bd)$.',
      'Variants: IDA*, RBFS, SMA* reduce memory at extra time cost.',
    ],
    pitfalls: [
      'A* graph-search needs CONSISTENCY for optimality (not just admissibility).',
      'Greedy best-first is neither complete nor optimal in general.',
      'Bidirectional search complexity $O(b^{d/2})$ when both fringes meet — but needs an explicit goal state.',
    ],
    pointers: [
      { kind: 'topic', key: 'informed-search', label: 'Topic: informed search' },
      { kind: 'topic', key: 'uninformed-search', label: 'Topic: uninformed search' },
      { kind: 'viz', key: 'ComplexityTable', label: 'Visualiser: complexity reference table' },
    ],
    answerTemplate:
`**Algorithm.** _<>_

**Branching factor $b$.** _<>_. **Depth $d$.** _<>_.

**Time complexity.** $O(\\ldots)$
**Space complexity.** $O(\\ldots)$

**Completeness.** _<yes / no — argue>_
**Optimality.** _<yes / no — argue>_

**Trade-off.** _<which dimension is the bottleneck>_`,
    triggers: ['complexity', 'completeness', 'optimal', 'time complexity', 'space complexity', "what is the worst case", 'ids', 'iterative deepening', 'ida*', 'rbfs', 'sma*', 'bidirectional'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  ADVERSARIAL — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'adv-evaluation',
    topic: 'Adversarial', module: 'adversarial', subtask: 'Design an evaluation function (cut-off games)',
    whenItApplies: ['Static evaluator, evaluation function, leaf heuristic, cut-off, depth limit in game tree.'],
    steps: [
      'Identify features of a position that correlate with win likelihood (e.g. material, mobility, king safety).',
      'Weight them: $\\text{eval}(s) = \\sum_i w_i f_i(s)$.',
      'Calibrate weights from games or by hand.',
      'Pair with **cut-off depth** $d$ and **quiescence search** to avoid the horizon effect (stop only when the position is quiet).',
      'For zero-sum games, eval should be 0 at draw, positive for MAX-favoured, negative for MIN-favoured.',
    ],
    pitfalls: [
      'Horizon effect: a quick eval at fixed depth can wildly misjudge mid-tactic positions. Use **quiescence search** to extend only "noisy" moves (captures, checks).',
      'Don\'t fold cut-off depth into the eval — keep depth control separate from material counting.',
    ],
    pointers: [
      { kind: 'topic', key: 'imperfect-realtime', label: 'Topic: imperfect / real-time decisions' },
      { kind: 'viz', key: 'MinimaxTree', label: 'Visualiser: minimax + α-β' },
    ],
    answerTemplate:
`**Features.** _<list>_

**Linear evaluator.** $\\text{eval}(s) = \\sum_i w_i f_i(s)$ with weights _<>_.

**Cut-off depth.** _<d>_.

**Quiescence policy.** _<which moves extend the search beyond d>_`,
    triggers: ['evaluation function', 'eval(', 'static evaluator', 'cut-off depth', 'horizon effect', 'quiescence'],
  },
  {
    id: 'adv-move-ordering',
    topic: 'Adversarial', module: 'adversarial', subtask: 'Move ordering for α-β pruning',
    whenItApplies: ['Move ordering, killer heuristic, history heuristic, transposition table, iterative deepening for games.'],
    steps: [
      'Order moves so that the **likely-best move** is searched first — α-β prunes much more under good ordering ($O(b^{d/2})$ best vs $O(b^d)$ worst).',
      '**Killer heuristic**: store moves that caused β-cuts at sibling nodes; try them first.',
      '**History heuristic**: per-(move) running counter of how often it caused cuts; sort by counter.',
      '**Iterative deepening**: depth-$(d-1)$\'s best move becomes the FIRST move at depth $d$ — huge speed-up.',
      '**Transposition table**: same position reached via different orders gets cached. Hash via Zobrist.',
    ],
    pitfalls: [
      'Even perfect move ordering gives $O(b^{d/2})$ — α-β cannot do better than this.',
      'TT entries can collide; always verify the position hash matches.',
    ],
    pointers: [
      { kind: 'topic', key: 'imperfect-realtime', label: 'Topic: imperfect / real-time decisions' },
      { kind: 'viz', key: 'MinimaxTree', label: 'Visualiser: alpha-beta with toggleable ordering' },
    ],
    answerTemplate:
`**Move ordering.** _<list policy>_

**Killer / history / IDS impact.** _<>_

**TT entry.** $(value, depth, flag)$ where flag ∈ {EXACT, LOWER, UPPER}.`,
    triggers: ['move ordering', 'killer heuristic', 'history heuristic', 'transposition table', 'iterative deepening for games', 'zobrist'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  CSP — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'csp-k-consistency',
    topic: 'CSP', module: 'csp', subtask: 'Path consistency / k-consistency',
    whenItApplies: ['Path consistency, PC-2, k-consistency, strong k-consistency, Freuder, backtrack-free, width.'],
    steps: [
      '**$k$-consistency**: any consistent assignment to $k-1$ variables extends to a $k$-th.',
      '**Path consistency = 3-consistency.** For every pair $(X_i, X_j)$ consistent under $C_{ij}$, and every third variable $X_k$, there exists $v_k \\in D(X_k)$ consistent with both via $C_{ik}, C_{jk}$.',
      '**Strong $k$-consistency** = $i$-consistent for all $i \\le k$.',
      '**Theorem (Freuder 1985).** A CSP with **width $w$** (under some variable ordering) is backtrack-free if it is **strong $(w+1)$-consistent**.',
      'Tree-CSPs have width 1 → strong 2-consistency (= AC + NC) suffices.',
      'PC-2 algorithm enforces PC by storing allowed pairs per arc and updating on changes.',
    ],
    pitfalls: [
      'AC = 2-consistency, NOT strong 2-consistency. Strong 2-consistency requires NC + AC.',
      'PC is much more expensive than AC: $O(n^3 d^5)$ vs $O(c d^3)$.',
      'Strong $n$-consistency is solving (potentially exponential).',
    ],
    pointers: [
      { kind: 'topic', key: 'beyond-ac3', label: 'Topic: beyond AC-3' },
    ],
    answerTemplate:
`**Definition.** $k$-consistency means _<…>_. Path consistency = 3-consistency.

**Test on this CSP.** _<work through pairs + triples>_

**Width $w$ of this CSP under ordering _<>_:** $w = \\ldots$.

**Verdict.** _<strong-(w+1) holds / fails>_ → _<backtrack-free / not>_.`,
    triggers: ['path consistency', 'pc-2', 'k-consistency', 'strong k-consistency', 'freuder', 'width', 'backtrack-free'],
  },
  {
    id: 'csp-cbj',
    topic: 'CSP', module: 'csp', subtask: 'Conflict-directed backjumping (CBJ)',
    whenItApplies: ['Backjumping, conflict set, chronological vs intelligent backtracking.'],
    steps: [
      'Maintain a **conflict set** per variable: the prior variables whose assignment ruled out values you tried.',
      'On failure at $X_i$ (no value works), **backjump** to the most recent variable in $X_i$\'s conflict set, not to $X_{i-1}$.',
      'On backjump, merge the conflict set into the receiving variable\'s set.',
      'Combine with **nogood recording**: store the failure assignment to avoid revisiting it.',
    ],
    pitfalls: [
      'CBJ alone is weaker than CDCL: it doesn\'t LEARN clauses, only jumps levels.',
      'Implementation needs careful conflict-set propagation through search.',
    ],
    pointers: [
      { kind: 'topic', key: 'backtracking', label: 'Topic: backtracking & heuristics' },
      { kind: 'viz', key: 'CDCL', label: 'Visualiser: CDCL (SAT analogue with learning)' },
    ],
    answerTemplate:
`**Conflict set tracking.** At each $X_i$: $\\text{CS}(X_i) = \\{X_j : v_j$ ruled out at least one value of $X_i\\}$.

**Failure at $X_k$.** $\\text{CS}(X_k) = \\{X_{j_1}, \\ldots\\}$. Backjump to **most recent** $X_{j_*}$.

**Merge.** $\\text{CS}(X_{j_*}) \\cup= \\text{CS}(X_k) \\setminus \\{X_{j_*}\\}$.`,
    triggers: ['backjumping', 'cbj', 'conflict-directed', 'conflict set', 'nogood'],
  },
  {
    id: 'csp-global-other',
    topic: 'CSP', module: 'csp', subtask: 'GAC for sum / element / gcc / table',
    whenItApplies: ['Sum constraint, gcc (global cardinality), element, table constraint, bounds consistency.'],
    steps: [
      '**Sum constraint** $\\sum_i X_i = K$: enforce **bounds consistency** by computing min/max sums and pruning each $X_i$ to $[K - \\text{maxOthers}, K - \\text{minOthers}]$.',
      '**Element** $Z = X[Y]$: $Z$ is the $Y$-th entry of array $X$. Enforce: $Z \\in \\bigcup_{i \\in D(Y)} D(X_i)$ and similar for $Y$.',
      '**GCC (global cardinality)**: each value $v$ appears between $\\ell_v$ and $u_v$ times. Reduce to flow / bipartite matching.',
      '**Table** (extensional): scan the allowed tuples; remove values that don\'t appear in any. STR2 / STR3 are fast algorithms.',
      'Always note: bounds consistency is cheaper than GAC but weaker.',
    ],
    pitfalls: [
      'Decomposing a global into many binary $\\ne$ loses propagation.',
      'For very wide tables, table constraints can use too much memory — consider decomposition.',
    ],
    pointers: [
      { kind: 'topic', key: 'beyond-ac3', label: 'Topic: beyond AC-3 / GAC' },
      { kind: 'viz', key: 'ReginAllDiff', label: "Visualiser: Régin's AllDifferent" },
    ],
    answerTemplate:
`**Global constraint.** _<name>_.

**Propagator strength chosen.** GAC / bounds / range.

**Algorithm sketch.** _<steps for this constraint>_.

**Domains after.** _<>_`,
    triggers: ['sum constraint', 'gcc', 'global cardinality', 'element constraint', 'table constraint', 'bounds consistency', 'extensional'],
  },
  {
    id: 'csp-sac',
    topic: 'CSP', module: 'csp', subtask: 'Singleton arc consistency (SAC) as preprocessing',
    whenItApplies: ['Singleton arc consistency, SAC, preprocessing, dead value, probing.'],
    steps: [
      'For every variable $X$ and every value $v \\in D(X)$: tentatively set $X = v$, run AC-3.',
      'If AC-3 fails (domain wipeout) → $v$ is a **dead value**; remove from $D(X)$.',
      'Iterate to fixpoint.',
      'Stronger than AC, weaker than path consistency. Often used as preprocessing before search.',
    ],
    pitfalls: [
      'Cost: $O(n \\cdot d \\cdot \\text{AC-cost}) = O(n \\cdot d \\cdot c \\cdot d^3)$ — only worth it as preprocessing.',
      'SAC alone doesn\'t enforce path consistency.',
    ],
    pointers: [{ kind: 'topic', key: 'beyond-ac3', label: 'Topic: beyond AC-3' }],
    answerTemplate:
`**SAC preprocessing.**
For each variable $X$ and value $v \\in D(X)$: probe $X = v$ + run AC-3. Remove $v$ if wipeout.

**Dead values found.** _<list>_

**Final domains.** _<>_`,
    triggers: ['singleton arc consistency', 'sac', 'probing', 'dead value'],
  },
  {
    id: 'csp-symmetry',
    topic: 'CSP', module: 'csp', subtask: 'Symmetry breaking',
    whenItApplies: ['Symmetry, lex-leader, SBDS, GE-tree, symmetry-breaking constraints, equivalent solutions.'],
    steps: [
      'Identify the **symmetry group** of the CSP (rotations / reflections / variable swaps / value renaming).',
      'Add **lex-leader** constraints: force a canonical order on symmetric variables (e.g. $X_1 \\le X_2$).',
      'Or use dedicated algorithms: SBDS (dynamic), GE-tree (static), or domain-specific breaking.',
      'Symmetry breaking shrinks the search space by a factor up to $|G|$ (the symmetry group size).',
    ],
    pitfalls: [
      'Adding lex on non-symmetric variables loses solutions.',
      'Static lex-leader is simple but not always tight; SBDS gives a perfect symmetry break at solving cost.',
    ],
    pointers: [{ kind: 'topic', key: 'cp-modelling', label: 'Topic: CP modelling' }],
    answerTemplate:
`**Symmetry group.** _<describe>_, size $|G| = \\ldots$.

**Symmetry-breaking constraint added.** _<lex-leader expression>_

**Search-space reduction (theoretical).** Factor $\\approx |G|$.`,
    triggers: ['symmetry', 'lex-leader', 'lex leader', 'sbds', 'ge-tree', 'symmetric solutions'],
  },
  {
    id: 'csp-bucket',
    topic: 'CSP', module: 'csp', subtask: 'Bucket / variable elimination',
    whenItApplies: ['Bucket elimination, variable elimination, induced width, Dechter.'],
    steps: [
      'Pick a variable ordering $X_1, X_2, \\ldots, X_n$.',
      'For each variable $X_n, X_{n-1}, \\ldots$ in reverse: **join** all constraints containing $X_n$, **project out** $X_n$ → a new constraint over the remaining variables in $X_n$\'s bucket.',
      'After eliminating all but $X_1$, the remaining bucket gives the satisfying values of $X_1$.',
      'Forward pass: assign $X_1$, then $X_2$, etc., respecting the eliminated buckets.',
      'Cost: $O(n \\cdot d^{w^*+1})$ where $w^*$ = **induced width** along the ordering.',
    ],
    pitfalls: [
      'Bad ordering → huge induced width → exponential cost.',
      'Bucket elimination is *complete*, not incremental — re-do everything if domains change.',
    ],
    pointers: [{ kind: 'topic', key: 'csp-structure', label: 'Topic: CSP structure & tree-CSPs' }],
    answerTemplate:
`**Ordering.** $X_1, \\ldots, X_n$.

**Bucket trace.** For each $X_n \\downarrow X_1$: join → project.

**Induced width.** $w^* = \\ldots$.

**Solution recovery (forward pass).** $X_1 = \\ldots$, $X_2 = \\ldots$, …`,
    triggers: ['bucket elimination', 'variable elimination', 'induced width', 'dechter'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  LOGIC — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'logic-tableau',
    topic: 'Logic', module: 'logic', subtask: 'Tableau / analytic-tableau method',
    whenItApplies: ['Tableau, analytic tableau, signed formulas, branch-closure.'],
    steps: [
      'Start with the conjunction of premises and the negation of the goal.',
      'Apply tableau **expansion rules**: α-rules (conjunctive split into chain), β-rules (disjunctive split into branches).',
      'Close a branch when it contains $\\varphi$ and $\\neg \\varphi$.',
      'All branches closed ⇒ premises ⊨ goal. Open branch with all literals exhausted ⇒ countermodel.',
    ],
    pitfalls: [
      'Strategy matters: prioritise α-rules (no branching) before β-rules.',
      'Don\'t expand a literal — leave it as is.',
    ],
    pointers: [{ kind: 'viz', key: 'TruthTable', label: 'Visualiser: truth-table builder (alternative)' }],
    answerTemplate:
`**Tableau initial.** premises + ¬goal.

**Expansion trace.**
| Step | Rule | Formula expanded | Children |
|---|---|---|---|

**All branches closed?** _<yes ⇒ valid / no ⇒ countermodel from open branch>_`,
    triggers: ['tableau', 'analytic tableau', 'branch closure'],
  },
  {
    id: 'logic-semantics',
    topic: 'Logic', module: 'logic', subtask: 'Semantic vs syntactic entailment; soundness & completeness',
    whenItApplies: ['Soundness, completeness, semantic entailment, syntactic derivation, ⊨ vs ⊢.'],
    steps: [
      '**Semantic** $\\Gamma \\models \\varphi$: every model of $\\Gamma$ is a model of $\\varphi$. Definitional, checks all $2^n$ assignments.',
      '**Syntactic** $\\Gamma \\vdash \\varphi$: a derivation exists in the proof system (resolution, natural deduction, tableau).',
      '**Soundness:** $\\Gamma \\vdash \\varphi \\Rightarrow \\Gamma \\models \\varphi$ — what you can derive is true in every model.',
      '**Completeness:** $\\Gamma \\models \\varphi \\Rightarrow \\Gamma \\vdash \\varphi$ — every truth has a derivation.',
      'Propositional resolution is both sound and (refutation-)complete.',
    ],
    pitfalls: [
      'Resolution is refutation-complete, NOT deduction-complete; you can\'t directly derive every consequence.',
      'Don\'t confuse syntactic with semantic: ⊨ and ⊢ are different relations even when they coincide on a sound and complete proof system.',
    ],
    pointers: [{ kind: 'topic', key: 'entailment', label: 'Topic: entailment' }],
    answerTemplate:
`**Statement.** $\\Gamma \\models \\varphi$ vs $\\Gamma \\vdash \\varphi$.

**Argument.** _<semantic test via truth table / syntactic derivation>_

**Soundness / completeness claim.** _<>_`,
    triggers: ['soundness', 'completeness', 'semantic entailment', 'syntactic derivation', 'proof theory', 'model theory'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  SAT — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'sat-vsids',
    topic: 'SAT', module: 'sat', subtask: 'VSIDS / branching heuristics for CDCL',
    whenItApplies: ['VSIDS, variable state independent decaying sum, branching heuristic, activity, decay.'],
    steps: [
      'Maintain a per-variable **activity** counter.',
      'On each conflict analysis, **bump** the activity of variables appearing in the learnt clause.',
      'Periodically **decay** all activities by a factor (e.g. 0.95).',
      'Decision: pick the **unassigned variable with maximum activity** (set to its preferred polarity from phase-saving).',
    ],
    pitfalls: [
      'VSIDS is solver-internal — don\'t expect to compute it by hand on large instances.',
      'Phase-saving is a *separate* heuristic that picks True/False; complementary to VSIDS.',
    ],
    pointers: [{ kind: 'viz', key: 'CDCL', label: 'Visualiser: CDCL' }],
    answerTemplate:
`**Activity update.** After conflict $k$: bump $\\text{act}(x_i) \\mathrel{+}= 1$ for every $x_i$ in the learnt clause.

**Decay.** Multiply all activities by $\\rho = 0.95$ every $k$ conflicts.

**Decision.** Pick $\\arg\\max_x \\text{act}(x)$ among unassigned.

**Phase.** Use last-assigned polarity (phase-saving).`,
    triggers: ['vsids', 'branching heuristic sat', 'activity', 'phase saving', 'decay'],
  },
  {
    id: 'sat-preprocess',
    topic: 'SAT', module: 'sat', subtask: 'SAT preprocessing (BVE / subsumption / vivification)',
    whenItApplies: ['Bounded variable elimination, BVE, subsumption, self-subsuming resolution, blocked clause, vivification, probing.'],
    steps: [
      '**BVE**: eliminate $v$ by resolving every $C_+ \\ni v$ with every $C_- \\ni \\neg v$. Keep iff total clause count doesn\'t grow.',
      '**Subsumption**: clause $C \\subseteq D$ ⇒ delete $D$.',
      '**Self-subsuming resolution**: clauses $C \\cup \\{\\ell\\}$ and $C \\cup \\{\\neg \\ell\\}$ ⇒ shorten to $C$.',
      '**Blocked-clause elimination (BCE)**: $C$ blocked on $\\ell$ if every resolution on $\\ell$ produces a tautology ⇒ may remove $C$ (needs reconstruction stack for model).',
      '**Vivification**: probe each literal via UP to detect redundant literals; shorten clause.',
      '**Failed-literal probing**: if assigning $x = T$ leads to conflict under UP, learn $\\neg x$ as a unit clause.',
    ],
    pitfalls: [
      'BVE may explode if many resolvents; cap with a heuristic (Eén & Biere 2005).',
      'BCE preserves satisfiability but not equivalence — careful with model reconstruction.',
    ],
    pointers: [{ kind: 'topic', key: 'sat-problem', label: 'Topic: SAT' }],
    answerTemplate:
`**Preprocessing applied.** _<BVE / subsumption / SS-res / BCE / vivification / probing>_

**Before.** $n$ vars, $m$ clauses.
**After.** $n\'$ vars, $m\'$ clauses (Δ = _<>_%).

**Soundness note.** _<equiv / equisat>_`,
    triggers: ['bve', 'bounded variable elimination', 'subsumption', 'vivification', 'blocked clause', 'self-subsuming', 'sat preprocessing', 'probing'],
  },
  {
    id: 'sat-watched-literals',
    topic: 'SAT', module: 'sat', subtask: 'Two-watched literals (UP data structure)',
    whenItApplies: ['Watched literals, two-watched literals, efficient UP, BCP.'],
    steps: [
      'Each clause maintains TWO **watched literals**.',
      'When a literal is assigned False, find a new non-False watcher in the clause.',
      'If only one watcher remains and it\'s unassigned → that\'s a **unit propagation**.',
      'If both watchers are False → **conflict**.',
      'O(1) amortised work per propagation step — much faster than scanning every clause.',
    ],
    pitfalls: [
      'No need to update watchers on backtrack — that\'s the key elegance.',
      'A clause may be visited only when one of its watchers becomes False.',
    ],
    pointers: [{ kind: 'viz', key: 'CDCL', label: 'Visualiser: CDCL' }],
    answerTemplate:
`**Watcher invariant.** Each clause has 2 watchers; both are non-False (or one is the asserting literal).

**Propagation step.** When $w_1$ becomes False: scan clause for new watcher. If only the other watcher remains and is unassigned → unit-propagate it. Else if conflict → trigger conflict analysis.

**Speed.** O(1) amortised per literal flip.`,
    triggers: ['watched literals', 'two-watched literals', 'bcp', 'efficient unit propagation'],
  },
  {
    id: 'sat-restarts',
    topic: 'SAT', module: 'sat', subtask: 'Restart strategies & Luby sequence',
    whenItApplies: ['Restart, Luby sequence, geometric restart, heavy-tailed runtime.'],
    steps: [
      'Maintain a conflict / time budget per "run". Restart when exceeded.',
      'On restart: clear decisions but KEEP learnt clauses + activity.',
      'Schedules: **Luby** ($1, 1, 2, 1, 1, 2, 4, 1, 1, 2, 1, 1, 2, 4, 8, \\ldots$) — proven optimal for heavy-tailed runtime.',
      '**Geometric** (multiply budget by 1.5 each restart) — faster but no theory guarantee.',
      '**Local restarts** vs **global**: glucose / minisat-style.',
    ],
    pitfalls: [
      'Restart too eagerly → lose progress; too rarely → stuck in bad subtree.',
      'Phase-saving + restart combine well — explore different decision orders but keep value preferences.',
    ],
    pointers: [{ kind: 'topic', key: 'cdcl', label: 'Topic: CDCL' }],
    answerTemplate:
`**Restart policy.** _<Luby / geometric / static>_

**Budget unit.** _<conflicts / decisions / time>_

**Preserved across restart.** Learnt clauses, VSIDS activity, phases.`,
    triggers: ['restart', 'luby', 'geometric restart', 'heavy-tailed'],
  },
  {
    id: 'sat-cardinality',
    topic: 'SAT', module: 'sat', subtask: 'Cardinality / AtMost-k encodings',
    whenItApplies: ['AtMost-k, cardinality constraint, encoding cardinality in CNF, sequential counter, totalizer.'],
    steps: [
      'For "**at most $k$ of $x_1, \\ldots, x_n$ are true**", pick encoding:',
      '— **Pairwise (AMO only)**: $\\binom{n}{2}$ clauses, no aux vars. Simple.',
      '— **Sequential counter**: $O(nk)$ clauses + $O(nk)$ aux. **UP-preserving**.',
      '— **Totalizer / cardinality network**: $O(n \\log^2 n)$ clauses + $O(n \\log n)$ aux. Strong propagation.',
      '— **Ladder / order encoding**: $O(n)$ each. **UP-preserving**.',
      'Choose based on $n, k$, and how often the constraint is queried.',
    ],
    pitfalls: [
      'Pairwise AMO blows up for large $n$ — avoid for $n > 100$.',
      '"UP-preserving" means unit propagation alone detects all unit consequences — important for solver speed.',
    ],
    pointers: [{ kind: 'topic', key: 'sat-problem', label: 'Topic: SAT' }],
    answerTemplate:
`**Constraint.** At most $k$ of $\\{x_1, \\ldots, x_n\\}$.

**Encoding chosen.** _<pairwise / sequential / totalizer / ladder>_

**Sizes.** $\\ldots$ clauses, $\\ldots$ aux vars.

**Properties.** UP-preserving _<yes/no>_.`,
    triggers: ['at most k', 'cardinality', 'sequential counter', 'totalizer', 'ladder encoding', 'order encoding'],
  },
  {
    id: 'sat-pigeonhole',
    topic: 'SAT', module: 'sat', subtask: 'Pigeonhole / proof-complexity lower bound',
    whenItApplies: ['Pigeonhole formula, $\\text{PHP}_n$, proof complexity, Haken, exponential UNSAT proof.'],
    steps: [
      '$\\text{PHP}_n$ encodes "$n+1$ pigeons in $n$ holes" with one clause per pigeon (at least one hole) and one per hole-pair (no two pigeons in the same hole).',
      'UNSAT for any $n \\ge 1$.',
      '**Theorem (Haken 1985):** resolution requires exponentially many steps to refute $\\text{PHP}_n$.',
      'DPLL / CDCL traces correspond to resolution proofs ⇒ both have exponential lower bound on PHP family.',
      'Specialised algorithms (cutting planes, extended resolution) escape this.',
    ],
    pitfalls: [
      'Not the same as the AllDifferent pigeonhole (which is detected by Régin\'s GAC at the root).',
      '"Polynomial-in-$n$" cardinality encoding doesn\'t change the resolution-proof complexity.',
    ],
    pointers: [{ kind: 'topic', key: 'sat-problem', label: 'Topic: SAT' }],
    answerTemplate:
`**$\\text{PHP}_n$ clauses.** $(p_{i,1} \\lor \\ldots \\lor p_{i,n})$ for each pigeon $i$, and $(\\neg p_{i,k} \\lor \\neg p_{j,k})$ for each pigeon pair.

**Theorem.** Resolution refutation of $\\text{PHP}_n$ requires $\\exp(\\Omega(n))$ steps (Haken 1985).

**Consequence.** DPLL / CDCL also exponential here.`,
    triggers: ['pigeonhole', 'php_n', 'haken', 'proof complexity', 'extended resolution', 'cutting planes'],
  },

  // ───────────────────────────────────────────────────────────────────
  //  Essence Prime / modelling — additional playbooks
  // ───────────────────────────────────────────────────────────────────
  {
    id: 'csp-modelling-patterns',
    topic: 'CSP', module: 'csp', subtask: 'Modelling pattern (sequence / set / multiset / function / partition / relation)',
    whenItApplies: ['Identify a modelling pattern, set, multiset, sequence, function, partition, relation.'],
    steps: [
      'Pattern check:',
      '— **Sequence**: order matters, repeats allowed → array.',
      '— **Multiset**: order doesn\'t matter, repeats allowed → array + lex/sort.',
      '— **Set**: order doesn\'t matter, no repeats → array + AllDifferent + lex.',
      '— **Function** $A \\to B$: each input maps to exactly one output → array indexed by $A$, values in $B$.',
      '— **Partition** of $S$: each element belongs to exactly one block → array `part[i] = block_id`.',
      '— **Relation** $A \\times B$: subset of pairs → 2-D 0/1 matrix.',
      'Pick variables and domains to encode the pattern in Essence Prime (matrices only).',
      'Add symmetry-breaking constraints for sets (lex) and partitions (representative-by-min-element).',
    ],
    pitfalls: [
      'Essence Prime cannot use the `set`, `function`, `multiset`, `partition` types directly — encode by hand.',
      'For sets, forgetting lex-ordering inflates solution count by $k!$ where $k$ is the set size.',
    ],
    pointers: [
      { kind: 'topic', key: 'cp-modelling', label: 'Topic: CP modelling' },
      { kind: 'viz', key: 'EssencePrime', label: 'Visualiser: Essence Prime editor' },
    ],
    answerTemplate:
`**Pattern identified.** _<sequence / set / multiset / function / partition / relation>_

**Why.** _<order matters? repeats allowed? bijection?>_

**Essence Prime encoding.**
\`\`\`
given _<params>_
find _<decision matrix>_
such that
  _<constraints>_
\`\`\``,
    triggers: ['modelling pattern', 'sequence', 'set', 'multiset', 'function', 'partition', 'relation', 'viewpoint'],
  },
  {
    id: 'csp-channelling',
    topic: 'CSP', module: 'csp', subtask: 'Channelling between two viewpoints',
    whenItApplies: ['Channelling, dual model, two viewpoints, primal-dual, linked CSPs.'],
    steps: [
      'Define **two viewpoints** of the same problem (e.g. for n-queens: row-indexed col vars AND col-indexed row vars).',
      'Add a **channelling constraint** linking them: $X_i = j \\Leftrightarrow Y_j = i$.',
      'Propagation flows BOTH ways through the channel — typically much stronger than either viewpoint alone.',
      'Decide which viewpoint to branch on (usually the smaller or more constrained).',
    ],
    pitfalls: [
      'Channelling adds variables — make sure the model still fits memory.',
      'Be careful with non-bijective relations: channelling is cleanest for permutations.',
    ],
    pointers: [{ kind: 'topic', key: 'cp-modelling', label: 'Topic: CP modelling' }],
    answerTemplate:
`**Viewpoint 1.** $X_i \\in D_1$ with constraints _<>_.
**Viewpoint 2.** $Y_j \\in D_2$ with constraints _<>_.

**Channelling.** $X_i = j \\Leftrightarrow Y_j = i$, for all $i, j$.

**Branch on.** _<chosen viewpoint>_; propagation flows through the channel into the other.`,
    triggers: ['channelling', 'channeling', 'dual model', 'two viewpoints', 'primal-dual', 'linked csp'],
  },
];

// Find all playbooks relevant to a question text by substring trigger match.
export function findRelevantPlaybooks(text: string, max = 4): Playbook[] {
  const low = text.toLowerCase();
  const hits: { p: Playbook; matches: number }[] = [];
  for (const pb of playbooks) {
    let matches = 0;
    for (const trig of pb.triggers) if (low.includes(trig.toLowerCase())) matches++;
    if (matches > 0) hits.push({ p: pb, matches });
  }
  hits.sort((a, b) => b.matches - a.matches);
  return hits.slice(0, max).map((h) => h.p);
}

// Return all playbooks for a given module — used when structure detection
// identifies the module but the algorithm classifier can't pick one.
export function playbooksForModule(module: Module): Playbook[] {
  return playbooks.filter((p) => p.module === module);
}
