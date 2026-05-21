import MiniSearch from 'minisearch';
import { allTopics } from '../content';
import type { ExampleQuestion } from '../types';

// Build a TF-IDF / BM25-style index over every worked example we have.
// For a new question, return the top-k most similar examples so the user
// can see "we've worked through a question like this before".

export interface SimilarHit {
  id: string;
  topicTitle: string;
  topicSlug: string;
  question: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  marks?: number;
  score: number;          // MiniSearch's relevance score
  tags?: string[];
  answerExcerpt: string;  // first ~250 chars of the answer
}

// Build the index lazily once (module-scope)
let cachedIndex: MiniSearch<any> | null = null;
let cachedDocs: any[] = [];

function buildIndex() {
  if (cachedIndex) return { index: cachedIndex, docs: cachedDocs };
  const docs: any[] = [];
  for (const t of allTopics) {
    if (!t.examples) continue;
    for (const e of t.examples) {
      docs.push({
        id: e.id,
        topicTitle: t.title,
        topicSlug: t.slug,
        question: e.question,
        answer: e.answer,
        difficulty: e.difficulty,
        marks: e.marks,
        tags: (e.tags ?? []).join(' '),
      });
    }
  }
  const idx = new MiniSearch({
    fields: ['question', 'tags', 'topicTitle'],
    storeFields: ['id', 'question', 'answer', 'topicTitle', 'topicSlug', 'difficulty', 'marks', 'tags'],
    searchOptions: {
      boost: { question: 2, tags: 3, topicTitle: 1.2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  idx.addAll(docs);
  cachedIndex = idx;
  cachedDocs = docs;
  return { index: idx, docs };
}

// Strip markdown-y characters from the query before searching, and trim
// stop-words that overload generic searches.
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'on', 'is', 'are', 'be', 'was', 'were', 'this', 'that', 'with', 'for', 'as', 'by', 'at', 'from', 'into', 'each', 'which', 'what', 'how', 'when', 'where', 'why', 'has', 'have', 'had', 'do', 'does', 'did', 'we', 'you', 'it', 'i']);

function cleanQuery(q: string): string {
  return q
    .replace(/[\$\\{}_^#`*~|<>]/g, ' ')
    .replace(/\d+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .join(' ');
}

export function findSimilarExamples(question: string, max = 5): SimilarHit[] {
  const { index } = buildIndex();
  const clean = cleanQuery(question);
  if (!clean) return [];
  const results = index.search(clean, { combineWith: 'OR' });
  return results.slice(0, max).map((r: any) => ({
    id: r.id,
    topicTitle: r.topicTitle,
    topicSlug: r.topicSlug,
    question: r.question,
    difficulty: r.difficulty,
    marks: r.marks,
    score: Math.round(r.score * 10) / 10,
    tags: (r.tags as string).split(/\s+/).filter(Boolean),
    answerExcerpt: (r.answer as string).slice(0, 280).replace(/\n+/g, ' '),
  }));
}
