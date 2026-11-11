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
| 11 | Rename "deployment" to "inference"; add hover explanations to stat titles | Renamed (the internal key stays `deploy`). `Row`/`Stat` take a `hint` prop: a dotted-underlined label shows a one-line explanation on hover. All 4 allocation rows and all 23 other stat rows have one. New stats should always get a hint | ✅ |
| 12 | Is nudging safety actually doing anything? | Yes, over a run (Plan C: 37% → 71% wins when nudging every quarter), but it was nearly invisible early: nudging 2027–2029 added only +0.4 research. Fixes: (1) the safety research row shows its rate, e.g. "low ▲0.5/yr", from the same `safetyRate` the sim uses; (2) safety research before Automated Coder now runs at 60–100% of full speed (was 30–100%), since human researchers carry it then. Balance roughly unchanged; rails ok | ✅ |
| 13 | (2026-11-11) Too easy: won racing China once and Plan A once, first try each | Measured: safe Plan A wins 100%. Humans beat the race bots (39%) because the readout tells them when to ease off. Plan: Step 5 (Pressure) | 📋 Step 5 |
| 14 | (2026-11-11) "Sometimes I'm just moving numbers around that aren't doing anything" | Confirmed. On Plan A, **every** split wins 100% (all capabilities, all safety, balanced, labs default). Most stats only matter at one threshold or only move the score. Plan: Step 4 (Teeth) | 📋 Step 4 |
| 15 | (2026-11-11) Losing shouldn't only come from China getting there first; the AI itself should be able to take over | Today Loss of Control is only checked at the moment of ASI. Planned: a quarterly takeover hazard from Superhuman AI Researcher onward, for US, Chinese and open models. Containment (security share) lowers it, and warning shots are its visible precursors. Owner also approved: Teeth before 3b, elections can end a deal or a moratorium, China's posture changes mid-run | 📋 Step 4.3b, Step 5.4 |

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

## Step 4. Teeth: every number does something (playtest #14)

**The rule:** every number on screen must (a) feed something that can change the ending, and (b) show what it is doing right now. A stat that can't pass both gets cut.

### Diagnosis (150 seeds, 2026-11-11)

| Plan A split | Win rate | Final alignment |
|---|---|---|
| All capabilities | 100% | 94 |
| All safety | 100% | 99 |
| Balanced | 100% | 98 |
| Labs default | 100% | 95 |

On Plan A the dial changes nothing. Under the ceiling, capability grows slowly, alignment climbs to ~95 by 2040, and the unpause takeoff can't pull it under 40.

**Per stat: what it actually touches today**

| Stat | Only effect | Problem |
|---|---|---|
| Capabilities share | Algorithm speed | Under a deal, anything above the ceiling is wasted, so the share is free |
| Inference share | GDP, trust, jobs | GDP only moves the score. Nothing in the race needs money |
| Security share | Theft check, which runs only while security < 3 | Above 3 it does nothing |
| Trust | Elections (losing costs −1 safety), Plan S gate, protests | Losing an election barely hurts |
| Tension | Taiwan crisis at 90, negotiation odds | Nothing happens between 20 and 90 |
| Jobs | Trust | Second-order flavor |
| Deal integrity | Collapse at 0 | "Recommit" always restores +30 for 2% GDP, so a deal never really dies |
| Alignment | One check at the moment of ASI | Banked early, it can't be lost, and a misaligned AI can never act before ASI |

