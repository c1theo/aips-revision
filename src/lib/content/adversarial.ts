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

    // ─────────────────────────────────────────────────────────────────
    //   NORMAL-FORM GAMES (game theory) — separate paradigm from
    //   sequential minimax: simultaneous moves, payoff matrices,
    //   dominant strategies, Nash equilibria.
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'normal-form',
      slug: 'normal-form',
      module: 'Module 2 · Adversarial',
      title: 'Normal-form games (game theory)',
      oneLiner: 'Simultaneous-move games via payoff matrices, dominant strategies and Nash equilibria.',
      sections: [
        {
          id: 'definition',
          title: 'Normal-form game definition',
          blocks: [
            { kind: 'md', body: `A **normal-form game** is a tuple $\\langle N, (A_i)_{i \\in N}, (u_i)_{i \\in N} \\rangle$ where:

- $N$ — finite set of **players**.
- $A_i$ — finite set of **actions** (a.k.a. *pure strategies*) available to player $i$.
- $u_i : A_1 \\times \\cdots \\times A_n \\to \\mathbb{R}$ — **utility function** mapping each action profile to a real-valued payoff for player $i$.

A **profile** is a tuple $(a_1, \\ldots, a_n)$ — one action per player. Players act **simultaneously** without knowing each other's choice.

Unlike sequential games (chess, minimax), normal-form games have no turn order — both players commit to an action at the same time.` },
            { kind: 'callout', variant: 'keyfact', title: 'Sequential vs simultaneous', body: `Minimax/α-β assumes alternating moves with full observation. Normal-form games are **single-shot, simultaneous, no information about opponent's move**. Different paradigm — needs game theory, not search.` },
          ],
        },
        {
          id: 'matrix-rep',
          title: 'Payoff matrix representation',
          blocks: [
            { kind: 'md', body: `For a 2-player game with finite actions, the standard representation is a **matrix of payoff pairs**:

|  | $b_1$ | $b_2$ | $\\ldots$ |
|---|---|---|---|
| $a_1$ | $(u_1(a_1, b_1), u_2(a_1, b_1))$ | $(u_1(a_1, b_2), u_2(a_1, b_2))$ | ... |
| $a_2$ | ... | ... | ... |

Rows = player 1's actions; columns = player 2's actions. Each cell = $(u_1, u_2)$ payoff pair.

### Worked example: Prisoner's Dilemma

Two suspects, each can **Cooperate** (stay silent) or **Defect** (rat out the other).

|  | Cooperate | Defect |
|---|---|---|
| **Cooperate** | $(-1, -1)$ | $(-3, 0)$ |
| **Defect** | $(0, -3)$ | $(-2, -2)$ |

Reading: if both cooperate, both get $-1$ (small sentence each). If row defects and column cooperates, row goes free ($0$) and column gets $-3$ (long sentence). Etc.

### Zero-sum games

If $u_1(a, b) + u_2(a, b) = 0$ for every $(a, b)$, the game is **zero-sum**. The matrix can be simplified to just $u_1$'s value (player 2's value is the negation). All purely competitive games (chess, Go) are zero-sum.` },
          ],
        },
        {
          id: 'dominance',
          title: 'Dominant strategies',
          blocks: [
            { kind: 'md', body: `A strategy $a$ **strictly dominates** $a'$ for player $i$ if:
$$\\forall (\\text{opponent profile } a_{-i}): \\quad u_i(a, a_{-i}) > u_i(a', a_{-i})$$

i.e. $a$ gives strictly higher payoff than $a'$ no matter what the opponents do.

A strategy $a$ **weakly dominates** $a'$ if $u_i(a, a_{-i}) \\ge u_i(a', a_{-i})$ for all $a_{-i}$, with strict inequality for at least one $a_{-i}$.

### How to find dominant strategies

**Strict dominance.** Look at each pair of rows (for player 1) or columns (for player 2). For player 1: row $a$ strictly dominates $a'$ iff $a$'s payoffs are strictly higher than $a'$'s in **every** column.

### Iterated elimination of dominated strategies (IEDS)

Strictly dominated strategies are NEVER played by a rational player. Remove them; possibly more strategies become dominated in the reduced game; repeat.

The remaining game is **solved by IEDS** if only one strategy per player survives.` },
            { kind: 'callout', variant: 'keyfact', title: 'In Prisoner\'s Dilemma...', body: `**Defect** strictly dominates **Cooperate** for both players ($0 > -1$ and $-2 > -3$). IEDS gives unique outcome $(\\text{Defect}, \\text{Defect})$ — the famous tragedy: both rational, both prefer cooperation, both play defect.` },
          ],
        },
        {
          id: 'best-response',
          title: 'Best response & Nash equilibrium',
          blocks: [
            { kind: 'md', body: `A **best response** for player $i$ against opponent profile $a_{-i}$ is any action $a_i^*$ maximising $u_i(a_i, a_{-i})$.

A **Nash equilibrium** is a profile $(a_1^*, \\ldots, a_n^*)$ where every player's action is a best response to the others:
$$\\forall i: a_i^* \\in \\arg\\max_{a_i \\in A_i} u_i(a_i, a_{-i}^*)$$

In a Nash equilibrium, no single player can improve by unilaterally changing their action. It's a **stable** outcome.

### Finding pure-strategy Nash equilibria — the cell-marking method

For each cell $(a, b)$:
1. In column $b$, mark the cell(s) where player 1 has their highest payoff.
2. In row $a$, mark the cell(s) where player 2 has their highest payoff.
3. Cells marked twice = pure-strategy Nash equilibria.

### Mixed strategies

When no pure NE exists (e.g. Matching Pennies), players randomise. A **mixed strategy** is a probability distribution over actions. **Nash's theorem (1950):** every finite normal-form game has at least one Nash equilibrium in mixed strategies.

(Mixed-strategy computation is beyond this module — note it exists.)` },
            { kind: 'callout', variant: 'whatif', title: 'What if a strategy is "dominant"?', body: `Then it's a best response to *every* opponent strategy — so playing it is a Nash equilibrium action regardless of what the opponent does. If all players have dominant strategies, the dominant-strategy profile is the unique Nash equilibrium.` },
          ],
        },
        {
          id: 'famous-games',
          title: 'Famous 2×2 games',
          blocks: [
            { kind: 'md', body: `### Prisoner's Dilemma (PD)
|  | C | D |
|---|---|---|
| **C** | $(-1, -1)$ | $(-3, 0)$ |
| **D** | $(0, -3)$ | $(-2, -2)$ |

NE: $(D, D)$. Pareto-inferior to $(C, C)$.

### Matching Pennies (zero-sum, no pure NE)
|  | H | T |
|---|---|---|
| **H** | $(+1, -1)$ | $(-1, +1)$ |
| **T** | $(-1, +1)$ | $(+1, -1)$ |

No pure NE. Mixed NE: each plays $H$ with $p = 1/2$.

### Stag Hunt (coordination game)
|  | Stag | Hare |
|---|---|---|
| **Stag** | $(2, 2)$ | $(0, 1)$ |
| **Hare** | $(1, 0)$ | $(1, 1)$ |

Two pure NEs: $(\\text{Stag}, \\text{Stag})$ — payoff-dominant; $(\\text{Hare}, \\text{Hare})$ — risk-dominant.

### Battle of the Sexes
|  | Ballet | Football |
|---|---|---|
| **Ballet** | $(2, 1)$ | $(0, 0)$ |
| **Football** | $(0, 0)$ | $(1, 2)$ |

Two pure NEs at $(B, B)$ and $(F, F)$ — both want to coordinate, but disagree on which.

### Chicken / Hawk-Dove
|  | Swerve | Straight |
|---|---|---|
| **Swerve** | $(0, 0)$ | $(-1, +1)$ |
| **Straight** | $(+1, -1)$ | $(-10, -10)$ |

Two pure NEs at $(\\text{S}, \\text{St})$ and $(\\text{St}, \\text{S})$. Mutual stubbornness is catastrophic.` },
          ],
        },
        {
          id: 'method',
          title: 'How to solve a normal-form game (procedure)',
          blocks: [
            { kind: 'md', body: `Given a payoff matrix:

1. **Check for dominant strategies.** For each player, compare pairs of rows (or columns). If one strictly dominates, the dominated row/column will never be played.
2. **Apply IEDS.** Repeatedly remove strictly dominated strategies. If the matrix shrinks to a single cell, that's the unique outcome.
3. **Find pure-strategy Nash equilibria via cell marking.**
   - Per column (player 1's view): underline player 1's max payoff.
   - Per row (player 2's view): underline player 2's max payoff.
   - Cells with both numbers underlined = pure NEs.
4. **If no pure NE exists**, compute the mixed-strategy NE (out of scope here).
5. **Identify if game is zero-sum**; if so, mention min-max value (≡ NE in zero-sum games — von Neumann's theorem).` },
            { kind: 'callout', variant: 'nightingale', title: 'Exam-style answer', body: `For a 2×2 game question, list the actions for each player, write the matrix, identify any dominant strategies (state strong or weak), find pure NEs by cell marking, and state the outcome.` },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: normal-form game analyser',
          blocks: [
            { kind: 'md', body: `Pick a preset (Auditions, Prisoner\'s Dilemma, Matching Pennies, Stag Hunt, Battle of the Sexes, Chicken) or build a custom game. The analyser computes dominance, pure NEs, and (for zero-sum) maximin/minimax automatically.` },
            { kind: 'viz', viz: 'NormalForm', title: 'Normal-form game — payoffs, dominance, Nash equilibria', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'nf1', q: 'Normal-form game tuple?', a: '⟨N, (Aᵢ), (uᵢ)⟩: players, per-player action sets, per-player utility functions over action profiles.' },
        { id: 'nf2', q: 'Strict vs weak dominance?', a: 'Strict: a is strictly better than a\' against EVERY opponent profile. Weak: at least as good against all, and strictly better against at least one.' },
        { id: 'nf3', q: 'Pure-strategy Nash equilibrium?', a: 'A profile where every player\'s action is a best response to the others — no one can improve by unilaterally changing.' },
        { id: 'nf4', q: 'How do you find pure NEs in a 2-player matrix?', a: 'Cell marking: underline player 1\'s max per column; underline player 2\'s max per row. Cells underlined twice = pure NEs.' },
        { id: 'nf5', q: 'Does every finite game have a Nash equilibrium?', a: 'Yes — Nash (1950): every finite normal-form game has at least one NE in mixed strategies.' },
        { id: 'nf6', q: 'Prisoner\'s Dilemma — what makes it interesting?', a: 'Strict dominance gives the unique NE (Defect, Defect) which is Pareto-inferior to (Cooperate, Cooperate). Rational play is collectively worse.' },
        { id: 'nf7', q: 'Zero-sum game?', a: 'u₁ + u₂ = 0 for every cell. Min-max = max-min = NE (von Neumann\'s minimax theorem).' },
        { id: 'nf8', q: 'Sequential (minimax) vs simultaneous (normal-form) — when does each apply?', a: 'Sequential: full observation of opponent moves (chess, tic-tac-toe). Simultaneous: commit without seeing opponent (prisoner\'s dilemma, auctions, scheduling auditions).' },
      ],
      examples: [
        {
          id: 'nfex1-audition', difficulty: 'intermediate', marks: 15,
          question: `**Auditions game.** Two amateur actors X and Y both want to audition for a play. Each chooses **P** (principal role, 50 lines) or **S** (supporting role, 30 lines). The casting director's rules:
- If only one auditions for P, that person gets it (50 lines).
- If both audition for P, the director refuses to choose between friends — neither gets P (0 lines).
- If an actor auditions for S, they always get a supporting role (30 lines).

(i) [3 marks] Express as a normal-form game: $N$, $A_X$, $A_Y$.

(ii) [4 marks] Compute the payoff matrix $u_X, u_Y$ for all four profiles.

(iii) [4 marks] Draw the matrix.

(iv) [4 marks] Identify any dominant strategies (strict or weak). State the predicted outcome and justify.`,
          answer: `## (i) — 3 marks
- $N = \\{X, Y\\}$ — two players.
- $A_X = \\{P, S\\}$, $A_Y = \\{P, S\\}$.

## (ii) — 4 marks
- $u_X(P, P) = 0$ — both go for principal, neither gets it.
- $u_X(P, S) = 50$ — X is the only P applicant.
- $u_X(S, P) = 30$ — X gets a supporting role.
- $u_X(S, S) = 30$ — X gets a supporting role.

By symmetry, $u_Y(a_X, a_Y) = u_X(a_Y, a_X)$. So $u_Y(P, P) = 0$, $u_Y(P, S) = 30$, $u_Y(S, P) = 50$, $u_Y(S, S) = 30$.

## (iii) — 4 marks
|        | Y plays P | Y plays S |
|--------|-----------|-----------|
| **X plays P** | $(0, 0)$   | $(50, 30)$ |
| **X plays S** | $(30, 50)$ | $(30, 30)$ |

## (iv) — 4 marks
**Check dominance for X.**
- Compare X's rows (compare $u_X$ across columns).
- Row P: $(0, 50)$. Row S: $(30, 30)$.
- Against Y=P: S beats P ($30 > 0$).
- Against Y=S: P beats S ($50 > 30$).
- Neither row strictly nor weakly dominates the other. **No dominance for X.**

By symmetry, **no dominance for Y.**

**Pure NEs by cell marking.**
- Column "Y plays P": X's max is $30$ (row S). Underline $(30, 50)$.
- Column "Y plays S": X's max is $50$ (row P). Underline $(50, 30)$.
- Row "X plays P": Y's max is $30$ (column S). Underline $(50, 30)$.
- Row "X plays S": Y's max is $50$ (column P). Underline $(30, 50)$.

Cells doubly-underlined: $(50, 30)$ and $(30, 50)$. **Two pure NEs:** $(P, S)$ and $(S, P)$ — exactly one actor goes for the principal.

**Outcome.** Coordination problem like Battle of the Sexes — both prefer to coordinate but disagree on who gets the bigger role. Without communication, the outcome is ambiguous; with communication, they can agree.`,
          tags: ['normal-form', 'dominant strategy', 'Nash equilibrium', 'coordination game'],
        },
        {
          id: 'nfex2-pd', difficulty: 'basic', marks: 8,
          question: `For the Prisoner's Dilemma payoffs above:
|  | C | D |
|---|---|---|
| **C** | $(-1, -1)$ | $(-3, 0)$ |
| **D** | $(0, -3)$ | $(-2, -2)$ |

(i) Identify all dominant strategies, stating whether strong or weak.
(ii) Apply iterated elimination of dominated strategies. State the predicted outcome.
(iii) Comment on the "irrational" feel of the outcome.`,
          answer: `## (i) Dominant strategies

**Player 1 (rows):** Compare row C vs row D for $u_1$:
- Against opp C: $u_1(D, C) = 0 > -1 = u_1(C, C)$ ✓
- Against opp D: $u_1(D, D) = -2 > -3 = u_1(C, D)$ ✓

D **strictly dominates** C for player 1.

By symmetry, D strictly dominates C for player 2.

Both players have a strictly dominant strategy: **D (Defect)**.

## (ii) IEDS

Round 1: remove dominated C for both. Reduced game has a single cell: $(D, D)$. **Outcome: $(D, D)$ with payoffs $(-2, -2)$.**

## (iii) Comment

Both players would be better off mutually cooperating ($(-1, -1)$) than mutually defecting ($(-2, -2)$). But individual rationality (always choosing one's dominant strategy) leads to the Pareto-inferior outcome. This is the classic tension between **individual** and **collective** rationality.

Real-world analogues: arms races, climate-change action, advertising spending, overfishing. The PD is a 1-shot game; iterated PD allows reputation and reciprocity to enable cooperation (Axelrod tournaments).`,
          tags: ['prisoner dilemma', 'IEDS', 'dominant strategy'],
        },
        {
          id: 'nfex3-zero-sum', difficulty: 'intermediate', marks: 8,
          question: `For the zero-sum game with payoff matrix (player 1's view; player 2 gets the negation):
|  | L | R |
|---|---|---|
| **U** | $3$ | $-1$ |
| **D** | $-2$ | $4$ |

(i) Find the maximin value for player 1 and the minimax value for player 2.
(ii) Is there a pure-strategy NE?
(iii) State von Neumann's theorem and explain its implication.`,
          answer: `## (i) Maximin / minimax

**Maximin (player 1):** for each row, take min; player 1 picks the row with max-min.
- Row U: $\\min(3, -1) = -1$.
- Row D: $\\min(-2, 4) = -2$.
- $\\max$-$\\min$ = $-1$ at row U. **Maximin value = $-1$, secured by U.**

**Minimax (player 2):** for each column, take max (worst for player 2); player 2 picks the column with min-max.
- Column L: $\\max(3, -2) = 3$.
- Column R: $\\max(-1, 4) = 4$.
- $\\min$-$\\max$ = $3$ at column L. **Minimax value = $3$, secured by L.**

## (ii) Pure NE?

Maximin ≠ minimax ($-1 \\ne 3$) → **no pure-strategy NE exists**. There is a mixed-strategy NE somewhere in between.

## (iii) Von Neumann's theorem

> Every finite, two-player, zero-sum game has a **value** $v$ such that:
> - Player 1 has a strategy (pure or mixed) guaranteeing payoff ≥ $v$.
> - Player 2 has a strategy guaranteeing payoff ≤ $v$.

This $v$ is the unique Nash equilibrium value. For purely pure-strategy NEs, $v$ = maximin = minimax. When they differ (as here), $v$ lies between them and is achieved by mixed strategies.

**Implication.** Zero-sum games have an unambiguous "correct" value — unlike non-zero-sum games where multiple NEs and Pareto trade-offs can leave the outcome genuinely ambiguous.`,
          tags: ['zero-sum', 'minimax', 'mixed strategies', 'von Neumann'],
        },
      ],
      pitfalls: [
        'Strict dominance requires $>$ in every column/row. Weak dominance allows ties (≥), with at least one strict $>$. They are NOT the same — IEDS using weak dominance can eliminate Nash equilibria.',
        'Cell marking finds PURE-strategy NEs only. If no pure NE exists (e.g. Matching Pennies), the NE is in mixed strategies.',
        'A NE is NOT necessarily Pareto-optimal — Prisoner\'s Dilemma is the canonical counter-example.',
        'In a zero-sum game with no pure NE, you must compute the mixed-strategy NE — out of scope here, but mention it.',
        'Normal-form games are SIMULTANEOUS. Don\'t apply minimax/α-β — those are for sequential games.',
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    //   Waffl game — specific worked example
    // ─────────────────────────────────────────────────────────────────
    {
      id: 'waffl',
      slug: 'waffl-game',
      module: 'Module 2 · Adversarial',
      title: 'The Waffl game (worked sequential example)',
      oneLiner: 'A 3×3 grid game used in York exam questions for minimax + α-β practice.',
      sections: [
        {
          id: 'rules',
          title: 'Rules of Waffl',
          blocks: [
            { kind: 'md', body: `**Waffl** is a 2-player sequential game played on a 3×3 grid containing a **permutation of integers 1–9**.

- Player 1 starts; tries to **maximise** the final number.
- Player 2 plays second; tries to **minimise** it.
- Players alternate **striking out columns and rows**. Player 1 strikes out columns (C1, C2, C3); player 2 strikes out rows (R1, R2, R3).
- After 4 moves (2 columns + 2 rows = striking 2 cols and 2 rows leaves 1 cell), one number remains. That's the score.

**Move sequence:** Player 1 picks a column → Player 2 picks a row → Player 1 picks one of the two remaining columns → Player 2 picks one of the two remaining rows. The single uncrossed cell is the result.

### Example board

\`\`\`
   C1 C2 C3
R1  7  1  8
R2  6  5  4
R3  3  2  9
\`\`\`

If P1 plays C2 (deletes 1, 5, 2), P2 plays R3 (deletes 3, 9), P1 plays C3 (leaves 7, 6), P2 plays R1 (leaving 6). **Score = 6.**` },
            { kind: 'callout', variant: 'nightingale', title: 'York-specific exam target', body: 'Waffl is a recurring exam game for minimax + α-β tracing. Memorise the structure: P1 picks columns, P2 picks rows, total of 4 moves, score is the single remaining cell.' },
          ],
        },
        {
          id: 'game-tree',
          title: 'Game tree shape',
          blocks: [
            { kind: 'md', body: `After Player 1's first move (one column struck), the tree branches:

- **Depth 1 (P2, MIN):** picks one of 3 rows → 3 children.
- **Depth 2 (P1, MAX):** picks one of 2 remaining columns → 2 children each.
- **Depth 3 (P2, MIN):** picks one of 2 remaining rows → 2 children each = **leaves**.

So the tree from "after P1's first move" has $3 \\times 2 \\times 2 = 12$ leaves.

Each leaf corresponds to **one specific cell remaining** — read off the board.

### Mapping leaves to scores

If P1 played C1 first (deleted column 1), the remaining 6 cells form a $3 \\times 2$ sub-grid (columns 2 and 3, all 3 rows). After P2's row choice, the 2-column row is gone. After P1's column choice, only 1 column remains. After P2's row choice, only 1 cell remains.

**Trick.** For each leaf, compute (remaining column ID, remaining row ID) and look up the cell value.` },
          ],
        },
      ],
      flashcards: [
        { id: 'wf1', q: 'Waffl: who moves first, what do they pick?', a: 'Player 1 (MAX) moves first and picks a COLUMN to strike out.' },
        { id: 'wf2', q: 'Waffl: how many leaves in the tree from "after P1\'s first move"?', a: '3 (P2 row) × 2 (P1 col) × 2 (P2 row) = 12 leaves.' },
        { id: 'wf3', q: 'Waffl: what is the score?', a: 'The integer in the single uncrossed cell after all 4 moves (2 columns + 2 rows struck out of 3 each).' },
      ],
      examples: [
        {
          id: 'wf-ex1', difficulty: 'intermediate', marks: 15,
          question: `Consider the Waffl board:
\`\`\`
   C1 C2 C3
R1  7  1  8
R2  6  5  4
R3  3  2  9
\`\`\`
Player 1 has just played C1 (deleting column 1: values 7, 6, 3).

(i) [10 marks] Draw the minimax tree from this position. P2 picks a row next, then P1 picks one of {C2, C3}, then P2 picks one of the remaining rows. Label each leaf with the surviving cell value.

(ii) [5 marks] Annotate each non-leaf with its minimax value, and identify P2's optimal first row choice.`,
          answer: `## (i) Tree + leaves — 10 marks

Remaining cells after C1 deleted:
\`\`\`
   C2 C3
R1  1  8
R2  5  4
R3  2  9
\`\`\`

**P2's row choice** at depth 1 (MIN). 3 options: R1, R2, R3.

If P2 = R1 (delete 1, 8): remaining $\\{(C2,R2)=5, (C2,R3)=2, (C3,R2)=4, (C3,R3)=9\\}$.
- P1 = C2 (delete 5, 2): leaves $\\{(C3,R2)=4, (C3,R3)=9\\}$. P2 picks R2 (4) or R3 (9). **min = 4.**
- P1 = C3 (delete 4, 9): leaves $\\{(C2,R2)=5, (C2,R3)=2\\}$. P2 picks R2 (5) or R3 (2). **min = 2.**
- P1 picks **max(4, 2) = 4**.

If P2 = R2 (delete 5, 4): remaining $\\{(C2,R1)=1, (C2,R3)=2, (C3,R1)=8, (C3,R3)=9\\}$.
- P1 = C2: leaves $\\{(C3,R1)=8, (C3,R3)=9\\}$. P2 picks min(8, 9) = **8.**
- P1 = C3: leaves $\\{(C2,R1)=1, (C2,R3)=2\\}$. P2 picks min(1, 2) = **1.**
- P1 picks **max(8, 1) = 8**.

If P2 = R3 (delete 2, 9): remaining $\\{(C2,R1)=1, (C2,R2)=5, (C3,R1)=8, (C3,R2)=4\\}$.
- P1 = C2: leaves $\\{(C3,R1)=8, (C3,R2)=4\\}$. P2 picks min(8, 4) = **4.**
- P1 = C3: leaves $\\{(C2,R1)=1, (C2,R2)=5\\}$. P2 picks min(1, 5) = **1.**
- P1 picks **max(4, 1) = 4**.

## (ii) Minimax values + best move — 5 marks

P2 at root chooses min over R1=4, R2=8, R3=4. **Min = 4** — tied at R1 and R3.

**Root value = 4.** P2's optimal first row choice is **R1 or R3** (both give value 4). By alphabetical tie-break, P2 plays **R1**.`,
          tags: ['waffl', 'minimax', 'game tree'],
        },
      ],
    },
  ],
};
