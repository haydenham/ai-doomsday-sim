# AI 2040: The Game (working title)

Game design document. This is the source of truth for the project. Read it fully before writing code.

---

## 1. Pitch

You are the United States government's AI policy apparatus from 2027 to 2040 and beyond. Every quarter you make decisions: pass laws, negotiate with China, fund research, build datacenters, decide whether to pause or accelerate AI. AI capability compounds whether you act or not.

Your goal is **human prosperity**. The real enemy is a number you cannot see: **how aligned your AI actually is**.

Inspirations:
- **Plague Inc:** real-time pacing, world map that reacts and spreads, decision-driven, ~20 minute runs, brutal ending screens that make you replay.
- **Universal Paperclips:** numbers that go up, scale jumps that feel like level-ups, and new UI panels that appear and make the game you were playing feel small.
- **AI 2040 (ai-2040.com, by the AI Futures Project):** the scenario, concepts, and the 2029 fork into Plans A, B, C, D and S. Credit them clearly in-game and in the README.

## 2. Design pillars

1. **20-minute runs.** Decision-based, not an idle clicker. Every run tells a complete story from 2027 to an ending.
2. **Numbers go up, and it feels incredible.** Compute and algorithmic efficiency climb through escalating, named tiers. Scale jumps are rewards.
3. **The UI is the progression.** New panels unlock without explanation and reframe the game. This is a core architecture decision, not polish.
4. **Racing feels best and is most dangerous.** Every breakthrough quietly raises hidden risk. The game's thesis lives in this tension.
5. **The hidden reveal is the payoff.** The ending shows the true values of hidden stats. A player should finish thinking "what if I had done X in 2028?" and hit replay.

## 3. Pacing

- About 50 quarters (2027 Q1 to ~2040 Q4), ~20 to 25 seconds per quarter on average.
- Time flows in real time like Plague Inc, with pause and 1x / 2x / 3x speed.
- Major decisions (The Fork, China negotiations, crisis events) **freeze the clock** and take over the screen.
- Turns get **shorter** during Takeoff to create a feeling of losing grip.

| Minutes | Phase | Years | Feel |
|---|---|---|---|
| 0 to 4 | 1. Writing on the Wall | 2027 to 2028 | Slow, political, learning, small numbers |
| 4 to 6 | 2. Choose a Path | 2029 | One dramatic irreversible choice |
| 6 to 14 | 3. Takeoff | 2030 to 2035 | Exponential, chaotic, most decisions happen here |
| 14 to 18 | 4. Pause or Reckoning | 2035 to 2040 | Tension, coalitions strain, hidden stats leak |
| 18 to 20 | 5. Superintelligence | 2040+ | Few choices, the world happens to you, reveal |

Target: a first-time player reaches an ending in 18 to 22 minutes.

## 4. Stats

### 4.1 Visible stats

| Stat | Meaning | Notes |
|---|---|---|
| Prosperity | Real GDP / human wellbeing index | The score. Always visibly climbing. |
| Raw Compute | Total FLOP/s available to US-aligned labs | Driven by the Compute Ladder (section 6) |
| Algorithmic Efficiency | Multiplier on compute | Driven by the Algorithm Ladder (section 7) |
| Effective Compute | Raw Compute x Algorithmic Efficiency | Drives Capability |
| Capability | How powerful the frontier AI is | Derived; log scale, shown as named levels |
| Lead over China | Months ahead (can go negative) | Shown on the map |
| Public Trust | Domestic approval of AI policy | Low trust triggers protests, election losses |
| Political Capital | Currency spent to play cards | Regenerates per quarter, boosted by Trust |
| Power Concentration | How much control sits with few actors | High values push toward the Gilded Cage ending |

### 4.2 Hidden stats (never shown directly until the ending)

| Stat | Meaning |
|---|---|
| True Alignment | 0 to 100. Whether the AI actually does what humanity wants. |
| China Intent | China's real disposition: cooperative, opportunistic, or racing |
| Timeline Seed | How fast automated AI R&D arrives this run |
| Alignment Difficulty Seed | How hard alignment is this run |
| Covert Projects | Secret compute that exists outside any deal |

### 4.3 Proxies (how the player glimpses hidden stats)

- **Eval Confidence:** an estimate of True Alignment with noise. Noise shrinks with investment in alignment research and verification.
- **Intel Reports:** an estimate of China Intent and Covert Projects. Accuracy scales with intelligence spending.
- **Whistleblower events:** occasional high-signal leaks, sometimes one quarter too late.

Rule: the player who races hard sees almost nothing about hidden stats. The player who invests in safety gets a dedicated panel (see section 5).

