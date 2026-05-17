<script lang="ts">
  import { onMount } from 'svelte';
  import { search, highlightSnippet } from '../ask/score';
  import type { Item, ItemKind } from '../ask/corpus';
  import { intentDescriptions, type Intent } from '../ask/intent';
  import { modules, allTopics } from '../content';
  import { href, route } from '../router';
  import Md from '../components/Md.svelte';
  import InlineMd from '../components/InlineMd.svelte';

  let query = $state('');
  let expandedIds = $state<Set<string>>(new Set());
  let kindFilters = $state<Set<ItemKind>>(new Set());
  let inputEl: HTMLInputElement | undefined = $state();

  // Pre-populated examples
  const exampleQueries = [
    { q: 'what is admissibility', label: 'What is admissibility?' },
    { q: 'compare bfs vs dfs', label: 'Compare BFS vs DFS' },
    { q: 'why is alpha-beta correct', label: 'Why is α-β correct?' },
    { q: 'when to use mcts', label: 'When to use MCTS?' },
    { q: 'complexity of ac-3', label: 'Complexity of AC-3' },
    { q: 'difference between essence and essence prime', label: 'Essence vs Essence Prime' },
    { q: '1-uip', label: '1-UIP in CDCL' },
    { q: 'how does walksat work', label: 'How does WALKSAT work?' },
    { q: 'topic:csp viewpoint', label: 'topic:csp viewpoint' },
    { q: 'kind:example diff:advanced', label: 'kind:example diff:advanced' },
    { q: '"horn clause" forward chaining', label: '"horn clause" forward chaining' },
    { q: '/cdcl|conflict/', label: 'regex /cdcl|conflict/' },
  ];

  const results = $derived(query.trim() ? search(query, { limit: 30 }) : null);

  onMount(() => {
    // Read q= param from hash for shareable URLs
    const hash = window.location.hash;
    const match = hash.match(/[?&]q=([^&]+)/);
    if (match) query = decodeURIComponent(match[1]);
    inputEl?.focus();
  });

  function toggleKind(k: ItemKind) {
    if (kindFilters.has(k)) kindFilters.delete(k);
    else kindFilters.add(k);
    kindFilters = new Set(kindFilters);
  }

  const filteredResults = $derived(
    results
      ? kindFilters.size === 0
        ? results.results
        : results.results.filter((r) => kindFilters.has(r.item.kind))
      : [],
  );

  function toggleExpand(id: string) {
    if (expandedIds.has(id)) expandedIds.delete(id);
    else expandedIds.add(id);
    expandedIds = new Set(expandedIds);
  }

  function kindIcon(k: ItemKind): string {
    return { topic: '📘', section: '📄', glossary: '🔤', example: '✏️', flashcard: '🃏', pitfall: '⚠️' }[k];
  }

  function kindLabel(k: ItemKind): string {
    return { topic: 'Topic', section: 'Section', glossary: 'Glossary', example: 'Worked example', flashcard: 'Flashcard', pitfall: 'Pitfall' }[k];
  }

  function intentColour(i: Intent): string {
    const m: Record<Intent, string> = {
      define: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      compare: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      why: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
      when: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      how: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
      complexity: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
      pitfall: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      example: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
      list: 'bg-slate-100 text-slate-800 dark:bg-slate-700/60 dark:text-slate-200',
      unknown: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
    };
    return m[i];
  }

  function clearQuery() { query = ''; expandedIds = new Set(); inputEl?.focus(); }
</script>

