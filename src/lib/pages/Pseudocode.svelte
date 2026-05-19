<script lang="ts">
  import Md from '../components/Md.svelte';
  import { href } from '../router';

  interface Algo {
    name: string;
    module: string;
    topicSlug: string;
    body: string;
  }

  const algos: Algo[] = [
    // ============ SEARCH ============
    {
      name: 'BFS / DFS / UCS — generic graph search', module: 'Search', topicSlug: 'uninformed-search',
      body: `\`\`\`
function GRAPH-SEARCH(problem, frontier):
    add start node to frontier
    reached := { start.state }
    while frontier is not empty:
        node := frontier.pop()
        if IsGoal(node.state): return Solution(node)
        for action in Actions(node.state):
            child := ChildNode(problem, node, action)
            if child.state not in reached:
                add child.state to reached
                frontier.add(child)
    return failure
\`\`\`

Frontier data structure determines the algorithm:
- **FIFO queue** → BFS
- **LIFO stack** → DFS
- **Priority queue ordered by g(n)** → UCS
- **Priority queue ordered by f(n) = g(n) + h(n)** → A\\*`,
    },

    {
      name: 'A* (tree-search)', module: 'Search', topicSlug: 'informed-search',
      body: `\`\`\`
function A-STAR(problem, h):
    node := Node(state=problem.initial, g=0, f=h(initial))
    frontier := priority queue ordered by f, containing node
    while frontier not empty:
        node := frontier.pop()           # smallest f
        if IsGoal(node.state): return Solution(node)
        for action in Actions(node.state):
            child := ChildNode(node, action)
            child.g := node.g + step_cost(node, action)
            child.f := child.g + h(child.state)
            frontier.add(child)
    return failure
\`\`\`

For **graph-search**: also maintain a reached map; only add child if its g is smaller than any previous reached entry.`,
    },

    {
      name: 'IDA* (Iterative Deepening A*)', module: 'Search', topicSlug: 'informed-search',
      body: `\`\`\`
function IDA-STAR(problem, h):
    threshold := h(problem.initial)
    loop:
        result, new_threshold := DFS-CONTRIBUTION(initial, 0, threshold, h)
        if result is a solution: return result
        if new_threshold = infinity: return failure
        threshold := new_threshold

function DFS-CONTRIBUTION(node, g, threshold, h):
    f := g + h(node.state)
    if f > threshold: return (None, f)
    if IsGoal(node.state): return (Solution(node), threshold)
    min_above := infinity
    for child in successors(node):
        g_child := g + step_cost(node, child)
        result, new_t := DFS-CONTRIBUTION(child, g_child, threshold, h)
        if result is a solution: return (result, threshold)
        min_above := min(min_above, new_t)
    return (None, min_above)
\`\`\``,
    },

    // ============ ADVERSARIAL ============
    {
      name: 'Minimax', module: 'Adversarial', topicSlug: 'minimax',
      body: `\`\`\`
function MINIMAX-DECISION(state):
    return argmax over a in Actions(state) of MIN-VALUE(Result(state, a))

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
\`\`\``,
    },

    {
      name: 'Alpha-beta pruning', module: 'Adversarial', topicSlug: 'alpha-beta',
      body: `\`\`\`
function ALPHA-BETA-DECISION(state):
    v, move := MAX-VALUE(state, -infinity, +infinity)
    return move

function MAX-VALUE(state, alpha, beta):
    if IsTerminal(state): return Utility(state), None
    v := -infinity; best := None
    for a in Actions(state):
        v2, _ := MIN-VALUE(Result(state, a), alpha, beta)
        if v2 > v:
            v, best := v2, a
            alpha := max(alpha, v)
        if v >= beta: return v, best        # β-cut
    return v, best

function MIN-VALUE(state, alpha, beta):
    if IsTerminal(state): return Utility(state), None
    v := +infinity; best := None
    for a in Actions(state):
        v2, _ := MAX-VALUE(Result(state, a), alpha, beta)
        if v2 < v:
            v, best := v2, a
            beta := min(beta, v)
        if v <= alpha: return v, best       # α-cut
    return v, best
\`\`\``,
    },

    {
      name: 'MCTS (one iteration with UCB1)', module: 'Adversarial', topicSlug: 'mcts',
      body: `\`\`\`
function MCTS(root, budget):
    while budget remaining:
        leaf := TREE-POLICY(root)         # selection + expansion
        reward := DEFAULT-POLICY(leaf)    # simulation / rollout
        BACKUP(leaf, reward)
    return BEST-CHILD(root)               # usually by visit count

function TREE-POLICY(node):
    while node is non-terminal:
        if node has unvisited child:
            return EXPAND(node)
        else:
            node := UCB1-CHILD(node)
    return node

function UCB1-CHILD(node):
    return argmax over child a of:
        W(a)/N(a) + C * sqrt(ln N(node) / N(a))

function EXPAND(node):
    add a new child for a random untried action
    return that child

function DEFAULT-POLICY(leaf):
    while leaf not terminal:
        leaf := random child of leaf
    return Utility(leaf)

function BACKUP(node, reward):
    while node != None:
        N(node) += 1
        W(node) += reward
        node := parent(node)
\`\`\``,
    },

    // ============ CSP ============
    {
      name: 'AC-3 (Mackworth, 1977)', module: 'CSPs', topicSlug: 'csp-inference',
      body: `\`\`\`
function AC-3(csp):
    Q := queue of all directed arcs (X_i, X_j)
    while Q not empty:
        (X_i, X_j) := Q.dequeue()
        if REVISE(csp, X_i, X_j):
            if D_i is empty: return FAILURE
            for X_k in NEIGHBOURS(X_i) - {X_j}:
                Q.enqueue((X_k, X_i))
    return ARC-CONSISTENT

function REVISE(csp, X_i, X_j):
    revised := false
    for v in D_i:
        if no w in D_j satisfies the constraint (X_i, X_j) on (v, w):
            D_i := D_i \\ {v}
            revised := true
    return revised
\`\`\`

Complexity: **O(c d³)** time, **O(c)** space.`,
    },

    {
      name: 'AC-4 (counter-based, Mohr & Henderson 1986)', module: 'CSPs', topicSlug: 'beyond-ac3',
      body: `\`\`\`
function AC-4(csp):
    # Phase 1: build counters and supports
    counter[(i, v, j)] := 0 for each (X_i, v, X_j)
    S[(j, w)] := empty set for each (X_j, w)
    Q := empty queue
    for each binary constraint c on (X_i, X_j):
        for v in D_i:
            for w in D_j:
                if c(v, w) satisfied:
                    counter[(i, v, j)] += 1
                    S[(j, w)] := S[(j, w)] ∪ {(i, v)}
            if counter[(i, v, j)] = 0:
                D_i := D_i \\ {v}
                Q.enqueue((i, v))
    # Phase 2: propagate deletions
    while Q not empty:
        (j, w) := Q.dequeue()
        for (i, v) in S[(j, w)]:
            if v ∈ D_i:
                counter[(i, v, j)] -= 1
                if counter[(i, v, j)] = 0:
                    D_i := D_i \\ {v}
                    Q.enqueue((i, v))
\`\`\`

Complexity: **O(c d²)** time (optimal), **O(c d²)** space (the heavy memory).`,
    },

    {
      name: 'AC-2001 / AC-3.1 (Zhang-Yap, Bessière-Régin 2001)', module: 'CSPs', topicSlug: 'beyond-ac3',
      body: `\`\`\`
# Same skeleton as AC-3 but REVISE caches the last support.

function REVISE-2001(csp, X_i, X_j):
    revised := false
    for v in D_i:
        # Try the cached last support first
        w := last[(i, v, j)]
        if w not in D_j or not satisfies(v, w):
            # Search D_j from w+1 (assuming domain is ordered)
            found := find first w' in D_j (after w) with satisfies(v, w')
            if found:
                last[(i, v, j)] := found
            else:
                D_i := D_i \\ {v}
                revised := true
    return revised
\`\`\`

Complexity: **O(c d²)** time, **O(c d)** space — same time as AC-4 with vastly less memory. Modern practical choice.`,
    },

    {
      name: 'Backtracking + Forward Checking', module: 'CSPs', topicSlug: 'backtracking',
      body: `\`\`\`
function BACKTRACK(assignment, csp):
    if assignment complete: return assignment
    X := SELECT-UNASSIGNED-VARIABLE(csp, assignment)    # MRV / dom-wdeg / etc.
    for v in ORDER-DOMAIN-VALUES(X, csp, assignment):   # LCV / etc.
        if v is consistent with assignment:
            add {X = v} to assignment
            inferences := FORWARD-CHECK(csp, X, v)      # or MAC = AC-3
            if inferences ≠ failure:
                add inferences to assignment
                result := BACKTRACK(assignment, csp)
                if result ≠ failure: return result
            remove {X = v} and inferences from assignment
    return failure

function FORWARD-CHECK(csp, X, v):
    for Y in Neighbours(X) where Y unassigned:
        D_Y' := { w ∈ D_Y : c_{X,Y}(v, w) satisfied }
        if D_Y' empty: return failure
        record D_Y → D_Y' for undoing
    return success
\`\`\``,
    },

    {
      name: "Régin's GAC algorithm for AllDifferent (1994)", module: 'CSPs', topicSlug: 'beyond-ac3',
      body: `\`\`\`
function REGIN-GAC(allDiff(X_1, ..., X_n)):
    # 1. Build bipartite graph
    G := bipartite graph with variables on left, values on right
        edge (X_i, v) iff v ∈ D_i

    # 2. Find maximum matching M (Hopcroft-Karp)
    M := MAX-MATCHING(G)

    # 3. Feasibility check
    if |M| < n: return FAILURE

    # 4. Orient edges
    direct M-edges from value → variable
    direct non-M-edges from variable → value
    add source s with edges to all free values (not in M)

    # 5. Compute SCCs + reachability from s
    SCCs := TARJAN-SCC(directed_graph)

    # 6. Identify edges in some max matching
    for each edge (X_i, v) in G:
        if (X_i, v) in M: keep
        else if X_i and v in same SCC: keep   # alternating cycle
        else if v reachable from s: keep      # alternating path from free
        else: remove v from D_i               # in NO max matching
\`\`\`

Complexity: **O(n^{1.5} d)** dominated by Hopcroft-Karp matching.`,
    },

    {
      name: 'Min-Conflicts (for CSPs)', module: 'CSPs', topicSlug: 'local-csp',
      body: `\`\`\`
function MIN-CONFLICTS(csp, max_steps):
    current := random complete assignment
    for step in 1..max_steps:
        if current satisfies all constraints: return current
        X := random conflicted variable
        v := value in D_X minimising number of violated constraints
             (random tie-break)
        current[X] := v
    return failure
\`\`\`

Famously solves million-queens in ~50 moves. Incomplete: cannot prove UNSAT.`,
    },

    {
      name: 'Tree-CSP solver (O(nd²))', module: 'CSPs', topicSlug: 'csp-structure',
      body: `\`\`\`
function TREE-CSP-SOLVE(csp):
    # csp's constraint graph is a tree
    root := any variable
    order := topological-from-root(csp, root)         # parents before children

    # Phase 1: backward arc consistency, leaves → root
    for j from n down to 2:
        X_j := order[j]
        REVISE(csp, parent(X_j), X_j)
        if D[parent(X_j)] empty: return FAILURE

    # Phase 2: forward assignment, root → leaves
    for j from 1 to n:
        X_j := order[j]
        v := any value in D_{X_j} consistent with parent's assignment
        assignment[X_j] := v

    return assignment
\`\`\`

Total: **O(n) arcs × O(d²) per REVISE = O(n d²)**.`,
    },

    // ============ LOGIC ============
    {
      name: 'Truth-table entailment', module: 'Logic', topicSlug: 'entailment',
      body: `\`\`\`
function TT-ENTAILS(KB, α):
    symbols := propositional symbols in KB ∪ {α}
    return TT-CHECK-ALL(KB, α, symbols, {})

function TT-CHECK-ALL(KB, α, symbols, model):
    if symbols is empty:
        if PL-TRUE(KB, model):
            return PL-TRUE(α, model)
        else:
            return true             # vacuous truth
    P := first(symbols); rest := rest(symbols)
    return TT-CHECK-ALL(KB, α, rest, model ∪ {P = true})
       and TT-CHECK-ALL(KB, α, rest, model ∪ {P = false})
\`\`\`

Sound and complete. Exponential in number of symbols.`,
    },

    {
      name: 'Resolution refutation', module: 'Logic', topicSlug: 'inference-rules',
      body: `\`\`\`
function PL-RESOLUTION(KB, α):
    clauses := CNF(KB ∧ ¬α)
    new := empty set
    loop:
        for each pair (C_i, C_j) in clauses:
            resolvents := PL-RESOLVE(C_i, C_j)
            if {} ∈ resolvents: return true     # KB ⊨ α
            new := new ∪ resolvents
        if new ⊆ clauses: return false
        clauses := clauses ∪ new

function PL-RESOLVE(C_i, C_j):
    out := {}
    for ℓ in literals(C_i):
        if ¬ℓ ∈ literals(C_j):
            resolvent := (C_i ∖ {ℓ}) ∪ (C_j ∖ {¬ℓ})
            if resolvent is not a tautology:
                out := out ∪ {resolvent}
    return out
\`\`\`

**Refutation-complete** for propositional logic.`,
    },

    {
      name: 'Forward chaining (Horn KB)', module: 'Logic', topicSlug: 'horn-chaining',
      body: `\`\`\`
function PL-FORWARD-CHAIN(KB, q):
    count[c] := |premises of c| for each definite clause c in KB
    inferred[p] := false for each proposition p
    agenda := facts in KB
    while agenda not empty:
        p := agenda.pop()
        if p = q: return true
        if not inferred[p]:
            inferred[p] := true
            for each clause c with p in premises:
                count[c] -= 1
                if count[c] = 0:
                    agenda.push(head(c))
    return false
\`\`\`

Sound + complete for Horn KBs. **Linear time** in KB size.`,
    },

    {
      name: 'Tseitin transformation', module: 'Logic', topicSlug: 'inference-rules',
      body: `\`\`\`
function TSEITIN(formula):
    clauses := {}
    new_var_id := 1
    root := WALK(formula)
    return clauses ∪ {root}                    # assert root

function WALK(F):
    if F is a propositional variable: return F
    if F = ¬G:
        x := WALK(G)
        t := fresh variable
        clauses ∪= {(t ∨ x), (¬t ∨ ¬x)}        # t ↔ ¬x
        return t
    if F = G ∧ H:
        x := WALK(G); y := WALK(H)
        t := fresh variable
        clauses ∪= {(¬t ∨ x), (¬t ∨ y), (t ∨ ¬x ∨ ¬y)}    # t ↔ x ∧ y
        return t
    # similar for ∨, →, ↔ (3, 3, 4 clauses respectively)
\`\`\`

Produces **equisatisfiable** CNF of **linear size** in |F|.`,
    },

    // ============ SAT ============
    {
      name: 'DPLL (Davis-Putnam-Logemann-Loveland 1962)', module: 'SAT', topicSlug: 'dpll',
      body: `\`\`\`
function DPLL(F):
    F := UNIT-PROPAGATE(F)
    F := PURE-LITERAL-ASSIGN(F)
    if F = {}: return SAT
    if {} ∈ F: return UNSAT
    ℓ := CHOOSE-LITERAL(F)
    return DPLL(F ∪ {ℓ}) or DPLL(F ∪ {¬ℓ})

function UNIT-PROPAGATE(F):
    while ∃ unit clause {ℓ} in F:
        for each clause c ∈ F:
            if ℓ ∈ c: remove c
            else if ¬ℓ ∈ c: c := c ∖ {¬ℓ}
    return F

function PURE-LITERAL-ASSIGN(F):
    while ∃ literal ℓ that appears with only one polarity in F:
        remove all clauses containing ℓ
    return F
\`\`\``,
    },

    {
      name: 'CDCL (Conflict-Driven Clause Learning, GRASP 1996 / Chaff 2001)', module: 'SAT', topicSlug: 'cdcl',
      body: `\`\`\`
function CDCL(F):
    if UNIT-PROPAGATE-AT-LEVEL-0 derives ⊥: return UNSAT
    decision_level := 0
    loop:
        if all variables assigned: return SAT
        decision_level += 1
        x := PICK-BRANCH-VARIABLE()                  # VSIDS
        v := PICK-BRANCH-VALUE(x)                    # phase saving
        assign(x = v, decision)
        while UNIT-PROPAGATE derives conflict:
            if decision_level = 0: return UNSAT
            C_learn, backjump_level := ANALYZE-CONFLICT()    # 1-UIP cut
            F.add(C_learn)
            BACKJUMP-TO(backjump_level)
            decision_level := backjump_level
            UPDATE-VSIDS(C_learn)
            # learned clause is now asserting → unit propagation forces
            #   the negation of the 1-UIP literal

function ANALYZE-CONFLICT():
    C := conflict clause
    while C has more than 1 literal at current decision level:
        ℓ := latest literal in C at current level
        C := RESOLVE(C, antecedent(ℓ), variable(ℓ))
    backjump := second-largest decision level in C
    return C, backjump
\`\`\``,
    },

    {
      name: 'WALKSAT', module: 'SAT', topicSlug: 'walksat',
      body: `\`\`\`
function WALKSAT(F, p, max_flips, max_tries):
    for try in 1..max_tries:
        α := random complete assignment to variables of F
        for flip in 1..max_flips:
            if α satisfies F: return α
            C := random unsatisfied clause
            if random() < p:
                x := random variable in C
            else:
                x := variable in C minimising break-count
                    (where break-count = # currently-sat clauses
                     that would become unsat if x flipped)
            α[x] := ¬α[x]
    return "no solution found"          # NOT "UNSAT"
\`\`\`

Empirically optimal $p \\approx 0.5$ for random 3-SAT.`,
    },

    {
      name: '2-SAT via implication graph + SCC', module: 'SAT', topicSlug: 'sat-problem',
      body: `\`\`\`
function TWO-SAT(F):
    G := directed graph
    for each clause (ℓ_1 ∨ ℓ_2) in F:
        add edge ¬ℓ_1 → ℓ_2
        add edge ¬ℓ_2 → ℓ_1
    components := TARJAN-SCC(G)
    for each variable x:
        if components[x] = components[¬x]:
            return UNSAT
    # Build model
    for each SCC in reverse topological order of condensation:
        for each literal ℓ in SCC:
            if assignment[var(ℓ)] not yet set:
                assignment[var(ℓ)] := (ℓ is positive)
    return SAT, assignment
\`\`\`

**Linear time** O(n + m).`,
    },
  ];

  let filter = $state('');
  let moduleFilter = $state<string>('all');
  const modules = ['Search', 'Adversarial', 'CSPs', 'Logic', 'SAT'];

  const filtered = $derived(algos.filter((a) => {
    if (moduleFilter !== 'all' && a.module !== moduleFilter) return false;
    if (filter && !(a.name + a.body).toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  }));
</script>

<article class="max-w-5xl">
  <h1>Pseudocode reference</h1>
  <p class="text-ink-600 dark:text-ink-300">
    Canonical pseudocode for every algorithm in the module — the form most likely to be expected on the exam.
    For interactive step-throughs see the linked topic page.
  </p>

  <div class="flex flex-wrap gap-2 my-4 items-center">
    <input bind:value={filter} placeholder="Filter algorithms…" class="flex-1 min-w-[200px] px-3 py-1.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm" />
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden text-xs">
      <button class="px-2 py-1 {moduleFilter === 'all' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (moduleFilter = 'all')}>All</button>
      {#each modules as m}
        <button class="px-2 py-1 {moduleFilter === m ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (moduleFilter = m)}>{m}</button>
      {/each}
    </div>
    <button class="btn btn-sm" onclick={() => window.print()}>🖨 Print</button>
  </div>

  <div class="space-y-4">
    {#each filtered as a (a.name)}
      <details class="card" open>
        <summary class="cursor-pointer">
          <span class="font-semibold">{a.name}</span>
          <span class="chip ml-2">{a.module}</span>
          <a class="chip ml-1 hover:bg-accent-100" href={href('/topic/' + a.topicSlug)} onclick={(e) => e.stopPropagation()}>open topic →</a>
        </summary>
        <div class="mt-3">
          <Md src={a.body} />
        </div>
      </details>
    {/each}
  </div>

  <div class="text-sm text-ink-500 mt-8">
    {filtered.length} of {algos.length} algorithms shown.
    Source styles: AIMA (search), Russell-Norvig (alpha-beta), Bessière (AC algorithms), Régin (GAC matching), Marques-Silva (CDCL), Selman et al. (WALKSAT), Aspvall et al. (2-SAT).
  </div>
</article>
