<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import TopBar from './lib/components/TopBar.svelte';
  import RouterView from './lib/components/RouterView.svelte';
  import CommandPalette from './lib/components/CommandPalette.svelte';

  let paletteOpen = $state(false);
  let sidebarOpen = $state(false);

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        paletteOpen = true;
      }
      if (e.key === 'Escape') paletteOpen = false;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        paletteOpen = true;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="min-h-screen flex bg-white dark:bg-ink-950">
  <Sidebar bind:open={sidebarOpen} />
  <div class="flex-1 flex flex-col min-w-0">
    <TopBar onOpenPalette={() => (paletteOpen = true)} onToggleSidebar={() => (sidebarOpen = !sidebarOpen)} />
    <main class="flex-1 px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
      <RouterView />
    </main>
    <footer class="border-t border-ink-200 dark:border-ink-800 px-6 lg:px-10 py-4 text-xs text-ink-500 dark:text-ink-400">
      AIPS Revision &middot; COM00050H &middot; No generative AI used in-page &middot; Built for exam use &middot;
      <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-[10px]">Ctrl</kbd>+<kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-[10px]">K</kbd> to search
    </footer>
  </div>
</div>

{#if paletteOpen}
  <CommandPalette onClose={() => (paletteOpen = false)} />
{/if}