<article class="max-w-4xl">
  <h1>Ask</h1>
  <p class="text-ink-600 dark:text-ink-300">
    Smart search over <b>every</b> bit of content — topics, sections, glossary, worked examples,
    flashcards and pitfalls. Type a question, browse the top matches, expand the ones you want.
    Synonyms (BFS ↔ breadth-first), operators and regex all supported. <b>No generative AI in-page.</b>
  </p>

  <div class="card my-4">
    <label class="block">
      <span class="text-xs text-ink-500 font-semibold uppercase tracking-wider">Your question</span>
      <div class="flex gap-2 mt-1">
        <input
          bind:this={inputEl}
          bind:value={query}
          type="text"
          class="flex-1 px-3 py-2 rounded-md border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-base"
          placeholder='e.g. "what is admissibility", "compare BFS vs DFS", "topic:csp viewpoint", "/cdcl|conflict/"'
        />
        {#if query}
          <button class="btn" onclick={clearQuery}>Clear</button>
        {/if}
      </div>
    </label>

    <details class="mt-3">
      <summary class="cursor-pointer text-sm text-ink-500">Query operators &amp; syntax</summary>
      <div class="mt-2 text-xs space-y-1 font-mono">
        <div><span class="text-accent-600">topic:</span><span>&lt;slug&gt;</span> — restrict to one topic (e.g. <code>topic:essence-prime</code>)</div>
        <div><span class="text-accent-600">module:</span><span>&lt;id&gt;</span> — search · adversarial · csp · logic · sat</div>
        <div><span class="text-accent-600">kind:</span><span>&lt;k&gt;</span> — topic · section · glossary · example · flashcard · pitfall</div>
        <div><span class="text-accent-600">diff:</span><span>&lt;d&gt;</span> — basic · intermediate · advanced (for examples)</div>
        <div><span class="text-accent-600">+term</span> — must contain this term</div>
        <div><span class="text-accent-600">-term</span> — exclude this term</div>
        <div><span class="text-accent-600">"phrase"</span> — exact phrase match</div>
        <div><span class="text-accent-600">/pattern/</span> — regex mode (wrap whole query)</div>
      </div>
    </details>

    {#if !query.trim()}
      <div class="mt-4">
        <div class="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-2">Try one of these</div>
        <div class="flex flex-wrap gap-2">
          {#each exampleQueries as ex}
            <button class="chip hover:bg-accent-100 dark:hover:bg-accent-900/40 cursor-pointer font-mono text-[11px]" onclick={() => (query = ex.q)}>
              {ex.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  {#if results}
    <div class="flex flex-wrap items-center gap-2 my-4 text-xs">
      {#if results.intent !== 'unknown'}
        <span class="chip {intentColour(results.intent)}">Intent: {intentDescriptions[results.intent]}</span>
      {/if}
      {#if results.expanded.length > 0 && results.expanded.length !== (results.parsed.tokens.length)}
        <span class="chip">Expanded {results.expanded.length} tokens (synonyms applied)</span>
      {/if}
      {#if results.parsed.topic}<span class="chip">topic = {results.parsed.topic}</span>{/if}
      {#if results.parsed.module}<span class="chip">module = {results.parsed.module}</span>{/if}
      {#if results.parsed.kind}<span class="chip">kind = {results.parsed.kind}</span>{/if}
      {#if results.parsed.diff}<span class="chip">difficulty = {results.parsed.diff}</span>{/if}
      {#if results.parsed.regex}<span class="chip">regex mode</span>{/if}
      {#if results.parsed.required.length > 0}<span class="chip">required: {results.parsed.required.join(', ')}</span>{/if}
      {#if results.parsed.excluded.length > 0}<span class="chip">excluded: {results.parsed.excluded.join(', ')}</span>{/if}
      <span class="ml-auto text-ink-500">{filteredResults.length} of {results.results.length} results</span>
    </div>

    <!-- Kind filter chips -->
    <div class="flex flex-wrap gap-1 mb-4">
      {#each ['topic','section','glossary','example','flashcard','pitfall'] as k}
        {@const count = results.results.filter((r) => r.item.kind === k).length}
        <button
          class="chip cursor-pointer {kindFilters.has(k) ? 'bg-accent-200 dark:bg-accent-800 !text-accent-900 dark:!text-accent-100' : ''}"
          onclick={() => toggleKind(k)}
          disabled={count === 0}
          style:opacity={count === 0 ? '0.4' : '1'}
        >
          {kindIcon(k)} {kindLabel(k)} ({count})
        </button>
      {/each}
      {#if kindFilters.size > 0}
        <button class="text-xs underline text-ink-500 ml-2" onclick={() => (kindFilters = new Set())}>Clear filters</button>
      {/if}
    </div>

    {#if filteredResults.length === 0}
      <div class="card text-center py-12 text-ink-500">
        No results match. Try removing filters, rephrasing, or using broader terms.
      </div>
    {/if}

    <div class="space-y-3">
      {#each filteredResults as r (r.item.id)}
        {@const opened = expandedIds.has(r.item.id)}
        <div class="card">
          <button class="w-full text-left flex items-start gap-3 cursor-pointer" onclick={() => toggleExpand(r.item.id)}>
            <span class="text-lg shrink-0">{kindIcon(r.item.kind)}</span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap gap-2 items-center text-xs mb-1">
                <span class="chip">{kindLabel(r.item.kind)}</span>
                {#if r.item.topicTitle}
                  <a class="chip hover:bg-accent-100 dark:hover:bg-accent-900/40" href={href('/topic/' + r.item.topicSlug, r.item.sectionId)} onclick={(e) => e.stopPropagation()}>{r.item.topicTitle}</a>
                {/if}
                {#if r.item.difficulty}<span class="chip">{r.item.difficulty}</span>{/if}
                {#if r.item.marks}<span class="chip">{r.item.marks} marks</span>{/if}
                <span class="ml-auto text-ink-400 font-mono">score {r.score.toFixed(2)}</span>
              </div>
              <div class="font-medium leading-snug"><InlineMd src={r.item.title} /></div>
              <div class="text-sm text-ink-600 dark:text-ink-300 mt-1 leading-snug">{@html highlightSnippet(r.snippet, r.matchedTokens)}</div>
            </div>
            <span class="text-ink-400 ml-2">{opened ? '▾' : '▸'}</span>
          </button>
          {#if opened && r.item.fullAnswer}
            <div class="mt-4 pt-3 border-t border-ink-200 dark:border-ink-700">
              {#if r.item.question}
                <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Question</div>
                <div class="prose max-w-none mb-3"><Md src={r.item.question} /></div>
                <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Answer</div>
              {/if}
              <div class="prose max-w-none"><Md src={r.item.fullAnswer} /></div>
              <div class="mt-3 text-xs">
                <a class="text-accent-600 hover:underline" href={href('/topic/' + (r.item.topicSlug ?? ''), r.item.sectionId)}>Open in topic →</a>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</article>
