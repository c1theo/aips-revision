<script lang="ts">
  let { onOpenPalette, onToggleSidebar } = $props<{ onOpenPalette: () => void; onToggleSidebar: () => void }>();

  let isDark = $state(false);

  $effect(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      isDark = false;
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      isDark = true;
    }
  }
</script>

<header class="sticky top-0 z-20 backdrop-blur bg-white/85 dark:bg-ink-950/85 border-b border-ink-200 dark:border-ink-800">
  <div class="px-6 lg:px-10 py-3 flex items-center gap-4">
    <button class="md:hidden btn btn-sm" onclick={onToggleSidebar} aria-label="menu">☰</button>
    <button class="flex-1 max-w-md text-left flex items-center gap-2 px-3 py-1.5 rounded-md border border-ink-300 dark:border-ink-700 bg-ink-50 dark:bg-ink-900 text-sm text-ink-500" onclick={onOpenPalette}>
      <span>🔍</span>
      <span>Search topics, concepts, algorithms…</span>
      <span class="ml-auto text-xs"><kbd class="px-1.5 py-0.5 bg-white dark:bg-ink-800 border border-ink-300 dark:border-ink-700 rounded">Ctrl K</kbd></span>
    </button>
    <button class="btn btn-sm" onclick={toggleTheme} aria-label="toggle theme">
      {isDark ? '☀' : '☾'}
    </button>
  </div>
</header>
