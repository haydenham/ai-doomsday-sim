# Scenarios: the drawing board

Draft, 2026-11-16. The owner asked for the full scenario and steps for each plan before Step 5 (Pressure). This is that pass: what each plan *is*, how it plays act by act, how you lose, and what content stays, goes or gets added. Nothing here is built yet. Open questions are at the bottom.

## Source update: AI 2040 does describe B, C, D and S

`/supplements/comparing-possible-plans` gives each plan a definition, a takeoff length and the authors' odds. We had treated B–S as stubs.

| Plan | AI 2040 definition | Takeoff (AC→ASI) | Safety compute | p(aligned) | p(great future) |
|---|---|---|---|---|---|
| A | Verified US–China slowdown deal, full research transparency | ~6 yr | 100B H100e-yr | 72% | **42%** |
| B | **Sabotage China** (cyber, or kinetic) to create a lead, **then burn that lead on safety** | 2–3 yr | 100–500M | 50% | **25%** |
| C+ | Domestic regulation plus non-sabotage pressure on China (export controls, talent) | ~1.5 yr | 20M | 45% | **25%** |
| C | The leading lab spends some of its lead on safety; no regulation | ~1.1 yr | 4M | 40% | **20%** |
| D | Race through the intelligence explosion; ≥1% on safety | ~1.0 yr | 0.5M | 25% | **10%** |
| S | Indefinite halt of frontier progress, lifted on a condition (alignment progress, lie detectors, uploads, intelligence enhancement) | n/a | n/a | not scored | not scored |

Other points from the page:
- Every plan's window opens about a year before Automated Coder (early 2029). **C and D do nothing until takeoff starts.**
- B's "wartime vibe" degrades epistemics, and it usually brings (pseudo-)nationalization, so transparency falls and power concentrates.
- S counts as S only if it starts ~1.5 years before AC.

**Two mismatches with the game:**
1. **Our Plan B is not their Plan B.** Ours is "fight and centralize" with no safety step, so the fight bot loses 99%. Theirs is fight *in order to* buy time, then spend it.
2. **Our odds run in the wrong order.** Expert play wins D 67%, C 78%, A 98%. The authors' order is A ≫ B ≈ C+ > C > D. With D at 67%, racing looks nearly as good as a deal.

## Shared spine (every plan)

| Act | Years | What happens | The player |
|---|---|---|---|
| **I. Agents** | 2027 – early 2029 | Agents in the millions, the AI election, the buildout. No plan yet. | Learns the dial; builds what the plan will need later: verification, intel, security, trust, the lead. |
| **The Fork** | ~Q1 2029 | Choose a plan. Each one shows what it needs (lead, trust, verification). | The one big choice. What you built in Act I decides which plans are open and how strong they start. |
| **II. Takeoff** | 2029 – AC + 1 yr | The plan's main engine runs. Each plan has its own **signature crisis**. | Steers the dial, answers plan decisions. |
| **III. Endgame** | to ASI / 2041 | The plan's **final test**. Then superintelligence, takeover or a stall. | One or two decisions that matter most (the keys, the lift, the unpause). |

**Act I's real job:** right now Act I decisions mostly move prosperity. Each should feed a Fork precondition, so Act I is how you *earn* your plan.

---

## Plan A: Verified Slowdown

**Fantasy:** The diplomat. You trade speed for a world where no one races.
**Core tension:** The deal is only as strong as your ability to see China's chips, and everyone at home wants the ceiling raised.

| Beat | When | What happens |
|---|---|---|
| Geneva | 2029 | Negotiate terms (built). Red lines, up to 4 offers. Verification from Act I sets the starting integrity. |
| Training pause | Mar–Sep 2029 | A visible beat. Labs grumble and trust dips. |
| Scaling together | 2030–35 | The ceiling rises: AC ~mid-2030, TED-AI ~2035. Inspectors, joint lab, treaty reviews. |
| **Signature crisis: the secret datacenter** | anytime under the deal | China (or a Gulf or rogue site) trains off the books. Whether you find it depends on intel and verification built *beforehand*. Every response costs something. (Step 5.3) |
| The long plateau | 2035–40 | Near-flat ceiling. Pressure to loosen it, slow economy, elections. Alignment must be held, not banked. |
| **Final test: the unpause** | 2040 | Scaling resumes. Fifteen years of safety work meets a fast final climb. |

