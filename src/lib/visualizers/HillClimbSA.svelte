<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // 1D function landscape with hill climbing, random-restart hill climbing, and simulated annealing.

  type FuncChoice = 'multi-peak' | 'plateau' | 'spike' | 'rugged' | 'custom';
  let funcChoice = $state<FuncChoice>('multi-peak');
  let algo = $state<'hill-climb' | 'random-restart' | 'sa'>('hill-climb');
  let T0 = $state(2);
  let alpha = $state(0.95);
  let stepSize = $state(0.1);

  // ── User flexibility additions ──
  // Custom JS expression in `x` (compiled with Math members in scope).
  let customExpr = $state('sin(x) + 0.5*cos(2*x)');
  let customError = $state<string | null>(null);
  // Starting position. If `useRandomStart` is on we ignore `startX` and roll fresh.
  let useRandomStart = $state(true);
  let startX = $state(1.5);
  // Max iterations cap (replaces the old hard-coded 500).
  let maxIterations = $state(500);
  // Optional multi-start comparison: run independent traces from N different
  // starting positions side-by-side. When > 1, we render each trace in its own
  // colour. Defaults to 1 (the original single-run behaviour).
  let multiStartCount = $state(1);
  // Comma-separated explicit starting positions for multi-start runs. If blank,
  // we use evenly-spaced starts across the x-range.
  let multiStartList = $state('');

  const xMin = 0, xMax = 10;
  const samples = 400;

  // Compile the custom expression. Returns null + sets `customError` on failure.
  function compileCustom(expr: string): ((x: number) => number) | null {
    try {
      // Disallow obviously dangerous identifiers. Defence-in-depth only; this is
      // a client-side education tool, so the user can already run arbitrary JS.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function('x', 'with(Math){ return ' + expr + '; }') as (x: number) => number;
      // Sanity-check on a sample point.
      const probe = fn(0);
      if (typeof probe !== 'number' || Number.isNaN(probe)) {
        customError = 'Expression did not return a number at x=0.';
        return null;
      }
      customError = null;
      return fn;
    } catch (e) {
      customError = (e as Error).message;
      return null;
    }
  }

  const customFn = $derived.by(() => (funcChoice === 'custom' ? compileCustom(customExpr) : null));

  function f(x: number): number {
    if (funcChoice === 'custom') {
      if (!customFn) return 0;
      try { return customFn(x); } catch { return 0; }
    }
    if (funcChoice === 'multi-peak') return Math.sin(x) + 0.5 * Math.sin(3 * x) + 0.3 * Math.cos(5 * x);
    if (funcChoice === 'plateau') return Math.max(-0.2, Math.min(1, Math.sin(x))) + (x > 4 && x < 6 ? 0 : 0.1 * Math.sin(2 * x));
    if (funcChoice === 'spike') return -0.2 * (x - 5) * (x - 5) + (Math.abs(x - 7) < 0.4 ? 3 : 0);
    return Math.sin(x) * Math.cos(2 * x) + 0.3 * Math.sin(7 * x);
  }

  // Sample the function for plotting
  const points = $derived.by(() => {
    customFn;  // explicit dep so the curve re-renders when the expression changes
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      const y = f(x);
      out.push({ x, y: Number.isFinite(y) ? y : 0 });
    }
    return out;
  });

  const yMin = $derived(Math.min(...points.map((p) => p.y)) - 0.2);
  const yMax = $derived(Math.max(...points.map((p) => p.y)) + 0.2);

  const W = 700, H = 250, PAD = 30;
  function px(x: number) { return PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD); }
  function py(y: number) { return H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD); }

  // ── Per-run state ──
  // For multi-start mode we maintain an array of runs (each its own currentX,
  // trace, temperature, steps). For single-start we still treat it uniformly
  // as a one-element array but expose `currentX`/`trace`/etc. as derived
  // helpers for the existing UI/exam answer.
  interface Run { currentX: number; trace: { x: number; y: number; T?: number; accepted?: boolean }[]; temperature: number; steps: number; restarts: number; stuck: boolean }
  let runs = $state<Run[]>([]);
  let playing = $state(false);

  // Trace colours per run (cycles for >4).
  const runColours = ['#16a34a', '#2563eb', '#d97706', '#db2777', '#0d9488'];

  function resolveStarts(): number[] {
    if (multiStartCount <= 1) {
      // Single-start: honour the explicit position or roll random.
      if (useRandomStart) return [xMin + Math.random() * (xMax - xMin)];
      return [Math.max(xMin, Math.min(xMax, startX))];
    }
    // Multi-start. Prefer the explicit list if provided.
    const listed = multiStartList.split(/[,\s]+/).map((s) => parseFloat(s)).filter((n) => Number.isFinite(n));
    if (listed.length >= multiStartCount) return listed.slice(0, multiStartCount).map((x) => Math.max(xMin, Math.min(xMax, x)));
    if (listed.length > 0) {
      // Pad with evenly-spaced fillers.
      const out = [...listed];
      const need = multiStartCount - listed.length;
      for (let i = 0; i < need; i++) {
        const t = (i + 1) / (need + 1);
        out.push(xMin + t * (xMax - xMin));
      }
      return out.slice(0, multiStartCount);
    }
    // Evenly spaced across the range (skipping the very edges).
    const out: number[] = [];
    for (let i = 0; i < multiStartCount; i++) {
      const t = (i + 1) / (multiStartCount + 1);
      out.push(xMin + t * (xMax - xMin));
    }
    return out;
  }

  function reset() {
    const starts = resolveStarts();
    runs = starts.map((sx) => ({
      currentX: sx,
      trace: [{ x: sx, y: f(sx) }],
      temperature: T0,
      steps: 0,
      restarts: 0,
      stuck: false,
    }));
    playing = false;
  }
  reset();

  // ── Back-compat derived projections of the first run (keep existing UI code
  // and exam answer working unchanged for single-start mode). ──
  const primary = $derived(runs[0] ?? { currentX: 0, trace: [{ x: 0, y: 0 }], temperature: T0, steps: 0, restarts: 0, stuck: false });
  const currentX = $derived(primary.currentX);
  const trace = $derived(primary.trace);
  const temperature = $derived(primary.temperature);
  const steps = $derived(primary.steps);
  const restarts = $derived(primary.restarts);

  // Step one specific run by index. Returns false if the run is finished.
  function stepRun(idx: number): boolean {
    const r = runs[idx];
    if (!r || r.stuck) return false;
    if (algo === 'hill-climb') {
      const left = r.currentX - stepSize;
      const right = r.currentX + stepSize;
      const yL = left >= xMin ? f(left) : -Infinity;
      const yR = right <= xMax ? f(right) : -Infinity;
      const yCur = f(r.currentX);
      if (yL <= yCur && yR <= yCur) { r.stuck = true; return false; }   // local optimum
      r.currentX = yL > yR ? left : right;
      r.trace = [...r.trace, { x: r.currentX, y: f(r.currentX), accepted: true }];
    } else if (algo === 'random-restart') {
      const left = r.currentX - stepSize;
      const right = r.currentX + stepSize;
      const yL = left >= xMin ? f(left) : -Infinity;
      const yR = right <= xMax ? f(right) : -Infinity;
      const yCur = f(r.currentX);
      if (yL <= yCur && yR <= yCur) {
        r.currentX = xMin + Math.random() * (xMax - xMin);
        r.restarts += 1;
        r.trace = [...r.trace, { x: r.currentX, y: f(r.currentX), accepted: true }];
      } else {
        r.currentX = yL > yR ? left : right;
        r.trace = [...r.trace, { x: r.currentX, y: f(r.currentX), accepted: true }];
      }
    } else {
      // Simulated annealing
      const next = r.currentX + (Math.random() - 0.5) * 2 * stepSize;
      if (next < xMin || next > xMax) return true;  // out-of-bounds proposal — skip
      const dE = f(next) - f(r.currentX);
      let accepted = false;
      if (dE > 0) { r.currentX = next; accepted = true; }
      else {
        const p = Math.exp(dE / r.temperature);
        if (Math.random() < p) { r.currentX = next; accepted = true; }
      }
      r.trace = [...r.trace, { x: r.currentX, y: f(r.currentX), T: r.temperature, accepted }];
      r.temperature *= alpha;
      if (r.temperature < 0.001) { r.stuck = true; return false; }
    }
    r.steps += 1;
    if (r.steps >= maxIterations) { r.stuck = true; return false; }
    // Reactivity nudge — re-assign the runs array so $derived recomputes.
    runs = runs;
    return true;
  }

  function step(): boolean {
    let anyAlive = false;
    for (let i = 0; i < runs.length; i++) {
      if (stepRun(i)) anyAlive = true;
    }
    return anyAlive;
  }

  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      if (!step()) { playing = false; return; }
      setTimeout(tick, 80);
    };
    tick();
  }

  const funcFormula = $derived(
    funcChoice === 'custom' ? `\\text{custom: } ${customExpr.replace(/\*/g, '\\cdot ')}`
    : funcChoice === 'multi-peak' ? '\\sin x + 0.5 \\sin 3x + 0.3 \\cos 5x'
    : funcChoice === 'plateau' ? '\\max(-0.2, \\min(1, \\sin x)) + \\text{(plateau region near }[4,6]\\text{)}'
    : funcChoice === 'spike' ? '-0.2(x-5)^2 + \\text{spike at } x\\approx 7'
    : '\\sin x \\cdot \\cos 2x + 0.3 \\sin 7x'
  );

  // Global maximum on the sampled grid (proxy for the "true" optimum).
  const globalMax = $derived.by(() => {
    let bestX = points[0].x, bestY = points[0].y;
    for (const p of points) if (p.y > bestY) { bestY = p.y; bestX = p.x; }
    return { x: bestX, y: bestY };
  });

  // Best-so-far per run.
  function peakOf(r: Run): { x: number; y: number } {
    let bestX = r.trace[0].x, bestY = r.trace[0].y;
    for (const t of r.trace) if (t.y > bestY) { bestY = t.y; bestX = t.x; }
    return { x: bestX, y: bestY };
  }
  const peakSoFar = $derived(peakOf(primary));

  const algoName = $derived(algo === 'hill-climb' ? 'Hill climbing' : algo === 'random-restart' ? 'Random-restart hill climbing' : 'Simulated annealing');

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push('**Setup.**');
    lines.push(`- Function: $f(x) = ${funcFormula}$ on $x \\in [${xMin}, ${xMax}]$ (preset: **${funcChoice}**).`);
    lines.push(`- Algorithm: **${algoName}**.`);
    lines.push(`- Step size: ${stepSize}${algo === 'sa' ? `; initial temperature $T_0 = ${T0}$; cooling $\\alpha = ${alpha}$` : ''}.`);
    lines.push(`- Max iterations: ${maxIterations}.`);
    if (multiStartCount > 1) {
      lines.push(`- Multi-start comparison: ${runs.length} starts at $x \\in \\{${runs.map((r) => r.trace[0].x.toFixed(2)).join(', ')}\\}$.`);
    } else {
      lines.push(`- Start: $x_0 = ${runs[0]?.trace[0].x.toFixed(3) ?? '?'}$ (${useRandomStart ? 'random' : 'user-specified'}).`);
    }
    lines.push('');

    if (multiStartCount > 1) {
      lines.push('**Per-start results.**');
      lines.push('');
      lines.push('| Start $x_0$ | Iters | Final $x$ | Final $f$ | Best $f$ so far |');
      lines.push('|---|---|---|---|---|');
      for (const r of runs) {
        const p = peakOf(r);
        lines.push(`| ${r.trace[0].x.toFixed(2)} | ${r.steps} | ${r.currentX.toFixed(3)} | ${f(r.currentX).toFixed(3)} | ${p.y.toFixed(3)} |`);
      }
      lines.push('');
      lines.push(`Different starting positions reach different local maxima — this is the classic pathology that motivates random-restart and simulated annealing.`);
      lines.push('');
    } else {
      lines.push('**Run.**');
      lines.push(`- Iterations run: **${steps}**.`);
      if (algo === 'random-restart') lines.push(`- Restarts triggered: **${restarts}**.`);
      if (algo === 'sa') lines.push(`- Current temperature: $T \\approx ${temperature.toFixed(4)}$.`);
      lines.push(`- Current position: $x \\approx ${currentX.toFixed(3)}$, $f(x) \\approx ${f(currentX).toFixed(3)}$.`);
      lines.push(`- Best $(x, f(x))$ visited so far: $(${peakSoFar.x.toFixed(3)}, ${peakSoFar.y.toFixed(3)})$.`);
      lines.push('');
    }

    lines.push('**Comparison with the global maximum (from a dense sample).**');
    lines.push(`- Approx. global max: $f \\approx ${globalMax.y.toFixed(3)}$ at $x \\approx ${globalMax.x.toFixed(3)}$.`);
    const best = multiStartCount > 1 ? Math.max(...runs.map((r) => peakOf(r).y)) : peakSoFar.y;
    const gap = globalMax.y - best;
    if (gap < 0.05) {
      lines.push(`- Search has reached (close to) the global optimum (gap ≈ ${gap.toFixed(3)}).`);
    } else {
      lines.push(`- Search is below the global optimum by $\\Delta f \\approx ${gap.toFixed(3)}$.`);
      if (algo === 'hill-climb') {
        lines.push(`- **Stuck at a local maximum** — plain hill climbing cannot escape because both neighbours have lower $f$.`);
      } else if (algo === 'random-restart') {
        lines.push(`- Random restart bounces out of basins, but may need more restarts to land in the global basin.`);
      } else {
        lines.push(`- Simulated annealing can still escape by accepting worse moves at higher $T$ — give it more iterations or raise $T_0$.`);
      }
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Function:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {funcChoice === 'multi-peak' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'multi-peak'; reset(); }}>Multi-peak</button>
      <button class="px-2 py-1 {funcChoice === 'plateau' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'plateau'; reset(); }}>Plateau</button>
      <button class="px-2 py-1 {funcChoice === 'spike' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'spike'; reset(); }}>Needle in haystack</button>
      <button class="px-2 py-1 {funcChoice === 'rugged' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'rugged'; reset(); }}>Rugged</button>
      <button class="px-2 py-1 {funcChoice === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'custom'; reset(); }}>Custom</button>
    </div>
  </div>

  {#if funcChoice === 'custom'}
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">
        Custom $f(x)$ — JavaScript expression in <code>x</code>. All <code>Math.*</code> members are in scope unqualified
        (e.g. <code>sin</code>, <code>cos</code>, <code>abs</code>, <code>exp</code>, <code>log</code>, <code>sqrt</code>, <code>PI</code>).
        Examples: <code>sin(x) + 0.5*cos(2*x)</code>, <code>x*x - 3*x + 2</code>, <code>abs(x - 2) + abs(x - 5)</code>. Evaluated on $x \in [{xMin}, {xMax}]$.
      </span>
      <input
        type="text"
        class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900"
        bind:value={customExpr}
        oninput={() => { reset(); }}
      />
      {#if customError}
        <span class="text-xs text-red-600 dark:text-red-400 mt-1 block">⚠ {customError}</span>
      {/if}
    </label>
  {/if}

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Algorithm:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {algo === 'hill-climb' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { algo = 'hill-climb'; reset(); }}>Hill climbing</button>
      <button class="px-2 py-1 {algo === 'random-restart' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { algo = 'random-restart'; reset(); }}>Random-restart HC</button>
      <button class="px-2 py-1 {algo === 'sa' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { algo = 'sa'; reset(); }}>Simulated annealing</button>
    </div>
    {#if algo === 'sa'}
      <label>T₀ = <input type="number" min="0.1" max="10" step="0.1" bind:value={T0} onchange={reset} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
      <label>α = <input type="number" min="0.5" max="0.99" step="0.01" bind:value={alpha} onchange={reset} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
    {/if}
    <label>step = <input type="number" min="0.05" max="1" step="0.05" bind:value={stepSize} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
    <label>max iters = <input type="number" min="10" max="5000" step="10" bind:value={maxIterations} onchange={reset} class="w-20 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
    <button class="btn btn-sm" onclick={reset}>Reset</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
    <span class="text-ink-500">
      {#if multiStartCount > 1}
        {runs.length} runs · max steps: {Math.max(0, ...runs.map((r) => r.steps))}
      {:else}
        steps: {steps}{algo === 'random-restart' ? ` · restarts: ${restarts}` : ''}{algo === 'sa' ? ` · T: ${temperature.toFixed(3)}` : ''}
      {/if}
    </span>
  </div>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Starting position:</span>
    <label class="flex items-center gap-1">
      <input type="checkbox" bind:checked={useRandomStart} onchange={reset} disabled={multiStartCount > 1} />
      random
    </label>
    <label>
      x₀ =
      <input
        type="number"
        min={xMin}
        max={xMax}
        step="0.1"
        bind:value={startX}
        onchange={() => { if (!useRandomStart) reset(); }}
        disabled={useRandomStart || multiStartCount > 1}
        class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 disabled:opacity-50"
      />
    </label>
    <input
      type="range"
      min={xMin}
      max={xMax}
      step="0.05"
      bind:value={startX}
      onchange={() => { if (!useRandomStart && multiStartCount <= 1) reset(); }}
      disabled={useRandomStart || multiStartCount > 1}
      class="w-40 disabled:opacity-50"
    />
    <span class="text-ink-500">(useful for "what happens if we start at x=3?" exam questions)</span>
  </div>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Multi-start comparison:</span>
    <label>
      runs =
      <input
        type="number"
        min="1"
        max="5"
        bind:value={multiStartCount}
        onchange={reset}
        class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900"
      />
    </label>
    <label class="flex-1 min-w-[10rem]">
      starts (comma-separated, optional) =
      <input
        type="text"
        placeholder="e.g. 1.5, 4.5, 7.5"
        bind:value={multiStartList}
        onchange={reset}
        disabled={multiStartCount <= 1}
        class="w-48 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 disabled:opacity-50"
      />
    </label>
    <span class="text-ink-500">Set runs ≥ 2 to show parallel trajectories — demonstrates how HC gets stuck at different local maxima depending on x₀.</span>
  </div>

  <svg viewBox="0 0 {W} {H}" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
    <!-- function curve -->
    <polyline fill="none" stroke="#1e40af" stroke-width="1.5" points={points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} />
    <!-- trace points (one stream per run, colour-coded) -->
    {#each runs as r, ri}
      {@const colour = runColours[ri % runColours.length]}
      {#each r.trace as t, i}
        <circle
          cx={px(t.x)}
          cy={py(t.y)}
          r={i === r.trace.length - 1 ? 5 : 2}
          fill={i === r.trace.length - 1 ? '#dc2626' : t.accepted === false ? '#94a3b8' : colour}
          opacity={(i / Math.max(1, r.trace.length)) * 0.7 + 0.3}
        />
      {/each}
      {#if runs.length > 1}
        <!-- Label the starting point of each run -->
        <text x={px(r.trace[0].x)} y={py(r.trace[0].y) - 8} text-anchor="middle" font-size="9" font-weight="bold" fill={colour}>start {ri + 1}</text>
      {/if}
    {/each}
    <!-- axes -->
    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#64748b" />
    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#64748b" />
    <text x={W / 2} y={H - 5} text-anchor="middle" font-size="10" fill="#64748b">x</text>
    <text x={10} y={H / 2} text-anchor="middle" font-size="10" fill="#64748b" transform="rotate(-90, 10, {H/2})">f(x)</text>
  </svg>

  <div class="text-xs text-ink-500">
    {#if runs.length > 1}
      {#each runs as _, ri}
        <span class="inline-block w-3 h-3 rounded-full mr-1" style="background: {runColours[ri % runColours.length]}"></span>run {ri + 1} ·
      {/each}
      <span class="inline-block w-3 h-3 bg-rose-500 rounded-full mr-1"></span>current heads
    {:else}
      <span class="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-1"></span>accepted moves ·
      <span class="inline-block w-3 h-3 bg-rose-500 rounded-full mr-1"></span>current ·
      {#if algo === 'sa'}<span class="inline-block w-3 h-3 bg-ink-400 rounded-full mr-1"></span>rejected{/if}
    {/if}
  </div>

  <div class="text-xs text-ink-500">
    <b>What to watch:</b> On the multi-peak landscape, plain hill climbing gets stuck on the first local max it finds. Random-restart hopes one of the restarts lands in the global basin. Simulated annealing accepts downhill moves with Boltzmann probability — at high T it walks almost randomly; as T decreases it transitions to hill-climbing behaviour.
  </div>

  <ExamAnswer answer={examAnswer} summary={`${algoName} · ${multiStartCount > 1 ? `${runs.length} starts` : `${steps} step${steps === 1 ? '' : 's'}`} · peak ≈ ${(multiStartCount > 1 ? Math.max(...runs.map((r) => peakOf(r).y)) : peakSoFar.y).toFixed(2)} (global ≈ ${globalMax.y.toFixed(2)})`} />
</div>
