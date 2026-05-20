<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // Tseitin transformation: introduce a fresh variable for each subformula and
  // post equivalences. Produces an EQUISATISFIABLE CNF in linear size.

  let { initialFormula = '' } = $props<{ initialFormula?: string }>();

  type AST = { kind: string; v?: string; a?: AST; b?: AST };

  function tokenize(src: string) {
    const s = src.replace(/¬|~|!/g, '!').replace(/∧|&&|&/g, '&').replace(/∨|\|\||\|/g, '|').replace(/→|=>|->/g, '>').replace(/↔|<->|<=>/g, '#');
    const toks: any[] = []; let i = 0;
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
        toks.push({ type: 'var', v: s.slice(i, j) }); i = j; continue;
      }
      throw new Error(`bad char ${ch}`);
    }
    return toks;
  }
  function parse(src: string): AST {
    const toks = tokenize(src); let p = 0;
    const peek = () => toks[p];
    const expect = (t: string) => { if (toks[p]?.type !== t) throw new Error(`exp ${t}`); return toks[p++]; };
    function pIff(): AST { let l = pImp(); while (peek()?.type === 'iff') { p++; l = { kind: 'iff', a: l, b: pImp() }; } return l; }
    function pImp(): AST { const l = pOr(); if (peek()?.type === 'imp') { p++; return { kind: 'imp', a: l, b: pImp() }; } return l; }
    function pOr(): AST { let l = pAnd(); while (peek()?.type === 'or') { p++; l = { kind: 'or', a: l, b: pAnd() }; } return l; }
    function pAnd(): AST { let l = pNot(); while (peek()?.type === 'and') { p++; l = { kind: 'and', a: l, b: pNot() }; } return l; }
    function pNot(): AST { if (peek()?.type === 'not') { p++; return { kind: 'not', a: pNot() }; } return pAtom(); }
    function pAtom(): AST {
      const t = peek(); if (!t) throw new Error('end');
      if (t.type === 'lp') { p++; const e = pIff(); expect('rp'); return e; }
      if (t.type === 'var') { p++; return { kind: 'var', v: t.v }; }
      throw new Error(`bad ${t.type}`);
    }
    const e = pIff(); if (p !== toks.length) throw new Error('trail');
    return e;
  }

  type Lit = { name: string; neg: boolean };
  type Clause = Lit[];

  function tseitin(ast: AST): { clauses: Clause[]; rootName: string; subexpressions: { name: string; expr: string }[] } {
    let counter = 0;
    const subs: { name: string; expr: string }[] = [];
    const clauses: Clause[] = [];
    const memo = new Map<string, string>();

    function lit(name: string, neg = false): Lit { return { name, neg }; }
    function fresh() { counter += 1; return `t${counter}`; }
    function exprKey(a: AST): string {
      if (a.kind === 'var') return a.v!;
      if (a.kind === 'not') return '!' + exprKey(a.a!);
      return `(${exprKey(a.a!)} ${a.kind} ${exprKey(a.b!)})`;
    }
    function pretty(a: AST): string {
      if (a.kind === 'var') return a.v!;
      if (a.kind === 'not') return '¬' + (a.a!.kind === 'var' ? pretty(a.a!) : '(' + pretty(a.a!) + ')');
      const op = { and: '∧', or: '∨', imp: '→', iff: '↔' }[a.kind] ?? '?';
      return pretty(a.a!) + ' ' + op + ' ' + pretty(a.b!);
    }

    function walk(a: AST): string {
      const key = exprKey(a);
      if (memo.has(key)) return memo.get(key)!;
      if (a.kind === 'var') { memo.set(key, a.v!); return a.v!; }
      if (a.kind === 'not') {
        const x = walk(a.a!);
        const t = fresh();
        // t ↔ ¬x  ≡  (t ∨ x) ∧ (¬t ∨ ¬x)
        clauses.push([lit(t), lit(x)]);
        clauses.push([lit(t, true), lit(x, true)]);
        subs.push({ name: t, expr: '¬' + x });
        memo.set(key, t); return t;
      }
      const x = walk(a.a!);
      const y = walk(a.b!);
      const t = fresh();
      if (a.kind === 'and') {
        // t ↔ x ∧ y  ≡  (¬t ∨ x) ∧ (¬t ∨ y) ∧ (t ∨ ¬x ∨ ¬y)
        clauses.push([lit(t, true), lit(x)]);
        clauses.push([lit(t, true), lit(y)]);
        clauses.push([lit(t), lit(x, true), lit(y, true)]);
        subs.push({ name: t, expr: `${x} ∧ ${y}` });
      } else if (a.kind === 'or') {
        // t ↔ x ∨ y  ≡  (¬t ∨ x ∨ y) ∧ (t ∨ ¬x) ∧ (t ∨ ¬y)
        clauses.push([lit(t, true), lit(x), lit(y)]);
        clauses.push([lit(t), lit(x, true)]);
        clauses.push([lit(t), lit(y, true)]);
        subs.push({ name: t, expr: `${x} ∨ ${y}` });
      } else if (a.kind === 'imp') {
        // t ↔ (x → y) ≡ t ↔ (¬x ∨ y)
        clauses.push([lit(t, true), lit(x, true), lit(y)]);
        clauses.push([lit(t), lit(x)]);
        clauses.push([lit(t), lit(y, true)]);
        subs.push({ name: t, expr: `${x} → ${y}` });
      } else if (a.kind === 'iff') {
        // t ↔ (x ↔ y) — 4 clauses
        clauses.push([lit(t, true), lit(x, true), lit(y)]);
        clauses.push([lit(t, true), lit(x), lit(y, true)]);
        clauses.push([lit(t), lit(x, true), lit(y, true)]);
        clauses.push([lit(t), lit(x), lit(y)]);
        subs.push({ name: t, expr: `${x} ↔ ${y}` });
      }
      memo.set(key, t); return t;
    }

    const root = walk(ast);
    // Assert root is true
    clauses.push([lit(root)]);
    return { clauses, rootName: root, subexpressions: subs };
  }

  let formula = $state(initialFormula || '(P -> Q) -> (Q -> R)');
  let result = $state<ReturnType<typeof tseitin> | null>(null);
  let error = $state('');
  let astFmt = $state('');

  $effect(() => {
    try {
      const a = parse(formula);
      result = tseitin(a);
      error = '';
    } catch (e: any) {
      error = e.message; result = null;
    }
  });

  function fmtClause(c: Lit[]): string {
    if (c.length === 0) return '□';
    return '(' + c.map((l) => (l.neg ? '¬' : '') + l.name).join(' ∨ ') + ')';
  }

  // Count operators in the AST as a rough naive-CNF estimate proxy.
  function countOps(a: AST): number {
    if (a.kind === 'var') return 0;
    if (a.kind === 'not') return 1 + countOps(a.a!);
    return 1 + countOps(a.a!) + countOps(a.b!);
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push('**Setup.**');
    lines.push(`- Input formula: \`${formula}\`.`);
    lines.push('');

    if (error) {
      lines.push(`**Error.** ${error}`);
      return lines.join('\n');
    }
    if (!result) return lines.join('\n');

    lines.push(`**Step 1 — fresh variables.** Introduce a Tseitin variable for each non-atomic subformula:`);
    lines.push('');
    if (result.subexpressions.length === 0) {
      lines.push('- (None — formula is atomic.)');
    } else {
      for (const s of result.subexpressions) {
        lines.push(`- $${s.name} \\leftrightarrow ${s.expr.replace(/¬/g, '\\neg ').replace(/∧/g, '\\land').replace(/∨/g, '\\lor').replace(/→/g, '\\to').replace(/↔/g, '\\leftrightarrow')}$`);
      }
    }
    lines.push('');

    lines.push(`**Step 2 — equivalence clauses.** Encoding the ${result.subexpressions.length} equivalence${result.subexpressions.length === 1 ? '' : 's'} as CNF plus the unit clause asserting the root:`);
    lines.push('');
    for (let i = 0; i < result.clauses.length; i++) {
      lines.push(`${i + 1}. \`${fmtClause(result.clauses[i])}\``);
    }
    lines.push('');

    lines.push(`**Root unit clause.** \`(${result.rootName})\` asserts the top of the formula is true.`);
    lines.push('');

    try {
      const a = parse(formula);
      const ops = countOps(a);
      lines.push(`**Size comparison.**`);
      lines.push(`- Tseitin output: **${result.clauses.length} clauses**, **${result.subexpressions.length} new variables** — linear in formula size.`);
      lines.push(`- Naive CNF (distribute ∨ over ∧) on this ${ops}-operator formula can blow up exponentially with nested implications/biconditionals — Tseitin avoids that.`);
      lines.push(`- The two CNFs are **equisatisfiable** (same SAT/UNSAT verdict), not logically equivalent.`);
    } catch {}

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <input class="w-full font-mono px-3 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={formula} />
  {#if error}<div class="text-rose-600 text-sm">{error}</div>{/if}

  <div class="text-sm text-ink-600 dark:text-ink-300">
    Tseitin introduces a fresh auxiliary variable for each non-atomic subformula and posts equivalence clauses. The result is <b>equisatisfiable</b> (same SAT/UNSAT status), <b>linear-size</b> in the input, but uses extra variables.
  </div>

  {#if result}
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="card !p-3">
        <div class="text-xs uppercase tracking-wider text-ink-500 mb-2 font-semibold">Auxiliary variables ({result.subexpressions.length})</div>
        <div class="font-mono text-xs space-y-1">
          {#each result.subexpressions as s}
            <div><span class="text-accent-700 dark:text-accent-300 font-bold">{s.name}</span> ↔ {s.expr}</div>
          {/each}
        </div>
      </div>
      <div class="card !p-3">
        <div class="text-xs uppercase tracking-wider text-ink-500 mb-2 font-semibold">CNF clauses ({result.clauses.length})</div>
        <div class="font-mono text-xs space-y-0.5 max-h-[260px] overflow-y-auto">
          {#each result.clauses as c, i}
            <div><span class="text-ink-400 mr-2">{i + 1}.</span>{fmtClause(c)}</div>
          {/each}
        </div>
      </div>
    </div>
    <div class="text-xs text-ink-500">
      Root literal asserted: <span class="font-mono">{result.rootName}</span>. Variables introduced: {result.subexpressions.length}.
      Compare: naive CNF distribution can be exponential in the formula size; Tseitin is always O(|formula|) clauses.
    </div>
  {/if}

  <ExamAnswer answer={examAnswer} summary={error ? 'parse error' : result ? `${result.clauses.length} clauses · ${result.subexpressions.length} fresh vars` : '—'} />
</div>
