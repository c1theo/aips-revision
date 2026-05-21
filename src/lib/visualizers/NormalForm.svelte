<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';

  // Normal-form game analyser.
  // User enters a 2-player payoff matrix; we compute dominant strategies,
  // pure Nash equilibria via cell-marking, IEDS, maximin/minimax (for
  // zero-sum games), and produce a full exam-paper-style writeup.

  type Preset = 'prisoner' | 'auditions' | 'matching-pennies' | 'stag-hunt' | 'battle' | 'chicken' | 'custom';
  let preset = $state<Preset>('auditions');

  // Matrix entry: (player1 payoff, player2 payoff)
  interface Cell { p1: number; p2: number }
  let p1Actions = $state<string[]>(['P', 'S']);
  let p2Actions = $state<string[]>(['P', 'S']);
  let matrix = $state<Cell[][]>([
    [{ p1: 0, p2: 0 }, { p1: 50, p2: 30 }],
    [{ p1: 30, p2: 50 }, { p1: 30, p2: 30 }],
  ]);

  function loadPreset(p: Preset) {
    if (p === 'prisoner') {
      p1Actions = ['C', 'D']; p2Actions = ['C', 'D'];
      matrix = [
        [{ p1: -1, p2: -1 }, { p1: -3, p2: 0 }],
        [{ p1: 0, p2: -3 }, { p1: -2, p2: -2 }],
      ];
    } else if (p === 'auditions') {
      p1Actions = ['P', 'S']; p2Actions = ['P', 'S'];
      matrix = [
        [{ p1: 0, p2: 0 }, { p1: 50, p2: 30 }],
        [{ p1: 30, p2: 50 }, { p1: 30, p2: 30 }],
      ];
    } else if (p === 'matching-pennies') {
      p1Actions = ['H', 'T']; p2Actions = ['H', 'T'];
      matrix = [
        [{ p1: 1, p2: -1 }, { p1: -1, p2: 1 }],
        [{ p1: -1, p2: 1 }, { p1: 1, p2: -1 }],
      ];
    } else if (p === 'stag-hunt') {
      p1Actions = ['Stag', 'Hare']; p2Actions = ['Stag', 'Hare'];
      matrix = [
        [{ p1: 2, p2: 2 }, { p1: 0, p2: 1 }],
        [{ p1: 1, p2: 0 }, { p1: 1, p2: 1 }],
      ];
    } else if (p === 'battle') {
      p1Actions = ['Ballet', 'Football']; p2Actions = ['Ballet', 'Football'];
      matrix = [
        [{ p1: 2, p2: 1 }, { p1: 0, p2: 0 }],
        [{ p1: 0, p2: 0 }, { p1: 1, p2: 2 }],
      ];
    } else if (p === 'chicken') {
      p1Actions = ['Swerve', 'Straight']; p2Actions = ['Swerve', 'Straight'];
      matrix = [
        [{ p1: 0, p2: 0 }, { p1: -1, p2: 1 }],
        [{ p1: 1, p2: -1 }, { p1: -10, p2: -10 }],
      ];
    }
  }

  $effect(() => { if (preset !== 'custom') loadPreset(preset); });

  // Resize matrix when actions change
  function ensureMatrix() {
    const newMat: Cell[][] = [];
    for (let i = 0; i < p1Actions.length; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < p2Actions.length; j++) {
        row.push(matrix[i]?.[j] ?? { p1: 0, p2: 0 });
      }
      newMat.push(row);
    }
    matrix = newMat;
  }

  function addP1Action() { p1Actions = [...p1Actions, `a${p1Actions.length + 1}`]; ensureMatrix(); }
  function removeP1Action(i: number) { p1Actions = p1Actions.filter((_, k) => k !== i); ensureMatrix(); }
  function addP2Action() { p2Actions = [...p2Actions, `b${p2Actions.length + 1}`]; ensureMatrix(); }
  function removeP2Action(j: number) { p2Actions = p2Actions.filter((_, k) => k !== j); ensureMatrix(); }

  // ── Analysis ──
  function dominanceForP1(): { dominant: { i: number; dominated: number; kind: 'strict' | 'weak' }[] } {
    const out: { i: number; dominated: number; kind: 'strict' | 'weak' }[] = [];
    for (let i = 0; i < p1Actions.length; i++) {
      for (let k = 0; k < p1Actions.length; k++) {
        if (i === k) continue;
        let allGe = true, anyGt = true, allGt = true;
        for (let j = 0; j < p2Actions.length; j++) {
          const a = matrix[i][j].p1, b = matrix[k][j].p1;
          if (a < b) { allGe = false; allGt = false; }
          if (a <= b) allGt = false;
        }
        if (allGt) out.push({ i, dominated: k, kind: 'strict' });
        else if (allGe) {
          // need at least one strict >
          let oneStrict = false;
          for (let j = 0; j < p2Actions.length; j++) if (matrix[i][j].p1 > matrix[k][j].p1) { oneStrict = true; break; }
          if (oneStrict) out.push({ i, dominated: k, kind: 'weak' });
        }
      }
    }
    return { dominant: out };
  }
  function dominanceForP2(): { dominant: { j: number; dominated: number; kind: 'strict' | 'weak' }[] } {
    const out: { j: number; dominated: number; kind: 'strict' | 'weak' }[] = [];
    for (let j = 0; j < p2Actions.length; j++) {
      for (let k = 0; k < p2Actions.length; k++) {
        if (j === k) continue;
        let allGt = true, allGe = true;
        for (let i = 0; i < p1Actions.length; i++) {
          const a = matrix[i][j].p2, b = matrix[i][k].p2;
          if (a < b) { allGe = false; allGt = false; }
          if (a <= b) allGt = false;
        }
        if (allGt) out.push({ j, dominated: k, kind: 'strict' });
        else if (allGe) {
          let oneStrict = false;
          for (let i = 0; i < p1Actions.length; i++) if (matrix[i][j].p2 > matrix[i][k].p2) { oneStrict = true; break; }
          if (oneStrict) out.push({ j, dominated: k, kind: 'weak' });
        }
      }
    }
    return { dominant: out };
  }
  // Pure NEs via cell marking
  function pureNash(): { i: number; j: number }[] {
    const nes: { i: number; j: number }[] = [];
    for (let i = 0; i < p1Actions.length; i++) {
      for (let j = 0; j < p2Actions.length; j++) {
        // Is (i, j) p1-best given column j?
        let p1Best = true;
        for (let i2 = 0; i2 < p1Actions.length; i2++) if (matrix[i2][j].p1 > matrix[i][j].p1) { p1Best = false; break; }
        if (!p1Best) continue;
        // Is (i, j) p2-best given row i?
        let p2Best = true;
        for (let j2 = 0; j2 < p2Actions.length; j2++) if (matrix[i][j2].p2 > matrix[i][j].p2) { p2Best = false; break; }
        if (p2Best) nes.push({ i, j });
      }
    }
    return nes;
  }
  // Zero-sum check
  function isZeroSum(): boolean {
    for (let i = 0; i < p1Actions.length; i++)
      for (let j = 0; j < p2Actions.length; j++)
        if (Math.abs(matrix[i][j].p1 + matrix[i][j].p2) > 1e-9) return false;
    return true;
  }
  // Maximin (player 1) and minimax (player 2) for zero-sum
  function maximinP1(): { value: number; row: number } {
    let best = -Infinity, bestRow = 0;
    for (let i = 0; i < p1Actions.length; i++) {
      let rowMin = Infinity;
      for (let j = 0; j < p2Actions.length; j++) rowMin = Math.min(rowMin, matrix[i][j].p1);
      if (rowMin > best) { best = rowMin; bestRow = i; }
    }
    return { value: best, row: bestRow };
  }
  function minimaxP2(): { value: number; col: number } {
    let best = Infinity, bestCol = 0;
    for (let j = 0; j < p2Actions.length; j++) {
      let colMax = -Infinity;
      for (let i = 0; i < p1Actions.length; i++) colMax = Math.max(colMax, matrix[i][j].p1);
      if (colMax < best) { best = colMax; bestCol = j; }
    }
    return { value: best, col: bestCol };
  }

  const p1Dom = $derived(dominanceForP1());
  const p2Dom = $derived(dominanceForP2());
  const nes = $derived(pureNash());
  const zeroSum = $derived(isZeroSum());
  const mm1 = $derived(maximinP1());
  const mm2 = $derived(minimaxP2());

  // Marked cells (for cell-marking visualisation)
  function isP1Max(i: number, j: number): boolean {
    let maxV = -Infinity;
    for (let i2 = 0; i2 < p1Actions.length; i2++) maxV = Math.max(maxV, matrix[i2][j].p1);
    return matrix[i][j].p1 === maxV;
  }
  function isP2Max(i: number, j: number): boolean {
    let maxV = -Infinity;
    for (let j2 = 0; j2 < p2Actions.length; j2++) maxV = Math.max(maxV, matrix[i][j2].p2);
    return matrix[i][j].p2 === maxV;
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Game.** ${preset === 'custom' ? 'Custom 2-player normal-form game.' : `Preset: ${preset}.`}`);
    lines.push('');
    lines.push(`**Players.** $N = \\{1, 2\\}$.`);
    lines.push(`**Action sets.** $A_1 = \\{${p1Actions.join(', ')}\\}$, $A_2 = \\{${p2Actions.join(', ')}\\}$.`);
    lines.push('');
    lines.push(`**Payoff matrix** (player 1's payoff, player 2's payoff):`);
    lines.push('');
    lines.push('| | ' + p2Actions.map((a) => `**${a}**`).join(' | ') + ' |');
    lines.push('|---|' + p2Actions.map(() => '---').join('|') + '|');
    for (let i = 0; i < p1Actions.length; i++) {
      const row = ['**' + p1Actions[i] + '**'];
      for (let j = 0; j < p2Actions.length; j++) {
        row.push(`(${matrix[i][j].p1}, ${matrix[i][j].p2})`);
      }
      lines.push('| ' + row.join(' | ') + ' |');
    }
    lines.push('');
    lines.push(`**Zero-sum?** ${zeroSum ? 'Yes' : 'No'}.`);
    lines.push('');
    if (p1Dom.dominant.length > 0) {
      lines.push(`**Player 1 dominance.**`);
      for (const d of p1Dom.dominant) lines.push(`- ${p1Actions[d.i]} **${d.kind === 'strict' ? 'strictly' : 'weakly'} dominates** ${p1Actions[d.dominated]}.`);
    } else {
      lines.push(`**Player 1 dominance.** None.`);
    }
    if (p2Dom.dominant.length > 0) {
      lines.push(`**Player 2 dominance.**`);
      for (const d of p2Dom.dominant) lines.push(`- ${p2Actions[d.j]} **${d.kind === 'strict' ? 'strictly' : 'weakly'} dominates** ${p2Actions[d.dominated]}.`);
    } else {
      lines.push(`**Player 2 dominance.** None.`);
    }
    lines.push('');
    if (nes.length > 0) {
      lines.push(`**Pure-strategy Nash equilibria** (${nes.length}):`);
      for (const e of nes) lines.push(`- $(${p1Actions[e.i]}, ${p2Actions[e.j]})$ with payoffs $(${matrix[e.i][e.j].p1}, ${matrix[e.i][e.j].p2})$.`);
    } else {
      lines.push(`**Pure-strategy Nash equilibria.** None — there must be a mixed-strategy NE (Nash 1950).`);
    }
    if (zeroSum) {
      lines.push('');
      lines.push(`**Maximin / minimax** (zero-sum):`);
      lines.push(`- Player 1's maximin = ${mm1.value} (secured by row ${p1Actions[mm1.row]}).`);
      lines.push(`- Player 2's minimax = ${mm2.value} (secured by column ${p2Actions[mm2.col]}).`);
      if (Math.abs(mm1.value - mm2.value) < 1e-9) {
        lines.push(`- Maximin = minimax = **${mm1.value}** → unique value of the game (von Neumann).`);
      } else {
        lines.push(`- Maximin ≠ minimax → NE is in **mixed strategies**; pure-strategy minimax/maximin diverge.`);
      }
    }
    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap items-center gap-2 text-xs">
    <span>Preset:</span>
    {#each ['auditions','prisoner','matching-pennies','stag-hunt','battle','chicken','custom'] as p}
      <button class="px-2 py-1 rounded border {preset === p ? 'bg-accent-100 dark:bg-accent-900/40 border-accent-400' : 'border-ink-300 dark:border-ink-700'}" onclick={() => (preset = p as Preset)}>{p}</button>
    {/each}
  </div>

  <div class="grid sm:grid-cols-2 gap-2 text-xs">
    <label>
      <span class="text-ink-500">Player 1 actions (rows):</span>
      <div class="flex flex-wrap gap-1 mt-1">
        {#each p1Actions as a, i}
          <span class="flex items-center gap-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700">
            <input class="w-16 bg-transparent" bind:value={p1Actions[i]} />
            <button class="text-rose-600" onclick={() => removeP1Action(i)}>✕</button>
          </span>
        {/each}
        <button class="btn btn-sm" onclick={addP1Action}>+ add</button>
      </div>
    </label>
    <label>
      <span class="text-ink-500">Player 2 actions (cols):</span>
      <div class="flex flex-wrap gap-1 mt-1">
        {#each p2Actions as a, j}
          <span class="flex items-center gap-1 px-2 py-1 rounded border border-ink-300 dark:border-ink-700">
            <input class="w-16 bg-transparent" bind:value={p2Actions[j]} />
            <button class="text-rose-600" onclick={() => removeP2Action(j)}>✕</button>
          </span>
        {/each}
        <button class="btn btn-sm" onclick={addP2Action}>+ add</button>
      </div>
    </label>
  </div>

  <div class="card !p-3 overflow-x-auto">
    <h4 class="!mt-0 text-sm font-semibold mb-2">Payoff matrix — cell-marked</h4>
    <table class="text-sm">
      <thead>
        <tr><th></th>{#each p2Actions as a}<th class="px-3 py-1">{a}</th>{/each}</tr>
      </thead>
      <tbody>
        {#each p1Actions as a, i}
          <tr>
            <td class="font-semibold pr-2">{a}</td>
            {#each p2Actions as b, j}
              {@const ne = nes.some((n) => n.i === i && n.j === j)}
              <td class="px-2 py-1 border border-ink-200 dark:border-ink-800 {ne ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''}">
                <input class="w-12 bg-transparent text-right" type="number" bind:value={matrix[i][j].p1} />,
                <input class="w-12 bg-transparent text-right" type="number" bind:value={matrix[i][j].p2} />
                <div class="text-[10px] mt-0.5 flex gap-1">
                  {#if isP1Max(i, j)}<span class="text-blue-600 font-bold">P1 max</span>{/if}
                  {#if isP2Max(i, j)}<span class="text-violet-600 font-bold">P2 max</span>{/if}
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="text-[11px] text-ink-500 mt-2">Cells marked "P1 max" AND "P2 max" (highlighted green) are pure-strategy Nash equilibria.</div>
  </div>

  <div class="grid sm:grid-cols-2 gap-3 text-sm">
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-1">Dominance</h4>
      <div class="text-xs">
        <div><b>Player 1 (rows):</b></div>
        {#if p1Dom.dominant.length > 0}
          {#each p1Dom.dominant as d}
            <div>• <code>{p1Actions[d.i]}</code> {d.kind === 'strict' ? 'strictly' : 'weakly'} dominates <code>{p1Actions[d.dominated]}</code></div>
          {/each}
        {:else}
          <div class="text-ink-500">No dominance.</div>
        {/if}
        <div class="mt-2"><b>Player 2 (cols):</b></div>
        {#if p2Dom.dominant.length > 0}
          {#each p2Dom.dominant as d}
            <div>• <code>{p2Actions[d.j]}</code> {d.kind === 'strict' ? 'strictly' : 'weakly'} dominates <code>{p2Actions[d.dominated]}</code></div>
          {/each}
        {:else}
          <div class="text-ink-500">No dominance.</div>
        {/if}
      </div>
    </div>
    <div class="card !p-3">
      <h4 class="!mt-0 text-sm font-semibold mb-1">Pure Nash equilibria</h4>
      <div class="text-xs">
        {#if nes.length > 0}
          {#each nes as e}
            <div>• ({p1Actions[e.i]}, {p2Actions[e.j]}) with payoffs ({matrix[e.i][e.j].p1}, {matrix[e.i][e.j].p2})</div>
          {/each}
        {:else}
          <div class="text-ink-500">None — mixed-strategy NE exists (Nash 1950).</div>
        {/if}
        {#if zeroSum}
          <div class="mt-2 pt-2 border-t border-ink-200 dark:border-ink-800">
            <b>Zero-sum:</b> yes
            <div>Maximin (P1) = {mm1.value} via row {p1Actions[mm1.row]}</div>
            <div>Minimax (P2) = {mm2.value} via col {p2Actions[mm2.col]}</div>
            {#if mm1.value === mm2.value}
              <div class="text-emerald-700 dark:text-emerald-300">Value of the game = {mm1.value}</div>
            {:else}
              <div class="text-amber-700 dark:text-amber-300">Maximin ≠ minimax → mixed-strategy NE only</div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <ExamAnswer answer={examAnswer} summary={`${p1Actions.length}×${p2Actions.length} game · ${nes.length} pure NE${nes.length === 1 ? '' : 's'}${zeroSum ? ' · zero-sum' : ''}`} />
</div>
