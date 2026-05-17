import { allTopics, modules } from '../content';
import { glossary } from '../glossary';
import { stripMarkdown } from '../markdown';

export type ItemKind = 'topic' | 'section' | 'glossary' | 'example' | 'flashcard' | 'pitfall';

export interface Item {
  id: string;
  kind: ItemKind;
  title: string;       // headline for ranking + display
  body: string;        // full text (used for snippet + scoring)
  bodyTokens: string[]; // pre-tokenised
  titleTokens: string[];
  // For display + navigation
  topicSlug?: string;
  topicTitle?: string;
  moduleId?: string;
  sectionId?: string;
  difficulty?: string;
  marks?: number;
  fullAnswer?: string; // markdown to render on expand (for examples / flashcards / glossary / section)
  question?: string;   // for examples / flashcards
}

function tokenise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9*'\- ]+/g, ' ')   // keep letters, digits, *, ', -
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP.has(t));
}

const STOP = new Set([
  'the', 'a', 'an', 'is', 'of', 'and', 'or', 'to', 'in', 'on', 'for', 'with',
  'as', 'be', 'by', 'at', 'it', 'we', 'do', 'does', 'have', 'has', 'this',
  'that', 'are', 'was', 'were', 'will', 'can', 'i', 'you', 'how', 'what',
  'when', 'why', 'where', 'which', 'who', 'me', 'my', 'so', 'if', 'but',
  'not', 'no', 'all', 'any', 'some', 'one', 'two', 'three',
]);

function build(): Item[] {
  const items: Item[] = [];

  for (const t of allTopics) {
    const moduleId = modules.find((m) => m.topics.some((x) => x.slug === t.slug))?.id;
    const baseTitle = t.title;

    // Topic-level item — represents the topic as a whole
    items.push({
      id: `topic:${t.slug}`,
      kind: 'topic',
      title: t.title,
      body: t.oneLiner,
      bodyTokens: tokenise(t.oneLiner),
      titleTokens: tokenise(t.title),
      topicSlug: t.slug,
      topicTitle: t.title,
      moduleId,
      fullAnswer: `**${t.title}** — ${t.oneLiner}`,
    });

    // Each section becomes its own item
    for (const s of t.sections) {
      const bodyParts: string[] = [];
      let displayMarkdown = '';
      for (const b of s.blocks) {
        if (b.kind === 'md') { bodyParts.push(b.body); displayMarkdown += b.body + '\n\n'; }
        else if (b.kind === 'callout') {
          bodyParts.push((b.title ?? '') + ' ' + b.body);
          displayMarkdown += `**${b.variant.toUpperCase()}: ${b.title ?? ''}** — ${b.body}\n\n`;
        } else if (b.kind === 'viz') {
          bodyParts.push(b.title ?? b.viz);
        }
      }
      const stripped = stripMarkdown(bodyParts.join(' '));
      items.push({
        id: `section:${t.slug}#${s.id}`,
        kind: 'section',
        title: `${s.title} — ${t.title}`,
        body: stripped,
        bodyTokens: tokenise(stripped),
        titleTokens: tokenise(s.title + ' ' + t.title),
        topicSlug: t.slug,
        topicTitle: t.title,
        moduleId,
        sectionId: s.id,
        fullAnswer: displayMarkdown,
      });
    }

    // Examples
    for (const ex of t.examples ?? []) {
      const combined = ex.question + ' ' + stripMarkdown(ex.answer);
      items.push({
        id: `example:${t.slug}:${ex.id}`,
        kind: 'example',
        title: `${ex.difficulty.toUpperCase()} · ${ex.question.slice(0, 80)}${ex.question.length > 80 ? '…' : ''}`,
        body: combined,
        bodyTokens: tokenise(combined),
        titleTokens: tokenise(ex.question),
        topicSlug: t.slug,
        topicTitle: t.title,
        moduleId,
        difficulty: ex.difficulty,
        marks: ex.marks,
        question: ex.question,
        fullAnswer: ex.answer,
      });
    }

    // Flashcards
    for (const f of t.flashcards ?? []) {
      const combined = f.q + ' ' + f.a;
      items.push({
        id: `flash:${t.slug}:${f.id}`,
        kind: 'flashcard',
        title: f.q,
        body: combined,
        bodyTokens: tokenise(combined),
        titleTokens: tokenise(f.q),
        topicSlug: t.slug,
        topicTitle: t.title,
        moduleId,
        question: f.q,
        fullAnswer: f.a,
      });
    }

    // Pitfalls (curated)
    for (const p of t.pitfalls ?? []) {
      items.push({
        id: `pitfall:${t.slug}:${items.length}`,
        kind: 'pitfall',
        title: 'Pitfall · ' + t.title,
        body: p,
        bodyTokens: tokenise(p),
        titleTokens: tokenise(baseTitle + ' pitfall'),
        topicSlug: t.slug,
        topicTitle: t.title,
        moduleId,
        fullAnswer: p,
      });
    }
  }

  // Glossary
  for (const g of glossary) {
    items.push({
      id: `glossary:${g.term}`,
      kind: 'glossary',
      title: g.term,
      body: g.def,
      bodyTokens: tokenise(g.def),
      titleTokens: tokenise(g.term),
      fullAnswer: `**${g.term}.** ${g.def}`,
    });
  }

  return items;
}

export const corpus: Item[] = build();

// Doc-frequency map for BM25-like scoring
export const docFreq = new Map<string, number>();
for (const item of corpus) {
  const seen = new Set<string>();
  for (const t of [...item.titleTokens, ...item.bodyTokens]) {
    if (!seen.has(t)) { seen.add(t); docFreq.set(t, (docFreq.get(t) ?? 0) + 1); }
  }
}

export const N = corpus.length;
export const avgDocLen = corpus.reduce((s, i) => s + i.bodyTokens.length, 0) / Math.max(1, N);

export { tokenise };
