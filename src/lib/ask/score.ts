import { corpus, docFreq, N, avgDocLen, tokenise, type Item, type ItemKind } from './corpus';
import { detectIntent } from './intent';
import { parseQuery, type ParsedQuery } from './query';
import { expandPhrase } from './synonyms';

export interface ScoredItem {
  item: Item;
  score: number;
  snippet: string;
  matchedTokens: string[];
}

const K1 = 1.5;
const B = 0.75;

function bm25TermScore(item: Item, term: string): number {
  const df = docFreq.get(term) ?? 0;
  if (df === 0) return 0;
  const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
  const tfBody = item.bodyTokens.filter((t) => t === term).length;
  const tfTitle = item.titleTokens.filter((t) => t === term).length;
  // Weight title much higher than body
  const tf = tfBody + tfTitle * 3;
  if (tf === 0) return 0;
  const docLen = item.bodyTokens.length + 1;
  const norm = 1 - B + B * (docLen / avgDocLen);
  return idf * (tf * (K1 + 1)) / (tf + K1 * norm);
}

export interface SearchResult {
  results: ScoredItem[];
  intent: ReturnType<typeof detectIntent>['intent'];
  expanded: string[];
  parsed: ParsedQuery;
}

export function search(rawQuery: string, options?: { limit?: number; kinds?: ItemKind[] }): SearchResult {
  const limit = options?.limit ?? 25;
  const parsed = parseQuery(rawQuery);
  const { intent, boostKinds } = detectIntent(rawQuery);

  // Regex mode
  if (parsed.regex) {
    const re = parsed.regex;
    const scored: ScoredItem[] = [];
    for (const item of corpus) {
      const text = item.title + ' ' + item.body;
      if (re.test(text)) {
        scored.push({
          item,
          score: 1,
          snippet: makeSnippet(item.body, [], re),
          matchedTokens: [],
        });
      }
    }
    return { results: scored.slice(0, limit), intent: 'unknown', expanded: [], parsed };
  }

  // Build expanded token set via synonyms
  const expanded = expandPhrase([...parsed.tokens, ...parsed.required, ...parsed.phrases.flatMap((p) => p.split(/\s+/))]);
  const queryTokens = [...new Set(expanded)];

  const phraseLowers = parsed.phrases.map((p) => p.toLowerCase());

  const scored: ScoredItem[] = [];

  for (const item of corpus) {
    // Filters
    if (parsed.topic && item.topicSlug !== parsed.topic) continue;
    if (parsed.module && item.moduleId !== parsed.module) continue;
    if (parsed.kind && item.kind !== parsed.kind) continue;
    if (parsed.diff && item.difficulty !== parsed.diff) continue;
    if (options?.kinds && !options.kinds.includes(item.kind)) continue;

    // Excluded
    if (parsed.excluded.some((ex) => item.body.toLowerCase().includes(ex) || item.title.toLowerCase().includes(ex))) continue;

    // Required: must contain every required term
    if (parsed.required.length > 0) {
      const blob = (item.title + ' ' + item.body).toLowerCase();
      if (!parsed.required.every((r) => blob.includes(r))) continue;
    }

    // Phrases: must contain every phrase exactly
    if (phraseLowers.length > 0) {
      const blob = (item.title + ' ' + item.body).toLowerCase();
      if (!phraseLowers.every((p) => blob.includes(p))) continue;
    }

    // BM25 score over query tokens
    let score = 0;
    const matched: string[] = [];
    for (const t of queryTokens) {
      const s = bm25TermScore(item, t);
      if (s > 0) { score += s; matched.push(t); }
    }

    // Phrase boost
    if (phraseLowers.length > 0) {
      score *= 1.5;
    }

    // Intent-based kind boost
    if (boostKinds.includes(item.kind)) score *= 1.4;

    // Difficulty boost when query implies advanced (rough heuristic)
    if (/\b(deep|advanced|prove|derive)\b/i.test(parsed.text) && item.difficulty === 'advanced') score *= 1.3;
    if (/\b(basic|simple|introduction)\b/i.test(parsed.text) && item.difficulty === 'basic') score *= 1.2;

    if (score > 0 || queryTokens.length === 0) {
      // When query is empty (no tokens, only filters), give a small base score so filtered listings still appear
      if (queryTokens.length === 0 && (parsed.topic || parsed.kind || parsed.module || parsed.diff)) {
        score = 0.1;
      }
      if (score > 0) {
        scored.push({
          item,
          score,
          snippet: makeSnippet(item.body, matched),
          matchedTokens: matched,
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return { results: scored.slice(0, limit), intent, expanded: queryTokens, parsed };
}

function makeSnippet(body: string, matched: string[], regex?: RegExp): string {
  if (!body) return '';
  const MAX = 220;
  if (!matched.length && !regex) {
    return body.length > MAX ? body.slice(0, MAX) + '…' : body;
  }
  // Find first match position
  const lower = body.toLowerCase();
  let pos = -1;
  if (regex) {
    const m = body.match(regex);
    if (m) pos = body.indexOf(m[0]);
  } else {
    for (const t of matched) {
      const p = lower.indexOf(t);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    }
  }
  if (pos === -1) return body.length > MAX ? body.slice(0, MAX) + '…' : body;
  const start = Math.max(0, pos - 60);
  const end = Math.min(body.length, start + MAX);
  let snip = body.slice(start, end);
  if (start > 0) snip = '…' + snip;
  if (end < body.length) snip = snip + '…';
  return snip;
}

export function highlightSnippet(snippet: string, matched: string[]): string {
  if (matched.length === 0) return escapeHtml(snippet);
  const safe = escapeHtml(snippet);
  let result = safe;
  // Build a single regex of all matched terms (longest first to avoid partial matching)
  const ordered = [...new Set(matched)].sort((a, b) => b.length - a.length);
  if (ordered.length === 0) return result;
  const re = new RegExp('(' + ordered.map(esc).join('|') + ')', 'gi');
  result = result.replace(re, '<mark class="bg-yellow-200 dark:bg-yellow-700/50 rounded px-0.5">$1</mark>');
  return result;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function esc(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
