<script lang="ts">
  import Md from './Md.svelte';
  // Shows an exam-paper-style answer derived from a visualiser's current run.
  // Each visualiser passes a markdown-formatted string `answer` plus a short
  // `summary` line. Open/closed state controlled by user.

  let { answer, summary = 'Click to expand the exam-ready writeup based on the current run' } = $props<{ answer: string; summary?: string }>();
</script>

<details class="my-4 border-l-4 border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/15 rounded-r pl-4 pr-3 py-2">
  <summary class="cursor-pointer font-semibold text-emerald-700 dark:text-emerald-300 select-none">
    📝 Exam-ready answer from this run
    <span class="text-xs font-normal text-ink-500 ml-2">{summary}</span>
  </summary>
  <div class="mt-3 prose prose-sm dark:prose-invert max-w-none">
    <Md src={answer} />
  </div>
</details>
