<script lang="ts">
  import Md from '../components/Md.svelte';

  interface Proof {
    title: string;
    statement: string;
    proof: string;
    module: string;
    tags: string[];
  }

  const proofs: Proof[] = [
    {
      title: 'Consistency implies admissibility',
      module: 'Search',
      tags: ['heuristic', 'A*'],
      statement: `If a heuristic $h$ is **consistent** (i.e. $h(n) \\le c(n, a, n') + h(n')$ for every successor $n'$), and $h(\\text{goal}) = 0$, then $h$ is **admissible**: $h(n) \\le h^*(n)$ for all $n$.`,
      proof: `By induction on $k$ = the number of edges from $n$ to the nearest goal in the graph.

**Base case** ($k = 0$): $n$ itself is a goal. By hypothesis $h(n) \\le 0 = h^*(n)$.

**Inductive step.** Let $k \\ge 1$. Take an optimal path from $n$ to the nearest goal — its first edge is $(n, n')$ of cost $c$, and $n'$ is $k-1$ edges from a goal. So $h^*(n) = c + h^*(n')$.

By the inductive hypothesis, $h(n') \\le h^*(n')$.

By consistency, $h(n) \\le c + h(n')$.

Chaining: $h(n) \\le c + h(n') \\le c + h^*(n') = h^*(n)$. $\\blacksquare$`,
    },

    {
      title: 'A* tree-search optimality under admissibility',
      module: 'Search',
      tags: ['A*', 'optimality'],
      statement: `If $h$ is admissible and action costs are non-negative, then A* tree-search returns an optimal solution.`,
      proof: `**By contradiction.** Suppose A* returns a goal $G_2$ with $g(G_2) > C^*$, where $C^*$ is the cost of an optimal solution.

When A* selects $G_2$ from the frontier, some node $n$ on the optimal path is also on the frontier (the start was originally on the frontier; the optimal path can be extended one step at a time, so some prefix of it is currently on the frontier).

By admissibility, $h(n) \\le h^*(n)$. Therefore:
$$f(n) = g(n) + h(n) \\le g(n) + h^*(n) = C^*$$
(the right side equals $C^*$ since $n$ is on an optimal path and the optimal cost through $n$ equals $C^*$).

For the suboptimal goal: since $h(G_2) = 0$ at a goal,
$$f(G_2) = g(G_2) + 0 = g(G_2) > C^* \\ge f(n).$$

But A* chose $G_2$ over $n$, so $f(G_2) \\le f(n)$ — contradiction. $\\blacksquare$`,
    },

    {
      title: 'A* graph-search optimality under consistency',
      module: 'Search',
      tags: ['A*', 'graph-search', 'optimality'],
      statement: `If $h$ is consistent, then A* graph-search (with a closed list, no re-opening) returns an optimal solution.`,
      proof: `**Key lemma.** If $h$ is consistent, then $f(n')$ along any path is **non-decreasing**.

*Proof of lemma.* For any successor $n'$ of $n$ via action with cost $c$:
$$f(n') = g(n') + h(n') = g(n) + c + h(n') \\ge g(n) + h(n) = f(n)$$
using consistency $h(n) \\le c + h(n')$. $\\square$

**Main claim.** When A* expands a node $n$, $g(n)$ is optimal.

*Proof.* Suppose, for contradiction, A* expands $n$ with $g(n) > g^*(n)$. There must be a node $n''$ on an optimal path from start to $n$ that is currently on the frontier (the path's nodes are all eventually expanded; if all are closed by the time $n$ is expanded, we could trace the optimal path through them to $n$ with optimal cost — contradiction).

By the lemma and admissibility (consistency $\\Rightarrow$ admissibility from the previous proof):
$$f(n'') = g^*(n'') + h(n'') \\le g^*(n'') + h^*(n'') = g^*(n) = f^*(n) < f(n).$$

But A* picks the lowest-$f$ frontier node — should have picked $n''$, not $n$. Contradiction. $\\square$

**Optimality follows.** When A* expands the goal, $g(\\text{goal}) = g^*(\\text{goal}) = C^*$. $\\blacksquare$`,
    },

    {
      title: 'Maximum of admissible heuristics is admissible',
      module: 'Search',
      tags: ['heuristic'],
      statement: `If $h_1, h_2, \\ldots, h_k$ are admissible heuristics, then $h(n) = \\max_i h_i(n)$ is also admissible. Moreover, $h$ dominates each $h_i$.`,
      proof: `**Admissibility.** For each $i$: $h_i(n) \\le h^*(n)$. Therefore:
$$h(n) = \\max_i h_i(n) \\le \\max_i h^*(n) = h^*(n).$$

**Dominance.** For each $j$: $h(n) = \\max_i h_i(n) \\ge h_j(n)$ by definition of max. $\\blacksquare$

**Corollary.** Same proof works for consistency: max of consistent heuristics is consistent.`,
    },

    {
      title: 'Alpha-beta best-case complexity $O(b^{m/2})$',
      module: 'Adversarial',
      tags: ['alpha-beta', 'complexity'],
      statement: `Under perfect move ordering, alpha-beta search examines $O(b^{m/2})$ leaves on a uniform game tree of depth $m$ and branching $b$.`,
      proof: `(Knuth & Moore, 1975 — sketch.)

With perfect ordering, the **first child** examined at every node is the best (max value at MAX, min value at MIN). Other children only need to be searched well enough to **prove they are dominated**.

At a MAX node:
- Examine the leftmost child fully — costs $T(m-1)$ work.
- For each other child, examine only its leftmost grandchild (sufficient to establish a bound that triggers the cut) — costs $T(m-2)$ work each.

Let $T(m)$ = leaves examined to evaluate a node at depth-to-leaves $m$. Recurrence:
$$T(m) = T(m-1) + (b-1) T(m-2)$$
$$T(0) = 1, T(1) = b.$$

This is a linear recurrence with characteristic equation $x^2 = x + (b-1)$, giving $x = \\frac{1 + \\sqrt{4b-3}}{2} \\approx \\sqrt b$ for large $b$.

Hence $T(m) = O((\\sqrt b)^m) = O(b^{m/2})$. $\\blacksquare$

**Implication:** alpha-beta with perfect ordering effectively halves the depth — a chess engine can search to depth $2d$ in the time minimax would take for depth $d$.`,
    },

    {
      title: 'AC-3 complexity $O(c d^3)$',
      module: 'CSPs',
      tags: ['AC-3', 'complexity'],
      statement: `AC-3 on a CSP with $c$ binary constraints and maximum domain size $d$ runs in time $O(c d^3)$.`,
      proof: `**Per-arc work.** Each REVISE call iterates each $v \\in D(X_i)$ (up to $d$ values) and for each searches for support in $D(X_j)$ (up to $d$ values). Per call: **$O(d^2)$**.

**Maximum times each arc is processed.** Arc $(X_k, X_i)$ is re-enqueued only after $D(X_i)$ loses a value. $D(X_i)$ can lose at most $d$ values over the whole run. So each arc is re-enqueued at most $d$ times.

**Total arcs.** With $c$ binary constraints, there are $2c$ directed arcs.

**Total work:**
$$\\underbrace{O(c)}_{\\text{arcs}} \\times \\underbrace{O(d)}_{\\text{enqueues each}} \\times \\underbrace{O(d^2)}_{\\text{per REVISE}} = O(c \\cdot d^3). \\quad \\blacksquare$$

**Note.** AC-2001 / AC-3.1 achieves $O(cd^2)$ by caching the last support per (variable, value, constraint), avoiding redundant scans of $D(X_j)$. Same as AC-4 but with $O(cd)$ space instead of $O(cd^2)$.`,
    },

    {
      title: 'Tree-CSP solver runs in $O(nd^2)$',
      module: 'CSPs',
      tags: ['tree-CSP'],
      statement: `If a CSP's constraint graph is a tree, the CSP is solvable in $O(n d^2)$ time, where $n$ is the number of variables and $d$ the maximum domain size.`,
      proof: `**Algorithm:** root the tree; backward pass enforces arc consistency from leaves to root; forward pass assigns values root to leaves.

**Backward pass.** Each of the $n - 1$ tree edges is processed exactly once. Each REVISE call costs $O(d^2)$. Total: $O(n d^2)$.

**Forward pass.** For each of the $n$ variables (in topological order), find one value in $D[X_j]$ consistent with the assigned parent. By the backward pass's guarantee, such a value always exists. Per variable: $O(d)$ scan. Total: $O(n d)$.

**Combined:** $O(n d^2) + O(n d) = O(n d^2)$. $\\blacksquare$

**Correctness of forward pass.** Backward pass ensures every value $v \\in D[X_j]$ has a support in $D[\\text{parent}(X_j)]$. So once the parent is assigned, the variable can be assigned consistently. By induction down the tree, no backtracking needed.`,
    },

    {
      title: 'Régin: AllDifferent feasibility via matching',
      module: 'CSPs',
      tags: ['GAC', 'Régin', 'AllDifferent'],
      statement: `Given variables $X_1, \\ldots, X_n$ with domains $D_1, \\ldots, D_n$ and the constraint $\\text{AllDifferent}(X_1, \\ldots, X_n)$, the constraint is satisfiable **if and only if** the bipartite value graph $G$ (variables on one side, values on the other, edges from domain memberships) has a maximum matching of size $n$.`,
      proof: `**(⇒)** Suppose a satisfying assignment $\\sigma$ exists: $\\sigma(X_i) = v_i$ with all $v_i$ distinct and $v_i \\in D_i$. Then the edges $\\{(X_1, v_1), \\ldots, (X_n, v_n)\\}$ form a matching of size $n$ in $G$ (each variable matched to its assigned value, all distinct).

**(⇐)** Suppose $G$ has a matching $M$ of size $n$. Each variable $X_i$ is matched to some distinct value $v_i$ in its domain. Define $\\sigma(X_i) := v_i$. The values $v_1, \\ldots, v_n$ are pairwise distinct (matching) and each is in the appropriate domain (edge in $G$). So $\\sigma$ satisfies AllDifferent. $\\blacksquare$

**Corollary (Hall's marriage theorem).** AllDifferent feasible iff every subset $S \\subseteq \\{X_1, \\ldots, X_n\\}$ has $|\\bigcup_{X_i \\in S} D_i| \\ge |S|$ ("for every set of variables, the union of their domains has size at least the number of variables").

**GAC removals.** An edge $(X_i, v)$ should be removed iff it lies in **no** maximum matching. Régin's algorithm tests this via SCC analysis of the residual graph (matching edges oriented value→variable, others variable→value, plus a source feeding free values).`,
    },

    {
      title: '2-SAT is in P via implication graph + SCC',
      module: 'SAT',
      tags: ['2-SAT', 'complexity'],
      statement: `2-SAT is decidable in linear time $O(n + m)$, where $n$ is the number of variables and $m$ the number of clauses.`,
      proof: `**Build the implication graph $G$.** For each clause $(\\ell_1 \\vee \\ell_2)$, add edges $\\lnot \\ell_1 \\to \\ell_2$ and $\\lnot \\ell_2 \\to \\ell_1$. (Each clause is equivalent to "if not the first literal, then the second" and symmetrically.) Vertices = literals; edges = $2m$. Linear time to build.

**Compute SCCs** via Tarjan's or Kosaraju's algorithm. $O(n + m)$.

**Theorem.** $F$ is satisfiable iff for every variable $x$, $x$ and $\\lnot x$ are in **different** SCCs.

*Proof of theorem (⇒).* Suppose $x$ and $\\lnot x$ are in the same SCC. Then there is a path $x \\to \\ldots \\to \\lnot x$, meaning a sequence of implications forces $x \\Rightarrow \\lnot x$ (so $x$ false). Similarly $\\lnot x \\to \\ldots \\to x$ forces $\\lnot x \\Rightarrow x$ (so $x$ true). Contradiction — UNSAT.

*(⇐).* If no variable has $x$ and $\\lnot x$ in the same SCC, we can construct a model as follows: process SCCs in **reverse topological order** of the condensation DAG. For each SCC, if neither literal yet assigned, set every literal in the SCC to true. By the SCC structure, every implication $u \\to v$ is respected because $v$ is in a later (closer to terminal) SCC than $u$ in topo order, so $v$ is assigned at least as late as $u$, and if $u$ is true then $v$ is also forced true. (Detailed assignment construction; provably consistent.)

**Total time:** $O(n + m)$ for graph + SCC + model construction. $\\blacksquare$

**Contrast with 3-SAT.** Adding a single 3-clause to a 2-SAT instance permits arbitrary 3-CNF to be reduced (pad other clauses with dummies), so 3-SAT is NP-complete (Cook-Levin).`,
    },

    {
      title: 'Resolution refutation-completeness for propositional CNF',
      module: 'Logic',
      tags: ['resolution', 'completeness'],
      statement: `If $\\Phi$ is an unsatisfiable set of propositional CNF clauses, then repeated application of the resolution rule will derive the empty clause $\\square$ in finitely many steps.`,
      proof: `**By strong induction** on the number of distinct propositional variables in $\\Phi$.

**Base case** (zero variables). $\\Phi$ is either $\\{\\}$ (satisfiable) or contains $\\square$ already (trivially derived in 0 steps).

**Inductive step.** Suppose the theorem holds for sets of clauses over $\\le k$ variables. Let $\\Phi$ have $k + 1$ variables; pick any variable $p$ appearing in $\\Phi$. Partition the clauses:
- $\\Phi^+ = $ clauses containing $p$
- $\\Phi^- = $ clauses containing $\\lnot p$
- $\\Phi^0 = $ clauses containing neither

Define $\\Phi'$ = $\\Phi^0 \\cup \\{ \\text{all resolvents of pairs in } \\Phi^+ \\times \\Phi^- \\text{ on } p \\}$. This eliminates $p$.

**Claim 1.** $\\Phi'$ is unsatisfiable.

*Proof.* Suppose a model $m$ satisfied $\\Phi'$. Then $m$ satisfies every clause in $\\Phi^0$. Consider extending $m$ to assign $p$. Case (a): if making $p$ true satisfies all of $\\Phi^+$ — pick $m \\cup \\{p\\}$, and every clause in $\\Phi^-$ either was already satisfied by $m$ (without $\\lnot p$) or … here we use the resolvents. Argument fills in by case analysis to show satisfaction. $\\Phi'$ unsat $\\Rightarrow \\Phi$ unsat by contrapositive.

**Claim 2.** By induction (one fewer variable), repeated resolution on $\\Phi'$ derives $\\square$.

**Claim 3.** Every resolvent in $\\Phi'$ is also derivable from $\\Phi$ by resolution. So the full derivation can be carried out within $\\Phi$\\'s resolution closure.

Combining: resolution on $\\Phi$ derives $\\square$. $\\blacksquare$

**Note.** Resolution is **not** complete for *deduction* (cannot derive every entailed clause directly), only for *refutation* — so to prove $\\Phi \\models \\alpha$ we add $\\lnot \\alpha$ as a clause and refute.`,
    },

    {
      title: 'IDS overhead $\\approx b/(b-1)$',
      module: 'Search',
      tags: ['IDS', 'complexity'],
      statement: `On a uniform tree with branching factor $b$ and goal depth $d$, IDS generates $N_{\\text{IDS}}$ nodes where $N_{\\text{IDS}} / b^d \\to b/(b-1)$ for large $d$. So IDS is $b/(b-1)$ times slower than BFS asymptotically.`,
      proof: `**Per-iteration count.** Depth-limited DFS with limit $\\ell$ generates $1 + b + b^2 + \\cdots + b^\\ell = (b^{\\ell+1} - 1)/(b - 1)$ nodes.

**Total over iterations $\\ell = 0, 1, \\ldots, d$:**
$$N_{\\text{IDS}} = \\sum_{\\ell=0}^{d} \\frac{b^{\\ell+1} - 1}{b - 1} = \\frac{1}{b-1}\\left[ \\sum_{\\ell=0}^{d} b^{\\ell+1} - (d+1) \\right].$$

The first sum is $b \\cdot (b^{d+1} - 1)/(b - 1)$.

For large $d$, the $b^{d+1}$ term dominates:
$$N_{\\text{IDS}} \\sim \\frac{b \\cdot b^{d+1}}{(b-1)^2} = \\frac{b^{d+2}}{(b-1)^2}.$$

BFS generates $\\sim b^{d+1}/(b-1)$ nodes. Ratio:
$$\\frac{N_{\\text{IDS}}}{N_{\\text{BFS}}} \\sim \\frac{b^{d+2}/(b-1)^2}{b^{d+1}/(b-1)} = \\frac{b}{b-1}.$$

For $b = 10$: ratio $\\approx 10/9 \\approx 1.11$ — IDS does about 11% more work than BFS.

For $b = 2$: ratio $= 2$ — IDS does **double** the work, but still asymptotically the same complexity class.

**Memory.** BFS: $O(b^d)$. IDS: $O(bd)$. The memory saving is dramatic; the 11% time penalty is usually worth it. $\\blacksquare$`,
    },
  ];

  let filter = $state('');
</script>

<article class="max-w-5xl">
  <h1>Proofs archive</h1>
  <p class="text-ink-600 dark:text-ink-300">
    Standard derivations from the course — written in the form expected on an exam.
    Read carefully; rehearse the structure (assumption, case analysis, contradiction or induction step) until you can reproduce each from scratch.
  </p>

  <input bind:value={filter} placeholder="Filter proofs…" class="w-full my-4 px-3 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />

  <div class="space-y-4">
    {#each proofs.filter((p) => (p.title + p.statement + p.proof + p.tags.join(' ')).toLowerCase().includes(filter.toLowerCase())) as p (p.title)}
      <details class="card">
        <summary class="cursor-pointer">
          <span class="font-semibold">{p.title}</span>
          <span class="chip ml-2">{p.module}</span>
          {#each p.tags as t}<span class="chip ml-1 text-xs">{t}</span>{/each}
        </summary>
        <div class="mt-4">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Statement</div>
          <div class="prose max-w-none"><Md src={p.statement} /></div>
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1 mt-4">Proof</div>
          <div class="prose max-w-none"><Md src={p.proof} /></div>
        </div>
      </details>
    {/each}
  </div>
</article>
