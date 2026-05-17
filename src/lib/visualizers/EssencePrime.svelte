<script lang="ts">
  interface Model {
    name: string;
    description: string;
    source: string;
    solution?: string;
    notes?: string;
  }

  const MODELS: Model[] = [
    {
      name: 'N-Queens (3-allDiff idiom)',
      description: 'Row-viewpoint: x[i] = column of queen in row i. The "no two same row" constraint is built in by construction.',
      source: `language ESSENCE' 1.0

letting n be 8
letting dom be domain int(1..n)

find x : matrix indexed by [ dom ] of dom

such that
    allDiff(x),                            $ different columns
    allDiff([x[i] + i | i : dom]),         $ different / diagonals
    allDiff([x[i] - i | i : dom])          $ different \\ diagonals
`,
      solution: 'For n=8, e.g. x = [4, 6, 8, 2, 7, 1, 3, 5] (one of 92 solutions).',
      notes: 'The classic 3-allDiff encoding for n-queens. Row-per-queen viewpoint makes "different row" implicit. Diagonal differences become AllDifferent of transformed values.'
    },
    {
      name: 'Sudoku',
      description: 'Standard 9×9 with given clues. AllDiff on rows, columns, and 3×3 boxes.',
      source: `language ESSENCE' 1.0
letting range be domain int(1..9)
given clues : matrix indexed by [range, range] of int(0..9)
find  M     : matrix indexed by [range, range] of range
such that
    forAll row : range . allDiff(M[row, ..]),
    forAll col : range . allDiff(M[.., col]),
    forAll i, j : int(1, 4, 7) .
        allDiff([ M[k, l] | k : int(i..i+2), l : int(j..j+2) ]),
    forAll r, c : range . (clues[r, c] != 0) -> (M[r, c] = clues[r, c])
`,
      notes: 'Two viewpoints exist: cell-value (this one) and (cell, value)-Boolean. The cell-value viewpoint pairs naturally with allDiff. The 3×3 box constraint uses int(1, 4, 7) to enumerate top-left corners.'
    },
    {
      name: 'Map colouring (Western Europe)',
      description: 'Adjacent countries differ in colour. Symmetry breaking forces colour 1 on Belgium.',
      source: `language ESSENCE' 1.0

letting n         be 6
letting numColors be 4

letting Belgium be 1, Denmark be 2, France be 3,
        Germany be 4, Netherlands be 5, Luxembourg be 6

find color : matrix indexed by [int(1..n)] of int(1..numColors)

such that
    color[France]     != color[Belgium],
    color[France]     != color[Luxembourg],
    color[France]     != color[Germany],
    color[Luxembourg] != color[Germany],
    color[Luxembourg] != color[Belgium],
    color[Belgium]    != color[Netherlands],
    color[Belgium]    != color[Germany],
    color[Germany]    != color[Netherlands],
    color[Germany]    != color[Denmark],

    $ value-symmetry breaking
    color[Belgium] = 1
`,
      notes: 'The line `color[Belgium] = 1` breaks value symmetry — without it, every solution has 4! = 24 colour-renaming equivalents.'
    },
    {
      name: 'All-Interval Series',
      description: 'Permutation 1..n where consecutive-difference absolute values form a permutation of 1..n-1.',
      source: `language ESSENCE' 1.0

letting n      be 12
letting range  be domain int(1..n)
letting range2 be domain int(1..n-1)

find x     : matrix indexed by [range]  of range
find diffs : matrix indexed by [range2] of range2

such that
    allDiff(diffs),
    allDiff(x),
    forall k : range2 . diffs[k] = |x[k+1] - x[k]|,

    $ symmetry breaking
    x[1] < x[n-1],
    diffs[1] < diffs[2]
`,
      notes: 'CSPLib problem 7. Two allDiff constraints — one on positions, one on differences. Symmetry breaks on the first and last positions and the first two differences.'
    },
    {
      name: 'Set partition (sets-as-occurrence encoding)',
      description: 'Partition 1..16 into two equal-sum, equal-sum-of-squares sets — using a part-ID array because Essence Prime has no set type.',
      source: `language ESSENCE' 1.0
letting n        be 16
letting num_sets be 2

$ Essence' has no set type; encode membership as a[j] = i (element j in set i).
find a            : matrix indexed by [int(1..n)] of int(1..num_sets)
find sums         : matrix indexed by [int(1..num_sets)] of int(0..n*n)
find sums_squared : matrix indexed by [int(1..num_sets)] of int(0..n*n*n*n)

such that
    forall i : int(1..num_sets) .
        sums[i] = (sum j : int(1..n) . j * (a[j] = i)) /\\
        sums_squared[i] = (sum j : int(1..n) . j**2 * (a[j] = i)),

    forall i : int(2..num_sets) .
        (sum j : int(1..n) . a[j] = i-1) = (sum j : int(1..n) . a[j] = i) /\\
        sums[i-1]         = sums[i] /\\
        sums_squared[i-1] = sums_squared[i],

    $ symmetry breaking
    a[1] = 1
`,
      notes: 'Famous illustration of "Essence Prime has no set type" — sets get simulated by integer arrays. The objective constraints replicate the partition property; `a[1] = 1` breaks value-symmetry between the two sets.'
    },
    {
      name: 'SEND + MORE = MONEY',
      description: 'Classic cryptarithmetic puzzle.',
      source: `language ESSENCE' 1.0

letting LETTERS be domain int(0..9)
find S, E, N, D, M, O, R, Y : LETTERS

such that
    allDiff([S, E, N, D, M, O, R, Y]),
    S != 0,
    M != 0,
                S*1000 + E*100 + N*10 + D
    +           M*1000 + O*100 + R*10 + E
    = M*10000 + O*1000 + N*100 + E*10 + Y
`,
      solution: 'S=9, E=5, N=6, D=7, M=1, O=0, R=8, Y=2. SEND (9567) + MORE (1085) = MONEY (10652).',
      notes: 'The arithmetic constraint involves all 8 letters → naturally global. allDiff over all letters guarantees distinct digits.'
    },
    {
      name: 'Graph k-colouring (generic)',
      description: 'Parameterised graph k-colouring.',
      source: `language ESSENCE' 1.0

given n      : int(1..)               $ number of vertices
given k      : int(1..)               $ number of colours
given edges  : matrix indexed by [int(1..), int(1..2)] of int(1..n)

find color   : matrix indexed by [int(1..n)] of int(1..k)

such that
    forAll e : int(1..|edges,1|) .
        color[edges[e,1]] != color[edges[e,2]]
`,
      notes: 'Parameters in a `.param` file specify the actual graph. The `|edges,1|` syntax gets the size of the first index.'
    },
  ];

  let selectedIdx = $state(0);
  let editor = $state(MODELS[0].source);
  $effect(() => { editor = MODELS[selectedIdx].source; });

  // light syntax-colour using regex-based highlight
  const keywords = ['language', 'given', 'letting', 'where', 'find', 'such', 'that', 'minimising', 'maximising', 'forAll', 'forall', 'exists', 'sum', 'product', 'min', 'max', 'and', 'or', 'be', 'of', 'in', 'matrix', 'indexed', 'by', 'int', 'bool', 'domain', 'allDiff', 'gcc', 'atleast', 'atmost', 'table', 'cumulative', 'toInt', 'flatten', 'true', 'false'];
  const ESSENCE_KEYWORDS = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');

  function highlight(src: string): string {
    let s = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\$([^\n]*)/g, '<span class="text-emerald-600 dark:text-emerald-400">$$$1</span>');
    s = s.replace(/\b(\d+)\b/g, '<span class="text-rose-600 dark:text-rose-400">$1</span>');
    s = s.replace(ESSENCE_KEYWORDS, '<span class="text-violet-700 dark:text-violet-300 font-semibold">$1</span>');
    s = s.replace(/(->|<-|<->|<=|>=|!=|<lex|<=lex|>=lex|\\\/|\/\\)/g, '<span class="text-amber-700 dark:text-amber-400">$1</span>');
    return s;
  }
