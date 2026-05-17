<script lang="ts">
  import { onMount } from 'svelte';
  import { allFlashcards } from '../content';
  import type { Flashcard } from '../types';
  import InlineMd from '../components/InlineMd.svelte';
  import Md from '../components/Md.svelte';

  // SM-2 lite: easeFactor, interval, repetitions
  interface CardState {
    interval: number;
    easeFactor: number;
    repetitions: number;
    due: number; // ms timestamp
  }

  const STORAGE_KEY = 'aips-flashcards-v1';

  let cardStates: Record<string, CardState> = $state({});
  let filter: 'all' | 'due' = $state('due');
  let showAnswer = $state(false);
  let current = $state<Flashcard | null>(null);
  let sessionAnswered = $state(0);

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) cardStates = JSON.parse(raw);
    } catch (e) {}
    nextCard();
  });

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cardStates)); } catch (e) {}
  }

  function dueCards(): Flashcard[] {
    const now = Date.now();
    return allFlashcards.filter((c) => {
      const s = cardStates[c.id];
      return !s || s.due <= now;
    });
  }

  function nextCard() {
    showAnswer = false;
    const pool = filter === 'due' ? dueCards() : allFlashcards;
    if (pool.length === 0) {
      current = null;
      return;
    }
    current = pool[Math.floor(Math.random() * pool.length)];
  }

  // SM-2 grades: 0=fail, 3=hard, 4=good, 5=easy
  function grade(g: number) {
    if (!current) return;
    const id = current.id;
    let s = cardStates[id] ?? { interval: 0, easeFactor: 2.5, repetitions: 0, due: 0 };
    if (g < 3) {
      s.repetitions = 0;
      s.interval = 1;
    } else {
      s.repetitions += 1;
      if (s.repetitions === 1) s.interval = 1;
      else if (s.repetitions === 2) s.interval = 6;
      else s.interval = Math.round(s.interval * s.easeFactor);
      s.easeFactor = Math.max(1.3, s.easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)));
    }
    s.due = Date.now() + s.interval * 24 * 60 * 60 * 1000;
    cardStates[id] = s;
    cardStates = { ...cardStates };
    save();
    sessionAnswered += 1;
    nextCard();
  }

  function resetAll() {
    if (!confirm('Reset all flashcard progress?')) return;
    cardStates = {};
    save();
    sessionAnswered = 0;
    nextCard();
  }
</script>

<article class="max-w-3xl">
  <h1>Flashcards</h1>
  <p class="text-ink-600 dark:text-ink-300">SM-2 spaced repetition. Progress is saved in your browser.</p>

  <div class="my-4 flex items-center gap-3 flex-wrap">
    <div class="flex gap-1">
      <button class="btn btn-sm {filter === 'due' ? 'btn-primary' : ''}" onclick={() => { filter = 'due'; nextCard(); }}>Due today ({dueCards().length})</button>
      <button class="btn btn-sm {filter === 'all' ? 'btn-primary' : ''}" onclick={() => { filter = 'all'; nextCard(); }}>All cards ({allFlashcards.length})</button>
    </div>
    <span class="text-sm text-ink-500">Answered this session: {sessionAnswered}</span>
    <button class="btn btn-sm ml-auto" onclick={resetAll}>Reset progress</button>
  </div>

  {#if !current}
    <div class="card text-center py-16">
      <div class="text-5xl mb-4">🎉</div>
      <div class="text-lg font-semibold">No cards due!</div>
      <div class="text-sm text-ink-500 mt-2">Come back later or switch to "All cards" to keep practising.</div>
    </div>
  {:else}
    <div class="card my-6 min-h-[280px] flex flex-col">
      <div class="text-xs uppercase tracking-wider text-ink-500 mb-2">{current.topic ?? 'Topic'}</div>
      <div class="text-xl font-medium mb-6"><InlineMd src={current.q} /></div>
      {#if showAnswer}
        <div class="mt-auto border-t border-ink-200 dark:border-ink-700 pt-4 text-ink-700 dark:text-ink-200"><Md src={current.a} /></div>
      {:else}
        <button class="btn btn-primary mt-auto self-start" onclick={() => (showAnswer = true)}>Show answer (Space)</button>
      {/if}
    </div>

    {#if showAnswer}
      <div class="grid grid-cols-4 gap-2">
        <button class="btn !bg-red-100 !border-red-300 dark:!bg-red-900/30 dark:!border-red-700" onclick={() => grade(0)}>Fail (1)</button>
        <button class="btn !bg-orange-100 !border-orange-300 dark:!bg-orange-900/30 dark:!border-orange-700" onclick={() => grade(3)}>Hard (2)</button>
        <button class="btn !bg-emerald-100 !border-emerald-300 dark:!bg-emerald-900/30 dark:!border-emerald-700" onclick={() => grade(4)}>Good (3)</button>
        <button class="btn !bg-blue-100 !border-blue-300 dark:!bg-blue-900/30 dark:!border-blue-700" onclick={() => grade(5)}>Easy (4)</button>
      </div>
    {/if}
  {/if}
</article>

<svelte:window onkeydown={(e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === ' ' && !showAnswer) { e.preventDefault(); showAnswer = true; }
  else if (showAnswer) {
    if (e.key === '1') grade(0);
    else if (e.key === '2') grade(3);
    else if (e.key === '3') grade(4);
    else if (e.key === '4') grade(5);
  }
}} />
