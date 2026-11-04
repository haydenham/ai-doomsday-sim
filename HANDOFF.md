# Handoff: AI 2040 prototype

Read this first in a new session, then `ROADMAP.md` (the plan) and `game_design.md` (the owner's original design doc; source of intent, though parts are now superseded, see below).

Last updated: 2026-11-03.

## Status

Playable local prototype: a real-time, decision-driven strategy game about US AI policy, 2027 to ~2041, based on ai-2040.com (AI Futures Project).

- **v1** (dashboard plus a hand of policy cards with political capital) was **rejected** as cluttered, wordy and not gamified.
- **v2** (current) was received very well ("wayyyy better"). Terminal UI, one decision at a time, slow reveal.
- **Step 0 of the roadmap is done:** the quarter timer bar was removed.
- **Waiting on the owner:**
  - whether to start **ROADMAP Step 1** (scenario fidelity);
  - which **primary control** to build in Step 3. Recommended: compute allocation across capabilities / safety / deployment / security.

## Run

```bash
npm install
npm run dev            # http://localhost:5173  (?fast=4 speeds the clock 4×)
npm run sim            # headless balance runner, 300 seeds per bot
npm run sim -- 150 planA   # one bot, verbose first run
npm run typecheck && npm run build
```

Keys: space pauses; 1/2/3 set speed (or pick options while a decision is open); n skips a quarter. In dev, `window.game` is the store and `game.s` is the live state, including hidden stats.

## Owner's design direction (non-negotiable unless they say otherwise)

- Terminal-like UI (Universal Paperclips / A Dark Room). Monospace, plain text, one accent color. Very few words.
- Start nearly empty and introduce things slowly; the player should feel underwhelmed at first.
- Decisions are the main verb: one at a time, they pause the real-time clock, and **every option has a real cost**.
- A run can be ~1 hour.
- "Stick to game design principles; we're doing too much at once." Work sequentially and default to subtraction.
- Stay true to AI 2040's scenarios, and balance scenario fidelity against how much player choices matter.
- Wants it to play more like **Plague Inc**: one primary control the player steers (next big feature).

## Superseded parts of game_design.md

- Hand of cards and political capital are **removed**; replaced by one paused decision per quarter.
- The 20-minute target is now ~1 hour.
- Serif/editorial styling is out; terminal styling is in.
- Content names were changed for plausibility (algorithm ladder rewritten, Gulf instead of Mongolia for compute tier 5).

## Architecture

```
src/sim/       pure, seeded, deterministic simulation (no React)
  engine.ts    newGame, step (0.01-quarter substeps), quarterBoundary, midQuarter (decision draw),
               events, Fork, negotiation, endings. advance() holds the core dynamics.
  derived.ts   leadMonths, baseRdMult, quarterSeconds (pacing: 30s/quarter early)
  helpers.ts   applyFx (also sets flags.seen_<stat> so stats appear on first change), ticker, releaseOverhang
  reveal.ts    pivotal decision, what-ifs, share text
  constants.ts capability levels, key quarters (FORK_Q=8, UNPAUSE_Q=52, END_Q=60), thresholds
content/       data only
  decisions.ts ~45 decisions; each option has chips + fx + lean (race/safety/hawk/dove/people/power)
  events.ts    scripted/conditional events (also paused choices), incl. asi_keys, cn_breakout, unpause
  panels.ts    section unlock conditions; ladders.ts compute + algorithm tiers; paths.ts Plans A/B/C/D/S
  negotiation.ts  Plan A Geneva table; ticker.ts flavor + hidden-state hints; endings.ts
store/game.ts  real-time loop and emit. Emits when blocked, which is the fix for the popup-not-showing bug.
ui/            App.tsx (layout, ending sequence), sections.tsx (status/compute/world/... blocks),
               components/ (term.tsx primitives, Overlays.tsx decision/fork/negotiation/start,
               Reveal.tsx, WorldMap.tsx dot-matrix map, common.tsx LineChart), styles.css, audio.ts (WebAudio)
tools/sim.ts   bots choose options by lean; prints ending distribution per strategy
```

### Key mechanics

- **Alignment risk scales with the *rate* of capability growth.** True alignment is hidden.
- The **Alignment Readout** appears only when safety ≥ 2.5. Capable, misaligned models bias it upward.
- **Capability** = log10(effective compute in H100e). Thresholds:
  - 8.0: automated research
  - 8.8: top-expert (the Plan A cap)
  - 11.5: ASI
- **Endings** (on ASI, or at END_Q):
  - Loss of Control if alignment < 40;
  - Gilded Cage if power concentration ≥ 60;
  - Flourishing otherwise;
  - Stagnation or Cold War if there is no ASI.

### Latest balance (150 seeds per bot)

| Bot | Result |
|---|---|
| Race | Loss of Control 100% |
| Careful race | Flourishing 33% |
| Plan A, safety-minded | Flourishing 94% |
| Plan A, fast-minded | Loss of Control 100% |
| Burn the Lead, safety-minded | Flourishing 98% |
| Shutdown, lifted late | Flourishing 92% |
| Random | Loss of Control 57% |

## Known issues / next steps (detail in ROADMAP.md)

1. **Timelines are ~2 years fast vs AI 2040.**
   - The game hits "superhuman coder" in 2028 and automated research by 2029–30.
   - AI 2040: Automated Coder ~Jan 2030 with no deal (ASI ~1 year later). Plan A pauses training Mar–Sep 2029, reaches AC ~mid-2030 and TED-AI ~2035, slows down from 2035 to 2040, and hands off in 2040.
   - Compute is far off: the game starts the US at 5M and China at 3M H100e. AI 2040 has the US ~224M and China ~26M by 2029.
   - Step 1 renames the ladder to AI 2040's terms (Automated Coder → Superhuman AI Researcher → TED-AI → ASI), retimes the curve, adds the 2029 pause, and adds runner assertions on milestone dates per path.
2. **Flavor text is gated by phase, not real state.** For example, "lab staff can't follow the models" fires during the Plan A pause. Fix: gate on capability.
3. **Metrics aren't standardized.** Lever stats (safety, verification, lab security) show bare numbers. The owner wants the 10-cell `▮▮▮▯` bar style plus a word everywhere (Step 2).
4. **No primary control yet** (Step 3) and **the map is not interactive** (Step 4).
5. Safety-minded play on Plans A and C wins too reliably; Plan B has no winning style.
6. No git repo and no unit tests; the headless runner is the safety net.

## Research sources

ai-2040.com plus its supplements: takeoff-forecast, capability-scaling-strategy, compute-supplement, plan-a-assumptions. Only Plan A is written out on the site; B, C, D and S are stubs at the 2029 fork.
