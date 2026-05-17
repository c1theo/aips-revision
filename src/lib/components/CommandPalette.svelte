<script lang="ts">
  import { onMount } from 'svelte';
  import { search } from '../ask/score';
  import type { Item, ItemKind } from '../ask/corpus';
  import { navigate, href } from '../router';
  import InlineMd from './InlineMd.svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let query = $state('');
  let inputEl: HTMLInputElement | undefined = $state();
  let highlighted = $state(0);

  const results = $derived(query.trim() ? search(query, { limit: 25 }) : null);

  onMount(() => { inputEl?.focus(); });

  function pick(item: Item) {
    if (item.topicSlug) {
      navigate('/topic/' + item.topicSlug, item.sectionId);
    } else if (item.kind === 'glossary') {
      navigate('/glossary');
    } else {
      // fallback — go to Ask page with the query preserved
      navigate('/ask');
    }
    onClose();
  }

  function goAsk() {
    navigate('/ask');
    onClose();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    const list = results?.results ?? [];
    if (e.key === 'ArrowDown') { e.preventDefault(); highlighted = Math.min(highlighted + 1, list.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlighted = Math.max(0, highlighted - 1); }
    else if (e.key === 'Enter') {
      if (e.shiftKey) { e.preventDefault(); goAsk(); return; }
      if (list[highlighted]) { e.preventDefault(); pick(list[highlighted].item); }
    }
  }

  function kindIcon(k: ItemKind): string {
    return { topic: '📘', section: '📄', glossary: '🔤', example: '✏️', flashcard: '🃏', pitfall: '⚠️' }[k];
  }
</script>

<div class="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" role="dialog" aria-modal="true">
  <button class="absolute inset-0 bg-black/40" aria-label="close" onclick={onClose}></button>
  <div class="relative w-full max-w-2xl card !p-0 overflow-hidden">
    <div class="border-b border-ink-200 dark:border-ink-700 p-3 flex items-center gap-2">
      <span class="text-ink-500">🔮</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        onkeydown={onKey}
        placeholder="Search anything · synonyms, operators, regex supported · ⇧↵ for full Ask page"
        class="flex-1 bg-transparent outline-none text-base"
      />
    </div>

    <ul class="max-h-[60vh] overflow-y-auto text-sm list-none p-0 m-0">
      {#if results}
        {#each results.results.slice(0, 25) as r, i (r.item.id)}
          <li>
            <button
              class="w-full text-left px-3 py-2 flex items-start gap-3 hover:bg-ink-100 dark:hover:bg-ink-800 {i === highlighted ? 'bg-accent-50 dark:bg-accent-900/20' : ''}"
              onclick={() => pick(r.item)}
              onmouseenter={() => (highlighted = i)}
            >
              <span class="text-base mt-0.5">{kindIcon(r.item.kind)}</span>
              <div class="min-w-0 flex-1">
                <div class="font-medium truncate"><InlineMd src={r.item.title} /></div>
                <div class="text-xs text-ink-500 truncate">{r.snippet.slice(0, 140)}</div>
              </div>
              {#if r.item.topicTitle}<span class="chip">{r.item.topicTitle.replace('Module ', 'M').split(' · ')[0]}</span>{/if}
            </button>
          </li>
        {/each}
      {/if}
      {#if results && results.results.length === 0}
        <li class="px-3 py-6 text-center text-sm text-ink-500">No matches. Try the <button class="underline text-accent-600" onclick={goAsk}>full Ask page</button> for richer results.</li>
      {/if}
      {#if !results}
        <li class="px-3 py-6 text-center text-sm text-ink-500">
          Type to search · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">↑↓</kbd> navigate · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">↵</kbd> open · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">⇧↵</kbd> full Ask page · <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded">Esc</kbd> close
        </li>
      {/if}
    </ul>

    <div class="border-t border-ink-200 dark:border-ink-700 px-3 py-2 text-xs text-ink-500 flex justify-between items-center">
      <span>{results ? `${results.results.length} results` : 'Operators: topic:, kind:, diff:, +req, -excl, "phrase", /regex/'}</span>
      <button class="text-accent-600 hover:underline" onclick={goAsk}>Open full Ask page →</button>
    </div>
  </div>
</div>
