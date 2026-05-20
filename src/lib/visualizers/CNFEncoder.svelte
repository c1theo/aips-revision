<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // CNF conversion stepper: eliminate ⇔, ⇒, push ¬, distribute ∨ over ∧.
  // Reuses tokenizer/parser of TruthTable.

  let { initialFormula = '' } = $props<{ initialFormula?: string }>();

  type AST = { kind: string; v?: string; a?: AST; b?: AST };

  function tokenize(src: string) {
    const s = src.replace(/¬|~|!/g, '!').replace(/∧|&&|&/g, '&').replace(/∨|\|\||\|/g, '|').replace(/→|=>|->/g, '>').replace(/↔|<->|<=>/g, '#');
    const toks: any[] = []; let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ('(){}'.includes(ch)) { toks.push({ type: ch === '(' ? 'lp' : 'rp' }); i++; continue; }
      if (ch === '!') { toks.push({ type: 'not' }); i++; continue; }
      if (ch === '&') { toks.push({ type: 'and' }); i++; continue; }
      if (ch === '|') { toks.push({ type: 'or' }); i++; continue; }
      if (ch === '>') { toks.push({ type: 'imp' }); i++; continue; }
      if (ch === '#') { toks.push({ type: 'iff' }); i++; continue; }
      if (/[A-Za-z]/.test(ch)) { let j = i; while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++; toks.push({ type: 'var', v: s.slice(i, j) }); i = j; continue; }
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
    const e = pIff(); if (p !== toks.length) throw new Error('trail'); return e;
  }

  function ppr(a: AST): string {
    switch (a.kind) {
      case 'var': return a.v!;
      case 'not': return '¬' + (a.a!.kind === 'var' ? ppr(a.a!) : '(' + ppr(a.a!) + ')');
      case 'and': return ppr(a.a!) + ' ∧ ' + ppr(a.b!);
      case 'or': return ppr(a.a!) + ' ∨ ' + ppr(a.b!);
      case 'imp': return ppr(a.a!) + ' → ' + ppr(a.b!);
      case 'iff': return ppr(a.a!) + ' ↔ ' + ppr(a.b!);
    }
    return '?';
  }

  function clone(a: AST): AST { return JSON.parse(JSON.stringify(a)); }

  function elimIff(a: AST): AST {
    a = clone(a);
    function walk(n: AST): AST {
      if (n.kind === 'iff') {
        const A = walk(n.a!); const B = walk(n.b!);
        return { kind: 'and', a: { kind: 'imp', a: A, b: B }, b: { kind: 'imp', a: clone(B), b: clone(A) } };
      }
      if (n.a) n.a = walk(n.a);
      if (n.b) n.b = walk(n.b);
      return n;
    }
    return walk(a);
  }

  function elimImp(a: AST): AST {
    a = clone(a);
    function walk(n: AST): AST {
      if (n.kind === 'imp') return { kind: 'or', a: { kind: 'not', a: walk(n.a!) }, b: walk(n.b!) };
      if (n.a) n.a = walk(n.a);
      if (n.b) n.b = walk(n.b);
      return n;
    }
    return walk(a);
  }

  function pushNeg(a: AST): AST {
    a = clone(a);
    function walk(n: AST): AST {
      if (n.kind === 'not') {
        const c = n.a!;
        if (c.kind === 'not') return walk(c.a!);
        if (c.kind === 'and') return { kind: 'or', a: walk({ kind: 'not', a: c.a! }), b: walk({ kind: 'not', a: c.b! }) };
        if (c.kind === 'or') return { kind: 'and', a: walk({ kind: 'not', a: c.a! }), b: walk({ kind: 'not', a: c.b! }) };
      }
      if (n.a) n.a = walk(n.a);
      if (n.b) n.b = walk(n.b);
      return n;
    }
    return walk(a);
  }

  function distribute(a: AST): AST {
    a = clone(a);
    function walk(n: AST): AST {
      if (n.a) n.a = walk(n.a);
      if (n.b) n.b = walk(n.b);
      if (n.kind === 'or') {
        if (n.b!.kind === 'and') return { kind: 'and', a: walk({ kind: 'or', a: n.a!, b: n.b!.a! }), b: walk({ kind: 'or', a: clone(n.a!), b: n.b!.b! }) };
        if (n.a!.kind === 'and') return { kind: 'and', a: walk({ kind: 'or', a: n.a!.a!, b: n.b! }), b: walk({ kind: 'or', a: n.a!.b!, b: clone(n.b!) }) };
      }
      return n;
    }
    let prev = '', cur = ppr(a);
    while (prev !== cur) { prev = cur; a = walk(a); cur = ppr(a); }
    return a;
  }

  let formula = $state(initialFormula || '(P -> Q) -> (Q -> R)');
  let steps = $state<{ name: string; ast: AST }[]>([]);
  let error = $state('');

  $effect(() => {
    try {
      const a0 = parse(formula);
      const a1 = elimIff(a0);
      const a2 = elimImp(a1);
      const a3 = pushNeg(a2);
      const a4 = distribute(a3);
      steps = [
        { name: 'Original', ast: a0 },
        { name: 'Eliminate ↔', ast: a1 },
        { name: 'Eliminate →', ast: a2 },
        { name: 'Push ¬ inward', ast: a3 },
        { name: 'Distribute ∨ over ∧ — CNF', ast: a4 },
      ];
      error = '';
    } catch (e: any) {
      error = e.message; steps = [];
    }
  });

  // Walk a CNF AST to extract its conjuncts (top-level clauses).
  function extractClauses(a: AST): string[] {
    function conjuncts(n: AST): AST[] {
      if (n.kind === 'and') return [...conjuncts(n.a!), ...conjuncts(n.b!)];
      return [n];
    }
    return conjuncts(a).map((c) => ppr(c));
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
    if (steps.length === 0) return lines.join('\n');

    lines.push('**Conversion to CNF — 4 transformation steps.**');
    lines.push('');
    lines.push('| # | Step | Formula |');
    lines.push('|---|---|---|');
    for (let i = 0; i < steps.length; i++) {
      lines.push(`| ${i} | ${steps[i].name} | \`${ppr(steps[i].ast)}\` |`);
    }
    lines.push('');

    const cnf = steps[steps.length - 1].ast;
    const clauses = extractClauses(cnf);
    lines.push(`**Final CNF clauses (${clauses.length}).**`);
    clauses.forEach((c, i) => lines.push(`${i + 1}. \`${c}\``));

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <input class="w-full font-mono px-3 py-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={formula} />
  {#if error}<div class="text-rose-600 text-sm">{error}</div>{/if}
  <div class="space-y-2">
    {#each steps as s, i}
      <div class="card !py-2 !px-3">
        <div class="text-xs text-ink-500 uppercase tracking-wider font-semibold">{i + 1}. {s.name}</div>
        <div class="font-mono mt-1">{ppr(s.ast)}</div>
      </div>
    {/each}
  </div>

  <ExamAnswer answer={examAnswer} summary={error ? 'parse error' : `CNF (${steps.length ? extractClauses(steps[steps.length - 1].ast).length : 0} clauses)`} />
</div>
