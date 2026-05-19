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
      examples: [
        {
          id: 'gex1', difficulty: 'basic', marks: 4,
          question: 'Formulate Tic-Tac-Toe as a game. State all six components.',
          answer: `**Initial state $s_0$.** Empty 3×3 board, X to move (MAX).

**ToMove(s).** X if there are equal numbers of X and O on the board; O otherwise.

**Actions(s).** All empty cells.

**Result(s, a).** Place ToMove(s)'s symbol in cell $a$.

**IsTerminal(s).** True iff (a) some row/col/diagonal is filled by one symbol (win), or (b) board is full (draw).

**Utility(s, MAX).**
- $+1$ if X wins
- $-1$ if O wins
- $0$ if draw

Zero-sum: Utility(s, MIN) = $-$Utility(s, MAX).

**Game tree size.** Upper bound $9! = 362{,}880$ (much smaller after pruning terminal states early). Solvable exactly by minimax.`,
        },
        {
          id: 'gex2', difficulty: 'intermediate', marks: 5,
          question: 'Why is the *perfect-information* assumption crucial for minimax? Give one game where it holds and one where it doesn\'t.',
          answer: `**Why crucial.** Minimax assumes each player knows the exact state and the opponent's optimal strategy. Without full state knowledge, you cannot evaluate Result(s, a) deterministically — your optimal move depends on what you *believe* about hidden information.

**Perfect-information game:** chess. Both players see all pieces. Minimax (with depth-limited cutoff and alpha-beta) is the dominant approach.

**Imperfect-information game:** poker. Each player sees only their own cards; opponents\' hands are hidden. Strategies must be **mixed (randomised)** to be unexploitable. Solved via game-theoretic equilibrium algorithms (counterfactual regret minimisation), not minimax.

**Partial fix for imperfect info:** treat hidden state as a "chance" node and use **expectimax** to average over possibilities. Works only when you can enumerate the hidden states.`,
        },
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
      examples: [
        {
          id: 'mex1', difficulty: 'basic', marks: 6,
          question: 'Compute the minimax value of this tree. MAX at root, leaves left-to-right: 3, 12, 8, 2, 4, 6, 14, 5, 2. Branching = 3, depth = 2.',
          answer: `**Tree structure** (M = MAX, m = MIN):
\`\`\`
            M (root)
         /  |  \\
        m   m   m
       /|\\ /|\\ /|\\
       3 12 8 2 4 6 14 5 2
\`\`\`

**MIN nodes (depth 1):**
- Left:   min(3, 12, 8) = 3
- Middle: min(2, 4, 6) = 2
- Right:  min(14, 5, 2) = 2

**MAX root:** max(3, 2, 2) = **3**.

**Optimal move from root:** go *left* (achieves value 3). The actual leaf reached under optimal play is the leftmost leaf with value 3.

**Note.** The other leaves (12, 8, etc.) are computed but ignored — MIN will always pick the minimum.`,
        },
        {
          id: 'mex2', difficulty: 'advanced', marks: 8,
          question: 'Explain why minimax can be presented as a single recursive function (negamax). What is the signature, and what assumption does it require?',
          answer: `**Setup.** Standard minimax has two mutually recursive functions, MAX-VALUE and MIN-VALUE, that differ only by max/min and by which player's utility they return.

**Negamax** observes: in a **zero-sum** game,

$$\\min(a, b) = -\\max(-a, -b)$$

so we can fold both into one function that always *maximises* by negating the returned value.

**Pseudocode:**

\`\`\`
function NEGAMAX(state, depth):
    if IsTerminal(state) or depth = 0:
        return EVAL(state)          # always from the perspective of the player to move
    v := -infinity
    for a in Actions(state):
        v := max(v, -NEGAMAX(Result(state, a), depth - 1))
    return v
\`\`\`

**Crucial assumption.** \`EVAL(state)\` must return utility **from the perspective of the player to move**. The sign flip on the recursive call then automatically converts between perspectives.

**Why it matters in practice.** Real engines (chess, Go) almost always use negamax: less code duplication, less risk of perspective bugs, easier to extend with alpha-beta and transposition tables.`,
        },
        {
          id: 'mex3', difficulty: 'intermediate', marks: 4,
          question: 'For a game with branching factor $b$ and depth $m$, how many leaves does minimax evaluate? How many internal nodes?',
          answer: `**Leaves:** exactly $b^m$ — every leaf of the depth-$m$ tree is reached.

**Internal nodes:** $1 + b + b^2 + \\cdots + b^{m-1} = \\dfrac{b^m - 1}{b - 1}$.

**Total nodes evaluated:** $\\dfrac{b^{m+1} - 1}{b - 1} = O(b^m)$.

**Space:** $O(bm)$ — DFS stack stores at most one path at a time plus unexpanded siblings.

**Practical implication.** For chess, $b \\approx 35$ and a reasonable depth is $m = 8$: $35^8 \\approx 2 \\cdot 10^{12}$ leaves. Pure minimax is intractable — alpha-beta is essential.`,
        },
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
      examples: [
        {
          id: 'abex1', difficulty: 'intermediate', marks: 10,
          question: 'For the tree from the minimax example (leaves left-to-right: 3, 12, 8, 2, 4, 6, 14, 5, 2), trace alpha-beta from left to right. Which leaves are not examined?',
          answer: `**Process left-to-right.** Initial call: $(\\alpha, \\beta) = (-\\infty, +\\infty)$ at MAX root.

**Subtree 1 (MIN, children 3, 12, 8):** inherits $(\\alpha = -\\infty, \\beta = +\\infty)$.
- Leaf 3 → MIN's v = 3. $\\beta$ at this MIN node → $\\min(+\\infty, 3) = 3$. No cut (need $v \\le \\alpha = -\\infty$).
- Leaf 12 → MIN's v = $\\min(3, 12) = 3$. $\\beta$ stays 3.
- Leaf 8 → MIN's v = $\\min(3, 8) = 3$.
- MIN returns 3.

**Back at root:** $\\alpha = \\max(-\\infty, 3) = 3$.

**Subtree 2 (MIN, children 2, 4, 6):** inherits $(\\alpha = 3, \\beta = +\\infty)$.
- Leaf 2 → MIN's v = 2. $\\beta = \\min(+\\infty, 2) = 2$.
- **Check cut:** $v = 2 \\le \\alpha = 3$? YES → **α-cut** at this MIN node. Leaves 4 and 6 are **not examined**.
- MIN returns 2 (or "≤ 2"; root will discard regardless since $2 < 3$).

**Back at root:** $\\alpha$ stays 3.

**Subtree 3 (MIN, children 14, 5, 2):** inherits $(\\alpha = 3, \\beta = +\\infty)$.
- Leaf 14 → MIN's v = 14. $\\beta = 14$. No cut.
- Leaf 5 → MIN's v = $\\min(14, 5) = 5$. $\\beta = 5$. No cut ($5 > 3$).
- Leaf 2 → MIN's v = $\\min(5, 2) = 2$. $\\beta = 2$. **α-cut** ($2 \\le 3$), but no children left.
- MIN returns 2.

**Root:** $\\max(3, 2, 2) = 3$. Same as plain minimax. ✓

**Leaves not examined:** **4 and 6** (one cut, saving 2 of 9 leaves ≈ 22%).

With **better ordering** (largest-first at MIN, smallest-first at MAX), more cuts happen. Worst case (anti-sorted) means no cuts. Best case = $O(b^{m/2})$ leaves.`,
        },
        {
          id: 'abex2', difficulty: 'advanced', marks: 8,
          question: 'Show that with perfect move ordering, alpha-beta examines $O(b^{m/2})$ leaves. Explain why this is the same as searching a tree with branching factor $\\sqrt b$.',
          answer: `**Sketch of the proof.** With perfect ordering, the *first* move examined at each node is the best.

- At a MAX node, the first child (the optimal one) returns the value $v$. All other children at this node must be searched only well enough to *confirm* they're $\\le v$ — which (under perfect ordering of their MIN subtrees) takes a single leaf each in the best case.
- Symmetrically at MIN nodes.

**Counting nodes** (Knuth & Moore, 1975):

- **Leaves examined** at depth $m$ = $2 b^{\\lceil m/2 \\rceil} + 2 b^{\\lfloor m/2 \\rfloor} - 1$ for $m \\ge 2$, which is $O(b^{m/2})$.

**Equivalent branching factor.**

$$b_{\\text{eff}} = b^{m/2} \\big/ \\text{(width)}^{1/m} \\approx \\sqrt b$$

Equivalent intuition: alpha-beta searches a tree as deep but with branching $\\sqrt b$ instead of $b$.

**Concrete impact.** For chess with $b = 35$, alpha-beta makes depth-8 search examine about $35^4 \\approx 1.5 \\cdot 10^6$ leaves instead of $35^8 \\approx 2 \\cdot 10^{12}$ — six orders of magnitude. Combined with iterative deepening and transposition tables, this is what makes engines like Stockfish viable.`,
        },
        {
          id: 'abex3', difficulty: 'intermediate', marks: 4,
          question: 'Why is alpha-beta\'s answer **identical** to plain minimax? Why is it not "approximate"?',
          answer: `**Alpha-beta only prunes branches whose values cannot affect the root.**

Specifically, at a MIN node with current $v \\le \\alpha$ (where $\\alpha$ is the best MAX value found higher in the tree), the MAX ancestor will *never* choose this MIN node — it already has $\\alpha$ available. So whatever values lie deeper in that pruned subtree are irrelevant to the root.

Formally: the pruning is **sound** because the inequality used at each cut is monotone in the right direction (MIN can only decrease its $v$ further; MAX can only increase it).

**Consequence:** alpha-beta returns *exactly* the minimax value of the root, just by visiting fewer nodes.

**Not approximate.** Don't confuse with **forward pruning** (e.g. razoring, futility pruning, ProbCut), which are heuristic pruners used in real engines that *can* prune true-best subtrees — those produce approximate values. Pure alpha-beta is exact.`,
        },
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
        { id: 'e3', q: 'What is Expectimax?', a: 'Generalisation of minimax to stochastic games. Adds CHANCE nodes that compute expected value over weighted children. Used for backgammon, poker.' },
      ],
      examples: [
        {
          id: 'eex1', difficulty: 'intermediate', marks: 6,
          question: 'A linear evaluation function for chess. List 4 features and discuss the limitations of pure material counting.',
          answer: `**Linear Eval:** $\\mathrm{Eval}(s) = \\sum_i w_i \\cdot f_i(s)$.

**Feature set (one classical choice):**
1. **Material balance** — $w_Q = 9, w_R = 5, w_B = w_N = 3, w_P = 1$, summed with sign for own/opponent.
2. **Mobility** — number of legal moves; higher = better.
3. **King safety** — open files near own king, attacker count.
4. **Pawn structure** — doubled, isolated, passed pawns.

**Limitations of material-only:**
1. **Tactical blindness.** Material is equal in a position where one side is about to win the queen — the eval reports 0 but the position is winning.
2. **Endgame failure.** K+B vs K+B is drawn but evaluates equal; K+Q vs K+R is winning for K+Q but eval = +4 understates dynamic winning chances.
3. **Sacrifice positions.** Material-down for compensation (e.g. piece for two pawns + initiative) is undervalued.
4. **King safety unaccounted.** A material-equal position with one king exposed should evaluate far worse.

**Modern engines** use much richer features (often hundreds), and learn weights from millions of games (NNUE in Stockfish 12+). Linear eval is now a teaching tool, not a competitive choice.`,
        },
        {
          id: 'eex2', difficulty: 'advanced', marks: 6,
          question: 'Why is **iterative deepening** the standard architecture for time-limited game search? Give three reasons.',
          answer: `**Architecture:** repeatedly run depth-limited alpha-beta at depths 1, 2, 3, …, returning the best move when time runs out.

**Reason 1 — anytime guarantee.** At any moment, you have a *complete* best-move answer from the last finished depth. If interrupted, you're not stuck with a half-explored depth-$d+1$.

**Reason 2 — move ordering free-roll.** The best move at depth $d-1$ becomes the *first* move tried at depth $d$. Since alpha-beta's pruning depends critically on ordering, this near-perfect ordering at each iteration makes the depth-$d$ search much faster — often 5–10× speedup vs. random ordering.

**Reason 3 — overhead is bounded.** Re-searching shallower depths costs only $O(1)$ extra (geometric series): the deepest iteration dominates work. Combined with reason 2, the *total* time to reach depth $d$ via IDS is often *less* than a single non-iterative depth-$d$ search.

**Bonus reason — transposition tables.** Values stored at depth $d-1$ are usable as bounds at depth $d$ (with depth-aware bookkeeping), turning IDS into a memoised algorithm.`,
        },
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
      examples: [
        {
          id: 'mcex1', difficulty: 'intermediate', marks: 6,
          question: 'A root has visit count $N = 100$ and two children: $A$ with $N_A = 60$, $W_A = 40$; $B$ with $N_B = 40$, $W_B = 30$. With $C = \\sqrt 2$, compute UCB1 for both. Which does MCTS select?',
          answer: `**Formula:** $\\text{UCB1}(i) = W_i/N_i + C \\sqrt{\\ln N / N_i}$.

**Child A:**
- Exploit: $40/60 = 0.667$
- Explore: $\\sqrt 2 \\cdot \\sqrt{\\ln 100 / 60} = 1.414 \\cdot \\sqrt{4.605/60} = 1.414 \\cdot \\sqrt{0.0768} = 1.414 \\cdot 0.277 = 0.392$
- Total: $\\boxed{1.059}$

**Child B:**
- Exploit: $30/40 = 0.750$
- Explore: $1.414 \\cdot \\sqrt{4.605/40} = 1.414 \\cdot \\sqrt{0.115} = 1.414 \\cdot 0.339 = 0.480$
- Total: $\\boxed{1.230}$

**MCTS selects B** — higher UCB1.

**Insight.** Even though A has been visited 50% more than B, B has both *higher mean reward* (0.75 vs 0.67) and *higher exploration bonus* (smaller $N_i$). UCB1 picks B unambiguously.

If B's stats stay good as $N_B$ grows, the exploration bonus shrinks but the exploitation term grows. If they get worse, MCTS pivots back to A. This adaptive balance is what makes UCB1 effective.`,
        },
        {
          id: 'mcex2', difficulty: 'advanced', marks: 8,
          question: 'Why does MCTS *not* need a heuristic evaluation function? When is this an advantage vs disadvantage?',
          answer: `**Why not needed.** MCTS uses **random rollouts** as a stochastic proxy for "what is this position worth?". Many rollouts give an unbiased Monte-Carlo estimate of expected outcome under uniform play.

**Advantage scenarios:**
- **Go.** No good Eval exists (positions are global and hard to score by hand). Random rollouts surprisingly correlate with winning chances. Combined with UCB1 in AlphaGo + neural value net, this beat Lee Sedol in 2016.
- **General Game Playing (GGP).** Engines play arbitrary games defined by rule sets; no hand-tuned Eval is possible. MCTS is the standard approach.
- **Real-time strategy games** with huge state spaces.

**Disadvantage scenarios:**
- **Chess.** Tactical exchanges depend on calculation — random rollouts wash them out. A chess MCTS engine with raw random rollouts is much weaker than alpha-beta + good Eval. Modern chess MCTS (e.g. Leela Chess Zero) uses neural network rollouts/eval to recover.
- **Tactical puzzles.** A forced mate-in-3 is hard for MCTS to discover via random play; alpha-beta sees it immediately.

**Rule of thumb.** MCTS wins when the game is **positional + huge branching factor** and Eval is poor; alpha-beta wins when **tactical + good Eval** exists.`,
        },
        {
          id: 'mcex3', difficulty: 'intermediate', marks: 5,
          question: 'Why is the *most-visited* child the standard pick at the MCTS root, rather than highest mean reward?',
          answer: `**Robustness against statistical fluctuation.** Mean reward $W_i/N_i$ can swing wildly if $N_i$ is small — one lucky rollout dominates. Visit count is **monotone** in MCTS: under UCB1, an over-explored child stops being visited once its mean lags.

**Equivalently:** "most visits" is what MCTS would naturally pick *as the next move* if you kept running iterations forever and the algorithm converged. It expresses high confidence in addition to mean.

**Counterexamples** where you might pick something else:
- **Time pressure with low iteration count.** Use *secure child* (combines mean and visits) or *robust child* (most visits OR highest mean if both are close).
- **Best-of-policy committee.** In AlphaGo, the final move is chosen by softmax over visits at temperature $\\tau$ — robust at deployment but explorative during training.

**Three standard rules:**
1. **Max child** — highest mean. Risky if some children under-visited.
2. **Robust child** — highest visit count. Standard.
3. **Max-Robust child** — highest visit count subject to mean ≥ some threshold. Safest but may return "no move" if nothing meets threshold.`,
        },
      ],
    },
  ],
};
