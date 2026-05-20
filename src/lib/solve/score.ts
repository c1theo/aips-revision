import type { VizKey } from '../types';
import { profiles, type AlgorithmProfile, type Intent, type Module } from './profiles';

// Multi-signal scoring engine for the question router.
// Combines five complementary classifiers and accumulates signals for
// explainability — every score we compute carries a list of the features
// that pushed it up or down, so the UI can show "why".

export interface Signal {
  source: 'trigger' | 'pattern' | 'rare-term' | 'anti-trigger' | 'intent-match' | 'module-bias' | 'extracted-structure';
  description: string;
  weight: number;
  matchedText?: string;
}

export interface AlgorithmScore {
  viz: VizKey;
  label: string;
  module: Module;
  blurb: string;
  score: number;
  signals: Signal[];
}

// ────────────────────────────────────────────────────────────────────
//  Preprocess: normalise math notation, lowercase, tokenise
// ────────────────────────────────────────────────────────────────────

export function normalise(raw: string): string {
  let t = raw;
  // Common LaTeX → plain
  t = t.replace(/\\le\b/g, '<=').replace(/\\ge\b/g, '>=');
  t = t.replace(/\\ne\b/g, '!=').replace(/\\neq\b/g, '!=');
  t = t.replace(/\\lt\b/g, '<').replace(/\\gt\b/g, '>');
  t = t.replace(/\\in\b/g, ' in ').replace(/\\notin\b/g, ' not in ');
  t = t.replace(/\\forall\b/g, ' for all ').replace(/\\exists\b/g, ' exists ');
  t = t.replace(/\\models\b/g, '⊨').replace(/\\vDash\b/g, '⊨');
  t = t.replace(/\\land\b/g, '∧').replace(/\\lor\b/g, '∨').replace(/\\lnot\b/g, '¬').replace(/\\neg\b/g, '¬');
  t = t.replace(/\\(?:cdot|times)\b/g, '×');
  // Strip $..$ wrappers but keep content
  t = t.replace(/\$([^$]+)\$/g, ' $1 ');
  // Strip backslashes that remain on individual command-like words
  t = t.replace(/\\([A-Za-z]+)/g, '$1');
  // Subscript normalisation: x_1 / x_{1} → x1
  t = t.replace(/([A-Za-z])_\{?(\d+)\}?/g, '$1$2');
  // OCR/whitespace cleanup
  t = t.replace(/[\u00A0\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}

// Lowercased copy for case-insensitive lookups
const lower = (s: string) => s.toLowerCase();

// Word-boundary substring presence (case-insensitive)
function hasWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  // multi-word needle → match as a substring, accept punctuation between words
  if (/\s/.test(needle)) {
    return haystack.includes(needle.toLowerCase());
  }
  const re = new RegExp(`\\b${escapeRegex(needle)}\\b`, 'i');
  return re.test(haystack);
}
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ────────────────────────────────────────────────────────────────────
//  Rare-term boosting (TF-IDF inspired)
// ────────────────────────────────────────────────────────────────────

// Count, for every trigger phrase, how many profiles include it. Phrases that
// appear in only ONE profile are very specific (Régin, Tseitin, 1-UIP) — boost.
// Phrases in many profiles are generic ("compare", "trace") — discount.
const triggerDocFreq: Record<string, number> = (() => {
  const map: Record<string, Set<string>> = {};
  for (const p of profiles) {
    const allTriggers = [...p.triggers.strong, ...p.triggers.medium, ...p.triggers.weak];
    for (const t of allTriggers) {
      const key = t.toLowerCase();
      (map[key] ??= new Set()).add(p.viz);
    }
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.size]));
})();

function rarityBoost(trigger: string): number {
  const df = triggerDocFreq[trigger.toLowerCase()] ?? 1;
  // Single-profile triggers: ×1.4. Two-profile: ×1.1. Three+: ×0.9.
  if (df === 1) return 1.4;
  if (df === 2) return 1.1;
  if (df === 3) return 1.0;
  return 0.85;
}

// ────────────────────────────────────────────────────────────────────
//  Per-algorithm scoring
// ────────────────────────────────────────────────────────────────────

function scoreOne(text: string, lowerText: string, profile: AlgorithmProfile): AlgorithmScore {
  const signals: Signal[] = [];
  let total = 0;

  const addTrigger = (t: string, baseWeight: number, kind: 'strong' | 'medium' | 'weak') => {
    if (!hasWord(lowerText, t)) return;
    const w = Math.round(baseWeight * rarityBoost(t));
    signals.push({ source: 'trigger', description: `${kind} trigger "${t}"`, weight: w, matchedText: t });
    total += w;
  };
  for (const t of profile.triggers.strong) addTrigger(t, 50, 'strong');
  for (const t of profile.triggers.medium) addTrigger(t, 20, 'medium');
  for (const t of profile.triggers.weak)   addTrigger(t, 5, 'weak');

  // Anti-triggers (penalise)
  for (const t of profile.triggers.anti) {
    if (hasWord(lowerText, t)) {
      const w = -40;
      signals.push({ source: 'anti-trigger', description: `anti-trigger "${t}" — penalises this algorithm`, weight: w, matchedText: t });
      total += w;
    }
  }

  // Patterns
  for (const p of profile.patterns) {
    const m = text.match(p.pattern);
    if (m) {
      signals.push({ source: 'pattern', description: p.label, weight: p.weight, matchedText: m[0] });
      total += p.weight;
    }
  }

  return { viz: profile.viz, label: profile.label, module: profile.module, blurb: profile.blurb, score: total, signals };
}

