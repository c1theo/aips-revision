import type { Module, Topic, Flashcard } from '../types';
import { searchModule } from './search';
import { adversarialModule } from './adversarial';
import { cspModule } from './csp';
import { logicModule } from './logic';
import { satModule } from './sat';

export const modules: Module[] = [
  searchModule,
  adversarialModule,
  cspModule,
  logicModule,
  satModule,
];

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
