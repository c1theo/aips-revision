<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // WALKSAT on a random 3-SAT instance, with noise parameter slider and chart.

  let nvars = $state(20);
  let ratio = $state(4.27);
  let p = $state(0.5);
  let seed = $state(42);
  let mode = $state<'random' | 'custom'>('random');
  let customCNF = $state('1 2 -3\n-1 2\n2 -3\n-2 3 -1');

  let clauses = $state<number[][]>([]);
  let assignment = $state<boolean[]>([]);
  let unsatCount = $state(0);
  let history = $state<number[]>([]);
  let flips = $state(0);
  let trace = $state<string[]>([]);

  function rand(seed_: { s: number }): number {
    seed_.s = (seed_.s * 9301 + 49297) % 233280;
    return seed_.s / 233280;
  }

  function generate() {
    const sd = { s: seed * 31 + 1 };
    let cs: number[][];
    let varCount: number;
    if (mode === 'custom') {
      cs = customCNF.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n) && n !== 0));
      varCount = cs.length === 0 ? 1 : Math.max(...cs.flat().map(Math.abs));
    } else {
      const m = Math.round(ratio * nvars);
      cs = [];
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
      varCount = nvars;
    }
    clauses = cs;
    assignment = Array.from({ length: varCount + 1 }, () => rand(sd) < 0.5);
    flips = 0;
    history = [];
    trace = [`Initial random assignment (${varCount} vars). ${cs.length} clauses generated.`];
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

  function fmtClause(c: number[]): string {
    return '(' + c.map((l) => (l < 0 ? '¬' : '') + 'x' + Math.abs(l)).join(' ∨ ') + ')';
  }

  function step(): boolean {
    if (unsatCount === 0) return false;
    const unsat = clauses.filter((c) => !isSat(c, assignment));
    const c = unsat[Math.floor(Math.random() * unsat.length)];
    let chosen: number;
    let reason: string;
    if (Math.random() < p) {
      chosen = c[Math.floor(Math.random() * c.length)];
      reason = `random walk (p=${p.toFixed(2)})`;
    } else {
      let best: number[] = [];
      let bestN = Infinity;
      for (const lit of c) {
        const v = Math.abs(lit);
        assignment[v] = !assignment[v];
        let breaks = 0;
        for (const cc of clauses) if (isSat(cc, assignment) === false) breaks += 1;
        assignment[v] = !assignment[v];
        if (breaks < bestN) { bestN = breaks; best = [lit]; }
        else if (breaks === bestN) best.push(lit);
      }
      chosen = best[Math.floor(Math.random() * best.length)];
      reason = `greedy (min break-count = ${bestN})`;
    }
    const v = Math.abs(chosen);
    const beforeVal = assignment[v];
    assignment[v] = !assignment[v];
    assignment = assignment;
    flips += 1;
    recomputeUnsat();
    trace = [...trace, `Flip ${flips}: picked unsat clause ${fmtClause(c)} → flipped x${v} (${beforeVal ? 'T→F' : 'F→T'}) via ${reason}. Now ${unsatCount} unsat.`].slice(-100);
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

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Setup.**`);
    if (mode === 'random') {
      lines.push(`- Random 3-SAT instance: $n = ${nvars}$ variables, ratio $m/n = ${ratio}$ ⇒ $m = ${Math.round(ratio * nvars)}$ clauses (seed = ${seed}).`);
    } else {
      lines.push(`- Custom CNF, ${clauses.length} clauses, max variable index = ${Math.max(0, assignment.length - 1)}.`);
    }
    lines.push(`- WalkSAT noise parameter $p = ${p.toFixed(2)}$ (with probability $p$ flip a random literal from an unsat clause; with probability $1 - p$ flip the one that **minimises break-count**).`);
    lines.push('');

    lines.push(`**CNF.**`);
    lines.push('');
    for (let i = 0; i < Math.min(clauses.length, 20); i++) {
      lines.push(`- $C_{${i + 1}} = ${fmtClause(clauses[i])}$`);
    }
    if (clauses.length > 20) lines.push(`- … and ${clauses.length - 20} more.`);
    lines.push('');

    lines.push(`**Run statistics.**`);
    lines.push(`- Flips executed: **${flips}**.`);
    lines.push(`- Unsatisfied clauses now: **${unsatCount}** / ${clauses.length}.`);
    if (history.length > 1) {
      const maxH = Math.max(...history);
      const minH = Math.min(...history);
      lines.push(`- Unsat-clause trajectory: min = ${minH}, max = ${maxH} (over last ${history.length} recorded flips).`);
    }
    lines.push('');

    lines.push(`**Current assignment.**`);
    lines.push('');
    const asnLine = Array.from({ length: assignment.length - 1 }, (_, i) => `$x_{${i + 1}} = ${assignment[i + 1] ? 'T' : 'F'}$`).join(', ');
    lines.push(asnLine || '*(none)*');
    lines.push('');

    if (unsatCount === 0) {
      lines.push(`**Outcome.** $\\boxed{\\text{Satisfied}}$ after ${flips} flip${flips === 1 ? '' : 's'} — the assignment above satisfies every clause. WalkSAT is **incomplete** (it cannot prove UNSAT), but when an instance is satisfiable it tends to find a model very fast, especially with $p \\approx 0.5$ on hard random 3-SAT.`);
    } else {
      lines.push(`**Outcome so far.** ${unsatCount} clause${unsatCount === 1 ? '' : 's'} still unsatisfied (**not yet SAT** — WalkSAT may need more flips, or the instance may be unsatisfiable). Reported as **${unsatCount === 0 ? 'satisfied' : `${flips} flips / max iterations`}**.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-3 items-center">
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden text-xs">
      <button class="px-2 py-1 {mode === 'random' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { mode = 'random'; generate(); }}>Random 3-SAT</button>
      <button class="px-2 py-1 {mode === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => { mode = 'custom'; generate(); }}>Custom CNF</button>
    </div>
    {#if mode === 'random'}
      <label class="text-xs">n =
        <input type="number" min="5" max="80" bind:value={nvars} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
      <label class="text-xs">ratio m/n =
        <input type="number" min="1" max="10" step="0.1" bind:value={ratio} class="w-14 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
      <label class="text-xs">seed =
        <input type="number" bind:value={seed} class="w-16 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
      </label>
    {/if}
    <label class="text-xs flex items-center gap-1">noise p =
      <input type="range" min="0" max="1" step="0.05" bind:value={p} class="w-32" />
      <span class="font-mono">{p.toFixed(2)}</span>
    </label>
    <button class="btn btn-sm" onclick={generate}>Regenerate</button>
    <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶ Auto'}</button>
    <button class="btn btn-sm" onclick={step}>Step</button>
  </div>

  {#if mode === 'custom'}
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Custom CNF — one clause per line, integers for variables (negative = negation)</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="4" bind:value={customCNF}></textarea>
    </label>
  {/if}

  <div class="text-sm">
    <b>{clauses.length}</b> clauses · <b>{unsatCount}</b> unsatisfied · <b>{flips}</b> flips
    {#if unsatCount === 0}<span class="ml-2 text-emerald-700 dark:text-emerald-300 font-medium">✓ SAT found!</span>{/if}
  </div>

  <div>
    <div class="text-xs font-semibold mb-1 text-ink-500">Current assignment ({assignment.length - 1} vars)</div>
    <div class="flex flex-wrap gap-0.5 font-mono text-[10px]">
      {#each Array(Math.max(0, assignment.length - 1)) as _, idx (idx)}
        {@const v = assignment[idx + 1]}
        <div class="w-6 h-6 flex items-center justify-center rounded {v ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' : 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100'} border border-ink-300 dark:border-ink-700" title="x{idx + 1} = {v ? 'T' : 'F'}">
          x{idx + 1}
        </div>
      {/each}
    </div>
  </div>

  <div>
    <div class="text-xs font-semibold mb-1">Unsatisfied clauses over time</div>
    <svg viewBox="0 0 800 100" preserveAspectRatio="none" class="w-full h-24 border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900">
      {#if history.length > 1}
        {@const maxH = Math.max(...history, 1)}
        <polyline fill="none" stroke="#3b82f6" stroke-width="1.5" points={history.map((h, i) => `${(i / Math.max(1, history.length - 1)) * 800},${100 - (h / maxH) * 90 - 5}`).join(' ')} />
        <text x="6" y="14" font-size="10" fill="#64748b">max {maxH}</text>
      {/if}
    </svg>
  </div>

  <div class="text-xs text-ink-500">Try p = 0 (pure greedy) vs p = 1 (pure random). Watch the time-to-SAT difference.</div>

  <div class="card !p-3">
    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Live trace ({trace.length} events)</div>
    <ol class="font-mono text-[11px] space-y-0.5 list-none p-0 max-h-44 overflow-y-auto">
      {#each trace.slice().reverse() as t, i}
        <li class="{i === 0 ? 'font-semibold text-accent-700 dark:text-accent-300' : 'text-ink-500'}"><MathText src={t} /></li>
      {/each}
    </ol>
  </div>

  <ExamAnswer answer={examAnswer} summary={`${unsatCount === 0 ? '✓ SAT' : `${unsatCount} unsat`} · ${flips} flips · p = ${p.toFixed(2)}`} />
</div>
