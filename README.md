# AI 2040 (prototype)

A real-time, decision-driven strategy game about steering the United States through the arrival of advanced AI, 2027 to 2040. See `game_design.md` for the full design.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run sim          # headless balance runner: 300 seeded runs per bot
npm run sim -- 200 planA   # one bot, with a verbose first run
npm run typecheck
```

Testing tips: `?fast=4` in the URL speeds up the clock 4×. Keys: **space** pauses, **1/2/3** set speed, **n** skips to the next quarter. In dev builds the store is available as `window.game`.

## How it plays (v2)

- **One verb: decisions.** Halfway through each quarter a decision appears and the clock stops until you pick (keys 1/2/3). Every option costs something. There are no cards and no political capital.
- **Starts nearly empty.** Only the date at first. A stat appears the first time something changes it, and sections (compute, algorithms, world…) fade in as the story reaches them.
- **Terminal look.** One monospace font, plain text, one accent color. Effects are shown as short colored tags; `◇ hidden` marks a choice that changes something you can't see.
- **Pacing.** Quarters are 30s at 1× early, shortening during takeoff. A careful run (Plan A) is ~60 quarters and ~45 decisions; a reckless race ends around 2033.

## How it's built

```
src/
  sim/        pure, seeded simulation (no React): engine, derived stats, RNG, reveal analysis
  content/    data: decisions, events, panels, ladders, paths, negotiation, endings, ticker
  store/      real-time loop: fixed 0.01-quarter substeps, pause / 1× / 2× / 3×
  ui/         App shell, sections.tsx (status, compute, world…), components/ (overlays, map, reveal)
tools/sim.ts  headless runner; bots pick options by their `lean` (race, safety, hawk, dove, people, power)
```

- **Deterministic.** All randomness goes through `rngState`, so a seed plus the same choices replays the same run.
- **Alignment risk scales with the *rate* of capability growth** (`advance()` in `src/sim/engine.ts`).
- **The readout lies.** Capable, misaligned models bias the Alignment Readout upward; safety research shrinks noise and bias.
- **Adding content:** append to `DECISIONS` in `src/content/decisions.ts`. Rule: if one option is all upside, the decision is broken.

## Balance snapshot (150 seeds per bot)

| Bot | Outcome |
|---|---|
| Race (always picks the fast option) | Loss of Control 100%, superintelligence ~2032 |
| Careful race (Plan D, prefers safety) | Flourishing 33%, Loss of Control 65% |
| Burn the Lead, safety-minded | Flourishing 98% |
| Burn the Lead, fast-minded | Loss of Control 100% |
| Fight China, hawkish | Loss of Control 100% |
| Plan A, safety-minded | Flourishing 94% |
| Plan A, fast-minded | Loss of Control 100% |
| Shut It All Down, never lifted | Stagnation 99% |
| Shut It All Down, lifted late | Flourishing 92% |
| Random choices | Loss of Control 57%, Gilded Cage 24%, Flourishing 17% |

## Known gaps / next steps

- Racing still ends early (~2033). Fine thematically, short in minutes.
- Safety-minded play on Plans A and C is too reliably rewarded; Plan B has no winning style yet.
- Map, Fork and Reveal are restyled but not yet simplified as much as the main screen.
- No unit tests yet; the headless runner is the main safety net.

## Credits

Scenario concepts and the Plan A/B/C/D/S framework come from **[AI 2040](https://ai-2040.com)** by the AI Futures Project. Gameplay inspirations: Plague Inc (Ndemic Creations) and Universal Paperclips (Frank Lantz). This is a game, not a forecast.
