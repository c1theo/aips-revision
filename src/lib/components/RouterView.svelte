<script lang="ts">
  import { route } from '../router';
  import Home from '../pages/Home.svelte';
  import TopicPage from '../pages/TopicPage.svelte';
  import Ask from '../pages/Ask.svelte';
  import Pseudocode from '../pages/Pseudocode.svelte';
  import Proofs from '../pages/Proofs.svelte';
  import MockExam from '../pages/MockExam.svelte';
  import ConceptMap from '../pages/ConceptMap.svelte';
  import Flashcards from '../pages/Flashcards.svelte';
  import Glossary from '../pages/Glossary.svelte';
  import Cheatsheet from '../pages/Cheatsheet.svelte';
  import Complexity from '../pages/Complexity.svelte';
  import Pitfalls from '../pages/Pitfalls.svelte';
  import Visualizers from '../pages/Visualizers.svelte';
  import PastPapers from '../pages/PastPapers.svelte';
  import NotFound from '../pages/NotFound.svelte';
</script>

{#if $route.path === '/'}
  <Home />
{:else if $route.path.startsWith('/topic/')}
  <TopicPage slug={$route.path.slice('/topic/'.length)} />
{:else if $route.path === '/ask'}
  <Ask />
{:else if $route.path === '/pseudocode'}
  <Pseudocode />
{:else if $route.path === '/proofs'}
  <Proofs />
{:else if $route.path === '/mock-exam'}
  <MockExam />
{:else if $route.path === '/concept-map'}
  <ConceptMap />
{:else if $route.path === '/flashcards'}
  <Flashcards />
{:else if $route.path === '/glossary'}
  <Glossary />
{:else if $route.path === '/cheatsheet'}
  <Cheatsheet />
{:else if $route.path === '/complexity'}
  <Complexity />
{:else if $route.path === '/pitfalls'}
  <Pitfalls />
{:else if $route.path === '/visualizers'}
  <Visualizers />
{:else if $route.path === '/past-papers'}
  <PastPapers />
{:else}
  <NotFound />
{/if}
