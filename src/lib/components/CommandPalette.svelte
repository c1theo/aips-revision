<script lang="ts">
  import { onMount } from 'svelte';
  import { fuzzySearch, regexSearch, type SearchDoc } from '../search';
  import { navigate } from '../router';

  let { onClose } = $props<{ onClose: () => void }>();

  let query = $state('');
  let mode = $state<'fuzzy' | 'regex'>('fuzzy');
  let inputEl: HTMLInputElement | undefined = $state();
  let highlighted = $state(0);

  const results = $derived(mode === 'regex' ? regexSearch(query) : fuzzySearch(query));

  onMount(() => {
    inputEl?.focus();
  });

  function pick(d: SearchDoc) {
    navigate(d.path, d.hash);
    onClose();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); highlighted = Math.min(highlighted + 1, results.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlighted = Math.max(0, highlighted - 1); }
    else if (e.key === 'Enter') {
      if (results[highlighted]) { e.preventDefault(); pick(results[highlighted]); }
    }
  }

  function kindIcon(k: SearchDoc['kind']) {
    return { topic: '📘', section: '📄', glossary: '🔤', page: '⚙️' }[k];
  }

  function snippet(body: string, max = 140) {
    if (!body) return '';
    const trimmed = body.length > max ? body.slice(0, max - 1) + '…' : body;
    if (!query.trim() || mode === 'regex') return trimmed;
    return trimmed;
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
  role="dialog"
  aria-modal="true"
>
  <button class="absolute inset-0 bg-black/40" aria-label="close" onclick={onClose}></button>
  <div class="relative w-full max-w-2xl card !p-0 overflow-hidden">
    <div class="border-b border-ink-200 dark:border-ink-700 p-3 flex items-center gap-2">
      <span class="text-ink-500">{mode === 'regex' ? '/.*/' : '🔍'}</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        onkeydown={onKey}
        placeholder={mode === 'regex' ? 'Regex pattern…' : 'Search topics, sections, glossary…'}
        class="flex-1 bg-transparent outline-none text-base"
      />
      <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden text-xs">
        <button class="px-2 py-1 {mode === 'fuzzy' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-200' : ''}" onclick={() => (mode = 'fuzzy')}>fuzzy</button>
        <button class="px-2 py-1 {mode === 'regex' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-200' : ''}" onclick={() => (mode = 'regex')}>regex</button>
      </div>
    </div>

    <ul class="max-h-[60vh] overflow-y-auto text-sm list-none p-0 m-0">
      {#each results.slice(0, 100) as r, i}
        <li>
          <button
            class="w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-ink-100 dark:hover:bg-ink-800 {i === highlighted ? 'bg-accent-50 dark:bg-accent-900/20' : ''}"
            onclick={() => pick(r)}
            onmouseenter={() => (highlighted = i)}
          >
            <span class="text-base mt-0.5">{kindIcon(r.kind)}</span>
            <div class="min-w-0 flex-1">
              <div class="font-medium truncate">{r.title}</div>
              <div class="text-xs text-ink-500 truncate">{snippet(r.body)}</div>
            </div>
            <span class="chip">{r.kind}</span>
          </button>
        </li>
      {/each}
      {#if results.length === 0 && query.trim() !== ''}
        <li class="px-3 py-6 text-center text-sm text-ink-500">No results.</li>
      {/if}
      {#if query.trim() === ''}
        <li class="px-3 py-6 text-center text-sm text-ink-500">
          Type to search · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">↑↓</kbd> navigate · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">↵</kbd> open · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">Esc</kbd> close
        </li>
      {/if}
    </ul>
  </div>
</div>
