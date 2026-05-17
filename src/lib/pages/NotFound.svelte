<script lang="ts">
  import { href } from '../router';
</script>

<article class="prose max-w-none text-center py-20">
  <div class="text-6xl font-bold text-ink-300 dark:text-ink-700">404</div>
  <h1>Page not found</h1>
  <p>That URL doesn't match any topic.</p>
  <a class="btn btn-primary" href={href('/')}>← Back to overview</a>
</article>
