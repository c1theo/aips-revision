<script lang="ts">
  import { onMount } from 'svelte';
  import { allTopics } from '../content';
  import { href } from '../router';
  import Md from '../components/Md.svelte';
  import InlineMd from '../components/InlineMd.svelte';
  import { curatedQuestions } from '../curatedPastPapers';

  interface Question {
    id: string;
    paperYear: string;
    topicSlug: string;
    question: string;
    answer: string;
    createdAt: number;
  }

  const STORAGE_KEY = 'aips-past-papers-v1';
  let questions = $state<Question[]>([]);
  let editing = $state<Question | null>(null);
  let topicFilter = $state<string>('all');

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) questions = JSON.parse(raw);
    } catch (e) {}
  });

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(questions)); } catch (e) {}
  }

  function startNew() {
    editing = {
      id: crypto.randomUUID(),
      paperYear: '',
      topicSlug: allTopics[0].slug,
      question: '',
      answer: '',
      createdAt: Date.now(),
    };
  }

  function saveEdit() {
    if (!editing) return;
    const idx = questions.findIndex((q) => q.id === editing!.id);
    if (idx >= 0) questions[idx] = editing!;
    else questions.push(editing!);
    questions = [...questions];
    save();
    editing = null;
  }

  function remove(id: string) {
    if (!confirm('Delete this question?')) return;
    questions = questions.filter((q) => q.id !== id);
    save();
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aips-past-papers.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const text = await f.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        questions = [...questions, ...data.filter((q: any) => q.id && q.question)];
        save();
      }
    } catch (err) {
      alert('Invalid JSON');
    }
  }
</script>

<article class="max-w-3xl">
  <h1>Past papers</h1>
  <p class="text-ink-600 dark:text-ink-300">
    A growing question bank. Add questions as you encounter them; write a model answer.
    Stored locally; you can export/import to share or back up.
  </p>

  <div class="flex gap-2 my-4 flex-wrap">
    <button class="btn btn-primary" onclick={startNew}>+ Add question</button>
    <button class="btn" onclick={exportJSON}>Export</button>
    <label class="btn">
      Import
      <input type="file" accept="application/json" class="hidden" onchange={importJSON} />
    </label>
  </div>

  {#if editing}
    <div class="card my-4 space-y-3">
      <div class="grid sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs text-ink-500">Year/Paper (e.g. 2023, Mock 1)</span>
          <input class="w-full px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={editing.paperYear} />
        </label>
        <label class="block">
          <span class="text-xs text-ink-500">Topic</span>
          <select class="w-full px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={editing.topicSlug}>
            {#each allTopics as t}
              <option value={t.slug}>{t.title}</option>
            {/each}
          </select>
        </label>
      </div>
      <label class="block">
        <span class="text-xs text-ink-500">Question</span>
        <textarea class="w-full px-2 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 font-mono text-sm" rows="6" bind:value={editing.question}></textarea>
      </label>
      <label class="block">
        <span class="text-xs text-ink-500">Model answer (Markdown supported)</span>
        <textarea class="w-full px-2 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 font-mono text-sm" rows="8" bind:value={editing.answer}></textarea>
      </label>
      <div class="flex gap-2">
        <button class="btn btn-primary" onclick={saveEdit}>Save</button>
        <button class="btn" onclick={() => (editing = null)}>Cancel</button>
      </div>
    </div>
  {/if}

  <div class="flex flex-wrap gap-2 items-center my-4 text-xs">
    <span class="text-ink-500">Filter by topic:</span>
    <button class="btn btn-sm {topicFilter === 'all' ? 'btn-primary' : ''}" onclick={() => (topicFilter = 'all')}>All</button>
    {#each allTopics as t}
      <button class="btn btn-sm {topicFilter === t.slug ? 'btn-primary' : ''}" onclick={() => (topicFilter = t.slug)}>{t.title}</button>
    {/each}
  </div>

  <h2 class="text-lg font-semibold mt-6 mb-2">Curated questions ({curatedQuestions.filter((q) => topicFilter === 'all' || q.topicSlug === topicFilter).length})</h2>
  <p class="text-sm text-ink-500 mb-3">Hand-authored exam-style questions with full model answers. Drawn from typical AIMA / CSP / SAT topics.</p>

  <div class="space-y-3">
    {#each curatedQuestions.filter((q) => topicFilter === 'all' || q.topicSlug === topicFilter) as q (q.id)}
      <details class="card">
        <summary class="cursor-pointer">
          <span class="chip !bg-violet-100 dark:!bg-violet-900/40 !text-violet-800 dark:!text-violet-200">{q.paperYear}</span>
          <span class="chip ml-2">{allTopics.find((t) => t.slug === q.topicSlug)?.title ?? q.topicSlug}</span>
          <div class="text-sm text-ink-700 dark:text-ink-200 mt-1"><InlineMd src={q.question.split('\n')[0].slice(0, 220)} />{q.question.length > 220 ? '…' : ''}</div>
        </summary>
        <div class="mt-3">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Question</div>
          <div class="prose max-w-none"><Md src={q.question} /></div>
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1 mt-4">Model answer</div>
          <div class="prose max-w-none"><Md src={q.answer} /></div>
          <div class="mt-3"><a class="btn btn-sm" href={href('/topic/' + q.topicSlug)}>Open related topic →</a></div>
        </div>
      </details>
    {/each}
  </div>

  <h2 class="text-lg font-semibold mt-10 mb-2">Your questions ({questions.length})</h2>

  <div class="space-y-3">
    {#each questions as q (q.id)}
      <details class="card">
        <summary class="cursor-pointer">
          <span class="font-medium">{q.paperYear || 'Untitled paper'}</span>
          <span class="chip ml-2">{allTopics.find((t) => t.slug === q.topicSlug)?.title ?? q.topicSlug}</span>
          <div class="text-sm text-ink-600 dark:text-ink-300 mt-1 truncate">{q.question}</div>
        </summary>
        <div class="mt-3 prose max-w-none">
          <h4>Question</h4>
          <Md src={q.question} />
          <h4>Model answer</h4>
          <Md src={q.answer} />
        </div>
        <div class="mt-3 flex gap-2">
          <a class="btn btn-sm" href={href('/topic/' + q.topicSlug)}>Open topic →</a>
          <button class="btn btn-sm" onclick={() => (editing = { ...q })}>Edit</button>
          <button class="btn btn-sm" onclick={() => remove(q.id)}>Delete</button>
        </div>
      </details>
    {/each}
    {#if questions.length === 0 && !editing}
      <div class="text-sm text-ink-500 italic">No personal questions yet. Add one above (or import from a JSON export).</div>
    {/if}
  </div>
</article>
