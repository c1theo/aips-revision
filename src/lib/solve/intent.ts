import type { Intent } from './profiles';

// Intent classifier — separate dimension from algorithm choice.
// Determines what the question is asking the user to DO.

interface IntentRule {
  intent: Intent;
  patterns: { pattern: RegExp; weight: number; label: string }[];
}

const rules: IntentRule[] = [
  {
    intent: 'TRACE',
    patterns: [
      { pattern: /\btrace\b/i, weight: 50, label: '"trace"' },
      { pattern: /\bperform\s+(?:the\s+)?(?:search|run|execution)/i, weight: 45, label: 'perform the search' },
      { pattern: /\bshow\s+(?:the\s+)?(?:steps|trace|workings|computation)/i, weight: 45, label: 'show the steps' },
      { pattern: /\bstep[-\s]by[-\s]step\b/i, weight: 40, label: 'step-by-step' },
      { pattern: /\bwalk\s+through\b/i, weight: 35, label: 'walk through' },
      { pattern: /\bafter\s+each\s+(?:revision|step|assignment)/i, weight: 35, label: 'after each step' },
      { pattern: /\bsimulate\b/i, weight: 30, label: 'simulate' },
      { pattern: /\brecord\s+(?:any\s+)?changes/i, weight: 30, label: 'record changes' },
    ],
  },
  {
    intent: 'MODEL',
    patterns: [
      { pattern: /\bmodel\s+as\s+a\s+csp\b/i, weight: 70, label: 'model as a CSP' },
      { pattern: /\bwrite\s+(?:out\s+)?(?:the\s+)?csp\b/i, weight: 70, label: 'write the CSP' },
      { pattern: /\bwrite\s+a\s+binary\s+csp\b/i, weight: 70, label: 'write a binary CSP' },
      { pattern: /\bformulate\s+(?:as|the)\b/i, weight: 55, label: 'formulate as' },
      { pattern: /\bgive\s+(?:a\s+)?(?:model|formulation|csp)\b/i, weight: 50, label: 'give a model/CSP' },
      { pattern: /\bdesign\s+(?:a\s+)?(?:model|csp)\b/i, weight: 50, label: 'design a model' },
      { pattern: /\b(?:state|specify)\s+the\s+(?:variables|domains|constraints)/i, weight: 45, label: 'state vars/domains/constraints' },
      { pattern: /\bidentify\s+(?:a\s+)?modelling\s+pattern\b/i, weight: 60, label: 'identify modelling pattern' },
    ],
  },
  {
    intent: 'COMPARE',
    patterns: [
      { pattern: /\bcompare\b/i, weight: 50, label: '"compare"' },
      { pattern: /\bhow\s+does\s+\w+\s+compare/i, weight: 45, label: 'how does X compare' },
      { pattern: /\b(versus|vs)\b/i, weight: 25, label: 'versus' },
      { pattern: /\bdifference\s+between\b/i, weight: 35, label: 'difference between' },
      { pattern: /\bside[-\s]by[-\s]side\b/i, weight: 40, label: 'side-by-side' },
      { pattern: /\bwhich\s+is\s+(?:better|faster|stronger|optimal)/i, weight: 35, label: 'which is better' },
    ],
  },
  {
    intent: 'ENFORCE',
    patterns: [
      { pattern: /\benforce\s+(?:global\s+)?(?:node|arc|path)\s+consistency\b/i, weight: 80, label: 'enforce X consistency' },
      { pattern: /\bestablish\s+(?:global\s+)?(?:arc|node|path)\s+consistency\b/i, weight: 75, label: 'establish X consistency' },
      { pattern: /\bapply\s+(?:AC[-\s]?\d+|forward\s+check|MAC|FC)/i, weight: 60, label: 'apply AC-x / FC / MAC' },
      { pattern: /\bmake\s+(?:the\s+)?csp\s+(?:arc|node)\s+consistent/i, weight: 60, label: 'make CSP X consistent' },
      { pattern: /\brun\s+(?:AC[-\s]?\d+|forward\s+check|propagation)/i, weight: 40, label: 'run AC / propagation' },
    ],
  },
  {
    intent: 'PROVE',
    patterns: [
      { pattern: /\bprove\b/i, weight: 50, label: '"prove"' },
      { pattern: /\bshow\s+that\b/i, weight: 35, label: '"show that"' },
      { pattern: /\bdemonstrate\b/i, weight: 30, label: 'demonstrate' },
      { pattern: /\bderive\b/i, weight: 30, label: 'derive' },
      { pattern: /\b(?:KB|knowledge\s+base)\s*(?:⊨|\\models|entails)\b/i, weight: 55, label: 'KB ⊨ α' },
      { pattern: /\b(?:is\s+)?(?:un)?satisfiable\b/i, weight: 30, label: 'is (un)satisfiable' },
      { pattern: /\bby\s+resolution\b/i, weight: 50, label: 'by resolution' },
    ],
  },
  {
    intent: 'SOLVE',
    patterns: [
      { pattern: /\bfind\s+(?:a|the|all)\s+solution(s)?\b/i, weight: 55, label: 'find a/all solution(s)' },
      { pattern: /\bsolve\s+(?:the\s+)?(?:csp|sat|puzzle|problem)/i, weight: 55, label: 'solve the X' },
      { pattern: /\bsearch\s+for\s+a\s+solution\b/i, weight: 50, label: 'search for a solution' },
      { pattern: /\b(?:return|output|determine)\s+(?:the\s+)?assignment\b/i, weight: 35, label: 'return assignment' },
      { pattern: /\bstop\s+when\s+the\s+first\s+solution/i, weight: 50, label: 'stop at first solution' },
    ],
  },
  {
    intent: 'ANALYZE',
    patterns: [
      { pattern: /\b(?:time|space)\s+complexity\b/i, weight: 55, label: 'X complexity' },
      { pattern: /\bworst[-\s]case\b/i, weight: 35, label: 'worst-case' },
      { pattern: /\bbest[-\s]case\b/i, weight: 35, label: 'best-case' },
      { pattern: /\bhow\s+many\s+(?:nodes|expansions|revisions|backtracks|conflicts)/i, weight: 50, label: 'how many X' },
      { pattern: /\bO\s*\(/i, weight: 25, label: 'O(...) notation' },
      { pattern: /\bcount\s+the\s+(?:revisions|nodes|backtracks|conflicts)/i, weight: 45, label: 'count revisions/nodes' },
    ],
  },
  {
    intent: 'DEFINE',
    patterns: [
      { pattern: /\bdefine\b/i, weight: 50, label: '"define"' },
      { pattern: /\bwhat\s+(?:is|are|does)\s+(?:a|an|the)?\s*\w+/i, weight: 30, label: '"what is"' },
      { pattern: /\bdefinition\s+of\b/i, weight: 45, label: 'definition of' },
      { pattern: /\bexplain\s+(?:the\s+)?(?:concept|term|notion)/i, weight: 40, label: 'explain the concept' },
    ],
  },
  {
    intent: 'IDENTIFY',
    patterns: [
      { pattern: /\bidentify\s+(?:the\s+)?(?:type|pattern|algorithm|kind)/i, weight: 55, label: 'identify the X' },
      { pattern: /\bwhich\s+(?:algorithm|technique|approach|method|pattern)/i, weight: 50, label: 'which algorithm' },
      { pattern: /\bclassify\b/i, weight: 35, label: 'classify' },
      { pattern: /\bwhat\s+type\s+of\b/i, weight: 30, label: 'what type of' },
    ],
  },
];

export interface IntentScore {
  intent: Intent;
  score: number;
  signals: { label: string; weight: number; matchedText?: string }[];
}

export function classifyIntent(text: string): IntentScore[] {
  const result: IntentScore[] = [];
  for (const r of rules) {
    const signals: { label: string; weight: number; matchedText?: string }[] = [];
    let total = 0;
    for (const p of r.patterns) {
      const m = text.match(p.pattern);
      if (m) {
        signals.push({ label: p.label, weight: p.weight, matchedText: m[0] });
        total += p.weight;
      }
    }
    result.push({ intent: r.intent, score: total, signals });
  }
  result.sort((a, b) => b.score - a.score);
  return result.filter((r) => r.score > 0);
}
