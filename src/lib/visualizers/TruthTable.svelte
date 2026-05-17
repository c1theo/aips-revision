<script lang="ts">
  // Truth table builder for an arbitrary propositional formula.

  // Tokenizer
  type Tok = { type: 'lp'|'rp'|'not'|'and'|'or'|'imp'|'iff'|'var'|'true'|'false'; v?: string };
  function tokenize(src: string): Tok[] {
    const toks: Tok[] = [];
    const s = src.replace(/¬|~|!/g, '!').replace(/∧|&&|&/g, '&').replace(/∨|\|\||\|/g, '|').replace(/→|=>|->/g, '>').replace(/↔|<->|<=>/g, '#');
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '(') { toks.push({ type: 'lp' }); i++; continue; }
      if (ch === ')') { toks.push({ type: 'rp' }); i++; continue; }
      if (ch === '!') { toks.push({ type: 'not' }); i++; continue; }
      if (ch === '&') { toks.push({ type: 'and' }); i++; continue; }
      if (ch === '|') { toks.push({ type: 'or' }); i++; continue; }
      if (ch === '>') { toks.push({ type: 'imp' }); i++; continue; }
      if (ch === '#') { toks.push({ type: 'iff' }); i++; continue; }
      if (/[A-Za-z]/.test(ch)) {
        let j = i;
        while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
        const v = s.slice(i, j);
        if (v.toLowerCase() === 'true') toks.push({ type: 'true' });
        else if (v.toLowerCase() === 'false') toks.push({ type: 'false' });
        else toks.push({ type: 'var', v });
        i = j; continue;
      }
      throw new Error(`Unexpected '${ch}' at position ${i}`);
    }
    return toks;
  }

  // AST + parser
  type AST = { kind: string; v?: string; a?: AST; b?: AST };
  function parse(src: string): AST {
    const toks = tokenize(src);
    let p = 0;
    function peek() { return toks[p]; }
    function expect(t: string) {
      if (!toks[p] || toks[p].type !== t) throw new Error(`Expected ${t} at ${p}`);
      return toks[p++];
    }
    // iff (lowest), imp, or, and, not, atom
    function parseIff(): AST {
      let l = parseImp();
      while (peek()?.type === 'iff') { p++; l = { kind: 'iff', a: l, b: parseImp() }; }
      return l;
    }
    function parseImp(): AST {
      const l = parseOr();
      if (peek()?.type === 'imp') { p++; return { kind: 'imp', a: l, b: parseImp() }; } // right-associative
      return l;
    }
    function parseOr(): AST {
      let l = parseAnd();
      while (peek()?.type === 'or') { p++; l = { kind: 'or', a: l, b: parseAnd() }; }
      return l;
    }
    function parseAnd(): AST {
      let l = parseNot();
      while (peek()?.type === 'and') { p++; l = { kind: 'and', a: l, b: parseNot() }; }
      return l;
    }
    function parseNot(): AST {
      if (peek()?.type === 'not') { p++; return { kind: 'not', a: parseNot() }; }
      return parseAtom();
    }
    function parseAtom(): AST {
      const t = peek();
      if (!t) throw new Error('unexpected end');
      if (t.type === 'lp') { p++; const e = parseIff(); expect('rp'); return e; }
      if (t.type === 'var') { p++; return { kind: 'var', v: t.v }; }
      if (t.type === 'true') { p++; return { kind: 'true' }; }
      if (t.type === 'false') { p++; return { kind: 'false' }; }
      throw new Error(`unexpected ${t.type}`);
    }
    const e = parseIff();
    if (p !== toks.length) throw new Error('trailing input');
    return e;
  }

  function vars(a: AST, set = new Set<string>()): Set<string> {
    if (a.kind === 'var') set.add(a.v!);
    if (a.a) vars(a.a, set);
    if (a.b) vars(a.b, set);
    return set;
  }

  function evalAST(a: AST, m: Record<string, boolean>): boolean {
    switch (a.kind) {
      case 'true': return true;
      case 'false': return false;
      case 'var': return m[a.v!];
      case 'not': return !evalAST(a.a!, m);
      case 'and': return evalAST(a.a!, m) && evalAST(a.b!, m);
      case 'or': return evalAST(a.a!, m) || evalAST(a.b!, m);
      case 'imp': return !evalAST(a.a!, m) || evalAST(a.b!, m);
      case 'iff': return evalAST(a.a!, m) === evalAST(a.b!, m);
    }
    return false;
  }

  let formula = $state('(P -> Q) & (Q -> R) -> (P -> R)');
  let error = $state('');
  let table = $state<{ headers: string[]; rows: { vals: boolean[]; result: boolean }[] } | null>(null);
  let summary = $state('');

  $effect(() => {
    try {
      const ast = parse(formula);
      // Preserve first-appearance order rather than sorting alphabetically.
      const vs = [...vars(ast)];
      if (vs.length > 10) {
        error = `Too many variables (${vs.length}). The truth table would have ${Math.pow(2, vs.length).toLocaleString()} rows.`;
        table = null;
        summary = '';
        return;
      }
      const rows = [];
      let countT = 0;
      const N = Math.pow(2, vs.length);
      for (let i = 0; i < N; i++) {
        const m: Record<string, boolean> = {};
        const vals: boolean[] = [];
        for (let j = 0; j < vs.length; j++) {
          const b = !!((i >> (vs.length - 1 - j)) & 1);
          m[vs[j]] = b; vals.push(b);
        }
        const r = evalAST(ast, m);
        if (r) countT += 1;
        rows.push({ vals, result: r });
      }
      table = { headers: [...vs, formula], rows };
      error = '';
      if (countT === N) summary = `✓ Tautology — valid in every model (${N}/${N}).`;
      else if (countT === 0) summary = `✗ Contradiction — unsatisfiable (0/${N}).`;
      else summary = `Satisfiable: ${countT}/${N} models make the formula true.`;
    } catch (e: any) {
      error = e.message;
      table = null;
      summary = '';
    }
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Formula (use <code class="text-xs">! & | -&gt; &lt;-&gt;</code> or <code class="text-xs">¬ ∧ ∨ → ↔</code>; variables are letters)</span>
    <input class="w-full font-mono px-3 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={formula} />
  </label>

  <div class="flex flex-wrap gap-1 text-xs">
    Examples:
    {#each [
      'P -> Q',
      '(P & Q) | (!P & !Q)',
      '(P -> Q) & (Q -> R) -> (P -> R)',
      'P & !P',
      '(P <-> Q) <-> ((P -> Q) & (Q -> P))',
    ] as ex}
      <button class="btn btn-sm font-mono" onclick={() => (formula = ex)}>{ex}</button>
    {/each}
  </div>

  {#if error}
    <div class="text-rose-600 text-sm">Parse error: {error}</div>
  {/if}
  {#if summary}
    <div class="text-sm font-medium">{summary}</div>
  {/if}

  {#if table}
    <div class="overflow-x-auto">
      <table class="text-xs font-mono border-collapse">
        <thead>
          <tr>
            {#each table.headers as h, i}
              <th class="border border-ink-300 dark:border-ink-700 bg-ink-100 dark:bg-ink-800 px-3 py-1 {i === table.headers.length - 1 ? 'bg-accent-100 dark:bg-accent-900/40' : ''}">{h}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each table.rows as row}
            <tr>
              {#each row.vals as v}
                <td class="border border-ink-300 dark:border-ink-700 px-3 py-0.5 text-center">{v ? 'T' : 'F'}</td>
              {/each}
              <td class="border border-ink-300 dark:border-ink-700 px-3 py-0.5 text-center font-bold {row.result ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}">{row.result ? 'T' : 'F'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
