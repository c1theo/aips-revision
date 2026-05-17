<script lang="ts">
  import { renderMarkdown } from '../markdown';
  import type { CalloutKind } from '../types';
  let { variant, title, body } = $props<{ variant: CalloutKind; title?: string; body: string }>();

  const titleMap: Record<CalloutKind, string> = {
    pitfall: '⚠ Pitfall',
    keyfact: '★ Key fact',
    whatif: '? What if',
    nightingale: '🎯 York / Nightingale note',
  };
  const cls: Record<CalloutKind, string> = {
    pitfall: 'pitfall',
    keyfact: 'keyfact',
    whatif: 'whatif',
    nightingale: 'nightingale',
  };
</script>

<div class={cls[variant]}>
  <div class="{variant}-title font-bold mb-1">{title ? titleMap[variant] + ' — ' + title : titleMap[variant]}</div>
  <div>{@html renderMarkdown(body)}</div>
</div>
