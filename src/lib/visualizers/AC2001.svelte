<script lang="ts">
  import MathText from '../components/MathText.svelte';
  import ExamAnswer from '../components/ExamAnswer.svelte';

  // AC-2001 / AC-3.1 (Zhang & Yap, 2001 / Bessière & Régin 2001).
  // Same skeleton as AC-3 but uses a Last[(X_i, v), X_j] data structure:
  // for each arc (X_i, X_j) and each v ∈ D(X_i), Last stores the last value
  // in D(X_j) that supported v. Next time REVISE runs, search starts from
  // Last (not from the beginning of D(X_j)) — that's the O(c·d^2) improvement.

  let { initialSpec = '' } = $props<{ initialSpec?: string }>();

  type Val = number;
  type Domain = Record<string, Val[]>;
  interface UnaryC { v: string; src: string; pred: (x: Val) => boolean }
  interface BinaryC { a: string; b: string; src: string; pred: (x: Val, y: Val) => boolean }
  interface CSP { vars: string[]; D: Domain; U: UnaryC[]; B: BinaryC[] }

  let spec = $state(initialSpec || `# Factory scheduling — AC2001 worked example
# Variables: start times s1..s4 (hours)
s1 = 1, 2, 3, 4
s2 = 1, 2, 3, 4
s3 = 1, 2, 3
s4 = 1, 2, 3
binary:
# m1: s1, s2 different (both 1-hour)
s1 != s2
# m2: pairwise non-overlap. s2 (1hr) vs s3 (2hr): s2 >= s3+2 or s3 >= s2+1
abs(s2 - s3) >= 2
# s2 (1hr) vs s4 (2hr): same shape
abs(s2 - s4) >= 2
# s3 (2hr) vs s4 (2hr): |s3 - s4| >= 2
abs(s3 - s4) >= 2`);

  function compile(body: string, args: string[]) {
    let b = body.replace(/\babs\b/g, 'Math.abs');
    b = b.replace(/([^=!<>])=([^=])/g, '$1==$2');
    try { return new Function(args.join(','), `try{return Boolean(${b})}catch(e){return false}`) as any; }
    catch (e) { return () => false; }
  }
  function parseCSP(spec: string): CSP {
    const vars: string[] = [];
    const D: Domain = {}; const U: UnaryC[] = []; const B: BinaryC[] = [];
    let mode: 'vars' | 'unary' | 'binary' = 'vars';
    for (const raw of spec.split('\n')) {
      const line = raw.split('#')[0].trim();
      if (!line) continue;
      const lc = line.toLowerCase();
      if (lc === 'unary:') { mode = 'unary'; continue; }
      if (lc === 'binary:') { mode = 'binary'; continue; }
      if (mode === 'vars') {
        const m = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
        if (m) {
          vars.push(m[1]);
          D[m[1]] = m[2].split(/[,\s]+/).filter(Boolean).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
        }
      } else if (mode === 'unary') {
        const m = line.match(/^([A-Za-z_]\w*)\s*(.+)$/);
        if (!m) continue;
        const v = m[1]; const fn = compile(`${v} ${m[2]}`, [v]);
        U.push({ v, src: line, pred: (x) => fn(x) });
      } else {
        const idents = [...new Set(line.match(/\b[A-Za-z_]\w*\b/g) ?? [])].filter((w) => !['abs', 'min', 'max', 'true', 'false', 'and', 'or', 'not'].includes(w));
        if (idents.length !== 2) continue;
        const [a, b] = idents;
        const fn = compile(line, [a, b]);
        B.push({ a, b, src: line, pred: (x, y) => fn(x, y) });
        B.push({ a: b, b: a, src: line + ' (rev)', pred: (y, x) => fn(x, y) });
      }
    }
    return { vars, D, U, B };
  }

  // Last[arcKey][v] = the last value in D(arc.b) found as support for v.
  type Last = Record<string, Record<number, number | null>>;
  function arcKey(a: string, b: string) { return `${a}->${b}`; }

  interface Step {
    phase: 'init' | 'ac' | 'done' | 'fail';
    queue: { a: string; b: string }[];
    D: Domain;
    last: Last;
    msg: string;
    arc?: { a: string; b: string };
    removed?: { var: string; val: Val };
    lastUpdate?: { arc: string; v: number; from: number | null; to: number | null };
    arcRevCount: Record<string, number>;
    supportChecks: number;            // total support checks done so far
  }

  const parsed = $derived.by(() => parseCSP(spec));

  function run(csp: CSP): Step[] {
    const steps: Step[] = [];
    const D: Domain = JSON.parse(JSON.stringify(csp.D));
    const last: Last = {};
    const arcRev: Record<string, number> = {};
    let supportChecks = 0;

    // Initialise Last[(a,b)][v] = null for each arc and each value in D(a)
    for (const c of csp.B) {
      const k = arcKey(c.a, c.b);
      last[k] = {};
      for (const v of D[c.a]) last[k][v] = null;
      arcRev[k] = 0;
    }
    steps.push({ phase: 'init', queue: [], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `Initialise Last[(X_i, v), X_j] = null for every arc + every value.`, arcRevCount: { ...arcRev }, supportChecks });

    const queue: { a: string; b: string }[] = csp.B.map((c) => ({ a: c.a, b: c.b }));
    steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `Queue all ${queue.length} arcs.`, arcRevCount: { ...arcRev }, supportChecks });

    while (queue.length) {
      const arc = queue.shift()!;
      const k = arcKey(arc.a, arc.b);
      arcRev[k] = (arcRev[k] ?? 0) + 1;
      steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `Pop arc (${arc.a}, ${arc.b}) — revision #${arcRev[k]}.`, arc, arcRevCount: { ...arcRev }, supportChecks });

      const constraint = csp.B.find((c) => c.a === arc.a && c.b === arc.b);
      if (!constraint) continue;
      const newD: Val[] = [];
      let domainChanged = false;
      for (const v of D[arc.a]) {
        // Look up where to resume the search for a support
        const resumeFrom = last[k][v];
        const idxStart = resumeFrom !== null ? D[arc.b].indexOf(resumeFrom) : -1;
        // First, if resumeFrom is still in D(arc.b) AND still supports v, no recheck needed.
        let foundSupport: number | null = null;
        if (resumeFrom !== null && D[arc.b].includes(resumeFrom) && constraint.pred(v, resumeFrom)) {
          foundSupport = resumeFrom;
        } else {
          // Otherwise: scan D(arc.b) from index idxStart+1 onwards (or from start if idxStart<0)
          for (let i = Math.max(0, idxStart + 1); i < D[arc.b].length; i++) {
            supportChecks++;
            const w = D[arc.b][i];
            if (constraint.pred(v, w)) { foundSupport = w; break; }
          }
        }
        if (foundSupport !== null) {
          newD.push(v);
          const prev = last[k][v];
          if (foundSupport !== prev) {
            last[k][v] = foundSupport;
            steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `Last[(${arc.a}, ${v}), ${arc.b}] ← ${foundSupport} (was ${prev}).`, arc, lastUpdate: { arc: k, v, from: prev, to: foundSupport }, arcRevCount: { ...arcRev }, supportChecks });
          }
        } else {
          domainChanged = true;
          // remove
          steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `No support in D(${arc.b}) for ${arc.a}=${v} (started from Last = ${resumeFrom ?? '∅'}). Remove ${v} from D(${arc.a}).`, arc, removed: { var: arc.a, val: v }, arcRevCount: { ...arcRev }, supportChecks });
        }
      }
      if (domainChanged) {
        D[arc.a] = newD;
        // Also: clean up Last entries pointing to removed values when used as supports
        if (D[arc.a].length === 0) {
          steps.push({ phase: 'fail', queue: [], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `D(${arc.a}) is empty — infeasibility.`, arcRevCount: { ...arcRev }, supportChecks });
          return steps;
        }
        // Re-enqueue incoming arcs (X_k, arc.a) for k ≠ arc.b
        const nbrs = csp.B.filter((c) => c.b === arc.a && c.a !== arc.b).map((c) => ({ a: c.a, b: c.b }));
        let added = 0;
        for (const nb of nbrs) {
          if (!queue.some((q) => q.a === nb.a && q.b === nb.b)) { queue.push(nb); added++; }
        }
        steps.push({ phase: 'ac', queue: [...queue], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `D(${arc.a}) shrunk — re-enqueue ${added} incoming arc${added === 1 ? '' : 's'} (X_k, ${arc.a}).`, arcRevCount: { ...arcRev }, supportChecks });
      }
    }
    steps.push({ phase: 'done', queue: [], D: JSON.parse(JSON.stringify(D)), last: JSON.parse(JSON.stringify(last)), msg: `Arc-consistent. Total revisions = ${Object.values(arcRev).reduce((a,b)=>a+b,0)}; total support checks = ${supportChecks}.`, arcRevCount: { ...arcRev }, supportChecks });
    return steps;
  }

  let steps = $state<Step[]>([]);
  let idx = $state(0);
  $effect(() => { spec; steps = run(parsed); idx = 0; });

  const cur = $derived(steps[idx]);
  const allArcs = $derived(parsed.B.map((c) => arcKey(c.a, c.b)));

  function valueAt(arcK: string, v: number): string {
    const e = cur?.last[arcK];
    if (!e || e[v] === undefined) return '—';
    return e[v] === null ? 'null' : String(e[v]);
  }

  const examAnswer = $derived.by(() => {
    const lines: string[] = [];
    lines.push(`**Setup.**`);
    lines.push(`- Variables: ${parsed.vars.join(', ')}.`);
    lines.push(`- Initial domains: ${parsed.vars.map((v) => `D(${v}) = {${parsed.D[v].join(', ')}}`).join('; ')}.`);
    const seen = new Set<string>();
    const binShown: string[] = [];
    for (const c of parsed.B) { if (seen.has(c.src.replace(' (rev)', ''))) continue; binShown.push('`' + c.src + '`'); seen.add(c.src); }
    lines.push(`- Binary constraints: ${binShown.join(', ')}.`);
    lines.push('');
    lines.push(`**Algorithm.** AC-2001 / AC-3.1 — uses a Last[(X_i, v), X_j] data structure: the **last value** in D(X_j) that supported the value v of X_i. Re-revisions never re-check supports below this index.`);
    lines.push('');
    lines.push('**Trace.**');
    lines.push('');
    lines.push('| # | Action | Last update | Domains after |');
    lines.push('|---|---|---|---|');
    steps.forEach((s, i) => {
      if (s.phase === 'init') return;
      const dom = parsed.vars.map((v) => `D(${v})={${s.D[v]?.join(',') ?? ''}}`).join('; ');
      const lu = s.lastUpdate ? `Last[(${s.lastUpdate.arc.replace('->', ',')}, ${s.lastUpdate.v})] = ${s.lastUpdate.to}` : (s.removed ? `(value removed)` : '—');
      lines.push(`| ${i} | ${s.msg.replace(/\|/g, '\\|')} | ${lu} | ${dom} |`);
    });
    lines.push('');
    const final = steps[steps.length - 1];
    if (final?.phase === 'fail') {
      lines.push(`**Outcome.** Infeasibility detected.`);
    } else if (final) {
      lines.push(`**Final domains.** ${parsed.vars.map((v) => `D(${v}) = {${final.D[v].join(', ')}}`).join('; ')}.`);
      lines.push('');
      lines.push(`**Final Last table.**`);
      lines.push('');
      lines.push('| Arc | v | Last |');
      lines.push('|---|---|---|');
      for (const k of allArcs) {
        const e = final.last[k];
        if (!e) continue;
        for (const v of Object.keys(e)) {
          lines.push(`| ${k.replace('->', '→')} | ${v} | ${e[Number(v)] === null ? 'null' : e[Number(v)]} |`);
        }
      }
      lines.push('');
      lines.push(`**Efficiency.** Total support checks = ${final.supportChecks}. AC-3 would re-check from the start each time; AC-2001's Last pointer ensures every (variable, value, neighbour) triple performs at most $|D|$ support checks across all revisions — that's the $O(c \\cdot d^2)$ complexity.`);
    }
    return lines.join('\n');
  });
