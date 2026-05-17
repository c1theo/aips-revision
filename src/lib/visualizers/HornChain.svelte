<script lang="ts">
  // Forward chaining over a Horn KB. Rules: "p1, p2, ... -> q" or just facts "q".

  let input = $state(`A
B
A, B -> C
A -> D
C, D -> E
E -> F`);
  let query = $state('F');

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
      for (const r of rules) {
        if (!known.has(r.head) && r.body.every((b) => known.has(b))) {
          known.add(r.head);
          step++;
          t.push({ step, added: r.head, via: r.body.join(' ∧ ') + ' → ' + r.head });
          changed = true;
        }
      }
    }
    trace = t;
    knownAtEnd = [...known];
    provedQuery = query.trim() === '' ? null : known.has(query.trim());
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

  <div class="card !p-3">
    <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Forward chain trace</div>
    <ol class="text-xs font-mono space-y-1 list-none p-0">
      {#each trace as t}
        <li>
          <span class="text-ink-500 mr-2">{t.step}.</span>
          <span class="font-bold text-emerald-700 dark:text-emerald-300">{t.added}</span>
          <span class="text-ink-500 ml-2">— via {t.via}</span>
        </li>
      {/each}
    </ol>
  </div>
</div>
