# Four Economies

An interactive companion to the BAHUM107 macroeconomics seminar *"Four economies, three years, one question: who is actually better off?"* — Gross National Income, income per head and inflation in **Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives**, 2022–2024, from World Bank data.

Harsh · 25BEC0374 · B.Tech ECE, VIT Vellore.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

Use arrow keys, Page Up/Down or Space to step between slides on any page.

## Pages

| Route | What it holds |
| --- | --- |
| `/` | The story: the deck's 19 slides as a scroll-driven presentation, each one reshaping the 3D field |
| `/countries/[slug]` | One file per country — 25 years of data, the policy story, people, structure, timeline and context |
| `/compare` | Head-to-head picker, indicator explorer, an animated bubble chart (2000–2025), a sortable scoreboard and the living-standards verdict under three base-year choices |
| `/method` | The draw (rank 74), definitions, glossary, every indicator code, data notes and sources |

## Refresh the data

```bash
npm run data
```

`scripts/fetch-data.mjs` pulls 41 World Development Indicators for the four countries plus the World and upper-middle-income aggregates (2000–2025) into `src/data/wb.json`. `scripts/build-globe.mjs` builds the dotted-globe point cloud in `src/data/globe.json` from Natural Earth land (via `world-atlas`).

Bosnia's 2024 CPI cell was empty in the API at retrieval; as in the deck, it is patched with 1.69% from Trading Economics' republication of the same World Bank series, and the patch is recorded in `meta.notes`.

Qualitative context (policy rates, tourist arrivals, ratings, events, 2025–26 developments) lives in `src/data/research.json`, with a source on every item.

## How it is built

- **Next.js 16** (App Router, Cache Components), **React 19.3**, **Tailwind CSS v4**, TypeScript.
- **The particle field** (`src/components/scene/`): one persistent React Three Fiber canvas in the root layout. Ten thousand particles are morphed between *formations* — globe, population spheres, bar towers, PPP pairs, an emigrating crowd, leaking GNI/GDP rings, inflation ribbons, regime coins, a balance scale, particle typography and a landmark per country (Stari Most, a coco de mer, a lotus, an atoll). `formations.ts` builds the shapes; `specs.ts` turns World Bank numbers into formation inputs; each `<Slide>` asks for its formation when it reaches the middle of the screen.
- **Motion**: Lenis smooth scrolling, GSAP ScrollTrigger and SplitText for headline reveals and the pinned horizontal timeline, rolling odometer figures, and a four-band page-transition shutter (`src/components/motion/`).
- **Charts** (`src/components/charts/`): hand-built SVG line, grouped bar, horizontal bar, dumbbell and bubble charts with hover tooltips, keyboard reading, legends, direct labels and a table view for every chart. Country colours were re-stepped from the deck's palette to pass dark-mode colour-blind and contrast checks.
- Reduced-motion preferences are respected throughout; without WebGL the site still reads in full.
