import type { Module } from '../types';

export const satModule: Module = {
  id: 'sat',
  title: 'Module 5 · SAT & SAT Solvers',
  slug: 'sat',
  oneLiner: 'DPLL, CDCL, WALKSAT — and why SAT is the universal NP-complete substrate.',
  topics: [
    {
      id: 'sat-problem',
      slug: 'sat-problem',
      module: 'Module 5 · SAT',
      title: 'The SAT problem',
      oneLiner: 'Decision and search versions; NP-completeness; why SAT matters.',
      sections: [
        {
          id: 'definition',
          title: 'Decision and search SAT',
          blocks: [
            { kind: 'md', body: `**SAT (decision)**: given a CNF formula $\\phi$, does there exist an assignment $A$ such that $A \\models \\phi$?

**SAT (search / model-finding)**: if so, return one such assignment.

**3-SAT**: SAT restricted to CNFs where each clause has exactly 3 literals. NP-complete (Cook 1971; Levin 1973). Most natural reductions target 3-SAT.

**$k$-SAT for $k \\ge 3$** is NP-complete; **2-SAT** is solvable in linear time (implication-graph SCC algorithm).` },
          ],
        },
        {
          id: 'why-matters',
          title: 'Why SAT matters',
          blocks: [
            { kind: 'md', body: `SAT is the **canonical NP-complete substrate**. Many problems reduce *naturally* to SAT:

- **Planning** (bounded horizon) — variables for actions at each timestep, clauses for preconditions and frame axioms.
- **Hardware/software verification** — bounded model checking encodes "bug exists within $k$ steps".
- **Constraint satisfaction** — Savile Row can target SAT via order-encoding.
- **Scheduling, routing, formal cryptanalysis** — too many to list.

Modern CDCL solvers can handle **millions of variables and clauses** in industrial instances. They're far faster than the worst-case $O(2^n)$ suggests because real instances have exploitable structure.` },
          ],
        },
        {
          id: 'phase-transition',
          title: 'Phase transition (random 3-SAT)',
          blocks: [
            { kind: 'md', body: `For random 3-SAT generated at clause/variable ratio $r = m/n$:

- $r \\ll 4.267$: almost surely SAT, easy.
- $r \\gg 4.267$: almost surely UNSAT, easy (short refutation).
- $r \\approx 4.267$: **hard regime** — solver time peaks sharply.

This **phase transition** is empirical (Cheeseman/Selman 1991) and partially proven. It's the classical benchmark for stress-testing solvers.` },
            { kind: 'callout', variant: 'whatif', title: 'You generate benchmarks at $r = 3$', body: 'They\'ll be easy — almost all SAT, and quickly satisfiable. Useless for measuring solver strength.' },
          ],
        },
      ],
      flashcards: [
        { id: 's1', q: 'Is 2-SAT NP-complete?', a: 'No. 2-SAT is in P (linear time via SCC on the implication graph). 3-SAT and higher are NP-complete.' },
        { id: 's2', q: 'What is the phase transition for random 3-SAT?', a: 'Around clause/variable ratio r ≈ 4.267. Below: easy SAT. Above: easy UNSAT. At the ratio: hard.' },
      ],
    },

    {
      id: 'dpll',
      slug: 'dpll',
      module: 'Module 5 · SAT',
      title: 'DPLL',
      oneLiner: 'Davis–Putnam–Logemann–Loveland: backtracking + unit propagation + pure literal.',
      sections: [
        {
          id: 'algorithm',
          title: 'The DPLL algorithm',
          blocks: [
            { kind: 'md', body: `DPLL (1962) is recursive backtracking on a CNF, with two simplification rules applied to fixed point at each call:

\`\`\`
function DPLL(F):
    F := UNIT-PROPAGATE(F)
    F := PURE-LITERAL-ASSIGN(F)
    if F = {} : return SAT     # all clauses satisfied
    if {} in F : return UNSAT  # an empty clause
    ℓ := CHOOSE-LITERAL(F)
    return DPLL(F ∪ {ℓ}) or DPLL(F ∪ {¬ℓ})
\`\`\`

**Unit propagation (BCP):** if a clause has all but one literal set false, the remaining literal *must* be true; assign it and simplify; repeat.

**Pure literal elimination:** if a variable appears with only one polarity in the unsimplified formula, assign it that polarity; the clauses it occurs in are all satisfied and disappear.

**Splitting / decision:** pick an unassigned variable, recurse on both polarities.` },
          ],
        },
        {
          id: 'heuristics',
          title: 'Decision heuristics',
          blocks: [
            { kind: 'md', body: `Several classical heuristics for \`CHOOSE-LITERAL\`:

- **Jeroslow-Wang (JW)** — score each literal $\\ell$ by $\\sum_{C \\ni \\ell} 2^{-|C|}$. Pick the literal with highest score; choose its polarity by another sum. Favours literals in many short clauses.
- **DLIS (Dynamic Largest Individual Sum)** — score by number of unsatisfied clauses the literal appears in. Cheap.
- **MOMS (Maximum Occurrences in Minimum-Size clauses)** — pick a literal occurring most in the shortest remaining clauses.

These are mostly historical — modern CDCL solvers use **VSIDS** (next topic).` },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: DPLL trace',
          blocks: [
            { kind: 'viz', viz: 'DPLL', title: 'Watch DPLL solve a small CNF', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'dp1', q: 'Two simplification rules of DPLL?', a: 'Unit propagation (forced assignments from unit clauses) and pure literal elimination (variables appearing only one polarity).' },
        { id: 'dp2', q: 'What is unit propagation, precisely?', a: 'If a clause has all but one literal falsified by the current assignment, the remaining literal must be true. Assign it; this may make further clauses unit; repeat.' },
        { id: 'dp3', q: 'Pure literal elimination — what is "pure"?', a: 'A literal is pure if its variable appears with only one polarity in the unsimplified formula. Pure literals can safely be set true.' },
      ],
      examples: [
        {
          id: 'dpex1', difficulty: 'intermediate', marks: 8,
          question: 'Trace DPLL on the CNF: $(x_1 \\lor x_2) \\land (\\lnot x_1 \\lor x_2) \\land (\\lnot x_2 \\lor x_3) \\land (\\lnot x_3)$. Show every assignment and the order of decisions/propagations.',
          answer: `**Clauses:** $C_1 = (x_1, x_2), C_2 = (\\lnot x_1, x_2), C_3 = (\\lnot x_2, x_3), C_4 = (\\lnot x_3)$.

**Initial.** No assignments.

**Step 1 — Unit propagation.** $C_4 = (\\lnot x_3)$ is a unit clause → $x_3 = F$.

After: $C_3 = (\\lnot x_2, F) = (\\lnot x_2)$ — now a unit. Propagate: $x_2 = F$.

After: $C_1 = (x_1, F) = (x_1)$ — unit. Propagate: $x_1 = T$. $C_2 = (\\lnot T, F) = (F)$ — empty clause!

**Conflict at the root** (decision level 0). DPLL reports **UNSAT**.

**Verification (truth table over $x_1, x_2, x_3$):**

| $x_1$ | $x_2$ | $x_3$ | $C_1$ | $C_2$ | $C_3$ | $C_4$ | KB |
|---|---|---|---|---|---|---|---|
| F | F | F | F | — | — | — | F |
| F | F | T | F | — | — | — | F |
| F | T | F | T | T | F | T | F |
| F | T | T | T | T | T | F | F |
| T | F | F | T | F | — | — | F |
| T | F | T | T | F | — | — | F |
| T | T | F | T | T | F | T | F |
| T | T | T | T | T | T | F | F |

No row satisfies all four. Confirmed UNSAT.

**Note.** Pure-literal didn't fire here because no variable was monosigned. The CNF was solved entirely by unit propagation.`,
        },
        {
          id: 'dpex2', difficulty: 'advanced', marks: 6,
          question: 'Show a CNF where pure-literal elimination is essential — without it, DPLL would do exponentially more work.',
          answer: `**Construction.** Consider a CNF where one variable $y$ appears only positively across many clauses, and the rest of the formula is hard.

\`\`\`
(y ∨ A) ∧ (y ∨ B) ∧ (y ∨ C) ∧ ... ∧ HardCNF(x_1..x_n)
\`\`\`

If $y$ appears positively in many clauses and never negatively, it's a **pure literal**.

**With pure-literal elimination:** set $y = T$ immediately. All "$y \\lor \\ldots$" clauses vanish. The remaining formula is just \`HardCNF(x_1..x_n)\`.

**Without pure-literal elimination:** DPLL might branch on $y$ first. The branch $y = T$ removes the constraints quickly; the branch $y = F$ unnecessarily explores assignments to satisfy the formerly-trivial $(y \\lor A)$ clauses via $A, B, C, \\ldots$. The $y = F$ subtree is wasted exponential work.

**More dramatic version:** stack many such pure literals.

\`\`\`
(y_1 ∨ p_1)(y_1 ∨ p_2)... ∧ (y_2 ∨ q_1)(y_2 ∨ q_2)... ∧ ... ∧ HardCNF
\`\`\`

DPLL without pure-literal could branch on each $y_i$ and explore the wasteful $y_i = F$ subtree for each — exponential in the number of $y_i$.

**With pure-literal:** all $y_i$ resolved in O(n) time, then the hard part is tackled.

**Modern CDCL.** Often doesn't use pure-literal explicitly because VSIDS branches on "active" variables (those appearing in conflicts) and pure literals never appear in conflicts. But preprocessing-time pure-literal elimination is still common.`,
        },
      ],
    },

    {
      id: 'cdcl',
      slug: 'cdcl',
      module: 'Module 5 · SAT',
      title: 'CDCL — Conflict-Driven Clause Learning',
      oneLiner: 'DPLL + learnt clauses + non-chronological backjumping + VSIDS.',
      sections: [
        {
          id: 'overview',
          title: 'The CDCL architecture',
          blocks: [
            { kind: 'md', body: `CDCL (Marques-Silva & Sakallah, GRASP 1996; Moskewicz et al., Chaff 2001) extends DPLL with:

- **Implication graph** tracking how assignments were forced.
- **Conflict analysis** producing a **learnt clause** that captures *why* the conflict happened.
- **Non-chronological backjumping** to the earliest decision level where the learnt clause has effect.
- **VSIDS** decision heuristic.
- **Two-watched literals** for fast unit propagation.
- **Restarts** (Luby / geometric schedules).
- **Clause deletion** (e.g. by LBD score) to control memory.

Modern CDCL = the dominant industrial SAT technology. Solvers like Kissat, CaDiCaL, MiniSat win the SAT competitions on this design.` },
          ],
        },
        {
          id: 'implication-graph',
          title: 'Implication graph',
          blocks: [
            { kind: 'md', body: `**Definition.** Directed graph. Nodes are literal assignments, each labelled with its **decision level** $d$. Edges go from antecedent literals (the other literals in the clause that forced this one to be unit-propagated) **to** the implied literal. Decision literals have no incoming edges.

A **conflict** appears when a variable is assigned both true and false — equivalently, an empty clause is derived. The conflict is a special node receiving the conflicting clause's literals.

Example. With clauses $\\{ \\neg a \\vee b \\}, \\{ \\neg a \\vee c \\}, \\{ \\neg b \\vee \\neg c \\vee d \\}$ and decision $a = T$ at level 1:

- $a$ decided at level 1 → $b$ forced at level 1 (via $\\neg a \\vee b$) → $c$ forced at level 1 (via $\\neg a \\vee c$) → $d$ forced at level 1 (via $\\neg b \\vee \\neg c \\vee d$).` },
          ],
        },
        {
          id: 'uip',
          title: '1-UIP & learnt clauses',
          blocks: [
            { kind: 'md', body: `A **UIP (Unique Implication Point)** at the current decision level is a node that **dominates** the conflict — every path from the current decision back to the conflict node passes through it.

The **1-UIP** is the UIP closest to the conflict. Cut the implication graph just above 1-UIP; literals on the **reason side** with edges crossing into the conflict side form the **learnt clause** — their negations.

**Why 1-UIP:** the learnt clause has a single literal from the current decision level (the negation of 1-UIP). After backjumping it becomes unit, and unit-propagates the 1-UIP literal automatically — this is the "asserting" property.

**Non-chronological backjumping:** backtrack to the **second-largest** decision level appearing in the learnt clause. At that level the clause becomes asserting (a unit clause forcing the 1-UIP variable to its opposite assignment).` },
            { kind: 'callout', variant: 'keyfact', title: '1-UIP is special', body: 'There can be many UIPs. 1-UIP is empirically the best cut (Moskewicz et al. 2001). It gives short learnt clauses that propagate strongly.' },
          ],
        },
        {
          id: 'vsids',
          title: 'VSIDS — decision heuristic',
          blocks: [
            { kind: 'md', body: `**Variable State Independent Decaying Sum**.

- Each literal carries a real-valued score.
- When a literal appears in a learnt clause, its score is **bumped** (e.g. $+1$).
- All scores are periodically multiplied by a decay factor $\\alpha < 1$ (e.g. $0.95$).
- Branch on the unassigned variable with the highest score; polarity from "phase saving" or last value.

**Why it works:**
- Activity-based — focuses on variables involved in recent conflicts.
- Decay — old activity fades; the solver tracks the "current" hot region of the formula.
- O(1) update with a priority queue / max-heap.` },
          ],
        },
        {
          id: 'restart',
          title: 'Restarts, clause deletion, watched literals',
          blocks: [
            { kind: 'md', body: `**Restarts.** Periodically discard the current assignment but keep learnt clauses and VSIDS scores. Counters heavy-tailed runtime distributions (a bad initial decision sequence can doom the run). **Luby sequence** $1,1,2,1,1,2,4,1,1,2,1,1,2,4,8,\\ldots$ is provably good.

**Clause deletion.** Learnt clauses pile up; memory explodes. Score each by **LBD (Literal Block Distance)** — number of distinct decision levels in the clause. Delete high-LBD (low-utility) clauses periodically.

**Two-watched literals.** Each clause watches two of its non-false literals. A clause becomes unit only when one of its watches goes false and no replacement exists. **No need to walk every clause on every assignment** — only those watching the just-flipped literal.

This combination is why CDCL is fast: the average iteration cost is very low.` },
            { kind: 'callout', variant: 'pitfall', title: 'Don\'t conflate backjumping with backtracking', body: 'Chronological backtracking goes up one level. Backjumping (non-chronological) can skip many levels using the learnt clause\'s second-highest decision level.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: CDCL with implication graph',
          blocks: [
            { kind: 'viz', viz: 'CDCL', title: 'Watch CDCL build an implication graph and learn clauses', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'c1', q: 'What is the 1-UIP, in one sentence?', a: 'The Unique Implication Point closest to the conflict — a node at the current decision level that every path from the decision to the conflict must pass through.' },
        { id: 'c2', q: 'After a conflict, where do you backjump to?', a: 'To the second-largest decision level appearing in the learnt clause — the level at which the clause becomes asserting (unit).' },
        { id: 'c3', q: 'VSIDS in one sentence.', a: 'Per-literal activity scores that get bumped when the literal appears in a learnt clause and periodically decayed; branch on highest score.' },
        { id: 'c4', q: 'Two-watched literals — what saves the time?', a: 'A clause only needs inspection when one of its two watched literals becomes false. Avoids scanning every clause after every assignment.' },
        { id: 'c5', q: 'Why restart?', a: 'SAT solver runtime is heavy-tailed; a bad early decision sequence can doom the run. Restart, keep learnt clauses, try again with different early decisions.' },
        { id: 'c6', q: 'Three things CDCL adds over DPLL?', a: 'Conflict analysis with learnt clauses, non-chronological backjumping, VSIDS (plus two-watched literals, restarts, clause deletion).' },
      ],
      pitfalls: [
        '1-UIP is the cut, not the conflict itself. Practise drawing the implication graph and identifying the 1-UIP correctly.',
        'Backjumping ≠ backtracking. Memorise the "second-largest decision level in learnt clause" rule.',
        'VSIDS scores survive across restarts; learnt clauses do too. Restart only resets the trail.',
      ],
      examples: [
        {
          id: 'cex1', difficulty: 'advanced', marks: 12,
          question: 'For the clauses $\\{\\lnot x_1, x_2\\}, \\{\\lnot x_1, x_3\\}, \\{\\lnot x_2, \\lnot x_3, x_4\\}, \\{\\lnot x_4\\}$, with decision $x_1 = T$ at level 1: draw the implication graph, identify the 1-UIP, and derive the learnt clause.',
          answer: `**Decision:** $x_1 = T$ at level 1. No incoming edges.

**Unit propagation:**
- $\\{\\lnot x_1, x_2\\}$: $x_1 = T \\Rightarrow x_2 = T$ (level 1). Antecedent: $\\{\\lnot x_1, x_2\\}$.
- $\\{\\lnot x_1, x_3\\}$: $x_1 = T \\Rightarrow x_3 = T$ (level 1). Antecedent: $\\{\\lnot x_1, x_3\\}$.
- $\\{\\lnot x_2, \\lnot x_3, x_4\\}$: $x_2 = x_3 = T \\Rightarrow x_4 = T$ (level 1). Antecedent.
- $\\{\\lnot x_4\\}$: $x_4 = T$ contradicts. **Conflict!**

**Implication graph** (text rendering):

\`\`\`
        x_1=T (L1, decision)
       / | (via {¬x_1, x_2})
      / (via {¬x_1, x_3})
     v   v
   x_2=T x_3=T
       \\ /
        v  (via {¬x_2, ¬x_3, x_4})
       x_4=T
        |  (conflict with {¬x_4})
        v
      CONFLICT
\`\`\`

**Identifying UIPs.** A UIP at the current decision level is a node that **every path from the decision to the conflict must pass through**.

- $x_1$ (the decision itself) — every path starts here. **A UIP.**
- $x_2$ and $x_3$ — not UIPs individually (each is bypassable via the other).
- $x_4$ — every path goes through here. **A UIP** and the **closest to conflict** = **1-UIP**.

**Cut at 1-UIP.** The cut places $x_4$ on the conflict side; everything else on the reason side. Antecedents of $x_4$ are $\\{x_2, x_3\\}$ (via clause $\\{\\lnot x_2, \\lnot x_3, x_4\\}$). The conflict clause $\\{\\lnot x_4\\}$ contributes $\\lnot x_4$.

**Learnt clause** = negation of the **reason-side literals adjacent to the cut**:

Reason side: $x_2, x_3$.

Learnt: $\\{\\lnot x_2, \\lnot x_3\\}$ — i.e. "we can't have $x_2 = x_3 = T$ simultaneously."

**Backjump level.** Levels of literals in learnt clause: $x_2$ at L1, $x_3$ at L1. Only one decision level. Backjump to level 0.

At level 0, the learnt clause $\\{\\lnot x_2, \\lnot x_3\\}$ doesn't propagate yet (no assignments). The original CDCL would normally redo the trail from the next decision; the conflict path showed that $x_1 = T$ leads to $\\bot$, so combined with the learnt clause and further reasoning, $x_1 = T$ is unsafe.

**In practice** the implementation forces re-derivation: at L0 with the learnt clause and trail cleared, propagation now sees that any future $x_1 = T$ will again force $x_2, x_3 = T$ then conflict — so a future analysis will derive a learnt clause involving $\\lnot x_1$.`,
        },
        {
          id: 'cex2', difficulty: 'intermediate', marks: 6,
          question: 'Explain *non-chronological backjumping*. Why "second-largest decision level in the learnt clause"?',
          answer: `**Chronological backtracking** (DPLL): on conflict, undo decisions in reverse order — go up exactly one level.

**Non-chronological backjumping** (CDCL): on conflict, use the **learnt clause** to determine the highest level the clause becomes useful — and jump there directly, possibly skipping many levels.

**Why "second-largest decision level"?**

The learnt clause has the property that after the 1-UIP cut, exactly **one** literal is at the current decision level (the 1-UIP itself) and the rest are at earlier levels.

If we backjump to the **largest** earlier level (i.e. the second-largest level overall in the learnt clause), then:
- All other literals in the learnt clause are at this level or earlier — so they're all assigned.
- The 1-UIP literal is now **unassigned** (we undid its level).
- Therefore the learnt clause has all literals falsified *except* one — it's a **unit clause**.

The clause **propagates immediately**, forcing the 1-UIP literal to its other value. This is the *asserting* property — guaranteed to make progress.

**Why not jump higher?** If you jumped to a level *higher* than the second-largest, the learnt clause wouldn't be unit yet (other literals also unassigned) — no immediate progress. The "second-largest" is the **deepest level where assertion is guaranteed**.

**Why not jump lower?** Lower levels lose information (more decisions undone). The "second-largest" is the **shallowest** safe level.

**Practical consequence.** A single conflict can sometimes backjump 20+ levels in industrial instances — chronological DPLL would take 20+ separate backtracks to recover the same information.`,
        },
      ],
    },

    {
      id: 'walksat',
      slug: 'walksat',
      module: 'Module 5 · SAT',
      title: 'GSAT & WALKSAT',
      oneLiner: 'Stochastic local search for SAT — incomplete but often very fast.',
      sections: [
        {
          id: 'gsat',
          title: 'GSAT',
          blocks: [
            { kind: 'md', body: `**GSAT** (Selman, Levesque, Mitchell 1992):

\`\`\`
function GSAT(F, max_flips, max_tries):
    for try in 1..max_tries:
        A := random complete assignment
        for flip in 1..max_flips:
            if A satisfies F: return A
            x := variable whose flip maximises satisfied clauses (with random tie-break)
            A := A with x flipped
    return failure
\`\`\`

**Greedy** — every step picks the best flip globally. Costly: must consider all variables.

**Issue:** plateaux and local optima — gets stuck where no flip improves the count.` },
          ],
        },
        {
          id: 'walksat',
          title: 'WALKSAT',
          blocks: [
            { kind: 'md', body: `**WALKSAT** (Selman, Kautz, Cohen 1994) — focused random walk:

\`\`\`
function WALKSAT(F, p, max_flips, max_tries):
    for try in 1..max_tries:
        A := random complete assignment
        for flip in 1..max_flips:
            if A satisfies F: return A
            C := random unsatisfied clause
            with probability p:
                x := random variable in C
            else:
                x := variable in C minimising "break-count"
                  (number of currently satisfied clauses broken by flipping x)
            A := A with x flipped
    return failure
\`\`\`

**Key differences from GSAT:**
1. **Restrict to one unsatisfied clause** — cheap and focused.
2. **Noise parameter $p$** — with probability $p$ do a random flip in that clause; otherwise do a greedy "least break-count" flip.
3. The random component **escapes plateaux**.

**Empirical sweet spot:** $p \\approx 0.5$ for random 3-SAT (Hoos & Stützle).

**Incompleteness.** WALKSAT can find a satisfying assignment but **cannot prove UNSAT** (no global view). For UNSAT instances, use DPLL/CDCL.` },
            { kind: 'callout', variant: 'whatif', title: 'You set $p = 0$', body: 'Pure greedy WALKSAT — like a focused GSAT. Plateaux and local optima trap it.' },
            { kind: 'callout', variant: 'whatif', title: 'You set $p = 1$', body: 'Pure random walk. Theoretically still complete in expectation, but achingly slow.' },
          ],
        },
        {
          id: 'comparison',
          title: 'When to use which solver',
          blocks: [
            { kind: 'md', body: `| Property | DPLL | CDCL | WALKSAT |
|---|---|---|---|
| Proves UNSAT? | ✅ | ✅ | ✗ |
| Industrial SAT instances | slow | **fast** | rare |
| Random hard 3-SAT | slow | fast | often fastest |
| Crafted UNSAT instances | slow | fast | hangs |
| Memory | low | medium (learnt clauses) | low |
| Parallelisable | hard | medium | trivial |

**Rule of thumb:** if you suspect SAT and the instance is large/random, try WALKSAT first. If you need a proof of UNSAT, or the instance is structured (industrial), go straight to CDCL.` },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: WALKSAT in action',
          blocks: [
            { kind: 'viz', viz: 'WalkSAT', title: 'Watch WALKSAT flip variables', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'w1', q: 'Difference between GSAT and WALKSAT?', a: 'WALKSAT first picks a random unsatisfied clause and only considers flips of variables IN that clause; GSAT considers all variables globally each step.' },
        { id: 'w2', q: 'What is the noise parameter p in WALKSAT?', a: 'Probability of doing a random flip in the chosen unsatisfied clause (vs greedy "minimise break-count" flip).' },
        { id: 'w3', q: 'Can WALKSAT prove UNSAT?', a: 'No. Local search is incomplete — it can find a satisfying assignment but cannot rule one out.' },
        { id: 'w4', q: 'Why does WALKSAT escape plateaux that GSAT cannot?', a: 'The random component (noise p) lets it move "downhill" probabilistically out of equal-fitness regions.' },
      ],
      examples: [
        {
          id: 'wex1', difficulty: 'intermediate', marks: 5,
          question: 'For CNF $(x_1 \\lor x_2) \\land (\\lnot x_1 \\lor x_3) \\land (\\lnot x_2 \\lor \\lnot x_3)$ with initial assignment $x_1 = x_2 = x_3 = F$: trace one step of WALKSAT with $p = 0$ (pure greedy).',
          answer: `**Initial assignment:** all F.

**Unsatisfied clauses:** $(x_1 \\lor x_2)$ is the only one falsified (the other two contain negative literals, satisfied by F).

Actually let me re-check:
- $(x_1 \\lor x_2)$ with $x_1 = x_2 = F$: F ∨ F = **false**.
- $(\\lnot x_1 \\lor x_3)$ with $x_1 = F$: $\\lnot F \\lor F = T$. Satisfied.
- $(\\lnot x_2 \\lor \\lnot x_3)$ with $x_2 = x_3 = F$: $T \\lor T = T$. Satisfied.

**Pick the random unsatisfied clause:** $(x_1 \\lor x_2)$ (only one available).

**$p = 0$ → greedy choice.** For each variable in this clause ($x_1, x_2$), compute **break-count** = number of currently-satisfied clauses that flip would break.

**Flip $x_1$** (T): now
- $(x_1 \\lor x_2)$: T → satisfied. (Not a break, this was unsat.)
- $(\\lnot x_1 \\lor x_3)$: F ∨ F = F. **Broken.** Break count +=1.
- $(\\lnot x_2 \\lor \\lnot x_3)$: still T.

Break count of $x_1$: **1**.

**Flip $x_2$** (T): now
- $(x_1 \\lor x_2)$: T → satisfied.
- $(\\lnot x_1 \\lor x_3)$: T.
- $(\\lnot x_2 \\lor \\lnot x_3)$: F ∨ T = T. Still satisfied.

Break count of $x_2$: **0**.

**WALKSAT picks $x_2$** (minimum break-count). Flip.

**New assignment:** $x_1 = F, x_2 = T, x_3 = F$. All clauses satisfied. **DONE — SAT in 1 step.**

**Note.** With $p > 0$, with probability $p$ we'd flip a random variable in the unsat clause, possibly $x_1$ — leading to a different trajectory.`,
        },
        {
          id: 'wex2', difficulty: 'advanced', marks: 6,
          question: 'Why is the empirically-optimal noise parameter $p \\approx 0.5$ for random 3-SAT, not 0 or 1?',
          answer: `**$p = 0$ (pure greedy)** behaves like GSAT/min-conflicts restricted to unsat clauses. Vulnerable to:
- **Plateaux:** all candidate flips have the same break-count, so the search loops.
- **Local optima:** every flip *increases* the unsat-count, but the global optimum requires going through a worse state.

**$p = 1$ (pure random walk)** ignores greedy guidance entirely. Theoretically converges in expectation (random walk on a finite state space) but achingly slow on hard instances.

**Sweet spot $\\approx 0.5$:**
- Greedy steps converge fast in **easy regions**.
- Random steps escape plateaux and local optima in **hard regions**.
- The 50/50 mix lets the search adapt to the local landscape automatically.

**Empirical evidence** (Hoos & Stützle, JAR 2000, https://www.cs.ubc.ca/~hoos/Publ/jar00.pdf): on random 3-SAT at the phase transition ratio $r \\approx 4.27$, $p \\in [0.3, 0.6]$ minimises expected solve time.

**Problem-dependence.** For structured (industrial) SAT, the optimal $p$ varies. **Adaptive WALKSAT** (Hoos 2002) tunes $p$ online based on recent improvement rate. Modern solvers use such adaptive variants.

**For exam purposes:** know $p \\approx 0.5$ is the random-3-SAT empirical sweet spot; explain *why* (greedy fast, random escape) rather than memorising the number.`,
        },
        {
          id: 'wex3', difficulty: 'intermediate', marks: 5,
          question: 'When would you choose WALKSAT over CDCL? When would you do the opposite?',
          answer: `**Choose WALKSAT when:**
1. **Instance is satisfiable AND large random** (e.g. random 3-SAT near phase transition with $n > 10^4$). Local search exploits the abundant satisfying assignments.
2. **Anytime answer needed.** WALKSAT can be interrupted to return the best-so-far partial solution.
3. **Memory tight.** WALKSAT uses $O(n)$ memory; CDCL stores learnt clauses, sometimes hundreds of MB on hard instances.
4. **Embedded / massively parallel.** WALKSAT parallelises trivially (run many independent restarts); CDCL parallelisation is harder.

**Choose CDCL when:**
1. **Instance might be UNSAT.** Only CDCL can produce a proof of unsatisfiability.
2. **Instance is structured / industrial** (hardware verification, planning encodings). The structure exploited by learnt-clauses + VSIDS dominates random rollouts.
3. **Need an explanation** (e.g. proof, unsat-core for debugging). CDCL gives both; WALKSAT gives only an assignment.
4. **Reproducibility matters.** CDCL is deterministic (modulo random branching); WALKSAT is inherently stochastic.

**Hybrid systems:** some modern SAT competition entries run WALKSAT *and* CDCL in parallel, returning whichever finishes first. WALKSAT often wins satisfiable random instances; CDCL wins everything else.

**For a third-year exam answer:** the distinction "WALKSAT for satisfiable random, CDCL for everything else" + the **UNSAT proof asymmetry** is the key idea.`,
        },
      ],
    },
  ],
};
