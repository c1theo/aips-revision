import type { VizKey } from '../types';

// Question-template matcher.
// Recognises the *shape* of an exam question (not just keywords) by matching
// structured templates. Each template captures named "slots" — e.g. an
// algorithm name, a list of variables, a CSP, a heuristic — letting us
// route + extract simultaneously with high confidence.

export interface TemplateMatch {
  templateId: string;
  description: string;          // human-readable summary of the matched shape
  viz: VizKey;                  // recommended visualiser
  slots: Record<string, string>; // named captures from the template
  confidence: number;           // 0..100 based on how cleanly the template matched
  explanation: string;          // why this template matched
}

interface Template {
  id: string;
  description: string;
  viz: VizKey;
  // pattern is matched against the normalised question (lowercased, math-stripped)
  pattern: RegExp;
  // confidence floor (added to MiniSearch-style fuzz)
  baseConfidence: number;
  // slots: names map to capture-group indices
  slotNames?: string[];
  // explanation: what this shape means
  explain: (slots: Record<string, string>) => string;
}

const T: Template[] = [
  // ─── CSP — modelling ─────────────────────────────────────────────
  {
    id: 'csp-model-as',
    description: 'Model X as a CSP',
    viz: 'ModellingWizard',
    pattern: /(?:model|formulate|write|design|give|state)\s+(?:the\s+)?(?:problem\s+)?(?:above\s+)?as\s+(?:a\s+)?(?:binary\s+)?csp/i,
    baseConfidence: 85,
    explain: () => 'Question asks you to formulate the problem as a CSP. Apply the 7-step methodology.',
  },
  {
    id: 'csp-write-out',
    description: 'Write out the CSP for X',
    viz: 'ModellingWizard',
    pattern: /write\s+(?:out\s+)?(?:the\s+)?csp\s+for/i,
    baseConfidence: 85,
    explain: () => 'Question asks for a full CSP formulation. Variables, domains, constraints.',
  },
  {
    id: 'csp-identify-pattern',
    description: 'Identify a modelling pattern',
    viz: 'EssencePrime',
    pattern: /identify\s+(?:a\s+)?(?:modelling|modeling)\s+pattern/i,
    baseConfidence: 90,
    explain: () => 'Question asks which abstract pattern (sequence / set / multiset / function / partition / relation) applies.',
  },
  {
    id: 'csp-state-vars',
    description: 'State variables / domains / constraints',
    viz: 'ModellingWizard',
    pattern: /state\s+(?:the\s+)?(?:variables|domains|constraints)/i,
    baseConfidence: 70,
    explain: () => 'Sub-task of CSP modelling — list the requested element of the formulation.',
  },

  // ─── CSP — consistency ───────────────────────────────────────────
  {
    id: 'csp-enforce-nc',
    description: 'Enforce node consistency',
    viz: 'AC3',
    pattern: /enforce\s+(?:global\s+)?node\s+consistency/i,
    baseConfidence: 90,
    explain: () => 'Apply each unary constraint, removing forbidden values from the variable\'s domain.',
  },
  {
    id: 'csp-enforce-ac',
    description: 'Enforce arc consistency',
    viz: 'AC3',
    pattern: /enforce\s+(?:global\s+)?arc\s+consistency/i,
    baseConfidence: 90,
    explain: () => 'Run AC-3 (or AC-4 / AC-2001) to fixpoint on the binary constraints.',
  },
  {
    id: 'csp-apply-ac2001',
    description: 'Apply AC-2001 / AC-3.1',
    viz: 'AC2001',
    pattern: /apply\s+ac[-\s]?(?:2001|3\.1)|with(?:\s+the)?\s+last\s+(?:support|data\s+structure|pointer)/i,
    baseConfidence: 95,
    explain: () => 'Use the last-support optimised AC algorithm; show the Last data structure at each step.',
  },
  {
    id: 'csp-arc-revised-twice',
    description: 'Find an arc revised more than once',
    viz: 'AC3',
    pattern: /(?:arc|order)\s+(?:needs|must|to\s+be|that)\s+(?:to\s+be\s+)?revised\s+(?:more\s+than\s+once|twice|\d+\s+times)/i,
    baseConfidence: 90,
    explain: () => 'Show an arc ordering where a variable\'s domain shrinks twice, forcing its incoming arcs to be re-revised.',
  },

  // ─── CSP — search ────────────────────────────────────────────────
  {
    id: 'csp-bt-dway',
    description: 'd-way backtracking',
    viz: 'CSPLab',
    pattern: /d-?way\s+(?:backtrack|backtracking|search|mac|fc)/i,
    baseConfidence: 85,
    explain: () => 'Use d-way branching: one child per value of the chosen variable.',
  },
  {
    id: 'csp-mac-search',
    description: 'MAC search',
    viz: 'CSPLab',
    pattern: /(?:mac\s+search|maintaining\s+arc\s+consistency)/i,
    baseConfidence: 85,
    explain: () => 'Run backtracking + maintaining arc consistency (AC-3 to fixpoint at every decision).',
  },
  {
    id: 'csp-fc-search',
    description: 'BT + Forward Checking',
    viz: 'CSPLab',
    pattern: /forward[-\s]?check(?:ing)?(?:\s+search)?/i,
    baseConfidence: 80,
    explain: () => 'After each decision, prune values from each unassigned neighbour\'s domain.',
  },
  {
    id: 'csp-static-order',
    description: 'Search with static variable + value order',
    viz: 'CSPLab',
    pattern: /static\s+variable\s+order|ascending\s+value\s+order|stop\s+when\s+the\s+first\s+solution/i,
    baseConfidence: 80,
    explain: () => 'Apply the specified branching strategy and ordering — record decisions and backtracks.',
  },
  {
    id: 'csp-heuristic-pick',
    description: 'Which heuristic?',
    viz: 'CSPLab',
    pattern: /which\s+(?:variable|value)\s+(?:does|should)\s+(?:mrv|degree|lcv|geelen)/i,
    baseConfidence: 85,
    explain: () => 'Apply the named heuristic; compute its decision per variable / value.',
  },

  // ─── CSP — structure ─────────────────────────────────────────────
  {
    id: 'csp-tree-structured',
    description: 'Tree-structured CSP',
    viz: 'TreeCSP',
    pattern: /tree[-\s]?structured\s+csp|tree[-\s]?csp/i,
    baseConfidence: 90,
    explain: () => 'Use directional AC + assignment pass — O(nd²), no backtracking needed.',
  },
  {
    id: 'csp-alldiff',
    description: 'AllDifferent / Régin\'s GAC',
    viz: 'ReginAllDiff',
    pattern: /alldifferent|all[-\s]?different|r[eé]gin|gac\s+(?:on|for)/i,
    baseConfidence: 85,
    explain: () => 'Use Régin\'s bipartite-matching algorithm for GAC on AllDifferent. Pairwise ≠ is strictly weaker.',
  },

  // ─── Adversarial ─────────────────────────────────────────────────
  {
    id: 'adv-minimax-trace',
    description: 'Trace minimax (optionally with α-β)',
    viz: 'MinimaxTree',
    pattern: /(?:trace|apply|run)\s+minimax|(?:alpha[-\s]?beta|α[-\s]?β)\s+(?:pruning|search)|backed[-\s]?up\s+value/i,
    baseConfidence: 88,
    explain: () => 'Bottom-up: MIN takes min of children, MAX takes max. With α-β: maintain α, β; cut when α ≥ β.',
  },
  {
    id: 'adv-mcts',
    description: 'MCTS / UCT trace',
    viz: 'MCTSTree',
    pattern: /(?:mcts|monte[-\s]?carlo\s+tree\s+search|uct|ucb1)/i,
    baseConfidence: 88,
    explain: () => 'Loop: Selection (UCB1) → Expansion → Simulation (random rollout) → Backpropagation.',
  },
  {
    id: 'adv-expectimax',
    description: 'Expectimax (stochastic)',
    viz: 'Expectimax',
    pattern: /expectimax|chance\s+node|stochastic\s+game/i,
    baseConfidence: 85,
    explain: () => 'Bottom-up: MAX takes max, MIN takes min, CHANCE takes Σ p_i · v_i.',
  },

  // ─── Logic ───────────────────────────────────────────────────────
  {
    id: 'logic-truth-table',
    description: 'Truth table / classify formula',
    viz: 'TruthTable',
    pattern: /truth\s+table|tautolog(?:y|ical)|contradict(?:ion|ory)|(?:is\s+)?(?:un)?satisfiab/i,
    baseConfidence: 80,
    explain: () => 'Enumerate 2^n rows; evaluate the formula; classify as tautology / contradiction / contingent.',
  },
  {
    id: 'logic-resolution',
    description: 'Resolution refutation',
    viz: 'Resolution',
    pattern: /resolution\s+(?:proof|rule|refutation)|by\s+resolution|refute|empty\s+clause/i,
    baseConfidence: 85,
    explain: () => 'CNF-ify KB ∪ {¬α}. Resolve until ⊥ is derived (refutes ¬α, so KB ⊨ α).',
  },
  {
    id: 'logic-entailment',
    description: 'Prove KB ⊨ α',
    viz: 'Resolution',
    pattern: /(?:kb|knowledge\s+base|gamma|γ)\s*(?:⊨|⊧|\\?models|entails?)\s*[αa-z]/i,
    baseConfidence: 85,
    explain: () => 'Show KB ∪ {¬α} is UNSAT — by resolution, truth-table, or chaining (if Horn).',
  },
  {
    id: 'logic-horn-chain',
    description: 'Forward / backward chaining (Horn)',
    viz: 'HornChain',
    pattern: /(?:forward|backward)\s+chain(?:ing)?|horn[-\s]?clause|definite\s+clause/i,
    baseConfidence: 85,
    explain: () => 'Iterate inference rules over a Horn KB. Forward = data-driven; backward = goal-driven.',
  },
  {
    id: 'logic-cnf-convert',
    description: 'Convert to CNF',
    viz: 'CNFEncoder',
    pattern: /convert\s+(?:.+?\s+)?to\s+cnf|cnf\s+conversion|cnf\s+form/i,
    baseConfidence: 85,
    explain: () => '4-step CNF conversion: eliminate ↔, eliminate →, push ¬ inwards, distribute ∨ over ∧.',
  },
  {
    id: 'logic-tseitin',
    description: 'Tseitin transformation',
    viz: 'TseitinEncoder',
    pattern: /tseitin|equisatisfiable|plaisted[-\s]?greenbaum/i,
    baseConfidence: 90,
    explain: () => 'Equisatisfiable, linear-size CNF via fresh variables for each subformula.',
  },

  // ─── SAT ─────────────────────────────────────────────────────────
  {
    id: 'sat-dpll',
    description: 'DPLL trace',
    viz: 'DPLL',
    pattern: /(?:dpll|davis[-\s]putnam|unit\s+propagation|pure\s+literal)/i,
    baseConfidence: 88,
    explain: () => 'UP to fixpoint → pure-literal → decide → recurse. Backtrack on conflict.',
  },
  {
    id: 'sat-cdcl',
    description: 'CDCL trace',
    viz: 'CDCL',
    pattern: /(?:cdcl|conflict[-\s]driven|1[-\s]uip|learnt\s+clause|backjump|implication\s+graph)/i,
    baseConfidence: 90,
    explain: () => 'On conflict: build implication graph, find 1-UIP, learn clause, backjump to 2nd-largest decision level.',
  },
  {
    id: 'sat-walksat',
    description: 'WALKSAT (stochastic SAT)',
    viz: 'WalkSAT',
    pattern: /walksat|stochastic\s+(?:local\s+)?(?:search\s+)?sat|noise\s+probability/i,
    baseConfidence: 88,
    explain: () => 'Pick random unsat clause. With probability p flip random var in it; else flip greedily.',
  },
  {
    id: 'sat-2sat',
    description: '2-SAT polytime',
    viz: 'TwoSAT',
    pattern: /2[-\s]?sat|two[-\s]?sat|implication\s+graph(?:\s+sat)?|scc(?:\s+for\s+sat)?/i,
    baseConfidence: 90,
    explain: () => 'Build implication graph from each 2-clause. UNSAT iff some var and ¬var in same SCC.',
  },

  // ─── Search ──────────────────────────────────────────────────────
  {
    id: 'search-a-star',
    description: 'A* / BFS / DFS / UCS / Greedy trace',
    viz: 'SearchGrid',
    pattern: /(?:trace|apply|run)\s+(?:a\*|a[-\s]star|bfs|dfs|ucs|greedy\s+best-?first|uniform[-\s]?cost)/i,
    baseConfidence: 85,
    explain: () => 'Maintain frontier ordered per algorithm; expand lowest-priority; record path on goal.',
  },
  {
    id: 'search-formulate',
    description: 'Formulate as a search problem',
    viz: 'SearchGrid',
    pattern: /formulate\s+(?:as\s+a\s+)?search\s+problem|state\s+space|goal\s+test|transition\s+model/i,
    baseConfidence: 80,
    explain: () => 'List: state representation, initial state, goal test, actions, transition model, step cost.',
  },
  {
    id: 'search-local',
    description: 'Local search (HC / SA / GA)',
    viz: 'HillClimbSA',
    pattern: /hill[-\s]?climb(?:ing)?|simulated\s+anneal(?:ing)?|random[-\s]restart|genetic\s+algorithm/i,
    baseConfidence: 85,
    explain: () => 'Random initial assignment; iteratively move to a neighbour by the strategy\'s acceptance rule.',
  },
];

export function matchTemplates(rawText: string): TemplateMatch[] {
  const text = rawText; // patterns are case-insensitive
  const hits: TemplateMatch[] = [];
  for (const t of T) {
    const m = text.match(t.pattern);
    if (!m) continue;
    const slots: Record<string, string> = {};
    if (t.slotNames) {
      t.slotNames.forEach((name, i) => { slots[name] = m[i + 1] ?? ''; });
    }
    hits.push({
      templateId: t.id,
      description: t.description,
      viz: t.viz,
      slots,
      confidence: t.baseConfidence,
      explanation: t.explain(slots),
    });
  }
  // Deduplicate by viz, keep highest confidence
  const byViz: Record<string, TemplateMatch> = {};
  for (const h of hits) {
    const cur = byViz[h.viz];
    if (!cur || cur.confidence < h.confidence) byViz[h.viz] = h;
  }
  return Object.values(byViz).sort((a, b) => b.confidence - a.confidence);
}
