<script lang="ts">
  // AC-3 step-by-step on a small constraint graph (map colouring of Australia).
  interface Constraint { a: string; b: string; predicate: (va: string | number, vb: string | number) => boolean; label: string }

  type Problem = 'australia' | 'custom';
  let problem = $state<Problem>('australia');

  type Domain = Record<string, (string | number)[]>;

  function australia(): { vars: string[]; D: Domain; C: Constraint[] } {
    const vars = ['WA','NT','SA','Q','NSW','V','T'];
    const colors = ['R','G','B'];
    const D: Domain = {}; vars.forEach((v) => (D[v] = [...colors]));
    const edges: [string, string][] = [
      ['WA','NT'],['WA','SA'],['NT','SA'],['NT','Q'],['SA','Q'],['SA','NSW'],['SA','V'],['Q','NSW'],['NSW','V']
    ];
    const C: Constraint[] = [];
    for (const [a, b] of edges) {
      C.push({ a, b, predicate: (x, y) => x !== y, label: `${a} ≠ ${b}` });
      C.push({ a: b, b: a, predicate: (x, y) => x !== y, label: `${b} ≠ ${a}` });
    }
    return { vars, D, C };
  }

  let setup = $state(australia());
  let initialQueue = $derived(setup.C.map((c) => ({ a: c.a, b: c.b, label: c.label })));

  interface Step {
    queue: { a: string; b: string }[];
    D: Domain;
    msg: string;
    revising?: { a: string; b: string };
    removed?: { var: string; val: string | number };
    failure?: boolean;
  }

  function runAC3(): Step[] {
    const steps: Step[] = [];
    const D: Domain = JSON.parse(JSON.stringify(setup.D));
    const queue = initialQueue.map((q) => ({ a: q.a, b: q.b }));
    steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Initialise queue with ${queue.length} arcs.` });

    while (queue.length) {
      const arc = queue.shift()!;
      steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Pop arc (${arc.a}, ${arc.b}).`, revising: arc });
      // REVISE
      const constraint = setup.C.find((c) => c.a === arc.a && c.b === arc.b);
      if (!constraint) continue;
      const newD: (string | number)[] = [];
      let removed = false;
      for (const v of D[arc.a]) {
        const hasSupport = D[arc.b].some((w) => constraint.predicate(v, w));
        if (hasSupport) newD.push(v);
        else {
          removed = true;
          steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Remove ${v} from D(${arc.a}) — no support in D(${arc.b}).`, revising: arc, removed: { var: arc.a, val: v } });
        }
      }
      if (removed) {
        D[arc.a] = newD;
        if (D[arc.a].length === 0) {
          steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `D(${arc.a}) is empty — failure.`, failure: true });
          return steps;
        }
        // re-enqueue (X_k, X_i)
        const neighbours = setup.C.filter((c) => c.b === arc.a && c.a !== arc.b).map((c) => ({ a: c.a, b: c.b }));
        for (const nb of neighbours) {
          if (!queue.some((q) => q.a === nb.a && q.b === nb.b)) queue.push(nb);
        }
        steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Re-enqueue ${neighbours.length} arcs (X_k, ${arc.a}) for changed domain.` });
      } else {
        steps.push({ queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `No revisions needed for (${arc.a}, ${arc.b}).` });
      }
    }
    steps.push({ queue: [], D: JSON.parse(JSON.stringify(D)), msg: `Done — arc-consistent.` });
    return steps;
  }

  let steps = $state<Step[]>(runAC3());
  let idx = $state(0);
  function reset() {
    setup = australia();
    steps = runAC3();
    idx = 0;
  }

  // Force a specific colour to see propagation
  function force(varName: string, colour: string) {
    setup.D[varName] = [colour];
    steps = runAC3();
    idx = 0;
  }

  function colourFor(c: string | number): string {
    if (c === 'R') return '#fecaca';
    if (c === 'G') return '#bbf7d0';
    if (c === 'B') return '#bfdbfe';
    return '#e2e8f0';
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={() => (idx = Math.max(0, idx - 1))} disabled={idx === 0}>⏮ Prev</button>
    <button class="btn btn-sm btn-primary" onclick={() => (idx = Math.min(steps.length - 1, idx + 1))} disabled={idx >= steps.length - 1}>Next ⏭</button>
    <button class="btn btn-sm" onclick={() => (idx = steps.length - 1)}>End</button>
    <button class="btn btn-sm" onclick={reset}>Reset</button>
    <span class="text-xs text-ink-500 ml-auto">step {idx + 1}/{steps.length}</span>
  </div>
  <div class="text-sm font-medium">{steps[idx]?.msg ?? ''}</div>

  <div class="grid sm:grid-cols-2 gap-4">
    <div>
      <h4 class="text-sm font-semibold mb-2">Domains</h4>
      <div class="grid grid-cols-7 gap-1 text-xs font-mono">
        {#each setup.vars as v}
          <div class="card !p-2 text-center">
            <div class="font-bold text-sm">{v}</div>
            <div class="flex justify-center gap-0.5 mt-1">
              {#each ['R','G','B'] as col}
                {@const inD = steps[idx]?.D[v]?.includes(col)}
                <span class="inline-block w-4 h-4 rounded-sm border" style:background-color={inD ? colourFor(col) : '#f8fafc'} style:opacity={inD ? '1' : '0.2'} style:border-color={inD ? '#475569' : '#cbd5e1'} title={col}></span>
              {/each}
            </div>
            <div class="text-[10px] text-ink-500 mt-1">{steps[idx]?.D[v]?.join(',')}</div>
            <div class="flex gap-0.5 justify-center mt-1">
              {#each ['R','G','B'] as col}
                <button class="text-[9px] px-1 rounded border border-ink-300 dark:border-ink-700 hover:bg-accent-100" onclick={() => force(v, col)}>{col}</button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h4 class="text-sm font-semibold mb-2">Arc queue ({steps[idx]?.queue.length ?? 0})</h4>
      <div class="card !p-2 text-xs font-mono max-h-[260px] overflow-y-auto">
        {#each steps[idx]?.queue ?? [] as q, i}
          <div class="px-1 py-0.5 {i === 0 ? 'bg-accent-100 dark:bg-accent-900/30 rounded' : ''}">
            ({q.a}, {q.b})
          </div>
        {/each}
        {#if (steps[idx]?.queue.length ?? 0) === 0}<div class="text-ink-500 italic">empty</div>{/if}
      </div>
      {#if steps[idx]?.revising}
        <div class="text-xs mt-2 text-violet-700 dark:text-violet-300">▶ REVISE({steps[idx].revising!.a}, {steps[idx].revising!.b})</div>
      {/if}
      {#if steps[idx]?.removed}
        <div class="text-xs mt-1 text-rose-700 dark:text-rose-300">✗ removed {steps[idx].removed!.val} from D({steps[idx].removed!.var})</div>
      {/if}
    </div>
  </div>

  <div class="text-xs text-ink-500">Click R/G/B chips in any domain to force a value and watch propagation.</div>
</div>
