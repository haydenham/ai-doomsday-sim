# Roadmap

Sequential plan for the next iterations. One step at a time; each step ends with a playable build and a balance run (`npm run sim`). Don't start a step until the previous one feels right.

**Principle:** subtraction first. Keep the core thesis: alignment is hidden, speed is what creates risk, and the Reveal pays it off.

---

## Step 0. Remove the quarter timer bar ✅ done

The yellow progress bar under the top bar is gone. Time is felt through the clock and the numbers, not a countdown.

---

## Step 1. Scenario fidelity: put the timelines on AI 2040's rails ✅ done

**Shipped (2026-11-03):**
- **Ladder:** Agents → Automated Coder → Superhuman AI Researcher → TED-AI → Superintelligence. The displayed AI research speed uses AI 2040's speedups.
- **Compute:** real counts (US 50M / China 6M H100e at the start, ~1T by 2040 on Plan A), with capability = log10(effective) − 1.
- **Plan A:** the 2029 training pause, then a scheduled ceiling. The new "Treaty review" decision moves it ±1 year.
- **Flavor:** ticker lines are gated by real state.
- **Takeoff speed** follows the owner's direction: no-deal paths reach ASI 1–2 years after AC; Plan A climbs slowly.
- **Rails checks:** `npm run sim` prints median milestone dates and checks them against bands for the race, fight and Plan A bots.
- **Compromise:** compute counts are only roughly on AI 2040's curve (~80M in early 2029 vs AI 2040's 224M), because a faster buildout would have moved every milestone date.

The research and plan are kept below for reference.

### Research summary (ai-2040.com and its supplements, read 2026-11-03)

| When | AI 2040 (Plan A narrative + supplements) | Game today |
|---|---|---|
| 2027 | Agents "in the millions". AI Transparency Act passes and changes little. Labs spend ~half their compute on AI R&D. | ✅ roughly |
| 2028 | AI election. Most white-collar work = managing agents. Datacenter build costs 2× the military budget. | ❌ we reach **superhuman coder in 2028** |
| Mar–Sep 2029 | Plan A: training pause while the deal is set up. | ❌ no pause |
| ~Jan 2030 (no deal) | **Automated Coder (AC)**, ~3× AI R&D speedup. Full automation of AI R&D during 2030. | ❌ we hit "automated AI researcher" in 2029 |
| ~2031 (no deal) | ASI roughly **1 year after AC** (80% CI: 2 months to 5 years). | ✅ race reaches ASI ~2032 |
| Jan 2030 → 2035 (Plan A) | Training resumes Jan 2030. AC ~mid-2030. Scale "relatively quickly" by training compute, not software, to **TED-AI** (top-expert-dominating AI, ~40× speedup) around late 2034–2035. | ❌ we reach the cap ~2031 and then sit there |
| 2035–2040 (Plan A) | Scaling slows "nearly to a halt" while alignment confidence builds. | ⚠️ we pause from ~2031 |
| 2040 | Handoff to AIs; controls relaxed. | ✅ |

**Capability ladder AI 2040 uses** (speedup = realized AI R&D uplift):
Automated Coder (3×) → Superhuman AI Researcher (20×) → TED-AI (40×) → Wildly superintelligent (~10,000×).

**Compute anchors (H100-equivalents):**
- US ≈ 224M, China ≈ 26M (9%), rest of world ≈ 39M installed by 2029.
- China stock: 6.3M at end-2026 and 13.2M at end-2027. About a third of it is smuggled.
- Plan A: roughly 1T H100e installed by 2040.
- The largest covert project plausibly undetected under a deal is ~1% of pre-deal compute.

**The game's current numbers are off:** we start the US at 5M H100e and China at 3M. AI 2040 implies roughly 50M vs 6M in early 2027.

### Changes

1. **Rename the capability ladder** to AI 2040's terms: Agents → Automated Coder → Superhuman AI Researcher → TED-AI → Superintelligence. Drop "superhuman coder" and "automated AI researcher" as separate rungs.
2. **Retime the growth curve** so the default (no-deal) path hits AC around early 2030 and ASI around 2031–32, and Plan A hits AC mid-2030 and TED-AI ~2035.
3. **Real compute numbers:** start around US 50M / China 6M H100e and follow the supplement's buildout.
4. **Plan A 2029 training pause** (Mar–Sep) as a visible beat.
5. **Gate flavor by actual state, not phase.** Example: "Lab staff can't follow the models' work" requires real capability, so it can't fire during a pause.
6. **Rails vs. choices.** Each path gets a canonical trajectory from AI 2040. Player choices shift timing within a band (about ±1–2 years) and change outcomes, but don't throw the story off the rails. The headless runner asserts the median milestone dates per path fall inside their bands.

