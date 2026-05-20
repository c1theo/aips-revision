import { scoreQuestion, calibrateConfidence, detectStructure, type AlgorithmScore, type StructuralHints } from './score';
import { classifyIntent, type IntentScore } from './intent';
import { extractCSP, cspToLabSpec, type ExtractedCSP } from './extract';
import { extractRichCSP, richToLabSpec, type RichCSP } from './extractCSPRich';
import { extractFormula, extractCNF as extractCNFRich, cnfToDpllSpec, extractHorn, hornToSpec, extractResolutionProblem, extractLeaves, type ExtractedFormula, type ExtractedCNF, type ExtractedHorn, type ExtractedResolution, type ExtractedLeaves } from './extractLogic';
import { findRelevantPlaybooks, playbooksForModule, type Playbook } from './playbooks';
import type { Intent, Module } from './profiles';

export interface RouterResult {
  topAlgorithms: AlgorithmScore[];
  confidence: number;
  topIntent: Intent | null;
  intentScores: IntentScore[];
  structure: StructuralHints;
  extraction: {
    csp: ExtractedCSP;             // simple CSP extractor (regex)
    cspRich: RichCSP;              // rich extractor (NL patterns, scheduling)
    cspLabSpec: string;            // best CSPLab spec we can synthesise
    cnf: ExtractedCNF;
    cnfText: string;               // ready for DPLL/CDCL input
    formula: ExtractedFormula;
    horn: ExtractedHorn;
    hornText: string;
    resolution: ExtractedResolution;
    leaves: ExtractedLeaves;
  };
  recommendation: string;
  playbooks: Playbook[];
  fallbackModule: Module | null;
}

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

  // CSP extraction — try both extractors; prefer rich if it found more
  const cspSimple = extractCSP(text);
  const cspRich = extractRichCSP(text);
  let cspLabSpec = '';
  if (cspRich.variables.length > 0 && (cspRich.constraints.length > 0 || cspRich.allDifferentGroups.length > 0)) {
    cspLabSpec = richToLabSpec(cspRich);
  } else if (cspSimple.variables.length > 0) {
    cspLabSpec = cspToLabSpec(cspSimple);
  } else if (cspRich.variables.length > 0) {
    cspLabSpec = richToLabSpec(cspRich);
  }

  // SAT extraction
  const cnf = extractCNFRich(text);
  const cnfText = cnfToDpllSpec(cnf);

  // Logic extraction
  const formula = extractFormula(text);
  const horn = extractHorn(text);
  const hornText = hornToSpec(horn);
  const resolution = extractResolutionProblem(text);

  // Game tree
  const leaves = extractLeaves(text);

  // Playbook selection
  let playbooks = findRelevantPlaybooks(text, 6);
  const fallbackModule = pickFallbackModule(structure, topAlgorithms);
  if (confidence < 35 && fallbackModule) {
    const modulePbs = playbooksForModule(fallbackModule);
    for (const pb of modulePbs) if (!playbooks.includes(pb)) playbooks.push(pb);
  }
  playbooks = playbooks.slice(0, 10);

  // Recommendation
  let recommendation = '';
  if (topAlgorithms.length === 0) {
    if (fallbackModule) {
      recommendation = `I couldn't identify a specific algorithm with confidence — but the question looks like a **${fallbackModule.toUpperCase()}** problem. See the topic playbooks below.`;
    } else {
      recommendation = "I couldn't identify a clear topic. Try adding more specific algorithm names or technical vocabulary.";
    }
  } else if (confidence < 40) {
    const a = topAlgorithms[0];
    recommendation = `Tentative match: **${a.label}** (low confidence — ${confidence}%). Also see the playbooks below.`;
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
    extraction: {
      csp: cspSimple, cspRich, cspLabSpec,
      cnf, cnfText,
      formula, horn, hornText, resolution,
      leaves,
    },
    recommendation,
    playbooks,
    fallbackModule,
  };
}

export { type AlgorithmScore, type IntentScore, type StructuralHints, type ExtractedCSP, type RichCSP, type ExtractedCNF, type ExtractedFormula, type ExtractedHorn, type ExtractedResolution, type ExtractedLeaves, type Playbook };
