import MiniSearch from 'minisearch';
import { allTopics } from './content';
import { stripMarkdown } from './markdown';
import { glossary } from './glossary';

export interface SearchDoc {
  id: string;
  kind: 'topic' | 'section' | 'glossary' | 'page';
  title: string;
  path: string;
  hash?: string;
  body: string;
}

const docs: SearchDoc[] = [];

for (const t of allTopics) {
  docs.push({
    id: `topic:${t.slug}`,
    kind: 'topic',
    title: t.title,
    path: `/topic/${t.slug}`,
    body: t.oneLiner + ' ' + t.module,
  });
  for (const s of t.sections) {
    const bodyTexts = s.blocks
      .map((b) => {
        if (b.kind === 'md') return b.body;
        if (b.kind === 'callout') return (b.title ?? '') + ' ' + b.body;
        return b.title ?? '';
      })
      .join(' ');
    docs.push({
      id: `section:${t.slug}#${s.id}`,
      kind: 'section',
      title: `${s.title} — ${t.title}`,
      path: `/topic/${t.slug}`,
      hash: s.id,
      body: stripMarkdown(bodyTexts),
    });
  }
}

for (const g of glossary) {
  docs.push({
    id: `glossary:${g.term}`,
    kind: 'glossary',
    title: g.term,
    path: `/glossary`,
    body: g.def,
  });
}

const pages: SearchDoc[] = [
  { id: 'page:home', kind: 'page', title: 'Overview', path: '/', body: 'overview home' },
  { id: 'page:flashcards', kind: 'page', title: 'Flashcards', path: '/flashcards', body: 'spaced repetition srs' },
  { id: 'page:glossary', kind: 'page', title: 'Glossary', path: '/glossary', body: 'glossary terms definitions' },
  { id: 'page:cheatsheet', kind: 'page', title: 'Cheatsheets', path: '/cheatsheet', body: 'cheatsheet revision dense print' },
  { id: 'page:complexity', kind: 'page', title: 'Complexity table', path: '/complexity', body: 'complexity table compare algorithms' },
  { id: 'page:pitfalls', kind: 'page', title: 'Examiner pitfalls', path: '/pitfalls', body: 'pitfalls traps mistakes' },
  { id: 'page:visualizers', kind: 'page', title: 'All visualisers', path: '/visualizers', body: 'visualizers interactive' },
  { id: 'page:past-papers', kind: 'page', title: 'Past papers', path: '/past-papers', body: 'past papers exam questions' },
];
docs.push(...pages);

export const mini = new MiniSearch({
  fields: ['title', 'body'],
  storeFields: ['title', 'path', 'hash', 'kind', 'body'],
  searchOptions: {
    boost: { title: 3 },
    fuzzy: 0.2,
    prefix: true,
  },
});
mini.addAll(docs);

export function fuzzySearch(q: string): SearchDoc[] {
  if (!q.trim()) return [];
  return mini.search(q) as unknown as SearchDoc[];
}

export function regexSearch(pattern: string): SearchDoc[] {
  let re: RegExp;
  try { re = new RegExp(pattern, 'i'); } catch { return []; }
  return docs.filter((d) => re.test(d.title) || re.test(d.body)).slice(0, 100);
}

export function allDocs(): SearchDoc[] {
  return docs;
}