---

## Step 2. Standardize the metrics ✅ done

Shipped: every metric row is a `Stat` (`ui/components/term.tsx`): label, 10-cell bar, then a word or number. Levers use `levelWord` (`ui/format.ts`) on a 0–10 scale. Intelligence now shows as a lever in the World block. The Fork overlay and Plan A note use words too.

Every player-facing metric uses the same 10-cell bar plus a word. No bare numbers like "lab security 4".

```
safety research   ▮▮▮▯▯▯▯▯▯▯  low
verification      ▮▮▮▮▮▯▯▯▯▯  moderate
lab security      ▮▮▮▮▮▮▮▮▯▯  high
public trust      ▮▮▮▮▮▯▯▯▯▯  52
```

- Levers (safety, verification, intel, security) are shown on a 0–10 scale with words: none / low / moderate / high / very high.
- Percent-like stats (trust, power, tension, deal integrity) keep the number next to the bar.
- Big counters (economy, compute) stay as numbers with scale words; those are the "numbers go up" fun.

---

## Playtest log (owner feedback, 2026-11-03)

Running list. ✅ = fixed, 📋 = folded into a step below, ❓ = awaiting the owner.

| # | Feedback | Response | Status |
|---|---|---|---|
| 0 | **Bug:** got sent back to the launch screen mid-run and lost all progress | Cause: the game lived only in memory, so any page reload wiped it. A dev-server hot reload after Claude edited files triggered it. Fix: autosave to browser storage (`sim/save.ts`) about every second and after every action, plus a **continue** button on the launch screen. Open decisions are restored, and the save is cleared when a run ends | ✅ |
| 1 | Early quarters (30s) are boring when little is on screen | 2027–28 is now 14s/quarter and later quarters are 12–20s | ✅ |
| 2 | What is the seed? | It sets the run's hidden setup (China's intent, alignment, difficulty) and every random roll. Showing it on the launch screen invites replays that spoil the Reveal. Idea: move it behind a "custom seed" link, or show it on the Reveal for sharing | ✅ Removed from the launch screen. Reveal keeps [ replay seed ] |
| 3 | Geneva: "push too hard and they walk" is false. Offering everything is always accepted | Confirmed: offering everything is accepted 100% by a cooperative or opportunistic China. Cause: one sweetener (lift export controls) outweighs every objection, and talks only collapse after round 3. Proposed fix: hidden **red lines** by intent (an offer that includes one ends talks immediately, and no sweetener buys it), intel reveals them, and each extra term costs goodwill | ✅ Built. China has 0–2 hidden red lines (none or one if cooperative, one if opportunistic, two if racing). Offering one ends the talks (tension +20). Each term past two costs goodwill, and intel reveals red lines first, with no hints at zero intel. First-offer acceptance for "everything" fell from ~85% to 26%. Two easy terms are always accepted but make a weak deal. Plan A (safe play) now wins 87% instead of 100% |
| 4 | "Always pick the safe option" is a pattern people will spot; it gets boring. But rewarding speed betrays AI 2040 | Measured: the safe player wins 29–100% on every path, the race player 0% everywhere, and Plan A also wins on score because it runs longest. Principle adopted: **speed is never rewarded, but falling behind is punished**, because AI 2040 says it should be. The primary control (Step 3) creates a sweet spot; scoring and costs move to Step 5 | 📋 Step 3, Step 5 |
| 5 | Nationalizing the labs only added +15 power (3 → 18) | Structural power grabs now set a floor (`concentratePower`): nationalize → 80+, emergency powers → 50+, giving ASI to the President → 90+ or to the lab → 75+. Random play now ends in the Gilded Cage 26% of the time (was 17%) | ✅ |
| 6 | Is safety still always the best yes/no answer? | Measured after Step 3, with the dial steered the same way. **As a blanket policy, yes:** safe answers win 95% / 82% / 44% on A / C / D, race answers 0% on all three. **Per decision, no longer universal:** on Plan C, 9 safe answers are *wrong* (flipping permits, merger, transparency or internal models gains +14 to +17 points, because over-caution hands China the lead). On Plan D, safe is right on ~14 decisions. On Plan A, **23 of 34 decisions make no measurable difference**. Causes: (1) the costs of safe answers mostly land on prosperity and trust, which don't decide the ending; (2) race answers bundle hidden alignment hits, so racing on everything stacks into takeover; (3) under a deal, the ceiling makes most choices moot. Plan: make safe-answer costs hit things that decide the ending (lead, trust → elections, deal integrity), make prosperity count in the result, and cut or merge decisions that don't matter | 📋 Step 5 |
| 7 | **Bug:** talks failed, yet "the deal: no deal in force" and "Inspectors land in Shanghai and Nevada" both showed. Wants to keep negotiating until a deal is made, with an option to abandon and race | The Deal panel unlocked when Plan A was *chosen*, not signed; it now unlocks only on signing. Talks now **loop**: rejections add strain (goodwill lost, tension +3) and crossing a red line adds more (tension +10), but Beijing returns. New **[ abandon talks · race ]** button switches you to Plan D. Side effect: with retries, Plan A reaches a deal ~99% of the time and safe Plan A wins 99%, so Plan A difficulty must come from the deal's *strength* (Step 5) | ✅ |
| 8 | Should failed talks eventually default to a race (~4 attempts)? | Yes: Beijing ends the talks after **4 rejected offers** and the US races by default (Plan D, tension +10). The header shows "offer N of 4" | ✅ |
| 9 | **Bug:** the "Hidden datacenter in China" crisis appeared with no deal in place | China's covert project counted US export controls as "rules to break". Covert compute now only starts under a deal or moratorium (smuggling under export controls stays a slow leak into declared compute). The crisis requires a deal or moratorium, and "deal −10" shows only with a deal. When a deal collapses or a moratorium lifts, hidden compute becomes declared compute. Verified: 0 such popups over 200 runs | ✅ |
| 10 | **Bug:** after talks failed, no new negotiation came up for several quarters | The "Talks" decision was Plan A-only, and failing talks moves you to Plan D. It was also one random card among ~20. It's now an event, "Beijing signals it is ready to talk again": on any path but a moratorium, 4+ quarters after talks end, 50% per quarter. Signing a deal from any path puts you on Plan A's rails (the first piece of emergent paths). Verified: Beijing returns in 154/157 runs with failed talks (the other 3 ended first), median 5 quarters | ✅ |

