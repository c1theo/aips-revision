// Multi-part question splitter.
// Exam questions often have numbered sub-parts: (i), (ii), (iii); Q1 [...] Q2;
// (a), (b), (c); part 1, part 2; etc. We detect these, split the text, and
// allow the router to classify each part independently.

export interface QuestionPart {
  id: string;        // 'i', 'ii', 'a', 'Q1', ...
  marks?: number;    // detected from "[5 marks]" if present
  text: string;      // the part's text (preamble may be repeated)
  preamble?: string; // optional shared problem statement above the sub-parts
}

interface MatcherSpec {
  // Regex with one capture group for the id, applied to start-of-line content.
  // We split on these markers, treating everything between two markers as the
  // body of the preceding marker.
  pattern: RegExp;
  // Format the id for display (e.g. wrap in parens)
  label: (capture: string) => string;
}

const matchers: MatcherSpec[] = [
  { pattern: /^\s*\(\s*([ivxIVX]{1,5})\s*\)\s*/m, label: (c) => `(${c.toLowerCase()})` },     // (i), (ii)
  { pattern: /^\s*\(\s*([a-z])\s*\)\s*/m,         label: (c) => `(${c})` },                    // (a), (b)
  { pattern: /^\s*\(\s*(\d{1,2})\s*\)\s*/m,       label: (c) => `(${c})` },                    // (1), (2)
  { pattern: /^\s*Q\s*(\d{1,2})[\s\.]/m,          label: (c) => `Q${c}` },                    // Q1, Q2.
  { pattern: /^\s*Part\s+(\d{1,2}|[ivxIVX]{1,5})[\s\.\:]/im, label: (c) => `Part ${c}` },     // Part 1
  { pattern: /^\s*(\d{1,2})[\.\)]\s+/m,           label: (c) => `${c}.` },                    // 1., 2)
];

function detectMarks(s: string): number | undefined {
  const m = s.match(/\[(\d{1,3})\s*marks?\]/i);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

// Find every marker location in the text (using ALL matcher patterns).
interface Marker { start: number; end: number; id: string; matcherIdx: number }

function findAllMarkers(text: string): Marker[] {
  const markers: Marker[] = [];
  for (let i = 0; i < matchers.length; i++) {
    const m = matchers[i];
    // Use global+multiline by re-creating with flags
    const re = new RegExp(m.pattern.source, 'gm' + (m.pattern.ignoreCase ? 'i' : ''));
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        id: m.label(match[1]),
        matcherIdx: i,
      });
    }
  }
  // Sort by position
  markers.sort((a, b) => a.start - b.start);
  return markers;
}

// Keep only markers that form a consistent sequence — prefer the matcher
// family with the most consecutive markers.
function pickBestFamily(markers: Marker[]): Marker[] {
  if (markers.length === 0) return [];
  // Group by matcherIdx
  const families: Record<number, Marker[]> = {};
  for (const m of markers) (families[m.matcherIdx] ??= []).push(m);
  // Score each family by count + consecutiveness
  let bestKey = -1; let bestScore = 0;
  for (const k of Object.keys(families)) {
    const f = families[Number(k)];
    if (f.length < 2) continue;
    const score = f.length + (isMonotonic(f) ? 1 : 0);
    if (score > bestScore) { bestScore = score; bestKey = Number(k); }
  }
  if (bestKey < 0) return [];
  return families[bestKey];
}

function isMonotonic(ms: Marker[]): boolean {
  // Try to extract ordinals from ids and check monotonic
  const vals = ms.map((m) => parseOrdinal(m.id));
  if (vals.some((v) => v == null)) return false;
  for (let i = 1; i < vals.length; i++) if (vals[i]! <= vals[i - 1]!) return false;
  return true;
}

function parseOrdinal(id: string): number | null {
  const clean = id.replace(/[()\.\s]/g, '').toLowerCase();
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);
  if (/^q\d+$/.test(clean)) return parseInt(clean.slice(1), 10);
  if (/^part/.test(clean)) {
    const rest = clean.slice(4);
    if (/^\d+$/.test(rest)) return parseInt(rest, 10);
    return romanToInt(rest);
  }
  if (/^[ivx]+$/.test(clean)) return romanToInt(clean);
  if (/^[a-z]$/.test(clean)) return clean.charCodeAt(0) - 96;  // a→1, b→2 ...
  return null;
}

function romanToInt(r: string): number | null {
  const map: Record<string, number> = { i: 1, v: 5, x: 10 };
  let total = 0; let prev = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    const v = map[r[i]];
    if (!v) return null;
    if (v < prev) total -= v; else total += v;
    prev = v;
  }
  return total > 0 ? total : null;
}

export function splitMultipart(text: string): { parts: QuestionPart[]; isMultipart: boolean } {
  const allMarkers = findAllMarkers(text);
  const family = pickBestFamily(allMarkers);
  if (family.length < 2) return { parts: [{ id: 'whole', text }], isMultipart: false };

  // Preamble = text before the first marker
  const preamble = text.slice(0, family[0].start).trim();
  const parts: QuestionPart[] = [];
  for (let i = 0; i < family.length; i++) {
    const start = family[i].end;
    const end = i + 1 < family.length ? family[i + 1].start : text.length;
    const body = text.slice(start, end).trim();
    parts.push({
      id: family[i].id,
      text: (preamble ? preamble + '\n\n' : '') + body,
      preamble: preamble || undefined,
      marks: detectMarks(body),
    });
  }
  return { parts, isMultipart: true };
}
