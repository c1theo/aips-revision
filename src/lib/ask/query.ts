// Parse a query string supporting operators:
//   topic:<slug>      restrict to a topic
//   module:<id>       restrict to a module (search|adversarial|csp|logic|sat)
//   kind:<k>          restrict to a kind (topic|section|glossary|example|flashcard|pitfall)
//   diff:<level>      restrict examples by difficulty (basic|intermediate|advanced)
//   +term             require term
//   -term             exclude term
//   "quoted phrase"   exact phrase
//   /regex/           regex mode (everything else ignored)

export interface ParsedQuery {
  raw: string;
  text: string;                // remaining text after operators stripped
  tokens: string[];            // word tokens (lowercased)
  phrases: string[];           // exact phrases (lowercased)
  required: string[];          // +terms
  excluded: string[];          // -terms
  topic?: string;
  module?: string;
  kind?: string;
  diff?: string;
  regex?: RegExp;
}

const OPERATOR_RE = /(?:^|\s)(topic|module|kind|diff):([\w*-]+)/gi;
const PHRASE_RE = /"([^"]+)"/g;
const REGEX_RE = /^\s*\/(.+)\/([gimsu]*)\s*$/;

export function parseQuery(raw: string): ParsedQuery {
  const out: ParsedQuery = {
    raw,
    text: raw,
    tokens: [],
    phrases: [],
    required: [],
    excluded: [],
  };

  // Regex mode (only if the whole query is /.../flags)
  const regexMatch = raw.match(REGEX_RE);
  if (regexMatch) {
    try {
      out.regex = new RegExp(regexMatch[1], regexMatch[2] || 'i');
      out.text = '';
      return out;
    } catch {
      // fall through as normal query if regex invalid
    }
  }

  let text = raw;

  // Operators
  text = text.replace(OPERATOR_RE, (_, op: string, val: string) => {
    const key = op.toLowerCase();
    if (key === 'topic') out.topic = val;
    else if (key === 'module') out.module = val;
    else if (key === 'kind') out.kind = val;
    else if (key === 'diff') out.diff = val;
    return ' ';
  });

  // Phrases
  text = text.replace(PHRASE_RE, (_, phrase: string) => {
    out.phrases.push(phrase.toLowerCase());
    return ' ';
  });

  // Required / excluded
  const rawTokens = text.split(/\s+/).filter(Boolean);
  for (const t of rawTokens) {
    if (t.startsWith('+') && t.length > 1) out.required.push(t.slice(1).toLowerCase());
    else if (t.startsWith('-') && t.length > 1) out.excluded.push(t.slice(1).toLowerCase());
    else out.tokens.push(t.toLowerCase().replace(/[?.,!;:]/g, ''));
  }

  out.tokens = out.tokens.filter(Boolean);
  out.text = text.trim();
  return out;
}