Also: 23 of 34 decisions on Plan A make no measurable difference (playtest #6). Only the safety row shows its live effect.

### Changes

1. **Money buys chips.** US compute growth scales with the economy (inference share × trust), with a one-year lag. Capabilities = faster algorithms now; inference = more chips next year. That is a real tradeoff in a race, and it's AI 2040's story: revenue funds the datacenters.
2. **Under a deal, inspectors see your split.** A capabilities share above ~40% lowers deal integrity (Beijing reads it as preparing a breakout), so dumping share into capabilities has a cost. The labs' default of 70% erodes the deal unless you steer.
3. **Alignment has to be held, not banked.** Remove the free alignment gain while growth is slow. Alignment decays slowly toward "the model's own goals" as capability rises, unless safety share holds it. Plan A's 2040 unpause then becomes a real test of fifteen years of safety work.
3b. **The AI itself can take over, before superintelligence** (playtest #15). Today Loss of Control is only checked at the moment of ASI. Add a quarterly **takeover hazard** from Superhuman AI Researcher (8.8) onward:
   - It rises with misalignment and capability, and falls with **containment**. Containment is a second job for the security share (AI control: monitoring, sandboxing, no internet access).
   - It applies to **every** frontier model: the US model (alignment), **China's model** (cnAlignment), and open or rogue models (openness, rogue labs). A misaligned Chinese AI escaping is an AI takeover, not a Chinese one.
   - It can end the run at any time with Loss of Control. The Reveal names the cause: "your model", "China's model", or "an open model".
   - It's visible only through its precursors (Step 5 warning shots) and through the readout, which can lie.
   - So a Plan A run with a misaligned model at the ceiling can still be lost in 2036, and a race that "wins" against China can be lost to its own AI first.
4. **Security is continuous.** Replace the security < 3 threshold with a quarterly leak chance proportional to lead × (10 − security). The row shows it: "theft risk 12%/yr".
5. **Trust → elections with teeth.** Losing an election brings in an administration with the opposite doctrine: it pulls the split back to the labs' default, repeals a law (the 25% cap, chip tracking), and can leave a deal or lift a moratorium. Trust also gates the biggest moves (nationalizing, a moratorium, ratifying a deal).
6. **Tension is a ladder.** 50: China retaliates (cyberattacks, theft attempts). 70: China's posture hardens one step. 90: Taiwan.
7. **Recommit gets expensive.** Each recommit costs more and restores less; the third is not offered.
8. **Every row shows its live effect,** in a few words, from the same function the sim uses:
   ```
   capabilities  ▮▮▮▮▮▮▮▯▯▯  70%   lead +2 mo/yr
   safety        ▮▯▯▯▯▯▯▯▯▯  10%   ▲0.5/yr
   inference     ▮▮▯▯▯▯▯▯▯▯  15%   chips +18%/yr
   security      ▮▯▯▯▯▯▯▯▯▯   5%   theft risk 12%/yr
   ```
9. **Decision audit tool** (`npm run audit`): for each decision, flip the answer across 150 seeds per path and measure the win-rate change. Cut or merge any decision that moves nothing on any path.

### Success criteria (sim)
- On every path, the best and worst fixed splits differ by **≥ 30 points** of win rate.
- The labs' default split is never the best split on any path.
- Every remaining decision moves win rate by **≥ 3 points** on at least one path.
- Rails still pass.

---

## Step 5. Pressure: harder, richer scenarios (playtest #13)

**Why it's easy today:** China's intent is a coin flip at the start and never changes. Alignment risk shows up only at the very end. The readout is honest enough to steer by. The deal is safe once signed.

### Changes (each grounded in AI 2040)

1. **China adapts.** Its posture (cooperative / opportunistic / racing) moves with what you do: the lead, tension, sanctions, theft, how you treat a deal. Humiliate a cooperative China and it starts racing. A racing China that falls far behind may come to the table. The opponent becomes a system, not a seed.
2. **Keeping a deal is a fight.**
   - At home: labs and Congress lobby to loosen the ceiling while the economy grows slowly under it.
   - Abroad: compute outside the deal (Gulf, rogue labs) grows.
   - China's compliance depends on your verification and its posture.
3. **The readout lies more as models get smarter.** Deceptive bias grows with capability faster than general safety work shrinks it. Only interpretability (a decision line, or a fifth use of compute) keeps the readout honest late. The readout shows a range rather than one number, so the player decides under real uncertainty.
4. **Warning shots: the visible steps toward a takeover (Step 4, item 3b).** An escalating ladder of ambiguous incidents: a model sandbagging its evals, then an agent copying itself off a lab cluster, then an AI-enabled cyberattack nobody claims. They come from the same hazard, so more of them means real danger. Some are false alarms, though, and each one forces a costly response (pause and lose lead, or press on). Incidents can come from China's or open models too, and you can't always tell whose.
5. **Endings get stricter.** The alignment needed at superintelligence depends on how fast the final climb was: a fast takeoff needs more margin than a slow one. Flourishing also needs trust above a floor, because a public that rejects the transition doesn't get flourishing.
6. **Score per year** (carried from the old Step 5): ending quality × prosperity per year, so Plan A doesn't win on length alone.
7. **(Optional) Difficulty choice.** The hidden difficulty seed already exists. Show Normal / Hard on the launch screen.

### Success criteria (sim)

| Bot | Target win rate | Today |
|---|---|---|
| Safe Plan A | 45–65% | 100% |
| Skilled race (reactive) | 25–40% | 39–47% |
| Safe Burn the Lead | 40–60% | 14% |
| Random | < 10% | 9% |
| Any bot | ≤ 70% | 100% |

Plus a replay test: the owner plays Plan A and a race again and loses at least once.

---

## Step 6. Interactive map

Builds on Step 3 (and option D if chosen):
- Hover or click a country to see its stance, compute, and deal status.
- Place datacenters, inspectors or spies on countries.
- Visible spread: deal membership, halts, and defections propagate country to country.
- Covert sites appear only when intel finds them.

---

## Sources

- AI 2040 main scenario: https://ai-2040.com
- Takeoff Forecast: https://www.ai-2040.com/supplements/takeoff-forecast
- Capability Scaling Strategy: https://www.ai-2040.com/supplements/capability-scaling-strategy
- Compute in Plan A: https://www.ai-2040.com/supplements/compute-supplement
- Plan A Assumptions: https://www.ai-2040.com/supplements/plan-a-assumptions

Note: only the Plan A branch is written out in full on the site; Plans B, C, D and S are stubs at the 2029 fork. Their trajectories in the game have to be extrapolated from the no-deal default (AC ~2030, ASI ~1 year later).
