<script lang="ts">
  import { findTopic } from '../content';
  import Md from '../components/Md.svelte';
  import Callout from '../components/Callout.svelte';
  import VizRenderer from '../components/VizRenderer.svelte';
  import NotFound from './NotFound.svelte';
  import { href } from '../router';
  import { allTopics } from '../content';

  let { slug } = $props<{ slug: string }>();
  const topic = $derived(findTopic(slug));
  const idx = $derived(allTopics.findIndex((t) => t.slug === slug));
  const prev = $derived(idx > 0 ? allTopics[idx - 1] : null);
  const next = $derived(idx >= 0 && idx < allTopics.length - 1 ? allTopics[idx + 1] : null);
</script>

{#if !topic}
  <NotFound />
{:else}
  <article class="prose max-w-none">
    <div class="text-sm text-ink-500 mb-1">{topic.module}</div>
    <h1>{topic.title}</h1>
    <p class="text-lg text-ink-600 dark:text-ink-300">{topic.oneLiner}</p>

    <nav class="card not-prose my-6">
      <div class="text-xs uppercase tracking-wider text-ink-500 mb-2 font-semibold">In this topic</div>
      <ul class="text-sm space-y-1 list-none p-0">
        {#each topic.sections as s}
          <li><a class="text-accent-600 dark:text-accent-400 hover:underline" href={href('/topic/' + topic.slug, s.id)}>{s.title}</a></li>
        {/each}
      </ul>
    </nav>

    {#each topic.sections as section}
      <section id={section.id} class="scroll-mt-20">
        <h2>{section.title}</h2>
        {#each section.blocks as block}
          {#if block.kind === 'md'}
            <Md src={block.body} />
          {:else if block.kind === 'callout'}
            <Callout variant={block.variant} title={block.title} body={block.body} />
          {:else if block.kind === 'viz'}
            <VizRenderer viz={block.viz} title={block.title} props={block.props} />
          {/if}
        {/each}
      </section>
    {/each}

    {#if topic.examples && topic.examples.length > 0}
      <section class="mt-12" id="examples">
        <h2>Worked example questions</h2>
        <p class="text-sm text-ink-500">Exam-style questions with full model answers. Reveal answers one at a time, or expand all.</p>
        <div class="space-y-3 mt-4 not-prose">
          {#each topic.examples as ex (ex.id)}
            <details class="card">
              <summary class="cursor-pointer flex items-start gap-2">
                <span class="chip {ex.difficulty === 'basic' ? '!bg-emerald-100 dark:!bg-emerald-900/40 !text-emerald-800 dark:!text-emerald-200' : ex.difficulty === 'intermediate' ? '!bg-amber-100 dark:!bg-amber-900/40 !text-amber-800 dark:!text-amber-200' : '!bg-rose-100 dark:!bg-rose-900/40 !text-rose-800 dark:!text-rose-200'}">{ex.difficulty}</span>
                {#if ex.marks}<span class="chip">{ex.marks} marks</span>{/if}
                <span class="flex-1 font-medium">{ex.question}</span>
              </summary>
              <div class="mt-4 pt-3 border-t border-ink-200 dark:border-ink-700">
                <Md src={ex.answer} />
              </div>
            </details>
          {/each}
        </div>
      </section>
    {/if}

    {#if topic.flashcards && topic.flashcards.length > 0}
      <section class="mt-12">
        <h2>Flashcards for this topic</h2>
        <p class="text-sm text-ink-500">{topic.flashcards.length} cards · review in <a href={href('/flashcards')}>flashcards</a></p>
        <details class="card not-prose mt-3">
          <summary class="cursor-pointer font-medium">Preview cards</summary>
          <ul class="text-sm space-y-2 mt-3 list-none p-0">
            {#each topic.flashcards as f}
              <li class="border-t border-ink-200 dark:border-ink-700 pt-2">
                <div class="font-medium">Q: {f.q}</div>
                <div class="text-ink-600 dark:text-ink-300 mt-1">A: {f.a}</div>
              </li>
            {/each}
          </ul>
        </details>
      </section>
    {/if}

    <nav class="not-prose mt-12 flex items-center justify-between border-t border-ink-200 dark:border-ink-800 pt-6">
      {#if prev}
        <a class="btn" href={href('/topic/' + prev.slug)}>← {prev.title}</a>
      {:else}<span></span>{/if}
      {#if next}
        <a class="btn btn-primary" href={href('/topic/' + next.slug)}>{next.title} →</a>
      {:else}<span></span>{/if}
    </nav>
  </article>
{/if}
