<script lang="ts">
  import { renderMarkdown } from '../markdown';
  let { src } = $props<{ src: string }>();
</script>

{@html renderMarkdown(src)}
