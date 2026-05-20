<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // AC-3 step-by-step on a small constraint graph with rich relation parsing.
  // Supports unary node-consistency phase, binary constraints with arbitrary
  // predicates (=, !=, <, >, <=, >=, abs(...) op n, etc.), manual queue control,
  // and per-arc revision-count tracking.

  type Val = string | number;
  interface BinaryConstraint { a: string; b: string; predicate: (va: Val, vb: Val) => boolean; label: string; src: string }
  interface UnaryConstraint { v: string; predicate: (x: Val) => boolean; label: string; src: string }

  type Problem = 'australia' | 'lt-csp' | 'jobs' | 'custom';
  let problem = $state<Problem>('lt-csp');

  // Preset 1: classic Australia map ≠
  // Preset 2: small CSP from York past-paper style: x1<x2, x2<x3, x3>1, x1≠2
  // Preset 3: jobs ≠ + ordering — a common York-style cargo / interval CSP

  let customSpec = $state(`# Variables: name = comma-separated values (numbers or strings)
# Optional unary constraints, then 'binary:' header then binary constraints
# Operators: =  !=  <  >  <=  >=    Also: abs(a-b)>=3
x1 = 1, 2, 3
x2 = 1, 2, 3
x3 = 1, 2, 3
unary:
x1 != 2
x3 > 1
binary:
x1 < x2
x2 < x3`);

  type Domain = Record<string, Val[]>;

  function parseVal(s: string): Val {
    const n = Number(s);
    return Number.isFinite(n) && s.trim() !== '' && !Number.isNaN(n) ? n : s.trim();
  }

  function compilePred(src: string, vars: string[]): (vals: Record<string, Val>) => boolean {
    // Replace operators we want with JS equivalents
    let body = src;
    // word boundaries to avoid mangling identifiers
    body = body.replace(/\babs\b/g, 'Math.abs');
    body = body.replace(/\bmin\b/g, 'Math.min');
    body = body.replace(/\bmax\b/g, 'Math.max');
    // Single = -> == (if not already ==, !=, <=, >=)
    body = body.replace(/([^=!<>])=([^=])/g, '$1==$2');
    const argList = vars.join(', ');
    try {
      const fn = new Function(argList, `try { return Boolean(${body}); } catch (e) { return false; }`);
      return (vals) => fn(...vars.map((v) => vals[v]));
    } catch (e) {
      return () => false;
    }
  }

  interface ParsedCSP { vars: string[]; D: Domain; U: UnaryConstraint[]; B: BinaryConstraint[] }

  function parseCSP(spec: string): ParsedCSP {
    const vars: string[] = [];
    const D: Domain = {};
    const U: UnaryConstraint[] = [];
    const B: BinaryConstraint[] = [];
    let mode: 'vars' | 'unary' | 'binary' = 'vars';
    for (const rawLine of spec.split('\n')) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;
      const lc = line.toLowerCase();
      if (lc === 'unary:') { mode = 'unary'; continue; }
      if (lc === 'binary:' || lc === 'edges:') { mode = 'binary'; continue; }
      if (mode === 'vars') {
        const m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (m) {
          vars.push(m[1]);
          D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean).map(parseVal);
        }
      } else if (mode === 'unary') {
        // Parse: <var> <op> <expr>   e.g. "x1 != 2", "x3 > 1"
        const m = line.match(/^([A-Za-z_]\w*)\s*(.+)$/);
        if (!m) continue;
        const v = m[1];
        // Constraint over single variable
        const pred = compilePred(`${v} ${m[2]}`, [v]);
        U.push({ v, predicate: (x) => pred({ [v]: x }), label: line, src: line });
      } else if (mode === 'binary') {
        // Try "A-B" shorthand for A != B (Australia style)
        const edge = line.match(/^([A-Za-z_]\w*)\s*-\s*([A-Za-z_]\w*)$/);
        if (edge) {
          const a = edge[1], b = edge[2];
          B.push({ a, b, predicate: (x, y) => x !== y, label: `${a} ≠ ${b}`, src: `${a} != ${b}` });
          B.push({ a: b, b: a, predicate: (x, y) => x !== y, label: `${b} ≠ ${a}`, src: `${b} != ${a}` });
          continue;
        }
        // General: predicate over two variables, find which two appear
        const idents = [...new Set(line.match(/\b[A-Za-z_]\w*\b/g) ?? [])].filter((w) => !['abs', 'min', 'max', 'true', 'false', 'and', 'or', 'not'].includes(w));
        if (idents.length !== 2) continue;
        const [a, b] = idents;
        const pred = compilePred(line, [a, b]);
        const labelOp = line;
        B.push({ a, b, predicate: (va, vb) => pred({ [a]: va, [b]: vb }), label: labelOp, src: line });
        // Generate reverse arc using the same predicate (symmetric in vars)
        B.push({ a: b, b: a, predicate: (vb, va) => pred({ [a]: va, [b]: vb }), label: labelOp + ' (rev)', src: line });
      }
    }
    return { vars, D, U, B };
  }

  function australiaSpec(): string {
    return `# Australia map colouring
WA = R, G, B
NT = R, G, B
SA = R, G, B
Q = R, G, B
NSW = R, G, B
V = R, G, B
T = R, G, B
binary:
WA-NT
WA-SA
NT-SA
NT-Q
SA-Q
SA-NSW
SA-V
Q-NSW
NSW-V`;
  }

  function ltCspSpec(): string {
    return `# Small CSP: x1<x2, x2<x3, x3>1, x1≠2 — solve NC then AC-3
x1 = 1, 2, 3
x2 = 1, 2, 3
x3 = 1, 2, 3
unary:
x1 != 2
x3 > 1
binary:
x1 < x2
x2 < x3`;
  }

  function jobsSpec(): string {
    return `# Job scheduling: 3 jobs needing distinct days, with ordering
j1 = 1, 2, 3, 4
j2 = 1, 2, 3, 4
j3 = 1, 2, 3, 4
unary:
j1 <= 3
binary:
j1 != j2
j2 != j3
j1 != j3
j1 < j2
j2 < j3`;
  }

  // Drive the spec from problem selector
  $effect(() => {
    if (problem === 'australia') customSpec = australiaSpec();
    else if (problem === 'lt-csp') customSpec = ltCspSpec();
    else if (problem === 'jobs') customSpec = jobsSpec();
  });

  let parsed = $derived.by(() => parseCSP(customSpec));

  // Manual queue control: when true, user clicks arcs to revise next.
  let queueMode = $state<'fifo' | 'manual'>('fifo');
  let applyNC = $state(true);

  interface Step {
    phase: 'nc' | 'ac' | 'done' | 'fail';
    queue: { a: string; b: string }[];
    D: Domain;
    msg: string;
    revising?: { a: string; b: string };
    removed?: { var: string; val: Val };
    failure?: boolean;
    arcRevCount: Record<string, number>;
  }

  function arcKey(a: string, b: string) { return `${a}->${b}`; }

  function runAC3(opts: { startDomain?: Domain; order?: { a: string; b: string }[] } = {}): Step[] {
    const steps: Step[] = [];
    const D: Domain = JSON.parse(JSON.stringify(opts.startDomain ?? parsed.D));
    const arcRev: Record<string, number> = {};

    // Node consistency phase
    if (applyNC) {
      steps.push({ phase: 'nc', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `Phase 1: Node consistency. Process ${parsed.U.length} unary constraints.`, arcRevCount: { ...arcRev } });
      for (const u of parsed.U) {
        const before = [...D[u.v]];
        D[u.v] = before.filter((x) => u.predicate(x));
        const removed = before.filter((x) => !D[u.v].includes(x));
        if (removed.length === 0) {
          steps.push({ phase: 'nc', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `NC: \`${u.src}\` — no values removed.`, arcRevCount: { ...arcRev } });
        } else {
          steps.push({ phase: 'nc', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `NC: \`${u.src}\` — remove {${removed.join(',')}} from D(${u.v}).`, arcRevCount: { ...arcRev } });
        }
        if (D[u.v].length === 0) {
          steps.push({ phase: 'fail', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `D(${u.v}) is empty — failure.`, failure: true, arcRevCount: { ...arcRev } });
          return steps;
        }
      }
    }

    // AC-3 phase
    const allArcs = parsed.B.map((c) => ({ a: c.a, b: c.b }));
    const queue: { a: string; b: string }[] = opts.order ? [...opts.order] : [...allArcs];
    for (const a of allArcs) arcRev[arcKey(a.a, a.b)] = 0;
    steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Phase 2: AC-3. Initialise queue with ${queue.length} arcs.`, arcRevCount: { ...arcRev } });

    while (queue.length) {
      const arc = queue.shift()!;
      arcRev[arcKey(arc.a, arc.b)] = (arcRev[arcKey(arc.a, arc.b)] ?? 0) + 1;
      steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Pop arc (${arc.a}, ${arc.b}) — revision #${arcRev[arcKey(arc.a, arc.b)]}.`, revising: arc, arcRevCount: { ...arcRev } });
      const constraint = parsed.B.find((c) => c.a === arc.a && c.b === arc.b);
      if (!constraint) continue;
      const newD: Val[] = [];
      let removed = false;
      for (const v of D[arc.a]) {
        const hasSupport = D[arc.b].some((w) => constraint.predicate(v, w));
        if (hasSupport) newD.push(v);
        else {
          removed = true;
          steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `Remove ${v} from D(${arc.a}) — no support in D(${arc.b}).`, revising: arc, removed: { var: arc.a, val: v }, arcRevCount: { ...arcRev } });
        }
      }
      if (removed) {
        D[arc.a] = newD;
        if (D[arc.a].length === 0) {
          steps.push({ phase: 'fail', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `D(${arc.a}) is empty — AC-3 detects infeasibility.`, failure: true, arcRevCount: { ...arcRev } });
          return steps;
        }
        const neighbours = parsed.B.filter((c) => c.b === arc.a && c.a !== arc.b).map((c) => ({ a: c.a, b: c.b }));
        let added = 0;
        for (const nb of neighbours) {
          if (!queue.some((q) => q.a === nb.a && q.b === nb.b)) {
            queue.push(nb);
            added++;
          }
        }
        steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `D(${arc.a}) shrunk — re-enqueue ${added} incoming arc${added === 1 ? '' : 's'} (X_k, ${arc.a}).`, arcRevCount: { ...arcRev } });
      } else {
        steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), msg: `No revisions for (${arc.a}, ${arc.b}).`, arcRevCount: { ...arcRev } });
      }
    }
    steps.push({ phase: 'done', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `Arc-consistent. Total arc revisions = ${Object.values(arcRev).reduce((a,b) => a+b, 0)}.`, arcRevCount: { ...arcRev } });
    return steps;
  }

  // Auto-mode steps
  let steps = $state<Step[]>([]);
  let idx = $state(0);
  // Manual-mode state (separate)
  let manualDomain = $state<Domain>({});
  let manualQueue = $state<{ a: string; b: string }[]>([]);
  let manualSteps = $state<Step[]>([]);
  let manualArcRev = $state<Record<string, number>>({});
  let manualFinished = $state(false);

  function rerunAuto() {
    steps = runAC3();
    idx = 0;
  }
  function startManual() {
    // Apply NC up front, then hand control over
    const csp = parsed;
    const D = JSON.parse(JSON.stringify(csp.D));
    const arcRev: Record<string, number> = {};
    const ms: Step[] = [];
    if (applyNC) {
      ms.push({ phase: 'nc', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `Phase 1: Node consistency. Process ${csp.U.length} unary constraints.`, arcRevCount: { ...arcRev } });
      for (const u of csp.U) {
        const before = [...D[u.v]];
        D[u.v] = before.filter((x) => u.predicate(x));
        const removed = before.filter((x) => !D[u.v].includes(x));
        if (removed.length > 0) ms.push({ phase: 'nc', queue: [], D: JSON.parse(JSON.stringify(D)), msg: `NC: \`${u.src}\` — remove {${removed.join(',')}} from D(${u.v}).`, arcRevCount: { ...arcRev } });
      }
    }
    for (const a of csp.B) arcRev[arcKey(a.a, a.b)] = 0;
    const q = csp.B.map((c) => ({ a: c.a, b: c.b }));
    ms.push({ phase: 'ac', queue: [...q], D: JSON.parse(JSON.stringify(D)), msg: `Phase 2 (manual). Click any arc in the queue to revise it next.`, arcRevCount: { ...arcRev } });
    manualDomain = D;
    manualQueue = q;
    manualSteps = ms;
    manualArcRev = arcRev;
    manualFinished = false;
  }
  function manualReviseArc(i: number) {
    if (manualFinished) return;
    const arc = manualQueue[i];
    if (!arc) return;
    const csp = parsed;
    const newQueue = [...manualQueue];
    newQueue.splice(i, 1);
    manualQueue = newQueue;
    manualArcRev[arcKey(arc.a, arc.b)] = (manualArcRev[arcKey(arc.a, arc.b)] ?? 0) + 1;
    manualSteps = [...manualSteps, { phase: 'ac', queue: [...newQueue], D: JSON.parse(JSON.stringify(manualDomain)), msg: `Pop arc (${arc.a}, ${arc.b}) — revision #${manualArcRev[arcKey(arc.a, arc.b)]}.`, revising: arc, arcRevCount: { ...manualArcRev } }];
    const constraint = csp.B.find((c) => c.a === arc.a && c.b === arc.b);
    if (!constraint) return;
    const newD: Val[] = [];
    let removed = false;
    for (const v of manualDomain[arc.a]) {
      const hasSupport = manualDomain[arc.b].some((w) => constraint.predicate(v, w));
      if (hasSupport) newD.push(v);
      else {
        removed = true;
        manualSteps = [...manualSteps, { phase: 'ac', queue: [...newQueue], D: JSON.parse(JSON.stringify(manualDomain)), msg: `Remove ${v} from D(${arc.a}) — no support in D(${arc.b}).`, revising: arc, removed: { var: arc.a, val: v }, arcRevCount: { ...manualArcRev } }];
      }
    }
    if (removed) {
      manualDomain = { ...manualDomain, [arc.a]: newD };
      if (newD.length === 0) {
        manualSteps = [...manualSteps, { phase: 'fail', queue: [...newQueue], D: JSON.parse(JSON.stringify(manualDomain)), msg: `D(${arc.a}) is empty — AC-3 detects infeasibility.`, failure: true, arcRevCount: { ...manualArcRev } }];
        manualFinished = true;
        return;
      }
      const neighbours = csp.B.filter((c) => c.b === arc.a && c.a !== arc.b).map((c) => ({ a: c.a, b: c.b }));
      let added = 0;
      const nextQ = [...newQueue];
      for (const nb of neighbours) {
        if (!nextQ.some((q) => q.a === nb.a && q.b === nb.b)) { nextQ.push(nb); added++; }
      }
      manualQueue = nextQ;
      manualSteps = [...manualSteps, { phase: 'ac', queue: [...nextQ], D: JSON.parse(JSON.stringify(manualDomain)), msg: `D(${arc.a}) shrunk — re-enqueue ${added} incoming arc${added === 1 ? '' : 's'}.`, arcRevCount: { ...manualArcRev } }];
    } else {
      manualSteps = [...manualSteps, { phase: 'ac', queue: [...newQueue], D: JSON.parse(JSON.stringify(manualDomain)), msg: `No revisions for (${arc.a}, ${arc.b}).`, arcRevCount: { ...manualArcRev } }];
    }
    if (newQueue.length === 0 && manualQueue.length === 0) {
      manualSteps = [...manualSteps, { phase: 'done', queue: [], D: JSON.parse(JSON.stringify(manualDomain)), msg: `Arc-consistent. Total revisions = ${Object.values(manualArcRev).reduce((a,b)=>a+b,0)}.`, arcRevCount: { ...manualArcRev } }];
      manualFinished = true;
    }
  }

  $effect(() => { parsed; queueMode; applyNC; if (queueMode === 'fifo') rerunAuto(); else startManual(); });

  function reset() {
    if (queueMode === 'fifo') rerunAuto();
    else startManual();
  }

  function colourFor(c: Val): string {
    const s = String(c);
    if (s === 'R') return '#fecaca';
    if (s === 'G') return '#bbf7d0';
    if (s === 'B') return '#bfdbfe';
    if (s === 'Y') return '#fef3c7';
    if (s === 'O') return '#fed7aa';
    if (s === 'P') return '#e9d5ff';
    let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${h}, 65%, 80%)`;
  }

  const cur = $derived(queueMode === 'fifo' ? steps[idx] : manualSteps[manualSteps.length - 1]);
  const allDomainValues = $derived.by(() => {
    const set = new Set<Val>();
    parsed.vars.forEach((v) => parsed.D[v]?.forEach((x) => set.add(x)));
    return [...set];
  });

  const examAnswer = $derived.by(() => {
    const allSteps = queueMode === 'fifo' ? steps : manualSteps;
    const lines: string[] = [];
    lines.push(`**Setup.**`);
    lines.push(`- Variables: ${parsed.vars.join(', ')}.`);
    lines.push(`- Initial domains: ${parsed.vars.map((v) => `D(${v}) = {${parsed.D[v].join(', ')}}`).join('; ')}.`);
    if (parsed.U.length) lines.push(`- Unary constraints: ${parsed.U.map((u) => '`' + u.src + '`').join(', ')}.`);
    const binShown = parsed.B.filter((_c, i) => i % 2 === 0).map((c) => '`' + c.src + '`');
    if (binShown.length) lines.push(`- Binary constraints: ${binShown.join(', ')}.`);
    lines.push('');

    // NC phase summary
    if (applyNC) {
      const ncSteps = allSteps.filter((s) => s.phase === 'nc');
      if (ncSteps.length) {
        lines.push('**Phase 1 — global node consistency.**');
        for (const s of ncSteps) lines.push(`- ${s.msg}`);
        lines.push('');
      }
    }

    // AC phase summary as table
    const acSteps = allSteps.filter((s) => s.phase === 'ac');
    if (acSteps.length) {
      lines.push('**Phase 2 — AC-3 trace.**');
      lines.push('');
      lines.push('| # | Action | Domains after |');
      lines.push('|---|---|---|');
      acSteps.forEach((s, i) => {
        const dom = parsed.vars.map((v) => `D(${v}) = {${s.D[v]?.join(',') ?? ''}}`).join('; ');
        lines.push(`| ${i + 1} | ${s.msg} | ${dom} |`);
      });
      lines.push('');
    }

    const finalStep = allSteps[allSteps.length - 1];
    if (finalStep?.failure) {
      lines.push(`**Outcome.** Infeasibility detected — a domain became empty.`);
    } else if (finalStep) {
      lines.push(`**Final (arc-consistent) domains.** ${parsed.vars.map((v) => `D(${v}) = {${finalStep.D[v].join(', ')}}`).join('; ')}.`);
      const allSingleton = parsed.vars.every((v) => finalStep.D[v].length === 1);
      if (allSingleton) {
        lines.push('');
        lines.push(`Every domain is a singleton — the unique solution is $$${parsed.vars.map((v) => `${v} = ${finalStep.D[v][0]}`).join(', \\quad ')}$$`);
      } else {
        lines.push('');
        lines.push(`The CSP is **arc-consistent**, but not yet solved — backtracking search is still required.`);
      }
    }

    // Revision-count summary
    const revs = finalStep?.arcRevCount ?? {};
    const multi = Object.entries(revs).filter(([_, n]) => Number(n) > 1);
    if (multi.length) {
      lines.push('');
      lines.push(`**Arcs revised more than once:** ${multi.map(([k, n]) => `${k.replace('->', '→')} (${n}×)`).join(', ')}.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2 items-center text-xs">
    <span>Preset:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {problem === 'lt-csp' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'lt-csp')}>x1&lt;x2&lt;x3</button>
      <button class="px-2 py-1 {problem === 'australia' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'australia')}>Australia map</button>
      <button class="px-2 py-1 {problem === 'jobs' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'jobs')}>Jobs</button>
      <button class="px-2 py-1 {problem === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (problem = 'custom')}>Custom</button>
    </div>
    <label class="flex items-center gap-1 ml-2"><input type="checkbox" bind:checked={applyNC} /> Apply NC first</label>
    <span>Queue:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {queueMode === 'fifo' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (queueMode = 'fifo')}>FIFO (auto)</button>
      <button class="px-2 py-1 {queueMode === 'manual' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (queueMode = 'manual')}>Manual (you pick)</button>
    </div>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CSP spec — <code>var = vals</code>, then <code>unary:</code> then unary lines, then <code>binary:</code> then binary lines. Ops: <code>= != &lt; &gt; &lt;= &gt;=</code> and <code>abs()</code>. Shorthand <code>A-B</code> = A≠B.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="11" bind:value={customSpec}></textarea>
  </label>

  {#if queueMode === 'fifo'}
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn-sm" onclick={() => (idx = Math.max(0, idx - 1))} disabled={idx === 0}>⏮ Prev</button>
      <button class="btn btn-sm btn-primary" onclick={() => (idx = Math.min(steps.length - 1, idx + 1))} disabled={idx >= steps.length - 1}>Next ⏭</button>
      <button class="btn btn-sm" onclick={() => (idx = steps.length - 1)}>End</button>
      <button class="btn btn-sm" onclick={reset}>Reset</button>
      <span class="text-xs text-ink-500 ml-auto">step {idx + 1}/{steps.length} · phase {cur?.phase}</span>
    </div>
  {:else}
    <div class="flex flex-wrap gap-2 items-center">
      <button class="btn btn-sm" onclick={reset}>Reset</button>
      <span class="text-xs text-ink-500 ml-auto">step {manualSteps.length} · phase {cur?.phase} · {manualFinished ? '✓ done' : 'click an arc in the queue →'}</span>
    </div>
  {/if}

  <div class="text-sm font-medium"><MathText src={cur?.msg ?? ''} /></div>

  <div class="grid sm:grid-cols-2 gap-4">
    <div>
      <h4 class="text-sm font-semibold mb-2">Domains</h4>
      <div class="grid {parsed.vars.length > 6 ? 'grid-cols-4' : 'grid-cols-3'} gap-1 text-xs font-mono">
        {#each parsed.vars as v}
          <div class="card !p-2 text-center">
            <div class="font-bold text-sm">{v}</div>
            <div class="flex justify-center gap-0.5 mt-1 flex-wrap">
              {#each allDomainValues as col}
                {@const inD = cur?.D[v]?.includes(col)}
                <span class="inline-block w-4 h-4 rounded-sm border" style:background-color={inD ? colourFor(col) : '#f8fafc'} style:opacity={inD ? '1' : '0.2'} style:border-color={inD ? '#475569' : '#cbd5e1'} title={String(col)}></span>
              {/each}
            </div>
            <div class="text-[10px] text-ink-500 mt-1">{cur?.D[v]?.join(',') ?? ''}</div>
          </div>
        {/each}
      </div>
    </div>
    <div>
      <h4 class="text-sm font-semibold mb-2">Arc queue ({cur?.queue.length ?? 0})</h4>
      <div class="card !p-2 text-xs font-mono max-h-[260px] overflow-y-auto">
        {#each cur?.queue ?? [] as q, i}
          {#if queueMode === 'manual'}
            <button class="block w-full text-left px-1 py-0.5 rounded hover:bg-accent-100 dark:hover:bg-accent-900/30" onclick={() => manualReviseArc(i)}>
              ({q.a}, {q.b}) <span class="text-ink-500">— click to revise</span>
            </button>
          {:else}
            <div class="px-1 py-0.5 {i === 0 ? 'bg-accent-100 dark:bg-accent-900/30 rounded' : ''}">
              ({q.a}, {q.b})
            </div>
          {/if}
        {/each}
        {#if (cur?.queue.length ?? 0) === 0}<div class="text-ink-500 italic">empty</div>{/if}
      </div>
      {#if cur?.revising}
        <div class="text-xs mt-2 text-violet-700 dark:text-violet-300">▶ REVISE({cur.revising.a}, {cur.revising.b})</div>
      {/if}
      {#if cur?.removed}
        <div class="text-xs mt-1 text-rose-700 dark:text-rose-300">✗ removed {cur.removed.val} from D({cur.removed.var})</div>
      {/if}
    </div>
  </div>

  <div class="card !p-3">
    <h4 class="text-sm font-semibold mb-2">Arc revision counts</h4>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] font-mono">
      {#each Object.entries(cur?.arcRevCount ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number)) as [k, n]}
        <div class="px-1 {Number(n) > 1 ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-ink-500'}">{k.replace('->', '→')}: {n}</div>
      {/each}
    </div>
    <div class="text-[10px] text-ink-500 mt-1">Arcs revised &gt;1 time are highlighted — this is exactly the AC-3 question-style "find an order where an arc must be revised more than once".</div>
  </div>

  <div class="text-xs text-ink-500">Switch to <b>Manual</b> queue mode to control the arc order yourself, then experiment with orderings that cause arcs to be revised more than once.</div>

  <ExamAnswer answer={examAnswer} summary={`${queueMode === 'manual' ? 'Manual order' : 'FIFO order'} · ${cur?.phase ?? '—'}`} />
</div>