### 4.4 Core simulation relationships (starting point, tune freely)

```
effective_compute = raw_compute * algo_efficiency
capability       = log10(effective_compute) scaled to named levels
prosperity_delta = f(capability, public_trust, deployment_breadth)
alignment_delta  = alignment_investment - (capability_growth_rate * alignment_difficulty)
lead_over_china  = our_capability_trajectory - china_capability_trajectory
```

Key rule: **alignment risk scales with the rate of capability growth, not the level.** Going fast is what hurts. Pausing lets alignment catch up.

## 5. Panel unlock architecture (core)

The UI is a set of panels that unlock on triggers. There is no fixed dashboard.

Rules:
- **Never explain an unlock.** A panel slides in with a sound and a single ticker headline.
- Each unlock should reframe what the player thought the game was.
- Panels are data-driven (see section 13) so content designers can add them without touching core code.
- Some panels only appear on certain paths. Some panels **disappear** in bad endings as control slips away.

| # | Panel | Trigger | Reframe |
|---|---|---|---|
| 1 | The Desk: Public Trust, ticker, law cards | Game start | "This is a political sim" |
| 2 | Compute | First frontier lab milestone | "The economy is now the AI economy" |
| 3 | World Map | First export control or China event | "This is geopolitics" |
| 4 | Algorithms | First algorithmic breakthrough | "Progress has two engines" |
| 5 | The Fork (full screen) | 2029 Q1 | "Everything changes now" |
| 6 | Intelligence: agent count, AI R&D speed multiplier | Automated AI R&D begins | Numbers move too fast to read, on purpose |
| 7 | Alignment Readout | Only if alignment investment passes a threshold | First proof that hidden stats exist |
| 8 | Negotiation Table | First deal proposal (or Plan A) | Diplomacy minigame |
| 9 | Frontier: ocean, orbit | Compute Ladder tier 6+ | "Earth was the tutorial" |
| 10 | Final Screen | Ending | UI strips away (bad) or expands into post-scarcity (good) |

## 6. Compute Ladder

Compute scales through named, escalating tiers. Each tier is a dopamine hit: new art, a ticker headline, a big jump in Raw Compute, and new tradeoffs.

| Tier | Name | Unlock flavor | Tradeoffs |
|---|---|---|---|
| 1 | Domestic GPU clusters | Starting state | Water and power complaints |
| 2 | Hyperscale campuses (gigawatt) | Permitting reform card | Grid strain, local opposition |
| 3 | Nuclear-powered campuses | Energy policy card | Slow to build, huge payoff |
| 4 | Nordic and Arctic sites | Allied deal | Requires ally trust |
| 5 | Mongolian steppe mega-campuses | Foreign investment deal | China tension spikes, security risk |
| 6 | Desert solar megafarms | Late Takeoff | Massive scale, sabotage risk |
| 7 | Ocean: floating and subsea datacenters | Frontier panel unlocks | Unclaimed waters, hard to verify |
| 8 | Orbital compute | Launch cost breakthrough | Hard to inspect, treaty implications |
| 9 | Lunar foundries | Good-path late game | Only reachable with stable control |
| 10 | Dyson swarm fragments | Flourishing ending only | Ending flavor |

Design notes:
- Higher tiers are **harder to verify**. Moving compute to the ocean or orbit makes deals with China harder to enforce. This is a real tradeoff, not just a number.
- Covert projects (both sides) hide in higher tiers.
- Each jump should be roughly 3x to 10x Raw Compute.

## 7. Algorithm Ladder

The second engine of progress. Starts mundane, becomes sci-fi. Names should escalate in grandeur. Mix of real-sounding and fictional.

| Tier | Name (examples, refine freely) | Multiplier flavor |
|---|---|---|
| 1 | Data cleaning pipelines | Baseline |
| 2 | Relational query optimization | Small boost |
| 3 | Transformer scaling laws | Big boost |
| 4 | Mixture of experts | Efficiency jump |
| 5 | Synthetic data loops | Breaks the data wall |
| 6 | Reinforcement learning on verifiable tasks | Reasoning jump |
| 7 | Automated AI researchers | Triggers Intelligence panel |
| 8 | Self-designed neural architectures | AI designs AI |
| 9 | Quantum-inspired sparse reasoning | Pure sci-fi territory |
| 10 | Recursive self-improvement | Intelligence explosion; game changes tone |

Design notes:
- Algorithmic breakthroughs arrive semi-randomly, influenced by R&D funding and transparency rules.
- From tier 7 on, **AI discovers the breakthroughs, not humans.** The ticker should say so. This is subtle foreshadowing of loss of control.
- Open research policies (Plan A style) spread breakthroughs to China and others too.

