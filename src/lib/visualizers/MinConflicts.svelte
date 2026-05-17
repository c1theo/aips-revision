<script lang="ts">
  // Min-conflicts for N-queens
  let n = $state(20);
  let assignment = $state<number[]>([]);
  let history = $state<number[]>([]);
  let steps = $state(0);

  function init() {
    assignment = Array.from({ length: n }, () => Math.floor(Math.random() * n));
    history = [conflicts(assignment)];
    steps = 0;
  }
  init();

  function conflicts(a: number[]): number {
    let c = 0;
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++)
        if (a[i] === a[j] || Math.abs(a[i] - a[j]) === j - i) c += 1;
    return c;
  }

  function conflictsAt(a: number[], r: number, c: number): number {
    let n_ = 0;
    for (let i = 0; i < a.length; i++) {
      if (i === r) continue;
      if (a[i] === c || Math.abs(a[i] - c) === Math.abs(i - r)) n_ += 1;
    }
    return n_;
  }

  function rowsInConflict(a: number[]): number[] {
    const out: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (conflictsAt(a, i, a[i]) > 0) out.push(i);
    }
    return out;
  }

  function step(): boolean {
    const rows = rowsInConflict(assignment);
    if (rows.length === 0) return false;
    const r = rows[Math.floor(Math.random() * rows.length)];
    let best: number[] = [];
    let bestN = Infinity;
    for (let c = 0; c < n; c++) {
      const k = conflictsAt(assignment, r, c);
      if (k < bestN) { bestN = k; best = [c]; }
      else if (k === bestN) best.push(c);
    }
    assignment[r] = best[Math.floor(Math.random() * best.length)];
    assignment = assignment;
    steps += 1;
    history = [...history, conflicts(assignment)].slice(-200);
    return true;
  }

  let playing = $state(false);
  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      if (!step()) { playing = false; return; }
      setTimeout(tick, 20);
    };
    tick();
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <label class="text-xs">n =
      <input type="number" min="4" max="40" bind:value={n} onchange={init} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <button class="btn btn-sm" onclick={init}>Random init</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
    <span class="text-xs text-ink-500 ml-3">steps: <b>{steps}</b> · conflicts: <b>{conflicts(assignment)}</b></span>
  </div>

  <div class="inline-block border border-ink-300 dark:border-ink-700">
    {#each Array(n) as _, r}
      <div class="flex">
        {#each Array(n) as _, c}
          {@const dark = (r + c) % 2 === 1}
          {@const isQueen = assignment[r] === c}
          {@const conflict = isQueen && conflictsAt(assignment, r, c) > 0}
          <div class="w-4 h-4 flex items-center justify-center text-[10px] {dark ? 'bg-ink-200 dark:bg-ink-800' : 'bg-ink-50 dark:bg-ink-900'} {conflict ? '!bg-rose-300' : ''}">
            {#if isQueen}♛{/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div>
    <div class="text-xs font-semibold mb-1">Conflicts over time</div>
    <svg width="600" height="80" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
      {#if history.length > 1}
        {@const maxH = Math.max(...history, 1)}
        <polyline
          fill="none" stroke="#3b82f6" stroke-width="1.5"
          points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 600},${80 - (h / maxH) * 70 - 5}`).join(' ')}
        />
      {/if}
    </svg>
  </div>
</div>
