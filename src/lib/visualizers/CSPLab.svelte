<script lang="ts">
  import MathText from '../components/MathText.svelte';

  // CSPLab — the complete CSP pipeline on a user-defined CSP:
  //   NC (optional)  →  AC-3 (optional)  →  Backtracking
  // with selectable propagation (None / FC / MAC), branching style (d-way / 2-way),
  // variable ordering (top / MRV / degree / MRV+deg / custom), value ordering
  // (inc / dec / LCV / custom). Renders the search tree as it grows.

  type Val = string | number;

  let spec = $state(`# Small CSP — variables, optional unary, then 'binary:' then binary lines.
# Ops: = != < > <= >= abs(...) ; shorthand A-B = A!=B
x1 = 1, 2, 3
x2 = 1, 2, 3
x3 = 1, 2, 3
unary:
x1 != 2
x3 > 1
binary:
x1 < x2
x2 < x3`);

  type Preset = 'lt-csp' | 'australia' | 'sudoku4' | 'cargo' | 'custom';
  let preset = $state<Preset>('lt-csp');
  $effect(() => {
    if (preset === 'lt-csp') spec = `x1 = 1, 2, 3
x2 = 1, 2, 3
x3 = 1, 2, 3
unary:
x1 != 2
x3 > 1
binary:
x1 < x2
x2 < x3`;
    else if (preset === 'australia') spec = `WA = R, G, B
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
    else if (preset === 'sudoku4') spec = `# 4-Queens
q1 = 1, 2, 3, 4
q2 = 1, 2, 3, 4
q3 = 1, 2, 3, 4
q4 = 1, 2, 3, 4
binary:
q1 != q2
q1 != q3
q1 != q4
q2 != q3
q2 != q4
q3 != q4
abs(q1 - q2) != 1
abs(q1 - q3) != 2
abs(q1 - q4) != 3
abs(q2 - q3) != 1
abs(q2 - q4) != 2
abs(q3 - q4) != 1`;
    else if (preset === 'cargo') spec = `# Ship: 3 cargo items into 3 slots, ship leaves on day 1..4
c1 = 1, 2, 3, 4
c2 = 1, 2, 3, 4
c3 = 1, 2, 3, 4
unary:
c1 <= 3
c3 >= 2
binary:
c1 != c2
c1 != c3
c2 != c3
c1 < c3`;
  });

  type Domain = Record<string, Val[]>;
  type Assignment = Record<string, Val>;
  interface Unary { v: string; src: string; pred: (x: Val) => boolean }
  interface Binary { a: string; b: string; src: string; pred: (x: Val, y: Val) => boolean }
  interface CSP { vars: string[]; D: Domain; U: Unary[]; B: Binary[] }

  function parseVal(s: string): Val {
    const n = Number(s);
    return Number.isFinite(n) && s.trim() !== '' && !Number.isNaN(n) ? n : s.trim();
  }
  function compile(body: string, args: string[]) {
    let b = body.replace(/\babs\b/g, 'Math.abs').replace(/\bmin\b/g, 'Math.min').replace(/\bmax\b/g, 'Math.max');
    b = b.replace(/([^=!<>])=([^=])/g, '$1==$2');
    try { return new Function(args.join(','), `try{return Boolean(${b})}catch(e){return false}`) as any; }
    catch (e) { return () => false; }
  }
  function parseCSP(spec: string): CSP {
    const vars: string[] = [];
    const D: Domain = {}; const U: Unary[] = []; const B: Binary[] = [];
    let mode: 'vars' | 'unary' | 'binary' = 'vars';
    for (const raw of spec.split('\n')) {
      const line = raw.split('#')[0].trim();
      if (!line) continue;
      const lc = line.toLowerCase();
      if (lc === 'unary:') { mode = 'unary'; continue; }
      if (lc === 'binary:' || lc === 'edges:') { mode = 'binary'; continue; }
      if (mode === 'vars') {
        const m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (m) { vars.push(m[1]); D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean).map(parseVal); }
      } else if (mode === 'unary') {
        const m = line.match(/^([A-Za-z_]\w*)\s*(.+)$/);
        if (!m) continue;
        const v = m[1]; const fn = compile(`${v} ${m[2]}`, [v]);
        U.push({ v, src: line, pred: (x) => fn(x) });
      } else {
        const edge = line.match(/^([A-Za-z_]\w*)\s*-\s*([A-Za-z_]\w*)$/);
        if (edge) {
          const a = edge[1], b = edge[2];
          B.push({ a, b, src: `${a} != ${b}`, pred: (x, y) => x !== y });
          B.push({ a: b, b: a, src: `${b} != ${a}`, pred: (x, y) => x !== y });
          continue;
        }
        const idents = [...new Set(line.match(/\b[A-Za-z_]\w*\b/g) ?? [])].filter((w) => !['abs','min','max','true','false','and','or','not'].includes(w));
        if (idents.length !== 2) continue;
        const [a, b] = idents; const fn = compile(line, [a, b]);
        B.push({ a, b, src: line, pred: (x, y) => fn(x, y) });
        B.push({ a: b, b: a, src: line + ' (rev)', pred: (y, x) => fn(x, y) });
      }
    }
    return { vars, D, U, B };
  }

  let propagation = $state<'none' | 'fc' | 'mac'>('fc');
  let branching = $state<'d-way' | '2-way'>('d-way');
  let varOrder = $state<'top' | 'mrv' | 'degree' | 'mrv-deg' | 'custom'>('mrv');
  let customVarOrder = $state('');
  let valOrder = $state<'inc' | 'dec' | 'lcv' | 'custom'>('inc');
  let customValOrder = $state('');
  let applyNC = $state(true);
  let preAC3 = $state(false);

  interface Node {
    id: number;
    parent: number | null;
    decision: string;
    domains: Domain;
    assignment: Assignment;
    msg: string;
    kind: 'root' | 'try' | 'fail' | 'solution' | 'propagate';
    failureReason?: string;
    depth: number;
  }

  function solve(csp: CSP) {
    const nodes: Node[] = [];
    let nodeId = 0;
    const D0: Domain = JSON.parse(JSON.stringify(csp.D));

    function makeNode(parent: number | null, decision: string, domains: Domain, assignment: Assignment, msg: string, kind: Node['kind'], depth: number, failureReason?: string): number {
      const id = nodeId++;
      nodes.push({ id, parent, decision, domains: JSON.parse(JSON.stringify(domains)), assignment: { ...assignment }, msg, kind, depth, failureReason });
      return id;
    }

    // NC
    let D: Domain = JSON.parse(JSON.stringify(D0));
    if (applyNC) {
      for (const u of csp.U) D[u.v] = D[u.v].filter((x) => u.pred(x));
    }
    let preMsg = `Start. ${applyNC ? 'NC applied. ' : ''}`;
    if (preAC3) {
      const ok = runAC3InPlace(csp, D);
      preMsg += ok ? 'Pre-search AC-3 ran (arc-consistent). ' : 'Pre-search AC-3 detected infeasibility!';
    }
    const rootId = makeNode(null, 'root', D, {}, preMsg, 'root', 0);

    function runAC3InPlace(csp: CSP, D: Domain): boolean {
      const queue: { a: string; b: string }[] = csp.B.map((c) => ({ a: c.a, b: c.b }));
      while (queue.length) {
        const arc = queue.shift()!;
        const constraint = csp.B.find((c) => c.a === arc.a && c.b === arc.b);
        if (!constraint) continue;
        const newD: Val[] = [];
        for (const v of D[arc.a]) if (D[arc.b].some((w) => constraint.pred(v, w))) newD.push(v);
        if (newD.length < D[arc.a].length) {
          D[arc.a] = newD;
          if (newD.length === 0) return false;
          const nbrs = csp.B.filter((c) => c.b === arc.a && c.a !== arc.b).map((c) => ({ a: c.a, b: c.b }));
          for (const nb of nbrs) if (!queue.some((q) => q.a === nb.a && q.b === nb.b)) queue.push(nb);
        }
      }
      return true;
    }

    function degreeOf(v: string, unassigned: Set<string>): number {
      // # of binary constraints to unassigned other vars
      let d = 0;
      for (const c of csp.B) if (c.a === v && unassigned.has(c.b) && c.b !== v) d++;
      return d / 2; // each binary constraint contributes 2 arcs
    }
    function pickVar(unassigned: string[], D: Domain): string {
      const set = new Set(unassigned);
      if (varOrder === 'top') return unassigned[0];
      if (varOrder === 'custom') {
        const order = customVarOrder.split(/[,\s]+/).filter(Boolean);
        for (const v of order) if (set.has(v)) return v;
        return unassigned[0];
      }
      if (varOrder === 'mrv') return [...unassigned].sort((a, b) => D[a].length - D[b].length || a.localeCompare(b))[0];
      if (varOrder === 'degree') return [...unassigned].sort((a, b) => degreeOf(b, set) - degreeOf(a, set))[0];
      // mrv + degree tie-break
      return [...unassigned].sort((a, b) => D[a].length - D[b].length || degreeOf(b, set) - degreeOf(a, set))[0];
    }
    function orderVals(v: string, D: Domain, assignment: Assignment): Val[] {
      const vals = [...D[v]];
      if (valOrder === 'inc') return vals.slice().sort((a, b) => Number(a) - Number(b));
      if (valOrder === 'dec') return vals.slice().sort((a, b) => Number(b) - Number(a));
      if (valOrder === 'custom') {
        const order = customValOrder.split(/[,\s]+/).filter(Boolean).map(parseVal);
        return vals.slice().sort((a, b) => {
          const ia = order.findIndex((x) => String(x) === String(a));
          const ib = order.findIndex((x) => String(x) === String(b));
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
      }
      // LCV: pick value that rules out the fewest values in neighbours
      return vals.slice().sort((a, b) => ruledOut(v, a, D, assignment) - ruledOut(v, b, D, assignment));
    }
    function ruledOut(v: string, val: Val, D: Domain, assignment: Assignment): number {
      let count = 0;
      for (const c of csp.B) {
        if (c.a !== v) continue;
        if (assignment[c.b] !== undefined) continue;
        for (const w of D[c.b]) if (!c.pred(val, w)) count++;
      }
      return count;
    }
    function consistent(assignment: Assignment): boolean {
      for (const c of csp.B) {
        if (assignment[c.a] !== undefined && assignment[c.b] !== undefined && !c.pred(assignment[c.a], assignment[c.b])) return false;
      }
      return true;
    }

    function forwardCheck(D: Domain, assignment: Assignment): { ok: boolean; reason?: string } {
      // For each unassigned variable, prune values not consistent with the assignment.
      for (const v of csp.vars) {
        if (assignment[v] !== undefined) continue;
        const before = [...D[v]];
        D[v] = before.filter((cand) => {
          const test: Assignment = { ...assignment, [v]: cand };
          for (const c of csp.B) {
            if (c.a !== v) continue;
            if (test[c.b] === undefined) continue;
            if (!c.pred(test[v], test[c.b])) return false;
          }
          return true;
        });
        if (D[v].length === 0) return { ok: false, reason: `D(${v}) empty` };
      }
      return { ok: true };
    }

    let solved = false;
    function backtrack(parentId: number, depth: number, assignment: Assignment, D: Domain) {
      if (solved) return;
      const unassigned = csp.vars.filter((v) => assignment[v] === undefined);
      if (unassigned.length === 0) {
        if (!consistent(assignment)) {
          makeNode(parentId, 'leaf', D, assignment, 'Inconsistent at leaf — backtrack.', 'fail', depth, 'inconsistent leaf');
          return;
        }
        makeNode(parentId, 'leaf', D, assignment, `✓ Solution: ${csp.vars.map((v) => `${v}=${assignment[v]}`).join(', ')}`, 'solution', depth);
        solved = true;
        return;
      }
      const v = pickVar(unassigned, D);
      const vals = orderVals(v, D, assignment);
      if (branching === 'd-way') {
        for (const val of vals) {
          if (solved) return;
          const nextA = { ...assignment, [v]: val };
          const nextD = JSON.parse(JSON.stringify(D));
          nextD[v] = [val];
          let msg = `Try ${v} = ${val}`;
          let kind: Node['kind'] = 'try';
          let failReason: string | undefined;
          // Propagation
          if (propagation === 'fc') {
            const r = forwardCheck(nextD, nextA);
            if (!r.ok) { kind = 'fail'; failReason = r.reason; msg += ` → FC: ${r.reason}`; }
          } else if (propagation === 'mac') {
            const r = runAC3InPlace(csp, nextD);
            if (!r) { kind = 'fail'; failReason = 'MAC domain wipeout'; msg += ` → MAC: domain wipeout`; }
          }
          // Also baseline consistency with current partial assignment
          const id = makeNode(parentId, `${v}=${val}`, nextD, nextA, msg, kind, depth + 1, failReason);
          if (kind !== 'fail') backtrack(id, depth + 1, nextA, nextD);
        }
      } else {
        // 2-way: try X=v on the LEFT branch; then X != v on the RIGHT branch (recursive)
        if (vals.length === 0) {
          makeNode(parentId, 'no-vals', D, assignment, `D(${v}) empty — backtrack.`, 'fail', depth + 1, 'D empty');
          return;
        }
        const val = vals[0];
        const restVals = vals.slice(1);
        // LEFT: X = val
        const leftA = { ...assignment, [v]: val };
        const leftD = JSON.parse(JSON.stringify(D));
        leftD[v] = [val];
        let lmsg = `LEFT: ${v} = ${val}`; let lkind: Node['kind'] = 'try'; let lreason: string | undefined;
        if (propagation === 'fc') {
          const r = forwardCheck(leftD, leftA);
          if (!r.ok) { lkind = 'fail'; lreason = r.reason; lmsg += ` → FC fail`; }
        } else if (propagation === 'mac') {
          const r = runAC3InPlace(csp, leftD);
          if (!r) { lkind = 'fail'; lreason = 'MAC wipeout'; lmsg += ` → MAC fail`; }
        }
        const leftId = makeNode(parentId, `${v}=${val}`, leftD, leftA, lmsg, lkind, depth + 1, lreason);
        if (lkind !== 'fail') backtrack(leftId, depth + 1, leftA, leftD);
        if (solved) return;
        // RIGHT: X != val
        const rightD = JSON.parse(JSON.stringify(D));
        rightD[v] = restVals;
        let rmsg = `RIGHT: ${v} ≠ ${val}`; let rkind: Node['kind'] = 'try'; let rreason: string | undefined;
        if (rightD[v].length === 0) { rkind = 'fail'; rreason = `D(${v}) empty`; rmsg += ` → ${rreason}`; }
        else if (propagation === 'fc') {
          const r = forwardCheck(rightD, assignment);
          if (!r.ok) { rkind = 'fail'; rreason = r.reason; rmsg += ` → FC fail`; }
        } else if (propagation === 'mac') {
          const r = runAC3InPlace(csp, rightD);
          if (!r) { rkind = 'fail'; rreason = 'MAC wipeout'; rmsg += ` → MAC fail`; }
        }
        const rightId = makeNode(parentId, `${v}≠${val}`, rightD, assignment, rmsg, rkind, depth + 1, rreason);
        if (rkind !== 'fail') backtrack(rightId, depth + 1, assignment, rightD);
      }
    }

    if (D0 && Object.values(D).every((d) => d.length > 0)) backtrack(rootId, 0, {}, D);
    return { nodes, solved, csp };
  }

  let parsed = $derived.by(() => parseCSP(spec));
  let result = $derived.by(() => { propagation; branching; varOrder; customVarOrder; valOrder; customValOrder; applyNC; preAC3; return solve(parsed); });
  let curNodeId = $state(0);
  $effect(() => { result; curNodeId = 0; });
  const cur = $derived(result.nodes[curNodeId]);

  // Tree layout (simple: group by depth)
  const byDepth = $derived.by(() => {
    const m: Record<number, Node[]> = {};
    for (const n of result.nodes) (m[n.depth] ??= []).push(n);
    return m;
  });
  const maxDepth = $derived(Math.max(0, ...result.nodes.map((n) => n.depth)));

  function colourClassFor(n: Node) {
    if (n.kind === 'solution') return 'bg-emerald-100 border-emerald-500 dark:bg-emerald-900/40';
    if (n.kind === 'fail') return 'bg-rose-100 border-rose-400 dark:bg-rose-900/40';
    if (n.kind === 'root') return 'bg-ink-100 border-ink-400 dark:bg-ink-800';
    return 'bg-sky-50 border-sky-400 dark:bg-sky-900/30';
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap items-center gap-2 text-xs">
    <span>Preset:</span>
    <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
      <button class="px-2 py-1 {preset === 'lt-csp' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (preset = 'lt-csp')}>x1&lt;x2&lt;x3</button>
      <button class="px-2 py-1 {preset === 'australia' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (preset = 'australia')}>Australia</button>
      <button class="px-2 py-1 {preset === 'sudoku4' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (preset = 'sudoku4')}>4-Queens</button>
      <button class="px-2 py-1 {preset === 'cargo' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (preset = 'cargo')}>Cargo</button>
      <button class="px-2 py-1 {preset === 'custom' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (preset = 'custom')}>Custom</button>
    </div>
  </div>

  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CSP spec — see AC-3 visualiser for syntax.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="11" bind:value={spec}></textarea>
  </label>

  <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
    <div>
      <div class="text-ink-500 mb-1">Propagation</div>
      <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
        <button class="px-2 py-1 {propagation === 'none' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (propagation = 'none')}>None</button>
        <button class="px-2 py-1 {propagation === 'fc' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (propagation = 'fc')}>FC</button>
        <button class="px-2 py-1 {propagation === 'mac' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (propagation = 'mac')}>MAC</button>
      </div>
    </div>
    <div>
      <div class="text-ink-500 mb-1">Branching</div>
      <div class="flex rounded-md border border-ink-300 dark:border-ink-700 overflow-hidden">
        <button class="px-2 py-1 {branching === 'd-way' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (branching = 'd-way')}>d-way</button>
        <button class="px-2 py-1 {branching === '2-way' ? 'bg-accent-100 dark:bg-accent-900/40' : ''}" onclick={() => (branching = '2-way')}>2-way</button>
      </div>
    </div>
    <div>
      <div class="text-ink-500 mb-1">Var order</div>
      <select class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={varOrder}>
        <option value="top">Top-to-bottom</option>
        <option value="mrv">MRV (fail-first)</option>
        <option value="degree">Degree</option>
        <option value="mrv-deg">MRV + degree tie</option>
        <option value="custom">Custom</option>
      </select>
      {#if varOrder === 'custom'}<input class="mt-1 w-full font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="x2, x1, x3" bind:value={customVarOrder} />{/if}
    </div>
    <div>
      <div class="text-ink-500 mb-1">Value order</div>
      <select class="px-2 py-1 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" bind:value={valOrder}>
        <option value="inc">Increasing</option>
        <option value="dec">Decreasing</option>
        <option value="lcv">LCV (least-constraining)</option>
        <option value="custom">Custom</option>
      </select>
      {#if valOrder === 'custom'}<input class="mt-1 w-full font-mono px-2 py-1 rounded border border-ink-300 dark:border-ink-700" placeholder="3, 1, 2" bind:value={customValOrder} />{/if}
    </div>
  </div>

  <div class="flex flex-wrap gap-3 items-center text-xs">
    <label class="flex items-center gap-1"><input type="checkbox" bind:checked={applyNC} /> Apply NC first</label>
    <label class="flex items-center gap-1"><input type="checkbox" bind:checked={preAC3} /> Pre-search AC-3</label>
    <span class="ml-auto text-ink-500">Nodes expanded: {result.nodes.length} · {result.solved ? '✓ found a solution' : '✗ no solution'}</span>
  </div>

  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={() => (curNodeId = Math.max(0, curNodeId - 1))} disabled={curNodeId === 0}>⏮ Prev node</button>
    <button class="btn btn-sm btn-primary" onclick={() => (curNodeId = Math.min(result.nodes.length - 1, curNodeId + 1))} disabled={curNodeId >= result.nodes.length - 1}>Next node ⏭</button>
    <span class="text-xs text-ink-500 ml-auto">node {curNodeId + 1}/{result.nodes.length}</span>
  </div>

  {#if cur}
    <div class="card !p-3 text-sm">
      <div class="font-medium {cur.kind === 'solution' ? 'text-emerald-700 dark:text-emerald-300' : cur.kind === 'fail' ? 'text-rose-700 dark:text-rose-300' : ''}"><MathText src={cur.msg} /></div>
      <div class="grid sm:grid-cols-2 gap-3 mt-3 text-xs font-mono">
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Assignment at this node</div>
          {#each parsed.vars as v}
            <div><span class="text-ink-500">{v}</span>: {cur.assignment[v] !== undefined ? `= ${cur.assignment[v]}` : 'unassigned'}</div>
          {/each}
        </div>
        <div>
          <div class="font-sans text-xs text-ink-500 uppercase tracking-wider mb-1">Live domains at this node</div>
          {#each parsed.vars as v}
            <div><span class="text-ink-500">D({v})</span> = {cur.domains[v]?.length ? '{' + cur.domains[v].join(', ') + '}' : '∅'}</div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="card !p-3">
    <h4 class="text-sm font-semibold mb-2">Search tree ({result.nodes.length} nodes, depth ≤ {maxDepth})</h4>
    <div class="overflow-x-auto">
      <div class="flex flex-col gap-2 min-w-fit text-[11px] font-mono">
        {#each Array(maxDepth + 1) as _, d}
          <div class="flex gap-1 flex-wrap">
            <div class="text-ink-400 w-12 shrink-0">d={d}</div>
            {#each byDepth[d] ?? [] as n}
              <button
                class="border-2 rounded px-1.5 py-0.5 {colourClassFor(n)} {n.id === curNodeId ? 'ring-2 ring-accent-500' : ''}"
                onclick={() => (curNodeId = n.id)}
                title={n.msg}
              >{n.decision}</button>
            {/each}
          </div>
        {/each}
      </div>
    </div>
    <div class="text-[10px] text-ink-500 mt-2">
      <span class="inline-block w-3 h-3 bg-sky-100 border border-sky-400 align-middle"></span> try ·
      <span class="inline-block w-3 h-3 bg-rose-100 border border-rose-400 align-middle"></span> fail ·
      <span class="inline-block w-3 h-3 bg-emerald-100 border border-emerald-500 align-middle"></span> solution
    </div>
  </div>

  <div class="text-xs text-ink-500">
    Toggle <b>None / FC / MAC</b> and <b>d-way / 2-way</b> and watch the tree shrink/grow. MAC after each decision often kills entire subtrees that FC alone misses (because MAC propagates beyond directly-affected neighbours).
  </div>
</div>
