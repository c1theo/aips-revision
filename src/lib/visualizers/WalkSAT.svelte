<script lang="ts">
  // WALKSAT on a random 3-SAT instance, with noise parameter slider and chart.

  let nvars = $state(20);
  let ratio = $state(4.27);
  let p = $state(0.5);
  let seed = $state(42);

  let clauses = $state<number[][]>([]);
  let assignment = $state<boolean[]>([]);
  let unsatCount = $state(0);
  let history = $state<number[]>([]);
  let flips = $state(0);

  function rand(seed_: { s: number }): number {
    seed_.s = (seed_.s * 9301 + 49297) % 233280;
    return seed_.s / 233280;
  }

  function generate() {
    const m = Math.round(ratio * nvars);
    const sd = { s: seed * 31 + 1 };
    const cs: number[][] = [];
    for (let i = 0; i < m; i++) {
      const c: number[] = [];
      while (c.length < 3) {
        const v = 1 + Math.floor(rand(sd) * nvars);
        if (c.some((l) => Math.abs(l) === v)) continue;
        const lit = rand(sd) < 0.5 ? -v : v;
        c.push(lit);
      }
      cs.push(c);
    }
    clauses = cs;
    assignment = Array.from({ length: nvars + 1 }, () => rand(sd) < 0.5);
    flips = 0;
    history = [];
    recomputeUnsat();
  }
  generate();

  function isSat(c: number[], a: boolean[]): boolean {
    for (const lit of c) {
      if ((lit > 0) === a[Math.abs(lit)]) return true;
    }
    return false;
  }

  function recomputeUnsat() {
    unsatCount = clauses.filter((c) => !isSat(c, assignment)).length;
    history = [...history, unsatCount].slice(-300);
  }

  function step(): boolean {
    if (unsatCount === 0) return false;
    const unsat = clauses.filter((c) => !isSat(c, assignment));
    const c = unsat[Math.floor(Math.random() * unsat.length)];
    let chosen: number;
    if (Math.random() < p) {
      chosen = c[Math.floor(Math.random() * c.length)];
    } else {
      // min break-count
      let best: number[] = [];
      let bestN = Infinity;
      for (const lit of c) {
        const v = Math.abs(lit);
        // flip and count break (currently sat clauses that become unsat)
        assignment[v] = !assignment[v];
        let breaks = 0;
        for (const cc of clauses) if (isSat(cc, assignment) === false) breaks += 1;
        // restore
        assignment[v] = !assignment[v];
        // breaks here is the new unsat count, but we want change. Simpler:
        if (breaks < bestN) { bestN = breaks; best = [lit]; }
        else if (breaks === bestN) best.push(lit);
      }
      chosen = best[Math.floor(Math.random() * best.length)];
    }
    const v = Math.abs(chosen);
    assignment[v] = !assignment[v];
    assignment = assignment;
    flips += 1;
    recomputeUnsat();
    return true;
  }

  let playing = $state(false);
  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      let i = 0;
      while (i < 20 && playing) {
        if (!step()) { playing = false; break; }
        i += 1;
      }
      setTimeout(tick, 10);
    };
    tick();
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-3 items-center">
    <label class="text-xs">n =
      <input type="number" min="5" max="80" bind:value={nvars} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <label class="text-xs">ratio m/n =
      <input type="number" min="1" max="10" step="0.1" bind:value={ratio} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <label class="text-xs">seed =
      <input type="number" bind:value={seed} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <label class="text-xs flex items-center gap-1">noise p =
      <input type="range" min="0" max="1" step="0.05" bind:value={p} class="w-32" />
      <span class="font-mono">{p.toFixed(2)}</span>
    </label>
    <button class="btn btn-sm" onclick={generate}>Regenerate</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
  </div>

  <div class="text-sm">
    <b>{clauses.length}</b> clauses · <b>{unsatCount}</b> unsatisfied · <b>{flips}</b> flips
    {#if unsatCount === 0}<span class="ml-2 text-emerald-700 dark:text-emerald-300 font-medium">✓ SAT found!</span>{/if}
  </div>

  <div>
    <div class="text-xs font-semibold mb-1">Unsatisfied clauses over time</div>
    <svg width="800" height="100" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
      {#if history.length > 1}
        {@const maxH = Math.max(...history, 1)}
        <polyline fill="none" stroke="#3b82f6" stroke-width="1.5" points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 800},${100 - (h / maxH) * 90 - 5}`).join(' ')} />
        <text x="6" y="14" font-size="10" fill="#64748b">max {maxH}</text>
      {/if}
    </svg>
  </div>

  <div class="text-xs text-ink-500">Try p = 0 (pure greedy) vs p = 1 (pure random). Watch the time-to-SAT difference.</div>
</div>