### Design principles from playtesting
- **Speed is never rewarded; falling behind is punished.** Going too slow fails for reasons from the scenario: China passes you, a deal stops appealing to them, China reaches ASI with weaker alignment, and AI-automated alignment research stalls without capable models.
- **Structural changes set levels; incremental ones add deltas.** If a choice changes *who controls AI*, the stat should land where that structure implies, regardless of where it started.
- **No option should be right in every situation.** A decision's cost should depend on the current state (lead, readout, intel), so the same choice can be right one quarter and wrong the next.

---

## Step 3. The primary control ✅ done (compute allocation)

**Shipped (2026-11-03):**
- **The control:** a four-row panel (capabilities, safety, deployment, security) appears in Q3 2027. Deployment shows up once jobs start being automated; security after a theft scare or from 2029.
- **Who owns it:** the labs. They pull the split 25% of the way back to their preference each quarter (70/10/15/5; 85% capabilities on Plan D), and you get one 10% nudge per quarter. Plan C halves the pull. Nationalizing gives you full control (power 80+).
- **What each share does:**
  - capabilities scales algorithmic progress (squared, relative to the labs' 70%);
  - safety research grows with the safety share × a capability-dependent yield (AI does the alignment work);
  - deployment scales economic growth, trust and jobs;
  - security builds lab security, and verification during a deal.
- **Laws and limits:** the moratorium forces capabilities to 0. The 25% AI research law is now a ceiling on the capabilities row.
- **Folded into the dial:** `alignment_grants`, `rd_credit`, `lab_security`, `c_spend`.
- **Sim:** added fixed-split bots (all capabilities, all safety, balanced, labs default) and a reactive bot on paths A, C and D. Implemented the dial's decisions in `sim/alloc.ts`.

**Results (150 seeds, safe decisions):**

| Path | Push capabilities | Push safety | Balanced | Labs default | Reactive |
|---|---|---|---|---|---|
| A | 82% | 80% | 85% | 87% | **91%** |
| C | 81% | 0% (China first) | 28% | 77% | **81%** |
| D | 2% | **41%** | 31% | 2% | 39% |

- No fixed split wins on every path, and over-caution now loses the way AI 2040 says it should: China reaches superintelligence first.
- The reactive bot is best or tied on A and C, and competitive on D.
- **Left for Step 5:**
  - Burn the Lead with a safety-heavy split loses to China 85% of the time; the halved pull lets you overshoot.
  - Plan D's best play is still "push safety".

The original options and spec are kept below for reference.


Plague Inc's core loop is shaping your pathogen. Universal Paperclips has a few panels you manage continuously. Decisions alone are reactive, so the player needs one thing they *steer*.

### Options

**A. Compute allocation (recommended).** One always-visible split of America's AI compute across four uses, adjustable at any time (the clock keeps running):

```
── compute allocation
capabilities  ▮▮▮▮▮▮▯▯▯▯  60%   faster AI, bigger lead, more risk
safety        ▮▮▯▯▯▯▯▯▯▯  20%   alignment, clearer readout
deployment    ▮▯▯▯▯▯▯▯▯▯  10%   economy, jobs, trust
security      ▮▯▯▯▯▯▯▯▯▯  10%   anti-theft, verification
```

- It *is* the thesis: the capability slice sets the speed, and speed is what creates risk.
- It's grounded in the scenario: AI 2040 tracks what share of compute goes to AI R&D, and "cap AI R&D at 25%" is a real Plan A policy.
- Decisions and paths act on it rather than beside it. A law can cap the capabilities slice; Plan D unlocks 90%; the Plan A treaty limits it; nationalizing the labs lets you set it directly instead of only nudging it.
- Early game: you only *influence* the labs, so moves are slow and limited. Late game: full control. That itself is progression.

**B. Policy tree, Plague's "evolve" screen.** A resource (influence) accrues over time and is spent on permanent nodes in three trees: Domestic, Compute, Diplomacy. Familiar and deep, but it adds back a currency we just removed and pulls attention off the main screen.

**C. Pace dial.** A single slider from "pause" to "full race". Maximally simple and readable, but it's one dimension, so it gets solved fast.

**D. Map actions.** Click countries to build datacenters, sign allies, place inspectors or spy, using a slow-regenerating resource. The strongest Plague feel, and it makes the map interactive. Better as a secondary verb after the primary is in place (Step 4).

**Recommendation: A as the primary control, D later as the secondary.** Decisions stay as the interrupting events.

### Step 3 spec: compute allocation (draft, awaiting owner approval)

**Goal.** Replace "always pick the safe option" with a dial whose best setting depends on the situation. Rule: *speed is never rewarded; falling behind is punished.*

**The panel**
```
── compute allocation          labs set this · you can move 10%/qtr
capabilities  ▮▮▮▮▮▮▮▯▯▯  70%   ◂ ▸
safety        ▮▯▯▯▯▯▯▯▯▯  10%   ◂ ▸
deployment    ▮▮▯▯▯▯▯▯▯▯  15%   ◂ ▸
security      ▮▯▯▯▯▯▯▯▯▯   5%   ◂ ▸
```
- ▸ adds 10% to a row, taken evenly from the others. ◂ gives 10% back. The shares always sum to 100%. The clock keeps running.
- **Slow reveal:**
  - The panel appears ~Q3 2027 with two rows, capabilities and safety.
  - Deployment appears once jobs start being automated.
  - Security appears after the first theft scare.

**What each share does** (hooking into existing levers, not new stats)
| Share | Effect | Why it fails at the extremes |
|---|---|---|
| Capabilities | Speed of algorithmic progress, which builds the lead | Too high: alignment loss scales with speed (as now) |
| Safety | Safety research grows each quarter, **scaled by capability**: in AI 2040, alignment work at this stage is done *by* capable AIs | Too high: capabilities stall, China passes you, and the safety work itself slows |
| Deployment | Economy growth, trust, jobs | Too low: the economy stalls, trust falls, Plan S is blocked |
| Security | Lab security grows toward a target and resists theft, plus verification during a deal | Too low: weights are stolen and the lead vanishes overnight |

**Influence → control (progression)**
- **Early, before 2029:** the labs own the dial. It drifts back toward their preference (≈70/10/15/5), and you can move it at most 10% per quarter. You *nudge* it.
- **The path changes the rules:**
  - Plan D: the labs' preference goes to 85% capabilities.
  - Plan C: the drift weakens.
  - Plan A: capability beyond the treaty ceiling is wasted, so moving share into safety is free.
  - Plan S: capabilities are locked at ~0.
- **Nationalizing the labs** gives you full control: no drift, no limit on moves. It costs power concentration 80+, so control is a real trade.

**Falling behind is punished** (thesis-grounded, partly in place already)
- Chinese superintelligence uses China's alignment, so a lead lost often means Loss of Control or the Gilded Cage.
- Deal appeal falls when you're behind (already in negotiation odds).
- Burn the Lead requires a lead (already).
- New: safety research yield scales with US capability.

**Subtraction: decisions the dial replaces**
- **Folded into the dial:**
  - `alignment_grants` (safety share);
  - `rd_credit` (capabilities share);
  - `lab_security` (security share);
  - `c_spend` (Plan C's "pause a quarter": just move the dial).
- **Become laws that constrain the dial:** `cap_rd` becomes "cap capabilities at 25%", a ceiling on the row.
- **Stay as-is:** decisions about *external* things (sites, China, deals, people, power).

**Sim.** Add allocation bots: fixed splits (all-capabilities, all-safety, balanced) and a reactive bot that steers by readout and lead. Success criterion: **no fixed split is best on every path, and the reactive bot beats all fixed splits.**

---

## Step 3b. Emergent paths (owner idea, 2026-11-03)

Remove the 2029 plan menu. The scenario you end up in should emerge from what you do, not from picking a plan:
- Sign a deal at Geneva and you're living Plan A.
- Race with nationalized labs and you're living Plan D.
- Win a moratorium and you're living Plan S.

**Groundwork already in place:** the dial reacts to *situations* (a deal in force, a moratorium, nationalization), not plan ids.

**What changes:**
- **The Fork** becomes a set of decisions and events, e.g. "Beijing proposes talks", "Moratorium push", "Race doctrine".
- **Path-gated content** (`paths: [...]` on decisions, the `s.path` checks in the engine) gets regated on state flags.
- **The Reveal** names the path you ended up on.

**Open questions:**
- Can you drift between paths, e.g. from a collapsed deal into a race? (Probably yes. That's the interesting part.)
- What triggers the offers?

## Step 4. Interactive map

Builds on Step 3 (and option D if chosen):
- Hover or click a country to see its stance, compute, and deal status.
- Place datacenters, inspectors or spies on countries.
- Visible spread: deal membership, halts, and defections propagate country to country.
- Covert sites appear only when intel finds them.

---

## Step 5. Rebalance choice impact vs. the rails

Once the control exists, tune so that:
- **Score** = how good the ending is × prosperity *per year*, not the economy summed over time. Plan A must not win just by lasting longest (today: Plan A safe scores 1539 vs 135–382 elsewhere).
- **Over-caution costs something real** (see the playtest principles): falling behind China has thesis-grounded consequences.
- **Careful racing** has a skilled way to win (today 8–29%).
- Default play follows the AI 2040 narrative for the chosen path.
- Skilled or reckless steering moves milestones within the band and changes the ending.
- No single allocation dominates across seeds. The runner gains allocation-strategy bots.

---

## Sources

- AI 2040 main scenario: https://ai-2040.com
- Takeoff Forecast: https://www.ai-2040.com/supplements/takeoff-forecast
- Capability Scaling Strategy: https://www.ai-2040.com/supplements/capability-scaling-strategy
- Compute in Plan A: https://www.ai-2040.com/supplements/compute-supplement
- Plan A Assumptions: https://www.ai-2040.com/supplements/plan-a-assumptions

Note: only the Plan A branch is written out in full on the site; Plans B, C, D and S are stubs at the 2029 fork. Their trajectories in the game have to be extrapolated from the no-deal default (AC ~2030, ASI ~1 year later).
