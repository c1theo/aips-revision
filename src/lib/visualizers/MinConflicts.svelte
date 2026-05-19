<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import { untrack } from 'svelte';
  type Problem = 'queens' | 'colour';
  let problem = $state<Problem>('queens');
  let n = $state(20);
  let k = $state(3);
  let edgesText = $state('1-2\n1-3\n2-3\n2-4\n3-4\n4-5\n5-1');
  let assignment = $state<number[]>([]);
  let history = $state<number[]>([]);
  let steps = $state(0);
  let trace = $state<string[]>([]);

  function parseEdges(): [number, number][] {
    return edgesText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [a, b] = l.split(/[-,\s]+/).filter(Boolean).map(Number);
      return [a - 1, b - 1] as [number, number];
    }).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  }

  function makeAssignment(): number[] {
    if (problem === 'queens') {
      return Array.from({ length: n }, () => Math.floor(Math.random() * n));
    }
    const numV = Math.max(2, Math.max(...parseEdges().flat()) + 1);
    return Array.from({ length: numV }, () => Math.floor(Math.random() * k));
  }
  function init() {
    const a = makeAssignment();
    assignment = a;
    history = [conflicts(a)];
    steps = 0;
    trace = [`Initial random assignment. Total conflicts: ${conflicts(a)}.`];
  }
  init();
  $effect(() => {
    // Track these deps without reading state in writes
    problem; n; k; edgesText;
    untrack(() => init());
  });

  function conflicts(a: number[]): number {
    let c = 0;
    if (problem === 'queens') {
      for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
          if (a[i] === a[j] || Math.abs(a[i] - a[j]) === j - i) c += 1;
    } else {
      const edges = parseEdges();
      for (const [u, v] of edges) if (a[u] === a[v]) c += 1;
    }
    return c;
  }

  function conflictsAt(a: number[], r: number, c: number): number {
    let n_ = 0;
    if (problem === 'queens') {
      for (let i = 0; i < a.length; i++) {
        if (i === r) continue;
        if (a[i] === c || Math.abs(a[i] - c) === Math.abs(i - r)) n_ += 1;
      }
    } else {
      const edges = parseEdges();
      for (const [u, v] of edges) {
        if (u === r && a[v] === c) n_ += 1;
        else if (v === r && a[u] === c) n_ += 1;
      }
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
    const beforeVal = assignment[r];
    const beforeConfAtR = conflictsAt(assignment, r, beforeVal);
    let best: number[] = [];
    let bestN = Infinity;
    const numVals = problem === 'queens' ? n : k;
    for (let c = 0; c < numVals; c++) {
      const ck = conflictsAt(assignment, r, c);
      if (ck < bestN) { bestN = ck; best = [c]; }
      else if (ck === bestN) best.push(c);
    }
    const newVal = best[Math.floor(Math.random() * best.length)];
    assignment[r] = newVal;
    assignment = assignment;
    steps += 1;
    const after = conflicts(assignment);
    history = [...history, after].slice(-200);
    const varName = problem === 'queens' ? `row ${r}` : `V${r + 1}`;
    const valLabel = problem === 'queens' ? `col ${newVal}` : `colour ${newVal + 1}`;
    const oldLabel = problem === 'queens' ? `col ${beforeVal}` : `colour ${beforeVal + 1}`;
    trace = [...trace, `Step ${steps}: ${varName} was conflicted (${beforeConfAtR} attacks at ${oldLabel}). Best move: ${valLabel} (${bestN} conflicts). Total now ${after}.`].slice(-100);
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
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden text-xs">
      <button class="px-2 py-1 {problem === 'queens' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'queens')}>N-Queens</button>
      <button class="px-2 py-1 {problem === 'colour' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'colour')}>Graph colouring</button>
    </div>
    {#if problem === 'queens'}
      <label class="text-xs">n =
        <input type="number" min="4" max="120" bind:value={n} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
    {:else}
      <label class="text-xs">k =
        <input type="number" min="2" max="8" bind:value={k} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
    {/if}
    <button class="btn btn-sm" onclick={init}>Random init</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
    <span class="text-xs text-ink-500 ml-3">steps: <b>{steps}</b> · conflicts: <b>{conflicts(assignment)}</b></span>
  </div>

  {#if problem === 'colour'}
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Edges (1-based, format <code>A-B</code>)</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="3" bind:value={edgesText}></textarea>
    </label>
    <div class="text-xs font-mono">
      Current colours:
      {#each assignment as a, i}
        {@const colours = ['#fecaca','#bbf7d0','#bfdbfe','#fef3c7','#fed7aa','#e9d5ff','#fbcfe8','#a7f3d0']}
        <span class="inline-flex items-center gap-1 mr-2">
          <span class="font-sans">V{i + 1}=</span>
          <span class="inline-block w-4 h-4 rounded border border-ink-400" style:background-color={colours[a % 8]}></span>
        </span>
      {/each}
    </div>
  {/if}

  {#if problem === 'queens'}
  <div class="inline-block border border-ink-300 dark:border-ink-700 max-w-full overflow-auto">
    {#each Array(n) as _, r}
      {@const cellPx = Math.max(4, Math.min(24, Math.floor(640 / n)))}
      <div class="flex">
        {#each Array(n) as _, c}
          {@const dark = (r + c) % 2 === 1}
          {@const isQueen = assignment[r] === c}
          {@const conflict = isQueen && conflictsAt(assignment, r, c) > 0}
          <div class="flex items-center justify-center {dark ? 'bg-ink-200 dark:bg-ink-800' : 'bg-ink-50 dark:bg-ink-900'} {conflict ? '!bg-rose-300' : ''}" style="width: {cellPx}px; height: {cellPx}px; font-size: {Math.max(8, cellPx - 4)}px;">
            {#if isQueen}♛{/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
  {/if}

  <div>
    <div class="text-xs font-semibold mb-1">Conflicts over time</div>
    <svg viewBox="0 0 600 80" preserveAspectRatio="none" class="w-full h-20 border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
      {#if history.length > 1}
        {@const maxH = Math.max(...history, 1)}
        <polyline
          fill="none" stroke="#3b82f6" stroke-width="1.5"
          points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 600},${80 - (h / maxH) * 70 - 5}`).join(' ')}
        />
      {/if}
    </svg>
  </div>

  <div class="card !p-3">
    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Live trace ({trace.length} events)</div>
    <ol class="font-mono text-[11px] space-y-0.5 list-none p-0 max-h-44 overflow-y-auto">
      {#each trace.slice().reverse() as t, i}
        <li class="{i === 0 ? 'font-semibold text-accent-700 dark:text-accent-300' : 'text-ink-500'}"><MathText src={t} /></li>
      {/each}
    </ol>
  </div>
</div>
