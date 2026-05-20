<script lang="ts">
  import { modules } from '../content';
  import { route, href } from '../router';

  let { open = $bindable(false) } = $props();

  const tools = [
    { path: '/solve', label: '🎯 Question router' },
    { path: '/ask', label: '🔮 Ask (intelligent search)' },
    { path: '/mock-exam', label: '📝 Mock exam' },
    { path: '/flashcards', label: 'Flashcards' },
    { path: '/concept-map', label: '🗺 Concept map' },
    { path: '/pseudocode', label: 'Pseudocode reference' },
    { path: '/proofs', label: 'Proofs archive' },
    { path: '/glossary', label: 'Glossary' },
    { path: '/cheatsheet', label: 'Cheatsheets' },
    { path: '/complexity', label: 'Complexity table' },
    { path: '/pitfalls', label: 'Pitfalls' },
    { path: '/visualizers', label: 'All visualizers' },
    { path: '/past-papers', label: 'Past papers' },
  ];
</script>

<aside
  class="border-r border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-900 w-64 shrink-0 overflow-y-auto sticky top-0 h-screen
  {open ? 'block fixed z-40 inset-y-0 left-0' : 'hidden'} md:block"
>
  <div class="px-4 py-5 border-b border-ink-200 dark:border-ink-800">
    <a href={href('/')} class="block no-underline text-ink-900 dark:text-ink-50">
      <div class="font-bold text-lg leading-tight">AIPS Revision</div>
      <div class="text-xs text-ink-500 mt-0.5">COM00050H · York</div>
    </a>
  </div>

  <nav class="px-3 py-2 text-sm">
    <a class="nav-link {$route.path === '/' ? 'active' : ''}" href={href('/')}>Overview</a>

    {#each modules as m}
      <div class="nav-section">{m.title}</div>
      {#each m.topics as t}
        <a class="nav-link {$route.path === '/topic/' + t.slug ? 'active' : ''}" href={href('/topic/' + t.slug)}>
          {t.title}
        </a>
      {/each}
    {/each}

    <div class="nav-section">Tools</div>
    {#each tools as t}
      <a class="nav-link {$route.path === t.path ? 'active' : ''}" href={href(t.path)}>{t.label}</a>
    {/each}
  </nav>
</aside>

{#if open}
  <button class="md:hidden fixed inset-0 bg-black/50 z-30" aria-label="close" onclick={() => (open = false)}></button>
{/if}
