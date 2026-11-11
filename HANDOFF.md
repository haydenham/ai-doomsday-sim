# Handoff: AI 2040 prototype

Read this first in a new session, then `ROADMAP.md` (the plan) and `game_design.md` (the owner's original design doc; source of intent, though parts are now superseded, see below).

Last updated: 2026-11-11.

## Status

Playable local prototype: a real-time, decision-driven strategy game about US AI policy, 2027 to ~2041, based on ai-2040.com (AI Futures Project).

- **v1** (dashboard plus a hand of policy cards with political capital) was **rejected** as cluttered, wordy and not gamified.
- **v2** (current) was received very well ("wayyyy better"). Terminal UI, one decision at a time, slow reveal.
- **Steps 0–3 of the roadmap are done:** the timer bar was removed (0), timelines follow AI 2040 (1), metrics share one bar-plus-word style (2), and **compute allocation** is the primary control (3, `sim/alloc.ts`).
- **Next (planned 2026-11-11, after the owner found it too easy):** Step 4 **Teeth** (every number must change the ending and show its live effect; on Plan A every split wins 100% today), then Step 5 **Pressure** (adaptive China, a deal you have to fight to keep, a readout that lies more, warning shots, stricter endings). See ROADMAP.
- **Waiting on the owner:** go-ahead on Step 4, and where **Step 3b, emergent paths** goes in the order.

## Run

```bash
npm install
npm run dev            # http://localhost:5173  (?fast=4 speeds the clock 4×)
npm run sim            # headless balance runner, 300 seeds per bot; prints milestone dates and AI 2040 rails checks
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
  derived.ts   leadMonths, baseRdMult, quarterSeconds (pacing: 14s/quarter early, 12–20s later)
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
- **Capability** = log10(effective compute in H100e) − 1 (`capOf`). Rungs follow AI 2040, each with an AI R&D speedup:
  - 8.0: Automated Coder (3×)
  - 8.8: Superhuman AI Researcher (20×)
  - 9.6: TED-AI (40×), where the Plan A ceiling flattens
  - 11.5: Superintelligence (~10,000×)
- `rdMult` is that speedup, log-interpolated between rungs. Progress scales as `rdMult^0.9`.
- **Compute** starts at US 50M and China 6M H100e. China's chips count 5× (`CN_EFFICIENCY`: one national project plus fast-following), so the starting lead is ~8 months.
- **Plan A ceiling** (`dealCeiling`): frozen at signing until Q1 2030, AC ~mid-2030, TED-AI ~2035, near-flat until the 2040 unpause. `dealShift` (±4 quarters) moves it, set by the "Treaty review" decision. A deal limits capability by the ceiling; only a moratorium slows research itself.
- **Endings** (on ASI, or at END_Q):
  - Loss of Control if alignment < 40;
  - Gilded Cage if power concentration ≥ 60;
  - Flourishing otherwise;
  - Stagnation or Cold War if there is no ASI.

### Latest balance (150 seeds per bot, after Step 1)

| Bot | Result | AC → ASI |
|---|---|---|
| Race | Loss of Control 100% | 2029.5 → 2031.25 |
| Careful race | Flourishing 8% | 2029.75 → 2032.0 |
| Fight China | Loss of Control 100% | 2029.75 → 2031.75 |
| Plan A, safety-minded | Flourishing 100% | 2031.5 → 2041.0 (TED-AI 2036.25) |
| Plan A, fast-minded | Loss of Control 99% | the deal collapses, then a race |
| Burn the Lead, safety-minded | Flourishing 95% | 2031.75 → 2034.5 |
| Shutdown, lifted late | Flourishing 49%, Gilded 31%, Loss of Control 20% | a refusing China often gets ASI first |
| Random | Loss of Control 66% | |

Takeoff was tuned to the owner's call: no-deal paths reach ASI 1–2 years after AC, while Plan A is a slow climb. To compensate, the alignment-loss rate coefficient dropped from 2.5 to 1.0 (provisional until Step 5).

## Known issues / next steps (detail in ROADMAP.md)

1. ~~Timelines~~ and ~~flavor gating~~: fixed in Step 1.
2. **Balance after Step 1:**
   - Racing is near-hopeless (careful race wins 8%).
   - Plan A (safety-minded) wins 100%.
   - With Shut It Down, a refusing China often reaches ASI before the late lift.
   - All three are for Step 5.
3. ~~Metrics aren't standardized~~: fixed in Step 2. New metric rows should use `Stat`, and levers should use `Lever` in `sections.tsx`.
4. **No primary control yet** (Step 3) and **the map is not interactive** (Step 4).
5. Safety-minded play on Plans A and C wins too reliably; Plan B has no winning style.
6. No git repo and no unit tests; the headless runner is the safety net.

## Research sources

ai-2040.com plus its supplements: takeoff-forecast, capability-scaling-strategy, compute-supplement, plan-a-assumptions. Only Plan A is written out on the site; B, C, D and S are stubs at the 2029 fork.