</script>

<div class="space-y-3">
  <label class="block">
    <span class="text-xs text-ink-500 block mb-1">CSP spec — same format as AC-3 / CSPLab.</span>
    <textarea class="w-full font-mono text-xs p-2 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900" rows="12" bind:value={spec}></textarea>
  </label>

  <div class="flex flex-wrap gap-2 items-center">
    <button class="btn btn-sm" onclick={() => (idx = Math.max(0, idx - 1))} disabled={idx === 0}>⏮ Prev</button>
    <button class="btn btn-sm btn-primary" onclick={() => (idx = Math.min(steps.length - 1, idx + 1))} disabled={idx >= steps.length - 1}>Next ⏭</button>
    <button class="btn btn-sm" onclick={() => (idx = steps.length - 1)}>End</button>
    <button class="btn btn-sm" onclick={() => (idx = 0)}>Reset</button>
    <span class="text-xs text-ink-500 ml-auto">step {idx + 1}/{steps.length} · phase {cur?.phase} · checks {cur?.supportChecks ?? 0}</span>
  </div>

  <div class="text-sm font-medium"><MathText src={cur?.msg ?? ''} /></div>

  <div class="grid sm:grid-cols-2 gap-4">
    <div>
      <h4 class="text-sm font-semibold mb-2">Domains</h4>
      <div class="card !p-2 text-xs font-mono space-y-1">
        {#each parsed.vars as v}
          <div><b>{v}</b>: {'{' + (cur?.D[v]?.join(', ') ?? '') + '}'}</div>
        {/each}
      </div>

      <h4 class="text-sm font-semibold mt-3 mb-2">Arc queue ({cur?.queue.length ?? 0})</h4>
      <div class="card !p-2 text-xs font-mono max-h-32 overflow-y-auto">
        {#each cur?.queue ?? [] as q, i}
          <div class="px-1 py-0.5 {i === 0 ? 'bg-accent-100 dark:bg-accent-900/30 rounded' : ''}">({q.a}, {q.b})</div>
        {/each}
        {#if (cur?.queue.length ?? 0) === 0}<div class="text-ink-500 italic">empty</div>{/if}
      </div>
    </div>

    <div>
      <h4 class="text-sm font-semibold mb-2">Last table — Last[(X_i, v), X_j]</h4>
      <div class="card !p-2 text-xs font-mono max-h-[360px] overflow-y-auto">
        <table class="w-full">
          <thead><tr class="text-ink-500 text-left"><th>arc</th><th>v</th><th>Last</th></tr></thead>
          <tbody>
            {#each allArcs as k}
              {@const entries = Object.entries(cur?.last[k] ?? {})}
              {#each entries as [v, lastVal]}
                <tr class={cur?.lastUpdate?.arc === k && Number(cur?.lastUpdate?.v) === Number(v) ? 'bg-amber-100 dark:bg-amber-900/30' : ''}>
                  <td>{k.replace('->', '→')}</td>
                  <td>{v}</td>
                  <td>{lastVal === null ? 'null' : lastVal}</td>
                </tr>
              {/each}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="card !p-3">
    <h4 class="text-sm font-semibold mb-1">Arc revision counts</h4>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] font-mono">
      {#each Object.entries(cur?.arcRevCount ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number)) as [k, n]}
        <div class="px-1 {Number(n) > 1 ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-ink-500'}">{k.replace('->', '→')}: {n}</div>
      {/each}
    </div>
  </div>

  <ExamAnswer answer={examAnswer} summary={`AC-2001 · checks ${cur?.supportChecks ?? 0} · phase ${cur?.phase}`} />
</div>
