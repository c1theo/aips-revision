<script lang="ts">
  import { renderInline } from '../markdown';
  let { src = '' } = $props<{ src?: string }>();
</script>

{@html renderInline(src)}
