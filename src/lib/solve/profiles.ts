import type { VizKey } from '../types';

// Algorithm profiles — the "knowledge base" the router classifies against.
// Each profile contains lexical triggers (strong/medium/weak/anti), regex
// patterns, and metadata about which question intents the algorithm answers.
//
// Weights guideline:
//   strong  = 50   — unambiguous algorithm name or canonical phrase
//   medium  = 20   — clearly-associated jargon
//   weak    =  5   — generic but relevant
//   anti    = -40  — penalise: word strongly suggests another algorithm
//
// Pattern weights tuned individually.

export interface Trigger {
  text: string;
  weight: number;
}

export interface PatternRule {
  pattern: RegExp;
  weight: number;
  label: string;
}

export type Intent =
  | 'TRACE'      // step-by-step execution
  | 'MODEL'      // formulate / write the model
  | 'COMPARE'    // contrast two algorithms
  | 'ENFORCE'    // achieve a consistency property
  | 'PROVE'      // formal proof / entailment
  | 'SOLVE'      // find a solution
  | 'ANALYZE'    // complexity / counts
  | 'DEFINE'     // explain a concept
  | 'IDENTIFY';  // classify (which type, pattern)

export type Module = 'search' | 'adversarial' | 'csp' | 'logic' | 'sat';

export interface AlgorithmProfile {
  viz: VizKey;
  label: string;
  module: Module;
  blurb: string;        // one-line "when to use this"
  intents: Intent[];    // intents this algorithm naturally answers
  triggers: {
    strong: string[];
    medium: string[];
    weak: string[];
    anti: string[];
  };
  patterns: PatternRule[];
  companions?: VizKey[];   // often-useful side-vizes
}

// ──────────────────────────────────────────────────────────────────────
//  Search algorithms
// ──────────────────────────────────────────────────────────────────────

