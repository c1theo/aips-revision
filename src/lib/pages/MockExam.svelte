<script lang="ts">
  import { onMount } from 'svelte';
  import { allTopics } from '../content';
  import Md from '../components/Md.svelte';
  import InlineMd from '../components/InlineMd.svelte';
  import type { ExampleQuestion } from '../types';

  const allExamples = $derived(allTopics.flatMap((t) => (t.examples ?? []).map((e) => ({ ...e, topicTitle: t.title, topicSlug: t.slug }))));

  let durationMins = $state(60);
  let questionCount = $state(5);
  let difficultyFilter = $state<'any' | 'basic' | 'intermediate' | 'advanced'>('any');
  let active = $state(false);
  let questions = $state<(ExampleQuestion & { topicTitle: string; topicSlug: string })[]>([]);
  let currentIdx = $state(0);
  let revealedAnswers = $state<Set<string>>(new Set());
  let selfGrades = $state<Record<string, 'unmarked' | 'wrong' | 'partial' | 'right'>>({});
  let startTime = $state<number | null>(null);
  let elapsedSeconds = $state(0);
  let intervalId: any = null;

  function start() {
    let pool = allExamples;
    if (difficultyFilter !== 'any') pool = pool.filter((e) => e.difficulty === difficultyFilter);
    // Pick random N
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    questions = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    revealedAnswers = new Set();
    selfGrades = {};
    currentIdx = 0;
    startTime = Date.now();
    elapsedSeconds = 0;
    active = true;
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => { elapsedSeconds = Math.floor((Date.now() - startTime!) / 1000); }, 1000);
  }

  function stop() {
    active = false;
    if (intervalId) clearInterval(intervalId);
  }

  function reveal(id: string) { revealedAnswers.add(id); revealedAnswers = new Set(revealedAnswers); }
  function grade(id: string, g: 'wrong' | 'partial' | 'right') { selfGrades[id] = g; selfGrades = { ...selfGrades }; }

  const totalMarks = $derived(questions.reduce((s, q) => s + (q.marks ?? 0), 0));
  const earnedMarks = $derived(questions.reduce((s, q) => {
    const g = selfGrades[q.id];
    if (g === 'right') return s + (q.marks ?? 0);
    if (g === 'partial') return s + (q.marks ?? 0) * 0.5;
    return s;
  }, 0));
  const allGraded = $derived(questions.length > 0 && questions.every((q) => selfGrades[q.id]));

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60), r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }

  const remainingSeconds = $derived(Math.max(0, durationMins * 60 - elapsedSeconds));
  const overtime = $derived(elapsedSeconds > durationMins * 60);
</script>

