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
  let openViz = $state<string | null>(null);
  let pendingProps = $state<Record<string, any>>({});

  // Editable extracted specs — initialised from the result; user can edit before opening a viz.
  let editedCspSpec = $state('');
  let editedCnf = $state('');
  let editedFormula = $state('');
  let editedHorn = $state('');
  let editedKB = $state('');
  let editedQuery = $state('');
  let editedLeaves = $state('');

  const result = $derived(question.trim().length > 5 ? routeQuestion(question) : null);

  // Sync editable specs whenever the extraction result changes
  $effect(() => {
    if (!result) return;
    editedCspSpec = result.extraction.cspLabSpec;
    editedCnf = result.extraction.cnfText;
    editedFormula = result.extraction.formula.formula;
    editedHorn = result.extraction.hornText;
    editedKB = result.extraction.resolution.kbClauses.join('\n');
    editedQuery = result.extraction.resolution.query ?? '';
    editedLeaves = result.extraction.leaves.leaves.join(', ');
  });

  function openExtracted(viz: string) {
    const props: Record<string, any> = {};
    if (viz === 'CSPLab' || viz === 'AC3' || viz === 'AC2001' || viz === 'AC4' || viz === 'ForwardCheck' || viz === 'ReginAllDiff') {
      props.initialSpec = editedCspSpec;
    }
    if (viz === 'DPLL' || viz === 'CDCL' || viz === 'WalkSAT' || viz === 'TwoSAT') {
      props.initialCNF = editedCnf;
    }
    if (viz === 'TruthTable' || viz === 'CNFEncoder' || viz === 'TseitinEncoder') {
      props.initialFormula = editedFormula;
    }
    if (viz === 'HornChain') {
      props.initialHorn = editedHorn;
    }
    if (viz === 'Resolution') {
      props.initialKB = editedKB;
      props.initialQuery = editedQuery;
    }
    if (viz === 'MinimaxTree') {
      props.initialLeaves = editedLeaves;
    }
    pendingProps = props;
    openViz = viz;
    // Scroll the embedded viz into view after the render flush
    setTimeout(() => {
      const el = document.getElementById('autofilled-viz');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

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
          {#if result.multipart.isMultipart}· <b>{result.multipart.parts.length}-part question</b>{/if}
        </div>
      </div>

      <!-- Multi-part question breakdown -->
      {#if result.multipart.isMultipart && result.perPartRoutes}
        <div class="card !p-4">
          <h3 class="!mt-0 text-base font-semibold mb-2">📑 Multi-part question — per-part routing</h3>
          <div class="text-xs text-ink-500 mb-3">Each sub-part is classified independently. Click a part to see its top match and template hits.</div>
          <div class="space-y-2">
            {#each result.perPartRoutes as p}
              <details class="border border-ink-200 dark:border-ink-800 rounded p-3">
                <summary class="cursor-pointer">
                  <b class="font-mono">{p.partId}</b>
                  <span class="text-xs text-ink-500 ml-2">→ {p.topAlgorithm ?? '(no clear match)'} ({p.confidence}%)</span>
                  {#if p.templates.length > 0}<span class="text-xs text-emerald-600 ml-2">· {p.templates.length} template{p.templates.length === 1 ? '' : 's'} matched</span>{/if}
                </summary>
                <div class="mt-2 text-xs text-ink-600 dark:text-ink-300 italic whitespace-pre-line">{p.partText.length > 400 ? p.partText.slice(0, 400) + '…' : p.partText}</div>
                {#if p.templates.length > 0}
                  <div class="mt-2 text-xs">
                    <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Template matches</div>
                    {#each p.templates as tm}
                      <div class="border-l-2 border-emerald-300 pl-2 my-1">
                        <b>{tm.description}</b> <span class="text-ink-500">({tm.confidence}%)</span> → <code>{tm.viz}</code>
                        <div class="text-ink-600 dark:text-ink-300">{tm.explanation}</div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </details>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Template shape matches -->
      {#if result.templates.length > 0}
        <div class="card !p-4 border-l-4 !border-emerald-400">
          <h3 class="!mt-0 text-base font-semibold mb-2">🎯 Question-shape templates matched ({result.templates.length})</h3>
          <div class="text-xs text-ink-500 mb-3">Beyond keyword matching — these are structural templates that recognise the SHAPE of the question.</div>
          <div class="space-y-2 text-sm">
            {#each result.templates as tm}
              <div class="flex items-start gap-2">
                <span class="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">{tm.confidence}%</span>
                <div class="flex-1">
                  <div><b>{tm.description}</b> → <code class="text-xs">{tm.viz}</code></div>
                  <div class="text-xs text-ink-600 dark:text-ink-300">{tm.explanation}</div>
                </div>
                <button class="btn btn-sm" onclick={() => openExtracted(tm.viz)}>▸ open</button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Auto-solved (independent verification) -->
      {#if result.autosolve.csp || result.autosolve.sat}
        <div class="card !p-4 border-l-4 !border-violet-400">
          <h3 class="!mt-0 text-base font-semibold mb-2">🤖 Auto-solver verdict</h3>
          <div class="text-xs text-ink-500 mb-3">I ran the extracted problem through an independent solver. Use this to cross-check your hand-computed answer.</div>
          {#if result.autosolve.csp}
            <div class="border border-ink-200 dark:border-ink-800 rounded p-2 text-sm mb-2">
              <b>CSP solver:</b>
              {#if result.autosolve.csp.solved}
                <span class="text-emerald-700 dark:text-emerald-300">✓ SAT</span> · nodes expanded: {result.autosolve.csp.nodesExpanded}
                {#if result.autosolve.csp.solutionCount !== undefined}· solutions found: {result.autosolve.csp.solutionCount}{#if (result.autosolve.csp.solutionCount ?? 0) >= 5}+ (capped){/if}{/if}
                <div class="font-mono text-xs mt-1">First solution: {Object.entries(result.autosolve.csp.assignment ?? {}).map(([k, v]) => `${k} = ${v}`).join(', ')}</div>
              {:else}
                <span class="text-rose-700 dark:text-rose-300">✗ {result.autosolve.csp.reason ?? 'no solution'}</span> · nodes: {result.autosolve.csp.nodesExpanded}
              {/if}
            </div>
          {/if}
          {#if result.autosolve.sat}
            <div class="border border-ink-200 dark:border-ink-800 rounded p-2 text-sm">
              <b>SAT solver (DPLL):</b>
              {#if result.autosolve.sat.sat}
                <span class="text-emerald-700 dark:text-emerald-300">✓ SAT</span> · decisions: {result.autosolve.sat.decisions}
                <div class="font-mono text-xs mt-1">Model: {Object.entries(result.autosolve.sat.model ?? {}).map(([k, v]) => `${k} = ${v ? 'T' : 'F'}`).join(', ')}</div>
              {:else}
                <span class="text-rose-700 dark:text-rose-300">✗ UNSAT</span> · decisions: {result.autosolve.sat.decisions}
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Similar past worked examples -->
      {#if result.similar.length > 0}
        <div class="card !p-4">
          <h3 class="!mt-0 text-base font-semibold mb-2">📚 Similar worked examples ({result.similar.length})</h3>
          <div class="text-xs text-ink-500 mb-3">These existing worked examples are textually closest to your question. Look at them for a model answer.</div>
          <div class="space-y-2">
            {#each result.similar as s}
              <a href={href('/topic/' + s.topicSlug)} class="block border border-ink-200 dark:border-ink-800 rounded p-2 hover:border-accent-400 no-underline">
                <div class="flex flex-wrap items-baseline gap-2">
                  <span class="text-xs px-1.5 py-0.5 rounded font-semibold bg-ink-100 dark:bg-ink-800">{s.topicTitle}</span>
                  <span class="text-xs text-ink-500">{s.difficulty}{s.marks ? ` · ${s.marks} marks` : ''} · relevance {s.score}</span>
                </div>
                <div class="text-sm mt-1 text-ink-700 dark:text-ink-200 line-clamp-2">{s.question.replace(/\$([^$]+)\$/g, '$1').slice(0, 250)}{s.question.length > 250 ? '…' : ''}</div>
                <div class="text-[11px] text-ink-500 italic mt-1 line-clamp-1">{s.answerExcerpt.replace(/\$([^$]+)\$/g, '$1').slice(0, 160)}…</div>
              </a>
            {/each}
          </div>
        </div>
      {/if}

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

      <!-- Structural extraction — rich -->
      {#if result.extraction.cspRich.totalConfidence > 20 || result.extraction.csp.confidence > 30 || result.extraction.cnf.confidence > 30 || result.extraction.formula.confidence > 30 || result.extraction.horn.confidence > 30 || result.extraction.leaves.confidence > 30}
        <div class="card !p-4">
          <h3 class="!mt-0 text-base font-semibold mb-1">🧬 Algorithm-specific rule extraction</h3>
          <div class="text-xs text-ink-500 mb-3">The router parsed structured rules out of the question text. Each block below is editable — fix anything that's wrong, then click "Open viz with these rules" to launch the visualiser pre-loaded.</div>

          {#if result.extraction.cspRich.totalConfidence > 20 || result.extraction.csp.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3 mb-2" open>
              <summary class="cursor-pointer text-sm font-semibold">
                CSP extraction
                <span class="text-xs font-normal text-ink-500 ml-2">
                  confidence {Math.max(result.extraction.cspRich.totalConfidence, result.extraction.csp.confidence)}% ·
                  {result.extraction.cspRich.variables.length || result.extraction.csp.variables.length} vars ·
                  {result.extraction.cspRich.constraints.length || (result.extraction.csp.unary.length + result.extraction.csp.binary.length)} constraints
                </span>
              </summary>
              <div class="mt-2 text-xs space-y-2">
                {#if result.extraction.cspRich.variables.length > 0}
                  <div>
                    <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Detected variables</div>
                    <ul class="font-mono">
                      {#each result.extraction.cspRich.variables as v}
                        <li>D({v.name}) = {'{' + v.domain.join(', ') + '}'} <span class="text-ink-500">— {v.source} ({v.confidence}%)</span></li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if result.extraction.cspRich.tasks.length > 0}
                  <div>
                    <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Detected tasks / durations</div>
                    <ul class="font-mono">
                      {#each result.extraction.cspRich.tasks as t}
                        <li>{t.id} → {t.varName}{t.duration !== undefined ? ` · duration ${t.duration}` : ''}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if result.extraction.cspRich.resources.length > 0}
                  <div>
                    <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Detected resources (mutex groups)</div>
                    <ul class="font-mono">
                      {#each result.extraction.cspRich.resources as r}
                        <li>{r.id}: pairwise mutex on {r.mutexTasks.join(', ')}</li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if result.extraction.cspRich.deadline !== undefined}
                  <div class="font-mono">Deadline: {result.extraction.cspRich.deadline}</div>
                {/if}
                {#if result.extraction.cspRich.constraints.length > 0}
                  <div>
                    <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Synthesised constraints</div>
                    <ul class="font-mono">
                      {#each result.extraction.cspRich.constraints as c}
                        <li>{c.src} <span class="text-ink-500">— {c.why} ({c.confidence}%)</span></li>
                      {/each}
                    </ul>
                  </div>
                {/if}
                {#if result.extraction.cspRich.notes.length > 0}
                  <details class="mt-2">
                    <summary class="cursor-pointer text-ink-500">▸ Extraction notes ({result.extraction.cspRich.notes.length})</summary>
                    <ul class="list-disc pl-5 text-ink-500 mt-1">{#each result.extraction.cspRich.notes as n}<li>{n}</li>{/each}</ul>
                  </details>
                {/if}
                <div>
                  <div class="text-ink-500 uppercase tracking-wider font-semibold mb-1">Editable CSPLab spec</div>
                  <textarea class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="10" bind:value={editedCspSpec}></textarea>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-primary" onclick={() => openExtracted('CSPLab')}>▸ Open CSPLab with these rules</button>
                    <button class="btn btn-sm" onclick={() => openExtracted('AC3')}>▸ Open AC-3 stepper</button>
                    <button class="btn btn-sm" onclick={() => openExtracted('AC2001')}>▸ Open AC-2001</button>
                    <button class="btn btn-sm" onclick={() => openExtracted('AC4')}>▸ Open AC-4</button>
                    <button class="btn btn-sm" onclick={() => openExtracted('ForwardCheck')}>▸ Open ForwardCheck</button>
                    <button class="btn btn-sm" onclick={() => openExtracted('ReginAllDiff')}>▸ Open Régin (AllDiff)</button>
                  </div>
                </div>
              </div>
            </details>
          {/if}

          {#if result.extraction.cnf.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3 mb-2" open>
              <summary class="cursor-pointer text-sm font-semibold">
                CNF extraction
                <span class="text-xs font-normal text-ink-500 ml-2">{result.extraction.cnf.clauses.length} clauses · {result.extraction.cnf.variables.length} vars · confidence {result.extraction.cnf.confidence}%</span>
              </summary>
              <div class="mt-2 text-xs">
                <textarea class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="4" bind:value={editedCnf}></textarea>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => openExtracted('DPLL')}>▸ Open DPLL</button>
                  <button class="btn btn-sm" onclick={() => openExtracted('CDCL')}>▸ Open CDCL</button>
                  <button class="btn btn-sm" onclick={() => openExtracted('WalkSAT')}>▸ Open WalkSAT</button>
                  <button class="btn btn-sm" onclick={() => openExtracted('TwoSAT')}>▸ Open 2-SAT (if 2-CNF)</button>
                </div>
              </div>
            </details>
          {/if}

          {#if result.extraction.formula.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3 mb-2">
              <summary class="cursor-pointer text-sm font-semibold">
                Propositional formula
                <span class="text-xs font-normal text-ink-500 ml-2">{result.extraction.formula.variables.length} vars · confidence {result.extraction.formula.confidence}%</span>
              </summary>
              <div class="mt-2 text-xs">
                <input class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={editedFormula} />
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => openExtracted('TruthTable')}>▸ Open Truth-table builder</button>
                  <button class="btn btn-sm" onclick={() => openExtracted('CNFEncoder')}>▸ Open CNF encoder</button>
                  <button class="btn btn-sm" onclick={() => openExtracted('TseitinEncoder')}>▸ Open Tseitin encoder</button>
                </div>
              </div>
            </details>
          {/if}

          {#if result.extraction.horn.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3 mb-2">
              <summary class="cursor-pointer text-sm font-semibold">
                Horn KB extraction
                <span class="text-xs font-normal text-ink-500 ml-2">{result.extraction.horn.facts.length} facts · {result.extraction.horn.rules.length} rules · goal: {result.extraction.horn.goal ?? '—'} · confidence {result.extraction.horn.confidence}%</span>
              </summary>
              <div class="mt-2 text-xs">
                <textarea class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={editedHorn}></textarea>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => openExtracted('HornChain')}>▸ Open Horn chaining</button>
                </div>
              </div>
            </details>
          {/if}

          {#if result.extraction.resolution.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3 mb-2">
              <summary class="cursor-pointer text-sm font-semibold">
                Resolution problem (KB + α)
                <span class="text-xs font-normal text-ink-500 ml-2">{result.extraction.resolution.kbClauses.length} KB clauses · α = {result.extraction.resolution.query ?? '—'} · confidence {result.extraction.resolution.confidence}%</span>
              </summary>
              <div class="mt-2 text-xs">
                <div class="font-mono mb-1">KB:</div>
                <textarea class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="4" bind:value={editedKB}></textarea>
                <div class="font-mono mt-2 mb-1">Query α:</div>
                <input class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={editedQuery} />
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => openExtracted('Resolution')}>▸ Open Resolution refutation</button>
                </div>
              </div>
            </details>
          {/if}

          {#if result.extraction.leaves.confidence > 30}
            <details class="border border-ink-200 dark:border-ink-800 rounded p-3" open>
              <summary class="cursor-pointer text-sm font-semibold">
                Game-tree leaves
                <span class="text-xs font-normal text-ink-500 ml-2">{result.extraction.leaves.leaves.length} leaves · branching {result.extraction.leaves.branchingFactor} · depth ≈ {result.extraction.leaves.depth} · confidence {result.extraction.leaves.confidence}%</span>
              </summary>
              <div class="mt-2 text-xs">
                <input class="w-full font-mono p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={editedLeaves} />
                <div class="mt-2 flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-primary" onclick={() => openExtracted('MinimaxTree')}>▸ Open Minimax tree</button>
                </div>
              </div>
            </details>
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
        <div id="autofilled-viz">
          <VizRenderer viz={openViz as any} title={top?.label ?? openViz} props={pendingProps} />
        </div>
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
