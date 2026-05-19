<script lang="ts">
  // 1D function landscape with hill climbing, random-restart hill climbing, and simulated annealing.

  let funcChoice = $state<'multi-peak' | 'plateau' | 'spike' | 'rugged'>('multi-peak');
  let algo = $state<'hill-climb' | 'random-restart' | 'sa'>('hill-climb');
  let T0 = $state(2);
  let alpha = $state(0.95);
  let stepSize = $state(0.1);

  const xMin = 0, xMax = 10;
  const samples = 400;

  function f(x: number): number {
    if (funcChoice === 'multi-peak') return Math.sin(x) + 0.5 * Math.sin(3 * x) + 0.3 * Math.cos(5 * x);
    if (funcChoice === 'plateau') return Math.max(-0.2, Math.min(1, Math.sin(x))) + (x > 4 && x < 6 ? 0 : 0.1 * Math.sin(2 * x));
    if (funcChoice === 'spike') return -0.2 * (x - 5) * (x - 5) + (Math.abs(x - 7) < 0.4 ? 3 : 0);
    return Math.sin(x) * Math.cos(2 * x) + 0.3 * Math.sin(7 * x);
  }

  // Sample the function for plotting
  const points = $derived.by(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      out.push({ x, y: f(x) });
    }
    return out;
  });

  const yMin = $derived(Math.min(...points.map((p) => p.y)) - 0.2);
  const yMax = $derived(Math.max(...points.map((p) => p.y)) + 0.2);

  const W = 700, H = 250, PAD = 30;
  function px(x: number) { return PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD); }
  function py(y: number) { return H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD); }

  let currentX = $state(1.5);
  let trace = $state<{ x: number; y: number; T?: number; accepted?: boolean }[]>([{ x: 1.5, y: f(1.5) }]);
  let temperature = $state(2);
  let steps = $state(0);
  let restarts = $state(0);
  let playing = $state(false);

  function reset() {
    currentX = xMin + Math.random() * (xMax - xMin);
    trace = [{ x: currentX, y: f(currentX) }];
    temperature = T0;
    steps = 0;
    restarts = 0;
  }
  reset();

  function step(): boolean {
    if (algo === 'hill-climb') {
      const left = currentX - stepSize;
      const right = currentX + stepSize;
      const yL = left >= xMin ? f(left) : -Infinity;
      const yR = right <= xMax ? f(right) : -Infinity;
      const yCur = f(currentX);
      if (yL <= yCur && yR <= yCur) return false;   // local optimum
      if (yL > yR) currentX = left;
      else currentX = right;
      trace = [...trace, { x: currentX, y: f(currentX), accepted: true }];
    } else if (algo === 'random-restart') {
      // Try hill climb; on stuck, restart
      const left = currentX - stepSize;
      const right = currentX + stepSize;
      const yL = left >= xMin ? f(left) : -Infinity;
      const yR = right <= xMax ? f(right) : -Infinity;
      const yCur = f(currentX);
      if (yL <= yCur && yR <= yCur) {
        currentX = xMin + Math.random() * (xMax - xMin);
        restarts += 1;
        trace = [...trace, { x: currentX, y: f(currentX), accepted: true }];
      } else {
        currentX = yL > yR ? left : right;
        trace = [...trace, { x: currentX, y: f(currentX), accepted: true }];
      }
    } else {
      // Simulated annealing
      const next = currentX + (Math.random() - 0.5) * 2 * stepSize;
      if (next < xMin || next > xMax) return true;
      const dE = f(next) - f(currentX);
      let accepted = false;
      if (dE > 0) {
        currentX = next;
        accepted = true;
      } else {
        const p = Math.exp(dE / temperature);
        if (Math.random() < p) { currentX = next; accepted = true; }
      }
      trace = [...trace, { x: currentX, y: f(currentX), T: temperature, accepted }];
      temperature *= alpha;
      if (temperature < 0.001) return false;
    }
    steps += 1;
    return true;
  }

  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      if (steps > 500 || !step()) { playing = false; return; }
      setTimeout(tick, 80);
    };
    tick();
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Function:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {funcChoice === 'multi-peak' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'multi-peak'; reset(); }}>Multi-peak</button>
      <button class="px-2 py-1 {funcChoice === 'plateau' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'plateau'; reset(); }}>Plateau</button>
      <button class="px-2 py-1 {funcChoice === 'spike' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'spike'; reset(); }}>Needle in haystack</button>
      <button class="px-2 py-1 {funcChoice === 'rugged' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { funcChoice = 'rugged'; reset(); }}>Rugged</button>
    </div>
  </div>

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
    <button class="btn btn-sm" onclick={reset}>Reset</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
    <span class="text-ink-500">steps: {steps}{algo === 'random-restart' ? ` · restarts: ${restarts}` : ''}{algo === 'sa' ? ` · T: ${temperature.toFixed(3)}` : ''}</span>
  </div>

  <svg viewBox="0 0 {W} {H}" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
    <!-- function curve -->
    <polyline fill="none" stroke="#1e40af" stroke-width="1.5" points={points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} />
    <!-- trace points -->
    {#each trace as t, i}
      <circle cx={px(t.x)} cy={py(t.y)} r={i === trace.length - 1 ? 5 : 2} fill={i === trace.length - 1 ? '#dc2626' : t.accepted === false ? '#94a3b8' : '#16a34a'} opacity={i / trace.length * 0.7 + 0.3} />
    {/each}
    <!-- axes -->
    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#64748b" />
    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#64748b" />
    <text x={W / 2} y={H - 5} text-anchor="middle" font-size="10" fill="#64748b">x</text>
    <text x={10} y={H / 2} text-anchor="middle" font-size="10" fill="#64748b" transform="rotate(-90, 10, {H/2})">f(x)</text>
  </svg>

  <div class="text-xs text-ink-500">
    <span class="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-1"></span>accepted moves ·
    <span class="inline-block w-3 h-3 bg-rose-500 rounded-full mr-1"></span>current ·
    {#if algo === 'sa'}<span class="inline-block w-3 h-3 bg-ink-400 rounded-full mr-1"></span>rejected{/if}
  </div>

  <div class="text-xs text-ink-500">
    <b>What to watch:</b> On the multi-peak landscape, plain hill climbing gets stuck on the first local max it finds. Random-restart hopes one of the restarts lands in the global basin. Simulated annealing accepts downhill moves with Boltzmann probability — at high T it walks almost randomly; as T decreases it transitions to hill-climbing behaviour.
  </div>
</div>
