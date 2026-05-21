<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // CSP Modelling Wizard — a step-by-step interactive builder for formulating
  // a CSP from scratch. Walks the user through the 7-step methodology:
  //   1. Decisions → variables
  //   2. Domains
  //   3. Constraints (with source tagging)
  //   4. Arity / globals
  //   5. Implied constraints
  //   6. Symmetry breaking
  //   7. Sanity check
  //
  // Output: a complete model + an exam-paper-style writeup.

  type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
  let currentStep = $state<Step>(1);

  interface VarDecl { name: string; domain: string; meaning: string }
  interface ConstraintDecl { src: string; arity: 'unary' | 'binary' | 'global'; source: string; kind: 'hard' | 'implied' | 'symmetry' }

  let problemText = $state(`# Paste or type the problem description here.
Schedule 4 jobs onto a single machine. Each job takes 1 hour.
Jobs 1, 2 must finish before job 4 starts. Total available: 4 hours.`);

  let vars = $state<VarDecl[]>([
    { name: 's1', domain: '{1..4}', meaning: 'start time of job 1' },
    { name: 's2', domain: '{1..4}', meaning: 'start time of job 2' },
    { name: 's3', domain: '{1..4}', meaning: 'start time of job 3' },
    { name: 's4', domain: '{1..4}', meaning: 'start time of job 4' },
  ]);
  let constraints = $state<ConstraintDecl[]>([
    { src: 'AllDifferent(s1, s2, s3, s4)', arity: 'global', source: 'single-machine mutex (one job per hour)', kind: 'hard' },
    { src: 's1 < s4', arity: 'binary', source: 'precedence: job 1 before 4', kind: 'hard' },
    { src: 's2 < s4', arity: 'binary', source: 'precedence: job 2 before 4', kind: 'hard' },
  ]);
  let implied = $state<ConstraintDecl[]>([]);
  let symmetry = $state<ConstraintDecl[]>([]);
  let sanity = $state({ overChecked: false, underChecked: false, propagationOk: false });

  // helpers
  function addVar() { vars = [...vars, { name: '', domain: '', meaning: '' }]; }
  function removeVar(i: number) { vars = vars.filter((_, j) => j !== i); }
  function addConstraint(target: 'hard' | 'implied' | 'symmetry') {
    const c: ConstraintDecl = { src: '', arity: 'binary', source: '', kind: target };
    if (target === 'hard') constraints = [...constraints, c];
    if (target === 'implied') implied = [...implied, { ...c, source: '(implied)' }];
    if (target === 'symmetry') symmetry = [...symmetry, { ...c, source: '(symmetry-breaking)' }];
  }
  function removeConstraint(target: 'hard' | 'implied' | 'symmetry', i: number) {
    if (target === 'hard') constraints = constraints.filter((_, j) => j !== i);
    if (target === 'implied') implied = implied.filter((_, j) => j !== i);
    if (target === 'symmetry') symmetry = symmetry.filter((_, j) => j !== i);
  }

  // CSPLab spec
  const cspLabSpec = $derived.by(() => {
    const lines: string[] = ['# Auto-built by Modelling Wizard'];
    for (const v of vars) if (v.name && v.domain) {
      // Convert {1..4} → 1, 2, 3, 4
      const m = v.domain.match(/\{(-?\d+)\s*\.\.\s*(-?\d+)\}/);
      let domStr = v.domain;
      if (m) {
        const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
        const r: number[] = [];
        for (let i = lo; i <= hi; i++) r.push(i);
        domStr = r.join(', ');
      } else {
        domStr = v.domain.replace(/^\{|\}$/g, '').trim();
      }
      lines.push(`${v.name} = ${domStr}`);
    }
    const allHard = [...constraints, ...implied, ...symmetry];
    const unary: string[] = [];
    const binary: string[] = [];
    for (const c of allHard) {
      if (!c.src) continue;
      // Detect AllDifferent → expand to pairwise
      const adm = c.src.match(/AllDifferent\s*\(\s*([^)]+)\)/i);
      if (adm) {
        const vlist = adm[1].split(/[,\s]+/).filter(Boolean);
        for (let i = 0; i < vlist.length; i++) for (let j = i + 1; j < vlist.length; j++) {
          binary.push(`${vlist[i]}-${vlist[j]}`);
        }
        continue;
      }
      if (c.arity === 'unary') unary.push(c.src);
      else binary.push(c.src);
    }
    if (unary.length) { lines.push('unary:'); for (const u of unary) lines.push(u); }
    if (binary.length) { lines.push('binary:'); for (const b of binary) lines.push(b); }
    return lines.join('\n');
  });

  // Exam answer
  const examAnswer = $derived.by(() => {
    const out: string[] = [];
    out.push(`**Problem.**`);
    out.push(problemText.split('\n').filter((l) => !l.startsWith('#')).join(' ').trim());
    out.push('');
    out.push(`**Variables.**`);
    for (const v of vars) if (v.name) out.push(`- $${v.name} \\in ${v.domain.replace('{', '\\{').replace('}', '\\}')}$ — ${v.meaning}`);
    out.push('');
    out.push(`**Constraints.**`);
    for (let i = 0; i < constraints.length; i++) {
      const c = constraints[i];
      if (!c.src) continue;
      out.push(`${i + 1}. \`${c.src}\` — ${c.source}`);
    }
    if (implied.length) {
      out.push('');
      out.push(`**Implied constraints** (entailed; added to strengthen propagation).`);
      for (const c of implied) if (c.src) out.push(`- \`${c.src}\` — ${c.source}`);
    }
    if (symmetry.length) {
      out.push('');
      out.push(`**Symmetry-breaking constraints.**`);
      for (const c of symmetry) if (c.src) out.push(`- \`${c.src}\` — ${c.source}`);
    }
    out.push('');
    out.push(`**Sanity check.**`);
    out.push(`- Every solution to the original problem satisfies every posted constraint: ${sanity.overChecked ? '✓ checked' : '*not yet verified*'}.`);
    out.push(`- Every assignment satisfying every posted constraint is a valid solution: ${sanity.underChecked ? '✓ checked' : '*not yet verified*'}.`);
    out.push(`- Propagation makes progress on small instances (AC-3 / FC actually prunes): ${sanity.propagationOk ? '✓ checked' : '*not yet verified*'}.`);
    return out.join('\n');
  });

  const stepNames: Record<Step, string> = {
    1: 'Decisions → Variables',
    2: 'Domains',
    3: 'Constraints',
    4: 'Arity / globals',
    5: 'Implied constraints',
    6: 'Symmetry-breaking',
    7: 'Sanity check',
  };
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-1 items-center text-xs">
    <span class="text-ink-500">Step:</span>
    {#each [1,2,3,4,5,6,7] as n}
      <button
        class="px-2 py-1 rounded {currentStep === n ? 'bg-accent-100 dark:bg-accent-900/40 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800'}"
        onclick={() => (currentStep = n as Step)}
      >{n}. {stepNames[n as Step]}</button>
    {/each}
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Problem text (paste / edit; this stays visible across steps).</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="4" bind:value={problemText}></textarea>
  </label>

  {#if currentStep === 1}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 1 — Identify the decisions</h4>
      <p class="text-xs text-ink-500 mb-2">What does the modeller need to <b>choose</b>? Those are your decision variables. Inputs (durations, capacities, weights) are parameters, NOT variables.</p>
      <div class="text-xs space-y-2">
        {#each vars as v, i}
          <div class="flex gap-2 items-center">
            <input class="w-20 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="name" bind:value={v.name} />
            <span class="text-ink-500">∈</span>
            <input class="w-32 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="{'{1..n}'}" bind:value={v.domain} />
            <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="meaning" bind:value={v.meaning} />
            <button class="text-rose-600" onclick={() => removeVar(i)}>✕</button>
          </div>
        {/each}
        <button class="btn btn-sm" onclick={addVar}>+ add variable</button>
      </div>
    </div>
  {/if}

  {#if currentStep === 2}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 2 — Pick the smallest possible domains</h4>
      <p class="text-xs text-ink-500 mb-2">Tighter domains = stronger upfront propagation. Derive bounds from problem constraints (deadlines, capacities). Range form: <code>{'{1..4}'}</code>. Set form: <code>{'{R, G, B}'}</code>.</p>
      <div class="text-xs space-y-2">
        {#each vars as v}
          <div class="flex gap-2 items-center">
            <span class="font-mono w-20">{v.name}</span>
            <span class="text-ink-500">∈</span>
            <input class="w-32 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" bind:value={v.domain} />
            <span class="text-ink-500">— {v.meaning}</span>
          </div>
        {/each}
      </div>
      <details class="mt-3 text-xs">
        <summary class="cursor-pointer text-accent-600">▸ Quick-tighten hints</summary>
        <ul class="list-disc pl-5 mt-2">
          <li>If you have a deadline $T$ and duration $d$, max start time = $T - d + 1$.</li>
          <li>If "at most $k$ true", Boolean variable has domain {'{0, 1}'} — never widen this.</li>
          <li>If colours are interchangeable, you only need {'{1, …, χ}'} where χ is your upper bound on the chromatic number.</li>
        </ul>
      </details>
    </div>
  {/if}

  {#if currentStep === 3}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 3 — List constraints, by source</h4>
      <p class="text-xs text-ink-500 mb-2">Walk the problem text sentence-by-sentence. Tag each constraint with its <b>source</b> (where it came from in the prose) — this makes the model easier to debug.</p>
      <div class="text-xs space-y-2">
        {#each constraints as c, i}
          <div class="flex gap-2 items-center">
            <input class="flex-1 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="x1 != x2  or  AllDifferent(x1, x2, x3)" bind:value={c.src} />
            <select class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700" bind:value={c.arity}>
              <option value="unary">unary</option>
              <option value="binary">binary</option>
              <option value="global">global</option>
            </select>
            <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="source / why" bind:value={c.source} />
            <button class="text-rose-600" onclick={() => removeConstraint('hard', i)}>✕</button>
          </div>
        {/each}
        <button class="btn btn-sm" onclick={() => addConstraint('hard')}>+ add constraint</button>
      </div>
      <details class="mt-3 text-xs">
        <summary class="cursor-pointer text-accent-600">▸ Common sources to cover</summary>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li><b>Hard rules</b> — "queens can't share a row".</li>
          <li><b>Capacity / resource</b> — "each warehouse ≤ 100 units" → sum-bounded.</li>
          <li><b>Mutual exclusion</b> — "at most one task per machine at a time" → AllDifferent / non-overlap.</li>
          <li><b>Precedence / ordering</b> — "B must follow A" → $s_B \\ge s_A + d_A$.</li>
          <li><b>Coverage</b> — "every shop supplied" → function totality.</li>
          <li><b>Quotas / counts</b> — "each colour used $k$ times" → gcc.</li>
        </ul>
      </details>
    </div>
  {/if}

  {#if currentStep === 4}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 4 — Pick arity wisely (prefer globals)</h4>
      <p class="text-xs text-ink-500 mb-2">Global constraints propagate strictly stronger than their decomposed binary equivalents. Review your constraint list and upgrade where possible.</p>
      <table class="text-xs w-full font-mono">
        <thead><tr class="text-left text-ink-500"><th>Constraint</th><th>Arity</th><th>Upgrade?</th></tr></thead>
        <tbody>
          {#each constraints as c}
            <tr class="border-t border-ink-200 dark:border-ink-800">
              <td class="py-1">{c.src}</td>
              <td>{c.arity}</td>
              <td class="text-ink-500">
                {#if c.arity === 'binary' && /!=/.test(c.src)}
                  ⚠ pairwise ≠ — consider AllDifferent
                {:else if c.arity === 'binary' && /\+/.test(c.src) && /<=|>=/.test(c.src)}
                  💡 consider <code>sum</code> global
                {:else}—{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      <details class="mt-3 text-xs">
        <summary class="cursor-pointer text-accent-600">▸ When to use which global</summary>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li>Many vars pairwise ≠ → <b>AllDifferent</b> (Régin GAC).</li>
          <li>Σ Xᵢ ≤ k, = k, ≥ k → <b>sum</b> (bounds consistency).</li>
          <li>At most $k$ true → <b>sequential counter</b> or <b>totalizer</b>.</li>
          <li>Value $v$ occurs in $[l, u]$ times → <b>gcc</b> (global cardinality).</li>
          <li>Z = X[Y] → <b>element</b>.</li>
          <li>Non-overlap on a resource with capacity → <b>cumulative</b>.</li>
        </ul>
      </details>
    </div>
  {/if}

  {#if currentStep === 5}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 5 — Add implied constraints</h4>
      <p class="text-xs text-ink-500 mb-2">Implied = logically entailed but explicit. They don't change solutions, but strengthen propagation. ALWAYS verify: does every original solution still satisfy this?</p>
      <div class="text-xs space-y-2">
        {#each implied as c, i}
          <div class="flex gap-2 items-center">
            <input class="flex-1 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="implied constraint" bind:value={c.src} />
            <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="why entailed + why useful" bind:value={c.source} />
            <button class="text-rose-600" onclick={() => removeConstraint('implied', i)}>✕</button>
          </div>
        {/each}
        <button class="btn btn-sm" onclick={() => addConstraint('implied')}>+ add implied constraint</button>
      </div>
      <details class="mt-3 text-xs">
        <summary class="cursor-pointer text-accent-600">▸ Common implied constraints</summary>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li><b>Total sum / count identity</b> — e.g. magic square: total = $n \\cdot \\mu$.</li>
          <li><b>Capacity floor / ceiling</b> — bin packing: $K \\ge \\lceil (\\sum w_i) / C \\rceil$.</li>
          <li><b>Tightened domain bounds from deadline</b> — $s_i \\le T - d_i + 1$.</li>
          <li><b>Path-length lower bound</b> — scheduling: project critical path ≤ makespan.</li>
        </ul>
      </details>
    </div>
  {/if}

  {#if currentStep === 6}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 6 — Break symmetries</h4>
      <p class="text-xs text-ink-500 mb-2">Identify which variables / values are interchangeable, then add constraints to fix a canonical representative per orbit.</p>
      <div class="text-xs space-y-2">
        {#each symmetry as c, i}
          <div class="flex gap-2 items-center">
            <input class="flex-1 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="symmetry-breaking constraint" bind:value={c.src} />
            <input class="flex-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="which symmetry it breaks" bind:value={c.source} />
            <button class="text-rose-600" onclick={() => removeConstraint('symmetry', i)}>✕</button>
          </div>
        {/each}
        <button class="btn btn-sm" onclick={() => addConstraint('symmetry')}>+ add symmetry-breaking</button>
      </div>
      <details class="mt-3 text-xs">
        <summary class="cursor-pointer text-accent-600">▸ Common symmetry-breaking patterns</summary>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li><b>Interchangeable variables</b> → lex-order (X₁ ≤ X₂ ≤ … or strict &lt;).</li>
          <li><b>Interchangeable values</b> → value precedence (first occurrence of vᵢ before vᵢ₊₁).</li>
          <li><b>Matrix row + column symmetry</b> → DoubleLex (rows lex + cols lex).</li>
          <li><b>Geometric reflections</b> → fix one element (e.g. first queen in row 1, column ≤ ⌈n/2⌉).</li>
          <li><b>Bin permutation</b> (bin packing) → b₁ = 1 and bᵢ ≤ max(b₁, …, bᵢ₋₁) + 1.</li>
        </ul>
      </details>
    </div>
  {/if}

  {#if currentStep === 7}
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-2">Step 7 — Sanity check</h4>
      <p class="text-xs text-ink-500 mb-2">Run these three checks before declaring the model done.</p>
      <div class="space-y-2 text-sm">
        <label class="flex items-start gap-2">
          <input type="checkbox" class="mt-1" bind:checked={sanity.overChecked} />
          <span>
            <b>Over-constraint check.</b> Pick any solution you know is valid for the original problem. Does it satisfy every posted constraint? If <i>no</i>: you've added a constraint that's not actually implied — fix it.
          </span>
        </label>
        <label class="flex items-start gap-2">
          <input type="checkbox" class="mt-1" bind:checked={sanity.underChecked} />
          <span>
            <b>Under-constraint check.</b> Construct an assignment that satisfies every posted constraint. Is it a valid solution to the original problem? If <i>no</i>: you're missing a constraint.
          </span>
        </label>
        <label class="flex items-start gap-2">
          <input type="checkbox" class="mt-1" bind:checked={sanity.propagationOk} />
          <span>
            <b>Propagation check.</b> Open the model in CSPLab (or AC-3 stepper). On a small instance, does AC-3 / FC actually shrink domains? If <i>no</i>: you have a "loose" model — consider adding more implied constraints or upgrading binary to global.
          </span>
        </label>
      </div>
    </div>
  {/if}

  <details class="card !p-3">
    <summary class="cursor-pointer text-sm font-semibold">▸ Model so far (auto-built CSPLab spec)</summary>
    <pre class="text-xs font-mono bg-ink-50 dark:bg-ink-900 p-2 mt-2 rounded overflow-x-auto whitespace-pre">{cspLabSpec}</pre>
    <div class="text-xs text-ink-500 mt-2">Copy this into CSPLab or the AC-3 stepper to test propagation. AllDifferent is expanded to pairwise ≠ for the spec; the exam answer keeps it as AllDifferent.</div>
  </details>

  <ExamAnswer answer={examAnswer} summary={`Step ${currentStep}/7 · ${vars.length} vars · ${constraints.length + implied.length + symmetry.length} constraints`} />
</div>
