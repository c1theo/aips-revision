<script lang="ts">
  import { routeQuestion } from '../solve';
  import { href } from '../router';
  import VizRenderer from '../components/VizRenderer.svelte';
  import Md from '../components/Md.svelte';

  const placeholder = `Paste your exam question here. Examples to try:

— "Enforce global node consistency on this CSP. Variables x1, x2, x3 with domain {1,2,3}, constraints x1<x2, x2<x3, x3>1, x1!=2"

— "Trace minimax with alpha-beta pruning. Depth 3, branching factor 2. Leaves: 4, 6, 1, 9, 2, 7, 8, 3"

— "Apply AC2001 to this CSP and record changes to the Last data structure"`;

  let question = $state('');
  let lastSolved = $state('');
  let openViz = $state<string | null>(null);

  const result = $derived(question.trim().length > 5 ? routeQuestion(question) : null);

  function tryExample(text: string) {
    question = text;
    openViz = null;
  }

  const examples = [
    {
      title: 'Small AC-3 CSP',
      text: `Suppose you have the following small CSP. Variables x1, x2, x3, each with domain {1, 2, 3}. Constraints x1 < x2, x2 < x3, x3 > 1, x1 != 2.

(i) Enforce global node consistency on this CSP. What are the resulting domains?
(ii) Enforce global arc consistency on this CSP (by any method). What are the resulting domains?
(iii) Find an order of arc revisions in which an arc needs to be revised more than once to establish global arc consistency.`,
    },
    {
      title: 'Sudoku sub-square (d-way BT vs MAC)',
      text: `Suppose we have a 3x3 sub-square of a Sudoku puzzle with four empty squares A, B, C, D. After applying node consistency the domains are: A in {1,2,4}, B in {2,4,7}, C in {2,4,7}, D in {1,2}. The variables are pairwise different.

Search for a solution using the d-way Backtrack algorithm with static variable order A, B, C, D and ascending value order. Then perform the search again with d-way Maintaining Arc Consistency (MAC). Compare.`,
    },
    {
      title: 'Factory scheduling (AC2001 + Last)',
      text: `Suppose you are scheduling a factory with four tasks. Tasks 1 and 2 require machine m1 and cannot run at the same time. Tasks 2, 3, 4 all require m2 and cannot pair-wise overlap. Tasks 1, 2 take 1 hour; tasks 3, 4 take 2 hours. All tasks finish within 4 hours.

Let s1, s2, s3, s4 be the start times. Variables s1, s2 have domain {1..4}; s3, s4 have domain {1..3}.

Write out the CSP. Apply AC2001 / AC-3.1 to establish global arc consistency. After each arc revision, record changes to the Last data structure.`,
    },
    {
      title: 'Minimax + alpha-beta',
      text: `Trace minimax with alpha-beta pruning on a game tree. MAX at root, depth 3 (MAX-MIN-MAX-leaves), branching factor 2. Leaves left-to-right: 4, 6, 1, 9, 2, 7, 8, 3. Show backed-up values and any pruned subtrees.`,
    },
    {
      title: 'DPLL on small CNF',
      text: `Trace DPLL on the CNF: (x1 ∨ x2 ∨ ¬x3) ∧ (¬x1 ∨ x3) ∧ (¬x2 ∨ x3) ∧ (¬x3). Show the decision stack and any unit propagation. Is it SAT or UNSAT?`,
    },
    {
      title: 'Resolution proof of KB ⊨ α',
      text: `Use resolution refutation to prove KB ⊨ α, where KB = {(p ∨ q), (¬p ∨ r), (¬q ∨ r)} and α = r.`,
    },
  ];

  function moduleColour(m: string) {
    if (m === 'csp') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';
    if (m === 'sat') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    if (m === 'logic') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
    if (m === 'adversarial') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
</script>

<article class="max-w-5xl">
  <h1>🎯 Question Router</h1>
  <p class="text-ink-600 dark:text-ink-300">Paste an exam question. The router classifies it without generative AI — using a curated lexicon, weighted regex patterns, TF-IDF-inspired rarity boosting, intent classification, and structural extraction. It tells you which algorithm to use, why, and (where possible) pre-fills the visualiser.</p>

  <div class="not-prose mt-6 space-y-3">
    <textarea
      class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900"
      rows="8"
      placeholder={placeholder}
      bind:value={question}
    ></textarea>

    <details class="text-xs">
      <summary class="cursor-pointer text-ink-500">▸ Try an example question</summary>
      <div class="grid sm:grid-cols-2 gap-2 mt-2">
        {#each examples as ex}
          <button class="text-left border border-ink-300 dark:border-ink-700 rounded p-2 hover:bg-accent-50 dark:hover:bg-accent-900/20" onclick={() => tryExample(ex.text)}>
            <div class="font-semibold">{ex.title}</div>
            <div class="text-ink-500 mt-1">{ex.text.slice(0, 110)}{ex.text.length > 110 ? '…' : ''}</div>
          </button>
        {/each}
      </div>
    </details>
  </div>

  {#if result}
    <div class="mt-8 space-y-5 not-prose">
      <!-- Recommendation header -->
      <div class="card !p-4 border-l-4 !border-accent-500">
        <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Recommendation</div>
        <div class="text-base mt-1"><Md src={result.recommendation} /></div>
        <div class="text-xs text-ink-500 mt-2">
          Confidence: <b>{result.confidence}%</b>
          {#if result.topIntent}· Intent: <span class="font-semibold">{result.topIntent}</span>{/if}
        </div>
      </div>

      <!-- Top algorithms -->
      <div class="card !p-4">
        <h3 class="!mt-0 text-base font-semibold mb-3">Top algorithm matches ({result.topAlgorithms.length})</h3>
        {#if result.topAlgorithms.length === 0}
          <div class="text-sm text-ink-500">No strong matches. Try a more specific question or use the All Visualisers page.</div>
        {:else}
          <div class="space-y-3">
            {#each result.topAlgorithms as a, i}
              <div class="border border-ink-200 dark:border-ink-800 rounded-lg p-3">
                <div class="flex flex-wrap items-baseline gap-2">
                  <span class="text-xs px-1.5 py-0.5 rounded font-semibold {moduleColour(a.module)}">{a.module}</span>
                  <span class="font-semibold">{a.label}</span>
                  <span class="text-xs text-ink-500">· score {a.score}</span>
                  {#if i === 0}<span class="text-xs px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 font-semibold">TOP MATCH</span>{/if}
                </div>
                <div class="text-sm text-ink-600 dark:text-ink-300 mt-1">{a.blurb}</div>
                <details class="text-xs mt-2">
                  <summary class="cursor-pointer text-ink-500">▸ Why? ({a.signals.length} signals)</summary>
                  <ul class="mt-2 space-y-0.5">
                    {#each a.signals.sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight)) as s}
                      <li class="flex gap-2">
                        <span class="font-mono w-12 shrink-0 {s.weight > 0 ? 'text-emerald-600' : 'text-rose-600'}">{s.weight > 0 ? '+' : ''}{s.weight}</span>
                        <span class="text-ink-600 dark:text-ink-300">{s.description}{s.matchedText ? ` — "${s.matchedText}"` : ''}</span>
                      </li>
                    {/each}
                  </ul>
                </details>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => (openViz = openViz === a.viz ? null : a.viz)}>
                    {openViz === a.viz ? '▾ Close' : '▸ Open this visualiser below'}
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Structural extraction -->
      {#if result.extraction.csp.confidence > 30 || result.extraction.cnf.confidence > 30 || result.extraction.leaves.confidence > 30}
        <div class="card !p-4">
          <h3 class="!mt-0 text-base font-semibold mb-2">🧬 Structured extraction</h3>
          <div class="text-xs text-ink-500 mb-3">The router parsed structured information out of the question. You can paste this directly into the matching visualiser, or open one below to autofill.</div>

          {#if result.extraction.csp.confidence > 30}
            <div class="mb-3">
              <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">CSP extraction (confidence {result.extraction.csp.confidence}%)</div>
              <div class="text-xs mt-1">
                Variables: <b>{result.extraction.csp.variables.length}</b> ·
                Unary constraints: <b>{result.extraction.csp.unary.length}</b> ·
                Binary constraints: <b>{result.extraction.csp.binary.length}</b>
                {#if result.extraction.csp.allDifferent}· AllDifferent({result.extraction.csp.allDifferent.vars.join(', ')}){/if}
              </div>
              {#if result.extraction.cspLabSpec}
                <pre class="text-xs font-mono bg-ink-50 dark:bg-ink-900 p-2 mt-2 rounded overflow-x-auto whitespace-pre">{result.extraction.cspLabSpec}</pre>
              {/if}
              {#if result.extraction.csp.warnings.length}
                <div class="text-xs text-amber-700 dark:text-amber-300 mt-1">⚠ {result.extraction.csp.warnings.join(' ')}</div>
              {/if}
            </div>
          {/if}

          {#if result.extraction.cnf.confidence > 30}
            <div class="mb-3">
              <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">CNF extraction (confidence {result.extraction.cnf.confidence}%)</div>
              <div class="text-xs mt-1">{result.extraction.cnf.clauses.length} clauses · {result.extraction.cnf.varCount} variables</div>
              <pre class="text-xs font-mono bg-ink-50 dark:bg-ink-900 p-2 mt-2 rounded overflow-x-auto">{result.extraction.cnf.clauses.map((c) => '(' + c + ')').join(' ∧ ')}</pre>
            </div>
          {/if}

          {#if result.extraction.leaves.confidence > 30}
            <div>
              <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold">Game-tree leaves (confidence {result.extraction.leaves.confidence}%)</div>
              <div class="text-xs mt-1">Leaves: {result.extraction.leaves.leaves.join(', ')} · branching {result.extraction.leaves.branchingFactor} · depth ≈ {result.extraction.leaves.depth}</div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Intent breakdown -->
      {#if result.intentScores.length > 0}
        <details class="card !p-3">
          <summary class="cursor-pointer text-sm font-semibold">Intent classifier breakdown</summary>
          <table class="text-xs mt-2 w-full">
            <thead><tr class="text-left text-ink-500"><th>Intent</th><th>Score</th><th>Signals</th></tr></thead>
            <tbody>
              {#each result.intentScores as s}
                <tr><td class="font-semibold py-1">{s.intent}</td><td class="font-mono">{s.score}</td><td class="text-ink-500 text-xs">{s.signals.map((g) => g.label).join('; ')}</td></tr>
              {/each}
            </tbody>
          </table>
        </details>
      {/if}

      <!-- Structural hints -->
      <details class="card !p-3">
        <summary class="cursor-pointer text-sm font-semibold">Structural hints (module-level features)</summary>
        <div class="text-xs mt-2 font-mono space-y-0.5">
          <div>CSP-like:        <b class={result.structure.cspLike ? 'text-emerald-600' : 'text-ink-400'}>{result.structure.cspLike}</b></div>
          <div>SAT-like:        <b class={result.structure.satLike ? 'text-emerald-600' : 'text-ink-400'}>{result.structure.satLike}</b></div>
          <div>Game-tree-like:  <b class={result.structure.gameLike ? 'text-emerald-600' : 'text-ink-400'}>{result.structure.gameLike}</b></div>
          <div>Logic-like:      <b class={result.structure.logicLike ? 'text-emerald-600' : 'text-ink-400'}>{result.structure.logicLike}</b></div>
          <div>Pathfinding-like:<b class={result.structure.searchLike ? 'text-emerald-600' : 'text-ink-400'}>{result.structure.searchLike}</b></div>
        </div>
      </details>

      <!-- Inline viz (autofilled where supported) -->
      {#if openViz}
        {@const top = result.topAlgorithms.find((a) => a.viz === openViz)}
        {@const props = (openViz === 'CSPLab' || openViz === 'AC3' || openViz === 'AC2001') && result.extraction.cspLabSpec ? { initialSpec: result.extraction.cspLabSpec } : {}}
        <VizRenderer viz={openViz as any} title={top?.label ?? openViz} {props} />
      {/if}

      <!-- Topic playbooks (fallback / supplement) -->
      {#if result.playbooks.length > 0}
        <div class="card !p-4">
          <h3 class="!mt-0 text-base font-semibold mb-1">📘 Topic playbooks {result.confidence < 40 ? '(fallback — algorithm match was weak)' : '(related)'}</h3>
          <div class="text-xs text-ink-500 mb-3">General rules for tackling questions of this kind. One per common question type.</div>
          <div class="space-y-3">
            {#each result.playbooks as pb}
              <details class="border border-ink-200 dark:border-ink-800 rounded-lg p-3">
                <summary class="cursor-pointer">
                  <span class="text-xs px-1.5 py-0.5 rounded font-semibold {moduleColour(pb.module)}">{pb.topic}</span>
                  <span class="font-semibold ml-2">{pb.subtask}</span>
                </summary>
                <div class="mt-3 text-sm space-y-3">
                  <div>
                    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">When this applies</div>
                    <ul class="list-disc pl-5">{#each pb.whenItApplies as w}<li>{w}</li>{/each}</ul>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">General procedure</div>
                    <ol class="list-decimal pl-5 space-y-1">{#each pb.steps as s, i}<li><Md src={s} /></li>{/each}</ol>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-rose-600 dark:text-rose-300 font-semibold mb-1">Common pitfalls</div>
                    <ul class="list-disc pl-5 space-y-0.5">{#each pb.pitfalls as p}<li class="text-rose-700 dark:text-rose-300"><Md src={p} /></li>{/each}</ul>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Suggested visualisers / topics</div>
                    <div class="flex flex-wrap gap-2">
                      {#each pb.pointers as ptr}
                        {#if ptr.kind === 'viz'}
                          <button class="chip hover:bg-accent-100 dark:hover:bg-accent-900/40" onclick={() => (openViz = ptr.key)}>{ptr.label}</button>
                        {:else if ptr.kind === 'topic'}
                          <a class="chip hover:bg-accent-100 dark:hover:bg-accent-900/40" href={href('/topic/' + ptr.key)}>{ptr.label}</a>
                        {:else}
                          <span class="chip">{ptr.label}</span>
                        {/if}
                      {/each}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-semibold mb-1">Exam answer skeleton — fill in the blanks</div>
                    <div class="border-l-4 border-emerald-300 dark:border-emerald-700 pl-3 prose prose-sm dark:prose-invert max-w-none">
                      <Md src={pb.answerTemplate} />
                    </div>
                  </div>
                </div>
              </details>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <h2>How it works</h2>
  <p>The router uses five complementary classifiers — none of them involve generative AI:</p>
  <ol>
    <li><b>Curated algorithm profiles</b> — each visualiser has a hand-tuned dictionary of strong, medium, weak, and anti-triggers, plus regex patterns weighted by specificity.</li>
    <li><b>TF-IDF-inspired rarity boosting</b> — terms unique to one algorithm (e.g. "Régin", "Tseitin", "1-UIP") are weighted up; terms shared across many (e.g. "trace", "compare") are weighted down.</li>
    <li><b>Structural feature detection</b> — global checks for CSP-shaped / SAT-shaped / game-tree-shaped / logic-shaped / search-shaped questions add module-level bias.</li>
    <li><b>Intent classifier</b> — separately scores TRACE / MODEL / COMPARE / ENFORCE / PROVE / SOLVE / ANALYZE / DEFINE / IDENTIFY using regex patterns over question verbs.</li>
    <li><b>Structured extraction</b> — regex + small grammar fragments pull out variables, domains, constraints, CNF clauses, and game-tree leaves so the viz can be auto-filled.</li>
  </ol>
  <p>Confidence is calibrated by the <i>margin</i> of the top match over the second match plus the absolute score. Every signal is logged and shown in the "Why?" expander — full interpretability.</p>
</article>
