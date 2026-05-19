<script lang="ts">
  // AC-3 step-by-step on a small constraint graph (map colouring of Australia).
  interface Constraint { a: string; b: string; predicate: (va: string | number, vb: string | number) => boolean; label: string }

  type Problem = 'australia' | 'custom';
  let problem = $state<Problem>('australia');
  let customSpec = $state(`# Variables in form: name=domain (comma-list)
# Edges in form: A-B  (means A≠B constraint, symmetric)
WA=R,G,B
NT=R,G,B
SA=R,G,B
Q=R,G,B
NSW=R,G,B
V=R,G,B
T=R,G,B
edges:
WA-NT
WA-SA
NT-SA
NT-Q
SA-Q
SA-NSW
SA-V
Q-NSW
NSW-V`);

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

  function parseCustom(spec: string): { vars: string[]; D: Domain; C: Constraint[] } {
    const vars: string[] = [];
    const D: Domain = {};
    const edges: [string, string][] = [];
    let edgeMode = false;
    for (const lineR of spec.split('\n')) {
      const line = lineR.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.toLowerCase() === 'edges:') { edgeMode = true; continue; }
      if (!edgeMode) {
        const m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (m) {
          vars.push(m[1]);
          D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean);
        }
      } else {
        const parts = line.split(/[-\s,]+/).filter(Boolean);
        if (parts.length === 2) edges.push([parts[0], parts[1]]);
      }
    }
    const C: Constraint[] = [];
    for (const [a, b] of edges) {
      C.push({ a, b, predicate: (x, y) => x !== y, label: `${a} ≠ ${b}` });
      C.push({ a: b, b: a, predicate: (x, y) => x !== y, label: `${b} ≠ ${a}` });
    }
    return { vars, D, C };
  }

  let setup = $state(australia());
  $effect(() => {
    if (problem === 'australia') setup = australia();
    else {
      try { setup = parseCustom(customSpec); } catch (e) {}
    }
  });
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
  $effect(() => { setup; steps = runAC3(); idx = 0; });
  function reset() {
    if (problem === 'australia') setup = australia();
    else setup = parseCustom(customSpec);
    steps = runAC3();
    idx = 0;
  }

  // Force a specific colour to see propagation
  function force(varName: string, colour: string | number) {
    setup.D[varName] = [colour];
    steps = runAC3();
    idx = 0;
  }

  function colourFor(c: string | number): string {
    const s = String(c);
    if (s === 'R') return '#fecaca';
    if (s === 'G') return '#bbf7d0';
    if (s === 'B') return '#bfdbfe';
    if (s === 'Y') return '#fef3c7';
    if (s === 'O') return '#fed7aa';
    if (s === 'P') return '#e9d5ff';
    // hash-based fallback
    let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${h}, 65%, 80%)`;
  }

  const allDomainValues = $derived.by(() => {
    const set = new Set<string | number>();
    setup.vars.forEach((v) => setup.D[v].forEach((x) => set.add(x)));
    return [...set];
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Problem:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {problem === 'australia' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'australia')}>Australia map</button>
      <button class="px-2 py-1 {problem === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'custom')}>Custom CSP</button>
    </div>
  </div>

  {#if problem === 'custom'}
    <label class="block">
      <span class="text-xs text-ink-500 block mb-1">Custom CSP spec — variables (Name=v1,v2,…) then <code>edges:</code> then edge lines (A-B = the inequality X_A ≠ X_B). Comments with #.</span>
      <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="10" bind:value={customSpec}></textarea>
    </label>
  {/if}

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
      <div class="grid {setup.vars.length > 8 ? 'grid-cols-4' : 'grid-cols-7'} gap-1 text-xs font-mono">
        {#each setup.vars as v}
          <div class="card !p-2 text-center">
            <div class="font-bold text-sm">{v}</div>
            <div class="flex justify-center gap-0.5 mt-1 flex-wrap">
              {#each allDomainValues as col}
                {@const inD = steps[idx]?.D[v]?.includes(col)}
                <span class="inline-block w-4 h-4 rounded-sm border" style:background-color={inD ? colourFor(col) : '#f8fafc'} style:opacity={inD ? '1' : '0.2'} style:border-color={inD ? '#475569' : '#cbd5e1'} title={String(col)}></span>
              {/each}
            </div>
            <div class="text-[10px] text-ink-500 mt-1">{steps[idx]?.D[v]?.join(',')}</div>
            <div class="flex gap-0.5 justify-center mt-1 flex-wrap">
              {#each setup.D[v] as col}
                <button class="text-[9px] px-1 rounded border border-ink-300 dark:border-ink-700 hover:bg-accent-100" onclick={() => force(v, String(col))}>{col}</button>
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
