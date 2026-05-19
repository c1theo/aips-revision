import type { Module, Topic, Flashcard } from '../types';
import { searchModule } from './search';
import { adversarialModule } from './adversarial';
import { cspModule } from './csp';
import { logicModule } from './logic';
import { satModule } from './sat';
import { extraExamples, extraFlashcards } from './extras';
import { examStyleExamples } from './exam-style';
import { researchQuestions } from './research-questions';
import { advancedTopics } from './csp-advanced';

// Merge advanced CSP topics into the CSP module
cspModule.topics = [...cspModule.topics, ...advancedTopics];

export const modules: Module[] = [
  searchModule,
  adversarialModule,
  cspModule,
  logicModule,
  satModule,
];

// Merge extras into topics on import
for (const m of modules) {
  for (const t of m.topics) {
    const extraEx = extraExamples[t.slug];
    if (extraEx) t.examples = [...(t.examples ?? []), ...extraEx];
    const extraFc = extraFlashcards[t.slug];
    if (extraFc) t.flashcards = [...(t.flashcards ?? []), ...extraFc];
    const examEx = examStyleExamples[t.slug];
    if (examEx) t.examples = [...(t.examples ?? []), ...examEx];
  }
}

// Merge research questions into topics by slug field on each question (id encodes the topic via prefix or via id mapping)
// Build a slug map from the existing topics — research questions have IDs like 'rq-<topic-hint>-N'.
const researchByTopic: Record<string, typeof researchQuestions> = {};
for (const q of researchQuestions) {
  // Heuristic mapping based on ID prefix
  let slug = 'csp-fundamentals';
  if (q.id.includes('-sf-')) slug = 'search-formulation';
  else if (q.id.includes('-uni-')) slug = 'uninformed-search';
  else if (q.id.includes('-inf-')) slug = 'informed-search';
  else if (q.id.includes('-loc-')) slug = 'local-search';
  else if (q.id.includes('-mm-')) slug = 'minimax';
  else if (q.id.includes('-mcts-')) slug = 'mcts';
  else if (q.id.includes('-game-')) slug = 'game-formulation';
  else if (q.id.includes('-csp-ac3-')) slug = 'csp-inference';
  else if (q.id.includes('-csp-bey-')) slug = 'beyond-ac3';
  else if (q.id.includes('-csp-gac-')) slug = 'beyond-ac3';
  else if (q.id.includes('-csp-fc-')) slug = 'backtracking';
  else if (q.id.includes('-csp-wdeg-')) slug = 'backtracking';
  else if (q.id.includes('-cpm-')) slug = 'cp-modelling';
  else if (q.id.includes('-ep-')) slug = 'essence-prime';
  else if (q.id.includes('-tree-')) slug = 'csp-structure';
  else if (q.id.includes('-ent-')) slug = 'entailment';
  else if (q.id.includes('-res-')) slug = 'inference-rules';
  else if (q.id.includes('-horn-')) slug = 'horn-chaining';
  else if (q.id.includes('-dpll-')) slug = 'dpll';
  else if (q.id.includes('-cdcl-')) slug = 'cdcl';
  else if (q.id.includes('-walksat-')) slug = 'walksat';
  else if (q.id.includes('-2sat-')) slug = 'sat-problem';
  else if (q.id.includes('-syn-')) slug = 'propositional-syntax';
  else if (q.id.includes('-kb-')) slug = 'kb-agents';
  else if (q.id.includes('-ac3-code')) slug = 'csp-inference';
  else if (q.id.includes('-fc-mac')) slug = 'csp-inference';
  else if (q.id.includes('-2way-explain')) slug = 'backtracking';
  else if (q.id.includes('-pc-explain')) slug = 'beyond-ac3';
  (researchByTopic[slug] ??= []).push(q);
}
for (const m of modules) {
  for (const t of m.topics) {
    const rs = researchByTopic[t.slug];
    if (rs) t.examples = [...(t.examples ?? []), ...rs];
  }
}

export const allTopics: Topic[] = modules.flatMap((m) => m.topics);

export function findTopic(slug: string): Topic | undefined {
  return allTopics.find((t) => t.slug === slug);
}

export function findModule(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug);
}

export const allFlashcards: Flashcard[] = allTopics.flatMap(
  (t) => (t.flashcards ?? []).map((f) => ({ ...f, topic: t.title })),
);
