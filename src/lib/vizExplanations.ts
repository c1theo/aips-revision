import type { VizKey } from './types';

export interface VizExplanation {
  whatItShows: string;
  howToUse: string;
  whatToLookFor: string[];
  relatedConcepts?: string[];
}

export const vizExplanations: Partial<Record<VizKey, VizExplanation>> = {
  SearchGrid: {
    whatItShows: 'A 2-D grid with start (green), goal (red), walls (black), and optional weighted cells (orange — higher cost to enter). The selected search algorithm explores cells, marking them as **frontier** (light blue) and **explored** (darker blue) as it goes. The final path is highlighted in amber.',
    howToUse: 'Pick an algorithm and heuristic. Choose paint mode (Wall / Weight / Erase) and click cells. Drag start/goal to move them. Toggle "Diagonals" to add 8-neighbour moves (with cost √2). "Random walls" generates a fresh maze.',
    whatToLookFor: [
      'BFS expands outward in concentric layers — fair coverage, shortest in steps.',
      'DFS goes deep along one direction — often visits far more than necessary.',
      'UCS is identical to BFS when all step costs equal 1; differs when you add weighted cells.',
      'Greedy heads straight for the goal — fast but ignores walls, often suboptimal.',
      "A* combines both: doesn't waste time on cells far from the goal, yet finds the shortest path.",
      'Heuristic effect: switch between Manhattan / Euclidean / Chebyshev / Zero (= UCS) and see how A* expands more or fewer cells.',
      'Diagonals + weighted cells turn it into a richer terrain-navigation problem.',
    ],
    relatedConcepts: ['Admissibility', 'Consistency', 'Greedy vs A*', 'Frontier vs explored set'],
  },
  SearchCompare: {
    whatItShows: 'Two algorithms run side-by-side on the same grid. Edits to walls or start/goal update both panels live, so you can directly compare exploration patterns.',
    howToUse: 'Pick a different algorithm on each side. Edit the shared map (walls, drag start/goal). Watch how the explored regions differ.',
    whatToLookFor: [
      'BFS vs A*: A* should explore far fewer cells while finding the same shortest path.',
      'DFS vs A*: DFS often finds a longer path but explores fewer cells in lucky cases.',
      'Greedy vs A*: Greedy finds a path quickly but it may not be shortest.',
    ],
    relatedConcepts: ['Heuristic guidance', 'Optimality vs speed'],
  },
  MinimaxTree: {
    whatItShows: 'A game tree with MAX nodes (blue down-triangles) at the root and odd depths, MIN nodes (pink up-triangles) at even depths, and leaves (amber rectangles) with utility values. Computed backed-up values appear inside each node. With α-β ON, α/β bounds are shown above each internal node and pruned subtrees go grey.',
    howToUse: 'Toggle "α-β ON/OFF" to compare pure minimax with alpha-beta pruning. "Randomise" picks new leaf values. Edit the leaf-value list directly and click "Apply". Resize the tree height with the slider.',
    whatToLookFor: [
      'With α-β OFF: every leaf is visited (yellow). Backed-up values match max/min computation.',
      'With α-β ON: some subtrees go grey (dashed lines) — these are pruned. The root value is identical to plain minimax.',
      'A node turning red means a cut occurred there (β-cut at MAX, α-cut at MIN).',
      'Examiner tip: pruning is order-dependent. Try entering leaves in different orders and see how the pruning pattern changes.',
    ],
    relatedConcepts: ['α-cut vs β-cut', 'Move ordering', 'O(b^{m/2}) best case'],
  },
  MCTSTree: {
    whatItShows: 'A small binary "game" tree. Each node displays its **visit count N** (label) and **mean reward** (small number) — colour-coded green (mean > 0.5) or red (mean ≤ 0.5). Leaves have a fixed hidden value (v=0 or v=1) used during simulation rollouts.',
    howToUse: '"+1 iteration" runs one full Selection→Expansion→Simulation→Backpropagation cycle. "▶ Auto" runs continuously. Adjust the exploration constant C to see how it affects which subtrees grow. "Reset" starts over.',
    whatToLookFor: [
      'After a few iterations, the most-visited subtrees are those with higher reward (exploitation).',
      'Even under-visited children sometimes get picked — UCB1\'s exploration term gives them a chance.',
      'Try C = 0: pure exploitation, only the first-good subtree grows; other branches starve.',
      'Try C = 10: nearly random walk; visits spread evenly regardless of reward.',
      'C ≈ √2 (default): balanced — the tree concentrates on good branches while continuing to sample others.',
    ],
    relatedConcepts: ['UCB1', 'Exploration vs exploitation', 'UCT (Kocsis–Szepesvári)'],
  },
  AC4: {
    whatItShows: 'AC-4 — the counter-based arc-consistency algorithm. Maintains counter[X_i, v, X_j] = number of supports value v has in D(X_j) for the constraint between X_i and X_j. When a value is removed, decrement counters of its former supporters; if a counter hits 0, that value loses all support and is removed.',
    howToUse: 'Edit variables/domains, constraints (as allowed tuples per binary constraint), and any initial assignment. Step ⏮/⏭ through. Watch the counter table, the deletion queue S, and the live domains.',
    whatToLookFor: [
      'Initialisation: counters built for every (variable, value, constraint-partner). Unsupported values added to S immediately.',
      'Each S pop processes one removal: for each constraint partner, decrement counters of supporters that previously pointed to the removed value.',
      'A counter hitting 0 ⇒ value loses all support ⇒ new removal cascades.',
      'Differs from AC-3 (REVISE-based): AC-4 has optimal O(c·d²) time but heavy memory; AC-3 is O(c·d³) with O(c) memory.',
    ],
    relatedConcepts: ['Arc consistency', 'AC-3 vs AC-4 vs AC-2001', 'Counter algorithms'],
  },
  ForwardCheck: {
    whatItShows: 'Generic backtracking search with forward checking on ANY CSP you specify. Variables, domains, and constraint predicates are user-editable. Each step shows the current assignment, current domains after FC, and the algorithm narration.',
    howToUse: 'Specify variables with domains, constraints as JS-like expressions (e.g. `abs(x1 - x2) >= 3`, `x1 != x2`, `x1 + x2 == x3`). Choose value ordering (increasing/decreasing). Step through the trace.',
    whatToLookFor: [
      'After each assignment, FC tries every value of every unassigned variable to see if it survives every constraint involving the just-assigned variable.',
      'Domains shown shrink after each assignment — visible "ink-blot" of propagation.',
      'When an unassigned variable\'s domain becomes empty, FC reports the failure and we backtrack.',
      'd-way branching: each variable\'s values are tried in turn (rather than 2-way\'s X=v / X≠v split).',
      'Try the cargo-ship example or any other CSP from your lectures.',
    ],
    relatedConcepts: ['Forward Checking', 'd-way branching', 'Backtracking with FC'],
  },
  AC3: {
    whatItShows: 'A small CSP (Australia map colouring) with each variable\'s current domain shown as a row of coloured chips (R/G/B). The arc queue is shown on the right. AC-3 steps through the queue, calling REVISE on each arc and removing values that lack a support.',
    howToUse: '"Next" advances one step. "End" jumps to the final state. Click any R/G/B chip on a variable to force that colour — AC-3 reruns and propagates immediately.',
    whatToLookFor: [
      'REVISE: when an arc is popped, values without support are removed (highlighted red in the step description).',
      'Re-enqueueing: after a domain shrinks, all arcs into that variable (except from the just-revised neighbour) are re-added.',
      'Failure: if a domain becomes empty, AC-3 reports infeasibility.',
      'Force a single colour for one country and watch propagation cascade — useful for understanding how MAC interleaves search and propagation.',
    ],
    relatedConcepts: ['Arc consistency', 'O(c·d³) complexity', 'MAC algorithm'],
  },
  NQueens: {
    whatItShows: 'An n-queens chessboard with one queen per row (♛). At each step, the current variable assignment is shown plus the remaining domain for each unassigned row. A tried (row, col) placement flashes green (FC passes) or red (FC fails → backtrack).',
    howToUse: 'Set n (3–9). Toggle MRV, LCV, Forward checking. Use ▶ to autoplay the search. Watch the bottom statistics for nodes explored vs backtracks.',
    whatToLookFor: [
      'Without MRV: rows are picked in order — sometimes wastes effort on rows with large domains.',
      'With MRV: the row with the smallest remaining domain is picked first — fail-first, prunes faster.',
      'With FC off: backtracking happens later, after placing more queens. Node count rises sharply.',
      'With FC on: invalid placements are caught immediately. Backtrack count drops.',
      'Try n=8 with MRV + FC: should solve with very few backtracks.',
    ],
    relatedConcepts: ['MRV / Degree / LCV', 'Forward checking', 'MAC vs FC'],
  },
  ConstraintGraph: {
    whatItShows: 'Visualises the constraint graph of any CSP: nodes = variables, edges = binary constraints. Highlights structural properties: tree (n-1 edges, connected — polynomial!), cyclic (exponential worst case), disconnected (solvable per-component).',
    howToUse: 'Specify variables and edges. The viz draws a circular layout and analyses the structure.',
    whatToLookFor: ['Tree-structured CSPs are tractable in $O(nd^2)$.', 'Disconnected graphs decompose: solve each component independently.', 'Independent cycle count = |E| - |V| + components.'],
    relatedConcepts: ['Tree-CSP', 'Cutset conditioning', 'Tree decomposition'],
  },
  ReginAllDiff: {
    whatItShows: "Régin's algorithm computes GAC for AllDifferent. Bipartite graph (variables on left, values on right) with edges representing domain membership. Green edges are in the current maximum matching. Red dashed edges represent values that are NOT in any maximum matching → must be removed by GAC.",
    howToUse: 'Specify each variable with its current domain. The viz finds the maximum matching and reports which edges fail to support any AllDifferent satisfying assignment.',
    whatToLookFor: ['If the max matching equals the number of variables: AllDifferent is feasible. Otherwise UNSAT immediately.', 'A value-edge that\'s NOT in any max matching is removed by GAC — even though pairwise ≠ propagation would NOT catch it.', 'Try X1={a,b}, X2={a,b}, X3={a,b,c}: Régin removes a, b from X3 instantly.'],
    relatedConcepts: ['GAC', 'AllDifferent', 'Bipartite matching', 'Hall\'s marriage theorem'],
  },
  TreeCSP: {
    whatItShows: 'Solves a tree-structured CSP in two passes. Backward pass: from leaves to root, make each parent arc-consistent with each child via REVISE. Forward pass: assign root-to-leaf, picking any value consistent with the parent assignment — guaranteed conflict-free.',
    howToUse: 'Specify variables, domains, and exactly $n-1$ binary constraints forming a tree. Step through to see each REVISE then each assignment.',
    whatToLookFor: ['Each REVISE pass tightens the parent\'s domain based on the child.', 'After the backward pass, every variable has at least one value consistent with all its neighbours.', 'The forward pass never backtracks — that\'s the $O(nd^2)$ guarantee.', 'If during backward pass a domain becomes empty, the CSP is infeasible.'],
    relatedConcepts: ['Directional arc consistency', 'Tree-structured CSPs', 'Cutset conditioning'],
  },
  TwoSAT: {
    whatItShows: '2-SAT solver via implication graph and strongly connected components. Each 2-literal clause becomes two implications. UNSAT iff some variable and its negation end up in the same SCC. Polynomial-time (linear in input size).',
    howToUse: 'Enter 2-CNF (one clause per line). The viz lists clauses, derives implications, computes SCCs, and reports SAT/UNSAT (with model when SAT).',
    whatToLookFor: ['Each clause $(\\ell_1 \\vee \\ell_2)$ → two implications: $\\lnot \\ell_1 \\Rightarrow \\ell_2$ and $\\lnot \\ell_2 \\Rightarrow \\ell_1$.', 'SCCs computed via Kosaraju\'s algorithm.', 'UNSAT iff some SCC contains both $x$ and $\\lnot x$.', 'Compare to 3-SAT which is NP-complete — the jump from 2 to 3 is the classic complexity boundary.'],
    relatedConcepts: ['2-SAT in P', 'Strongly connected components', 'Tarjan / Kosaraju'],
  },
  HillClimbSA: {
    whatItShows: 'A 1D function landscape with hill climbing, random-restart hill climbing, and simulated annealing. The curve is the objective function; coloured dots are the trajectory.',
    howToUse: 'Pick a function and an algorithm. Step or autoplay. For SA, adjust initial temperature $T_0$ and cooling factor $\\alpha$.',
    whatToLookFor: ['Hill climbing gets stuck at the first local maximum it reaches.', 'Random-restart escapes local optima by reinitialising — visible jumps to random positions.', 'SA at high $T$ accepts many downhill moves; as $T$ decays, it converges to hill-climbing behaviour.', 'On the "needle in haystack" landscape, hill climbing rarely finds the global optimum; SA + restarts can.'],
    relatedConcepts: ['Local search', 'Hill climbing failure modes', 'Metropolis criterion'],
  },
  Expectimax: {
    whatItShows: 'Game tree with three node types: MAX (down-triangle), MIN (up-triangle), CHANCE (circle). Chance nodes compute the expected value over weighted children. Used for stochastic games like backgammon.',
    howToUse: 'Edit leaf values and chance node probabilities. The viz rebuilds the tree and computes expectimax bottom-up.',
    whatToLookFor: ['Each chance node\'s value = $\\sum_a P(a) \\cdot V(\\mathrm{child}_a)$.', 'A high-probability low-value outcome can drag the expected value below what minimax would suggest.', 'Alpha-beta does NOT prune chance nodes directly — expectimax is generally slower than minimax.', 'Try equal vs unequal probabilities to see how chance-node weighting changes optimal play.'],
    relatedConcepts: ['Stochastic games', 'Backgammon AI', 'MCTS as expectimax alternative'],
  },
  PhaseTransition: {
    whatItShows: 'Empirical study of random 3-SAT. Generates many random instances at various clause/variable ratios and plots: (blue) fraction satisfiable, (red dashed) average DPLL operations. The theoretical phase transition $r \\approx 4.267$ is marked.',
    howToUse: 'Set n (small for speed) and trials per ratio. Click "Run benchmark" — synchronous, can take a few seconds.',
    whatToLookFor: ['Sharp transition near r = 4.267 in P(SAT): from ~100% to ~0%.', 'Solve-time curve peaks at the transition — the famous "hard region".', 'Below 4.27: easy SAT (many solutions). Above: easy UNSAT (short refutations).', 'At small n the transition is fuzzier; the boundary sharpens as n grows.'],
    relatedConcepts: ['Random 3-SAT', 'Phase transition', 'Sharp threshold conjecture'],
  },
  TwoWayBranching: {
    whatItShows: 'The full search tree for an n-queens solve with MRV variable ordering and forward checking. Toggle between **2-way branching** (X=v / X≠v at each node) and **d-way branching** (one child per value).',
    howToUse: 'Pick n (3–7) and the branching mode. The viz re-runs the search and renders the resulting tree with SAT/UNSAT colouring at leaves.',
    whatToLookFor: [
      "For small n=4 the trees often have similar size — n-queens is easy and a satisfying assignment is found before much branching happens.",
      'For n=6 or n=7, observe how 2-way may create *deeper* paths but with smaller branching factor; d-way is shallower but wider.',
      'The right-branch (X≠v) in 2-way restricts only one value; subsequent nodes in that subtree may have more flexibility than equivalent positions in the d-way tree.',
      "If the solver finds SAT early, both stop — the tree just shows that prefix.",
    ],
    relatedConcepts: ['2-way branching', 'd-way branching', 'MRV', 'Forward checking'],
  },
  MinConflicts: {
    whatItShows: 'An n-queens board with all queens placed (one per column). Queens in conflict are highlighted red. Each step picks a conflicted row and reassigns its column to minimise total conflicts. The chart at the bottom plots conflict count over time.',
    howToUse: 'Set n. Click "Random init" for a fresh starting configuration. "▶ Auto" runs to solution; "Step" advances once.',
    whatToLookFor: [
      'Even for n = 20 or 40, conflicts often drop to zero in under 50 steps.',
      'The conflict graph descends quickly then settles near zero — the algorithm doesn\'t backtrack, it just keeps reassigning.',
      'Sometimes the chart plateaus briefly — those are local optima that min-conflicts escapes via random tie-breaking.',
      'For n = 100+, this remains fast — min-conflicts is famously linear-time in practice for n-queens.',
    ],
    relatedConcepts: ['Local search', 'Min-conflicts', 'Million-queens result'],
  },
  EssencePrime: {
    whatItShows: 'A library of curated Essence Prime models — n-queens, sudoku, map colouring, all-interval series, set partition, SEND+MORE, graph k-colouring. Each shows source code with syntax highlighting plus notes about modelling decisions.',
    howToUse: 'Pick a model from the buttons. Edit the source in the left pane; the right pane re-highlights as you type. Read the notes (rose box) for likely exam-target points.',
    whatToLookFor: [
      'How abstract types (sets, partitions, functions) are encoded as matrices in Essence Prime — see "set partition" and "graph k-colouring".',
      'Symmetry-breaking constraints (e.g. `color[Belgium] = 1` in map colouring).',
      'Idiomatic patterns: 3-allDiff for n-queens diagonals; matrix comprehensions for transformed values.',
      'The cryptarithmetic example: how a single global arithmetic constraint over 8 letters compares to the carry-based decomposition.',
    ],
    relatedConcepts: ['Essence vs Essence Prime', 'Savile Row pipeline', 'allDiff / gcc / table'],
  },
  TruthTable: {
    whatItShows: 'A truth table for any propositional formula. The last column (highlighted) shows the formula\'s truth value for each combination of variable assignments. The status line above reports tautology, contradiction, or satisfiable.',
    howToUse: 'Type a formula in the box. Use `&` for ∧, `|` for ∨, `->` for →, `<->` for ↔, `!` for ¬. Variables are letters (P, Q, R, …). Click any example button to load it.',
    whatToLookFor: [
      'Tautology: every row evaluates true. Try `P -> P` or `(P -> Q) & P -> Q`.',
      'Contradiction: every row false. Try `P & !P`.',
      'Satisfiable but not valid: mix of T and F. Most formulas.',
      'Counterintuitive truth values — vacuous truth: `F -> Q` is always true.',
      'Use to verify CNF conversions: the original and CNF forms should produce identical columns.',
    ],
    relatedConcepts: ['Satisfiability', 'Validity', 'Entailment'],
  },
  Resolution: {
    whatItShows: 'A resolution refutation: starting from your CNF clauses, the algorithm finds pairs that can resolve and lists each derived clause. If the empty clause □ appears, the original set is unsatisfiable.',
    howToUse: 'Edit clauses (one per line, literals comma-separated, `~` for negation). The table below shows every resolvent in derivation order. Try the example buttons.',
    whatToLookFor: [
      'Empty clause derivation (red `□`) = the original clauses are UNSAT.',
      'No empty clause despite no new resolvents possible = SAT (or at least cannot be refuted).',
      'To prove KB ⊨ α, you would add ¬α to KB as the last clause(s) and refute.',
      'Resolution can take many steps even on small problems — modern SAT solvers do it much more efficiently with watched literals and learnt clauses.',
    ],
    relatedConcepts: ['CNF', 'Refutation completeness', 'Resolution rule'],
  },
  HornChain: {
    whatItShows: 'Forward chaining over a Horn knowledge base. The trace shows facts being added one at a time, either as initial facts or via firing a rule whose body is fully known.',
    howToUse: 'Edit the KB (one rule/fact per line, e.g. `A, B -> C`). Set a query to check if it\'s entailed. The trace updates live as you edit.',
    whatToLookFor: [
      'Facts in green show "what KB knows so far".',
      'Each derivation lists the rule that fired (body conjunction → head).',
      'Linear-time: the trace length is at most O(rules × max body size).',
      'Try adding a fact like `C` directly and watching the chain restart from a richer base.',
      'The algorithm is sound and complete for Horn clauses — the basis of Prolog.',
    ],
    relatedConcepts: ['Horn clauses', 'Forward vs backward chaining'],
  },
  DPLL: {
    whatItShows: 'DPLL trace over a CNF. Each step is either: unit propagation (a clause becomes unit), pure literal elimination, a decision (branching), or a conflict (empty clause). The current assignment and remaining (active) clauses are displayed.',
    howToUse: 'Edit CNF as one clause per line, positive integers for variables, negative for negation. Step ⏮ / ⏭ through. Result shown at top.',
    whatToLookFor: [
      'Most of the work is **unit propagation** — DPLL barely makes decisions on small instances because propagation cascades.',
      'Pure literals: rare in random CNF but show up in structured problems.',
      'Decisions: when neither propagation nor pure literal applies, DPLL must branch on some unassigned variable.',
      'Conflicts: when a clause becomes empty under the current assignment. DPLL backtracks to undo the last decision.',
    ],
    relatedConcepts: ['Unit propagation', 'Pure literal', 'Chronological backtracking'],
  },
  CDCL: {
    whatItShows: 'CDCL with the implication graph trail. Each row in the "Decision trail" is an assigned literal with its decision level and antecedent (the clause that forced it, or "decided"). Learnt clauses accumulate at the right. On conflict, the algorithm derives a learnt clause via 1-UIP-style resolution and backjumps non-chronologically.',
    howToUse: 'Edit CNF (same format as DPLL). Step through to see propagation, conflicts, learning, and backjumps.',
    whatToLookFor: [
      'Decision level rises with each decision (L1, L2, ...). Propagated literals inherit the current level.',
      'A conflict step highlights in red. The learnt clause should follow.',
      'Backjump: notice the trail shortens when the algorithm jumps back multiple levels at once — non-chronological.',
      'After the learnt clause is added, it becomes unit and forces a new propagation — the "asserting" property.',
      'Run "UNSAT" example to see CDCL terminate at level 0 with conflict.',
    ],
    relatedConcepts: ['Implication graph', '1-UIP', 'Backjumping', 'Learnt clauses'],
  },
  WalkSAT: {
    whatItShows: 'A random 3-SAT instance. The current assignment is hidden; you see only the count of unsatisfied clauses and how it evolves over time. The chart at the bottom plots the unsatisfied-clause count after every flip.',
    howToUse: 'Set n, ratio m/n (try 4.27 for hard random 3-SAT), and noise p. "Step" does one flip; "Auto" runs continuously. Click "Regenerate" for a fresh instance.',
    whatToLookFor: [
      'The chart should generally trend down but with noisy fluctuations — the random component is visible.',
      'At p = 0 (pure greedy): the chart often plateaus or oscillates — local optima trap the search.',
      'At p = 1 (pure random walk): chaos — almost no downward trend.',
      'At p ≈ 0.5: monotone-ish descent to zero, fastest convergence on average.',
      'Hard instances (ratio ≈ 4.27) take many more flips than easy ones (ratio < 3).',
    ],
    relatedConcepts: ['Noise parameter', 'Plateaux', 'Phase transition'],
  },
  CNFEncoder: {
    whatItShows: 'Step-by-step CNF conversion of an arbitrary propositional formula. Shows the formula after each of the four standard transformations: eliminate ↔, eliminate →, push ¬ inward, distribute ∨ over ∧.',
    howToUse: 'Type a formula. Steps appear in cards below.',
    whatToLookFor: [
      'Step 2 — eliminate → — typically doubles the number of subexpressions when there are many implications.',
      'Step 3 — push ¬ — De Morgan + double-negation.',
      'Step 4 — distribute — this is where the formula can blow up exponentially. Try `(A1 & B1) | (A2 & B2) | (A3 & B3)` to see distribution growth.',
      'Tseitin transformation (separate visualizer) uses auxiliary variables to keep CNF linear-size; pure equivalence may be exponential.',
    ],
    relatedConcepts: ['CNF', 'Tseitin transformation', 'Distribution blowup'],
  },
  TseitinEncoder: {
    whatItShows: 'Tseitin transformation: introduces a fresh auxiliary variable $t_i$ for each non-atomic subformula and posts the equivalence as clauses. Output is equisatisfiable (not equivalent) but always linear-size.',
    howToUse: 'Type a formula. The right panel lists the new CNF clauses; the left lists what each $t_i$ represents.',
    whatToLookFor: [
      'Number of auxiliary variables equals the number of internal AST nodes — linear in formula length.',
      'Each connective has a fixed translation pattern (and = 3 clauses, or = 3, → = 3, ↔ = 4).',
      'Compare clause count to the standard four-step CNFEncoder for the same formula — distribution can be much bigger.',
      "The root literal is asserted as a unit clause — that's what 'equisatisfiable' looks like.",
    ],
    relatedConcepts: ['CNF', 'Equisatisfiability', 'SAT preprocessing'],
  },
};
