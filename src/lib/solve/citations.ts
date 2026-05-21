// Citation tracer: for each signal (trigger / pattern match), find the
// sentence in the source question that triggered it. This makes the
// router's reasoning auditable — students can see EXACTLY which words in
// their question led to each recommendation.

export interface SourceSpan {
  start: number;        // char index in original text
  end: number;
  sentenceIdx: number;  // which sentence (1-based)
  sentenceText: string; // the full sentence
}

export interface CitedSignal extends SourceSpan {
  matchedText: string;
  description: string;
  weight: number;
}

// Split text into sentences (simple heuristic — handles . ? ! and line breaks).
export function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const sentences: { text: string; start: number; end: number }[] = [];
  const re = /[^.!?\n]+[.!?]+|[^.!?\n]+(?=\n|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const trimmed = m[0].trim();
    if (trimmed.length === 0) continue;
    sentences.push({ text: trimmed, start: m.index, end: m.index + m[0].length });
  }
  return sentences;
}

// Locate where in the text a phrase appears; return the sentence containing it.
export function locatePhrase(text: string, phrase: string): SourceSpan | null {
  if (!phrase) return null;
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(phrase.toLowerCase());
  if (idx < 0) return null;
  const sentences = splitSentences(text);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (idx >= s.start && idx < s.end) {
      return { start: idx, end: idx + phrase.length, sentenceIdx: i + 1, sentenceText: s.text };
    }
  }
  // Fallback: return the phrase span without sentence context
  return { start: idx, end: idx + phrase.length, sentenceIdx: -1, sentenceText: '' };
}

// Highlight a phrase within a sentence (returns HTML-safe ascii). The Solve UI
// renders <mark> elements; we return a marked-up string.
export function highlightInSentence(sentence: string, phrase: string): string {
  if (!phrase) return sentence;
  const idx = sentence.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx < 0) return sentence;
  return sentence.slice(0, idx) + '<mark>' + sentence.slice(idx, idx + phrase.length) + '</mark>' + sentence.slice(idx + phrase.length);
}
