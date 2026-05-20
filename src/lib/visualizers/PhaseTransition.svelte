<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Run a simple DPLL solver many times across clause/variable ratios and plot SAT probability + solve time.

  let nvars = $state(15);
  let trialsPerRatio = $state(20);
  let ratios = $state<{ r: number; satFrac: number; avgFlips: number }[]>([]);
  let running = $state(false);

  function rand(sd: { s: number }) { sd.s = (sd.s * 9301 + 49297) % 233280; return sd.s / 233280; }

  function gen3SAT(n: number, m: number, seed: number): number[][] {
    const sd = { s: seed };
    const out: number[][] = [];
    for (let i = 0; i < m; i++) {
      const c: number[] = [];
      while (c.length < 3) {
        const v = 1 + Math.floor(rand(sd) * n);
        if (c.some((l) => Math.abs(l) === v)) continue;
        c.push(rand(sd) < 0.5 ? -v : v);
      }
      out.push(c);
    }
    return out;
  }

  // Simple DPLL
  function dpll(clauses: number[][], assignment: Record<number, boolean>, ops: { count: number }): boolean {
    ops.count += 1;
    if (ops.count > 100000) return false;
    let cur = simplify(clauses, assignment);
    if (cur === null) return false;
    // unit propagate
    let progressed = true;
    while (progressed && cur && cur.length > 0) {
      progressed = false;
      const unit = cur.find((c) => c.length === 1);
      if (unit) {
        const lit = unit[0];
        assignment[Math.abs(lit)] = lit > 0;
        cur = simplify(clauses, assignment);
        if (cur === null) return false;
        progressed = true;
      }
    }
    if (cur && cur.length === 0) return true;
    let v = -1;
    for (const c of cur!) for (const lit of c) if (assignment[Math.abs(lit)] === undefined) { v = Math.abs(lit); break; }
    if (v === -1) return true;
    const a1 = { ...assignment, [v]: true };
    if (dpll(clauses, a1, ops)) { Object.assign(assignment, a1); return true; }
    const a2 = { ...assignment, [v]: false };
    if (dpll(clauses, a2, ops)) { Object.assign(assignment, a2); return true; }
    return false;
  }

  function simplify(clauses: number[][], assignment: Record<number, boolean>): number[][] | null {
    const out: number[][] = [];
    for (const c of clauses) {
      const newC: number[] = [];
      let sat = false;
      for (const lit of c) {
        const v = Math.abs(lit);
        if (assignment[v] === undefined) newC.push(lit);
        else if ((lit > 0) === assignment[v]) { sat = true; break; }
      }
      if (sat) continue;
      if (newC.length === 0) return null;
      out.push(newC);
    }
    return out;
  }

  async function run() {
    if (running) return;
    running = true;
    ratios = [];
    const rs = [];
    for (let r = 2; r <= 7; r += 0.25) rs.push(r);
    for (const r of rs) {
      let satCount = 0;
      let totalOps = 0;
      const m = Math.round(r * nvars);
      for (let t = 0; t < trialsPerRatio; t++) {
        const cnf = gen3SAT(nvars, m, t * 7 + Math.floor(r * 1000));
        const ops = { count: 0 };
        const ok = dpll(cnf, {}, ops);
        if (ok) satCount += 1;
        totalOps += ops.count;
      }
      ratios = [...ratios, { r, satFrac: satCount / trialsPerRatio, avgFlips: totalOps / trialsPerRatio }];
      await new Promise((res) => setTimeout(res, 1));
    }
    running = false;
  }

  const W = 700, H = 280, PAD = 40;
  const maxOps = $derived(Math.max(1, ...ratios.map((r) => r.avgFlips)));

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Setup.**`);
    lines.push(`- Random 3-SAT, $n = ${nvars}$ variables, **${trialsPerRatio} trials per ratio**.`);
    lines.push(`- Clause/variable ratio $r = m/n$ swept from 2.0 to 7.0 in steps of 0.25 — ${ratios.length} grid points collected.`);
    lines.push(`- Each instance is solved by DPLL (unit propagation + first-unassigned splitting).`);
    lines.push('');

    if (ratios.length === 0) {
      lines.push(`*No data yet — click "Run benchmark" to populate the empirical curve.*`);
      return lines.join('\n');
    }

    lines.push(`**Empirical $P(\\text{SAT})$ per ratio.**`);
    lines.push('');
    lines.push('| $r = m/n$ | $P(\\text{SAT})$ | avg DPLL ops |');
    lines.push('|---|---|---|');
    for (const row of ratios) {
      lines.push(`| ${row.r.toFixed(2)} | ${(row.satFrac * 100).toFixed(0)}% | ${Math.round(row.avgFlips)} |`);
    }
    lines.push('');

    // Find empirical phase transition = ratio where satFrac crosses 0.5
    let xover: number | null = null;
    for (let i = 1; i < ratios.length; i++) {
      const a = ratios[i - 1], b = ratios[i];
      if ((a.satFrac - 0.5) * (b.satFrac - 0.5) <= 0 && a.satFrac !== b.satFrac) {
        // linear interpolation
        const t = (0.5 - a.satFrac) / (b.satFrac - a.satFrac);
        xover = a.r + t * (b.r - a.r);
        break;
      }
    }
    const hardest = [...ratios].sort((a, b) => b.avgFlips - a.avgFlips)[0];

    lines.push(`**Phase-transition location.**`);
    lines.push(`- Theoretical (3-SAT): $r^\\star \\approx 4.267$.`);
    lines.push(`- Empirical crossover where $P(\\text{SAT})$ passes 50%: ${xover === null ? '*not observed — try more ratios or trials*' : `$r \\approx ${xover.toFixed(2)}$`}.`);
    lines.push(`- Hardest ratio in this run (most avg DPLL operations): $r = ${hardest.r.toFixed(2)}$ with ${Math.round(hardest.avgFlips)} ops per instance.`);
    lines.push('');

    lines.push(`**Observation.** Below the transition, instances are **under-constrained** — many satisfying models, easy to find one. Above the transition, instances are **over-constrained** — most have a short UNSAT proof. Right at $r^\\star$, half of instances are SAT and half UNSAT, and *both* directions are hard to prove — this is the famous "easy–hard–easy" pattern characterising the random 3-SAT phase transition.`);

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <label>n vars = <input type="number" min="8" max="20" bind:value={nvars} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
    <label>trials per ratio = <input type="number" min="5" max="50" bind:value={trialsPerRatio} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" /></label>
    <button class="btn btn-sm btn-primary" onclick={run} disabled={running}>{running ? 'Running…' : 'Run benchmark'}</button>
    <span class="text-ink-500">small instances; runs synchronously</span>
  </div>

  <svg viewBox="0 0 {W} {H}" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
    <!-- axes -->
    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#64748b" />
    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#64748b" />
    {#if true}
      {@const xPT = PAD + ((4.27 - 2) / 5) * (W - 2 * PAD)}
      <line x1={xPT} y1={PAD} x2={xPT} y2={H - PAD} stroke="#dc2626" stroke-dasharray="3 3" />
      <text x={xPT + 4} y={PAD + 12} font-size="9" fill="#dc2626">r ≈ 4.267</text>
    {/if}

    <!-- SAT fraction polyline (blue) -->
    {#if ratios.length > 1}
      <polyline fill="none" stroke="#1e40af" stroke-width="2" points={ratios.map((r) => `${PAD + ((r.r - 2) / 5) * (W - 2 * PAD)},${H - PAD - r.satFrac * (H - 2 * PAD)}`).join(' ')} />
      <!-- Avg ops polyline (red, normalized) -->
      <polyline fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 2" points={ratios.map((r) => `${PAD + ((r.r - 2) / 5) * (W - 2 * PAD)},${H - PAD - (r.avgFlips / maxOps) * (H - 2 * PAD)}`).join(' ')} />
    {/if}

    <!-- y-axis labels -->
    <text x={PAD - 5} y={PAD} text-anchor="end" font-size="9" fill="#64748b">100%</text>
    <text x={PAD - 5} y={H - PAD} text-anchor="end" font-size="9" fill="#64748b">0%</text>
    <!-- x-axis labels -->
    {#each [2, 3, 4, 5, 6, 7] as r}
      <text x={PAD + ((r - 2) / 5) * (W - 2 * PAD)} y={H - PAD + 14} text-anchor="middle" font-size="9" fill="#64748b">{r}</text>
    {/each}
    <text x={W / 2} y={H - 5} text-anchor="middle" font-size="10" fill="#64748b">clause/variable ratio m/n</text>
  </svg>

  <div class="text-xs text-ink-500 flex flex-wrap gap-3">
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#1e40af" stroke-width="2" /></svg>P(SAT)</span>
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#dc2626" stroke-width="2" stroke-dasharray="4 2" /></svg>avg DPLL operations (normalised)</span>
    <span class="flex items-center gap-1"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#dc2626" stroke-dasharray="3 3" /></svg>r ≈ 4.267 (theoretical transition)</span>
  </div>

  <div class="text-xs text-ink-500">
    <b>What to watch.</b> Below $r \approx 4.27$: most instances SAT (blue → 100%) and easy to solve (red low). Above: most UNSAT (blue → 0%) but provable cheaply via short refutations. <b>At the transition</b>: SAT/UNSAT split 50/50 and solve time peaks sharply — this is the empirical "hard region" of random 3-SAT.
  </div>

  <ExamAnswer answer={examAnswer} summary={`${ratios.length} ratios sampled · n = ${nvars} · ${trialsPerRatio} trials each`} />
</div>
