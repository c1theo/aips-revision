<script lang="ts">
  import ExamAnswer from '../components/ExamAnswer.svelte';
  // 2-SAT solver via implication graph + Tarjan's SCC. Polynomial time.

  let { initialCNF = '' } = $props<{ initialCNF?: string }>();

  function normalizeCNF(s: string): string {
    if (!s) return s;
    if (!/[∨∧¬()]|\bor\b|\band\b|\|\||&&/i.test(s)) return s;
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

  let input = $state(normalizeCNF(initialCNF) || `1 2
-1 3
-2 -3
1 -3`);

  type Clause = [number, number];

  function parse(s: string): Clause[] {
    const out: Clause[] = [];
    for (const line of s.split('\n').map((l) => l.trim()).filter(Boolean)) {
      const parts = line.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
      if (parts.length >= 2) out.push([parts[0], parts[1]]);
    }
    return out;
  }

  // Encode literals as integers: variable v positive = 2v, negative = 2v+1
  // For variable indexes 1..n
  function nodeId(lit: number): number {
    return lit > 0 ? 2 * lit : 2 * (-lit) + 1;
  }
  function negNode(id: number): number {
    return id ^ 1;
  }
  function nodeLabel(id: number, n: number): string {
    const v = Math.floor(id / 2);
    return (id % 2 === 0 ? '' : '¬') + 'x' + v;
  }

  function solve() {
    const clauses = parse(input);
    if (clauses.length === 0) return { sat: null, msg: 'No clauses', sccs: [], edges: [], n: 0, model: {} };
    const allVars = new Set<number>();
    for (const c of clauses) c.forEach((l) => allVars.add(Math.abs(l)));
    const n = Math.max(...allVars);

    // Build implication graph: each (a ∨ b) gives ¬a → b and ¬b → a
    const adj = new Map<number, number[]>();
    const radj = new Map<number, number[]>();
    function addEdge(u: number, v: number) {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u)!.push(v);
      if (!radj.has(v)) radj.set(v, []);
      radj.get(v)!.push(u);
    }

    const edges: { from: number; to: number }[] = [];
    for (const [a, b] of clauses) {
      addEdge(negNode(nodeId(a)), nodeId(b));
      addEdge(negNode(nodeId(b)), nodeId(a));
      edges.push({ from: negNode(nodeId(a)), to: nodeId(b) });
      edges.push({ from: negNode(nodeId(b)), to: nodeId(a) });
    }

    // Tarjan / Kosaraju — use Kosaraju for clarity
    const allNodes: number[] = [];
    for (let v = 1; v <= n; v++) { allNodes.push(2 * v); allNodes.push(2 * v + 1); }

    const visited = new Set<number>();
    const order: number[] = [];
    function dfs1(u: number) {
      if (visited.has(u)) return;
      visited.add(u);
      for (const w of adj.get(u) ?? []) dfs1(w);
      order.push(u);
    }
    for (const u of allNodes) dfs1(u);

    const sccId = new Map<number, number>();
    let nextScc = 0;
    function dfs2(u: number) {
      if (sccId.has(u)) return;
      sccId.set(u, nextScc);
      for (const w of radj.get(u) ?? []) dfs2(w);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      if (!sccId.has(order[i])) { dfs2(order[i]); nextScc += 1; }
    }

    // Check satisfiability: for each variable, x and ¬x must be in different SCCs
    let sat = true;
    const conflict: number[] = [];
    for (let v = 1; v <= n; v++) {
      if (sccId.get(2 * v) === sccId.get(2 * v + 1)) {
        sat = false;
        conflict.push(v);
      }
    }

    // Build model if SAT: assign x = true iff SCC(x) > SCC(¬x) in reverse topo order
    const model: Record<number, boolean> = {};
    if (sat) {
      for (let v = 1; v <= n; v++) {
        model[v] = sccId.get(2 * v)! > sccId.get(2 * v + 1)!;
      }
    }

    // Group SCCs for display
    const sccs: number[][] = Array.from({ length: nextScc }, () => []);
    for (const u of allNodes) sccs[sccId.get(u)!].push(u);

    return { sat, sccs, edges, n, model, conflict, sccId, msg: sat ? 'SAT' : `UNSAT — conflicts on x${conflict.join(', x')}` };
  }

  const result = $derived.by(() => solve());

  function litLabel(lit: number): string {
    return (lit > 0 ? '' : '\\lnot ') + `x_{${Math.abs(lit)}}`;
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    const clauses = parse(input);
    lines.push(`**Setup.**`);
    lines.push(`- 2-CNF (${clauses.length} clauses): $${clauses.map(([a, b]) => `(${litLabel(a)} \\vee ${litLabel(b)})`).join(' \\wedge ')}$.`);
    lines.push('');

    lines.push(`**Implication graph.** Each clause $(\\ell_1 \\vee \\ell_2)$ adds two edges: $\\lnot\\ell_1 \\Rightarrow \\ell_2$ and $\\lnot\\ell_2 \\Rightarrow \\ell_1$.`);
    lines.push('');
    for (const [a, b] of clauses) {
      lines.push(`- $(${litLabel(a)} \\vee ${litLabel(b)})$ ⇒ $${litLabel(-a)} \\Rightarrow ${litLabel(b)}$ and $${litLabel(-b)} \\Rightarrow ${litLabel(a)}$.`);
    }
    lines.push('');

    lines.push(`**Strongly connected components (${result.sccs.filter((s) => s.length > 0).length}).** (computed via Kosaraju.)`);
    lines.push('');
    result.sccs.forEach((scc, i) => {
      if (scc.length === 0) return;
      const labels = scc.map((id) => {
        const v = Math.floor(id / 2);
        return (id % 2 === 0 ? '' : '\\lnot ') + `x_{${v}}`;
      });
      lines.push(`- SCC ${i}: $\\{${labels.join(', ')}\\}$.`);
    });
    lines.push('');

    if (result.sat === null) {
      lines.push(`**Outcome.** No clauses to evaluate.`);
    } else if (result.sat) {
      lines.push(`**Verdict.** $\\boxed{\\text{SAT}}$ — for every variable $x_i$, the literals $x_i$ and $\\lnot x_i$ lie in **different** SCCs.`);
      lines.push('');
      lines.push(`**Satisfying model** (reverse topological rule — assign each literal **true** in the SCC ordered later):`);
      lines.push('');
      const modelLine = Object.entries(result.model).map(([v, b]) => `$x_{${v}} = ${b ? 'T' : 'F'}$`).join(', ');
      lines.push(modelLine);
    } else {
      lines.push(`**Verdict.** $\\boxed{\\text{UNSAT}}$ — variable${result.conflict && result.conflict.length > 1 ? 's' : ''} ${result.conflict?.map((v) => `$x_{${v}}$`).join(', ')} ${result.conflict && result.conflict.length === 1 ? 'has' : 'have'} both polarities in the same SCC, forcing $x_i \\Leftrightarrow \\lnot x_i$ — a contradiction.`);
    }
    lines.push('');

    lines.push(`**Complexity.** 2-SAT is solvable in $O(n + m)$ via SCCs — in stark contrast to general SAT (NP-complete). The "tipping point" between $k = 2$ (polynomial) and $k = 3$ (NP-complete) is the textbook example of how a tiny change in clause length flips a problem's complexity class.`);

    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">2-CNF (one clause per line; integers = variables, negative for negation). Each clause must have exactly 2 literals.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="6" bind:value={input}></textarea>
  </label>

  <div class="flex gap-2 flex-wrap text-xs">
    Try:
    <button class="btn btn-sm" onclick={() => (input = '1 2\n-1 3\n-2 -3\n1 -3')}>Example (SAT)</button>
    <button class="btn btn-sm" onclick={() => (input = '1 2\n-1 2\n1 -2\n-1 -2')}>UNSAT</button>
    <button class="btn btn-sm" onclick={() => (input = '1 -2\n2 -3\n3 -1')}>Cycle</button>
  </div>

  <div class="text-sm font-medium {result.sat ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}">{result.msg}</div>

  {#if result.sat}
    <div class="text-xs font-mono">
      Model: {Object.entries(result.model).map(([v, b]) => `x${v}=${b ? 'T' : 'F'}`).join(', ')}
    </div>
  {/if}

  <div class="card !p-3">
    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Implication graph clauses</div>
    <div class="text-xs font-mono space-y-0.5">
      {#each parse(input) as c, i}
        <div>({c[0] > 0 ? '' : '¬'}x{Math.abs(c[0])} ∨ {c[1] > 0 ? '' : '¬'}x{Math.abs(c[1])}) → implies: ¬({c[0] > 0 ? '' : '¬'}x{Math.abs(c[0])}) → ({c[1] > 0 ? '' : '¬'}x{Math.abs(c[1])}), and ¬({c[1] > 0 ? '' : '¬'}x{Math.abs(c[1])}) → ({c[0] > 0 ? '' : '¬'}x{Math.abs(c[0])})</div>
      {/each}
    </div>
  </div>

  <div class="card !p-3">
    <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-1">Strongly connected components ({result.sccs.length})</div>
    <div class="text-xs font-mono space-y-0.5">
      {#each result.sccs as scc, i}
        {#if scc.length > 0}
          <div>
            <span class="text-ink-500">SCC {i}:</span>
            <span class="{scc.length > 1 ? 'font-semibold' : ''}">{scc.map((id) => nodeLabel(id, result.n)).join(', ')}</span>
            {#if result.conflict?.some((v) => scc.includes(2 * v) && scc.includes(2 * v + 1))}<span class="text-rose-600 ml-2">← contains both x and ¬x ⇒ UNSAT</span>{/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <div class="text-xs text-ink-500">
    <b>2-SAT in linear time.</b> Each clause $(\ell_1 \vee \ell_2)$ corresponds to two implications: $\lnot\ell_1 \Rightarrow \ell_2$ and $\lnot\ell_2 \Rightarrow \ell_1$. Build the implication graph; compute SCCs (Kosaraju/Tarjan). <b>UNSAT iff</b> some variable $x$ has $x$ and $\lnot x$ in the same SCC (both forced equal). Otherwise SAT — assign each variable so the literal in the later SCC (reverse topological order) is true.
  </div>

  <ExamAnswer answer={examAnswer} summary={`${result.sat === null ? '—' : result.sat ? 'SAT' : 'UNSAT'} · ${result.sccs.filter((s) => s.length > 0).length} SCCs`} />
</div>
