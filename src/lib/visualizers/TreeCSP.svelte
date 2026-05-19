<script lang="ts">
  import MathText from '../components/MathText.svelte';
  // Directional arc consistency on a tree-structured CSP. O(nd²) solver.

  let spec = $state(`X1 = 1, 2, 3
X2 = 1, 2, 3
X3 = 1, 2, 3
X4 = 1, 2, 3
X5 = 1, 2, 3
constraints: X1<X2, X2<X3, X1<X4, X4<X5`);

  function parse(s: string): { vars: string[]; D: Record<string, number[]>; constraints: { a: string; b: string; op: string }[] } {
    const vars: string[] = [];
    const D: Record<string, number[]> = {};
    const constraints: { a: string; b: string; op: string }[] = [];
    for (const line of s.split('\n').map((l) => l.trim()).filter(Boolean)) {
      if (line.startsWith('constraints:')) {
        const cs = line.slice(12).split(',').map((c) => c.trim()).filter(Boolean);
        for (const c of cs) {
          const m = c.match(/^(\w+)\s*(<|<=|>|>=|=|!=)\s*(\w+)$/);
          if (m) constraints.push({ a: m[1], op: m[2], b: m[3] });
        }
      } else {
        const m = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (m) {
          vars.push(m[1]);
          D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean).map(Number);
        }
      }
    }
    return { vars, D, constraints };
  }

  function evalOp(va: number, op: string, vb: number): boolean {
    if (op === '<') return va < vb;
    if (op === '<=') return va <= vb;
    if (op === '>') return va > vb;
    if (op === '>=') return va >= vb;
    if (op === '=') return va === vb;
    if (op === '!=') return va !== vb;
    return true;
  }

  function isTree(vars: string[], constraints: { a: string; b: string }[]): boolean {
    if (constraints.length !== vars.length - 1) return false;
    const adj = new Map<string, Set<string>>();
    for (const v of vars) adj.set(v, new Set());
    for (const c of constraints) {
      adj.get(c.a)?.add(c.b);
      adj.get(c.b)?.add(c.a);
    }
    const seen = new Set<string>();
    const stack = [vars[0]];
    while (stack.length) {
      const n = stack.pop()!;
      if (seen.has(n)) continue;
      seen.add(n);
      for (const m of adj.get(n) ?? []) if (!seen.has(m)) stack.push(m);
    }
    return seen.size === vars.length;
  }

  interface Step {
    msg: string;
    D: Record<string, number[]>;
    assignment: Record<string, number>;
    phase: 'init' | 'consistency' | 'assignment' | 'done';
  }

  function solve(): Step[] {
    const { vars, D: D0, constraints } = parse(spec);
    if (!isTree(vars, constraints)) {
      return [{ msg: `Not a tree CSP! ${constraints.length} constraints, ${vars.length - 1} expected.`, D: D0, assignment: {}, phase: 'init' }];
    }
    const D = JSON.parse(JSON.stringify(D0));
    const steps: Step[] = [];
    steps.push({ msg: 'Choose root: X1. Order vars BFS from root.', D: JSON.parse(JSON.stringify(D)), assignment: {}, phase: 'init' });

    // Compute parent map by BFS from vars[0]
    const adj = new Map<string, { other: string; constraint: { a: string; b: string; op: string } }[]>();
    for (const v of vars) adj.set(v, []);
    for (const c of constraints) {
      adj.get(c.a)?.push({ other: c.b, constraint: c });
      adj.get(c.b)?.push({ other: c.a, constraint: c });
    }
    const parent: Record<string, { p: string; constraint: { a: string; b: string; op: string } } | null> = { [vars[0]]: null };
    const order: string[] = [vars[0]];
    const queue: string[] = [vars[0]];
    const seen = new Set([vars[0]]);
    while (queue.length) {
      const n = queue.shift()!;
      for (const { other, constraint } of adj.get(n) ?? []) {
        if (!seen.has(other)) {
          seen.add(other);
          parent[other] = { p: n, constraint };
          order.push(other);
          queue.push(other);
        }
      }
    }

    steps.push({ msg: `Variable order from root: ${order.join(' → ')}.`, D: JSON.parse(JSON.stringify(D)), assignment: {}, phase: 'init' });

    // Backward pass: from leaves to root, for each non-root var Xi, make parent(Xi) arc-consistent with Xi
    for (let i = order.length - 1; i > 0; i--) {
      const child = order[i];
      const p = parent[child]!;
      const constraint = p.constraint;
      // Make parent arc-consistent with child
      const beforeParent = [...D[p.p]];
      D[p.p] = D[p.p].filter((v) => {
        return D[child].some((w) => {
          if (constraint.a === p.p) return evalOp(v, constraint.op, w);
          return evalOp(w, constraint.op, v);
        });
      });
      const removed = beforeParent.filter((v) => !D[p.p].includes(v));
      steps.push({
        msg: `REVISE(${p.p}, ${child}) on ${constraint.a} ${constraint.op} ${constraint.b}: D(${p.p}) was {${beforeParent.join(',')}}; ${removed.length ? `remove {${removed.join(',')}}` : 'no change'}. Now D(${p.p}) = {${D[p.p].join(',')}}.`,
        D: JSON.parse(JSON.stringify(D)),
        assignment: {},
        phase: 'consistency',
      });
      if (D[p.p].length === 0) {
        steps.push({ msg: `D(${p.p}) empty → CSP infeasible.`, D: JSON.parse(JSON.stringify(D)), assignment: {}, phase: 'done' });
        return steps;
      }
    }

    steps.push({ msg: 'Backward pass complete. CSP is now arc-consistent — guaranteed conflict-free assignment.', D: JSON.parse(JSON.stringify(D)), assignment: {}, phase: 'consistency' });

    // Forward pass: assign root-to-leaf
    const assignment: Record<string, number> = {};
    for (const v of order) {
      if (v === vars[0]) {
        assignment[v] = D[v][0];   // pick any value
      } else {
        const p = parent[v]!;
        const c = p.constraint;
        const val = D[v].find((w) => {
          if (c.a === p.p) return evalOp(assignment[p.p], c.op, w);
          return evalOp(w, c.op, assignment[p.p]);
        });
        assignment[v] = val ?? D[v][0];
      }
      steps.push({
        msg: `Assign ${v} = ${assignment[v]} (pick consistent value from D(${v}) = {${D[v].join(',')}}).`,
        D: JSON.parse(JSON.stringify(D)),
        assignment: { ...assignment },
        phase: 'assignment',
      });
    }

    steps.push({ msg: `✓ Solution found in O(nd²) time: ${Object.entries(assignment).map(([k, v]) => `${k}=${v}`).join(', ')}.`, D: JSON.parse(JSON.stringify(D)), assignment, phase: 'done' });

    return steps;
  }

  const steps = $derived.by(() => solve());
  let stepIdx = $state(0);
  $effect(() => { steps; stepIdx = 0; });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">Tree-structured CSP — variables, then <code>constraints:</code> line with comma-separated binary constraints (ops: &lt;, &lt;=, &gt;, &gt;=, =, !=)</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="7" bind:value={spec}></textarea>
  </label>

  <div class="flex gap-2 flex-wrap text-xs">
    Try:
    <button class="btn btn-sm" onclick={() => (spec = 'X1 = 1, 2, 3\nX2 = 1, 2, 3\nX3 = 1, 2, 3\nX4 = 1, 2, 3\nX5 = 1, 2, 3\nconstraints: X1<X2, X2<X3, X1<X4, X4<X5')}>Path tree (5 nodes)</button>
    <button class="btn btn-sm" onclick={() => (spec = 'A = 1, 2, 3\nB = 1, 2, 3\nC = 1, 2, 3\nD = 1, 2, 3\nconstraints: A!=B, B!=C, B!=D')}>Star (3 leaves)</button>
  </div>

  <div class="flex gap-2 items-center">
    <button class="btn btn-sm" onclick={() => (stepIdx = Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}>⏮</button>
    <button class="btn btn-sm btn-primary" onclick={() => (stepIdx = Math.min(steps.length - 1, stepIdx + 1))} disabled={stepIdx >= steps.length - 1}>⏭</button>
    <button class="btn btn-sm" onclick={() => (stepIdx = steps.length - 1)}>End</button>
    <span class="text-xs text-ink-500 ml-auto">step {stepIdx + 1}/{steps.length}</span>
  </div>

  {#if steps[stepIdx]}
    {@const cur = steps[stepIdx]}
    <div class="card !p-3">
      <div class="text-sm font-medium"><MathText src={cur.msg} /></div>
      <div class="text-xs uppercase tracking-wider text-ink-500 font-semibold mt-3 mb-1">Domains</div>
      <div class="font-mono text-xs space-y-0.5">
        {#each Object.keys(cur.D) as v}
          <div>
            <span class="text-ink-500">D({v})</span> = {cur.D[v].length === 0 ? '∅' : '{' + cur.D[v].join(',') + '}'}
            {#if cur.assignment[v] !== undefined}<span class="ml-2 font-bold text-emerald-700 dark:text-emerald-300">= {cur.assignment[v]}</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="text-xs text-ink-500">
    <b>Tree-CSP algorithm (O(nd²)).</b> Choose a root. (1) <b>Backward pass:</b> from leaves to root, make each parent arc-consistent with its child via REVISE. (2) <b>Forward pass:</b> assign root → leaf, picking any consistent value at each step. The first pass guarantees the second never backtracks.
  </div>
</div>