// ────────────────────────────────────────────────────────────────────
//  Module-level bias from structural features
// ────────────────────────────────────────────────────────────────────

export interface StructuralHints {
  cspLike: boolean;           // domains, variables, constraints style
  satLike: boolean;           // clauses, literals
  gameLike: boolean;          // leaves / depth / MAX-MIN
  logicLike: boolean;         // KB ⊨ / Horn / propositional
  searchLike: boolean;        // grid / path / heuristic
}

export function detectStructure(text: string): StructuralHints {
  const norm = text;
  const hasDomain = /D\(\w+\)|domain\s*(?:is|are|=|of)|\bx[\d_]+\s+(?:in|∈)\s*\{/i.test(norm);
  const hasVarRangeNotation = /\b(?:s|x|v|y|q|j|c)[\d_]+\b.*?\{[\d\s,.\-]+\}/i.test(norm);
  const hasConstraint = /\bconstraint\b|\b(?:!=|≠|<=|>=|<|>)\b/i.test(norm);
  const hasCSPVocab = /\b(csp|alldifferent|variable|domain)\b/i.test(norm);
  const cspLike = (hasDomain && hasConstraint) || hasVarRangeNotation || hasCSPVocab;

  const hasClause = /\(\s*(?:¬|\\neg|!)?\s*\w+\s*(?:∨|\\?lor|\|\|)\s*/i.test(norm);
  const hasCNF = /\bCNF\b|\bclause\b|\bliteral\b/i.test(norm);
  const hasSAT = /\bSAT\b|\bsatisfiab/i.test(norm);
  const satLike = hasCNF || hasClause || hasSAT;

  const hasGameVocab = /\b(?:MAX|MIN|ply|game tree|leaves?)\b/.test(norm);
  const hasMinimaxName = /\b(?:minimax|alpha[\-\s]?beta|mcts)\b/i.test(norm);
  const gameLike = (hasGameVocab && /\b(?:MAX|MIN)\b/.test(norm)) || hasMinimaxName;

  const hasKBNotation = /KB\s*(?:⊨|entails)|knowledge\s+base/i.test(norm);
  const hasHorn = /\b(horn|definite\s+clause|fact|rule)\b/i.test(norm);
  const hasPropConn = /∧|∨|¬|→|↔|⊨|⊭|=>/.test(norm);
  const logicLike = hasKBNotation || hasHorn || (hasPropConn && /(?:formula|proposition|entail|truth)/i.test(norm));

  const hasGrid = /\bgrid|\bmaze|\bcell|wall|coordinates\b/i.test(norm);
  const hasPath = /\bshortest\s+path|\bpathfind/i.test(norm);
  const hasHeur = /\bheuristic|\b(?:manhattan|euclidean|chebyshev|admissible|consistent)\b/i.test(norm);
  const searchLike = (hasGrid && hasPath) || (hasPath && hasHeur);

  return { cspLike, satLike, gameLike, logicLike, searchLike };
}

function applyModuleBias(scores: AlgorithmScore[], hints: StructuralHints): void {
  for (const s of scores) {
    let bias = 0;
    let why = '';
    if (s.module === 'csp' && hints.cspLike) { bias = 20; why = 'CSP structural cues (domain/variable/constraint)'; }
    if (s.module === 'sat' && hints.satLike) { bias = 20; why = 'SAT structural cues (CNF/clause/literal)'; }
    if (s.module === 'adversarial' && hints.gameLike) { bias = 20; why = 'game-tree cues (MAX/MIN/minimax)'; }
    if (s.module === 'logic' && hints.logicLike) { bias = 18; why = 'logic cues (KB / Horn / propositional)'; }
    if (s.module === 'search' && hints.searchLike) { bias = 18; why = 'pathfinding cues (grid + heuristic)'; }
    // Cross-bias penalty: if obviously CSP, penalise minimax/search alternatives mildly
    if (s.module !== 'csp' && hints.cspLike && !(hints.satLike || hints.gameLike || hints.logicLike || hints.searchLike)) {
      bias -= 8;
      if (!why) why = 'question seems CSP-shaped; this algorithm is from a different module';
    }
    if (bias !== 0) {
      s.signals.push({ source: 'module-bias', description: why, weight: bias });
      s.score += bias;
    }
  }
}

// ────────────────────────────────────────────────────────────────────
//  Main API
// ────────────────────────────────────────────────────────────────────

export function scoreQuestion(rawText: string): AlgorithmScore[] {
  const text = normalise(rawText);
  const low = lower(text);
  const hints = detectStructure(text);
  const scores = profiles.map((p) => scoreOne(text, low, p));
  applyModuleBias(scores, hints);
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

// Confidence calibration: turn raw scores into 0..100%.
// High confidence when top score >> second, and absolute score is high.
export function calibrateConfidence(scores: AlgorithmScore[]): number {
  if (scores.length === 0) return 0;
  const top = scores[0].score;
  const second = scores[1]?.score ?? 0;
  if (top <= 0) return 0;
  const margin = top - second;
  // sigmoid-ish: scale by how clear the lead is
  const ratio = top > 0 ? margin / (top + 1) : 0;
  const absoluteCertainty = Math.min(1, top / 120);
  const conf = Math.round(100 * absoluteCertainty * (0.5 + 0.5 * ratio));
  return Math.max(0, Math.min(100, conf));
}
