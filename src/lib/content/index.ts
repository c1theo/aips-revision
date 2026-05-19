import type { Module, Topic, Flashcard } from '../types';
import { searchModule } from './search';
import { adversarialModule } from './adversarial';
import { cspModule } from './csp';
import { logicModule } from './logic';
import { satModule } from './sat';
import { extraExamples, extraFlashcards } from './extras';
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
