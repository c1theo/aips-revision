<script lang="ts">
  // N-Queens with backtracking + MRV/LCV/FC toggles
  let n = $state(6);
  let mrv = $state(true);
  let lcv = $state(false);
  let fc = $state(true);

  type Step = { assignment: number[]; domains: number[][]; msg: string; tried?: { row: number; col: number; ok: boolean } };
  let steps = $state<Step[]>([]);
  let idx = $state(0);
  let stats = $state({ backtracks: 0, nodes: 0 });

  function solveNQueens() {
    const out: Step[] = [];
    const assignment: number[] = new Array(n).fill(-1);
    const domains: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, (_, i) => i));
    let backtracks = 0, nodes = 0;
    out.push({ assignment: [...assignment], domains: domains.map((d) => [...d]), msg: 'Initial — all domains full.' });

    function attacks(r1: number, c1: number, r2: number, c2: number) {
      return c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2);
    }
    function propagate(): boolean {
      // forward checking: re-derive domains for unassigned rows from assigned ones
      let ok = true;
      for (let r = 0; r < n; r++) {
        if (assignment[r] !== -1) continue;
        domains[r] = [];
        for (let c = 0; c < n; c++) {
          let conflict = false;
          for (let r2 = 0; r2 < n; r2++) {
            if (assignment[r2] !== -1 && attacks(r, c, r2, assignment[r2])) { conflict = true; break; }
          }
          if (!conflict) domains[r].push(c);
        }
        if (domains[r].length === 0) ok = false;
      }
      return ok;
    }

    function selectVar(): number {
      const unassigned = [];
      for (let r = 0; r < n; r++) if (assignment[r] === -1) unassigned.push(r);
      if (mrv) {
        unassigned.sort((a, b) => domains[a].length - domains[b].length);
      }
      return unassigned[0];
    }

    function orderValues(row: number): number[] {
      const candidates = [...domains[row]];
      if (lcv) {
        // count how many neighbours' values it removes
        candidates.sort((a, b) => {
          const removeA = countAffected(row, a);
          const removeB = countAffected(row, b);
          return removeA - removeB;
        });
      }
      return candidates;
    }

    function countAffected(row: number, col: number): number {
      let n_aff = 0;
      for (let r = 0; r < n; r++) {
        if (assignment[r] !== -1 || r === row) continue;
        for (const c of domains[r]) {
          if (attacks(row, col, r, c)) n_aff += 1;
        }
      }
      return n_aff;
    }

    function backtrack(): boolean {
      if (assignment.every((x) => x !== -1)) {
        out.push({ assignment: [...assignment], domains: domains.map((d) => [...d]), msg: '✓ Solution found.' });
        return true;
      }
      const r = selectVar();
      const vals = orderValues(r);
      out.push({ assignment: [...assignment], domains: domains.map((d) => [...d]), msg: `Select row ${r} (|D|=${domains[r].length})${mrv ? ' [MRV]' : ''}.${vals.length === 0 ? ' Domain empty.' : ` Try values ${vals.join(',')}${lcv ? ' [LCV]' : ''}.`}` });
      const savedDomains = domains.map((d) => [...d]);
      for (const c of vals) {
        nodes += 1;
        assignment[r] = c;
        const propOk = !fc || propagate();
        out.push({ assignment: [...assignment], domains: domains.map((d) => [...d]), msg: `Place queen at (${r}, ${c}). ${fc ? (propOk ? 'FC ok.' : 'FC: empty domain — backtrack.') : ''}`, tried: { row: r, col: c, ok: propOk } });
        if (propOk) {
          if (backtrack()) return true;
        }
        assignment[r] = -1;
        // restore domains
        for (let i = 0; i < n; i++) domains[i] = [...savedDomains[i]];
        backtracks += 1;
        out.push({ assignment: [...assignment], domains: domains.map((d) => [...d]), msg: `Backtrack from (${r}, ${c}).` });
      }
      return false;
    }
    propagate();
    backtrack();
    stats = { backtracks, nodes };
    return out;
  }

  function run() { steps = solveNQueens(); idx = 0; }
  $effect(() => { n; mrv; lcv; fc; run(); });

  let playing = $state(false);
  function play() {
    if (playing) { playing = false; return; }
    playing = true;
    const tick = () => {
      if (!playing) return;
      if (idx >= steps.length - 1) { playing = false; return; }
      idx += 1;
      setTimeout(tick, 80);
    };
    tick();
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center">
    <label class="text-xs">n =
      <input type="number" min="3" max="9" bind:value={n} class="w-12 px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" />
    </label>
    <label class="text-xs flex items-center gap-1"><input type="checkbox" bind:checked={mrv}>MRV</label>
    <label class="text-xs flex items-center gap-1"><input type="checkbox" bind:checked={lcv}>LCV</label>
    <label class="text-xs flex items-center gap-1"><input type="checkbox" bind:checked={fc}>Forward checking</label>
    <span class="text-xs text-ink-500 ml-3">nodes {stats.nodes} · backtracks {stats.backtracks}</span>
    <div class="ml-auto flex gap-1">
      <button class="btn btn-sm" onclick={() => (idx = Math.max(0, idx - 1))}>⏮</button>
      <button class="btn btn-sm btn-primary" onclick={play}>{playing ? '⏸' : '▶'}</button>
      <button class="btn btn-sm" onclick={() => (idx = Math.min(steps.length - 1, idx + 1))}>⏭</button>
      <button class="btn btn-sm" onclick={() => (idx = steps.length - 1)}>End</button>
    </div>
  </div>
  <div class="text-sm font-medium">{steps[idx]?.msg ?? ''} <span class="text-xs text-ink-500">({idx + 1}/{steps.length})</span></div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <div class="inline-block border border-ink-300 dark:border-ink-700">
        {#each Array(n) as _, r}
          <div class="flex">
            {#each Array(n) as _, c}
              {@const isQueen = steps[idx]?.assignment[r] === c}
              {@const inDomain = steps[idx]?.domains[r]?.includes(c)}
              {@const dark = (r + c) % 2 === 1}
              <div class="w-8 h-8 flex items-center justify-center text-lg font-bold {dark ? 'bg-ink-200 dark:bg-ink-800' : 'bg-ink-50 dark:bg-ink-900'} {steps[idx]?.tried && steps[idx].tried!.row === r && steps[idx].tried!.col === c ? (steps[idx].tried!.ok ? '!bg-emerald-300' : '!bg-rose-300') : ''}">
                {#if isQueen}♛{:else if inDomain && steps[idx]?.assignment[r] === -1}<span class="w-1.5 h-1.5 rounded-full bg-accent-400"></span>{/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
    <div class="text-xs font-mono">
      <div class="text-sm font-semibold mb-2 font-sans">Domains</div>
      {#each Array(n) as _, r}
        <div class="flex gap-1 items-center mb-0.5">
          <span class="w-10 text-ink-500">row {r}:</span>
          <span class="px-1">{steps[idx]?.assignment[r] !== undefined && steps[idx].assignment[r] !== -1 ? '= ' + steps[idx].assignment[r] : '{' + (steps[idx]?.domains[r]?.join(',') ?? '') + '}'}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
