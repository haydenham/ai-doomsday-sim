# Handoff: AI 2040 prototype

Read this first in a new session, then `ROADMAP.md` (the plan) and `game_design.md` (the owner's original design doc; source of intent, though parts are now superseded, see below).

Last updated: 2026-11-17.

## Status

Playable local prototype: a real-time, decision-driven strategy game about US AI policy, 2027 to ~2041, based on ai-2040.com (AI Futures Project). Terminal UI, one paused decision at a time, slow reveal. The owner likes it ("wayyyy better" than v1, which was rejected).

**Done:**
- **Steps 0–4:** AI 2040 timelines, standardized metrics, compute allocation as the main control, and "Teeth" (every compute row matters, an AI takeover risk before superintelligence).
- **`SCENARIOS.md`:** every plan (A/B/C/D/S) drawn from AI 2040's plan comparison, with the owner's answers recorded.
- **Plan B rebuilt** as "Sabotage, then Spend": a cyber or kinetic doctrine, a campaign, and a stand-down decision.
- **New ending, Second Place:** China gets there first with an aligned AI.
- **Weight theft fixed:** it now really costs about 9 months of lead.
- **Cut list started.**
- **Step 5.3, China cheats for real:** the hidden datacenter is a real, less-aligned rival model; detection depends on spies, chip tracking and inspectors; four costly responses; breakout if ignored.
- **Playtest fixes (2026-11-17):** the Deal panel shows the **ceiling**; the Treaty review popup explains it; "found by AI, not people" has a hint.
- **Every ending tells the run's own story** (`content/endingStory.ts`, shown on the Reveal): who and when, what led here (the run's decisions and moments, most important first, told in time order), how it happened, the world now. The epitaph in `endings.ts` is now the one-line close. Loss of Control keeps its takeover story. `npm run stories` prints samples per ending for proofreading.

**Owner playtest (2026-11-17):** lost Plan A to an AI takeover after the evals showed it failing alignment tests. "This is good." The owner accepts Plan C below target.

**Latest sim after 5.1, 5.5, 5.4 and the Plan S lift (Flourishing %, 300 seeds):**

| Plan | Never touch the split | Reactive | Expert | Target (reactive / expert) |
|---|---|---|---|---|
| A | 53 | 86 | 87 | 55–65 / ~80 |
| B | 1 | 44 | 55 | 40–50 / ~70 |
| C | 9 | 39 | 45 | accepted below target |
| D | 0 | 25 | 41 | 20–30 / ~45 |
| S | 0 | 30 | 32 | ~65 expert |

**Audit:** 26 of 57 decisions still change the result by less than 3 points.

## Next session: one big coding session (owner-approved scope)

Work in this order. After each item, run `npm run typecheck && npm run build` and `npm run sim`, then commit. Ask the owner before any **new** design choice that affects gameplay; the items below are already approved.

