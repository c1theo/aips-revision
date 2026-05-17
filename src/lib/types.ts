export type VizKey =
  | 'SearchGrid'
  | 'SearchTree'
  | 'MinimaxTree'
  | 'MCTSTree'
  | 'AC3'
  | 'NQueens'
  | 'MinConflicts'
  | 'EssencePrime'
  | 'TruthTable'
  | 'Resolution'
  | 'HornChain'
  | 'DPLL'
  | 'CDCL'
  | 'WalkSAT'
  | 'CNFEncoder'
  | 'ComplexityTable';

export type CalloutKind = 'pitfall' | 'keyfact' | 'whatif' | 'nightingale';

export interface VizBlock {
  kind: 'viz';
  viz: VizKey;
  title?: string;
  props?: Record<string, any>;
}

export interface MarkdownBlock {
  kind: 'md';
  body: string;
}

export interface CalloutBlock {
  kind: 'callout';
  variant: CalloutKind;
  title?: string;
  body: string;
}

export type Block = MarkdownBlock | CalloutBlock | VizBlock;

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  module: string;
  oneLiner: string;
  sections: Section[];
  flashcards?: Flashcard[];
  pitfalls?: string[];
  complexity?: ComplexityRow[];
}

export interface ComplexityRow {
  name: string;
  complete?: string;
  optimal?: string;
  time?: string;
  space?: string;
  notes?: string;
}

export interface Flashcard {
  id: string;
  q: string;
  a: string;
  topic?: string;
}

export interface Module {
  id: string;
  title: string;
  slug: string;
  oneLiner: string;
  topics: Topic[];
}
