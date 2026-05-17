// Synonym & abbreviation map. Each line maps the canonical (left) to its surface forms.
// Used to expand queries — when user types one form, we add all the others to the token set.

export const synonyms: Record<string, string[]> = {
  // Search
  'breadth-first search': ['bfs', 'breadth first', 'breadthfirst'],
  'depth-first search': ['dfs', 'depth first', 'depthfirst'],
  'uniform-cost search': ['ucs', 'uniform cost', 'dijkstra'],
  'iterative deepening': ['ids', 'iterative deepening search', 'iddfs'],
  'a-star': ['a*', 'astar', 'a star'],
  'ida-star': ['ida*', 'idastar', 'ida star', 'iterative deepening a*'],
  'admissible': ['admissibility'],
  'consistent': ['consistency', 'monotone', 'monotonic'],
  'heuristic': ['h', 'h(n)'],
  'manhattan distance': ['manhattan', 'taxicab', 'city block'],
  'misplaced tiles': ['misplaced'],

  // Adversarial
  'minimax': ['mini-max', 'min-max'],
  'alpha-beta': ['alpha beta', 'αβ', 'α-β', 'ab pruning', 'a-b pruning', 'alphabeta'],
  'monte-carlo tree search': ['mcts', 'monte carlo', 'uct'],
  'ucb1': ['upper confidence bound', 'ucb'],
  'evaluation function': ['eval', 'eval function', 'static evaluation'],
  'transposition table': ['tt', 'memoisation', 'memoization'],

  // CSP / CP
  'constraint satisfaction problem': ['csp'],
  'constraint programming': ['cp'],
  'arc consistency': ['ac3', 'ac-3', 'arc-consistency'],
  'forward checking': ['fc'],
  'maintaining arc consistency': ['mac'],
  'minimum remaining values': ['mrv', 'fail-first', 'fail first'],
  'least constraining value': ['lcv'],
  'degree heuristic': ['degree'],
  'all-different': ['alldiff', 'alldifferent', 'all different'],
  'conjure': ['high-level compiler'],
  'essence': ['essence language'],
  'essence prime': ['essence\'', "essence'", 'eprime', 'savile row language'],
  'savile row': ['savilerow', 'sr'],
  'symmetry breaking': ['lex-leader', 'lex leader', 'doublelex'],
  'channeling': ['channelling', 'channel constraint'],
  'implied constraint': ['redundant constraint'],
  'viewpoint': ['viewpoints', 'model viewpoint'],
  'min-conflicts': ['min conflicts', 'minconflicts'],

  // Logic
  'conjunctive normal form': ['cnf'],
  'disjunctive normal form': ['dnf'],
  'resolution': ['resolution refutation'],
  'horn clause': ['horn', 'definite clause'],
  'modus ponens': ['mp'],
  'forward chaining': ['fc-chain'],
  'backward chaining': ['bc-chain', 'goal-directed'],
  'tseitin': ['tseitin transformation', 'tseitin encoding'],

  // SAT
  'boolean satisfiability': ['sat', 'satisfiability'],
  'unit propagation': ['bcp', 'boolean constraint propagation'],
  'pure literal': ['pure literal elimination'],
  'dpll': ['davis putnam', 'davis-putnam-logemann-loveland'],
  'cdcl': ['conflict-driven clause learning', 'conflict driven'],
  '1-uip': ['1uip', 'first uip', 'unique implication point'],
  'vsids': ['variable state independent decaying sum'],
  'walksat': ['walk-sat', 'walk sat'],
  'gsat': ['greedy sat'],
  'backjumping': ['non-chronological backtracking', 'cbj'],
  'watched literals': ['two-watched literals'],

  // General
  'complete': ['completeness'],
  'optimal': ['optimality'],
  'complexity': ['big o', 'time complexity', 'space complexity'],
  'pitfall': ['gotcha', 'trap', 'common mistake', 'common error'],
};

// Build the expansion map: each token → its synonyms (lowercased)
const expansionMap = new Map<string, Set<string>>();

for (const [canonical, forms] of Object.entries(synonyms)) {
  const cset = new Set([canonical, ...forms].map((s) => s.toLowerCase()));
  for (const form of cset) expansionMap.set(form, cset);
}

// Expand a single token to all its synonyms (including itself).
export function expandToken(t: string): string[] {
  const lower = t.toLowerCase();
  const set = expansionMap.get(lower);
  if (set) return [...set];
  return [lower];
}

// Expand a phrase by trying multi-word matches up to 3 words.
export function expandPhrase(tokens: string[]): string[] {
  const result = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    // try 3, 2, 1 word matches
    for (let len = Math.min(3, tokens.length - i); len >= 1; len--) {
      const phrase = tokens.slice(i, i + len).join(' ');
      const set = expansionMap.get(phrase.toLowerCase());
      if (set) {
        for (const s of set) result.add(s);
        break;
      }
    }
    result.add(tokens[i].toLowerCase());
  }
  return [...result];
}
