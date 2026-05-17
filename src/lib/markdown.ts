import { marked } from 'marked';
import katex from 'katex';

// Preprocess block math $$...$$ and inline math $...$ into HTML before marked
function renderMath(src: string): string {
  // Block math first
  let out = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false, output: 'html' });
    } catch (e: any) {
      return `<code>$$${expr}$$</code>`;
    }
  });
  // Inline math — avoid matching $ inside code blocks. marked tokenises after, so we are careful with content.
  // Simple heuristic: replace $...$ but not preceded by a backslash, and not when it's inside ``...`` (rare in our content).
  out = out.replace(/(^|[^\\$])\$([^\n$`]+?)\$/g, (_, prefix, expr) => {
    try {
      return prefix + katex.renderToString(expr, { displayMode: false, throwOnError: false, output: 'html' });
    } catch (e: any) {
      return `${prefix}<code>$${expr}$</code>`;
    }
  });
  return out;
}

marked.setOptions({
  breaks: false,
  gfm: true,
});

export function renderMarkdown(src: string): string {
  const withMath = renderMath(src);
  const html = marked.parse(withMath, { async: false }) as string;
  return `<div class="prose max-w-none">${html}</div>`;
}

export function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]+?\$\$/g, '')
    .replace(/\$[^$\n]+?\$/g, '')
    .replace(/[#*_`>\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Render inline markdown + math without wrapping in <p>. Use for headings, titles, summaries.
export function renderInline(src: string): string {
  if (!src) return '';
  const withMath = renderInlineMath(src);
  // Use marked.parseInline so we don't get a <p> wrapper around the result.
  const html = marked.parseInline(withMath, { async: false }) as string;
  return html;
}

function renderInlineMath(src: string): string {
  // Block math not expected inline; still strip-protect just in case.
  let out = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try { return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false, output: 'html' }); }
    catch { return `<code>$$${expr}$$</code>`; }
  });
  out = out.replace(/(^|[^\\$])\$([^\n$`]+?)\$/g, (_, prefix, expr) => {
    try { return prefix + katex.renderToString(expr, { displayMode: false, throwOnError: false, output: 'html' }); }
    catch { return `${prefix}<code>$${expr}$</code>`; }
  });
  return out;
}
