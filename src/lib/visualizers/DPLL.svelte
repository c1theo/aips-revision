<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // DPLL with unit propagation, pure literal, splitting.
  // Input: CNF as clauses of literals (positive int = variable, negative = negation).

  let { initialCNF = '' } = $props<{ initialCNF?: string }>();

  function normalizeCNF(s: string): string {
    // If the CNF uses symbolic syntax — (x1 ∨ x2) ∧ (¬x1 ∨ x3) — convert to one-clause-per-line ints.
    if (!s) return s;
    if (!/[∨∧¬()]|\bor\b|\band\b|\|\||&&/i.test(s)) return s;
    // Strip outer wrapping; split by ∧/and/&&
    const clauseStrs = s
      .replace(/\band\b/gi, '∧')
      .replace(/&&/g, '∧')
      .replace(/\bor\b/gi, '∨')
      .replace(/\|\|/g, '∨')
      .replace(/!/g, '¬')
      .replace(/~/g, '¬')
      .split('∧');
    const lines: string[] = [];
    for (const raw of clauseStrs) {
      const body = raw.replace(/[()]/g, '').trim();
      if (!body) continue;
      const lits = body.split('∨').map((tok) => {
        const t = tok.trim();
        const m = t.match(/^(¬?)\s*x_?\{?(\d+)\}?$/i);
        if (!m) return null;
        return (m[1] ? '-' : '') + m[2];
      }).filter(Boolean);
      if (lits.length) lines.push(lits.join(' '));
    }
    return lines.length ? lines.join('\n') : s;
  }

  let input = $state(normalizeCNF(initialCNF) || `1 2 3
-1 2
-2 3
-3 1
-1 -2 -3`);
  let heuristic = $state<'first' | 'JW' | 'DLIS' | 'MOMS' | 'random'>('first');
  let overrideSpec = $state('');   // e.g. "1=F, 2=T" — force these decisions

  interface Step {
    n: number;
    msg: string;
    assignment: Record<number, boolean>;
    activeClauses: number[][];
    decision?: number;
    upLit?: number;
    pureLit?: number;
  }
  interface TreeNode { id: number; label: string; outcome?: 'sat' | 'unsat'; children: TreeNode[] }
  let steps = $state<Step[]>([]);
  let result = $state<string>('');
  let stepIdx = $state(0);
  let searchTree = $state<TreeNode | null>(null);
  let treeNextId = 0;

  function parse(s: string): number[][] {
    const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((l) => l.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n) && n !== 0));
  }

  function parseOverrides(spec: string): { var: number; val: boolean; firstValue: boolean }[] {
    // Format: "1=F, 2=T" or "1=T, 3=F"
    return spec.split(/[,\s]+/).filter(Boolean).map((tok) => {
      const m = tok.match(/^(-?\d+)\s*=\s*([TtFf])$/);
      if (!m) return null;
      return { var: Math.abs(Number(m[1])), val: m[2].toUpperCase() === 'T', firstValue: true };
    }).filter(Boolean) as { var: number; val: boolean; firstValue: boolean }[];
  }

  function pickDecisionWithOverride(clauses: number[][], assignment: Record<number, boolean>, h: typeof heuristic, overrides: { var: number; val: boolean }[]): { v: number; firstVal: boolean | undefined } {
    // If an override exists for an unassigned variable, use it (in order specified)
    for (const o of overrides) {
      if (assignment[o.var] === undefined) {
        // Check the variable still appears in some clause
        const inAnyClause = clauses.some((c) => c.some((lit) => Math.abs(lit) === o.var));
        if (inAnyClause) return { v: o.var, firstVal: o.val };
      }
    }
    return { v: pickDecision(clauses, assignment, h), firstVal: undefined };
  }

  function pickDecision(clauses: number[][], assignment: Record<number, boolean>, h: typeof heuristic): number {
    const vars = new Set<number>();
    for (const c of clauses) for (const lit of c) {
      const v = Math.abs(lit);
      if (assignment[v] === undefined) vars.add(v);
    }
    const arr = [...vars];
    if (arr.length === 0) return -1;
    if (h === 'random') return arr[Math.floor(Math.random() * arr.length)];
    if (h === 'first') return arr[0];
    const scores = new Map<number, number>();
    if (h === 'JW') {
      for (const c of clauses) {
        const w = Math.pow(2, -c.length);
        for (const lit of c) {
          const v = Math.abs(lit);
          if (vars.has(v)) scores.set(v, (scores.get(v) ?? 0) + w);
        }
      }
    } else if (h === 'DLIS') {
      for (const c of clauses) for (const lit of c) {
        const v = Math.abs(lit);
        if (vars.has(v)) scores.set(v, (scores.get(v) ?? 0) + 1);
      }
    } else if (h === 'MOMS') {
      const minLen = Math.min(...clauses.map((c) => c.length));
      for (const c of clauses) {
        if (c.length !== minLen) continue;
        for (const lit of c) {
          const v = Math.abs(lit);
          if (vars.has(v)) scores.set(v, (scores.get(v) ?? 0) + 1);
        }
      }
    }
    return [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? arr[0];
  }

  function simplify(clauses: number[][], assignment: Record<number, boolean>): number[][] | null {
    const out: number[][] = [];
    for (const c of clauses) {
      const newC: number[] = [];
      let satisfied = false;
      for (const lit of c) {
        const v = Math.abs(lit);
        if (assignment[v] === undefined) newC.push(lit);
        else if ((lit > 0) === assignment[v]) { satisfied = true; break; }
      }
      if (satisfied) continue;
      if (newC.length === 0) return null; // empty clause
      out.push(newC);
    }
    return out;
  }

  function dpll(clauses: number[][], assignment: Record<number, boolean>, depth: number, log: Step[], parent?: TreeNode, overrides: { var: number; val: boolean }[] = []): boolean {
    let cur = simplify(clauses, assignment);
    if (cur === null) {
      log.push({ n: log.length, msg: `Empty clause derived — backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
      return false;
    }

    // unit propagate
    let progressed = true;
    while (progressed && cur && cur.length > 0) {
      progressed = false;
      const unit = cur.find((c) => c.length === 1);
      if (unit) {
        const lit = unit[0];
        const v = Math.abs(lit);
        assignment[v] = lit > 0;
        log.push({ n: log.length, msg: `Unit propagation: clause ${fmtClause(unit)} is unit ⇒ $x_{${v}} = ${lit > 0 ? 'T' : 'F'}$ (forced).`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), upLit: lit });
        cur = simplify(clauses, assignment);
        if (cur === null) {
          log.push({ n: log.length, msg: `Empty clause derived ⇒ backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
          return false;
        }
        progressed = true;
      }
    }

    // pure literal
    if (cur && cur.length > 0) {
      const positivity: Record<number, Set<number>> = {};
      for (const c of cur) for (const lit of c) {
        const v = Math.abs(lit);
        (positivity[v] ??= new Set()).add(Math.sign(lit));
      }
      for (const [vStr, signs] of Object.entries(positivity)) {
        const v = Number(vStr);
        if (signs.size === 1 && assignment[v] === undefined) {
          const lit = v * [...signs][0];
          assignment[v] = lit > 0;
          log.push({ n: log.length, msg: `Pure literal: $x_{${v}}$ appears only ${lit > 0 ? 'positively' : 'negatively'} ⇒ set $x_{${v}} = ${lit > 0 ? 'T' : 'F'}$.`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), pureLit: lit });
          cur = simplify(clauses, assignment);
          if (cur === null) {
            log.push({ n: log.length, msg: `Conflict after pure literal — backtrack.`, assignment: { ...assignment }, activeClauses: [[]] });
            return false;
          }
        }
      }
    }

    if (cur && cur.length === 0) {
      log.push({ n: log.length, msg: `All clauses satisfied — SAT.`, assignment: { ...assignment }, activeClauses: [] });
      return true;
    }

    // decide
    const { v, firstVal } = pickDecisionWithOverride(cur!, assignment, heuristic, overrides);
    if (v === -1) {
      log.push({ n: log.length, msg: `All variables assigned but clauses remain — SAT vacuously.`, assignment: { ...assignment }, activeClauses: [] });
      return true;
    }
    const firstTry = firstVal ?? true;
    const reason = firstVal !== undefined ? `(user override: try ${firstVal ? 'T' : 'F'} first)` : `(heuristic: ${heuristic})`;
    log.push({ n: log.length, msg: `Decision level ${depth + 1}: decide $x_{${v}} = ${firstTry ? 'T' : 'F'}$ ${reason}.`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), decision: firstTry ? v : -v });

    const firstChild: TreeNode = { id: treeNextId++, label: `x${v}=${firstTry ? 'T' : 'F'}`, children: [] };
    if (parent) parent.children.push(firstChild);
    const aFirst = { ...assignment, [v]: firstTry };
    if (dpll(clauses, aFirst, depth + 1, log, firstChild, overrides)) {
      firstChild.outcome = 'sat';
      Object.assign(assignment, aFirst); return true;
    }
    firstChild.outcome = 'unsat';

    log.push({ n: log.length, msg: `Backtrack to decision level ${depth + 1}: try the other branch, $x_{${v}} = ${!firstTry ? 'T' : 'F'}$.`, assignment: { ...assignment }, activeClauses: JSON.parse(JSON.stringify(cur)), decision: !firstTry ? v : -v });
    const secondChild: TreeNode = { id: treeNextId++, label: `x${v}=${!firstTry ? 'T' : 'F'}`, children: [] };
    if (parent) parent.children.push(secondChild);
    const aSecond = { ...assignment, [v]: !firstTry };
    if (dpll(clauses, aSecond, depth + 1, log, secondChild, overrides)) {
      secondChild.outcome = 'sat';
      Object.assign(assignment, aSecond); return true;
    }
    secondChild.outcome = 'unsat';
    return false;
  }

  function run() {
    const clauses = parse(input);
    const overrides = parseOverrides(overrideSpec);
    const log: Step[] = [];
    const ass: Record<number, boolean> = {};
    treeNextId = 0;
    const root: TreeNode = { id: treeNextId++, label: 'root', children: [] };
    const ok = dpll(clauses, ass, 0, log, root, overrides);
    root.outcome = ok ? 'sat' : 'unsat';
    searchTree = root;
    steps = log; stepIdx = 0;
    result = ok ? `SAT — model: ${Object.entries(ass).map(([k, v]) => `x${k}=${v ? 'T' : 'F'}`).join(', ')}` : 'UNSAT';
  }
  $effect(() => { input; heuristic; overrideSpec; run(); });

  function fmtClause(c: number[]) { return '(' + c.map((l) => (l < 0 ? '¬' : '') + 'x' + Math.abs(l)).join(' ∨ ') + ')'; }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    const clauses = parse(input);
    const overrides = parseOverrides(overrideSpec);
    lines.push(`**Setup.**`);
    lines.push(`- CNF (${clauses.length} clauses): $${clauses.map(fmtClause).join(' \\wedge ')}$.`);
    lines.push(`- Decision heuristic: **${heuristic}**.`);
    if (overrides.length) {
      lines.push(`- User-forced decision order: ${overrides.map((o) => `$x_{${o.var}} = ${o.val ? 'T' : 'F'}$`).join(', ')}.`);
    }
    lines.push('');

    lines.push(`**Trace (${steps.length} steps).**`);
    lines.push('');
    if (steps.length === 0) {
      lines.push('No steps yet.');
    } else {
      let n = 1;
      for (const s of steps) {
        // Strip the inline KaTeX to keep the table cells short — leave markdown-friendly text
        const plain = s.msg.replace(/\$([^$]+)\$/g, '$1');
        lines.push(`${n}. ${plain}`);
        n++;
      }
    }
    lines.push('');

    if (result.startsWith('SAT')) {
      lines.push(`**Outcome.** $\\boxed{\\text{SAT}}$.`);
      lines.push('');
      const model = result.replace(/^SAT — model:\s*/, '');
      lines.push(`**Satisfying model:** ${model.split(', ').map((kv) => `$${kv.replace('x', 'x_{').replace('=', '} = ')}$`).join(', ')}.`);
    } else if (result === 'UNSAT') {
      lines.push(`**Outcome.** $\\boxed{\\text{UNSAT}}$ — every branch of the search tree closes with an empty clause.`);
    } else {
      lines.push(`**Outcome.** ${result}.`);
    }

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CNF — one clause per line; integers are variables, negative for negation</span>
    <textarea class="w-full font-mono text-sm p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={input}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center text-xs">
    Examples:
    <button class="btn btn-sm" onclick={() => (input = '1 2 3\n-1 2\n-2 3\n-3 1\n-1 -2 -3')}>SAT (5 clauses)</button>
    <button class="btn btn-sm" onclick={() => (input = '1 2\n-1 2\n1 -2\n-1 -2')}>UNSAT</button>
    <button class="btn btn-sm" onclick={() => (input = '1 -2 3\n-1 2\n2 -3\n-2 3\n-1 -3')}>Random</button>
    <label class="flex items-center gap-1 ml-3">Decision heuristic:
      <select bind:value={heuristic} class="px-1 py-0.5 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900">
        <option value="first">First unassigned</option>
        <option value="JW">Jeroslow-Wang</option>
        <option value="DLIS">DLIS</option>
        <option value="MOMS">MOMS</option>
        <option value="random">Random</option>
      </select>
    </label>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1"><b>Decision overrides</b> — force the first try for specific variables. Format: <code>1=F, 3=T</code> means try x₁=F first, then x₃=T first. Use this when an exam question says "start with x₁ = False".</span>
    <input class="w-full font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={overrideSpec} placeholder="e.g. 1=F, 2=T" />
  </label>

  <div class="font-medium text-sm">{result}</div>

  <div class="flex gap-2">
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))}>⏮</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.min(steps.length - 1, stepIdx + 1))}>⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{steps.length}</span>
  </div>

  {#if steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium"><MathText src={steps[stepIdx].msg} /></div>
      <div class="grid sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Assignment</div>
          {#each Object.entries(steps[stepIdx].assignment) as [k, v]}
            <span class="inline-block mr-2">x{k}={v ? 'T' : 'F'}</span>
          {/each}
          {#if Object.keys(steps[stepIdx].assignment).length === 0}<span class="text-ink-500 italic">empty</span>{/if}
        </div>
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Remaining clauses</div>
          {#each steps[stepIdx].activeClauses as c}
            <div>{fmtClause(c)}</div>
          {/each}
          {#if steps[stepIdx].activeClauses.length === 0}<span class="text-ink-500 italic">none — SAT</span>{/if}
        </div>
      </div>
    </div>
  {/if}

  {#if searchTree && searchTree.children.length > 0}
    {@const treeWidth = countLeaves(searchTree)}
    {@const treeDepth = treeMaxDepth(searchTree)}
    {@const W = Math.max(400, treeWidth * 60)}
    {@const H = Math.max(180, (treeDepth + 1) * 50)}
    {@const positions = layoutTree(searchTree, W, H)}
    <div>
      <div class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Search tree</div>
      <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" class="w-full border border-ink-200 dark:border-ink-700 rounded bg-ink-50 dark:bg-ink-900" style="height: {H}px">
        {#each positions.edges as e}
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#94a3b8" />
        {/each}
        {#each positions.nodes as p}
          <circle cx={p.x} cy={p.y} r="16"
                  fill={p.node.outcome === 'sat' ? '#bbf7d0' : p.node.outcome === 'unsat' ? '#fecaca' : '#e2e8f0'}
                  stroke={p.node.outcome === 'sat' ? '#166534' : p.node.outcome === 'unsat' ? '#991b1b' : '#475569'} stroke-width="1.5" />
          <text x={p.x} y={p.y + 4} text-anchor="middle" font-size="10" font-weight="bold">{p.node.label}</text>
        {/each}
      </svg>
      <div class="text-xs text-ink-500 mt-1">Green = SAT subtree. Red = UNSAT subtree. Each branch = a decision (x=T or x=F).</div>
    </div>
  {/if}

  <ExamAnswer answer={examAnswer} summary={`${result.startsWith('SAT') ? 'SAT' : result === 'UNSAT' ? 'UNSAT' : '—'} · ${steps.length} steps · heuristic = ${heuristic}`} />
</div>

<script lang="ts" module>
  interface TN { id: number; label: string; outcome?: 'sat' | 'unsat'; children: TN[] }
  export function countLeaves(n: TN): number {
    if (n.children.length === 0) return 1;
    return n.children.reduce((s, c) => s + countLeaves(c), 0);
  }
  export function treeMaxDepth(n: TN): number {
    if (n.children.length === 0) return 0;
    return 1 + Math.max(...n.children.map(treeMaxDepth));
  }
  export function layoutTree(root: TN, W: number, H: number) {
    const nodes: { x: number; y: number; node: TN }[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const maxD = treeMaxDepth(root);
    let nextX = 0;
    const totalLeaves = countLeaves(root);
    function walk(n: TN, depth: number): number {
      const y = 30 + depth * Math.max(40, (H - 60) / Math.max(1, maxD));
      if (n.children.length === 0) {
        const x = 30 + (nextX++ / Math.max(1, totalLeaves - 1)) * (W - 60);
        nodes.push({ x, y, node: n });
        return x;
      }
      const xs = n.children.map((c) => walk(c, depth + 1));
      const x = (xs[0] + xs[xs.length - 1]) / 2;
      nodes.push({ x, y, node: n });
      for (let i = 0; i < n.children.length; i++) {
        edges.push({ x1: x, y1: y + 14, x2: xs[i], y2: y + Math.max(40, (H - 60) / Math.max(1, maxD)) - 14 });
      }
      return x;
    }
    walk(root, 0);
    return { nodes, edges };
  }
</script>
