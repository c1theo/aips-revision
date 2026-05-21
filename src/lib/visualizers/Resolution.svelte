<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Resolution refutation visualiser.
  // Input: list of clauses (one per line) as comma-separated literals (e.g. "P, ~Q").
  // Algorithm: BFS through pairwise resolutions until empty clause or saturation.

  let { initialKB = '', initialQuery = '' } = $props<{ initialKB?: string; initialQuery?: string }>();

  let input = $state(initialKB || `P, Q
~P, R
~Q, R`);
  let query = $state(initialQuery || 'R');
  let useQuery = $state(true);
  let overrideSpec = $state('');   // e.g. "C1, C3\nC2, C4" — force these resolution pairs first
  let log = $state<{ step: number; a: string[]; b: string[]; r: string[]; pivot: string; forced?: boolean }[]>([]);
  let success = $state(false);
  let error = $state('');

  function parseOverridePairs(spec: string): { i: number; j: number }[] {
    // Format: one pair per line, e.g. "C1, C3" or "1, 3" or "C1 C3". 1-based indices.
    const out: { i: number; j: number }[] = [];
    for (const raw of spec.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const nums = line.match(/\d+/g);
      if (!nums || nums.length < 2) continue;
      const i = Number(nums[0]) - 1;
      const j = Number(nums[1]) - 1;
      if (i >= 0 && j >= 0 && i !== j) out.push({ i, j });
    }
    return out;
  }

  function parseClauses(s: string): string[][] {
    return s.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      return line.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
    });
  }

  function normLit(l: string): string {
    l = l.replace(/^~+/, (m) => (m.length % 2 === 0 ? '' : '~'));
    return l;
  }
  function negate(l: string): string {
    return l.startsWith('~') ? l.slice(1) : '~' + l;
  }
  function clauseKey(c: string[]): string {
    return [...new Set(c.map(normLit))].sort().join('|');
  }

  function resolve(c1: string[], c2: string[]): { resolvent: string[]; pivot: string } | null {
    for (const l of c1) {
      if (c2.includes(negate(l))) {
        const r = [...new Set([...c1.filter((x) => x !== l), ...c2.filter((x) => x !== negate(l))].map(normLit))];
        // tautology check
        for (const x of r) if (r.includes(negate(x))) return null;
        return { resolvent: r, pivot: l };
      }
    }
    return null;
  }

  function run() {
    const localLog: typeof log = [];
    let localSuccess = false;
    let localError = '';
    try {
      const parsedKB = parseClauses(input).map((c) => c.map(normLit));
      let kbWithQuery = parsedKB;
      if (useQuery && query.trim()) {
        // Add negated query as a clause
        const negated = query.trim().split(/[,\s]+/).filter(Boolean).map((l) => normLit(negate(normLit(l))));
        // Each literal in the query separately, since "negation of P∧Q" = "¬P ∨ ¬Q" — single clause
        // But for queries like "R" (single literal), it's just one clause with the negated literal.
        kbWithQuery = [...parsedKB, negated];
      }
      let known: string[][] = kbWithQuery.map((c) => [...new Set(c)]);
      let knownKeys = new Set(known.map(clauseKey));
      let step = 0;

      // 1. Process user-forced pairs (in order). Each pair is (i, j) into the
      //    growing `known` list, 1-based on input. Skip pairs that aren't
      //    valid (out of range or no complementary literal).
      const forced = parseOverridePairs(overrideSpec);
      let forcedDone = false;
      for (const pair of forced) {
        if (pair.i >= known.length || pair.j >= known.length) continue;
        const r = resolve(known[pair.i], known[pair.j]);
        if (!r) continue;
        const k = clauseKey(r.resolvent);
        if (knownKeys.has(k)) continue;
        step++;
        localLog.push({ step, a: known[pair.i], b: known[pair.j], r: r.resolvent, pivot: r.pivot, forced: true });
        known = [...known, r.resolvent];
        knownKeys.add(k);
        if (r.resolvent.length === 0) { localSuccess = true; forcedDone = true; break; }
        if (step > 500) { forcedDone = true; break; }
      }

      // 2. Fall through to default BFS saturation.
      if (!forcedDone) {
        let changed = true;
        outer: while (changed) {
          changed = false;
          const next: string[][] = [...known];
          for (let i = 0; i < known.length; i++) {
            for (let j = i + 1; j < known.length; j++) {
              const r = resolve(known[i], known[j]);
              if (r) {
                const k = clauseKey(r.resolvent);
                if (!knownKeys.has(k)) {
                  step++;
                  localLog.push({ step, a: known[i], b: known[j], r: r.resolvent, pivot: r.pivot });
                  next.push(r.resolvent);
                  knownKeys.add(k);
                  changed = true;
                  if (r.resolvent.length === 0) { localSuccess = true; known = next; break outer; }
                  if (step > 500) break outer;
                }
              }
            }
          }
          known = next;
        }
      }
    } catch (e: any) {
      localError = e.message;
    }
    log = localLog;
    success = localSuccess;
    error = localError;
  }
  $effect(() => { input; query; useQuery; overrideSpec; run(); });

  function fmtClause(c: string[]): string {
    if (c.length === 0) return '∅';
    return '{' + c.join(', ') + '}';
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    const kb = parseClauses(input).map((c) => c.map(normLit));
    lines.push('**Setup.**');
    lines.push('- KB clauses:');
    kb.forEach((c, i) => lines.push(`  ${i + 1}. ${fmtClause(c)}`));
    if (useQuery && query.trim()) {
      lines.push(`- Query: $\\alpha = ${query.trim()}$.`);
      const negated = query.trim().split(/[,\s]+/).filter(Boolean).map((l) => normLit(negate(normLit(l))));
      lines.push(`- Append $\\neg\\alpha$ as clause: ${fmtClause(negated)}.`);
    } else {
      lines.push(`- No query — testing the KB itself for UNSAT.`);
    }
    const forced = parseOverridePairs(overrideSpec);
    if (forced.length) {
      lines.push(`- User-forced resolution order: ${forced.map((p) => `(C${p.i + 1}, C${p.j + 1})`).join(', ')}.`);
    }
    lines.push('');

    if (error) {
      lines.push(`**Error.** ${error}`);
      return lines.join('\n');
    }

    if (log.length === 0) {
      lines.push(`**Trace.** No resolutions were derivable from the input — clauses already saturated.`);
    } else {
      lines.push(`**Resolution refutation trace.**`);
      lines.push('');
      lines.push('| # | Resolve | Pivot | Resolvent |');
      lines.push('|---|---|---|---|');
      for (const e of log) {
        const res = e.r.length === 0 ? '$\\square$ (empty)' : fmtClause(e.r);
        const tag = e.forced ? ' *(forced)*' : '';
        lines.push(`| ${e.step} | ${fmtClause(e.a)} with ${fmtClause(e.b)}${tag} | ${e.pivot} | ${res} |`);
      }
      lines.push('');
    }

    if (success) {
      lines.push(useQuery
        ? `**Conclusion.** Derived $\\square$ $\\Rightarrow$ $KB \\cup \\{\\neg\\alpha\\}$ is UNSAT $\\Rightarrow$ $KB \\models \\alpha$.`
        : `**Conclusion.** Derived $\\square$ $\\Rightarrow$ the clause set is UNSAT.`);
    } else {
      lines.push(useQuery
        ? `**Conclusion.** Saturated without deriving $\\square$ $\\Rightarrow$ $KB \\not\\models \\alpha$.`
        : `**Conclusion.** Saturated without $\\square$ $\\Rightarrow$ the clause set is satisfiable.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Knowledge-base clauses (one per line; literals comma-separated; <code class="text-xs">~</code> for negation)</span>
    <textarea class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={input}></textarea>
  </label>

  <div class="card !p-2 flex items-center gap-2 text-xs">
    <label class="flex items-center gap-1"><input type="checkbox" bind:checked={useQuery}>Prove KB ⊨</label>
    <input class="flex-1 font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={query} placeholder="e.g. R (single literal) — the negation gets appended as a clause" disabled={!useQuery} />
    <span class="text-ink-500">The visualizer appends <code class="font-mono">¬({query || '…'})</code> as an extra clause and refutes.</span>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1"><b>Resolution-pair overrides</b> — force the order of resolution steps. One pair per line, e.g. <code>C1, C3</code> (resolve clauses 1 and 3 first). Derived clauses are numbered C{1 + (useQuery && query.trim() ? parseClauses(input).length + 1 : parseClauses(input).length)}, … in order of derivation. Pairs without a complementary literal are skipped; the rest of the run continues with the default BFS. Leave blank for default.</span>
    <textarea class="w-full font-mono text-sm p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="3" bind:value={overrideSpec} placeholder="e.g.&#10;C1, C3&#10;C2, C4"></textarea>
  </label>

  <div class="flex gap-2 flex-wrap text-xs">
    Try:
    {#each [
      'P, Q\n~P, R\n~Q, R\n~R',
      'A\n~A, B\n~B',
      'P, Q, R\n~P\n~Q\n~R',
      '~P, ~Q, R\nP\nQ\n~R',
    ] as ex, i}
      <button class="btn btn-sm" onclick={() => (input = ex)}>Example {i + 1}</button>
    {/each}
  </div>

  {#if error}
    <div class="text-rose-600 text-sm">{error}</div>
  {/if}

  <div class="text-sm">
    {success ? '✓ Empty clause derived — original clause set is UNSAT (refutation complete).' : `${log.length} resolutions, no empty clause yet.`}
  </div>

  {#if log.length > 0}
    <div class="card !p-3">
      <table class="text-xs font-mono w-full">
        <thead>
          <tr class="text-left text-ink-500">
            <th class="pr-2 pb-1">#</th>
            <th class="pr-2 pb-1">resolve</th>
            <th class="pr-2 pb-1">on pivot</th>
            <th class="pb-1">⇒ resolvent</th>
          </tr>
        </thead>
        <tbody>
          {#each log as e}
            <tr>
              <td class="text-ink-500 pr-2">{e.step}{e.forced ? '*' : ''}</td>
              <td class="pr-2">{'{' + e.a.join(', ') + '}'} ∧ {'{' + e.b.join(', ') + '}'}</td>
              <td class="pr-2 text-violet-700 dark:text-violet-300">{e.pivot}</td>
              <td class="font-bold {e.r.length === 0 ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-400'}">{e.r.length === 0 ? '□  (empty clause)' : '{' + e.r.join(', ') + '}'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if log.some((e) => e.forced)}
        <div class="text-xs text-ink-500 mt-2">* = user-forced step (from override list).</div>
      {/if}
    </div>
  {/if}

  <ExamAnswer answer={examAnswer} summary={`${log.length} resolution${log.length === 1 ? '' : 's'} · ${success ? (useQuery ? 'KB ⊨ α' : 'UNSAT') : (useQuery ? 'KB ⊭ α' : 'saturated')}`} />
</div>