export const profiles: AlgorithmProfile[] = [
  {
    viz: 'SearchGrid', label: 'A* / BFS / DFS / UCS / Greedy on a grid', module: 'search',
    blurb: 'Pathfinding on a 2-D grid with optional walls, weights, and heuristics.',
    intents: ['TRACE', 'SOLVE', 'COMPARE'],
    triggers: {
      strong: ['a*', 'a star', 'pathfinding', 'grid search', 'shortest path on a grid', 'maze'],
      medium: ['bfs', 'breadth-first', 'dfs', 'depth-first', 'uniform-cost', 'ucs', 'greedy best-first', 'heuristic search', 'manhattan distance', 'euclidean distance', 'admissible heuristic', 'consistent heuristic', 'frontier', 'explored set'],
      weak: ['search', 'path', 'shortest', 'expand', 'open list', 'closed list'],
      anti: ['game tree', 'minimax', 'cnf', 'clause', 'constraint', 'csp', 'horn'],
    },
    patterns: [
      { pattern: /\bA\*\b/i, weight: 45, label: 'A* algorithm name' },
      { pattern: /\bh\s*\(\s*n\s*\)/i, weight: 30, label: 'h(n) heuristic notation' },
      { pattern: /\bg\s*\(\s*n\s*\)/i, weight: 30, label: 'g(n) path-cost notation' },
      { pattern: /\bf\s*\(\s*n\s*\)\s*=\s*g\s*\(\s*n\s*\)\s*\+\s*h\s*\(\s*n\s*\)/i, weight: 80, label: 'f = g + h' },
      { pattern: /\b(?:grid|maze|cell|wall)\b/i, weight: 12, label: 'grid vocabulary' },
    ],
  },
  {
    viz: 'SearchCompare', label: 'Side-by-side search algorithm compare', module: 'search',
    blurb: 'Compare two pathfinding algorithms on the same map.',
    intents: ['COMPARE'],
    triggers: {
      strong: ['compare a* and bfs', 'compare bfs and dfs', 'side by side search', 'compare two search'],
      medium: ['vs', 'versus', 'compare', 'contrast'],
      weak: ['difference', 'better than'],
      anti: ['csp', 'cnf', 'minimax'],
    },
    patterns: [
      { pattern: /\bcompare\s+(BFS|DFS|UCS|A\*|greedy)/i, weight: 60, label: 'compare X (search algo)' },
    ],
  },
  {
    viz: 'SearchTree', label: 'Tree search expansion order (BFS/DFS/UCS)', module: 'search',
    blurb: 'Walk through a tree showing the OPEN/CLOSED expansion order.',
    intents: ['TRACE'],
    triggers: {
      strong: ['expansion order', 'open list trace', 'tree search trace'],
      medium: ['frontier', 'queue order', 'stack order', 'expand the node'],
      weak: ['tree', 'expand'],
      anti: ['csp', 'cnf', 'minimax', 'grid'],
    },
    patterns: [
      { pattern: /expand(?:ed|ing)?\s+(?:in\s+)?which\s+order/i, weight: 40, label: 'expansion-order question' },
    ],
  },
  {
    viz: 'HillClimbSA', label: 'Hill climbing / Simulated annealing', module: 'search',
    blurb: 'Local search on a 1-D function landscape — HC, RR, SA.',
    intents: ['TRACE', 'COMPARE', 'SOLVE'],
    triggers: {
      strong: ['hill climbing', 'simulated annealing', 'local search', 'sideways move', 'random restart'],
      medium: ['local maximum', 'local minimum', 'plateau', 'temperature schedule', 'boltzmann', 'acceptance probability'],
      weak: ['climb', 'temperature', 'neighbourhood', 'escape'],
      anti: ['csp', 'cnf', 'minimax', 'arc consistency'],
    },
    patterns: [
      { pattern: /\bT\s*=\s*\d+/i, weight: 15, label: 'temperature notation' },
      { pattern: /\be\s*\^\s*\(?\s*\-?\s*\\?Delta/i, weight: 35, label: 'Boltzmann factor' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  //  Adversarial / game-tree
  // ──────────────────────────────────────────────────────────────────────
  {
    viz: 'MinimaxTree', label: 'Minimax & alpha-beta pruning', module: 'adversarial',
    blurb: 'Trace minimax over a game tree, optionally with α-β pruning.',
    intents: ['TRACE', 'ANALYZE', 'SOLVE'],
    triggers: {
      strong: ['minimax', 'alpha-beta', 'alpha beta', 'α-β', 'pruning', 'game tree', 'ply', 'backed-up value'],
      medium: ['max node', 'min node', 'cut-off', 'optimal move', 'utility', 'static evaluator', 'move ordering'],
      weak: ['game', 'move', 'opponent', 'turn', 'leaves'],
      anti: ['constraint', 'csp', 'cnf', 'horn', 'sat'],
    },
    patterns: [
      { pattern: /\balpha[\-\s]?beta\b/i, weight: 80, label: 'alpha-beta name' },
      { pattern: /\bbranching\s*factor\s*(?:of\s*)?\d+/i, weight: 25, label: 'branching factor b' },
      { pattern: /\bdepth\s*(?:of\s*)?\d+/i, weight: 12, label: 'depth d' },
      { pattern: /\bO\s*\(\s*b\s*\^\s*[md]\s*\)/i, weight: 30, label: 'O(b^d) / O(b^m) complexity' },
      { pattern: /\b(MAX|MIN)\b.*?\b(MAX|MIN)\b/, weight: 20, label: 'MAX/MIN labels' },
      { pattern: /leaves?\s*[:=]\s*[\d,\s\-]+/i, weight: 25, label: 'leaf values listed' },
    ],
  },
  {
    viz: 'MCTSTree', label: 'Monte Carlo Tree Search (UCT)', module: 'adversarial',
    blurb: 'UCB1-guided iterative game tree growth.',
    intents: ['TRACE', 'ANALYZE'],
    triggers: {
      strong: ['mcts', 'monte carlo tree search', 'uct', 'ucb1', 'ucb-1'],
      medium: ['rollout', 'simulation', 'exploration constant', 'visit count', 'selection expansion'],
      weak: ['random simulation', 'exploration vs exploitation'],
      anti: ['cnf', 'horn', 'arc consistency'],
    },
    patterns: [
      { pattern: /\bC\s*=\s*\\?sqrt\s*\{?\s*2/i, weight: 35, label: 'C = √2 exploration constant' },
      { pattern: /\b(selection|expansion|simulation|backprop|back-?propagation)\b.*?\b(selection|expansion|simulation|backprop|back-?propagation)\b/i, weight: 35, label: 'MCTS phase names' },
    ],
  },
  {
    viz: 'Expectimax', label: 'Expectimax (stochastic games)', module: 'adversarial',
    blurb: 'Game tree with chance nodes — backgammon-style expected values.',
    intents: ['TRACE', 'ANALYZE'],
    triggers: {
      strong: ['expectimax', 'chance node', 'stochastic game', 'dice game'],
      medium: ['expected value', 'expectation', 'probability of', 'backgammon'],
      weak: ['random', 'chance'],
      anti: ['csp', 'cnf', 'horn'],
    },
    patterns: [
      { pattern: /\bE\s*\[/i, weight: 12, label: 'expectation notation E[...]' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  //  CSP
  // ──────────────────────────────────────────────────────────────────────
  {
    viz: 'CSPLab', label: '🧪 CSP Lab — full pipeline (NC → AC → BT with FC/MAC)', module: 'csp',
    blurb: 'The everything-CSP solver: node consistency, AC-3, backtracking with FC or MAC, d-way or 2-way branching, all heuristics.',
    intents: ['SOLVE', 'TRACE', 'COMPARE'],
    triggers: {
      strong: ['backtracking', 'maintaining arc consistency', 'mac search', 'forward checking', 'fc search', 'd-way branching', '2-way branching', 'depth-first backtrack', 'find a solution', "geelen's promise", 'geelen promise', 'promise heuristic', 'dom/wdeg', 'wdeg', 'weighted degree', 'last-conflict', 'activity-based search', 'impact-based search'],
      medium: ['mrv', 'minimum remaining values', 'lcv', 'least constraining value', 'degree heuristic', 'value ordering', 'variable ordering', 'fail-first', 'succeed-first', 'dom/deg', 'solution counting'],
      weak: ['solve the csp', 'search for a solution', 'variable order', 'value order', 'promise'],
      anti: ['game tree', 'minimax', 'cnf', 'horn', 'tseitin'],
    },
    patterns: [
      { pattern: /\bd-way\s+(?:backtrack|MAC|FC)/i, weight: 70, label: 'd-way + backtrack/MAC/FC' },
      { pattern: /\b(?:perform|run|trace).*?(?:backtrack|MAC|FC)/i, weight: 50, label: 'perform/run backtrack' },
      { pattern: /\bstatic\s+variable\s+order\b/i, weight: 35, label: 'static variable order' },
      { pattern: /\bascending\s+value\s+order\b/i, weight: 35, label: 'ascending value order' },
      { pattern: /\bstop\s+when\s+the\s+first\s+solution\s+is\s+found\b/i, weight: 30, label: 'stop at first solution' },
      { pattern: /\bMAC\s+search\b/i, weight: 50, label: 'MAC search' },
      { pattern: /\bcompare.*?MAC.*?(?:backtrack|FC)|compare.*?(?:backtrack|FC).*?MAC/i, weight: 80, label: 'MAC vs BT/FC comparison' },
      { pattern: /\bGeelen'?s?\s+promise\b/i, weight: 70, label: "Geelen's promise" },
      { pattern: /\b(?:dom\/wdeg|wdeg|weighted\s+degree)\b/i, weight: 60, label: 'wdeg / dom-wdeg' },
      { pattern: /\blast[-\s]?conflict\b/i, weight: 50, label: 'last-conflict' },
    ],
    companions: ['AC3', 'ForwardCheck', 'NQueens'],
  },
  {
    viz: 'AC3', label: 'AC-3 stepper (NC + AC, manual queue, revision counts)', module: 'csp',
    blurb: 'Enforce node + arc consistency; control arc order; count revisions per arc.',
    intents: ['ENFORCE', 'TRACE', 'ANALYZE'],
    triggers: {
      strong: ['ac-3', 'ac3', 'arc consistency', 'enforce arc consistency', 'revise', 'arc queue', 'arc revision', 'node consistency', 'global node consistency', 'global arc consistency'],
      medium: ['mackworth', 'consistent w.r.t.', 'support', 'unary constraint', 'binary constraint', 'domain wipeout', 'fixpoint'],
      weak: ['propagation', 'domain', 'shrink'],
      anti: ['minimax', 'cnf', 'horn'],
    },
    patterns: [
      { pattern: /\bAC[-\s]?3\b/i, weight: 80, label: 'AC-3 algorithm name' },
      { pattern: /\barc\s+consistency\b/i, weight: 60, label: 'arc consistency phrase' },
      { pattern: /\bnode\s+consistency\b/i, weight: 50, label: 'node consistency phrase' },
      { pattern: /\bREVISE\s*\(/i, weight: 45, label: 'REVISE(... ) function call' },
      { pattern: /\bO\s*\(\s*[ec]?\s*d\s*\^\s*3\s*\)/i, weight: 35, label: 'O(c·d^3) complexity' },
      { pattern: /\benforce\s+(?:global\s+)?(?:node|arc)\s+consistency/i, weight: 75, label: 'enforce X consistency' },
      { pattern: /arc\s+(?:need|needs|must|to)\s+be\s+revised\s+(?:more|twice)/i, weight: 80, label: 'arc revised more than once' },
    ],
    companions: ['AC4', 'CSPLab'],
  },
  {
    viz: 'AC2001', label: 'AC-2001 / AC-3.1 (last-support optimised AC)', module: 'csp',
    blurb: 'Improved AC-3 with a Last[X_i, v, X_j] data structure — never re-checks a support that already passed.',
    intents: ['ENFORCE', 'TRACE', 'ANALYZE'],
    triggers: {
      strong: ['ac-2001', 'ac2001', 'ac 2001', 'ac-3.1', 'ac3.1', 'ac 3.1', 'last support', 'last data structure', 'zhang and yap', 'zhang & yap', 'bessière', 'bessiere'],
      medium: ['support pointer', 'resumption', 'last[', 'optimal o(c d^2)'],
      weak: ['last'],
      anti: ['minimax', 'cnf', 'horn'],
    },
    patterns: [
      { pattern: /\bAC[-\s]?2001\b/i, weight: 90, label: 'AC-2001' },
      { pattern: /\bAC[-\s]?3\.1\b/i, weight: 90, label: 'AC-3.1' },
      { pattern: /\bLast\s*\[/i, weight: 60, label: 'Last[...] data structure' },
      { pattern: /\blast\s+(?:support|data\s+structure)\b/i, weight: 70, label: 'last support / data structure' },
    ],
    companions: ['AC3', 'AC4'],
  },
  {
    viz: 'AC4', label: 'AC-4 (counter-based arc consistency)', module: 'csp',
    blurb: 'Optimal O(c·d²) AC via counters + deletion queue S.',
    intents: ['ENFORCE', 'TRACE', 'ANALYZE'],
    triggers: {
      strong: ['ac-4', 'ac4', 'counter-based arc consistency', 'deletion queue'],
      medium: ['supporter', 'counter', 'optimal arc consistency', 'mohr-henderson'],
      weak: ['queue s'],
      anti: ['minimax', 'cnf'],
    },
    patterns: [
      { pattern: /\bAC[-\s]?4\b/i, weight: 80, label: 'AC-4 algorithm name' },
      { pattern: /\bcounter\s*\[/i, weight: 35, label: 'counter[...] notation' },
      { pattern: /\bO\s*\(\s*[ec]?\s*d\s*\^\s*2\s*\)/i, weight: 25, label: 'O(c·d^2) complexity' },
    ],
    companions: ['AC3'],
  },
  {
    viz: 'ForwardCheck', label: 'Generic backtracking + Forward Checking', module: 'csp',
    blurb: 'BT with FC on any CSP — alternative to CSPLab when MAC isn\'t needed.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['forward checking', 'forward check', 'fc'],
      medium: ['prune neighbours', 'wipeout', 'after each assignment'],
      weak: ['backtrack'],
      anti: ['mac', 'maintaining arc consistency', 'minimax'],
    },
    patterns: [
      { pattern: /\bforward[\s-]?check(ing)?\b/i, weight: 60, label: 'forward check[ing]' },
      { pattern: /\bafter\s+(?:assigning|each\s+assignment)/i, weight: 20, label: 'after each assignment' },
    ],
    companions: ['CSPLab', 'NQueens'],
  },
  {
    viz: 'NQueens', label: 'N-Queens / graph colouring with FC, MRV, LCV', module: 'csp',
    blurb: 'Classic n-queens backtracking visualisation.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['n-queens', 'n queens', 'eight queens', 'graph colouring', 'graph coloring', 'map colouring'],
      medium: ['no two queens', 'same row', 'same column', 'same diagonal'],
      weak: ['queen', 'chessboard'],
      anti: ['minimax', 'sat', 'cnf'],
    },
    patterns: [
      { pattern: /\b\d+-?queens?\b/i, weight: 70, label: 'N-queens phrase' },
      { pattern: /\b(?:map|graph)\s+colou?ring\b/i, weight: 50, label: 'map/graph colouring' },
    ],
    companions: ['CSPLab'],
  },
  {
    viz: 'MinConflicts', label: 'Min-conflicts (local search for CSP)', module: 'csp',
    blurb: 'Local search heuristic for CSPs — pick the move that minimises conflicts.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['min-conflicts', 'min conflicts', 'minconflicts'],
      medium: ['conflict count', 'random walk on csp', 'local search csp'],
      weak: ['conflict'],
      anti: ['arc consistency', 'minimax'],
    },
    patterns: [
      { pattern: /\bmin[-\s]?conflicts?\b/i, weight: 70, label: 'min-conflicts' },
    ],
  },
  {
    viz: 'TwoWayBranching', label: '2-way vs d-way branching', module: 'csp',
    blurb: 'Show how branching style reshapes the search tree.',
    intents: ['COMPARE', 'TRACE'],
    triggers: {
      strong: ['2-way branching', 'two-way branching', 'd-way branching', 'binary branching', 'enumeration branching'],
      medium: ['left branch', 'right branch', 'split', 'commit to value'],
      weak: ['branch'],
      anti: ['cnf', 'horn'],
    },
    patterns: [
      { pattern: /\b2-?way\s+branching\b/i, weight: 60, label: '2-way branching' },
      { pattern: /\bd-?way\s+branching\b/i, weight: 60, label: 'd-way branching' },
    ],
  },
  {
    viz: 'ConstraintGraph', label: 'Constraint graph (tree / cyclic / disconnected)', module: 'csp',
    blurb: 'Visualise the constraint graph structure of any CSP.',
    intents: ['IDENTIFY', 'DEFINE'],
    triggers: {
      strong: ['constraint graph', 'constraint hypergraph'],
      medium: ['tree-structured', 'connected', 'cycle', 'edge', 'adjacency'],
      weak: ['graph'],
      anti: ['minimax', 'sat'],
    },
    patterns: [
      { pattern: /\bconstraint\s+graph\b/i, weight: 60, label: 'constraint graph' },
      { pattern: /\btree[-\s]?structured\s+CSP/i, weight: 50, label: 'tree-structured CSP' },
    ],
  },
  {
    viz: 'ReginAllDiff', label: "Régin's GAC for AllDifferent", module: 'csp',
    blurb: 'Bipartite matching catches what pairwise ≠ misses.',
    intents: ['ENFORCE', 'TRACE', 'IDENTIFY'],
    triggers: {
      strong: ['alldifferent', 'all-different', 'all different', "régin", 'regin', 'gac'],
      medium: ['bipartite matching', 'pairwise inequality', "hall's theorem", "hall's condition", 'pigeonhole'],
      weak: ['matching'],
      anti: ['minimax', 'cnf'],
    },
    patterns: [
      { pattern: /\bAllDifferent\b/i, weight: 70, label: 'AllDifferent' },
      { pattern: /\bR[eé]gin\b/i, weight: 80, label: "Régin's algorithm" },
      { pattern: /\bGAC\b/i, weight: 35, label: 'GAC' },
    ],
  },
  {
    viz: 'TreeCSP', label: 'Tree-CSP solver O(nd²)', module: 'csp',
    blurb: 'Directional AC + assignment pass on a tree-structured CSP.',
    intents: ['SOLVE', 'TRACE', 'ANALYZE'],
    triggers: {
      strong: ['tree csp', 'tree-csp', 'tree-structured csp', 'directional arc consistency', 'directional ac'],
      medium: ['topological order', 'leaves to root', 'parent-child'],
      weak: ['tree'],
      anti: ['cnf', 'minimax'],
    },
    patterns: [
      { pattern: /\bO\s*\(\s*n\s*\*?\s*d\s*\^\s*2\s*\)/i, weight: 40, label: 'O(n·d²) tree-CSP complexity' },
    ],
  },
  {
    viz: 'EssencePrime', label: 'Essence Prime editor', module: 'csp',
    blurb: 'Browse and edit Essence Prime models.',
    intents: ['MODEL', 'DEFINE'],
    triggers: {
      strong: ['essence prime', "essence'", 'savile row', 'savilerow', 'nightingale'],
      medium: ['matrix indexed by', 'find a model', 'such that', 'given'],
      weak: ['model'],
      anti: ['minimax', 'sat'],
    },
    patterns: [
      { pattern: /\bgiven\s+\w+\s*:\s*int\b/i, weight: 35, label: 'given X : int (Essence Prime)' },
      { pattern: /\bmatrix\s+indexed\s+by\b/i, weight: 50, label: 'matrix indexed by' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  //  Logic
  // ──────────────────────────────────────────────────────────────────────
  {
    viz: 'TruthTable', label: 'Truth-table builder', module: 'logic',
    blurb: 'Tabulate any propositional formula.',
    intents: ['TRACE', 'ANALYZE', 'IDENTIFY'],
    triggers: {
      strong: ['truth table', 'tabulate', 'tautology', 'contradiction', 'contingent', 'valid formula', 'satisfiable formula'],
      medium: ['rows', 'all assignments', 'evaluate'],
      weak: ['true', 'false'],
      anti: ['csp', 'minimax'],
    },
    patterns: [
      { pattern: /\btruth\s+table\b/i, weight: 70, label: 'truth table phrase' },
      { pattern: /\b(tautology|tautological)\b/i, weight: 40, label: 'tautology mention' },
    ],
  },
  {
    viz: 'Resolution', label: 'Resolution proof', module: 'logic',
    blurb: 'Refutation-based proof of KB ⊨ α.',
    intents: ['PROVE', 'TRACE'],
    triggers: {
      strong: ['resolution', 'refutation', 'resolution proof', 'entailment', 'entails', 'kb ⊨', 'knowledge base entails'],
      medium: ['resolve clauses', 'empty clause', 'derive false', 'cnf clauses'],
      weak: ['proof', 'derive'],
      anti: ['minimax', 'csp', 'grid'],
    },
    patterns: [
      { pattern: /\bKB\s*(?:⊨|\\models|\\?vDash|entails)\s*[αa-z]/i, weight: 70, label: 'KB ⊨ α notation' },
      { pattern: /\bresolu[ct]ion\s+(?:proof|rule|refutation)/i, weight: 60, label: 'resolution proof/rule' },
      { pattern: /\bempty\s+clause\b|⊥|\\bot/i, weight: 30, label: 'empty clause / ⊥' },
    ],
  },
  {
    viz: 'HornChain', label: 'Forward / backward chaining', module: 'logic',
    blurb: 'Horn-clause inference in both directions.',
    intents: ['PROVE', 'TRACE'],
    triggers: {
      strong: ['horn clause', 'horn-clause', 'forward chaining', 'backward chaining', 'definite clause'],
      medium: ['facts and rules', 'agenda', 'goal regression'],
      weak: ['chain', 'derive', 'goal'],
      anti: ['minimax', 'csp'],
    },
    patterns: [
      { pattern: /\b(forward|backward)\s+chain(?:ing)?\b/i, weight: 70, label: 'forward/backward chaining' },
      { pattern: /\bhorn\s+(?:clause|formula|kb)\b/i, weight: 60, label: 'Horn clause' },
    ],
  },
  {
    viz: 'CNFEncoder', label: 'CNF conversion (4-step)', module: 'logic',
    blurb: 'Equivalence-preserving CNF conversion.',
    intents: ['TRACE', 'MODEL'],
    triggers: {
      strong: ['convert to cnf', 'cnf conversion', 'cnf form', 'conjunctive normal form'],
      medium: ['eliminate implications', 'demorgan', "de morgan", 'distribute', 'rename'],
      weak: ['cnf'],
      anti: ['minimax', 'csp', 'grid'],
    },
    patterns: [
      { pattern: /\bconvert.*?to\s+CNF/i, weight: 60, label: 'convert ... to CNF' },
      { pattern: /\bCNF\b/i, weight: 15, label: 'CNF mentioned' },
    ],
  },
  {
    viz: 'TseitinEncoder', label: 'Tseitin transformation', module: 'logic',
    blurb: 'Equisatisfiable linear-size CNF with fresh variables.',
    intents: ['TRACE', 'MODEL'],
    triggers: {
      strong: ['tseitin', 'equisatisfiable', 'plaisted', 'plaisted-greenbaum'],
      medium: ['fresh variable', 'auxiliary variable', 'biconditional'],
      weak: ['encoding'],
      anti: ['minimax', 'csp'],
    },
    patterns: [
      { pattern: /\bTseitin\b/i, weight: 80, label: 'Tseitin' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  //  SAT
  // ──────────────────────────────────────────────────────────────────────
  {
    viz: 'DPLL', label: 'DPLL trace', module: 'sat',
    blurb: 'Decision stack + unit propagation + pure literal.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['dpll', 'davis-putnam', 'davis putnam', 'unit propagation', 'pure literal', 'sat solver'],
      medium: ['boolean assignment', 'decision level', 'flip', 'backtrack on conflict'],
      weak: ['decision', 'satisfiable'],
      anti: ['minimax', 'arc consistency'],
    },
    patterns: [
      { pattern: /\bDPLL\b/i, weight: 80, label: 'DPLL' },
      { pattern: /\bunit\s+propagation\b/i, weight: 40, label: 'unit propagation' },
      { pattern: /\bpure\s+literal\b/i, weight: 30, label: 'pure literal' },
    ],
  },
  {
    viz: 'CDCL', label: 'CDCL (conflict-driven clause learning)', module: 'sat',
    blurb: 'Implication graph + 1-UIP cut + backjump.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['cdcl', 'conflict-driven', 'clause learning', 'implication graph', '1-uip', 'backjump', 'learnt clause'],
      medium: ['vsids', 'lbd', 'restart', 'minisat'],
      weak: ['conflict'],
      anti: ['minimax', 'csp'],
    },
    patterns: [
      { pattern: /\bCDCL\b/i, weight: 80, label: 'CDCL' },
      { pattern: /\b1[-\s]?UIP\b/i, weight: 60, label: '1-UIP' },
      { pattern: /\bbackjump(ing)?\b/i, weight: 40, label: 'backjumping' },
    ],
  },
  {
    viz: 'WalkSAT', label: 'WALKSAT (stochastic local search SAT)', module: 'sat',
    blurb: 'Random + greedy flip-based SAT solver.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['walksat', 'walk-sat', 'stochastic local search', 'random walk sat', 'gsat'],
      medium: ['flip a variable', 'noise probability', 'random restart sat'],
      weak: ['noise'],
      anti: ['minimax', 'arc consistency'],
    },
    patterns: [
      { pattern: /\bWALKSAT\b/i, weight: 80, label: 'WALKSAT' },
    ],
  },
  {
    viz: 'TwoSAT', label: '2-SAT via SCC', module: 'sat',
    blurb: 'Implication graph + Tarjan SCC for polytime 2-SAT.',
    intents: ['SOLVE', 'TRACE', 'PROVE'],
    triggers: {
      strong: ['2-sat', '2sat', 'two-sat', 'implication graph', 'tarjan', 'kosaraju'],
      medium: ['strongly connected component', 'scc', 'polytime sat'],
      weak: ['linear time'],
      anti: ['3-sat', 'csp'],
    },
    patterns: [
      { pattern: /\b2[-\s]?SAT\b/i, weight: 80, label: '2-SAT' },
    ],
  },
  {
    viz: 'PhaseTransition', label: 'SAT phase transition', module: 'sat',
    blurb: 'Empirical SAT probability vs clause/variable ratio.',
    intents: ['ANALYZE'],
    triggers: {
      strong: ['phase transition', 'hardness peak', 'easy-hard-easy', 'satisfiability threshold'],
      medium: ['clause to variable ratio', 'critical ratio', '4.27'],
      weak: ['threshold'],
      anti: ['minimax', 'csp'],
    },
    patterns: [
      { pattern: /\bphase\s+transition\b/i, weight: 70, label: 'phase transition' },
      { pattern: /\b4\.27\b/, weight: 50, label: '4.27 ratio' },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────
//  Topic-only profiles — algorithms without a dedicated viz.
//  These funnel to a topic page + a related viz.
// ──────────────────────────────────────────────────────────────────────

const topicOnly: AlgorithmProfile[] = [
  // Search
  {
    viz: 'SearchGrid', label: 'Iterative deepening (IDS)', module: 'search',
    blurb: 'DFS with increasing depth limit — combines BFS\'s completeness with DFS\'s space.',
    intents: ['TRACE', 'ANALYZE'],
    triggers: {
      strong: ['iterative deepening', 'ids', 'iterative-deepening'],
      medium: ['depth limit', 'increase depth', 'redo previous'],
      weak: ['deepening'],
      anti: ['minimax', 'csp', 'cnf'],
    },
    patterns: [{ pattern: /\bIDS\b/, weight: 50, label: 'IDS abbreviation' }],
  },
  {
    viz: 'SearchGrid', label: 'IDA* (iterative deepening A*)', module: 'search',
    blurb: 'IDS using f = g + h as the cutoff threshold — memory-efficient A*.',
    intents: ['TRACE', 'ANALYZE'],
    triggers: {
      strong: ['ida*', 'iterative deepening a*'],
      medium: ['f-bound', 'threshold', 'cost cutoff'],
      weak: [],
      anti: ['minimax', 'csp'],
    },
    patterns: [{ pattern: /\bIDA\*\b/, weight: 70, label: 'IDA*' }],
  },
  {
    viz: 'SearchCompare', label: 'Bidirectional search', module: 'search',
    blurb: 'Run two simultaneous searches from start and goal; meet in the middle. $O(b^{d/2})$.',
    intents: ['ANALYZE', 'TRACE'],
    triggers: {
      strong: ['bidirectional search', 'meet in the middle'],
      medium: ['forward search', 'backward search'],
      weak: [],
      anti: ['csp', 'minimax'],
    },
    patterns: [],
  },
  {
    viz: 'HillClimbSA', label: 'Beam search', module: 'search',
    blurb: 'Local beam search keeps $k$ best states per generation.',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['beam search', 'local beam', 'stochastic beam'],
      medium: ['k best', 'breadth k'],
      weak: ['beam'],
      anti: ['csp', 'cnf', 'minimax'],
    },
    patterns: [],
  },
  // Adversarial
  {
    viz: 'MinimaxTree', label: 'Quiescence search / horizon effect', module: 'adversarial',
    blurb: 'Extend search beyond the cutoff for noisy positions to avoid the horizon effect.',
    intents: ['DEFINE', 'TRACE'],
    triggers: {
      strong: ['quiescence search', 'horizon effect', 'noisy moves'],
      medium: ['extend on capture', 'extend on check'],
      weak: ['captures', 'check'],
      anti: ['csp', 'cnf'],
    },
    patterns: [{ pattern: /\bquiescence\b/i, weight: 60, label: 'quiescence' }],
  },
  {
    viz: 'MinimaxTree', label: 'Transposition table (Zobrist hashing)', module: 'adversarial',
    blurb: 'Cache previously-seen positions with their backed-up value, depth and bound flag.',
    intents: ['DEFINE'],
    triggers: {
      strong: ['transposition table', 'zobrist hashing', 'position cache'],
      medium: ['hash position', 'cache value'],
      weak: ['cache'],
      anti: ['csp', 'cnf'],
    },
    patterns: [{ pattern: /\btransposition\s+table\b/i, weight: 60, label: 'transposition table' }],
  },
  {
    viz: 'MinimaxTree', label: 'Killer / history / iterative deepening for games', module: 'adversarial',
    blurb: 'Move-ordering tricks that maximise α-β pruning.',
    intents: ['DEFINE', 'COMPARE'],
    triggers: {
      strong: ['killer heuristic', 'history heuristic'],
      medium: ['move ordering for ab', 'iterative deepening for games'],
      weak: ['killer'],
      anti: ['csp'],
    },
    patterns: [],
  },
  // CSP
  {
    viz: 'AC3', label: 'PC-2 / Path consistency / k-consistency', module: 'csp',
    blurb: 'Stronger consistency than AC; needed for backtrack-free search on width-$w$ CSPs.',
    intents: ['ENFORCE', 'DEFINE', 'ANALYZE'],
    triggers: {
      strong: ['path consistency', 'pc-2', 'k-consistency', 'strong k-consistency', 'freuder', 'backtrack-free'],
      medium: ['width of a csp', 'induced width'],
      weak: ['triple'],
      anti: ['minimax', 'cnf'],
    },
    patterns: [{ pattern: /\bpath\s+consistency\b/i, weight: 70, label: 'path consistency' }],
  },
  {
    viz: 'AC3', label: 'Singleton arc consistency (SAC)', module: 'csp',
    blurb: 'Per-value probe: tentatively assign, run AC, remove if wipeout.',
    intents: ['ENFORCE'],
    triggers: {
      strong: ['singleton arc consistency', 'sac', 'failed-literal probing for csp'],
      medium: ['probing', 'dead value'],
      weak: [],
      anti: ['minimax'],
    },
    patterns: [{ pattern: /\bsingleton\s+arc\s+consistency\b/i, weight: 70, label: 'SAC' }],
  },
  {
    viz: 'CSPLab', label: 'Conflict-directed backjumping (CBJ)', module: 'csp',
    blurb: 'Backjump to the most recent conflict, not chronologically.',
    intents: ['TRACE'],
    triggers: {
      strong: ['conflict-directed backjumping', 'cbj', 'backjumping', 'conflict set'],
      medium: ['nogood', 'chronological backtracking'],
      weak: ['conflict'],
      anti: ['cnf'],
    },
    patterns: [{ pattern: /\bbackjump(ing)?\b/i, weight: 50, label: 'backjumping' }],
  },
  {
    viz: 'CSPLab', label: 'Bucket / variable elimination', module: 'csp',
    blurb: 'Eliminate vars by joining + projecting bucketed constraints. O(n · d^{w*+1}).',
    intents: ['SOLVE', 'TRACE'],
    triggers: {
      strong: ['bucket elimination', 'variable elimination for csp', 'dechter'],
      medium: ['induced width', 'join then project'],
      weak: [],
      anti: ['cnf'],
    },
    patterns: [],
  },
  {
    viz: 'CSPLab', label: 'Symmetry breaking (lex / SBDS / GE-tree)', module: 'csp',
    blurb: 'Avoid exploring equivalent solutions via static or dynamic symmetry-breaking.',
    intents: ['MODEL'],
    triggers: {
      strong: ['symmetry breaking', 'lex-leader', 'lex leader', 'sbds', 'ge-tree'],
      medium: ['equivalent solutions', 'canonical solution'],
      weak: ['symmetry'],
      anti: ['cnf'],
    },
    patterns: [{ pattern: /\bsymmetry\s+breaking\b/i, weight: 60, label: 'symmetry breaking' }],
  },
  // Logic
  {
    viz: 'TruthTable', label: 'Tableau / analytic tableau', module: 'logic',
    blurb: 'Refutation by branching expansion rules.',
    intents: ['PROVE', 'TRACE'],
    triggers: {
      strong: ['tableau', 'analytic tableau', 'beth tableau'],
      medium: ['signed formula', 'branch closure'],
      weak: [],
      anti: ['csp'],
    },
    patterns: [{ pattern: /\btableau\b/i, weight: 60, label: 'tableau' }],
  },
  {
    viz: 'TruthTable', label: 'Soundness / completeness reasoning', module: 'logic',
    blurb: 'Distinguish ⊨ (semantic) from ⊢ (syntactic) entailment.',
    intents: ['DEFINE', 'PROVE'],
    triggers: {
      strong: ['soundness', 'completeness', 'semantic entailment', 'syntactic derivation'],
      medium: ['proof theory', 'model theory'],
      weak: ['sound', 'complete'],
      anti: ['csp'],
    },
    patterns: [],
  },
  // SAT
  {
    viz: 'CDCL', label: 'VSIDS / branching heuristic for CDCL', module: 'sat',
    blurb: 'Activity-bumping + decay drives variable choice in modern SAT solvers.',
    intents: ['DEFINE', 'TRACE'],
    triggers: {
      strong: ['vsids', 'phase saving', 'branching heuristic sat'],
      medium: ['activity', 'decay'],
      weak: [],
      anti: ['csp'],
    },
    patterns: [{ pattern: /\bVSIDS\b/i, weight: 70, label: 'VSIDS' }],
  },
  {
    viz: 'CDCL', label: 'Two-watched literals (UP data structure)', module: 'sat',
    blurb: 'O(1) amortised unit propagation by tracking 2 literals per clause.',
    intents: ['DEFINE'],
    triggers: {
      strong: ['watched literals', 'two-watched literals', 'bcp', 'efficient unit propagation'],
      medium: ['watcher'],
      weak: [],
      anti: ['csp'],
    },
    patterns: [],
  },
  {
    viz: 'CDCL', label: 'Restart strategy (Luby / geometric)', module: 'sat',
    blurb: 'Periodically clear decisions to escape bad subtrees; keep learnt clauses.',
    intents: ['DEFINE'],
    triggers: {
      strong: ['restart strategy', 'luby sequence', 'geometric restart', 'heavy-tailed'],
      medium: ['restart'],
      weak: [],
      anti: ['csp'],
    },
    patterns: [{ pattern: /\bLuby\b/i, weight: 60, label: 'Luby' }],
  },
  {
    viz: 'DPLL', label: 'SAT preprocessing (BVE / subsumption / vivification)', module: 'sat',
    blurb: 'Eliminate variables / shorten clauses before SAT solving.',
    intents: ['ENFORCE', 'DEFINE'],
    triggers: {
      strong: ['bve', 'bounded variable elimination', 'subsumption', 'vivification', 'blocked clause', 'self-subsuming resolution', 'sat preprocessing'],
      medium: ['probing'],
      weak: [],
      anti: ['csp', 'minimax'],
    },
    patterns: [{ pattern: /\bBVE\b/, weight: 60, label: 'BVE' }],
  },
  {
    viz: 'CNFEncoder', label: 'Cardinality / AtMost-k encodings', module: 'sat',
    blurb: 'Encode AtMost-k constraints to CNF: pairwise / sequential / totalizer / ladder.',
    intents: ['MODEL'],
    triggers: {
      strong: ['at most k', 'cardinality encoding', 'sequential counter', 'totalizer', 'ladder encoding', 'order encoding'],
      medium: ['amo', 'amk'],
      weak: ['cardinality'],
      anti: ['csp'],
    },
    patterns: [{ pattern: /\bat[-\s]most[-\s]?\d+\b/i, weight: 50, label: 'at-most-k' }],
  },
  {
    viz: 'Resolution', label: 'Pigeonhole / proof complexity lower bound', module: 'sat',
    blurb: 'Resolution requires exponentially many steps to refute PHP_n.',
    intents: ['ANALYZE', 'PROVE'],
    triggers: {
      strong: ['pigeonhole formula', 'php', 'haken', 'proof complexity', 'extended resolution', 'cutting planes'],
      medium: ['exponential lower bound'],
      weak: ['pigeonhole'],
      anti: [],
    },
    patterns: [{ pattern: /\bPHP_?\d?\b/, weight: 50, label: 'PHP_n' }],
  },
  // Modelling
  {
    viz: 'EssencePrime', label: 'Modelling pattern (set/multiset/sequence/function/partition/relation)', module: 'csp',
    blurb: 'Identify the abstract pattern, then encode as matrices in Essence Prime.',
    intents: ['MODEL', 'IDENTIFY'],
    triggers: {
      strong: ['modelling pattern', 'sequence', 'multiset', 'partition', 'function (modelling)', 'relation (modelling)', 'viewpoint'],
      medium: ['set of k', 'channel', 'dual model'],
      weak: ['set', 'function', 'relation'],
      anti: ['minimax', 'cnf'],
    },
    patterns: [{ pattern: /\bmodelling\s+pattern\b/i, weight: 60, label: 'modelling pattern' }],
  },
  {
    viz: 'EssencePrime', label: 'Channelling between viewpoints', module: 'csp',
    blurb: 'Linked dual models; propagation flows both ways through the channel.',
    intents: ['MODEL'],
    triggers: {
      strong: ['channelling', 'channeling', 'dual model', 'two viewpoints', 'primal-dual'],
      medium: ['linked csp'],
      weak: [],
      anti: ['cnf'],
    },
    patterns: [{ pattern: /\bchanne?l(?:l)?ing\b/i, weight: 60, label: 'channelling' }],
  },
];

// Combined export
for (const tp of topicOnly) profiles.push(tp);

// Indexed lookup
export const profileByViz: Record<VizKey, AlgorithmProfile | undefined> = profiles.reduce(
  (acc, p) => { acc[p.viz] = p; return acc; },
  {} as Record<VizKey, AlgorithmProfile | undefined>,
);
