<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Forward chaining over a Horn KB. Rules: "p1, p2, ... -> q" or just facts "q".

  let { initialHorn = '' } = $props<{ initialHorn?: string }>();

  // Parse the "# Facts / # Rules / # Query" header format into:
  //   - kb text (facts + rules joined as the existing UI expects)
  //   - optional query string
  // Rules in the incoming format use "∧" between body atoms and "→" between
  // body and head; we normalise to "," and "->" to match the existing parser.
  function parseHornHeaders(src: string): { kb: string; query: string } {
    const lines = src.split('\n');
    let section: 'facts' | 'rules' | 'query' | null = null;
    const facts: string[] = [];
    const rules: string[] = [];
    let queryLine = '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const lower = line.toLowerCase();
      if (lower.startsWith('# facts') || lower === '#facts') { section = 'facts'; continue; }
      if (lower.startsWith('# rules') || lower === '#rules') { section = 'rules'; continue; }
      if (lower.startsWith('# query') || lower === '#query') { section = 'query'; continue; }
      if (line.startsWith('#')) continue;
      if (section === 'facts') {
        facts.push(line);
      } else if (section === 'rules') {
        // Normalise "p ∧ q → r" -> "p, q -> r"
        const normalised = line
          .replace(/∧|&&|&/g, ',')
          .replace(/→|=>/g, '->');
        rules.push(normalised);
      } else if (section === 'query') {
        // Accept "goal: x" or just "x"
        const m = line.match(/^(?:goal\s*:\s*)?(.+)$/i);
        if (m) queryLine = m[1].trim();
      } else {
        // No section header yet — treat ambiguously: rules contain ->, facts don't.
        if (line.includes('->') || line.includes('→')) {
          rules.push(line.replace(/∧|&&|&/g, ',').replace(/→|=>/g, '->'));
        } else {
          facts.push(line);
        }
      }
    }
    return {
      kb: [...facts, ...rules].join('\n'),
      query: queryLine,
    };
  }

  const _parsedInitial = initialHorn ? parseHornHeaders(initialHorn) : null;

  let input = $state(_parsedInitial?.kb || `A
B
A, B -> C
A -> D
C, D -> E
E -> F`);
  let query = $state(_parsedInitial?.query || 'F');
  let mode = $state<'forward' | 'backward'>('forward');
  let overrideSpec = $state('');   // e.g. "R2, R1" — fire/try these rules first

  function parseRuleOverride(spec: string, ruleCount: number): number[] {
    // Format: comma/space/newline-separated rule IDs ("R2", "2", "R1", ...). 1-based.
    const out: number[] = [];
    const seen = new Set<number>();
    for (const tok of spec.split(/[,\s\n]+/)) {
      const t = tok.trim();
      if (!t) continue;
      const m = t.match(/^R?(\d+)$/i);
      if (!m) continue;
      const idx = Number(m[1]) - 1;
      if (idx >= 0 && idx < ruleCount && !seen.has(idx)) {
        out.push(idx);
        seen.add(idx);
      }
    }
    return out;
  }

  interface Rule { body: string[]; head: string; }

  function parse(src: string): { facts: string[]; rules: Rule[] } {
    const facts: string[] = [];
    const rules: Rule[] = [];
    for (const line0 of src.split('\n')) {
      const line = line0.trim();
      if (!line) continue;
      if (line.includes('->')) {
        const [bodyStr, head] = line.split('->').map((x) => x.trim());
        const body = bodyStr.split(/[,\s]+/).filter(Boolean);
        rules.push({ body, head });
      } else {
        facts.push(line);
      }
    }
    return { facts, rules };
  }

  let trace = $state<{ step: number; added: string; via: string }[]>([]);
  let provedQuery = $state<boolean | null>(null);
  let knownAtEnd = $state<string[]>([]);

  $effect(() => {
    const { facts, rules } = parse(input);
    const priority = parseRuleOverride(overrideSpec, rules.length);
    // Build a rule-firing order: priority-listed rules first, then the rest in input order.
    const inPriority = new Set(priority);
    const ruleOrder: number[] = [
      ...priority,
      ...rules.map((_, i) => i).filter((i) => !inPriority.has(i)),
    ];

    if (mode === 'forward') {
      const known = new Set<string>(facts);
      const t: typeof trace = [];
      let step = 0;
      for (const f of facts) {
        step++;
        t.push({ step, added: f, via: 'given fact' });
      }
      let changed = true;
      while (changed) {
        changed = false;
        // Walk rules in user-priority order, then default order.
        for (const idx of ruleOrder) {
          const r = rules[idx];
          if (!known.has(r.head) && r.body.every((b) => known.has(b))) {
            known.add(r.head);
            step++;
            const tag = inPriority.has(idx) ? ` [forced R${idx + 1}]` : ` [R${idx + 1}]`;
            t.push({ step, added: r.head, via: r.body.join(' ∧ ') + ' → ' + r.head + tag });
            changed = true;
          }
        }
      }
      trace = t;
      knownAtEnd = [...known];
      provedQuery = query.trim() === '' ? null : known.has(query.trim());
    } else {
      // Backward chaining: prove query recursively
      const t: typeof trace = [];
      let step = 0;
      const facts_ = new Set(facts);
      const visiting = new Set<string>();    // for cycle detection
      function prove(goal: string, indent: number): boolean {
        step++;
        if (facts_.has(goal)) {
          t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}✓ known fact` });
          return true;
        }
        if (visiting.has(goal)) {
          t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}✗ cycle — skip` });
          return false;
        }
        visiting.add(goal);
        // Rules that produce this goal, sorted by user priority (priority-listed first, then default order).
        const applicableIdx = ruleOrder.filter((i) => rules[i].head === goal);
        if (applicableIdx.length === 0) {
          t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}✗ no rule produces ${goal}` });
          visiting.delete(goal);
          return false;
        }
        for (const idx of applicableIdx) {
          const r = rules[idx];
          const tag = inPriority.has(idx) ? ` [forced R${idx + 1}]` : ` [R${idx + 1}]`;
          t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}try rule: ${r.body.join(', ')} → ${goal}${tag}` });
          const allOk = r.body.every((sub) => prove(sub, indent + 1));
          if (allOk) {
            step++;
            t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}✓ ${goal} proved` });
            visiting.delete(goal);
            return true;
          }
        }
        step++;
        t.push({ step, added: goal, via: `${' '.repeat(indent * 2)}✗ failed all rules for ${goal}` });
        visiting.delete(goal);
        return false;
      }
      const ok = query.trim() ? prove(query.trim(), 0) : null;
      trace = t;
      knownAtEnd = [...facts_];
      provedQuery = ok;
    }
  });

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    const { facts, rules } = parse(input);
    lines.push('**Setup.**');
    if (facts.length) lines.push(`- Facts: ${facts.map((f) => '`' + f + '`').join(', ')}.`);
    if (rules.length) {
      lines.push('- Rules:');
      rules.forEach((r, i) => lines.push(`  ${i + 1}. \`${r.body.join(' ∧ ')} → ${r.head}\``));
    }
    lines.push(`- Goal: $\\alpha = ${query.trim() || '\\text{(none)}'}$.`);
    lines.push(`- Mode: **${mode === 'forward' ? 'forward chaining' : 'backward chaining'}**.`);
    const priority = parseRuleOverride(overrideSpec, rules.length);
    if (priority.length) {
      lines.push(`- User-forced rule order: ${priority.map((i) => `R${i + 1}`).join(', ')} (tried first; falls back to default order afterwards).`);
    }
    lines.push('');

    if (trace.length) {
      lines.push(`**Inference trace.**`);
      lines.push('');
      lines.push('| # | Derived / step | Justification |');
      lines.push('|---|---|---|');
      for (const t of trace) {
        const via = t.via.replace(/`/g, '').replace(/\|/g, '\\|');
        lines.push(`| ${t.step} | \`${t.added}\` | ${via.trim()} |`);
      }
      lines.push('');
    }

    if (mode === 'forward') {
      lines.push(`**Closure.** Known facts after fixpoint: ${knownAtEnd.map((f) => '`' + f + '`').join(', ')} (${knownAtEnd.length} total).`);
      lines.push('');
    }

    if (provedQuery === true) {
      lines.push(`**Conclusion.** \`${query.trim()}\` is **entailed** by the KB.`);
    } else if (provedQuery === false) {
      lines.push(`**Conclusion.** \`${query.trim()}\` is **not entailed** by the KB.`);
    } else {
      lines.push(`**Conclusion.** No query supplied.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="grid sm:grid-cols-2 gap-3">
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Horn KB (one rule/fact per line; <code class="text-xs">p1, p2 -&gt; q</code>)</span>
      <textarea class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="8" bind:value={input}></textarea>
    </label>
    <div>
      <label class="block">
        <span class="text-xs text-ink-500 block mb-1">Query</span>
        <input class="w-full font-mono px-3 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={query} />
      </label>
      {#if provedQuery !== null}
        <div class="mt-2 text-sm font-medium {provedQuery ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}">
          {provedQuery ? `✓ ${query} is entailed.` : `✗ ${query} is NOT entailed.`}
        </div>
      {/if}
      <div class="text-xs mt-3">Known facts ({knownAtEnd.length}):</div>
      <div class="font-mono text-xs">{knownAtEnd.join(', ')}</div>
    </div>
  </div>

  <div class="flex gap-2 items-center text-xs">
    <span>Mode:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {mode === 'forward' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (mode = 'forward')}>Forward chaining</button>
      <button class="px-2 py-1 {mode === 'backward' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (mode = 'backward')}>Backward chaining</button>
    </div>
    <span class="text-ink-500 ml-2">{mode === 'forward' ? 'Data-driven: start from facts, fire rules.' : 'Goal-directed: try to prove the query recursively.'}</span>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1"><b>Rule-firing overrides</b> — priority list of rule IDs to try first. Format: <code>R2, R1</code> (1-based by their order in the KB; counting rules only, not facts). In <b>forward</b> mode the priority rules are checked first each iteration; in <b>backward</b> mode they are tried first when multiple rules can prove the current goal. Rules not applicable at the time are skipped (default order resumes). Leave blank for default.</span>
    <input class="w-full font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={overrideSpec} placeholder="e.g. R2, R1" />
  </label>

  <div class="card !p-3">
    <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">{mode === 'forward' ? 'Forward chain' : 'Backward chain'} trace</div>
    <ol class="text-xs font-mono space-y-1 list-none p-0">
      {#each trace as t}
        <li class="whitespace-pre">
          <span class="text-ink-500 mr-2">{t.step}.</span>
          <span class="font-bold text-emerald-700 dark:text-emerald-300">{t.added}</span>
          <span class="text-ink-500 ml-2">— {t.via}</span>
        </li>
      {/each}
    </ol>
  </div>

  <ExamAnswer answer={examAnswer} summary={`${mode === 'forward' ? 'Forward' : 'Backward'} · ${provedQuery === true ? `${query} entailed` : provedQuery === false ? `${query} not entailed` : 'no query'}`} />
</div>
