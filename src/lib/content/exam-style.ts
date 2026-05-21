import type { ExampleQuestion } from '../types';

// Exam-style worked questions modelled on the York COM00050H paper style.
// Each follows the pattern: real-world scenario → identify pattern → model → trace algorithm.

export const examStyleExamples: Record<string, ExampleQuestion[]> = {
  'cp-modelling': [
    {
      id: 'es-mod-1', difficulty: 'advanced', marks: 17,
      question: `A logistics department arranges delivery from $w$ warehouses to $s$ shops ($w \\le s$). Every warehouse supplies every kind of product. Each shop must be supplied by exactly one warehouse. \`demand[i]\` is shop $i$\'s weekly demand; \`capacity[j]\` is warehouse $j$\'s weekly capacity.

**(i) [3 marks]** Identify a modelling pattern (sequence, multiset, relation, function, partition) suitable for the warehouse-to-shop relationship. Justify.

**(ii) [6 marks]** Write **two distinct viewpoints** using only integer/Boolean variables (or arrays thereof). Describe variable meanings; no constraints needed.

**(iii) [8 marks]** Complete each viewpoint with the necessary constraints. Briefly explain each.`,
      answer: `## (i) Modelling pattern — 3 marks

The relationship is a **(total) function** $f : \\text{Shops} \\to \\text{Warehouses}$:

- *Each* shop must be supplied (function is **total**).
- Each shop has exactly *one* supplier (functional — each input maps to one output).
- It is **not** a bijection or injection because multiple shops can share a warehouse (and $w \\le s$ so some sharing is unavoidable).
- Not a relation (relations allow zero or many outputs; we have exactly one).
- Not a partition (a partition would describe grouping shops into warehouse-clusters, which is *equivalent* but the function view is more direct for the per-shop demand constraints).

## (ii) Two viewpoints — 6 marks

**Viewpoint 1 — Shop-indexed integer array (function as matrix):**

\`\`\`
given w, s : int(1..)
given demand   : matrix indexed by [int(1..s)] of int(1..)
given capacity : matrix indexed by [int(1..w)] of int(1..)

find supplier : matrix indexed by [int(1..s)] of int(1..w)
\`\`\`

\`supplier[i] = j\` means shop $i$ is supplied by warehouse $j$.

**Viewpoint 2 — Boolean assignment matrix (relation as matrix):**

\`\`\`
find serves : matrix indexed by [int(1..w), int(1..s)] of bool
\`\`\`

\`serves[j][i] = true\` means warehouse $j$ supplies shop $i$.

## (iii) Constraints — 8 marks

**Viewpoint 1 constraints:**

\`\`\`
such that
    $ capacity constraint: total demand assigned to each warehouse ≤ its capacity
    forAll j : int(1..w) .
        (sum i : int(1..s) . demand[i] * toInt(supplier[i] = j)) <= capacity[j]
\`\`\`

The function structure already gives "each shop has exactly one supplier" by construction — \`supplier[i]\` is a single integer. Only the **capacity** constraint needs explicit posting.

**Viewpoint 2 constraints:**

\`\`\`
such that
    $ each shop served by exactly one warehouse
    forAll i : int(1..s) .
        (sum j : int(1..w) . toInt(serves[j][i])) = 1,

    $ capacity: total demand assigned to each warehouse ≤ its capacity
    forAll j : int(1..w) .
        (sum i : int(1..s) . demand[i] * toInt(serves[j][i])) <= capacity[j]
\`\`\`

The Boolean encoding **does not** build in "exactly one supplier per shop", so we must add the **sum = 1** constraint per shop. Capacity constraint is structurally identical.

**Channeling (if both viewpoints kept):**

\`\`\`
forAll i : int(1..s), j : int(1..w) .
    serves[j][i] <-> (supplier[i] = j)
\`\`\`

**Note:** Viewpoint 1 is more compact ($s$ variables vs $w \\cdot s$); Viewpoint 2 is more flexible for constraints like "warehouse $j$ must serve at least 2 shops" (= \`sum_i serves[j][i] >= 2\`).`,
    },
    {
      id: 'es-mod-2', difficulty: 'intermediate', marks: 10,
      question: `**Pattern recognition exercise.** For each scenario, identify the modelling pattern (sequence / multiset / set / relation / function / partition):

(a) Assigning each student in a class to exactly one project (10 projects, 30 students; multiple students per project OK).

(b) Choosing a starting line-up of 11 players from a 25-player squad.

(c) Scheduling 5 lectures into time slots Mon-Fri 9am, 10am, 11am — each lecture in exactly one slot, each slot at most one lecture.

(d) Listing the order in which to visit 8 cities on a holiday.

(e) Dividing 12 students into 4 study groups (each student in exactly one group; group sizes may vary).`,
      answer: `(a) **Total function** Students → Projects. Each student maps to exactly one project; projects can have many students.

(b) **Set of size 11** from the 25-player domain. Order does not matter; no duplicates.

(c) **Injective function** Lectures → Slots. Each lecture goes to one slot (function), and no two lectures share a slot (injective).

(d) **Sequence** (or permutation) over the city set. Order matters; if all 8 must be visited exactly once, it is specifically a **bijection** from positions {1..8} to Cities.

(e) **Partition** of Students into 4 parts (regular by element count if equal-sized; \`numParts 4\` otherwise).

**Key markers:**
- *order matters* → sequence
- *unordered, no duplicates* → set
- *unordered, with multiplicities* → multiset
- *each input → exactly one output, many-to-one* → function (total)
- *each input → exactly one output, distinct outputs* → injective function
- *each input in exactly one of k groups* → partition into k parts`,
    },
    {
      id: 'es-mod-3', difficulty: 'advanced', marks: 12,
      question: `**Exam timetabling.** A university must schedule $n$ exams into $k$ slots. Some pairs of exams "clash" (some student takes both). Clashing exams must be in different slots. Some exams require a large room; only slots $\\{1, 3, 5\\}$ have large rooms.

(i) [4 marks] Identify the pattern. Justify.
(ii) [4 marks] Write **two** viewpoints in Essence Prime.
(iii) [4 marks] Add constraints to each viewpoint.`,
      answer: `## (i) Pattern — 4 marks

A **function** Exams → Slots (each exam in exactly one slot). NOT injective (multiple non-clashing exams can share a slot).

Alternative equivalent view: a **partition** of exams into per-slot groups. Both viewpoints lead to equivalent models; function is more direct for the per-exam constraint.

## (ii) Viewpoints — 4 marks

**Viewpoint A — slot-per-exam:**

\`\`\`
given n, k : int(1..)
given clash : matrix indexed by [int(1..n), int(1..n)] of bool
given large : matrix indexed by [int(1..n)] of bool   $ true if exam needs large room

find slot : matrix indexed by [int(1..n)] of int(1..k)
\`\`\`

**Viewpoint B — Boolean assignment matrix:**

\`\`\`
find sched : matrix indexed by [int(1..n), int(1..k)] of bool
\`\`\`

\`sched[i][s] = true\` iff exam $i$ is in slot $s$.

## (iii) Constraints — 4 marks

**Viewpoint A:**

\`\`\`
such that
    $ clashing exams in different slots
    forAll i, j : int(1..n), i < j .
        clash[i, j] -> slot[i] != slot[j],

    $ large-room exams only in slots {1, 3, 5}
    forAll i : int(1..n) .
        large[i] -> slot[i] in int(1, 3, 5)
\`\`\`

**Viewpoint B:**

\`\`\`
such that
    $ each exam in exactly one slot
    forAll i : int(1..n) .
        (sum s : int(1..k) . toInt(sched[i, s])) = 1,

    $ clashing exams not in the same slot
    forAll i, j : int(1..n), i < j, s : int(1..k) .
        clash[i, j] -> !(sched[i, s] /\\ sched[j, s]),

    $ large-room exams restricted to {1, 3, 5}
    forAll i : int(1..n), s : int(1..k) .
        large[i] /\\ sched[i, s] -> s in int(1, 3, 5)
\`\`\`

**Note:** Viewpoint A is much shorter and uses fewer variables. Viewpoint B enables easier "at most $C$ exams per slot" cardinality constraints (just sum the column). Choice depends on what other constraints arise.`,
    },
  ],

  'backtracking': [
    {
      id: 'es-fc-1', difficulty: 'advanced', marks: 12,
      question: `Apply **Forward Checking with d-way branching** to this CSP. Variable order: $x_1, x_2, x_3$. Value order: increasing.

Variables and domains:
- $x_1 \\in \\{2, 4, 7\\}$
- $x_2 \\in \\{1, 2, 5, 7\\}$
- $x_3 \\in \\{2, 3, 7\\}$

Constraints (servers needing 3-slot separation in a rack):
- $|x_1 - x_2| \\ge 3$
- $|x_1 - x_3| \\ge 3$
- $|x_2 - x_3| \\ge 3$

State the steps; if a solution is found, terminate and report it.`,
      answer: `**Initial domains:** $D(x_1) = \\{2, 4, 7\\}$, $D(x_2) = \\{1, 2, 5, 7\\}$, $D(x_3) = \\{2, 3, 7\\}$.

---

**Try $x_1 = 2$.**

Forward checking on $x_2$ against $|x_1 - x_2| \\ge 3$: $|2 - v| \\ge 3$ means $v \\le -1$ or $v \\ge 5$. Keep $\\{5, 7\\}$ from $\\{1, 2, 5, 7\\}$.

FC on $x_3$ against $|x_1 - x_3| \\ge 3$: $|2 - v| \\ge 3$, so $v \\ge 5$. Keep $\\{7\\}$ from $\\{2, 3, 7\\}$.

Now $D(x_2) = \\{5, 7\\}$, $D(x_3) = \\{7\\}$.

**Try $x_2 = 5$** (smallest).

FC on $x_3$ against $|x_2 - x_3| \\ge 3$: $|5 - v| \\ge 3$, so $v \\le 2$ or $v \\ge 8$. $D(x_3) = \\{7\\} \\cap \\{v : v \\le 2 \\text{ or } v \\ge 8\\} = \\emptyset$. **FC fails** — backtrack.

**Try $x_2 = 7$.**

FC on $x_3$: $|7 - v| \\ge 3$, $v \\le 4$ or $v \\ge 10$. $D(x_3) = \\{7\\}$ filtered: $\\emptyset$. **FC fails** — backtrack.

All values of $x_2$ exhausted with $x_1 = 2$. Backtrack on $x_1$.

---

**Try $x_1 = 4$.**

FC on $x_2$: $|4 - v| \\ge 3$, $v \\le 1$ or $v \\ge 7$. $D(x_2) = \\{1, 2, 5, 7\\} \\to \\{1, 7\\}$.

FC on $x_3$: $|4 - v| \\ge 3$, $v \\le 1$ or $v \\ge 7$. $D(x_3) = \\{2, 3, 7\\} \\to \\{7\\}$.

**Try $x_2 = 1$.**

FC on $x_3$: $|1 - v| \\ge 3$, $v \\le -2$ or $v \\ge 4$. $D(x_3) = \\{7\\} \\cap \\{v : v \\ge 4\\} = \\{7\\}$. Survives.

**Try $x_3 = 7$.**

All variables assigned. Check constraints:
- $|x_1 - x_2| = |4 - 1| = 3 \\ge 3$ ✓
- $|x_1 - x_3| = |4 - 7| = 3 \\ge 3$ ✓
- $|x_2 - x_3| = |1 - 7| = 6 \\ge 3$ ✓

**Solution: $x_1 = 4$, $x_2 = 1$, $x_3 = 7$.** ✓

Algorithm terminates.

**Total backtracks: 2** (both at $x_2$ under $x_1 = 2$).`,
    },
    {
      id: 'es-fc-2', difficulty: 'intermediate', marks: 8,
      question: `Apply FC with d-way branching to this CSP. Variable order: $A, B, C$. Value order: increasing.

- $A, B, C \\in \\{1, 2, 3\\}$
- $A \\ne B$, $B \\ne C$, $A < C$

State each step.`,
      answer: `**Initial:** $D(A) = D(B) = D(C) = \\{1, 2, 3\\}$.

**Try $A = 1$.**
- FC on $B$ ($A \\ne B$): remove 1. $D(B) = \\{2, 3\\}$.
- FC on $C$ ($A < C$): keep $C > 1$. $D(C) = \\{2, 3\\}$.

**Try $B = 2$.**
- FC on $C$ ($B \\ne C$): remove 2. $D(C) = \\{3\\}$.

**Try $C = 3$.** All assigned. Check: $A=1 \\ne 2=B$ ✓, $B=2 \\ne 3=C$ ✓, $A=1 < 3=C$ ✓. **Solution: $(1, 2, 3)$.** ✓

**Total backtracks: 0.** First-shot success because FC pruned domains decisively each step.`,
    },
    {
      id: 'es-fc-3', difficulty: 'intermediate', marks: 8,
      question: `Repeat the previous CSP ($A, B, C \\in \\{1, 2, 3\\}$; $A \\ne B, B \\ne C, A < C$) using **chronological backtracking *without* FC**. State each step. Compare with FC.`,
      answer: `**Try $A = 1, B = 1$.** Check $A \\ne B$: $1 = 1$ → fail. Backtrack on $B$.

**Try $B = 2$.** $A \\ne B$ OK. Try $C = 1$. $B \\ne C$: $2 \\ne 1$ OK. $A < C$: $1 < 1$? No → fail. Try $C = 2$. $B \\ne C$ fails. $C = 3$: $B \\ne C$ OK, $A < C$ OK. ✓ Solution.

**So without FC:** ~5 assignments tried, 2 failures.

**With FC (previous question):** 3 assignments tried, 0 failures.

**Lesson:** FC catches the inconsistencies that would otherwise be discovered only at deeper levels. The per-step cost is higher but the search tree is dramatically smaller — especially on larger CSPs.`,
    },
    {
      id: 'es-fc-4', difficulty: 'advanced', marks: 10,
      question: `Construct a CSP on **4 variables**, each with domain $\\{1, 2, 3, 4\\}$, with constraints that force at least one backtrack from $x_1$ under FC. Then trace.`,
      answer: `**CSP:**
- $x_1, x_2, x_3, x_4 \\in \\{1, 2, 3, 4\\}$.
- $x_1 + x_2 = 5$
- $x_2 + x_3 = 5$
- $x_3 + x_4 = 5$

Each constraint forces a sum to 5 with the next variable.

---

**Try $x_1 = 1$.** FC on $x_2$ ($x_1 + x_2 = 5$): only $x_2 = 4$ works. $D(x_2) = \\{4\\}$. FC on $x_3$ and $x_4$: no direct constraint with $x_1$, so $D(x_3) = \\{1,2,3,4\\}$, $D(x_4) = \\{1,2,3,4\\}$.

**Try $x_2 = 4$.** FC on $x_3$ ($x_2 + x_3 = 5$): $x_3 = 1$. $D(x_3) = \\{1\\}$.

**Try $x_3 = 1$.** FC on $x_4$ ($x_3 + x_4 = 5$): $x_4 = 4$. $D(x_4) = \\{4\\}$.

**Try $x_4 = 4$.** All assigned. Check constraints — all satisfied. **Solution: $(1, 4, 1, 4)$.** ✓

Total backtracks: 0.

---

**To force a backtrack:** add the constraint $x_1 \\ne x_3$.

**Try $x_1 = 1$.** FC on $x_3$ ($x_1 \\ne x_3$): $D(x_3) = \\{2, 3, 4\\}$. FC on $x_2$: $D(x_2) = \\{4\\}$. FC on $x_4$ unchanged.

**Try $x_2 = 4$.** FC on $x_3$ ($x_2 + x_3 = 5$): $x_3 = 1$. But $D(x_3) = \\{2, 3, 4\\}$ doesn't contain 1. $D(x_3) = \\emptyset$. **FC fails** — backtrack on $x_2$ (no more values). Backtrack on $x_1$.

**Try $x_1 = 2$.** FC: $D(x_2) = \\{3\\}, D(x_3) = \\{1, 3, 4\\}$.

**Try $x_2 = 3$.** FC: $x_3 = 2$. $D(x_3) = \\{2\\} \\cap \\{1, 3, 4\\} = \\emptyset$. **Fail.** Backtrack on $x_2$, on $x_1$.

**Try $x_1 = 3$.** Similar reasoning: $D(x_2) = \\{2\\}, x_3 = 3$ but $x_3 \\ne x_1 = 3$. **Fail.**

**Try $x_1 = 4$.** $D(x_2) = \\{1\\}$. $x_2 = 1$. $x_3 = 4$. But $x_3 \\ne x_1 = 4$. **Fail.**

All values exhausted → **no solution exists**.

(Adding $x_1 \\ne x_3$ to the chain $x_1+x_2=5, x_2+x_3=5$ forces $x_3 = x_1$, which contradicts $x_1 \\ne x_3$ → UNSAT.)

**Take-away:** the trace style of FC: at each assignment, prune neighbours; on empty domain, backtrack. Variables not directly constrained with the just-assigned variable are not touched by that step's FC.`,
    },
  ],

  'csp-inference': [
    {
      id: 'es-ac4-1', difficulty: 'advanced', marks: 21,
      question: `**Container stacking — Arc Consistency exam-style.**

You are loading stacks of 4 containers. Each container needs to be compatible with the one directly above and below. Four container types:

| Type | Heavy | Hazardous Chemicals | Food Products |
|---|---|---|---|
| 1 | Yes | No | Yes |
| 2 | No | Yes | No |
| 3 | Yes | No | No |
| 4 | No | No | Yes |

Rules: a heavy container is never placed on top of a light one; a chemical container is never directly above OR below a food container.

**(i) [9 marks]** Write the constraint $c(x_1, x_2)$ between bottom container $x_1$ and the one above it $x_2$ as a set of satisfying tuples.

**(ii) [12 marks]** With $c(x_1, x_2) = c(x_2, x_3) = c(x_3, x_4) = $ {⟨1,1⟩, ⟨1,2⟩, ⟨2,2⟩, ⟨2,4⟩, ⟨3,3⟩, ⟨4,2⟩, ⟨4,4⟩}, assign $x_1 = 1$ and apply **AC-4** to establish arc consistency. Show counters and queue $S$ at each step.`,
      answer: `## (i) Constraint $c(x_1, x_2)$ — 9 marks

Allowed if: (a) $x_2$ NOT heavier than $x_1$ AND (b) NOT (one is chemicals AND the other is food).

Check every pair $(x_1, x_2)$ with $x_1, x_2 \\in \\{1, 2, 3, 4\\}$ — 16 pairs total.

**Heavy/light condition** ($x_2$ above $x_1$; "heavy never on top of light"):
- Types 1, 3 are heavy; 2, 4 are light.
- $x_2$ heavy AND $x_1$ light → **forbidden**.
- So forbidden pairs by heavy/light: $(2,1), (2,3), (4,1), (4,3)$.

**Food/chemicals condition** (no chemicals directly above or below food):
- Type 2 = chemicals; types 1, 4 = food.
- Forbidden adjacent pairs: $(1, 2), (2, 1), (4, 2), (2, 4)$.

Wait — re-check: 2 is chemicals; food types are 1 and 4. So forbidden: any (chemical, food) or (food, chemical) adjacency. Pairs: $(2, 1), (2, 4), (1, 2), (4, 2)$.

**All forbidden pairs:**
- From heavy/light: $(2,1), (2,3), (4,1), (4,3)$.
- From food/chemicals: $(2,1), (2,4), (1,2), (4,2)$.
- Union: $(1, 2), (2, 1), (2, 3), (2, 4), (4, 1), (4, 2), (4, 3)$.

**Allowed = all pairs minus forbidden:**

$$c(x_1, x_2) = \\{(1,1), (1,3), (1,4), (2,2), (3,1), (3,2), (3,3), (3,4), (4,4)\\}$$

(That's 16 − 7 = 9 tuples.)

---

## (ii) AC-4 trace after $x_1 = 1$ — 12 marks

**Note**: the question gives a *different* constraint relation from (i). Use that relation as given. All three constraints use the same 7-tuple relation:

$$R = \\{(1,1), (1,2), (2,2), (2,4), (3,3), (4,2), (4,4)\\}$$

**Initial setup.** After $x_1 = 1$: $D(x_1) = \\{1\\}$, $D(x_2) = D(x_3) = D(x_4) = \\{1,2,3,4\\}$.

**Build counters** for each (variable, value, constraint-partner). For constraint $c(x_i, x_j)$:
- counter[$x_i, v, x_j$] = $|\\{w \\in D(x_j) : (v, w) \\in R\\}|$.

**Constraint $c(x_1, x_2)$** with $D(x_1) = \\{1\\}, D(x_2) = \\{1,2,3,4\\}$:
- counter[$x_1, 1, x_2$] = |{(1, w) ∈ R}| = |{(1,1), (1,2)}| = 2 ✓
- counter[$x_2, 1, x_1$] = |{(v, 1) ∈ R with v ∈ D(x_1)}| = |{(1,1)}| = 1 ✓
- counter[$x_2, 2, x_1$] = |{(v, 2) ∈ R with v ∈ D(x_1)}| = |{(1,2)}| = 1 ✓
- counter[$x_2, 3, x_1$] = |{(v, 3) ∈ R with v=1}| = 0 → **remove 3 from D(x_2)**
- counter[$x_2, 4, x_1$] = |{(v, 4) ∈ R with v=1}| = 0 → **remove 4 from D(x_2)**

**Constraint $c(x_2, x_3)$** with $D(x_2) = \\{1, 2, 3, 4\\}, D(x_3) = \\{1, 2, 3, 4\\}$:
- counter[$x_2, v, x_3$] for each v:
  - v=1: |{(1,w) ∈ R}| = 2
  - v=2: |{(2,w) ∈ R}| = 2
  - v=3: |{(3,w) ∈ R}| = 1
  - v=4: |{(4,w) ∈ R}| = 2
- counter[$x_3, w, x_2$] for each w:
  - w=1: |{(v,1) ∈ R}| = 1 (only (1,1))
  - w=2: |{(v,2) ∈ R}| = 3 ((1,2), (2,2), (4,2))
  - w=3: |{(v,3) ∈ R}| = 1 (only (3,3))
  - w=4: |{(v,4) ∈ R}| = 2 ((2,4), (4,4))

All ≥ 1 → no initial removals from $D(x_3)$.

**Constraint $c(x_3, x_4)$** with $D(x_3) = D(x_4) = \\{1,2,3,4\\}$: symmetric — no removals.

**Initial $S$ (deletions to propagate):** $\\{(x_2, 3), (x_2, 4)\\}$ from the $c(x_1, x_2)$ pass.

Also $D(x_2) = \\{1, 2\\}$ after removals.

---

**Process S iteration 1: pop $(x_2, 3)$.**

For each constraint involving $x_2$:
- **$c(x_2, x_3)$** : for each $w \\in D(x_3)$ that had support via $x_2 = 3$ (i.e. tuples $(3, w) \\in R$): just $(3, 3)$. So decrement counter[$x_3, 3, x_2$]: was 1, now 0. **Remove 3 from $D(x_3)$**. Add $(x_3, 3)$ to S.

Update: $D(x_3) = \\{1, 2, 4\\}$.

- **$c(x_1, x_2)$**: $x_2 = 3$ was already noted not in $D(x_2)$; this is the constraint that *caused* the removal. (Skip — the counter for $x_1$ via $x_2$'s domain change has already been handled OR — depending on implementation — for each $v \\in D(x_1)$ supported via $x_2 = 3$: $(v, 3) \\in R$ with $v = 1$ is $(1, 3)$ — not in R. So no decrement. No change to counter[$x_1, 1, x_2$].)

**Process S iteration 2: pop $(x_2, 4)$.**

- **$c(x_2, x_3)$**: tuples $(4, w) \\in R$: $(4, 2), (4, 4)$. Decrement counter[$x_3, 2, x_2$]: was 3 → 2 (still > 0, keep). Decrement counter[$x_3, 4, x_2$]: was 2 → 1 (still > 0, keep).
- **$c(x_1, x_2)$**: $(v, 4) \\in R$ with $v \\in D(x_1) = \\{1\\}$: $(1, 4)$ not in R. No change.

No new removals.

**Process S iteration 3: pop $(x_3, 3)$** (added above).

- **$c(x_3, x_4)$**: tuples $(3, w) \\in R$: $(3, 3)$. Decrement counter[$x_4, 3, x_3$]: was 1 → 0. **Remove 3 from $D(x_4)$**. Add $(x_4, 3)$ to S.
- **$c(x_2, x_3)$**: tuples $(v, 3) \\in R$: $(3, 3)$. Decrement counter[$x_2, 3, x_3$]. But $x_2 = 3$ already removed, so no effect on remaining $D(x_2)$. (Counter is bookkeeping for removed values; safe to skip.)

Update: $D(x_4) = \\{1, 2, 4\\}$.

**Process S iteration 4: pop $(x_4, 3)$.**

- **$c(x_3, x_4)$**: $(v, 3) \\in R$ with $v \\in D(x_3)$ now $\\{1, 2, 4\\}$: $(3, 3)$ — but $3 \\notin D(x_3)$, so already handled. No effect.

**S is now empty. AC-4 terminates.**

---

**Final domains:**

- $D(x_1) = \\{1\\}$
- $D(x_2) = \\{1, 2\\}$
- $D(x_3) = \\{1, 2, 4\\}$
- $D(x_4) = \\{1, 2, 4\\}$

The CSP is arc-consistent. A solution still requires search — e.g. try $x_2 = 1$, then propagate further, etc.

**Marks scheme tip:** for full marks, draw the initial counter table explicitly, show $S$ as a queue with each pop, and indicate which counter went to zero at each step.`,
    },
    {
      id: 'es-ac3-1', difficulty: 'advanced', marks: 12,
      question: `Apply **AC-3** to: $X, Y, Z \\in \\{1, 2, 3\\}$, constraints $X < Y$, $Y < Z$, $X + Z = 4$. Show the arc queue and domain reductions at each step.`,
      answer: `**Initial.** All domains $\\{1, 2, 3\\}$.

**Arcs** (each binary constraint gives 2): $(X,Y), (Y,X), (Y,Z), (Z,Y), (X,Z), (Z,X)$.

For $X + Z = 4$, this is binary; the "allowed pairs" are: $(1,3), (2,2), (3,1)$.

---

**Queue:** $[(X,Y), (Y,X), (Y,Z), (Z,Y), (X,Z), (Z,X)]$.

**Pop $(X, Y)$.** REVISE on $X < Y$: for each $v \\in D(X)$, ∃ $w \\in D(Y) = \\{1,2,3\\}$ with $v < w$?
- $v = 1$: ∃ $w = 2$ ✓
- $v = 2$: ∃ $w = 3$ ✓
- $v = 3$: ∃ $w > 3$? No → **remove 3**.

$D(X) = \\{1, 2\\}$. Re-enqueue $(Z, X)$.

Queue: $[(Y,X), (Y,Z), (Z,Y), (X,Z), (Z,X), (Z,X)]$. (Duplicate is fine.)

**Pop $(Y, X)$.** For each $w \\in D(Y)$, ∃ $v \\in D(X) = \\{1, 2\\}$ with $v < w$?
- $w = 1$: no → **remove 1**.
- $w = 2, 3$: ✓

$D(Y) = \\{2, 3\\}$. Re-enqueue $(X, Y), (Z, Y)$.

**Pop $(Y, Z)$.** For each $v \\in D(Y) = \\{2, 3\\}$, ∃ $w \\in D(Z) = \\{1,2,3\\}$ with $v < w$?
- $v = 2$: $w = 3$ ✓
- $v = 3$: no → **remove 3**.

$D(Y) = \\{2\\}$. Re-enqueue $(X, Y), (Z, Y)$.

**Pop $(Z, Y)$.** For each $w \\in D(Z) = \\{1,2,3\\}$, ∃ $v \\in D(Y) = \\{2\\}$ with $v < w$?
- $w = 1, 2$: need $v < w$. $v = 2 < 1$? No. $v = 2 < 2$? No. → **remove 1, 2**.
- $w = 3$: $v = 2 < 3$ ✓.

$D(Z) = \\{3\\}$. Re-enqueue $(X, Z)$.

**Pop $(X, Z)$.** For each $v \\in D(X) = \\{1,2\\}$, ∃ $w \\in D(Z) = \\{3\\}$ with $v + w = 4$?
- $v = 1$: $w = 3 \\Rightarrow 1 + 3 = 4$ ✓
- $v = 2$: $w = 3 \\Rightarrow 2 + 3 = 5$ ✗ → **remove 2**.

$D(X) = \\{1\\}$. Re-enqueue $(Y, X)$.

**Pop $(Z, X)$.** For each $w \\in D(Z) = \\{3\\}$, ∃ $v \\in D(X) = \\{1\\}$ with $v + w = 4$? $1 + 3 = 4$ ✓.

No removals.

**Pop remaining arcs $(X, Y), (Z, Y), (Y, X), (Z, X)$.** Each REVISE finds no new removals.

**Queue empty. Final domains:** $D(X) = \\{1\\}, D(Y) = \\{2\\}, D(Z) = \\{3\\}$.

**Unique solution:** $(X, Y, Z) = (1, 2, 3)$. ✓

AC-3 fully solved this CSP without search — domain reductions propagated to single values.`,
    },
  ],

  'beyond-ac3': [
    {
      id: 'es-gac-1', difficulty: 'advanced', marks: 10,
      question: `Three variables $X_1, X_2, X_3$ with domains $\\{a, b\\}, \\{a, b\\}, \\{a, b, c\\}$ subject to AllDifferent$(X_1, X_2, X_3)$.

(i) [4 marks] What does pairwise $\\ne$ propagation deduce? What can't it deduce?
(ii) [6 marks] Apply Régin's GAC algorithm. What does it deduce that pairwise misses?`,
      answer: `## (i) Pairwise propagation — 4 marks

Pairwise $\\ne$ constraints: $X_1 \\ne X_2, X_1 \\ne X_3, X_2 \\ne X_3$.

No singleton domain → no immediate propagation. Each value of each variable is still consistent with *some* value of every other variable individually.

**What pairwise misses:** the global structure. $X_1, X_2 \\in \\{a, b\\}$ means together they use up both $a$ and $b$ — leaving only $c$ for $X_3$. But pairwise reasoning sees only "$X_3 \\ne X_1$ and $X_3 \\ne X_2$", which allows $X_3 \\in \\{a, b, c\\}$ as long as $X_3$ avoids whichever value $X_1$ or $X_2$ ultimately takes.

## (ii) Régin's GAC algorithm — 6 marks

**Bipartite graph $G$.**
- Left nodes: $X_1, X_2, X_3$.
- Right nodes: $a, b, c$.
- Edges: $X_1$–$a$, $X_1$–$b$, $X_2$–$a$, $X_2$–$b$, $X_3$–$a$, $X_3$–$b$, $X_3$–$c$.

**Find a maximum matching.** One such matching $M^* = \\{(X_1, a), (X_2, b), (X_3, c)\\}$. Size 3 = number of variables → AllDifferent **feasible**.

**For each variable-value edge, check: is it in *some* maximum matching?**

- $(X_1, a)$: yes ($M^*$ above).
- $(X_1, b)$: yes ($\\{(X_1, b), (X_2, a), (X_3, c)\\}$).
- $(X_2, a)$: yes.
- $(X_2, b)$: yes.
- $(X_3, a)$: is there a max matching using this? Would need to match $X_1$ and $X_2$ to the remaining values $\\{b, c\\}$. But $X_1, X_2 \\in \\{a, b\\}$ — neither can take $c$. So at best $X_1 = b, X_2 = ?$ — $a$ taken by $X_3$. $X_2 \\in \\{a, b\\}$: $a$ taken, $b$ taken. **No matching exists** with $X_3 = a$.

→ **Remove $a$ from $D(X_3)$.**

- $(X_3, b)$: same analysis — $X_1, X_2$ can't both be assigned, since one of $a, b$ taken by $X_3 = b$ and only $\\{a, b\\}$ available. **Remove.**
- $(X_3, c)$: yes ($M^*$).

→ **Remove $b$ from $D(X_3)$.**

**Final domains after Régin's GAC:**
- $D(X_1) = \\{a, b\\}$
- $D(X_2) = \\{a, b\\}$
- $D(X_3) = \\{c\\}$

**What pairwise missed:** the global deduction "$X_1, X_2$ together exhaust $\\{a, b\\}$ → $X_3 = c$ forced".

GAC for AllDifferent via bipartite matching catches it instantly.`,
    },
    {
      id: 'es-2way-1', difficulty: 'intermediate', marks: 8,
      question: `For a CSP with variable $X$ having domain $\\{1, 2, 3, 4, 5\\}$, draw the **2-way** vs **d-way** branching trees that would result at the first decision point. State one advantage of each.`,
      answer: `**d-way tree at $X$:**

\`\`\`
        X
   /  |  |  |  \\
 X=1 X=2 X=3 X=4 X=5
\`\`\`

Five children, one per value.

**2-way tree at $X$** (assume value-ordering picks $X = 3$ first):

\`\`\`
        X
       / \\
    X=3   X≠3
            ↓
          [subtree on D(X)\\{3} = {1,2,4,5}]
\`\`\`

Two children. The right subtree's first decision will pick another value, say $X = 1$, splitting again into $X = 1$ vs $X \\ne 1$ (now over $\\{2, 4, 5\\}$).

**Advantage of d-way:** Shallower for SAT instances — finds a solution in fewer levels of recursion when most values lead to solutions.

**Advantage of 2-way:** The right branch ($X \\ne v$) propagates immediately via AC, ruling out any constraint that depended on $X = v$ for *all* descendants. With strong value-ordering heuristics, the right branch is reached often → big pruning gains.

**Modern CP solvers** (Minion, Choco) use 2-way as default for the propagation benefit.`,
    },
  ],

  'csp-fundamentals': [
    {
      id: 'es-csp-fundamentals-nc-ac',
      difficulty: 'intermediate', marks: 10,
      question: `Suppose you have the following small CSP. Variables $x_1, x_2, x_3$, each with domain $\\{1, 2, 3\\}$.

- $C_1$: $x_1 < x_2$
- $C_2$: $x_2 < x_3$
- $C_3$: $x_3 > 1$
- $C_4$: $x_1 \\ne 2$

**(i) [2 marks]** Enforce **global node consistency** on this CSP. What are the resulting domains?

**(ii) [4 marks]** Enforce **global arc consistency** on this CSP (by any method). What are the resulting domains?

**(iii) [4 marks]** Find an order of arc revisions in which an arc needs to be revised more than once to establish global arc consistency.`,
      answer: `## (i) Global node consistency — 2 marks

Apply the two unary constraints:

- $C_3$: $x_3 > 1$ removes 1 from $D(x_3)$ → $D(x_3) = \\{2, 3\\}$.
- $C_4$: $x_1 \\ne 2$ removes 2 from $D(x_1)$ → $D(x_1) = \\{1, 3\\}$.

**Result.** $D(x_1) = \\{1, 3\\}$, $D(x_2) = \\{1, 2, 3\\}$, $D(x_3) = \\{2, 3\\}$.

Note: "global" here means *every* variable is node-consistent, not just one. For unary constraints this is the same as applying each unary constraint to its variable once.

## (ii) Global arc consistency — 4 marks

Arcs (each binary constraint contributes two directed arcs): $(x_1, x_2), (x_2, x_1), (x_2, x_3), (x_3, x_2)$.

Run AC-3 from the post-NC domains in FIFO order $[(x_1,x_2), (x_2,x_1), (x_2,x_3), (x_3,x_2)]$:

| Step | Arc | REVISE result | Domains after |
|---|---|---|---|
| 1 | $(x_1, x_2)$ | $v=3$ has no $w > 3$ in $\\{1,2,3\\}$ → remove 3 | $D(x_1) = \\{1\\}$; re-enqueue $(x_2, x_1)$ |
| 2 | $(x_2, x_1)$ | $v=1$ has no $w < 1$ in $\\{1\\}$ → remove 1 | $D(x_2) = \\{2, 3\\}$; re-enqueue $(x_1, x_2), (x_3, x_2)$ |
| 3 | $(x_2, x_3)$ | $v=3$ has no $w > 3$ in $\\{2, 3\\}$ → remove 3 | $D(x_2) = \\{2\\}$; re-enqueue $(x_1, x_2), (x_3, x_2)$ |
| 4 | $(x_3, x_2)$ | $v=2$ has no $w < 2$ in $\\{2\\}$ → remove 2 | $D(x_3) = \\{3\\}$; re-enqueue $(x_2, x_3)$ |
| 5 | $(x_1, x_2)$ | $v = 1$, $w = 2$ ✓ | no change |
| 6 | $(x_3, x_2)$ | $v = 3$, $w = 2$ ✓ | no change |
| 7 | $(x_2, x_3)$ | $v = 2$, $w = 3$ ✓ | no change |

**Final domains.** $D(x_1) = \\{1\\}, D(x_2) = \\{2\\}, D(x_3) = \\{3\\}$.

Each variable now has a unique value — the unique solution is $x_1 = 1, x_2 = 2, x_3 = 3$.

## (iii) An arc revised more than once — 4 marks

From the trace above, $(x_1, x_2)$ appears at step 1 and again at step 5. $(x_3, x_2)$ appears at step 4 and again at step 6. So **either** of these is a valid answer.

**A cleaner choice that makes the re-revision obvious:** start with $(x_2, x_3)$ before any $(x_1, x_2)/(x_2, x_1)$ revision.

\`\`\`
Queue order: (x2,x3), (x3,x2), (x1,x2), (x2,x1), (x1,x2)*, (x3,x2)*, (x2,x3)*
\`\`\`

The starred entries are forced re-revisions: shrinking $D(x_2)$ via $(x_2, x_1)$ later in the run re-queues every arc *into* $x_2$, including $(x_1, x_2)$ and $(x_3, x_2)$, which must be revised again.

**Why this happens in general.** An arc $(X_k, X_i)$ is enqueued every time $D(X_i)$ shrinks, because a value of $X_k$ might have been supported only by the value just removed from $D(X_i)$. Any arc that *feeds into* a variable whose domain shrinks twice during AC-3 is revised twice.`,
      tags: ['NC', 'AC-3', 'arc-ordering'],
    },

    {
      id: 'es-csp-fundamentals-global-local',
      difficulty: 'basic', marks: 6,
      question: `Distinguish **local** and **global** consistency at both the node and arc level. Give one example where the two definitions differ in practice (i.e. enforcing local consistency does not give global consistency in one pass).`,
      answer: `## Local vs global — 3 marks

| Level | Local | Global |
|---|---|---|
| Node | $D(X_i)$ satisfies every unary constraint on $X_i$ (single variable) | Every variable in the CSP is locally node-consistent |
| Arc | A single arc $(X_i, X_j)$ is consistent: every value in $D(X_i)$ has a support in $D(X_j)$ | Every arc in the CSP is locally arc-consistent (whole network) |

A single REVISE call enforces *local* arc consistency on one arc; AC-3 iterates REVISE until *global* arc consistency holds.

## Difference in practice — 3 marks

For **node consistency**, local and global coincide after one pass: unary constraints don't interact, so enforcing local NC on every variable once gives global NC.

For **arc consistency**, they differ: REVISE-ing every arc once does **not** give global AC. Counter-example —

$X_1, X_2, X_3 \\in \\{1, 2, 3\\}$, constraints $X_1 < X_2 < X_3$. One pass over arcs $(X_1, X_2), (X_2, X_1), (X_2, X_3), (X_3, X_2)$:

- $(X_1, X_2)$ removes 3 from $D(X_1)$ → $D(X_1) = \\{1, 2\\}$.
- $(X_2, X_1)$ removes 1 from $D(X_2)$ → $D(X_2) = \\{2, 3\\}$.
- $(X_2, X_3)$ removes 3 from $D(X_2)$ → $D(X_2) = \\{2\\}$.
- $(X_3, X_2)$ removes 2 from $D(X_3)$ → $D(X_3) = \\{3\\}$.

After one pass, $(X_1, X_2)$ is **no longer** locally AC: $D(X_2) = \\{2\\}$, so $v = 2 \\in D(X_1)$ has no $w > v$ in $D(X_2)$. AC-3 catches this only because it re-enqueues $(X_1, X_2)$ when $D(X_2)$ shrinks.`,
      tags: ['NC', 'AC', 'global vs local'],
    },
  ],

  'csp-inference': [
    {
      id: 'es-csp-ac3-ordering-effect',
      difficulty: 'intermediate', marks: 8,
      question: `Take the CSP from question es-csp-fundamentals-nc-ac (variables $x_1, x_2, x_3$, domain $\\{1,2,3\\}$, $x_1<x_2<x_3$, $x_3>1$, $x_1 \\ne 2$).

**(i) [4 marks]** Give an arc-revision order that requires the **minimum** number of REVISE calls to reach the AC fixpoint, and count the calls.

**(ii) [4 marks]** Give an arc-revision order that requires the **maximum** number of REVISE calls, and count.`,
      answer: `Recall: post-NC domains are $D(x_1) = \\{1,3\\}, D(x_2) = \\{1,2,3\\}, D(x_3) = \\{2,3\\}$.

## (i) Minimum — 4 marks

We need every arc to be revised **at least once**. The minimum is achieved when no arc is revised more than once.

Order $[(x_2,x_3), (x_2,x_1), (x_3,x_2), (x_1,x_2)]$:

| # | Arc | Effect |
|---|---|---|
| 1 | $(x_2, x_3)$ | remove 3 from $D(x_2)$ → $\\{1,2\\}$. Re-enqueue $(x_1, x_2)$ (already in queue), $(x_3, x_2)$ (already in queue) — no new arcs added. |
| 2 | $(x_2, x_1)$ | remove 1 from $D(x_2)$ → $\\{2\\}$. Re-enqueue $(x_1, x_2), (x_3, x_2)$ — already in queue. |
| 3 | $(x_3, x_2)$ | remove 2 from $D(x_3)$ → $\\{3\\}$. Re-enqueue $(x_2, x_3)$ — **new**, added. |
| 4 | $(x_1, x_2)$ | remove 3 from $D(x_1)$ → $\\{1\\}$. Re-enqueue $(x_2, x_1)$ — **new**, added. |
| 5 | $(x_2, x_3)$ | $v = 2$, $w = 3$ ✓. No change. |
| 6 | $(x_2, x_1)$ | $v = 2$, $w = 1$ ✓ (since $w < v$). No change. |

Six calls — but $(x_2, x_3)$ and $(x_2, x_1)$ each appear twice. The truly-minimum trace can't avoid the re-revision because any order that shrinks $D(x_2)$ twice forces incoming arcs to be re-revised.

**Minimum REVISE count: 6.** (Four "initial" arcs + two forced re-revisions.)

## (ii) Maximum — 4 marks

Worst case: every arc revised the maximum possible number of times. Each domain shrinks at most $d - 1$ times (here $d = 3$, so at most 2 shrinks per variable). Each shrink triggers re-enqueueing of $\\le$ degree-1 incoming arcs.

A pathological order: $[(x_1, x_2), (x_2, x_1), (x_2, x_3), (x_3, x_2)]$ in FIFO:

From the original trace (es-csp-fundamentals-nc-ac part ii), this gives **7 REVISE calls** — $(x_1, x_2)$ and $(x_3, x_2)$ each appear twice, $(x_2, x_3)$ also twice. The maximum is 7 for this CSP.

**Upper bound in general.** For a binary CSP with $n$ variables, $c$ binary constraints, max domain size $d$: AC-3 is $O(c \\cdot d^3)$. Each arc can be revised at most $d$ times because each revision either shrinks $D(\\text{first arg})$ or makes no change; first arg can shrink at most $d - 1$ times.`,
      tags: ['AC-3', 'ordering', 'complexity'],
    },

    {
      id: 'es-csp-fc-vs-mac',
      difficulty: 'advanced', marks: 12,
      question: `Consider a CSP: variables $A, B, C$ each with domain $\\{1, 2, 3\\}$. Constraints: $A < B$, $A < C$, $B \\ne C$.

**(i) [6 marks]** Trace **backtracking + FC** with variable order $A, B, C$ and value order increasing. Show the search tree, FC pruning at each node, and total nodes explored.

**(ii) [6 marks]** Trace **backtracking + MAC** with the same orderings. Show the search tree and explain where MAC prunes more than FC.`,
      answer: `## (i) Backtracking + FC — 6 marks

Initial domains $D(A) = D(B) = D(C) = \\{1, 2, 3\\}$.

**Try $A = 1$.**
FC: prune $B$ by $A < B$ → $D(B) = \\{2, 3\\}$. Prune $C$ by $A < C$ → $D(C) = \\{2, 3\\}$. $B \\ne C$ doesn't fire yet (B unassigned).

**Try $B = 2$ (under $A = 1$).**
FC: prune $C$ by $B \\ne C$ → $D(C) = \\{3\\}$. (B's own domain restricted to {2}; A's not touched, already assigned.)

**Try $C = 3$.** All assigned, consistent. ✓ Solution $A=1, B=2, C=3$.

**Search tree (FC):**

\`\`\`
A=1
└── B=2
    └── C=3  ✓
\`\`\`

**Total nodes: 3.**

## (ii) Backtracking + MAC — 6 marks

**Try $A = 1$.**
MAC runs AC-3 to fixpoint:
- $(A, B)$: $D(A) = \\{1\\}$, $D(B)$ needs $w > 1$ → $D(B) = \\{2, 3\\}$. No change.
- $(A, C)$: $D(C) = \\{2, 3\\}$.
- $(B, C)$ with $B \\ne C$: both $\\{2,3\\}$; no support failure.
- $(B, A), (C, A)$: $D(B) = \\{2,3\\}$ — each value has $w = 1 \\in D(A)$. ✓
- $(C, B)$: similar.

MAC fixpoint: $D = \\{1\\}, \\{2, 3\\}, \\{2, 3\\}$. No further pruning beyond FC here.

**Try $B = 2$.**
MAC: $(C, B)$ with $B \\ne C$ removes 2 from $D(C)$ → $D(C) = \\{3\\}$. Re-enqueue $(A, C)$ etc — all consistent. MAC fixpoint $D = \\{1\\}, \\{2\\}, \\{3\\}$.

**Try $C = 3$.** ✓

**Where MAC prunes more.** On this small example, MAC and FC explore the same tree because the constraint graph is dense enough that FC's one-step propagation captures everything immediately.

**A case where MAC strictly wins.** Add a fourth variable $D \\in \\{1, 2, 3\\}$ with constraints $C < D$. FC after $A = 1$ doesn't propagate the $C < D$ chain (D is not a neighbour of A); MAC does — it processes $(D, C)$ and prunes $D(D) = \\{2, 3\\}$, then $(C, D)$ no further changes. The pruning then cascades when $B = 2$ shrinks $D(C)$ to $\\{3\\}$: MAC re-runs AC-3 and prunes $D(D)$ to $\\emptyset$ if any constraint forbids it. FC waits until D is the decision variable.

**Key insight.** FC = one-step propagation from the *decision variable*. MAC = full AC-3 from the *decision domain change*. The difference shows up most when constraints chain through multiple variables.`,
      tags: ['FC', 'MAC', 'comparison'],
    },
  ],

  'beyond-ac3': [
    {
      id: 'es-2way-vs-dway',
      difficulty: 'intermediate', marks: 10,
      question: `CSP: $X \\in \\{1, 2, 3, 4, 5\\}$, $Y \\in \\{1, 2, 3, 4, 5\\}$. Constraint: $X + Y = 6$.

**(i) [5 marks]** Show the search tree under **d-way branching** on $X$ first (value order increasing), with FC.

**(ii) [5 marks]** Show the search tree under **2-way branching** on $X$ (value order increasing), with FC. Explain the difference.`,
      answer: `## (i) d-way — 5 marks

Try each $X = v$ in turn. FC removes $Y$ values that violate $X + Y = 6$.

\`\`\`
X=1 → D(Y) = {5}  → Y=5  ✓ solution (1,5)
X=2 → D(Y) = {4}  → Y=4  ✓ solution (2,4)
X=3 → D(Y) = {3}  → Y=3  ✓ solution (3,3)
X=4 → D(Y) = {2}  → Y=2  ✓ solution (4,2)
X=5 → D(Y) = {1}  → Y=1  ✓ solution (5,1)
\`\`\`

Tree has **5 children** under the root, each a depth-2 leaf. 5 decisions + 5 leaves = 10 nodes.

If we only need *one* solution, the search stops after the first leaf (X=1, Y=5). With increasing value order on Y, the first FC-pruned value is the only candidate, so no failures.

## (ii) 2-way — 5 marks

Pick first value $X = 1$. **LEFT**: $X = 1$, FC: $D(Y) = \\{5\\}$. Solution.

If we needed all solutions, the RIGHT branch ($X \\ne 1$) would shrink $D(X) = \\{2, 3, 4, 5\\}$ and recurse:
- LEFT: $X = 2$, $D(Y) = \\{4\\}$. Solution.
- RIGHT: $X \\ne 2$, $D(X) = \\{3, 4, 5\\}$. Recurse...

\`\`\`
                root
                 |
             X=1 (LEFT)
                 |
             Y=5  ✓ first solution
                 |
            X≠1 (RIGHT, D(X)={2,3,4,5})
                /     \\
             X=2     X≠2 (D(X)={3,4,5})
             |        ...
             Y=4 ✓
\`\`\`

Tree is **strictly binary** — every internal node has 2 children.

## Difference

- **d-way** produces a tree with branching factor = domain size at each level.
- **2-way** always branches into 2: LEFT commits to a value, RIGHT excludes it.
- For this constraint ($X + Y = 6$), FC immediately makes $Y$ a singleton after each $X$ decision, so the actual *number of solutions found* is identical and the *cost per solution* is similar.
- 2-way wins on harder problems because the RIGHT branch propagates immediately via AC: removing one value from $D(X)$ may eliminate values from $D(Y)$ that no longer have support.

**Counts:** d-way: 5 LEFTs × 2 nodes = 10 nodes for all solutions. 2-way: tree depth $2 \\cdot 5 = 10$ nodes for all solutions. Same total — but 2-way's structure is more amenable to learning (nogoods carry across LEFT/RIGHT).`,
      tags: ['2-way', 'd-way', 'branching'],
    },

    {
      id: 'es-gac-vs-pairwise',
      difficulty: 'intermediate', marks: 8,
      question: `CSP: variables $X_1, X_2, X_3$, each with domain $\\{a, b\\}$. Constraint: $\\text{AllDifferent}(X_1, X_2, X_3)$.

**(i) [3 marks]** Show that decomposing into pairwise $\\ne$ constraints leaves all domains unchanged after AC-3.

**(ii) [5 marks]** Show that GAC (Régin's algorithm) detects infeasibility immediately. Explain in terms of bipartite matching.`,
      answer: `## (i) Pairwise — 3 marks

Decompose AllDifferent into $X_1 \\ne X_2$, $X_1 \\ne X_3$, $X_2 \\ne X_3$ (six directed arcs).

REVISE $(X_1, X_2)$: for $v = a \\in D(X_1)$, is there $w \\in D(X_2)$ with $w \\ne v$? Yes, $w = b$. For $v = b$, $w = a$ works. **No prune.**

Same for all six arcs — pairwise inequality has support for every value (the other variable holds the opposite).

**Result.** All domains unchanged: $\\{a, b\\}, \\{a, b\\}, \\{a, b\\}$. AC-3 declares the CSP arc-consistent.

## (ii) GAC via Régin — 5 marks

Build the bipartite **variable-value graph**:

\`\`\`
   X1 ──── a       X2 ──── a       X3 ──── a
   │         │         │
   └─── b    └─── b    └─── b
\`\`\`

A satisfying assignment to AllDifferent is a **matching** that saturates the variable side: every $X_i$ matched to a distinct value.

**Maximum matching size: 2** — only two values ($a, b$) for three variables. By Hall's theorem, AllDifferent is feasible iff the maximum matching saturates the variable side; here it does not (matching size $2 < 3$ variables).

**GAC verdict.** AllDifferent is infeasible — fail at the root, no search needed.

**Why pairwise misses it.** Pairwise constraints only check **pairs** of variables; the pigeonhole obstacle is over **triples** (3 variables, 2 values). No pair is independently violated — yet the whole is infeasible.

**Lesson.** Pairwise $\\ne$ is propagation-equivalent to AllDifferent only when no global pigeonhole pressure exists. Always use the global constraint when available.`,
      tags: ['GAC', 'AllDifferent', 'matching'],
    },
  ],

  'backtracking': [
    {
      id: 'es-mrv-degree-lcv',
      difficulty: 'intermediate', marks: 10,
      question: `CSP: $X_1, X_2, X_3, X_4 \\in \\{1, 2, 3\\}$, constraints:

- $X_1 = X_2$
- $X_1 \\ne X_3$
- $X_1 \\ne X_4$
- $X_2 \\ne X_3$

After running NC and AC-3 to fixpoint, domains are $D(X_1) = D(X_2) = \\{1, 2, 3\\}$, $D(X_3) = D(X_4) = \\{1, 2, 3\\}$.

Which variable does **MRV** pick first? Which does **degree** ordering pick? What does **MRV + degree as tie-breaker** pick? Justify each.`,
      answer: `**MRV** (minimum remaining values) — picks the variable with the smallest current domain. All four variables have $|D| = 3$, so **all are tied**. MRV alone picks one arbitrarily (typically lexicographic: $X_1$).

**Degree** — picks the variable with the most constraints to *unassigned* variables. Count constraints per variable:

| Variable | Constraints to others |
|---|---|
| $X_1$ | $X_1 = X_2, X_1 \\ne X_3, X_1 \\ne X_4$ — 3 |
| $X_2$ | $X_1 = X_2, X_2 \\ne X_3$ — 2 |
| $X_3$ | $X_1 \\ne X_3, X_2 \\ne X_3$ — 2 |
| $X_4$ | $X_1 \\ne X_4$ — 1 |

Degree pick: **$X_1$** (most constrained, fail-first via most propagation).

**MRV + degree tie-break** — MRV ties all four; degree tie-break picks **$X_1$**.

**Why this matters.** Picking $X_1$ first triggers maximum propagation: assigning $X_1 = v$ forces $X_2 = v$ (via $X_1 = X_2$), then removes $v$ from $D(X_3)$ and $D(X_4)$. After one decision, three of four variables are fully or partially determined.

Picking $X_4$ first (degree 1) wastes effort — assigning $X_4 = v$ only removes $v$ from $D(X_1)$, no cascade.`,
      tags: ['MRV', 'degree', 'LCV', 'heuristics'],
    },

    {
      id: 'es-lcv-explained',
      difficulty: 'basic', marks: 6,
      question: `Define the **LCV (Least Constraining Value)** heuristic. Give a concrete example where LCV finds a solution without backtracking but the "first value" heuristic does not.`,
      answer: `## LCV definition — 2 marks

For the current decision variable $X$, choose the value $v \\in D(X)$ that **rules out the fewest values** in the unassigned neighbours' domains. Equivalently, the value that maximises the sum $\\sum_{X_j \\text{ neighbour}} |\\{w \\in D(X_j) : (v, w) \\text{ consistent}\\}|$.

## Example — 4 marks

CSP: $X_1, X_2 \\in \\{1, 2, 3\\}$, $X_3 \\in \\{2, 3\\}$. Constraint: $X_1 \\ne X_2$, $X_1 \\ne X_3$.

Variable order: $X_1, X_2, X_3$.

**First-value heuristic ($X_1 = 1$):**
- $X_1 = 1$. FC: prune 1 from $D(X_2)$ → $\\{2, 3\\}$, prune nothing from $D(X_3) = \\{2, 3\\}$ (1 not in it).
- $X_2 = 2$ (first). FC: no effect on $X_3$.
- $X_3 = 2$ (first). Conflict (no $X_1 \\ne X_3$ violated since $X_1 = 1 \\ne 2$). ✓

Actually first-value here works too. Let me construct a case where it fails:

CSP: $X_1, X_2 \\in \\{1, 2\\}$, $X_3 \\in \\{1\\}$ (singleton). Constraints: $X_1 \\ne X_3$, $X_2 \\ne X_3$.

After NC + AC: $D(X_1) = \\{2\\}$, $D(X_2) = \\{2\\}$, $D(X_3) = \\{1\\}$ (AC propagates the $X_3 = 1$ singleton).

Trivial — only one solution.

**Where LCV truly matters** — large CSPs with multiple solutions. LCV picks values that *leave more flexibility downstream*, so the first leaf reached is usually a solution. If LCV picks $X_1 = 3$ (rules out 0 values in $D(X_2) = \\{1, 2\\}$ vs first-value $X_1 = 1$ which rules out 1 value), LCV reaches a leaf in 3 decisions; first-value reaches in 3 decisions plus possibly one backtrack.

**Caveat.** LCV is value-side fail-LAST; combined with MRV's variable-side fail-FIRST. The intuition: fail-first on variables, succeed-first on values.`,
      tags: ['LCV', 'heuristic'],
    },
  ],

  'cp-modelling': [
    {
      id: 'es-cp-implied-constraint',
      difficulty: 'intermediate', marks: 8,
      question: `Consider a scheduling CSP: 3 jobs $J_1, J_2, J_3$ each take a distinct day from $\\{1, 2, 3, 4\\}$, with $J_1 < J_2$ and $J_2 < J_3$ (ordering constraints).

**(i) [4 marks]** Identify two **implied constraints** that are logically entailed by the model. Show why each is entailed.

**(ii) [4 marks]** Argue whether each implied constraint *improves propagation*. Use FC or AC reasoning.`,
      answer: `## (i) Implied constraints — 4 marks

**Implied 1: $J_1 < J_3$.** Entailed because $J_1 < J_2 < J_3 \\Rightarrow J_1 < J_3$ by transitivity. The original model already implies this; adding it as an explicit constraint cannot lose solutions.

**Implied 2: $J_1 \\le 2$.** Entailed because $J_1 < J_2 < J_3$ requires at least 2 days above $J_1$, and the max day is 4, so $J_1 \\le 4 - 2 = 2$. Similarly $J_3 \\ge 3$.

(We could also add $J_2 = 2$ or $J_2 = 3$ — the two middle days — but only one of these is correct for any given solution, not both, so it's *not* entailed.)

## (ii) Propagation gain — 4 marks

**$J_1 < J_3$.** With pairwise $J_1 < J_2$ and $J_2 < J_3$, AC-3 propagation requires *two* arc revisions to propagate from $J_1$ to $J_3$ (first $(J_1, J_2)$, then $(J_2, J_3)$). With the explicit $(J_1, J_3)$ constraint, AC-3 prunes $D(J_3)$ directly when $D(J_1)$ shrinks. **Speeds up propagation** — fewer arc revisions.

**$J_1 \\le 2$.** This is a *unary* constraint. NC removes 3, 4 from $D(J_1)$ in one pass. Without it, NC does nothing (no other unary constraints), and the 3 and 4 values for $J_1$ are only pruned by AC propagation, which takes longer. **Strictly stronger pruning** — NC has zero cost and removes infeasible values immediately.

**Modeller's lesson.** Always add implied unary constraints when easy to derive — they let NC do work that would otherwise fall to AC.`,
      tags: ['implied constraint', 'propagation'],
    },
  ],

  'minimax': [
    {
      id: 'es-mm-1', difficulty: 'intermediate', marks: 10,
      question: `Trace minimax on the following game tree. MAX at root; depth 3 (MAX-MIN-MAX-leaves). Branching factor 2. Leaves left-to-right: 4, 6, 1, 9, 2, 7, 8, 3.

Show backed-up values at every internal node.`,
      answer: `**Tree:**

\`\`\`
                MAX
             /       \\
          MIN         MIN
          / \\         / \\
        MAX MAX     MAX  MAX
        / \\ / \\    / \\  / \\
        4 6 1 9   2 7  8 3
\`\`\`

**Compute bottom MAX nodes** (depth 2):
- MAX(4, 6) = 6
- MAX(1, 9) = 9
- MAX(2, 7) = 7
- MAX(8, 3) = 8

**Compute MIN nodes** (depth 1):
- MIN(6, 9) = 6
- MIN(7, 8) = 7

**Root MAX:** MAX(6, 7) = **7**.

**Optimal move from root:** go right (value 7). Under optimal play: root → right → MIN picks left (value 7) → bottom MAX picks right (value 7). Leaf reached: 7 (second from right).`,
    },
  ],

  'alpha-beta': [
    {
      id: 'es-ab-1', difficulty: 'advanced', marks: 12,
      question: `Apply **alpha-beta pruning** (left-to-right) to the previous game tree (leaves 4, 6, 1, 9, 2, 7, 8, 3). Which leaves are NOT examined? Show $\\alpha, \\beta$ at each internal node visited.`,
      answer: `**Initial call:** root with $\\alpha = -\\infty, \\beta = +\\infty$.

**Left MIN subtree** ($\\alpha = -\\infty, \\beta = +\\infty$):
  - **Left MAX** (leaves 4, 6) with $\\alpha = -\\infty, \\beta = +\\infty$:
    - Leaf 4: $v = 4$, $\\alpha = \\max(-\\infty, 4) = 4$. $4 \\ge \\beta = +\\infty$? No.
    - Leaf 6: $v = 6$, $\\alpha = 6$.
    - Returns 6.
  - Back at MIN: $v = 6$, $\\beta = \\min(+\\infty, 6) = 6$. $6 \\le \\alpha = -\\infty$? No.
  - **Right MAX** (leaves 1, 9) with $\\alpha = -\\infty, \\beta = 6$:
    - Leaf 1: $v = 1$, $\\alpha = 1$. $1 \\ge 6$? No.
    - Leaf 9: $v = \\max(1, 9) = 9$, $\\alpha = 9$. **$9 \\ge \\beta = 6$ → β-cut!** No more children to examine here (already evaluated both). MAX returns at least 9.
  - Back at MIN: $v = \\min(6, 9) = 6$. (MIN ignores the higher 9.)
  - Returns 6.

**Back at root:** $v = 6, \\alpha = 6$.

**Right MIN subtree** ($\\alpha = 6, \\beta = +\\infty$):
  - **Left MAX** (leaves 2, 7) with $\\alpha = 6, \\beta = +\\infty$:
    - Leaf 2: $v = 2$, $\\alpha = 6$ (unchanged).
    - Leaf 7: $v = 7$, $\\alpha = 7$. $7 \\ge +\\infty$? No.
    - Returns 7.
  - Back at MIN: $v = 7$, $\\beta = 7$. **$7 \\le \\alpha = 6$?** No, $7 > 6$.
  - **Right MAX** (leaves 8, 3) with $\\alpha = 6, \\beta = 7$:
    - Leaf 8: $v = 8$, $\\alpha = 8$. **$8 \\ge \\beta = 7$ → β-cut!** Leaf 3 **not examined**.
    - MAX returns ≥ 8.
  - Back at MIN: $v = \\min(7, 8) = 7$. (MIN ignores 8.)
  - Returns 7.

**Root MAX:** $v = \\max(6, 7) = 7$. ✓ (Same as plain minimax.)

---

**Leaves not examined: leaf 3** (the very rightmost).

**Pruning count: 1 cut** (β-cut at right-MIN's right-MAX), saving 1 leaf.

**Note:** the left subtree's β-cut at leaf 9 didn't actually save anything (no further children to skip at that MAX node). Pruning effectiveness depends on having children left to skip when the cut fires.`,
    },
  ],

  'dpll': [
    {
      id: 'es-dpll-1', difficulty: 'advanced', marks: 10,
      question: `Trace DPLL on the CNF: $(x_1 \\vee x_2 \\vee \\lnot x_3) \\wedge (\\lnot x_1 \\vee x_2) \\wedge (\\lnot x_2 \\vee x_3) \\wedge (\\lnot x_1 \\vee \\lnot x_3) \\wedge (x_1)$. Show every unit propagation, pure literal, and decision step.`,
      answer: `**Clauses:**
- $C_1 = \\{x_1, x_2, \\lnot x_3\\}$
- $C_2 = \\{\\lnot x_1, x_2\\}$
- $C_3 = \\{\\lnot x_2, x_3\\}$
- $C_4 = \\{\\lnot x_1, \\lnot x_3\\}$
- $C_5 = \\{x_1\\}$ — already unit

**Step 1: Unit propagation.** $C_5$ unit → $x_1 = T$.

After: $C_1 = T$ (sat), $C_2 = \\{x_2\\}$ (¬x_1 falsified → only $x_2$ left), $C_3$ unchanged, $C_4 = \\{\\lnot x_3\\}$.

**Step 2: Unit propagation.** $C_2 = \\{x_2\\}$ unit → $x_2 = T$. $C_4 = \\{\\lnot x_3\\}$ unit → $x_3 = F$.

After: $C_3 = \\{\\lnot T, x_3\\} = \\{x_3\\}$ — wait, $x_2 = T$ makes $\\lnot x_2 = F$; clause has $\\lnot x_2$ false, so $C_3 = \\{x_3\\}$ as unit.

**Step 3: Unit propagation.** $C_3 = \\{x_3\\}$ unit → $x_3 = T$.

But wait — we already set $x_3 = F$ from $C_4$ in step 2. Conflict.

Let me redo more carefully — DPLL fully propagates one unit at a time.

---

**Restart trace.**

**Initial:** all clauses, no assignment.

**Unit propagation pass:**
- $C_5 = \\{x_1\\}$ is unit. Set $x_1 = T$.
- Simplify: $C_1 \\to T$ (drop), $C_2 = \\{x_2\\}$ (drop $\\lnot x_1 = F$), $C_3$ unchanged, $C_4 = \\{\\lnot x_3\\}$, $C_5$ drop.

Now active: $\\{x_2\\}, \\{\\lnot x_2, x_3\\}, \\{\\lnot x_3\\}$.

- $\\{x_2\\}$ unit → $x_2 = T$.
- Simplify: $\\{\\lnot T, x_3\\} = \\{x_3\\}$ (drop $\\lnot x_2 = F$), $\\{\\lnot x_3\\}$ unchanged.

Now active: $\\{x_3\\}, \\{\\lnot x_3\\}$.

- $\\{x_3\\}$ unit → $x_3 = T$.
- Simplify: $\\{\\lnot T\\} = \\{\\}$ — **empty clause derived**.

**Conflict at root.** DPLL returns **UNSAT**.

(Pure literal didn't fire because no monosigned variable appeared.)

---

**Verification by exhaustion:** $x_1 = T$ forced by $C_5$. Then $C_4 = \\{\\lnot T, \\lnot x_3\\} = \\{\\lnot x_3\\}$ forces $x_3 = F$. Then $C_3 = \\{\\lnot x_2, F\\} = \\{\\lnot x_2\\}$ forces $x_2 = F$. Then $C_2 = \\{F, F\\} = \\{\\}$ — conflict.

So the clauses are indeed unsatisfiable. DPLL discovered this purely via unit propagation, **no branching needed**.`,
    },
  ],

  'cdcl': [
    {
      id: 'es-cdcl-1', difficulty: 'advanced', marks: 14,
      question: `Apply CDCL to the CNF: $\\{\\lnot x_1, x_2\\}, \\{\\lnot x_1, x_3\\}, \\{\\lnot x_2, \\lnot x_3, x_4\\}, \\{\\lnot x_4, x_5\\}, \\{\\lnot x_4, \\lnot x_5\\}$. Decision: $x_1 = T$ at level 1.

(i) Build the implication graph after unit propagation.
(ii) Identify the 1-UIP.
(iii) Derive the learnt clause via resolution from the conflict.
(iv) State the backjump level.`,
      answer: `## (i) Implication graph

**Decision:** $x_1 = T$ at level 1.

**Unit propagation:**
- $\\{\\lnot x_1, x_2\\}$ unit → $x_2 = T$ (L1, ant. $\\{\\lnot x_1, x_2\\}$).
- $\\{\\lnot x_1, x_3\\}$ unit → $x_3 = T$ (L1, ant. $\\{\\lnot x_1, x_3\\}$).
- $\\{\\lnot x_2, \\lnot x_3, x_4\\}$: $x_2, x_3 = T$ → unit on $x_4$. $x_4 = T$ (L1, ant. $\\{\\lnot x_2, \\lnot x_3, x_4\\}$).
- $\\{\\lnot x_4, x_5\\}$: $x_4 = T$ → unit on $x_5$. $x_5 = T$ (L1, ant. $\\{\\lnot x_4, x_5\\}$).
- $\\{\\lnot x_4, \\lnot x_5\\}$: $x_4 = T, x_5 = T$ → all literals false. **Conflict.**

**Graph:**
\`\`\`
x_1=T (decision, L1)
  ↘ via {¬x_1, x_2}              ↘ via {¬x_1, x_3}
  x_2=T (L1)                       x_3=T (L1)
              ↘    ↙ via {¬x_2, ¬x_3, x_4}
                x_4=T (L1)
                  ↓ via {¬x_4, x_5}
                x_5=T (L1)
                  ↓ {¬x_4, ¬x_5} ← CONFLICT
\`\`\`

## (ii) 1-UIP

A UIP is a node at the current decision level that every path from the decision to the conflict passes through.

- $x_1$: every path goes through it — UIP.
- $x_2$: path through $x_1 \\to x_3$ bypasses it — not a UIP.
- $x_3$: similarly bypassable — not a UIP.
- $x_4$: every path converges at $x_4$ — UIP. **Closer to conflict than $x_1$**.
- $x_5$: every path goes through it (only one path to conflict from here) — UIP, but **$x_4$ is closer**.

Wait — checking $x_5$: actually it dominates the conflict (every path from decision to conflict goes through it). And it's even closer than $x_4$ to the conflict.

**1-UIP** = UIP closest to conflict = $x_5$.

Actually let me recheck: $x_5$ has only ONE incoming edge (from $x_4$). The conflict is between $x_4$ and $x_5$ both being true. The conflict clause is $\\{\\lnot x_4, \\lnot x_5\\}$. Both $x_4$ and $x_5$ contribute literals to the conflict. So both are "on" the conflict.

Standard UIP definition: a UIP is a node on the current decision level such that every path from the decision to the **conflicting variable** passes through it. The conflicting variable is the one being assigned twice (or the variable in the empty clause). Here both $x_4$ and $x_5$ literals are in the falsified clause.

By convention 1-UIP analysis proceeds: start with the conflict clause $\\{\\lnot x_4, \\lnot x_5\\}$. Both literals at L1. Resolve with the antecedent of the *latest* propagated variable at L1.

## (iii) Resolution derivation

**Conflict clause:** $\\{\\lnot x_4, \\lnot x_5\\}$.

Latest L1 propagation: $x_5$. Its antecedent: $\\{\\lnot x_4, x_5\\}$.

**Resolve on $x_5$:** $\\{\\lnot x_4, \\lnot x_5\\}$ ∪ $\\{\\lnot x_4, x_5\\}$ minus $\\{x_5, \\lnot x_5\\}$ = $\\{\\lnot x_4\\}$.

Now this clause has 1 literal at L1 → 1-UIP reached. **1-UIP = $x_4$**.

**Learnt clause:** $\\{\\lnot x_4\\}$.

## (iv) Backjump level

Levels in learnt clause: just $x_4$ at L1. Second-highest decision level = **L0** (since there's only one level represented).

Backjump to L0. The learnt clause $\\{\\lnot x_4\\}$ is now unit at L0 — forces $x_4 = F$ permanently.

**Continuing the search:** at L0 with $x_4 = F$ added, simplify all clauses. $\\{\\lnot x_2, \\lnot x_3, x_4\\}$ becomes $\\{\\lnot x_2, \\lnot x_3\\}$. Then if $x_1 = T$ is tried again at L1, propagation forces $x_2, x_3 = T$ → $\\{\\lnot x_2, \\lnot x_3\\}$ becomes empty → conflict. Another learnt clause emerges, etc. Eventually CDCL learns enough to force $x_1 = F$ at L0.`,
    },
  ],

  'walksat': [
    {
      id: 'es-w-1', difficulty: 'intermediate', marks: 8,
      question: `For CNF $\\{(x_1 \\vee x_2), (\\lnot x_1 \\vee x_3), (\\lnot x_2 \\vee \\lnot x_3)\\}$ with initial assignment $x_1 = T, x_2 = T, x_3 = T$ and noise $p = 0$ (pure greedy):

(i) Which clauses are unsatisfied?
(ii) Trace 3 steps of WALKSAT.`,
      answer: `## (i) Unsatisfied clauses

- $(x_1 \\vee x_2) = T \\vee T = T$ ✓
- $(\\lnot x_1 \\vee x_3) = F \\vee T = T$ ✓
- $(\\lnot x_2 \\vee \\lnot x_3) = F \\vee F = F$ ✗

**Unsatisfied: $\\{(\\lnot x_2 \\vee \\lnot x_3)\\}$** (1 clause).

## (ii) Trace 3 steps with $p = 0$

**Step 1.** Pick a random unsatisfied clause — only one option: $(\\lnot x_2 \\vee \\lnot x_3)$.

Variables in this clause: $x_2, x_3$.

Compute **break-count** for each flip (number of currently-satisfied clauses that flipping would falsify):

- **Flip $x_2$** (T→F):
  - $(x_1 \\vee x_2) = T \\vee F = T$ ✓ (still sat)
  - $(\\lnot x_1 \\vee x_3) = T$ (unchanged) ✓
  - $(\\lnot x_2 \\vee \\lnot x_3) = T \\vee F = T$ ✓ (now sat)
  - **break-count: 0**

- **Flip $x_3$** (T→F):
  - $(x_1 \\vee x_2) = T$ ✓
  - $(\\lnot x_1 \\vee x_3) = F \\vee F = F$ ✗ (**broken!**)
  - $(\\lnot x_2 \\vee \\lnot x_3) = F \\vee T = T$ ✓ (now sat)
  - **break-count: 1**

Pick the variable with minimum break-count: **flip $x_2$**.

New assignment: $x_1 = T, x_2 = F, x_3 = T$. **All clauses satisfied. ✓ SAT found.**

**Step 2, 3: not needed — solved in 1 flip.**

---

**With $p = 1$ (pure random walk):** would flip $x_2$ or $x_3$ uniformly at random. 50% chance of solving in 1 step.

**With $p = 0.5$:** 50% chance of greedy (instant solve), 50% chance of random (50% solve, 50% wrong flip). Expected steps: ~1.5.`,
    },
  ],

  'inference-rules': [
    {
      id: 'es-res-1', difficulty: 'intermediate', marks: 10,
      question: `KB = $\\{P \\vee Q, \\lnot P \\vee R, \\lnot Q \\vee R, \\lnot R\\}$. Use **resolution refutation** to prove KB is unsatisfiable. Show every step.`,
      answer: `**Clauses (already in CNF):**
- $C_1 = \\{P, Q\\}$
- $C_2 = \\{\\lnot P, R\\}$
- $C_3 = \\{\\lnot Q, R\\}$
- $C_4 = \\{\\lnot R\\}$

**Goal:** derive the empty clause $\\square$.

---

**Resolution step 1.** Resolve $C_2$ and $C_4$ on $R$:

$\\{\\lnot P, R\\} \\bowtie_R \\{\\lnot R\\} = \\{\\lnot P\\}$. Call this $C_5$.

**Step 2.** Resolve $C_3$ and $C_4$ on $R$:

$\\{\\lnot Q, R\\} \\bowtie_R \\{\\lnot R\\} = \\{\\lnot Q\\}$. Call this $C_6$.

**Step 3.** Resolve $C_1$ and $C_5$ on $P$:

$\\{P, Q\\} \\bowtie_P \\{\\lnot P\\} = \\{Q\\}$. Call this $C_7$.

**Step 4.** Resolve $C_7$ and $C_6$ on $Q$:

$\\{Q\\} \\bowtie_Q \\{\\lnot Q\\} = \\{\\}$ — **empty clause** $\\square$.

---

**Conclusion.** Empty clause derived → KB is **unsatisfiable**.

**Equivalently** by deduction theorem: KB unsatisfiable means there exists no model where all four sentences hold simultaneously. (Intuitively: $P \\vee Q$ says one of them holds; both imply $R$; but $\\lnot R$ — contradiction.)`,
    },
    {
      id: 'es-res-2', difficulty: 'advanced', marks: 12,
      question: `Use resolution to prove $\\{(A \\Rightarrow B), (B \\Rightarrow C), A\\} \\models C$. Show CNF conversion AND resolution refutation.`,
      answer: `**Setup.** To prove KB $\\models C$, refute $KB \\cup \\{\\lnot C\\}$.

**CNF conversion:**
- $A \\Rightarrow B \\equiv \\lnot A \\vee B$ → $\\{\\lnot A, B\\}$.
- $B \\Rightarrow C \\equiv \\lnot B \\vee C$ → $\\{\\lnot B, C\\}$.
- $A$ → $\\{A\\}$.
- $\\lnot C$ → $\\{\\lnot C\\}$ (negated query).

**Clauses:**
- $C_1 = \\{\\lnot A, B\\}$
- $C_2 = \\{\\lnot B, C\\}$
- $C_3 = \\{A\\}$
- $C_4 = \\{\\lnot C\\}$

---

**Resolution:**

**Step 1.** $C_1 \\bowtie_A C_3 = \\{B\\}$. Call $C_5$.

**Step 2.** $C_5 \\bowtie_B C_2 = \\{C\\}$. Call $C_6$.

**Step 3.** $C_6 \\bowtie_C C_4 = \\{\\}$ — **empty clause**. ✓

---

**Conclusion.** $KB \\cup \\{\\lnot C\\}$ is UNSAT → KB $\\models C$.

**Alternative shorter proof:**
1. $C_2 \\bowtie_C C_4 = \\{\\lnot B\\}$.
2. $C_1 \\bowtie_B \\{\\lnot B\\} = \\{\\lnot A\\}$.
3. $C_3 \\bowtie_A \\{\\lnot A\\} = \\square$.

Both valid — exam mark scheme accepts any correct refutation.`,
    },
  ],

  'horn-chaining': [
    {
      id: 'es-fc-horn-1', difficulty: 'intermediate', marks: 8,
      question: `Horn KB:
- Facts: $P, Q$
- Rules: $P \\wedge Q \\Rightarrow R$; $R \\Rightarrow S$; $S \\wedge P \\Rightarrow T$; $Q \\wedge R \\Rightarrow U$

(i) Trace **forward chaining** from facts to determine which propositions are entailed.
(ii) Trace **backward chaining** to prove $T$.`,
      answer: `## (i) Forward chaining

Known := $\\{P, Q\\}$.

**Iter 1:** rule $P \\wedge Q \\Rightarrow R$ fires (both premises known). Add $R$. Known := $\\{P, Q, R\\}$.

**Iter 2:** rule $R \\Rightarrow S$ fires. Add $S$. Known := $\\{P, Q, R, S\\}$.

**Iter 2 (cont.):** rule $Q \\wedge R \\Rightarrow U$ fires. Add $U$. Known := $\\{P, Q, R, S, U\\}$.

**Iter 3:** rule $S \\wedge P \\Rightarrow T$ fires. Add $T$. Known := $\\{P, Q, R, S, T, U\\}$.

**Iter 4:** no rule fires (everything provable is known). **Terminate.**

**Entailed:** $\\{P, Q, R, S, T, U\\}$ — all 6 propositions.

## (ii) Backward chaining: prove $T$

**Goal $T$.** Rules with head $T$: $S \\wedge P \\Rightarrow T$. Subgoals: $S, P$.

  **Subgoal $S$.** Rules with head $S$: $R \\Rightarrow S$. Subgoal: $R$.

    **Subgoal $R$.** Rules with head $R$: $P \\wedge Q \\Rightarrow R$. Subgoals: $P, Q$.

      **Subgoal $P$.** Fact $\\to$ ✓.
      **Subgoal $Q$.** Fact $\\to$ ✓.

    $R$ proved ✓.

  $S$ proved ✓.

  **Subgoal $P$.** Already a fact (could also be cached). ✓.

$T$ proved ✓.

**Comparison:**
- Forward chaining derives every entailed fact (5 derivations).
- Backward chaining proves only what's needed for $T$ (4 derivations: $R, S, P, Q$ as facts).
- For a single-goal query, backward chaining is often more efficient.`,
    },
  ],

  // ───────────────────────────────────────────────────────────────────
  //   NEW WORKED EXAMPLES — covering specific exam phrasings
  // ───────────────────────────────────────────────────────────────────

  'uninformed-search': [
    {
      id: 'es-ids-cycle-prev',
      difficulty: 'intermediate', marks: 12,
      question: `**Iterative Deepening Search with cycle prevention.**

Apply IDS to a state-space search problem from A to H with the following state graph (8 states, undirected edges with given costs, plus per-state heuristic in brackets):

\`\`\`
A(5) ─3─ B(6) ─2─ D(4) ─4─ E(4) ─1─ F(5) ─3─ G(2) ─2─ H(0)
A(5) ─3─ C(8) ─3─ F(5)
                        E(4) ─2─ G(2)
\`\`\`

(So edges are: A-B(3), A-C(3), B-D(2), C-F(3), D-E(4), E-F(1), E-G(2), F-G(3), G-H(2). All bidirectional.)

In addition to the standard IDS algorithm, assume that when a node $n$ is expanded, if a child $c$ contains a state that is an **ancestor** of $n$, then $c$ is NOT added to the frontier. (Cycles prevented by ancestor check.)

Find a path from A to H with the smallest number of steps.`,
      answer: `**IDS recap.** Repeated DFS with increasing depth limit: 0, 1, 2, ...

The cycle-prevention rule means we never re-add a state that's already on the current path (in the DFS ancestor chain).

### Depth limit 0
Frontier = $\\{A\\}$. A is not goal. Cutoff. No solution.

### Depth limit 1
Expand A (depth 0). Children at depth 1: B, C. Neither is H. Cutoff.

### Depth limit 2
Expand A → B, C (depth 1).
- B (depth 1): expand → A (ancestor, skip), D (depth 2). D ≠ H. Cutoff.
- C (depth 1): expand → A (ancestor, skip), F (depth 2). F ≠ H. Cutoff.

No solution at depth 2.

### Depth limit 3
Expand A → B, C (depth 1).
- B → A (skip), D (depth 2): expand → B (ancestor, skip), E (depth 3). E ≠ H. Cutoff.
- C → A (skip), F (depth 2): expand → C (ancestor, skip), E (depth 3), G (depth 3). G ≠ H, E ≠ H. Cutoff.

No solution at depth 3.

### Depth limit 4
- B → D → E (depth 3): expand → D (skip), F (depth 4), G (depth 4). G ≠ H, F ≠ H. Cutoff.
- C → F (depth 2) → E (depth 3): expand → F (skip), D (depth 4), G (depth 4). G ≠ H, D ≠ H. Cutoff.
- C → F → G (depth 3): expand → F (skip), E (depth 4), H (depth 4). **H found!** ✓

**Path:** A → C → F → G → H. Length 4 steps. Cost (if asked): 3 + 3 + 3 + 2 = 11.

### Note on cycle prevention
At every expansion, we check whether each child is already an ancestor (i.e., already on the DFS path from root). For example, when expanding B at depth 1, child A is an ancestor — skip. When expanding D at depth 2, child B is an ancestor — skip.

This avoids infinite loops (e.g. A → B → A → B → ...) without the memory cost of full graph search.`,
      tags: ['IDS', 'iterative deepening', 'cycle prevention'],
    },
  ],

  'informed-search': [
    {
      id: 'es-weighted-astar',
      difficulty: 'advanced', marks: 12,
      question: `**Weighted A* (graph search).** Same graph and heuristic as the IDS question above (h(A)=5, h(B)=6, h(C)=8, h(D)=4, h(E)=4, h(F)=5, h(G)=2, h(H)=0).

Apply the **graph-search version of Weighted A***, weight $w = 2$. That is, evaluate nodes by $f(n) = g(n) + w \\cdot h(n) = g(n) + 2 h(n)$.

Does it produce the globally optimal solution (cost 11)?`,
      answer: `**Weighted A* graph search** maintains an explored set and a frontier of $f$-priority nodes.

### Trace

| Step | Pop | $g$ | $h$ | $f = g + 2h$ | Children expanded | Frontier after |
|---|---|---|---|---|---|---|
| 0 | — | — | — | — | A added with $f = 0 + 10 = 10$ | A:10 |
| 1 | A (f=10) | 0 | 5 | 10 | B (g=3, f=3+12=15), C (g=3, f=3+16=19) | B:15, C:19 |
| 2 | B (f=15) | 3 | 6 | 15 | D (g=5, f=5+8=13). A is closed, skip. | D:13, C:19 |
| 3 | D (f=13) | 5 | 4 | 13 | E (g=9, f=9+8=17). B is closed. | E:17, C:19 |
| 4 | E (f=17) | 9 | 4 | 17 | F (g=10, f=10+10=20), G (g=11, f=11+4=15). D closed. | G:15, F:20, C:19 |
| 5 | G (f=15) | 11 | 2 | 15 | H (g=13, f=13+0=13). E, F (closed/explored). | H:13, F:20, C:19 |
| 6 | H (f=13) | 13 | 0 | 13 | **GOAL** | — |

**Path found:** A → B → D → E → G → H. **Cost = 3 + 2 + 4 + 2 + 2 = 13.**

### Optimality check

The globally optimal path is A → C → F → G → H = 3 + 3 + 3 + 2 = **11**. Weighted A* found cost 13 — **not optimal**.

### Why

Weighted A* with $w > 1$ **inflates the heuristic**, making it potentially **inadmissible** even if the original $h$ is admissible. The heuristic for A is $h(A) = 5$; the true cheapest path is 11, so $h^*(A) = 11$. The original $h$ satisfies $h \\le h^*$ (admissible). But $w \\cdot h(A) = 10$ also $\\le h^*(A) = 11$ — still admissible at A!

The problem is at intermediate nodes. For C: $h(C) = 8$, $h^*(C) = $ remaining cost to H via C-F-G-H = $3+3+2 = 8$. So $w \\cdot h(C) = 16 > h^*(C) = 8$ — **inadmissible at C**.

Weighted A* deprioritised C (f=19 vs B's 15) early on; by the time C was the cheapest unexpanded node, the search had committed to a worse path.

### Trade-off
Weighted A* trades optimality for speed: fewer expansions, returns a solution within a factor $w$ of optimal ($\\le 13 = w \\cdot 11 / w + $ some slack). On large maps it's much faster than A*, just not exact.`,
      tags: ['weighted A*', 'graph search', 'inadmissibility'],
    },
    {
      id: 'es-greedy-tree-vs-graph',
      difficulty: 'intermediate', marks: 8,
      question: `**Greedy best-first search bug.**

A student is applying **greedy best-first tree search** to find the fastest cycling route from A to H using straight-line distance to H as heuristic. They wrote:
\`\`\`
START: A (7.21)
Exp A: B (5), F (7.28)                            Visited: A
Exp B: C (4.12), D (2.24), E (2.24), F (7.28)     Visited: A, B
Exp D: H (0), C (4.12), E (2.24), F (7.28)        Visited: A, B, D
Exp H: SUCCESS!
\`\`\`

Identify the mistake and explain how to correct it.`,
      answer: `## The mistake

The student is doing **tree search** (no explored/visited set should affect frontier admission) but **maintains a "Visited" list AND appears to be ignoring re-adds**. The confusion is:

1. **Tree search does NOT check the visited set when adding successors** — so when expanding A, both B and F should be added.
2. **The student also has a tree-search bug**: when expanding B, they add C, D, E, F — but A is a neighbour of B too. In **tree search**, A SHOULD be re-added (with a new path A→B→A). Greedy will then never expand A because its f-value (5 for itself, but at depth 2 it's still 5) doesn't improve; but it's still on the frontier.

More likely, the student is implicitly doing **graph search** (skipping visited) but calling it "tree search". The naming is confused.

### Correct approach

**Tree search (literal):** add ALL successors regardless of visited.

**Graph search:** maintain an explored set; on expansion, skip any successor already in explored.

Greedy best-first graph search picks the frontier node with the **smallest $h$**:

| Step | Pop | $h$ | Successors NOT explored | Frontier after |
|---|---|---|---|---|
| 0 | — | — | A added | A(7.21) |
| 1 | A (7.21) | 7.21 | B (5), F (7.28). Explored = {A} | B(5), F(7.28) |
| 2 | B (5) | 5 | C (4.12), D (2.24), E (2.24). Explored = {A, B} | D(2.24), E(2.24), C(4.12), F(7.28) |
| 3 | D (2.24, tie-break alpha) | 2.24 | C (4.12) already in frontier; H (0). Explored = {A, B, D} | H(0), E(2.24), C(4.12), F(7.28) |
| 4 | H (0) | 0 | **GOAL** | — |

**Path:** A → B → D → H. Cost = 12 + 14 + 13 = 39.

### Key correction

The student's trace is mostly right — the real "mistake" depends on the question's intent. If the question genuinely asks for **tree search**, the trace should NOT maintain a Visited set; if **graph search**, the trace IS using graph search (and that's fine but mislabelled).

The fundamental confusion: **"greedy best-first tree search" should not have a Visited set**. If the student called it "tree search" but used Visited, they actually did **graph search** — and that's correct but mislabelled.

### Also: greedy is NOT OPTIMAL

The path found (A→B→D→H) has cost 39. The optimal cost is A→B→C→D→H = 12+10+8+13 = 43? Or maybe A→F→G→E→H = 9+7+5+11 = 32. Greedy picks based on **h alone**, ignoring path cost — never guaranteed optimal.`,
      tags: ['greedy best-first', 'tree vs graph search'],
    },
    {
      id: 'es-manhattan-admissible',
      difficulty: 'basic', marks: 5,
      question: `For the cycling-graph problem, the heuristic $h(P) = \\sqrt{(x_P - x_H)^2 + (y_P - y_H)^2}$ (straight-line distance) is admissible. Consider switching to **Manhattan distance** $h_M(P) = |x_P - x_H| + |y_P - y_H|$.

Is $h_M$ admissible for this problem? Justify numerically.`,
      answer: `## Admissibility test

A heuristic is **admissible** iff $h(n) \\le h^*(n)$ for every $n$, where $h^*(n)$ is the TRUE remaining cost.

For graph search where edge costs are physical distances or times (not coordinate differences), Manhattan distance can OVER-estimate.

### Example

Suppose we have nodes at $(0, 0)$ (A) and $(3, 4)$ (H), with a direct edge of cost 5 (the Euclidean distance).
- Straight-line $h(A) = \\sqrt{9 + 16} = 5$. Equal to actual edge cost; admissible.
- Manhattan $h_M(A) = |0 - 3| + |0 - 4| = 7$. Greater than actual cost 5 — **NOT admissible**.

For the cycling graph specifically, let's check at, say, node E at $(4, 3)$ vs H at $(6, 4)$:
- True remaining cost via E → H = 11 (direct edge).
- Straight-line $h(E) = \\sqrt{(6-4)^2 + (4-3)^2} = \\sqrt{5} \\approx 2.24$. Less than 11 ✓.
- Manhattan $h_M(E) = |6 - 4| + |4 - 3| = 3$. Less than 11 ✓.

At G at $(2, 4)$ vs H at $(6, 4)$:
- Edge G→E→H = 5 + 11 = 16; direct edge G doesn't exist to H. Via F or via E.
- Straight-line $h(G) = \\sqrt{(6-2)^2 + 0} = 4$. Less than 16 ✓.
- Manhattan $h_M(G) = |6 - 2| + 0 = 4$. Equal ✓.

### General principle for this problem

The edge weights are CYCLING TIMES in minutes — NOT direct functions of coordinates. So even though Manhattan/Euclidean are about coordinates, they could still over- or under-estimate cycling times.

**Counter-example for Manhattan admissibility**: pick any node where the direct cycling time is less than the Manhattan distance to H. E.g. if A at $(0, 0)$ → H at $(6, 4)$ has Manhattan = 10, but A→F→G→E→H = 9+7+5+11 = 32, then Manhattan 10 ≤ 32 — ok. But if there's a fast direct edge somewhere with cost < Manhattan, Manhattan fails.

**Looking at edge A-B: cost 12, but Manhattan distance is $|0-2|+|0-1| = 3$**. So Manhattan UNDERESTIMATES this edge — admissible direction ✓.

In fact for this problem, since cycling times are typically MORE than crow-flies coordinate distances, **Manhattan is likely admissible**. Verify: for every node $n$ to H, find the cheapest cycling path; check Manhattan ≤ that path cost. If yes for all 8 nodes, admissible.

### Calibrated answer

For the specific cycling graph: Manhattan $h_M$ IS admissible because cycling times exceed crow-flies coordinate distances. **However**, the answer must verify NUMERICALLY for each node — show $h_M(n) \\le $ true cheapest cycling path for each $n$.`,
      tags: ['admissibility', 'Manhattan distance', 'heuristic'],
    },
  ],

  'local-search': [
    {
      id: 'es-hc-vertex-cover',
      difficulty: 'advanced', marks: 14,
      question: `**Hill climbing for minimum vertex cover.**

Streets are edges; junctions are vertices. A first-aider at a junction can see along every street meeting that junction. Goal: choose the minimum-size SET of vertices so every edge has at least one endpoint chosen.

Apply hill climbing with:
- Initial state: empty set $\\emptyset$.
- Move: add OR remove one vertex from the set. Both moves available at every step.
- Objective: $f = 10c - b$, where $c$ = number of covered edges, $b$ = number of vertices in the set. Maximise.
- Tie-break: choose vertex earlier in the alphabet.

Run hill climbing until no move improves the objective.

Use this graph: 5 vertices A, B, C, D, E with edges: A-B, A-C, B-C, B-D, C-E.`,
      answer: `## Setup
$|E| = 5$ edges. At every step we evaluate $f = 10c - b$ for each of the $2 \\times 5 = 10$ possible moves.

### Initial state
Set $= \\emptyset$. $c = 0$, $b = 0$. $f = 0$.

### Step 1
Try adding each vertex:
- Add A: covers edges {A-B, A-C} ⇒ $c = 2$, $b = 1$, $f = 19$.
- Add B: covers {A-B, B-C, B-D} ⇒ $c = 3$, $b = 1$, $f = 29$.
- Add C: covers {A-C, B-C, C-E} ⇒ $c = 3$, $b = 1$, $f = 29$.
- Add D: covers {B-D} ⇒ $c = 1$, $b = 1$, $f = 9$.
- Add E: covers {C-E} ⇒ $c = 1$, $b = 1$, $f = 9$.
- Remove anything: nothing to remove.

Best improvement: B or C with $f = 29$. Tie — choose B (earlier alphabetically). Set $= \\{B\\}$.

### Step 2
Currently $c = 3$, $b = 1$, $f = 29$.
- Add A: now covers {A-B, B-C, B-D, A-C} ⇒ $c = 4$, $b = 2$, $f = 38$.
- Add C: covers {A-B, B-C, B-D, A-C, C-E} ⇒ $c = 5$ (ALL), $b = 2$, $f = 48$.
- Add D: covers {A-B, B-C, B-D} (already covered) ⇒ $c = 3$, $b = 2$, $f = 28$. Worse.
- Add E: covers {A-B, B-C, B-D, C-E} ⇒ $c = 4$, $b = 2$, $f = 38$.
- Remove B: back to $\\emptyset$, $f = 0$. Worse.

Best: add C, $f = 48$. Set $= \\{B, C\\}$.

### Step 3
$c = 5$ (all covered), $b = 2$, $f = 48$.
- Add A: still $c = 5$, $b = 3$, $f = 47$. Worse.
- Add D, E: same, $f = 47$. Worse.
- Remove B: covers only {A-C, B-C, C-E} ⇒ $c = 3$, $b = 1$, $f = 29$. Worse.
- Remove C: covers only {A-B, B-C, B-D} ⇒ $c = 3$, $b = 1$, $f = 29$. Worse.

**No improving move.** Hill climbing terminates.

## Result
**Vertex cover: $\\{B, C\\}$**, size 2, all 5 edges covered. $f = 48$.

## Check optimality
Is $\\{B, C\\}$ a minimum vertex cover? Edges A-B, A-C, B-C, B-D, C-E. Every edge has either B or C as endpoint (check: A-B ✓ B, A-C ✓ C, B-C ✓ both, B-D ✓ B, C-E ✓ C). YES, 2 vertices is optimal (size-1 covers would miss at least 2 edges out of 5 from a single vertex).

Hill climbing was lucky here — initial-move choice happened to lead to the optimum. On adversarial graphs (e.g. complete bipartite $K_{n,n}$), HC can get stuck on suboptimal local maxima.`,
      tags: ['hill climbing', 'vertex cover', 'objective function'],
    },
  ],

  'dpll': [
    {
      id: 'es-dpll-aima-order',
      difficulty: 'advanced', marks: 15,
      question: `**DPLL with AIMA ordering.**

Apply DPLL to:
$$(\\neg A \\lor B) \\land (B \\lor C) \\land (A \\lor E) \\land (\\neg B \\lor D) \\land (\\neg D \\lor \\neg E) \\land (C \\lor D)$$

Use AIMA Figure 7.17 rule ordering: **pure literal rule FIRST, then unit propagation, then decide**. When deciding, assign variables in alphabetical order, set True first.

Show the formula after each rule application.`,
      answer: `## Pass 1

**Initial:** $(\\neg A \\lor B) \\land (B \\lor C) \\land (A \\lor E) \\land (\\neg B \\lor D) \\land (\\neg D \\lor \\neg E) \\land (C \\lor D)$

**Pure literal scan.**
- $A$: appears as $\\neg A$ in clause 1, $A$ in clause 3 → both polarities. Not pure.
- $B$: appears positively in 1, 2; negatively in 4 → both. Not pure.
- $C$: positively in 2, 6. Negatively? No. **C is pure positive.** Assign $C = T$.

After $C = T$: clauses 2 $(B \\lor T)$ and 6 $(T \\lor D)$ are satisfied — remove them.

**Remaining:** $(\\neg A \\lor B) \\land (A \\lor E) \\land (\\neg B \\lor D) \\land (\\neg D \\lor \\neg E)$

## Pass 2

**Pure literal scan.**
- $A$: $\\neg A, A$. Not pure.
- $B$: $B, \\neg B$. Not pure.
- $D$: $D$ (clause 3), $\\neg D$ (clause 4). Not pure.
- $E$: $E$ (clause 2), $\\neg E$ (clause 4). Not pure.

No pure literals. **Unit propagation.** Are there any unit clauses? No (smallest is 2 literals). No UP.

**Decide.** Alphabetically: try $A = T$ first.

## Pass 3 (after $A = T$)

Substitute $A = T$:
- $(\\neg T \\lor B) = (B)$ — unit clause.
- $(T \\lor E)$ — satisfied, remove.

**Remaining:** $(B) \\land (\\neg B \\lor D) \\land (\\neg D \\lor \\neg E)$

**UP** on $(B)$: $B = T$.
- $(\\neg B \\lor D) = (D)$ — unit.

**Remaining:** $(D) \\land (\\neg D \\lor \\neg E)$

UP on $(D)$: $D = T$.
- $(\\neg D \\lor \\neg E) = (\\neg E)$ — unit.

**Remaining:** $(\\neg E)$

UP on $(\\neg E)$: $E = F$.

**All clauses satisfied.** ✓

## Final model
$A = T, B = T, C = T, D = T, E = F$.

## Verify
- $(\\neg A \\lor B) = (F \\lor T) = T$ ✓
- $(B \\lor C) = (T \\lor T) = T$ ✓
- $(A \\lor E) = (T \\lor F) = T$ ✓
- $(\\neg B \\lor D) = (F \\lor T) = T$ ✓
- $(\\neg D \\lor \\neg E) = (F \\lor T) = T$ ✓
- $(C \\lor D) = (T \\lor T) = T$ ✓

SAT, no backtracking required.`,
      tags: ['DPLL', 'AIMA ordering', 'pure literal', 'unit propagation'],
    },
  ],

  'walksat': [
    {
      id: 'es-walksat-greedy',
      difficulty: 'intermediate', marks: 12,
      question: `**WalkSAT with $p = 0$ (purely greedy).**

Apply WalkSAT to:
$$(\\neg A \\lor B) \\land (B \\lor C) \\land (A \\lor E) \\land (\\neg B \\lor D) \\land (\\neg D \\lor \\neg E) \\land (C \\lor D)$$

Begin with all variables set to False. For tie-breaks, use the leftmost clause and the leftmost literal. For each step, show clearly:
- the satisfied and unsatisfied clauses
- the choice of clause
- the choice of literal

Run until SAT or 5 iterations, whichever first.`,
      answer: `Initial: $A = F, B = F, C = F, D = F, E = F$.

### Iteration 1
**Clause evaluation:**
- $(\\neg A \\lor B) = (T \\lor F) = T$ ✓
- $(B \\lor C) = F$ ✗
- $(A \\lor E) = F$ ✗
- $(\\neg B \\lor D) = T$ ✓
- $(\\neg D \\lor \\neg E) = T$ ✓
- $(C \\lor D) = F$ ✗

Unsat: $\\{(B \\lor C), (A \\lor E), (C \\lor D)\\}$. Choose **leftmost: $(B \\lor C)$**.

With $p = 0$: pick the literal in this clause whose flip MAXIMISES satisfied clauses.
- Flip B (B becomes T): re-check clauses 1, 2, 4: $(T \\lor T) = T$, $(T \\lor F) = T$ (was F!), $(F \\lor F) = F$ (was T!). Net: clause 2 now T (+1), clause 4 now F (−1). Net Δsat = 0.
- Flip C (C becomes T): clauses 2, 6: $(F \\lor T) = T$ (was F!), $(T \\lor F) = T$ (was F!). Net: +2.

Best: **flip C**. $C = T$.

### Iteration 2
**Re-evaluate:**
- $(B \\lor C) = T$ ✓
- $(A \\lor E) = F$ ✗
- $(C \\lor D) = T$ ✓ (others ✓)

Unsat: $\\{(A \\lor E)\\}$. Choose this clause.

Greedy flip:
- Flip A (A becomes T): $(\\neg A \\lor B) = (F \\lor F) = F$ (was T!). $(A \\lor E) = T$ (was F!). Net: 0.
- Flip E (E becomes T): $(A \\lor E) = T$ (was F!). $(\\neg D \\lor \\neg E) = (T \\lor F) = T$ (was T, still). Net: +1.

Best: **flip E**. $E = T$.

### Iteration 3
**Re-evaluate:**
- $(A \\lor E) = T$ ✓
- $(\\neg D \\lor \\neg E) = (T \\lor F) = T$ ✓ (since D = F)

All 6 clauses satisfied. **SAT.** ✓

## Final model
$A = F, B = F, C = T, D = F, E = T$.

## Verify
- $(\\neg A \\lor B) = (T \\lor F) = T$ ✓
- $(B \\lor C) = (F \\lor T) = T$ ✓
- $(A \\lor E) = (F \\lor T) = T$ ✓
- $(\\neg B \\lor D) = (T \\lor F) = T$ ✓
- $(\\neg D \\lor \\neg E) = (T \\lor F) = T$ ✓
- $(C \\lor D) = (T \\lor F) = T$ ✓

Found in **2 flips**. WalkSAT with $p = 0$ behaves like pure greedy local search — works well here because we never get stuck.`,
      tags: ['WalkSAT', 'p=0 greedy', 'local search SAT'],
    },
  ],

  'csp-inference-extras': [
    {
      id: 'es-ac4-with-assignment',
      difficulty: 'advanced', marks: 12,
      question: `**AC-4 after a variable assignment** (cargo-ship containers, from the AIPS sample).

Variables $x_1, x_2, x_3, x_4$ all with domain $\\{1, 2, 3, 4\\}$. Constraint $c(x_i, x_{i+1})$ = $\\{(1,1), (1,2), (2,2), (2,4), (3,3), (4,2), (4,4)\\}$ for each adjacent pair.

Assign $x_1 = 1$, then apply **AC-4** to establish arc consistency. Show counters and deletion queue $S$ at each step.`,
      answer: `## Setup

After $x_1 = 1$: $D(x_1) = \\{1\\}$, $D(x_2) = D(x_3) = D(x_4) = \\{1, 2, 3, 4\\}$.

### AC-4 initialisation

For every (variable, value, neighbour) triple, count supporters. Counter $\\text{count}[(x_i, v), x_j]$ = number of values in $D(x_j)$ that, paired with $v$ for $x_i$, satisfy $c$.

**Arc $(x_1, x_2)$, $x_1 = 1$:**
- Supports in $D(x_2)$: pairs $(1, w)$ in $c$ with $w \\in \\{1, 2, 3, 4\\}$. From the tuple list: $(1, 1)$ and $(1, 2)$ are allowed. Count = 2.

**Arc $(x_2, x_1)$:** For each $v \\in D(x_2)$, count supports in $D(x_1) = \\{1\\}$.
- $v = 1$: $(1, 1) \\in c$? c is between $x_1$ and $x_2$ with tuple $(x_1, x_2)$: $(1, 1) \\in c$ ✓. Count = 1.
- $v = 2$: $(1, 2) \\in c$ ✓. Count = 1.
- $v = 3$: $(1, 3) \\in c$? No. Count = 0. **Add $(x_2, 3)$ to $S$.**
- $v = 4$: $(1, 4) \\in c$? No. Count = 0. **Add $(x_2, 4)$ to $S$.**

**Arc $(x_2, x_3)$:** For each $v \\in D(x_2)$, count supports in $D(x_3) = \\{1, 2, 3, 4\\}$.
- $v = 1$: tuples $(1, w)$ in $c$ with $w \\in \\{1, 2, 3, 4\\}$. $(1,1), (1,2)$ → count = 2.
- $v = 2$: $(2, w)$: $(2,2), (2,4)$ → count = 2.
- $v = 3$: $(3, w)$: $(3,3)$ → count = 1.
- $v = 4$: $(4, w)$: $(4,2), (4,4)$ → count = 2.

(Similarly for arc $(x_3, x_2)$ — for each $v \\in D(x_3)$, count supports.)

By analogous computation arcs $(x_3, x_2), (x_3, x_4), (x_4, x_3)$ are initialised — all values supported initially since both $D(x_3)$ and $D(x_4)$ are full.

**Initial $S$:** $\\{(x_2, 3), (x_2, 4)\\}$. Initial domains after init: $D(x_1) = \\{1\\}$, $D(x_2) = \\{1, 2\\}$, $D(x_3) = \\{1, 2, 3, 4\\}$, $D(x_4) = \\{1, 2, 3, 4\\}$ (since $x_2 = 3, 4$ to be deleted).

### Process $S$

**Pop $(x_2, 3)$.** Remove $3$ from $D(x_2)$ (already done). For each constraint involving $x_2$, find supporters of values in OTHER variables whose support included $(x_2, 3)$:

- **Arc $(x_3, x_2)$:** for each $v \\in D(x_3)$ where $(v, 3)$ was a support, decrement count.
  - $v = 3$: $(3, 3) \\in c$ ✓. **Decrement $\\text{count}[(x_3, 3), x_2]$**. Was: how many supports for $(x_3 = 3)$ in $D(x_2) = \\{1, 2, 3, 4\\}$? Pairs $(w, 3) \\in c$ for $w \\in \\{1,2,3,4\\}$. Only $(3, 3)$. Count was 1; now 0. **Add $(x_3, 3)$ to $S$.**
- Other arcs not affected by $(x_2, 3)$.

**Pop $(x_2, 4)$.** Remove $4$ from $D(x_2)$ (already done). For each variable having $(x_2, 4)$ as a support:
- **Arc $(x_3, x_2)$:** for each $v \\in D(x_3)$ where $(v, 4)$ was a support:
  - $v = 2$: $(2, 4) \\in c$ ✓. Decrement $\\text{count}[(x_3, 2), x_2]$. Was: $(w, 4)$ supports for $x_3 = 2$ from $D(x_2)$: pairs $(2, w)$ in $c$ are $(2,2), (2,4)$. So count of $(x_3 = 2)$ in $D(x_2)$ was 2; now 1. Still > 0.
  - $v = 4$: $(4, 4) \\in c$ ✓. Decrement $\\text{count}[(x_3, 4), x_2]$. Was 2 ($(4,2)$ and $(4,4)$); now 1. Still > 0.

After these decrements: $\\text{count}[(x_3, 2), x_2] = 1, \\text{count}[(x_3, 4), x_2] = 1, \\text{count}[(x_3, 3), x_2] = 0$.

**Pop $(x_3, 3)$.** Remove $3$ from $D(x_3)$. For arcs involving $x_3$:
- **Arc $(x_4, x_3)$:** for each $v \\in D(x_4)$ where $(v, 3)$ supports: $v = 3 \\to (3, 3)$ supports. Decrement $\\text{count}[(x_4, 3), x_3]$ from 1 to 0. Add $(x_4, 3)$ to $S$.
- **Arc $(x_2, x_3)$:** for each $v \\in D(x_2)$ where $(v, 3)$ supports: $v = 1 \\to (1, 3)$? Not in $c$. $v = 2 \\to (2, 3)$? No. Nothing.

**Pop $(x_4, 3)$.** Remove $3$ from $D(x_4)$. Arc $(x_3, x_4)$ — $D(x_3)$ now $\\{1, 2, 4\\}$:
- For each $v \\in D(x_3)$ where $(v, 3)$ supports: $v = 3$ already gone.

$S$ now empty.

### Final state

- $D(x_1) = \\{1\\}, D(x_2) = \\{1, 2\\}, D(x_3) = \\{1, 2, 4\\}, D(x_4) = \\{1, 2, 4\\}$.
- All counters > 0 for surviving (variable, value) pairs.

**Arc-consistent.** Total counter updates traceable as above.`,
      tags: ['AC-4', 'cargo ship', 'counters', 'deletion queue S'],
    },
  ],
};