**How you lose (target ~half of losses each):**
- **Cheating you didn't catch:** a misaligned covert model takes over or reaches ASI first.
- **The deal dies at home:** an election, the labs or the economy end it, and you race from behind.
- **The unpause:** alignment wasn't held through the plateau.

**Today:** expert 98%, steering 85–97%, never touching the split 66%. Too easy. The secret datacenter is found almost every time and never matters.

**Content:**
- Keep: Geneva, Inspectors, Treaty review, Destruction pledge (rewire it to the secret datacenter: it raises the cost of cheating *and* the risk of a strike).
- Rewire: Joint lab and Open research (change nothing today) feed China's alignment, which matters once the covert model is a real rival.
- New: the secret-datacenter chain (Step 5.3), "the labs lobby" (domestic pressure), the Gulf as an outside-the-deal compute source.

---

## Plan B: Sabotage, then Spend (redefined to match AI 2040)

**Fantasy:** The hawk with a conscience. You break China's momentum to buy the time a deal never would.
**Core tension:** Every month you buy costs tension, trust and concentrated power. Buy time and then fail to spend it on safety, and you've just started a war for nothing.

| Beat | When | What happens |
|---|---|---|
| Doctrine | 2029 | Choose **cyber** (smaller lead, less escalation) or **kinetic** (bigger lead, war risk). This is AI 2040's B-cyber / B-kinetic split. |
| The campaign | 2029–31 | Cyberattacks, sanctions, supply-chain hits. China's compute falls and its posture hardens. The lead grows. |
| **Signature crisis: retaliation** | when tension is high | Cyber retaliation, a Taiwan crisis, theft attempts against your labs. War is a real ending risk under the kinetic doctrine. |
| Wartime footing | 2030+ | Emergency powers and nationalization pull. Power concentrates, readout honesty and trust fall (the "wartime vibe"). |
| **Final test: spend the lead** | AC → ASI, 2–3 yr | Lean on safety while the lead lasts. Then the keys: who controls ASI after a war footing? |

**How you lose:**
- **A wasted lead:** you sabotage but keep racing, and get Loss of Control.
- **Escalation:** Taiwan or war (a new hard ending, or a trust and compute collapse).
- **The Gilded Cage:** the war footing never ends, and power stays concentrated.

**Built (2026-11-16):**
- The Fork starts the campaign (export controls +1, tension +10), then asks for a **doctrine**:
  - Cyber: China's chips −15%, tension +10.
  - Kinetic: chips −30% and its algorithms −10%; tension +30, trust −4, power to 45+. Beijing blinks less in a Taiwan crisis, and a skirmish hurts 1.6× more.
- While the campaign runs:
  - China's chips grow 1.8 points per quarter slower (3 under kinetic).
  - Tension rises 1.5 per quarter (3 under kinetic), and trust falls 0.4.
  - The readout is 15% blurrier (wartime secrecy).