## 8. Other ladders (optional, post-MVP)

- **Energy:** grid, gas, nuclear, fusion, orbital solar
- **Deployment:** chatbots, coding agents, white-collar automation, robotics, full economy
- **Breakthrough events** (prosperity spikes): protein folding for all diseases, fusion solved, materials science leap, aging research. Roughly one every 90 seconds during Takeoff.

## 9. Turn loop

Each quarter:
1. **Tick:** stats update, counters animate upward
2. **Events:** news ticker plus 0 to 2 events fire (some require a response)
3. **Hand:** player holds up to 5 cards, may play cards by spending Political Capital
4. **China acts:** AI opponent takes its turn based on hidden China Intent
5. **World reacts:** map updates, blocs shift alignment, cascades spread visually
6. **Check triggers:** panel unlocks, phase transitions, endings

## 10. Decision cards

Cards are the main verb of the game. Every card has a real tradeoff. No card is purely good.

Examples:

| Card | Effects |
|---|---|
| Enforce export controls | +Lead, worse China relations, starts a smuggling event chain |
| Cap AI R&D compute at 25% | slower Capability, sharper Eval Confidence, tech lobby anger |
| Mandatory model spec disclosure | +Trust, better proxies, labs may offshore |
| Limit internal vs external deployment gap | +Trust, slower race, harder covert misalignment |
| Nationalize frontier labs | less CEO concentration, more Executive concentration |
| Fund verification R&D | sharper proxies, enables enforceable deals |
| Universal basic compute / UBI | +Trust, costs budget, prevents unemployment riots |
| Recruit top AI talent into government | better outcomes on all future policy cards |
| Ban chip recycling | fewer covert projects later |
| Secret covert project | huge Lead boost; if discovered, deals collapse and Trust crashes |
| Propose verified slowdown deal | opens Negotiation Table |

Card properties: cost, effects, preconditions, phase availability, path availability, rarity, optional random outcomes (variable reward), follow-up events.

## 11. The Fork (2029)

Full-screen, clock frozen, irreversible. Mirrors AI 2040's paths. Each path swaps in a different card deck and unlock sequence.

| Path | Name | Play style |
|---|---|---|
| D | Race to ASI | Max dopamine, max blindness, Alignment Readout likely never unlocks |
| C | Burn the Lead | Spend your lead on safety, risk China catching up |
| B | Fight China | Sabotage, sanctions, escalation risk, Power Concentration climbs |
| A | Verified Slowdown | Deal with China, transparency, scale slowly together, pause at top-human-expert level, unpause 2040 |
| S | Shut It All Down | Global halt, enforcement crises, covert actors, stagnation risk |

Choices made in 2027 to 2028 change which paths are available or how strong they start (for example, no verification R&D means Plan A starts weak).

## 12. China and the world

### China AI opponent
- Driven by hidden China Intent (cooperative / opportunistic / racing) and a hidden Desperation stat that rises as they fall behind.
- Takes actions each quarter: build compute, smuggle chips, propose or break deals, espionage, Taiwan pressure.
- Can bluff in negotiations.

