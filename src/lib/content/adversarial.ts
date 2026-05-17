import type { Module } from '../types';

export const adversarialModule: Module = {
  id: 'adversarial',
  title: 'Module 2 · Adversarial Search & Games',
  slug: 'adversarial',
  oneLiner: 'Minimax, alpha-beta, evaluation functions, and Monte-Carlo Tree Search.',
  topics: [
    {
      id: 'games',
      slug: 'game-formulation',
      module: 'Module 2 · Adversarial',
      title: 'Game formulation',
      oneLiner: 'Two-player, zero-sum, perfect-information games as search problems.',
      sections: [
        {
          id: 'definitions',
          title: 'Definitions',
          blocks: [
            { kind: 'md', body: `A **game** as a search problem:

- $s_0$ — initial state (e.g. starting board)
- $\\mathrm{ToMove}(s)$ — which player moves in state $s$ (MAX or MIN)
- $\\mathrm{Actions}(s)$ — legal moves
- $\\mathrm{Result}(s, a)$ — resulting state
- $\\mathrm{IsTerminal}(s)$ — game over?
- $\\mathrm{Utility}(s, p)$ — final numerical value for player $p$ at terminal $s$

**Zero-sum:** $\\mathrm{Utility}(s, \\text{MAX}) + \\mathrm{Utility}(s, \\text{MIN}) = 0$ for all terminal $s$.

**Perfect information:** both players see the full state (no chance, no hidden info).

The **game tree** alternates MAX and MIN nodes. A **strategy** for MAX specifies a move at every reachable MAX node.` },
          ],
        },
      ],
      flashcards: [
        { id: 'g1', q: 'What are the components of a game (as a search problem)?', a: 'Initial state, ToMove(s), Actions(s), Result(s,a), IsTerminal(s), Utility(s,p).' },
        { id: 'g2', q: 'What does "zero-sum" mean?', a: 'Utility(s,MAX) + Utility(s,MIN) = 0 at every terminal — one player\'s gain is the other\'s loss.' },
      ],
    },

    {
      id: 'minimax',
      slug: 'minimax',
      module: 'Module 2 · Adversarial',
      title: 'Minimax',
      oneLiner: 'Compute optimal play assuming both players play optimally.',
      sections: [
        {
          id: 'def',
          title: 'The minimax value',
          blocks: [
            { kind: 'md', body: `The **minimax value** $\\mathrm{Minimax}(s)$ of a state $s$ is the utility MAX can guarantee under optimal play by both sides:

$$\\mathrm{Minimax}(s) = \\begin{cases}
\\mathrm{Utility}(s, \\text{MAX}) & \\text{if } \\mathrm{IsTerminal}(s) \\\\
\\max_{a \\in \\mathrm{Actions}(s)} \\mathrm{Minimax}(\\mathrm{Result}(s, a)) & \\text{if } \\mathrm{ToMove}(s) = \\text{MAX} \\\\
\\min_{a \\in \\mathrm{Actions}(s)} \\mathrm{Minimax}(\\mathrm{Result}(s, a)) & \\text{if } \\mathrm{ToMove}(s) = \\text{MIN}
\\end{cases}$$

**Pseudocode** (returning the action for MAX from the root):

\`\`\`
function MINIMAX-DECISION(state):
    return arg max over a of MIN-VALUE(Result(state, a))

function MAX-VALUE(state):
    if IsTerminal(state): return Utility(state)
    v := -infinity
    for a in Actions(state):
        v := max(v, MIN-VALUE(Result(state, a)))
    return v

function MIN-VALUE(state):
    if IsTerminal(state): return Utility(state)
    v := +infinity
    for a in Actions(state):
        v := min(v, MAX-VALUE(Result(state, a)))
    return v
\`\`\`

**Complexity:** time $O(b^m)$ where $b$ is branching factor and $m$ is tree depth; space $O(bm)$ (DFS).` },
            { kind: 'callout', variant: 'keyfact', title: 'Minimax assumes a rational opponent', body: 'If your opponent is suboptimal, the minimax move is still defensible (a *guaranteed* lower bound on MAX\'s utility), but a different move might exploit their mistakes better.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: minimax on a tree',
          blocks: [
            { kind: 'viz', viz: 'MinimaxTree', title: 'Backed-up minimax values', props: { pruning: false } },
          ],
        },
      ],
      flashcards: [
        { id: 'm1', q: 'Minimax time and space complexity?', a: 'Time O(b^m), space O(bm) (depth-first traversal of the game tree).' },
      ],
    },

    {
      id: 'alphabeta',
      slug: 'alpha-beta',
      module: 'Module 2 · Adversarial',
      title: 'Alpha-beta pruning',
      oneLiner: 'Prune branches that cannot influence the minimax value.',
      sections: [
        {
          id: 'idea',
          title: 'The α/β bounds',
          blocks: [
            { kind: 'md', body: `Maintain two values during DFS:
- **$\\alpha$** — the best (highest) value MAX is currently guaranteed at the path so far.
- **$\\beta$** — the best (lowest) value MIN is currently guaranteed at the path so far.

Update on the way down. Prune when $\\alpha \\ge \\beta$:

- At a **MAX node** computing $v$: if $v \\ge \\beta$, MIN will never let us reach here (it has a better option above) — **β-cut**.
- At a **MIN node** computing $v$: if $v \\le \\alpha$, MAX will never let us reach here — **α-cut**.

**Pseudocode:**

\`\`\`
function ALPHA-BETA-DECISION(state):
    v, move := MAX-VALUE(state, -infinity, +infinity)
    return move

function MAX-VALUE(state, alpha, beta):
    if IsTerminal(state): return Utility(state), null
    v := -infinity; bestMove := null
    for a in Actions(state):
        v2, _ := MIN-VALUE(Result(state, a), alpha, beta)
        if v2 > v:
            v, bestMove := v2, a
            alpha := max(alpha, v)
        if v >= beta: return v, bestMove        # β-cut
    return v, bestMove

function MIN-VALUE(state, alpha, beta):
    if IsTerminal(state): return Utility(state), null
    v := +infinity; bestMove := null
    for a in Actions(state):
        v2, _ := MAX-VALUE(Result(state, a), alpha, beta)
        if v2 < v:
            v, bestMove := v2, a
            beta := min(beta, v)
        if v <= alpha: return v, bestMove        # α-cut
    return v, bestMove
\`\`\`

Returns **exactly** the minimax value; pruning is safe.` },
          ],
        },
        {
          id: 'ordering',
          title: 'Move ordering',
          blocks: [
            { kind: 'md', body: `Pruning is **maximally effective** when the best move is examined first at each node.

- **Best case** (perfect ordering): $O(b^{m/2})$ — effective branching factor $\\sqrt{b}$. **Halves the effective depth.**
- **Worst case** (anti-sorted): no pruning, $O(b^m)$.
- **Random ordering:** $O(b^{3m/4})$ on average.

**Practical move ordering:**
- Killer-move heuristic: try moves that caused cuts at sibling nodes.
- Transposition tables: cache values of seen states.
- Iterative deepening: use the best move from depth $d-1$ as the first move at depth $d$.` },
            { kind: 'callout', variant: 'keyfact', title: 'Why √b matters', body: 'In chess, b ≈ 35. Without pruning, search to depth d sees ~35^d nodes; with perfect ordering, ~6^d. The difference between 6-ply and 12-ply play.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: alpha-beta vs minimax',
          blocks: [
            { kind: 'viz', viz: 'MinimaxTree', title: 'α-β pruning highlighted', props: { pruning: true } },
          ],
        },
      ],
      flashcards: [
        { id: 'a1', q: 'Best-case time complexity of alpha-beta with perfect move ordering?', a: 'O(b^(m/2)) — effective branching factor √b, effectively double the depth reachable.' },
        { id: 'a2', q: 'Does alpha-beta return a different value to minimax?', a: 'No — exactly the same value at the root. It just visits fewer nodes.' },
        { id: 'a3', q: 'Why do MAX nodes cut on v ≥ β?', a: 'Because β is the best MIN can guarantee above; if MAX can already achieve β here, MIN will choose elsewhere — exploring further is wasted.' },
      ],
      pitfalls: [
        'Watch the inequality. AIMA uses ≥ for the β-cut; with > you fail to prune at ties and the algorithm is still correct but slower.',
        'Pruning is order-dependent — your "right answer" for which nodes get pruned depends on the order you visit children.',
      ],
    },

    {
      id: 'imperfect',
      slug: 'imperfect-realtime',
      module: 'Module 2 · Adversarial',
      title: 'Cutoff search & evaluation functions',
      oneLiner: 'How to play in practice when you can\'t reach terminals.',
      sections: [
        {
          id: 'cutoff',
          title: 'Cutoff and evaluation',
          blocks: [
            { kind: 'md', body: `Real game trees are too big to search to terminals. Replace:
- $\\mathrm{IsTerminal}$ with a **cutoff test** $\\mathrm{Cutoff}(s, d)$ — usually "depth $\\ge D$".
- $\\mathrm{Utility}$ with an **evaluation function** $\\mathrm{Eval}(s)$ — an estimate of utility at non-terminals.

**Requirements for Eval:**
1. **Same ordering as Utility** at terminals.
2. **Cheap** — you're evaluating millions of nodes.
3. **Reflects winning chances** — uncorrelated with outcome ⇒ useless.

**Typical form:** linear weighted sum of features
$$\\mathrm{Eval}(s) = \\sum_i w_i \\cdot f_i(s)$$

For chess: $f_i$ = material counts ($w_1 = 9$ for queen, $5$ for rook, …), pawn structure, king safety, mobility.` },
          ],
        },
        {
          id: 'tradeoffs',
          title: 'Trade-offs',
          blocks: [
            { kind: 'md', body: `**Deeper search vs better eval** is the fundamental trade-off. Both are valuable; in chess, increases in depth historically beat increases in eval sophistication.

**Iterative deepening + alpha-beta** is the standard chess engine architecture: keep going deeper until time runs out, always have a result to report.

**Transposition tables** memoize evaluated positions; with Zobrist hashing, lookup is O(1). Essential for chess where many move sequences reach the same position.` },
            { kind: 'callout', variant: 'pitfall', title: 'Beware the "Eval = 0 means equal" trap', body: 'A linear material count for chess outputs 0 for equal material — but the position can be massively winning for whoever\'s to move. Evals should ideally fold in initiative/tempo.' },
          ],
        },
      ],
      flashcards: [
        { id: 'e1', q: 'What does a cutoff test replace, and what replaces Utility(s)?', a: 'Cutoff replaces IsTerminal; Eval(s) replaces Utility(s) at non-terminal nodes.' },
        { id: 'e2', q: 'Three requirements for a good evaluation function?', a: 'Same ordering as Utility on terminals; cheap to compute; correlated with winning chances.' },
      ],
    },

    {
      id: 'mcts',
      slug: 'mcts',
      module: 'Module 2 · Adversarial',
      title: 'Monte-Carlo Tree Search (MCTS)',
      oneLiner: 'Selectively grow a game tree using random rollouts and UCB1.',
      sections: [
        {
          id: 'why',
          title: 'Why MCTS',
          blocks: [
            { kind: 'md', body: `For games where:
- Branching factor is huge (Go: $b \\approx 250$ — alpha-beta dies)
- No good evaluation function exists (Go board positions are hard to score)

MCTS doesn't need an Eval — it uses **random rollouts** as a proxy for terminal value.

**Famous deployment:** AlphaGo combines MCTS with neural network policy and value heads — same MCTS skeleton, just with the rollouts replaced/guided by deep nets.` },
          ],
        },
        {
          id: 'four-phases',
          title: 'The four phases of one iteration',
          blocks: [
            { kind: 'md', body: `Each MCTS iteration does:

1. **Selection.** From the root, descend the existing tree using the **tree policy** (UCB1) until reaching a node with unexpanded children, or a terminal.
2. **Expansion.** Add one new child to the tree (typically a single untried action).
3. **Simulation / Rollout / Playout.** From the new node, play out using the **default policy** (typically uniform random) until reaching a terminal state.
4. **Backpropagation.** Walk back up the path, updating each node's visit count $N$ and accumulated value $W$ (or wins).

After a fixed number of iterations (or time budget), choose the move at the root: typically the most-visited child (most robust), occasionally the highest mean value.` },
          ],
        },
        {
          id: 'ucb',
          title: 'UCB1 — the tree policy',
          blocks: [
            { kind: 'md', body: `Choose child $i$ of a node with $N$ visits that maximises:

$$\\mathrm{UCB1}(i) = \\underbrace{\\frac{W_i}{N_i}}_{\\text{exploit}} + \\underbrace{C \\sqrt{\\frac{\\ln N}{N_i}}}_{\\text{explore}}$$

where:
- $W_i$ = accumulated reward / wins from child $i$
- $N_i$ = visits to child $i$
- $N$ = visits to parent
- $C$ = exploration constant (theoretical $\\sqrt 2$ for rewards in $[0,1]$; tuned in practice)

The two terms balance **exploitation** (high mean reward) and **exploration** (under-visited nodes get a large bonus). When applied recursively down a search tree, this is called **UCT** (Upper Confidence bounds applied to Trees; Kocsis & Szepesvári, 2006).

**Why the formula:** UCB1 is the original multi-armed-bandit algorithm with regret $O(\\log n)$. Treating each child as an arm gives the bound on regret per node.` },
            { kind: 'callout', variant: 'pitfall', title: '$C$ is dimensionful', body: '$C = \\sqrt 2$ is only theoretically optimal when rewards are in $[0,1]$. If you use win counts or scaled rewards, $C$ should change. Most engines tune $C$ empirically.' },
          ],
        },
        {
          id: 'strengths',
          title: 'Strengths and weaknesses',
          blocks: [
            { kind: 'md', body: `**Strengths**
- No domain-specific eval needed.
- Asymmetric tree growth — focuses on promising lines.
- **Anytime** — stop whenever; current best move is meaningful.
- Parallelises naturally.

**Weaknesses**
- Random rollouts can be noisy; pure MCTS is weak in tactical games (chess, where calculation matters more than positional vibe).
- Sensitive to the exploration constant.
- Hard to prove a position lost — visits accumulate slowly on losing branches.` },
            { kind: 'callout', variant: 'whatif', title: 'You set $C = 0$', body: 'Pure exploitation: MCTS just keeps re-rolling out from whichever child happens to have the highest mean — never explores others, gets stuck.' },
            { kind: 'callout', variant: 'whatif', title: 'You set $C$ very large', body: 'Effectively random tree growth (exploration dominates). The means are noisy and you waste visits on bad moves.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: MCTS on a small game',
          blocks: [
            { kind: 'viz', viz: 'MCTSTree', title: 'Watch UCB1 grow the tree', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'mc1', q: 'Four phases of an MCTS iteration?', a: 'Selection (UCB1 descent), Expansion (add a child), Simulation/Rollout (random playout to terminal), Backpropagation (update N and W up the path).' },
        { id: 'mc2', q: 'Write down UCB1.', a: 'UCB1(i) = W_i/N_i + C·√(ln N / N_i).' },
        { id: 'mc3', q: 'What is "UCT"?', a: 'Upper Confidence bounds applied to Trees — UCB1 used as the selection policy in MCTS (Kocsis & Szepesvári 2006).' },
        { id: 'mc4', q: 'How do you finally pick a move at the MCTS root?', a: 'Typically the child with the most visits (robust choice). Sometimes the highest mean reward.' },
        { id: 'mc5', q: 'Why does MCTS beat alpha-beta in Go?', a: 'b ≈ 250 makes alpha-beta tractable to only shallow depth; no good evaluation function exists; MCTS doesn\'t need one.' },
      ],
    },
  ],
};
