import { scoreQuestion, calibrateConfidence, detectStructure, type AlgorithmScore, type StructuralHints } from './score';
import { classifyIntent, type IntentScore } from './intent';
import { extractCSP, extractCNF, extractLeaves, cspToLabSpec, type ExtractedCSP, type ExtractedCNF, type ExtractedLeaves } from './extract';
import { findRelevantPlaybooks, playbooksForModule, type Playbook } from './playbooks';
import type { Intent, Module } from './profiles';

export interface RouterResult {
  topAlgorithms: AlgorithmScore[];
  confidence: number;
  topIntent: Intent | null;
  intentScores: IntentScore[];
  structure: StructuralHints;
  extraction: {
    csp: ExtractedCSP;
    cspLabSpec: string;
    cnf: ExtractedCNF;
    leaves: ExtractedLeaves;
  };
  recommendation: string;
  playbooks: Playbook[];           // topic playbooks relevant to this question
  fallbackModule: Module | null;   // identified topic when algorithm match is weak
}

// Pick a fallback module from structural hints (used when no algorithm matched).
function pickFallbackModule(structure: StructuralHints, top: AlgorithmScore[]): Module | null {
  if (top.length > 0) return top[0].module;
  if (structure.cspLike) return 'csp';
  if (structure.satLike) return 'sat';
  if (structure.gameLike) return 'adversarial';
  if (structure.logicLike) return 'logic';
  if (structure.searchLike) return 'search';
  return null;
}

export function routeQuestion(text: string): RouterResult {
  const allScores = scoreQuestion(text);
  const topAlgorithms = allScores.slice(0, 6).filter((s) => s.score > 0);
  const confidence = calibrateConfidence(allScores);
  const intentScores = classifyIntent(text);
  const topIntent = intentScores[0]?.intent ?? null;
  const structure = detectStructure(text);
  const csp = extractCSP(text);
  const cspLabSpec = csp.variables.length > 0 ? cspToLabSpec(csp) : '';
  const cnf = extractCNF(text);
  const leaves = extractLeaves(text);

  // Playbook selection:
  //   1) direct trigger matches against question text
  //   2) if confidence < 35, pad with module-level playbooks for the fallback module
  let playbooks = findRelevantPlaybooks(text, 4);
  const fallbackModule = pickFallbackModule(structure, topAlgorithms);
  if (confidence < 35 && fallbackModule) {
    const modulePbs = playbooksForModule(fallbackModule);
    for (const pb of modulePbs) if (!playbooks.includes(pb)) playbooks.push(pb);
  }
  playbooks = playbooks.slice(0, 8);

  // Recommendation
  let recommendation = '';
  if (topAlgorithms.length === 0) {
    if (fallbackModule) {
      recommendation = `I couldn't identify a specific algorithm with confidence — but the question looks like a **${fallbackModule.toUpperCase()}** problem. See the topic playbooks below for general rules.`;
    } else {
      recommendation = "I couldn't identify a clear topic. Try adding more specific algorithm names or technical vocabulary.";
    }
  } else if (confidence < 40) {
    const a = topAlgorithms[0];
    recommendation = `Tentative match: **${a.label}** (low confidence — ${confidence}%). Also see the topic playbooks below in case the algorithm is different.`;
  } else {
    const a = topAlgorithms[0];
    const intent = topIntent ? ` (intent: ${topIntent.toLowerCase()})` : '';
    recommendation = `Best match: **${a.label}** — ${a.blurb}${intent}.`;
  }

  return {
    topAlgorithms,
    confidence,
    topIntent,
    intentScores,
    structure,
    extraction: { csp, cspLabSpec, cnf, leaves },
    recommendation,
    playbooks,
    fallbackModule,
  };
}

export { type AlgorithmScore, type IntentScore, type StructuralHints, type ExtractedCSP, type ExtractedCNF, type ExtractedLeaves, type Playbook };
