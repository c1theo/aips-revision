import { scoreQuestion, calibrateConfidence, detectStructure, type AlgorithmScore, type StructuralHints } from './score';
import { classifyIntent, type IntentScore } from './intent';
import { extractCSP, cspToLabSpec, type ExtractedCSP } from './extract';
import { extractRichCSP, richToLabSpec, type RichCSP } from './extractCSPRich';
import { extractFormula, extractCNF as extractCNFRich, cnfToDpllSpec, extractHorn, hornToSpec, extractResolutionProblem, extractLeaves, type ExtractedFormula, type ExtractedCNF, type ExtractedHorn, type ExtractedResolution, type ExtractedLeaves } from './extractLogic';
import { findRelevantPlaybooks, playbooksForModule, type Playbook } from './playbooks';
import { splitMultipart, type QuestionPart } from './multipart';
import { findSimilarExamples, type SimilarHit } from './similar';
import { matchTemplates, type TemplateMatch } from './templates';
import { autosolveCSP, autosolveCNF, type CSPSolution, type SATSolution } from './autosolve';
import type { Intent, Module } from './profiles';

export interface RouterResult {
  topAlgorithms: AlgorithmScore[];
  confidence: number;
  topIntent: Intent | null;
  intentScores: IntentScore[];
  structure: StructuralHints;
  extraction: {
    csp: ExtractedCSP;
    cspRich: RichCSP;
    cspLabSpec: string;
    cnf: ExtractedCNF;
    cnfText: string;
    formula: ExtractedFormula;
    horn: ExtractedHorn;
    hornText: string;
    resolution: ExtractedResolution;
    leaves: ExtractedLeaves;
  };
  recommendation: string;
  playbooks: Playbook[];
  fallbackModule: Module | null;

  // NEW: multi-part analysis
  multipart: { parts: QuestionPart[]; isMultipart: boolean };
  perPartRoutes?: { partId: string; partText: string; topAlgorithm: string | null; confidence: number; templates: TemplateMatch[] }[];

  // NEW: template-based shape matching
  templates: TemplateMatch[];

  // NEW: similar past worked examples
  similar: SimilarHit[];

  // NEW: independently-verified answers (run our own solver, give the answer)
  autosolve: {
    csp?: CSPSolution;
    sat?: SATSolution;
  };
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

// Lightweight per-part routing — uses just algorithm scoring + templates
function routePart(text: string): { partId: string; partText: string; topAlgorithm: string | null; confidence: number; templates: TemplateMatch[] } {
  const scores = scoreQuestion(text);
  const templates = matchTemplates(text);
  const top = scores[0];
  const conf = calibrateConfidence(scores);
  return {
    partId: '',
    partText: text,
    topAlgorithm: top?.label ?? null,
    confidence: conf,
    templates,
  };
}

export function routeQuestion(text: string): RouterResult {
  const allScores = scoreQuestion(text);
  const topAlgorithms = allScores.slice(0, 6).filter((s) => s.score > 0);
  const confidence = calibrateConfidence(allScores);
  const intentScores = classifyIntent(text);
  const topIntent = intentScores[0]?.intent ?? null;
  const structure = detectStructure(text);

  // Existing extractors
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
  const cnf = extractCNFRich(text);
  const cnfText = cnfToDpllSpec(cnf);
  const formula = extractFormula(text);
  const horn = extractHorn(text);
  const hornText = hornToSpec(horn);
  const resolution = extractResolutionProblem(text);
  const leaves = extractLeaves(text);

  // NEW: multi-part
  const multipart = splitMultipart(text);
  const perPartRoutes = multipart.isMultipart
    ? multipart.parts.map((p) => ({ ...routePart(p.text), partId: p.id, partText: p.text }))
    : undefined;

  // NEW: template matches
  const templates = matchTemplates(text);

  // NEW: similar past worked examples
  let similar: SimilarHit[] = [];
  try { similar = findSimilarExamples(text, 5); } catch (e) { similar = []; }

  // NEW: auto-solve if extraction succeeded
  const autosolve: RouterResult['autosolve'] = {};
  if (cspRich.totalConfidence > 40 && cspRich.variables.length > 0 && cspRich.variables.length <= 12) {
    try { autosolve.csp = autosolveCSP(cspRich); } catch (e) { /* swallow */ }
  }
  if (cnf.confidence > 50 && cnf.clauses.length > 0 && cnf.variables.length <= 20) {
    try { autosolve.sat = autosolveCNF(cnfText); } catch (e) { /* swallow */ }
  }

  // Playbooks
  let playbooks = findRelevantPlaybooks(text, 6);
  const fallbackModule = pickFallbackModule(structure, topAlgorithms);
  if (confidence < 35 && fallbackModule) {
    const modulePbs = playbooksForModule(fallbackModule);
    for (const pb of modulePbs) if (!playbooks.includes(pb)) playbooks.push(pb);
  }
  playbooks = playbooks.slice(0, 10);

  // Recommendation
  let recommendation = '';
  if (multipart.isMultipart) {
    recommendation = `**${multipart.parts.length}-part question detected.** Each sub-part is routed independently below.`;
  } else if (templates.length > 0) {
    const top = templates[0];
    recommendation = `Template matched: **${top.description}** (${top.confidence}% confidence). ${top.explanation}`;
  } else if (topAlgorithms.length === 0) {
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
    extraction: { csp: cspSimple, cspRich, cspLabSpec, cnf, cnfText, formula, horn, hornText, resolution, leaves },
    recommendation,
    playbooks,
    fallbackModule,
    multipart,
    perPartRoutes,
    templates,
    similar,
    autosolve,
  };
}

export {
  type AlgorithmScore, type IntentScore, type StructuralHints,
  type ExtractedCSP, type RichCSP, type ExtractedCNF, type ExtractedFormula,
  type ExtractedHorn, type ExtractedResolution, type ExtractedLeaves,
  type Playbook, type QuestionPart, type SimilarHit, type TemplateMatch,
  type CSPSolution, type SATSolution,
};
