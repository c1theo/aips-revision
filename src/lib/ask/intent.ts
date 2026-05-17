export type Intent =
  | 'define'      // "what is X", "define X"
  | 'compare'     // "X vs Y", "difference between"
  | 'why'         // "why does X", "why is X"
  | 'when'        // "when should I use X"
  | 'how'         // "how does X work"
  | 'complexity'  // "complexity of X", "time/space of X"
  | 'pitfall'     // "common mistakes with X", "pitfalls"
  | 'example'     // "example of X", "show me X"
  | 'list'        // "list", "all the", "every"
  | 'unknown';

interface Pattern { intent: Intent; pattern: RegExp; boostKinds?: string[]; }

const patterns: Pattern[] = [
  { intent: 'define',     pattern: /^\s*(what\s+is|define|definition\s+of|meaning\s+of|what\s+does)\b/i, boostKinds: ['glossary', 'topic'] },
  { intent: 'define',     pattern: /\bdefine\b/i,                                                          boostKinds: ['glossary'] },
  { intent: 'compare',    pattern: /(compare|difference\s+between|differ|differs|\bversus\b|\bvs\b|distinguish)/i, boostKinds: ['section', 'example'] },
  { intent: 'why',        pattern: /^\s*why\b/i,                                                            boostKinds: ['section', 'example'] },
  { intent: 'when',       pattern: /^\s*(when|under\s+what)/i,                                              boostKinds: ['section', 'example'] },
  { intent: 'how',        pattern: /^\s*(how\s+does|how\s+do|how\s+is|how\s+can|how)\b/i,                   boostKinds: ['section', 'example'] },
  { intent: 'complexity', pattern: /(complexity|time\s+complexity|space\s+complexity|big\s*-?\s*o|how\s+fast|how\s+much\s+memory)/i, boostKinds: ['section'] },
  { intent: 'pitfall',    pattern: /(pitfall|gotcha|common\s+mistake|trap|easy\s+to\s+get\s+wrong|examiner)/i, boostKinds: ['pitfall'] },
  { intent: 'example',    pattern: /(example|show\s+me|worked|trace|step\s+through|illustration)/i,         boostKinds: ['example'] },
  { intent: 'list',       pattern: /(list|all\s+the|every\s+|enumerate|name\s+the)/i,                       boostKinds: ['topic', 'section'] },
];

export function detectIntent(query: string): { intent: Intent; boostKinds: string[] } {
  for (const p of patterns) {
    if (p.pattern.test(query)) {
      return { intent: p.intent, boostKinds: p.boostKinds ?? [] };
    }
  }
  return { intent: 'unknown', boostKinds: [] };
}

export const intentDescriptions: Record<Intent, string> = {
  define: 'Looking for a definition',
  compare: 'Looking for a comparison',
  why: 'Looking for reasoning',
  when: 'Looking for when-to-use guidance',
  how: 'Looking for a how-it-works explanation',
  complexity: 'Looking for complexity info',
  pitfall: 'Looking for common mistakes',
  example: 'Looking for a worked example',
  list: 'Looking for an enumeration',
  unknown: 'General query',
};