<article class="max-w-4xl">
  <h1>Mock exam</h1>

  {#if !active}
    <p class="text-ink-600 dark:text-ink-300">
      Randomly select N exam-style questions from the bank. Timer counts down; reveal model answers when you've finished writing your own attempt; self-grade right / partial / wrong.
      Useful for practice under exam-like pressure.
    </p>

    <div class="card my-6 space-y-3">
      <label class="block">
        <span class="text-xs text-ink-500 font-semibold">Duration (minutes)</span>
        <input type="number" min="10" max="180" bind:value={durationMins} class="w-full mt-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
      <label class="block">
        <span class="text-xs text-ink-500 font-semibold">Number of questions</span>
        <input type="number" min="1" max="20" bind:value={questionCount} class="w-full mt-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
      <label class="block">
        <span class="text-xs text-ink-500 font-semibold">Difficulty</span>
        <select bind:value={difficultyFilter} class="w-full mt-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
          <option value="any">Any (random mix)</option>
          <option value="basic">Basic only</option>
          <option value="intermediate">Intermediate only</option>
          <option value="advanced">Advanced only</option>
        </select>
      </label>
      <button class="btn btn-primary" onclick={start}>Start exam</button>
    </div>

    <div class="text-sm text-ink-500">
      Question bank has {allExamples.length} exam-style questions to draw from.
    </div>
  {:else}
    <div class="sticky top-0 z-10 bg-white dark:bg-ink-950 py-2 -mt-4 mb-4 border-b border-ink-200 dark:border-ink-800">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-2xl font-mono font-bold {overtime ? 'text-rose-600' : remainingSeconds < 300 ? 'text-amber-600' : 'text-ink-700 dark:text-ink-200'}">{fmtTime(overtime ? elapsedSeconds - durationMins * 60 : remainingSeconds)}</span>
        <span class="text-xs text-ink-500">{overtime ? 'OVER' : 'remaining'}</span>
        <span class="text-sm">Q {currentIdx + 1}/{questions.length}</span>
        <span class="text-sm">Marks: {earnedMarks.toFixed(1)} / {totalMarks}</span>
        <button class="btn btn-sm ml-auto" onclick={stop}>End exam</button>
      </div>
    </div>

    <div class="flex gap-2 mb-4 flex-wrap">
      {#each questions as q, i}
        <button
          class="w-8 h-8 rounded text-xs font-mono border {i === currentIdx ? 'bg-accent-600 text-white border-accent-700' : selfGrades[q.id] === 'right' ? 'bg-emerald-200 dark:bg-emerald-800 border-emerald-400' : selfGrades[q.id] === 'partial' ? 'bg-amber-200 dark:bg-amber-800 border-amber-400' : selfGrades[q.id] === 'wrong' ? 'bg-rose-200 dark:bg-rose-800 border-rose-400' : 'bg-ink-100 dark:bg-ink-800 border-ink-300 dark:border-ink-700'}"
          onclick={() => (currentIdx = i)}
        >{i + 1}</button>
      {/each}
    </div>

    {#if questions[currentIdx]}
      {@const q = questions[currentIdx]}
      <div class="card mb-4">
        <div class="flex items-center gap-2 mb-2 text-xs">
          <span class="chip">{q.topicTitle}</span>
          <span class="chip {q.difficulty === 'basic' ? '!bg-emerald-100 dark:!bg-emerald-900/40 !text-emerald-800 dark:!text-emerald-200' : q.difficulty === 'intermediate' ? '!bg-amber-100 dark:!bg-amber-900/40 !text-amber-800 dark:!text-amber-200' : '!bg-rose-100 dark:!bg-rose-900/40 !text-rose-800 dark:!text-rose-200'}">{q.difficulty}</span>
          {#if q.marks}<span class="chip">{q.marks} marks</span>{/if}
        </div>
        <div class="prose max-w-none"><Md src={q.question} /></div>
      </div>

      <div class="card mb-4">
        <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Your attempt</div>
        <textarea
          class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 min-h-[200px]"
          placeholder="Write your answer here — not saved, just a scratch pad."
        ></textarea>
      </div>

      {#if !revealedAnswers.has(q.id)}
        <button class="btn btn-primary" onclick={() => reveal(q.id)}>Reveal model answer</button>
      {:else}
        <div class="card mb-4">
          <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Model answer</div>
          <div class="prose max-w-none"><Md src={q.answer} /></div>
        </div>
        <div class="flex gap-2 items-center">
          <span class="text-sm">Self-grade:</span>
          <button class="btn btn-sm !bg-rose-100 dark:!bg-rose-900/40 {selfGrades[q.id] === 'wrong' ? 'ring-2 ring-rose-500' : ''}" onclick={() => grade(q.id, 'wrong')}>Wrong (0)</button>
          <button class="btn btn-sm !bg-amber-100 dark:!bg-amber-900/40 {selfGrades[q.id] === 'partial' ? 'ring-2 ring-amber-500' : ''}" onclick={() => grade(q.id, 'partial')}>Partial (½)</button>
          <button class="btn btn-sm !bg-emerald-100 dark:!bg-emerald-900/40 {selfGrades[q.id] === 'right' ? 'ring-2 ring-emerald-500' : ''}" onclick={() => grade(q.id, 'right')}>Right (full)</button>
        </div>
      {/if}

      <div class="flex justify-between mt-6">
        <button class="btn" disabled={currentIdx === 0} onclick={() => (currentIdx -= 1)}>← Previous</button>
        <button class="btn btn-primary" disabled={currentIdx >= questions.length - 1} onclick={() => (currentIdx += 1)}>Next →</button>
      </div>
    {/if}

    {#if allGraded}
      <div class="card mt-8 !border-emerald-400 dark:!border-emerald-600 !bg-emerald-50 dark:!bg-emerald-900/20">
        <div class="text-lg font-bold">Done! Self-graded total: {earnedMarks.toFixed(1)} / {totalMarks}.</div>
        <div class="text-sm mt-1">That's {totalMarks > 0 ? ((earnedMarks / totalMarks) * 100).toFixed(0) : 0}% — {fmtTime(elapsedSeconds)} elapsed.</div>
        <button class="btn btn-primary mt-3" onclick={stop}>Finish</button>
      </div>
    {/if}
  {/if}
</article>
