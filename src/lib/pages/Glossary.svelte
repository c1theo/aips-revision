<script lang="ts">
  import { glossary } from '../glossary';

  let query = $state('');
  const filtered = $derived(
    query.trim() === ''
      ? glossary
      : glossary.filter((g) =>
          (g.term + ' ' + g.def).toLowerCase().includes(query.toLowerCase()),
        ),
  );

  const byLetter = $derived(
    filtered.reduce<Record<string, typeof glossary>>((acc, g) => {
      const k = g.term[0].toUpperCase();
      (acc[k] ??= []).push(g);
      return acc;
    }, {}),
  );
  const letters = $derived(Object.keys(byLetter).sort());
</script>

<article class="max-w-3xl">
  <h1>Glossary</h1>
  <p class="text-ink-600 dark:text-ink-300">Every key term used across the modules, with one-line definitions and links.</p>

  <input
    type="text"
    placeholder="Filter…"
    bind:value={query}
    class="w-full mt-4 px-3 py-2 rounded-md border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900"
  />

  <div class="mt-6 space-y-6">
    {#each letters as L}
      <section>
        <h2 class="text-2xl font-bold border-b border-ink-200 dark:border-ink-800 pb-1">{L}</h2>
        <dl class="mt-3 space-y-2">
          {#each byLetter[L] as g}
            <div>
              <dt class="font-semibold inline">{g.term}.</dt>
              <dd class="inline ml-1 text-ink-700 dark:text-ink-300">{g.def}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {/each}
  </div>
</article>