</script>

<div class="space-y-3">
  <div class="flex flex-wrap gap-2">
    {#each MODELS as m, i}
      <button class="btn btn-sm {selectedIdx === i ? 'btn-primary' : ''}" onclick={() => (selectedIdx = i)}>{m.name}</button>
    {/each}
  </div>
  <div class="text-sm text-ink-600 dark:text-ink-300">{MODELS[selectedIdx].description}</div>

  <div class="grid lg:grid-cols-2 gap-3">
    <div>
      <div class="text-xs font-semibold mb-1 text-ink-500 uppercase tracking-wider">Source — edit freely</div>
      <textarea
        class="w-full font-mono text-xs p-3 rounded border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 min-h-[360px]"
        bind:value={editor}
        spellcheck="false"
      ></textarea>
    </div>
    <div>
      <div class="text-xs font-semibold mb-1 text-ink-500 uppercase tracking-wider">Highlighted</div>
      <pre class="!my-0 !text-xs min-h-[360px] overflow-auto">{@html highlight(editor)}</pre>
    </div>
  </div>

  {#if MODELS[selectedIdx].solution}
    <div class="keyfact"><span class="keyfact-title">Solution</span> — {MODELS[selectedIdx].solution}</div>
  {/if}
  {#if MODELS[selectedIdx].notes}
    <div class="nightingale"><span class="nightingale-title">Notes</span> — {MODELS[selectedIdx].notes}</div>
  {/if}

  <div class="text-xs text-ink-500">
    Models adapted from the Savile Row manual (Nightingale, arXiv:2201.03472) and Hakan Kjellerstrand's Essence' library. The editor is for syntax practice — a full solver is not embedded.
  </div>
</div>
