<script lang="ts">
  import type { VizKey } from '../types';
  import SearchGrid from '../visualizers/SearchGrid.svelte';
  import SearchCompare from '../visualizers/SearchCompare.svelte';
  import SearchTree from '../visualizers/SearchTree.svelte';
  import SearchGraph from '../visualizers/SearchGraph.svelte';
  import MinimaxTree from '../visualizers/MinimaxTree.svelte';
  import MCTSTree from '../visualizers/MCTSTree.svelte';
  import AC3 from '../visualizers/AC3.svelte';
  import AC4 from '../visualizers/AC4.svelte';
  import AC2001 from '../visualizers/AC2001.svelte';
  import ForwardCheck from '../visualizers/ForwardCheck.svelte';
  import NQueens from '../visualizers/NQueens.svelte';
  import MinConflicts from '../visualizers/MinConflicts.svelte';
  import TwoWayBranching from '../visualizers/TwoWayBranching.svelte';
  import ConstraintGraph from '../visualizers/ConstraintGraph.svelte';
  import CSPLab from '../visualizers/CSPLab.svelte';
  import ReginAllDiff from '../visualizers/ReginAllDiff.svelte';
  import TreeCSP from '../visualizers/TreeCSP.svelte';
  import TwoSAT from '../visualizers/TwoSAT.svelte';
  import HillClimbSA from '../visualizers/HillClimbSA.svelte';
  import Expectimax from '../visualizers/Expectimax.svelte';
  import NormalForm from '../visualizers/NormalForm.svelte';
  import PhaseTransition from '../visualizers/PhaseTransition.svelte';
  import EssencePrime from '../visualizers/EssencePrime.svelte';
  import ModellingWizard from '../visualizers/ModellingWizard.svelte';
  import TruthTable from '../visualizers/TruthTable.svelte';
  import Resolution from '../visualizers/Resolution.svelte';
  import HornChain from '../visualizers/HornChain.svelte';
  import DPLL from '../visualizers/DPLL.svelte';
  import CDCL from '../visualizers/CDCL.svelte';
  import WalkSAT from '../visualizers/WalkSAT.svelte';
  import CNFEncoder from '../visualizers/CNFEncoder.svelte';
  import TseitinEncoder from '../visualizers/TseitinEncoder.svelte';
  import ComplexityTable from '../visualizers/ComplexityTable.svelte';
  import { vizExplanations } from '../vizExplanations';
  import Md from './Md.svelte';

  let { viz, title, props = {} } = $props<{ viz: VizKey; title?: string; props?: Record<string, any> }>();

  const map: Record<VizKey, any> = {
    SearchGrid, SearchCompare, SearchTree, SearchGraph, MinimaxTree, MCTSTree, AC3, AC4, AC2001, ForwardCheck, NQueens, MinConflicts, TwoWayBranching,
    ConstraintGraph, CSPLab, ReginAllDiff, TreeCSP, TwoSAT, HillClimbSA, Expectimax, NormalForm, PhaseTransition,
    EssencePrime, ModellingWizard, TruthTable, Resolution, HornChain, DPLL, CDCL, WalkSAT, CNFEncoder, TseitinEncoder, ComplexityTable,
  };
  const Comp = $derived(map[viz]);
  const explanation = $derived(vizExplanations[viz as VizKey]);
</script>

<section class="card my-6 not-prose">
  {#if title}
    <h4 class="!mt-0 mb-3 text-base font-semibold flex items-center gap-2">
      <span class="chip">Visualiser</span> {title}
    </h4>
  {/if}

  {#if explanation}
    <details class="mb-4 border-l-4 border-accent-300 dark:border-accent-700 bg-accent-50/50 dark:bg-accent-900/10 rounded-r pl-4 pr-3 py-2 text-sm">
      <summary class="cursor-pointer font-semibold text-accent-700 dark:text-accent-300 select-none">How to read this visualisation</summary>
      <div class="mt-3 space-y-2 text-ink-700 dark:text-ink-200">
        <div><span class="font-semibold text-ink-900 dark:text-ink-100">What it shows.</span> <Md src={explanation.whatItShows} /></div>
        <div><span class="font-semibold text-ink-900 dark:text-ink-100">How to use it.</span> <Md src={explanation.howToUse} /></div>
        <div>
          <span class="font-semibold text-ink-900 dark:text-ink-100">What to look for:</span>
          <ul class="list-disc pl-6 mt-1 space-y-1">
            {#each explanation.whatToLookFor as item}
              <li><Md src={item} /></li>
            {/each}
          </ul>
        </div>
        {#if explanation.relatedConcepts}
          <div class="text-xs text-ink-500">Related: {explanation.relatedConcepts.join(' · ')}</div>
        {/if}
      </div>
    </details>
  {/if}

  {#if Comp}
    <Comp {...props} />
  {:else}
    <div class="text-red-500">Unknown visualiser: {viz}</div>
  {/if}
</section>