1. ~~Ending stories for every ending~~ ✅ done (see Status).
2. ~~5.1 China adapts~~ ✅ done (`sim/china.ts`). A hidden hawkishness score (0–100) sets the posture, with a 6-point band so it doesn't flicker. Quarterly drift: tension above 25; fear when the US leads by 4–30 months, a softer line when it leads by 30+; confidence when China leads; export controls; under a deal, +0.6 fatigue, +1 when verification < 2, −1.2 when verification ≥ 3 and integrity ≥ 70. One-off nudges: strikes, caught sabotage, sanctions, a collapsed deal, a raised ceiling (harder); sharing research, the joint lab, open research, the backchannel, standing down, recommitting (softer). Shifts show as a ticker line ("hardliners/reformers gain ground"), move the intel panel's estimate, and appear on the Reveal ("opportunistic → racing"). **Result:** Plan A barely moved (reactive 88→86): a player who verifies well and is gentle with Beijing keeps China cooperative. **B expert fell 69→59**, because strikes now harden China for good. Raise both with the owner.
3. ~~5.5 Warning shots~~ ✅ done (`content/warnings.ts`). One recurring crisis (cooldown 3) from SAR − 0.4 on, rising through three rungs: sandbagging, an escape attempt, an unclaimed attack. Real chance = 12 × the summed takeover hazard (max 60%); false alarms = 1.5% + 0.3 × real. Real ones come from US, Chinese or open models in proportion to their hazard; intel ≥ 2 traces the source. Choices: **Pause and find it** (lead −4mo, prosperity −1%; if it's ours, alignment +4 and safety +0.5), **Lock it down** (security +1, compute growth −, trust −2), **Press on** (trust −3; if it's ours, alignment −2). The Reveal marks each as real or false, and the Loss of Control story tells the first and last warning and what they really were. **Measured (reactive):** Plan D ~0.8 warnings a run, 75% real; Plan A ~0.3 a run, all false alarms. B expert slipped again (59→55) and C expert 49→44, from pausing on false alarms.
4. ~~5.4 The readout lies more~~ ✅ done. Bias = 7 × (cap − 7.5)^1.4 × (1 − alignment) × blur × max(0.45, 1 − 0.05 × safety) ÷ (1 + 1.5 × interp). General safety work cancels less of it than before, and each interpretability program (`c_interp`, now up to 2 uses, safety +1 each, sets `flags.interp`) cuts it sharply. The panel shows a range (readout ± sigma). **Measured at TED-AI:** readout − truth ≈ +1 with interpretability, +4 to +8 without (A/C), +11 on Plan D. Win rates didn't move: the sim's reactive bot doesn't read the readout under a deal, so this is felt by human players. A first try that also gave Plan B interpretability at +2 safety per use made every plan easier, so it was reverted.
5. **5.6 Stricter endings.** A fast final climb needs more alignment margin, and Flourishing needs a minimum level of trust.
6. ~~Plan S lift condition~~ ✅ done (`content/lift.ts`). At the halt you pick one condition: **alignment solved** (safety 6; +10 alignment on lift), **lie detectors** (safety 6 and verification 4; on lift, interpretability ×2 and intel +2), or **smarter humans** (a 7-year clock; afterwards alignment erodes 40% slower). Verification now grows under a moratorium too. A "the halt" panel shows progress. When it's met, a "Condition met" event offers Lift slowly / Hold. The `s_lift` decision (from 2033, or earlier if China refused) is now the early lift: alignment −15 × the unmet share. S is in the sim's steering table and in the audit (`tools/audit.ts` PATHS). **Measured, reactive / expert, by condition:** solved 23/33, lies 30/27, humans 36/43; lifts land in 2036–38. **S expert is ~32% against a ~65% target.** Losses after the lift are China first (~20–25%) and takeovers (~25–39%); that's for a later balance pass.
7. **C+ marker:** regulating during Plan C marks the run as C+.
8. Later: 5.2 (keeping a deal is a fight), 5.7 (score per year), the rewires for decisions that do nothing (joint lab, secondary sanctions, AI dividend, backchannel, interpretability, destruction pledge), then Step 6, the interactive map.

**General rule from playtest #17:** a popup must never ask about a number the player can't see. Check new decisions against this.

## Run

```bash
npm install
npm run dev            # http://localhost:5173  (?fast=4 speeds the clock 4×)
npm run sim            # headless balance runner, 300 seeds per bot; prints milestone dates and AI 2040 rails checks
npm run sim -- 150 planA   # one bot, verbose first run
npm run stories        # prints sample ending stories per ending, to proofread
npm run audit          # flips every decision across paired seeds on A/B/C/D; flags ones that change nothing (~10 min)
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
  endingStory.ts  the Reveal's story for every ending, built from the run; endings.ts epitaph closes it
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
- **Compute** starts at US 50M and China 6M H100e. China's chips count 5× (`CN_EFFICIENCY` in constants.ts; a stolen recipe gets it too: one national project plus fast-following), so the starting lead is ~8 months.
- **Plan A ceiling** (`dealCeiling`): frozen at signing until Q1 2030, AC ~mid-2030, TED-AI ~2035, near-flat until the 2040 unpause. `dealShift` (±4 quarters) moves it, set by the "Treaty review" decision. A deal limits capability by the ceiling; only a moratorium slows research itself.
- **Alignment** approaches a ceiling set by safety research (`alignCeiling`) at a speed set by the safety share, drifts down with capability unless safety ≥ 30%, and is frozen once ASI exists.
- **AI takeover** (`sim/risk.ts`): from SAR on, a quarterly risk for US, Chinese and open models; security share = containment.
- **Endings** (on ASI, on takeover, or at END_Q):
  - Loss of Control if alignment < 40 (China's alignment if China got there first);
  - Second Place if China's ASI came first and is aligned;
  - Gilded Cage if power concentration ≥ 60;
  - Flourishing otherwise;
  - Stagnation or Cold War if there is no ASI.

Takeoff follows the owner's call: no-deal paths reach superintelligence 1–2 years after Automated Coder, while Plan A is a slow climb under the ceiling.

## Known issues (detail in ROADMAP.md)

- Plan A is still too easy for anyone who steers (reactive 88% against a 55–65% target). Step 5 addresses this.
- Plan S has no bot and no audit coverage, so its win rate is unknown.
- 26 of 57 decisions still make no measurable difference.
- There are no unit tests. The headless sim and audit are the safety net.
- The repo is on GitHub (origin: haydenham/ai-doomsday-sim). Ask before pushing.

## Research sources

ai-2040.com plus its supplements: takeoff-forecast, capability-scaling-strategy, compute-supplement, plan-a-assumptions. Only Plan A is written out on the site; B, C, D and S are stubs at the 2029 fork.
