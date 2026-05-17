import type { Module } from '../types';

export const logicModule: Module = {
  id: 'logic',
  title: 'Module 4 · Propositional Logic',
  slug: 'logic',
  oneLiner: 'Syntax, semantics, entailment, resolution, Horn clauses.',
  topics: [
    {
      id: 'kb',
      slug: 'kb-agents',
      module: 'Module 4 · Logic',
      title: 'Knowledge-based agents',
      oneLiner: 'TELL / ASK and the role of inference.',
      sections: [
        {
          id: 'overview',
          title: 'TELL / ASK',
          blocks: [
            { kind: 'md', body: `A **knowledge-based agent** has a knowledge base (KB) of sentences in a formal language, and two operations:

- **TELL** — add a sentence to KB (e.g. a new percept).
- **ASK** — query KB for what follows.

The agent action loop, schematically:

\`\`\`
loop forever:
    TELL(KB, MakePerceptSentence(percept, t))
    action := ASK(KB, MakeActionQuery(t))
    TELL(KB, MakeActionSentence(action, t))
    return action
\`\`\`

This separates **knowledge** (what's in KB) from **inference** (how ASK answers queries).` },
          ],
        },
      ],
      flashcards: [
        { id: 'kb1', q: 'What do TELL and ASK do in a knowledge-based agent?', a: 'TELL adds a sentence to the KB; ASK queries what follows from the KB.' },
      ],
    },

    {
      id: 'syntax',
      slug: 'propositional-syntax',
      module: 'Module 4 · Logic',
      title: 'Propositional syntax & semantics',
      oneLiner: 'Atomic sentences, connectives, models, truth tables.',
      sections: [
        {
          id: 'syntax',
          title: 'Syntax',
          blocks: [
            { kind: 'md', body: `**Atomic sentences:** propositional symbols ($P, Q, R, \\ldots$) and the constants $\\top$ (true), $\\bot$ (false).

**Complex sentences** are built with connectives, in **decreasing precedence**:

| Connective | Name | Symbol |
|---|---|---|
| 1 | Not | $\\neg$ |
| 2 | And | $\\wedge$ |
| 3 | Or | $\\vee$ |
| 4 | Implies | $\\Rightarrow$ |
| 5 | Iff | $\\Leftrightarrow$ |

Grammar:

\`\`\`
Sentence       := AtomicSentence | ComplexSentence
ComplexSentence := ( Sentence )
                | ¬ Sentence
                | Sentence ∧ Sentence
                | Sentence ∨ Sentence
                | Sentence ⇒ Sentence
                | Sentence ⇔ Sentence
\`\`\`

Implication is **right-associative**: $A \\Rightarrow B \\Rightarrow C$ means $A \\Rightarrow (B \\Rightarrow C)$.` },
          ],
        },
        {
          id: 'semantics',
          title: 'Semantics',
          blocks: [
            { kind: 'md', body: `A **model** $m$ assigns true/false to every propositional symbol.

**Truth values** are computed from connectives by truth tables:

| $P$ | $Q$ | $\\neg P$ | $P \\wedge Q$ | $P \\vee Q$ | $P \\Rightarrow Q$ | $P \\Leftrightarrow Q$ |
|---|---|---|---|---|---|---|
| F | F | T | F | F | T | T |
| F | T | T | F | T | T | F |
| T | F | F | F | T | F | F |
| T | T | F | T | T | T | T |

**Key facts:**
- $P \\Rightarrow Q$ is true whenever $P$ is false (vacuous truth).
- "$m \\models \\alpha$" means "model $m$ satisfies $\\alpha$" (or "$m$ is a model of $\\alpha$").` },
            { kind: 'callout', variant: 'pitfall', title: 'Implication is not "if and only if"', body: '$P \\Rightarrow Q$ asserts only that *if* P is true, Q must be too. When P is false, the implication is automatically true. This trips people up daily.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: truth-table builder',
          blocks: [
            { kind: 'viz', viz: 'TruthTable', title: 'Build the truth table for any formula', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'sy1', q: 'Precedence order of connectives?', a: 'Not, and, or, implies, iff. (¬ binds tightest, ⇔ loosest.)' },
        { id: 'sy2', q: 'What does m ⊨ α mean?', a: '"Model m satisfies (is a model of) sentence α" — α is true under the truth assignment m.' },
      ],
    },

    {
      id: 'entailment',
      slug: 'entailment',
      module: 'Module 4 · Logic',
      title: 'Entailment & satisfiability',
      oneLiner: 'The two central semantic concepts; the link to SAT.',
      sections: [
        {
          id: 'def',
          title: 'Definitions',
          blocks: [
            { kind: 'md', body: `**Entailment:** $\\alpha \\models \\beta$ iff in every model where $\\alpha$ is true, $\\beta$ is also true. (Every model of $\\alpha$ is a model of $\\beta$.)

**Models of $\\alpha$:** $M(\\alpha) = \\{m : m \\models \\alpha\\}$. Then $\\alpha \\models \\beta$ iff $M(\\alpha) \\subseteq M(\\beta)$.

**Satisfiability:** $\\alpha$ is **satisfiable** iff some model satisfies it. Otherwise **unsatisfiable**.

**Validity:** $\\alpha$ is **valid** (a *tautology*) iff every model satisfies it.

**Equivalence:** $\\alpha \\equiv \\beta$ iff $\\alpha \\models \\beta$ and $\\beta \\models \\alpha$.` },
          ],
        },
        {
          id: 'sat-link',
          title: 'The link to SAT',
          blocks: [
            { kind: 'md', body: `**Crucial identity** (deduction theorem in propositional form):

$$\\text{KB} \\models \\alpha \\quad \\text{iff} \\quad \\text{KB} \\wedge \\neg \\alpha \\text{ is unsatisfiable.}$$

So any **entailment** problem reduces to an **unsatisfiability** problem. This is why SAT solvers are useful for reasoning: any "does KB prove $\\alpha$?" question becomes "is KB ∧ ¬α UNSAT?".` },
            { kind: 'callout', variant: 'keyfact', title: 'Memorise this', body: 'KB ⊨ α iff KB ∧ ¬α is unsatisfiable. The bridge between logical reasoning and SAT solving.' },
          ],
        },
        {
          id: 'model-checking',
          title: 'Model checking (truth-table enumeration)',
          blocks: [
            { kind: 'md', body: `Brute-force algorithm for entailment:

\`\`\`
function TT-ENTAILS(KB, alpha):
    symbols := propositional symbols in KB and alpha
    return TT-CHECK-ALL(KB, alpha, symbols, {})

function TT-CHECK-ALL(KB, alpha, symbols, model):
    if symbols is empty:
        if KB true in model: return alpha true in model
        else: return true   # vacuously
    P := first(symbols); rest := rest(symbols)
    return TT-CHECK-ALL(KB, alpha, rest, model ∪ {P=true})
       and TT-CHECK-ALL(KB, alpha, rest, model ∪ {P=false})
\`\`\`

**Sound and complete.** Exponential in number of symbols ($O(2^n)$). Used as a baseline; real reasoners use inference rules or SAT.` },
          ],
        },
      ],
      flashcards: [
        { id: 'en1', q: 'Define entailment.', a: 'α ⊨ β iff every model that satisfies α also satisfies β. Equivalently: M(α) ⊆ M(β).' },
        { id: 'en2', q: 'KB ⊨ α iff what is unsatisfiable?', a: 'KB ∧ ¬α. (Deduction theorem.)' },
        { id: 'en3', q: 'Difference between valid and satisfiable?', a: 'Satisfiable: some model makes it true. Valid: every model makes it true. Valid ⇒ satisfiable; not the reverse.' },
      ],
    },

    {
      id: 'inference',
      slug: 'inference-rules',
      module: 'Module 4 · Logic',
      title: 'Inference rules & resolution',
      oneLiner: 'From entailment by syntax. Resolution is refutation-complete.',
      sections: [
        {
          id: 'rules',
          title: 'Standard inference rules',
          blocks: [
            { kind: 'md', body: `Inference: derive new sentences from a KB using syntactic rules. Written $\\frac{\\text{premises}}{\\text{conclusion}}$.

| Rule | Form |
|---|---|
| Modus Ponens | $\\dfrac{\\alpha \\Rightarrow \\beta,\\; \\alpha}{\\beta}$ |
| And-Elimination | $\\dfrac{\\alpha_1 \\wedge \\cdots \\wedge \\alpha_n}{\\alpha_i}$ |
| And-Introduction | $\\dfrac{\\alpha_1, \\ldots, \\alpha_n}{\\alpha_1 \\wedge \\cdots \\wedge \\alpha_n}$ |
| Or-Introduction | $\\dfrac{\\alpha_i}{\\alpha_1 \\vee \\cdots \\vee \\alpha_n}$ |
| Double-Negation | $\\dfrac{\\neg\\neg\\alpha}{\\alpha}$ |
| Unit Resolution | $\\dfrac{\\alpha \\vee \\beta,\\; \\neg\\beta}{\\alpha}$ |
| **Resolution** | $\\dfrac{\\alpha_1 \\vee \\cdots \\vee \\alpha_k \\vee \\ell,\\;\\; \\beta_1 \\vee \\cdots \\vee \\beta_m \\vee \\neg\\ell}{\\alpha_1 \\vee \\cdots \\vee \\alpha_k \\vee \\beta_1 \\vee \\cdots \\vee \\beta_m}$ |

**Soundness:** every rule above only derives entailed sentences.

**Completeness:** an inference procedure is complete if it can derive every entailed sentence. **Resolution is refutation-complete** for propositional logic.` },
          ],
        },
        {
          id: 'cnf',
          title: 'Conjunctive Normal Form (CNF)',
          blocks: [
            { kind: 'md', body: `A formula is in **CNF** if it's a conjunction of clauses, each clause being a disjunction of literals:

$$(\\ell_{11} \\vee \\ell_{12} \\vee \\cdots) \\wedge (\\ell_{21} \\vee \\cdots) \\wedge \\cdots$$

**Every propositional formula** has an equivalent CNF. Standard conversion:

1. **Eliminate $\\Leftrightarrow$:** $A \\Leftrightarrow B \\;\\equiv\\; (A \\Rightarrow B) \\wedge (B \\Rightarrow A)$.
2. **Eliminate $\\Rightarrow$:** $A \\Rightarrow B \\;\\equiv\\; \\neg A \\vee B$.
3. **Push $\\neg$ inward** (De Morgan + double-negation):
   - $\\neg(A \\wedge B) \\;\\equiv\\; \\neg A \\vee \\neg B$
   - $\\neg(A \\vee B) \\;\\equiv\\; \\neg A \\wedge \\neg B$
   - $\\neg\\neg A \\;\\equiv\\; A$
4. **Distribute $\\vee$ over $\\wedge$:** $A \\vee (B \\wedge C) \\;\\equiv\\; (A \\vee B) \\wedge (A \\vee C)$.

Naive distribution can blow up exponentially; **Tseitin transformation** (out of scope here) gives a linear-size *equisatisfiable* CNF using auxiliary variables.` },
          ],
        },
        {
          id: 'resolution',
          title: 'Resolution refutation',
          blocks: [
            { kind: 'md', body: `**To prove $\\text{KB} \\models \\alpha$:**

1. Convert $\\text{KB} \\wedge \\neg \\alpha$ to CNF.
2. Apply the resolution rule repeatedly. If you derive the **empty clause** $\\square$, the formula is unsatisfiable, so $\\text{KB} \\models \\alpha$.
3. If no new clauses can be derived, $\\text{KB} \\not\\models \\alpha$.

The empty clause is unsatisfiable by definition (a disjunction of no literals).

**Resolution is refutation-complete:** if $\\text{KB} \\wedge \\neg \\alpha$ is unsatisfiable, resolution will eventually derive $\\square$. (Resolution is **not** complete for deriving arbitrary entailed clauses — only for refutation.)` },
            { kind: 'callout', variant: 'keyfact', title: 'Resolution is refutation-complete, not deduction-complete', body: 'It can always show unsatisfiability of an UNSAT formula, but can\'t always derive *every* entailed clause directly. The refutation route is the standard.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: resolution proof',
          blocks: [
            { kind: 'viz', viz: 'Resolution', title: 'Step through a resolution refutation', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'inf1', q: 'State the resolution rule.', a: 'From (α₁ ∨ … ∨ αₖ ∨ ℓ) and (β₁ ∨ … ∨ βₘ ∨ ¬ℓ) derive (α₁ ∨ … ∨ αₖ ∨ β₁ ∨ … ∨ βₘ).' },
        { id: 'inf2', q: 'Is resolution complete?', a: 'Refutation-complete only. To prove KB ⊨ α, refute KB ∧ ¬α by deriving the empty clause.' },
        { id: 'inf3', q: 'The four steps of converting to CNF?', a: '1. Eliminate ⇔. 2. Eliminate ⇒. 3. Push ¬ inward (De Morgan + double-negation). 4. Distribute ∨ over ∧.' },
      ],
      pitfalls: [
        'Resolution is refutation-complete, NOT deduction-complete. You must phrase queries as "is KB ∧ ¬α unsatisfiable?".',
        'Naive CNF conversion can be exponential; Tseitin gives linear equisatisfiable CNF if asked about scaling.',
      ],
    },

    {
      id: 'horn',
      slug: 'horn-chaining',
      module: 'Module 4 · Logic',
      title: 'Horn clauses & chaining',
      oneLiner: 'A restricted form where inference is linear-time.',
      sections: [
        {
          id: 'def',
          title: 'Horn clauses',
          blocks: [
            { kind: 'md', body: `A **Horn clause** is a disjunction of literals with **at most one positive literal**.

**Definite clause:** exactly one positive literal. Equivalent to an implication with conjoined premises:

$$(\\neg p_1 \\vee \\neg p_2 \\vee \\cdots \\vee \\neg p_k \\vee q) \\;\\equiv\\; (p_1 \\wedge p_2 \\wedge \\cdots \\wedge p_k) \\Rightarrow q$$

**Goal clause:** no positive literals. ($\\neg p_1 \\vee \\neg p_2 \\vee \\cdots$ = "$p_1 \\wedge \\cdots$ is impossible".)

**Fact:** a definite clause with no negative literals ($k = 0$): just $q$.

**Why Horn matters:** inference over Horn KBs is **linear time** (in the size of the KB). The basis of Prolog.` },
          ],
        },
        {
          id: 'fc',
          title: 'Forward chaining',
          blocks: [
            { kind: 'md', body: `Data-driven. Start from facts; fire any rule whose body is fully in KB; add its head; repeat to fixed point.

\`\`\`
function FORWARD-CHAIN(KB, q):
    count[c] := |premises of c| for each definite clause c
    inferred := {}
    agenda := all facts in KB
    while agenda not empty:
        p := pop(agenda)
        if p = q: return true
        if not inferred[p]:
            inferred[p] := true
            for each clause c with p in premises:
                count[c] -= 1
                if count[c] = 0: add head(c) to agenda
    return false
\`\`\`

**Sound and complete** for Horn KBs. Linear time and space.

**Use case:** production systems, expert systems where "what new facts can I derive?" is the question.` },
          ],
        },
        {
          id: 'bc',
          title: 'Backward chaining',
          blocks: [
            { kind: 'md', body: `Goal-directed. To prove $q$, find a rule with head $q$; recursively try to prove each premise.

Same completeness for Horn KBs. Linear in the worst case but can blow up on **cycles** unless tabled.

**Use case:** Prolog and most logic-programming languages. Better when the goal is specific and only a small fraction of facts is relevant.` },
            { kind: 'callout', variant: 'whatif', title: 'You forget tabling in backward chaining', body: 'Cycles in the rule graph make backward chaining recurse forever. Tabling (memoising goals) breaks the loop.' },
          ],
        },
        {
          id: 'viz',
          title: 'Interactive: forward chaining',
          blocks: [
            { kind: 'viz', viz: 'HornChain', title: 'Watch facts propagate through Horn rules', props: {} },
          ],
        },
      ],
      flashcards: [
        { id: 'h1', q: 'What is a Horn clause?', a: 'A disjunction of literals with at most one positive literal.' },
        { id: 'h2', q: 'Why are Horn clauses interesting?', a: 'Inference (forward or backward chaining) over Horn KBs is linear-time. Basis of Prolog.' },
        { id: 'h3', q: 'Definite clause vs goal clause?', a: 'Definite: exactly one positive literal (equivalent to p1 ∧ … ∧ pk ⇒ q). Goal: no positive literal.' },
        { id: 'h4', q: 'Forward vs backward chaining — when to use each?', a: 'Forward: data-driven, good for "what can I derive?". Backward: goal-directed, good for specific queries; risks looping on cycles.' },
      ],
    },
  ],
};
