# AIPS Revision

Interactive revision site for **COM00050H — AI Problem Solving with Search and Logic** at the University of York.

No generative AI is used in-page; everything runs client-side. Safe to use on an exam-restricted machine (no API calls).

## What's inside

Five modules, each with explanatory content and step-through visualisers:

1. **Search** — BFS, DFS, IDS, UCS, Greedy, A\*, IDA\*; admissibility, consistency, dominance; local search.
2. **Adversarial search** — minimax, alpha-beta pruning, evaluation functions, MCTS / UCB1.
3. **CSPs & Constraint Programming** — AC-3, backtracking, MRV/LCV/FC/MAC, modelling (viewpoints, channeling, implied constraints, symmetry), **Essence Prime** + Savile Row pipeline, min-conflicts.
4. **Propositional logic** — syntax/semantics, entailment, CNF, resolution, Horn chaining.
5. **SAT** — DPLL, **CDCL** (implication graph, 1-UIP, VSIDS, backjumping), GSAT/WALKSAT.

Cross-cutting features:

- 🔍 **Command palette** (Ctrl/Cmd+K) with **fuzzy** or **regex** search across topics, sections and glossary.
- 🃏 **Flashcards** with SM-2 spaced repetition (progress stored in localStorage).
- 📋 **Cheatsheets** — dense one-pager per module, printable.
- 📊 **Complexity table** for every algorithm.
- ⚠ **Examiner pitfalls** flagged inline (orange callouts) and York/Nightingale notes in rose.
- 🧪 **Past papers** — build your own question bank with model answers (localStorage; JSON export/import).

## Run locally

```sh
npm install
npm run dev          # starts dev server on http://localhost:5173
npm run build        # production build → dist/
npm run preview      # serve the built dist/
```

## Deploy to GitHub Pages

1. Push this repo to GitHub as `aips-revision` (or any name).
2. In repo Settings → Pages: source = **GitHub Actions**.
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds with `BASE_PATH=/<repo-name>/` and deploys.

The Vite config reads `BASE_PATH` from env; the workflow sets it from the repo name automatically.

## Stack

Svelte 5 (runes) · Vite · TypeScript · Tailwind CSS · KaTeX (math) · MiniSearch (search) · `marked` (markdown).

All visualisers are hand-rolled SVG/HTML — no heavy chart libraries.

## Sources

- Russell & Norvig, *Artificial Intelligence: A Modern Approach* (4e) — primary textbook.
- Nightingale, *Savile Row Manual* (arXiv:2201.03472, July 2024) — Essence Prime reference.
- Smith, "Modelling" — chapter 11 in *Handbook of Constraint Programming* (Rossi/van Beek/Walsh eds.).
- Marques-Silva, Lynce, Malik — CDCL chapter in *Handbook of Satisfiability*.

## Layout

```
src/
├─ App.svelte           # app shell (sidebar + topbar + router-view)
├─ main.ts
├─ app.css              # Tailwind + KaTeX + component classes
└─ lib/
   ├─ router.ts         # hash-based router
   ├─ markdown.ts       # marked + KaTeX preprocess
   ├─ search.ts         # MiniSearch index (fuzzy + regex)
   ├─ glossary.ts
   ├─ types.ts          # content schema
   ├─ content/
   │   ├─ index.ts
   │   ├─ search.ts
   │   ├─ adversarial.ts
   │   ├─ csp.ts        # incl. Essence Prime, modelling concepts
   │   ├─ logic.ts
   │   └─ sat.ts
   ├─ pages/            # Home, TopicPage, Flashcards, Glossary, Cheatsheet, Complexity, Pitfalls, Visualizers, PastPapers, NotFound
   ├─ components/       # Sidebar, TopBar, RouterView, CommandPalette, VizRenderer, Md, Callout
   └─ visualizers/      # SearchGrid, MinimaxTree, MCTSTree, AC3, NQueens, MinConflicts, EssencePrime, TruthTable, Resolution, HornChain, DPLL, CDCL, WalkSAT, CNFEncoder
```

## Editing content

Each topic is a TS object in `src/lib/content/*.ts` with `sections: { id, title, blocks: [...] }`. Blocks are markdown (`{ kind: 'md', body }`), callouts (`{ kind: 'callout', variant: 'pitfall' | 'keyfact' | 'whatif' | 'nightingale', body }`) or visualisers (`{ kind: 'viz', viz: 'SearchGrid', props: {...} }`).

Math: `$...$` inline and `$$...$$` display, KaTeX-rendered.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Ctrl/Cmd + K` | Open command palette |
| `/` | Open command palette (outside inputs) |
| `↑ ↓` | Navigate palette |
| `↵` | Open selected result |
| `Esc` | Close palette |
| (Flashcards) Space | Reveal answer |
| (Flashcards) 1–4 | Fail / Hard / Good / Easy |