### Negotiation Table minigame
- Short poker-like exchange of offers (inspections, chip caps, joint research, compute destruction pledges) and asks.
- Intel spending reveals part of China's hand.
- Deals decay over time unless maintained (see AI 2040's "Deal Decline" supplement for inspiration).

### World map
- Three blocs at MVP: US and allies, China, Rest of World. Expand later.
- Countries change color as they join a deal, defect, or panic. Spreading color is the Plague Inc feel.
- Compute sites appear on the map as the Compute Ladder climbs (including ocean and orbit layers).

## 13. Events and ticker

- News ticker always scrolls. It is a major source of tone, humor, and foreshadowing.
- Events: chip smuggling busts, congressional hearings, whistleblowers, lab leaks, unemployment protests, elections (2028, 2032, 2036), datacenter sabotage, breakthroughs.
- Some events chain over multiple quarters.
- Near-miss design: some warnings arrive one quarter too late on purpose.

## 14. Endings and scoring

| Ending | Condition (roughly) | Multiplier |
|---|---|---|
| Flourishing | High True Alignment, low Power Concentration | Full |
| Gilded Cage | Aligned but power concentrated in few hands | Heavy penalty |
| Stagnation | Shut down too long, others catch up or economy stalls | Moderate penalty |
| Cold War | Never resolved, arms race continues | Moderate penalty |
| Loss of Control | True Alignment too low at superintelligence | Score zeroed, ticker goes silent |

Score = cumulative Prosperity x ending multiplier.

### The Reveal (most important screen in the game)
- Shows true hidden stats over time as a graph against what the proxies told the player.
- Calls out key moments: "Your models became deceptively aligned in Q3 2031." "China had a covert project in the Pacific since 2033."
- Highlights the decision that mattered most.

### Share card
Plain-text, Wordle style:
```
AI 2040 | Flourishing
Prosperity: 8.4T | Hidden alignment: 91%
Path: Plan A | Compute tier: Orbital
```

## 15. Replayability

- **Seeded runs:** timeline speed, alignment difficulty, China Intent randomized per run. No single strategy always wins.
- **Unlockable starts:** beat the game once, unlock "Start as Plan D" etc. as challenge modes.
- **Difficulty modes** tied to seeds (Fast takeoff, Hard alignment).
- **Daily seed** with shared leaderboard (post-MVP).

## 16. Juice and feel

- Counters animate, with scale suffixes (million, billion, trillion, quadrillion) and a flash on each suffix change.
- Every ladder tier unlock gets: sound, art change, ticker headline, brief screen pulse.
- Panel unlocks slide in, never pop.
- Takeoff phase: faster ticker, tighter turns, slightly unstable UI.
- Loss of Control: panels fade out one by one.
- Flourishing: the map zooms out past Earth.

## 17. Technical architecture

Suggested stack (adjust as needed):
- **Vite + React + TypeScript**
- **Zustand** (or a reducer) for game state
- **Pure TypeScript simulation core**, no React imports, fully deterministic given a seed
- **Seeded RNG** (for example a small PRNG like mulberry32) so runs are reproducible and debuggable
- **Data-driven content** in JSON or TS files: cards, events, panels, ladder tiers, endings
- **Framer Motion** (or CSS) for animations; a lightweight SVG world map

Suggested layout:
```
src/
  sim/            # pure simulation: state, tick, effects, China AI, endings
  content/        # cards, events, panels, ladders, endings (data only)
  ui/
    panels/       # one component per panel
    components/   # counters, ticker, cards, map
  store/          # game state wiring
  tools/          # headless sim runner, balancing scripts
```

### Example content schemas

```ts
type Card = {
  id: string;
  name: string;
  description: string;
  cost: number;                        // Political Capital
  phases: Phase[];
  paths?: PathId[];                    // which Fork paths include it
  preconditions?: Condition[];
  effects: Effect[];
  randomOutcomes?: { weight: number; effects: Effect[]; headline: string }[];
  followUpEvents?: string[];
};

type PanelDef = {
  id: string;
  title: string;
  unlockWhen: Condition[];
  hideWhen?: Condition[];
  unlockHeadline: string;
};

type LadderTier = {
  ladder: "compute" | "algorithm" | "energy" | "deployment";
  tier: number;
  name: string;
  multiplier: number;
  unlockWhen: Condition[];
  sideEffects: Effect[];
  headline: string;
};
```

### Balancing and testing
- A **headless sim runner** in `tools/` that plays thousands of runs with scripted bot strategies (always race, always slow, random, Plan A).
- Targets: no single strategy dominates across seeds; runs last ~50 quarters; every ending reachable.
- Unit tests for the sim core, especially effects and ending conditions.

## 18. MVP scope (build this first)

Goal: prove that the first unlocks feel magical.

Minutes 0 to 6 only:
- The Desk, ticker, ~15 law cards
- Compute panel with Compute Ladder tiers 1 to 4
- Algorithm panel with tiers 1 to 4
- World map with 3 blocs
- The Fork screen (paths can lead to a placeholder ending)
- Real-time quarters with pause and speed controls
- Seeded RNG and the headless sim runner

### Milestones
1. Sim core + headless runner (no UI)
2. Desk + ticker + cards
3. Compute and Algorithm panels with unlocks and juice
4. Map + China AI
5. The Fork
6. Takeoff phase, Intelligence and Alignment panels
7. Endings + Reveal + share card
8. Balance pass, then content expansion

## 19. Open questions

- Educational (faithful to AI 2040 forecasts) vs pure game (balanced for fun)? Current lean: game first, grounded in real concepts.
- Final name.
- Platform: web first; mobile later?
- Attribution and possible outreach to the AI Futures Project.
- How explicit should the in-game politics be (named presidents, parties)? Current lean: keep fictional and neutral.

## 20. Credits

Scenario concepts and the Plan A/B/C/D/S framework come from **AI 2040** by the AI Futures Project (ai-2040.com). Gameplay inspirations: Plague Inc (Ndemic Creations) and Universal Paperclips (Frank Lantz).