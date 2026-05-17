<script lang="ts">
  import type { VizKey } from '../types';
  import SearchGrid from '../visualizers/SearchGrid.svelte';
  import SearchTree from '../visualizers/SearchTree.svelte';
  import MinimaxTree from '../visualizers/MinimaxTree.svelte';
  import MCTSTree from '../visualizers/MCTSTree.svelte';
  import AC3 from '../visualizers/AC3.svelte';
  import NQueens from '../visualizers/NQueens.svelte';
  import MinConflicts from '../visualizers/MinConflicts.svelte';
  import EssencePrime from '../visualizers/EssencePrime.svelte';
  import TruthTable from '../visualizers/TruthTable.svelte';
  import Resolution from '../visualizers/Resolution.svelte';
  import HornChain from '../visualizers/HornChain.svelte';
  import DPLL from '../visualizers/DPLL.svelte';
  import CDCL from '../visualizers/CDCL.svelte';
  import WalkSAT from '../visualizers/WalkSAT.svelte';
  import CNFEncoder from '../visualizers/CNFEncoder.svelte';
  import ComplexityTable from '../visualizers/ComplexityTable.svelte';

  let { viz, title, props = {} } = $props<{ viz: VizKey; title?: string; props?: Record<string, any> }>();

  const map: Record<VizKey, any> = {
    SearchGrid, SearchTree, MinimaxTree, MCTSTree, AC3, NQueens, MinConflicts,
    EssencePrime, TruthTable, Resolution, HornChain, DPLL, CDCL, WalkSAT, CNFEncoder, ComplexityTable,
  };
  const Comp = $derived(map[viz]);
</script>

<section class="card my-6 not-prose">
  {#if title}
    <h4 class="!mt-0 mb-3 text-base font-semibold flex items-center gap-2">
      <span class="chip">Visualiser</span> {title}
    </h4>
  {/if}
  {#if Comp}
    <Comp {...props} />
  {:else}
    <div class="text-red-500">Unknown visualiser: {viz}</div>
  {/if}
</section>
