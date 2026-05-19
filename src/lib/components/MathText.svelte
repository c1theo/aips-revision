<script lang="ts">
  import katex from 'katex';
  let { src = '' } = $props<{ src?: string }>();

  function render(s: string): string {
    if (!s) return '';
    // escape HTML
    let out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // block math $$...$$
    out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
      try { return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false, output: 'html' }); }
      catch { return `$$${expr}$$`; }
    });
    // inline math $...$
    out = out.replace(/(^|[^\\$])\$([^\n$`]+?)\$/g, (_, prefix, expr) => {
      try { return prefix + katex.renderToString(expr, { displayMode: false, throwOnError: false, output: 'html' }); }
      catch { return `${prefix}$${expr}$`; }
    });
    return out;
  }
</script>

{@html render(src)}