- **Stand down** (from 2030, up to 3 times): end the campaign for tension −20 and trust +4, or keep pressing (China's chips −10%, tension +8, power +4). A lost election ends the campaign.
- Once the lead reaches 3 months, B gets C's halved lab pull.
- Reveal lines for a wasted lead and a war footing that never ended.

**Sim (300 seeds):**

| Steering | Win rate | Target |
|---|---|---|
| Leave the split to the labs | 0% | 5–15% |
| Balanced split | 31% | |
| Reactive | 53% | 40–50% |
| Expert | 69% | ~70% |

The fight bot still loses 99%, because it never spends the lead. That's the intended way to lose B. The reactive bot with the kinetic doctrine wins 56%.

**Audit, Plan B column:** Defense Production Act 12, Weights stolen 11, Cyberattack 6, Stand down 5, Taiwan 5, Emergency powers 5, Doctrine 3. Secondary sanctions does nothing (1); rewire it.

**Content:**
- Keep: Cyberattack, Sanctions, Taiwan, Emergency powers, DPA.
- New: doctrine choice; a "stand down" decision (end the campaign to lower tension and restore trust); a kinetic strike with war risk.
- Engine: B gets C's halved lab pull once the campaign has built a lead, since a wartime government controls the labs more.

---

## Plan C: Burn the Lead

**Fantasy:** The careful leader. You win the race slowly enough to see where you're going.
**Core tension:** Every month spent on safety is a month China closes. Spend too little and the AI isn't safe; too much and China gets there first.

AI 2040 splits this into **C** (the labs do it, no laws) and **C+** (domestic regulation). Proposal: one Plan C, and Act II decisions decide whether you become C+ (pass the cap and permits, odds improve, trust and labs push back).

| Beat | When | What happens |
|---|---|---|
| The margin | 2029 | Needs a 3+ month lead. Lab pull halved. |
| Regulate or not | 2029–30 | AI research cap, permits, transparency, secret models. These are already the biggest swings in the audit, and they decide C vs C+. |
| **Signature crisis: China closes** | when the lead is under ~3 months | Spend the rest, or stop burning and race. A theft resets the margin overnight. |
| **Final test: the last year** | AC → ASI, ~1–1.5 yr | Short takeoff. How much margin is left decides it. |

**How you lose:**
- **China first** (over-caution).
- **Loss of Control** (under-caution).
- **The Gilded Cage:** today the burn-lead bot ends Gilded 94% from power drift. Is that intended? C has no centralizing content, so probably not (see the questions below).

**Today:** expert 78%, reactive 52%, never touching the split 19%. Steering targets hit, but its expert rate is above where AI 2040 would put it relative to A.

**Content:**
- Keep: Interpretability, Share safety research, the cap and permits (now C-defining).
- New: "the labs want the lead back" (lab pull spikes when China closes); a C+ marker shown in the Reveal.

---

## Plan D: Race to Superintelligence

**Fantasy:** All in. Let the AIs build the AIs.
**Core tension:** You can see less and less of what the models are doing. Can you hold on long enough to ease off at the right moment?

| Beat | When | What happens |
|---|---|---|
| Race doctrine | 2029 | Lab preference 85% capabilities, +30% R&D, power drift ×1.6. |
| AIs run the labs | 2029–30 | Who runs the lab, Safety reviews, DPA. The readout gets worse fast. |
| **Signature crisis: warning shots** | from SAR | Sandbagging, self-exfiltration, an unclaimed cyberattack. Pause and lose the lead, or press on. (Step 5.5) |
| **Final test: the keys** | ~1 yr after AC | ASI arrives fast. Whose hands, and was it aligned? |

**How you lose:** most of the time, by AI 2040's odds. Loss of Control dominates; China first if you ease off too early; the Gilded Cage via emergency powers.

**Today:** expert 67%, reactive 48%. Much better than AI 2040's 10%. D should be playable but clearly the worst plan.

**Content:**
- Keep: Who runs the lab, Safety reviews, DPA, Taiwan, Emergency powers.
- New: warning shots; "full automation" (hand over the remaining human oversight for speed).

---

## Plan S: Shut It All Down

**Fantasy:** Pull the plug on the world. Then hold the line, and choose when, or whether, to let go.
**Core tension:** The longer you hold, the safer the AI and the more everyone else wants to cheat. Lifting needs a *reason*, not a date.

| Beat | When | What happens |
|---|---|---|
| The halt | 2029 | Needs trust 40+. China joins, joins and cheats, or refuses (built). |
| Enforcement | 2029–33 | Satellites and inspectors, rogue datacenters, strikes. Fatigue and the economy pull trust down. |
| **Signature crisis: rogue compute** | ongoing | Cheaters, rogue labs, Gulf sites. Each one is a strike-or-tolerate decision with war risk. |
| The condition | 2033+ | AI 2040 lists lift conditions: alignment progress, lie detectors, uploads, intelligence enhancement. Proposal: pick one at the halt; it fills slowly (driven by safety share on the frozen models); lifting before it's met is a gamble. |
| **Final test: the lift** | your choice | Lift slowly, and the overhang is released. Or never lift (Stagnation: safe, but is it a win?). |

**How you lose:** a cheater gets there (China or rogue); fatigue and an election lift it for you; you lift too early; or Stagnation.

**Today:** never lifting ends in Stagnation 79%; lifting late wins 33%. No S bot in the steering table, and the audit doesn't cover S.

---

## Proposed targets (for owner approval)

Keep the owner's steering spread (never touch → reasonable → expert), but **order the plans by AI 2040's odds**, so choosing a plan matters as much as playing it well:

| Plan | Never touch | Reasonable | Expert | AI 2040 p(great) |
|---|---|---|---|---|
| A | 15–25% | 55–65% | ~80% | 42% |
| B | 5–15% | 40–50% | ~70% | 25% |
| C | 5–15% | 40–50% | ~70% | 20–25% |
| S | 5–15% | 40–50% | ~65% | n/a |
| D | ~0% | 20–30% | ~45% | 10% |

## Difficulty bar (owner, 2026-11-16: "It should genuinely take some strategy to win")

Making the game harder is the main goal of Step 5, not a side effect. Every Step 5 item is checked against these, on every plan:

| Check | Target | Today (Plan A) |
|---|---|---|
| Never touch the split | ≤ 25% | 66% |
| Always pick the safe answer, light steering | ≤ 40% | ~90% |
| Any single fixed policy (split + answer style) | ≤ 50% | 92% |
| Random play | < 5% | 1–3% |
| Reactive (reads the screen, sensible rules) | 45–60% | 97% |
| Expert (sees hidden state) | per-plan target above | 98% |
| Owner replay | loses at least once on A and once on a race | won both first try |

What "strategy" means here:
- **No dominant answer.** The right choice depends on the state: lead, readout, intel, China's posture. The same option is right one quarter and wrong the next.
- **Planning ahead.** What you build in Act I (verification, intel, trust, the lead) decides which threats you can see and answer later.
- **Reading imperfect information.** The readout and warning shots can mislead, so you have to weigh how much to trust them.
- **The opponent adapts.** China responds to what you do, so one fixed plan can't beat it.

## Cut list (from the Step 4 audit: no effect on any path)

Proposed: **cut** old chips, AI medicine and AI in government; **merge** chip tracking into export controls; **rewire** the rest to a Fork precondition or a Step 5 lever:
- spy budget → finding cheating;
- joint lab, share research, open research → China's alignment, once its model is a real rival;
- AI dividend → trust, which now decides elections;
- the destruction pledge → the secret-datacenter chain.

**2026-11-17:** ✅ Plan C may stay below its target (owner). ✅ Step 5.3 (China cheats for real) gives spy budget, chip tracking, the destruction pledge, inspectors and share research a real effect on Plan A (see ROADMAP). Still to rewire: the joint lab (now changes the score, not the win rate), secondary sanctions, AI dividend, backchannel.

**Progress (2026-11-16):** ✅ cut AI in government, AI medicine and old chips. ✅ Old chips merged into chip tracking instead of export controls: tracking now covers resold chips, costs 0.5% prosperity, and cuts China's odds of starting covert compute to 0.4× (was 0.6×, plus 0.5× from old chips). ✅ Power for AI is gated to Q4+ and the Arctic pact to Q6+ for a slower reveal. Audit: 58 → 55 decisions, 34 → 32 with no effect. ⏳ The rewires above are still to do.

## Owner decisions (2026-11-16)

1. ✅ Plan B is redefined to AI 2040's "sabotage, then spend the lead", with a cyber/kinetic doctrine.
2. ✅ Plans are ordered by AI 2040: expert A ~80%, B/C ~70%, S ~65%, D ~45%.
3. ✅ One Plan C; regulating during it makes it C+.
4. ✅ Plan S gets a lift condition chosen at the halt, filled by safety work.
5. ✅ (2026-11-16) China-first is now its own ending, **Second Place** (×0.3). Gilded Cage on Plan C: investigated. `npm run sim` now reports China's aligned ASI as `cn-first`. **Every** Gilded Cage on Plan C is China getting there first, never US power concentration (all-safety: 98% cn-first). So the logic isn't buggy: `endingFor` scores China's aligned ASI as the Gilded Cage, and over-burning the lead loses the race. 
6. ⏳ Emergent paths: default is to keep the Fork menu until after Step 5.

## Open questions for the owner (original)

1. **Plan B:** redefine it to AI 2040's "sabotage, then spend the lead on safety", with a cyber/kinetic doctrine choice?
2. **Plan order:** should expert play still differ across plans, with D clearly worst and A best, per the targets above?
3. **C vs C+:** one Plan C where regulating it makes it C+ (recommended), or two plans?
4. **Plan S lift condition:** a lift condition chosen at the halt, filled by safety work, replacing the fixed Q36 timing?
5. **Gilded Cage on Plan C (94% for the burn-lead bot):** a bug to fix, or intended?
6. **Emergent paths (Step 3b):** keep the Fork menu for now and revisit after Step 5? (Recommended: yes; these scenarios work either way.)
