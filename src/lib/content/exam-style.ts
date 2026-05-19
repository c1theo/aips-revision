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
};
