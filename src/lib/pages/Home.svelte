<script lang="ts">
  import { modules, allFlashcards } from '../content';
  import { href } from '../router';
</script>

<article class="prose max-w-none">
  <div class="text-sm text-ink-500">University of York · Department of Computer Science</div>
  <h1>Theo's online revision sheets</h1>
  <p class="text-lg text-ink-600 dark:text-ink-300">
    No generative AI exists on this site, just interactive visualisations I built,
    as well as revision notes. <span class="text-2xl">:)</span>
  </p>
  <p class="text-sm text-ink-500 mt-2">
    Covering <b>COM00050H — AI Problem Solving with Search and Logic</b>.
  </p>

  <div class="not-prose grid sm:grid-cols-2 gap-4 my-8">
    <a href={href('/solve')} class="card hover:border-accent-400 no-underline block !border-accent-300 dark:!border-accent-700 !bg-accent-50/40 dark:!bg-accent-900/10">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">🎯 Question router</div>
      <div class="font-semibold mt-1">Identify the algorithm</div>
      <div class="text-sm text-ink-500 mt-1">Paste a question — get the algorithm, intent, structured extraction, and a topic playbook. No AI; fully explainable.</div>
    </a>
    <a href={href('/ask')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">🔮 Smart search</div>
      <div class="font-semibold mt-1">Ask anything</div>
      <div class="text-sm text-ink-500 mt-1">Synonyms, intent detection, operators, regex. Top answers across all content.</div>
    </a>
    <a href={href('/visualizers')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Explore</div>
      <div class="font-semibold mt-1">All visualisers</div>
      <div class="text-sm text-ink-500 mt-1">A*, αβ, MCTS, AC-3, DPLL, CDCL, WALKSAT, …</div>
    </a>
    <a href={href('/flashcards')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Revise</div>
      <div class="font-semibold mt-1">Flashcards ({allFlashcards.length})</div>
      <div class="text-sm text-ink-500 mt-1">Spaced repetition, progress saved locally</div>
    </a>
    <a href={href('/cheatsheet')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Cram</div>
      <div class="font-semibold mt-1">Cheatsheets</div>
      <div class="text-sm text-ink-500 mt-1">One dense page per module, printable</div>
    </a>
    <a href={href('/pitfalls')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Avoid</div>
      <div class="font-semibold mt-1">Examiner pitfalls</div>
      <div class="text-sm text-ink-500 mt-1">18 mark-losing traps with York/Nightingale focus</div>
    </a>
    <a href={href('/mock-exam')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">📝 Practice</div>
      <div class="font-semibold mt-1">Mock exam</div>
      <div class="text-sm text-ink-500 mt-1">Timed random selection from the question bank with self-grading</div>
    </a>
    <a href={href('/pseudocode')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Reference</div>
      <div class="font-semibold mt-1">Pseudocode</div>
      <div class="text-sm text-ink-500 mt-1">Canonical pseudocode for every algorithm — printable</div>
    </a>
    <a href={href('/proofs')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">Reference</div>
      <div class="font-semibold mt-1">Proofs archive</div>
      <div class="text-sm text-ink-500 mt-1">A* optimality, AC-3 complexity, alpha-beta best case, 2-SAT polytime, …</div>
    </a>
    <a href={href('/concept-map')} class="card hover:border-accent-400 no-underline block">
      <div class="text-xs uppercase tracking-wider text-accent-600 font-semibold">🗺 Overview</div>
      <div class="font-semibold mt-1">Concept map</div>
      <div class="text-sm text-ink-500 mt-1">Visual graph of all algorithms and how they relate</div>
    </a>
  </div>

  <h2>Modules</h2>
  <div class="not-prose space-y-4">
    {#each modules as m, i}
      <div class="card">
        <div class="flex items-baseline gap-3">
          <span class="text-2xl font-bold text-ink-300 dark:text-ink-700 tabular-nums">0{i + 1}</span>
          <div class="flex-1">
            <a href={href('/topic/' + m.topics[0].slug)} class="font-semibold text-lg no-underline text-ink-900 dark:text-ink-100 hover:text-accent-600">{m.title}</a>
            <div class="text-sm text-ink-500 mt-1">{m.oneLiner}</div>
            <div class="mt-3 flex flex-wrap gap-2">
              {#each m.topics as t}
                <a class="chip hover:bg-accent-100 dark:hover:bg-accent-900/40" href={href('/topic/' + t.slug)}>{t.title}</a>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <h2>How to use this site</h2>
  <ul>
    <li><b>Search</b> with <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-xs">Ctrl+K</kbd> or <kbd class="px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-xs">/</kbd> — fuzzy or regex (toggle inside the palette).</li>
    <li><b>Step through any algorithm</b> in the visualisers. Hit ▶ to autoplay, or use ⏮ / ⏭ to walk by hand.</li>
    <li><b>What-if cards</b> in each section flip a single parameter so you can see the effect immediately.</li>
    <li><b>Examiner pitfalls</b> are flagged inline (orange) and York/Nightingale notes are flagged in rose.</li>
    <li><b>Flashcards</b> use SM-2 spaced repetition; sessions persist in localStorage.</li>
  </ul>

  <h2>About the source</h2>
  <p>
    Content is based on AIMA (Russell & Norvig, 4e), the
    <a href="https://arxiv.org/abs/2201.03472" target="_blank" rel="noopener">Savile Row Manual</a>
    (Nightingale, 2024), Smith's "Modelling" chapter of the Handbook of Constraint Programming, and
    standard SAT references (Marques-Silva/Lynce/Malik, Selman/Kautz). Everything that's a "gotcha" or
    likely-exam-target carries a callout.
  </p>
</article>
