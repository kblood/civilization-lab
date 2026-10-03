# Civilization Lab specification v1 (civ-spec-1)

Status: **design specification, nothing implemented yet.** Written 2026-10-04 by
Opus 5.5 (judge and synthesiser) from four competing designs and the merged
research in [research-2026-10-04.md](research-2026-10-04.md). References of the
form "research T3.9" mean *Topic 3, merged finding 9* of that synthesis;
"trap 12" and "OQ 5" mean its Traps and Open questions lists. This document adds
no new web research. Anything marked **[scenario]** is an authored, uncalibrated
model choice, not a research finding.

The binding determinism rules in [README.md](../README.md) and
[AGENTS.md](../AGENTS.md) apply to everything below.

---

## 0. Judging the four designs

Four designs were submitted:

| ID | Designer | Angle |
|---|---|---|
| D1 | Opus 5.5 | Levels and time: six scale levels (Reach, Lineage, World, Polity, Settlement, Household), "history refines down, environment aggregates up", budgets plus salience closure. |
| D2 | Opus 5.5 | Events, history and causality: one authoritative planet history (P), an append-only content-addressed event log with a causal DAG, episode-keyed hazard thresholds, and a galactic ledger coupled through a "contact horizon". |
| D3 | Astra (gpt-6-astra) | Minimal theoretical MVP: one causal solver on a fixed ten-year clock, eight regions, two planets, one colonisation route, and per-decade transition ledgers that finer views must reproduce exactly. |
| D4 | Astra (gpt-6-astra) | Atlas integration as a platform: refinement contracts, an `AtlasView` adapter with known/absent/unsupported results, civilisation *overlays* written back as derived data, bounded history domains, and an API for other games. |

### Scores (1 = poor, 5 = strong)

| Criterion | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| Levels that hold together | 4 | 4 | 5 | 4 |
| Determinism and replay | 5 | 5 | 4 | 4 |
| Testability in a theoretical lab | 3 | 4 | 5 | 3 |
| Plausibility, stone age to space age and extinction | 4 | 5 | 2 | 3 |
| Platform fitness for Atlas | 4 | 4 | 2 | 5 |
| **Total** | **20** | **22** | **18** | **19** |

Reasons:

- **D1** is the most rigorous about time and RNG. But it makes *two* coarse
  levels canonical (Lineage milestones, then a World arc bridged to them), and
  the Polity level must then be *steered* toward the World's numbers, with
  "forced transitions" as a quality alarm. That is a lot of machinery to keep
  levels consistent, and D1 itself names the risk that it suppresses emergence.
  Six levels is also a large first test surface.
- **D2** gives the best plausibility: the richest event catalogue, the "time of
  perils", separate outcome classes, and causality as data. Its hazard design
  (one threshold per episode, exact in-tick dating) is the cleanest answer to
  traps 12 and 16. It loses a point on testability for its size, and its
  variable tick length (100, 10, then 100 years) adds a switch that must be
  tested for no gain in the lab.
- **D3** has the smallest and most provable level contract: a single solver
  owns every causal fact, and finer views are exact projections with zero
  tolerance. But it draws a fresh Bernoulli trial per decade (so the result
  depends on the step size), uses SHA-256 for every draw, and models only two
  planets, 20,000 years and one fixed route, which is too little to show stone
  age to space age.
- **D4** is the right shape for the platform: refinement contracts,
  availability states, fixture/live adapter parity, overlays, layer-off goldens
  and the bounded-domain honesty rule. As a *lab* design it is too large (seven
  spatial levels down to streets, one-year causal coupling) and it reuses
  Atlas's RNG streams, which couples civilisation history to Atlas RNG
  refactors.

**Synthesis.** The spec takes D2's authoritative planet history and event
model as its spine. It uses D3's single-solver, fixed-clock and exact-ledger
discipline to keep the levels small and provable. It takes D1's time ladder,
RNG encoding and budget rules. It takes D4's platform contract for everything
that touches Atlas. Section 13 records what each rejected idea contributed.

---

## 1. Architecture in one page

```
                  ABSTRACTION ->  causal state | event log | causal DAG | views/indices | narrative (N)
SCALE
 D  Domain ledger (bounded set of star systems)     owns: voyages in transit, arrivals, signals,
    event-driven, integer years                      contact, lineage outcomes, cross-body messages
       ^ published outputs          | inbound messages (latency >= 1 tick)
       |                            v
 P  Planet strategic history  == THE ONE CAUSAL SOLVER ==   AUTHORITATIVE
    one P entity per inhabited body-episode; fixed decade tick;
    state includes a FIXED region partition (8..32 regions), polities,
    per-region tech domains, energy, culture, hazards, chains
       | refinement contract (exact budgets + dated mandatory events)
       v
 C  Cell / settlement refinement   (pure function; never writes back)
       |
       v
 H  Household / person refinement  (deferred past M3)

 Time views (pure aggregation of P): year < decade (tick) < century < chapter (6,400 y) < era
```

Three rules hold the levels together:

1. **One causal solver.** Every fact that can change a macro outcome is owned
   by P, which includes per-region quantities. The domain ledger D owns only
   what crosses between bodies. Nothing below P can create, move or remove a
   macro fact (trap 5).
2. **History refines down, environment aggregates up** (D1). A parent passes a
   *refinement contract* down (D4): exact integer budgets plus dated mandatory
   events. A child may only allocate those budgets and add events that are
   *budget-neutral and below the salience cap*. Capacities are summed upward
   from the same fixed sample grid, so every allocation is feasible.
3. **Coupling only through dated messages.** Two P entities never read each
   other. A body learns about others only through D messages dated at least one
   tick after the pre-state that caused them (D2's contact-horizon rule made
   concrete). So the P steps within one tick are independent, and any order of
   computing them gives the same bytes.

---

## 2. Levels

Each fact has exactly one owning level (research implication 2).

### 2.1 D: domain ledger

- **Domain.** A declared, bounded set of star systems with its own manifest.
  Lab default: one home system of 4 bodies plus a 12-system stub star graph.
  Hard cap: 32 systems and 4 sapient origins per domain [scenario] (D4, D2).
- **Entities.** Lineages, voyages, signals, systems and bodies as graph nodes,
  routes with integer travel years.
- **Owns.** Voyage transit and loss, arrival delivery, colony P-entity
  creation, signal propagation, first contact, lineage outcome class, and the
  delivery of shared-catastrophe consequences to other bodies.
- **Does not own** anything that happens on a body. A launch's *departure* is
  owned by the source P entity (it is that body's emigration); D owns the
  voyage from the departure year onward.
- **Scope honesty** (D4). Results report `coverage: "complete-domain"`. A
  domain never treats unqueried systems outside it as empty, and it never
  claims a galaxy-wide occupancy (`"partial-galaxy"`).

### 2.2 P: planet strategic history (authoritative)

- **Entity.** One P entity per *arc*: a continuous occupation of one body by
  one lineage. A homeworld arc, a colony arc and a re-founding after
  extinction are separate arcs (D1). ID: `arc:<bodyAddress>:<lineageId>:<episode>`.
- **Space.** A fixed, versioned partition of the body into `R` macro-regions,
  with `8 <= R <= 32`, a frozen adjacency list, and a contact strength and
  barrier flag per edge. Stubs declare regions explicitly. The later Atlas
  adapter uses cube-sphere cells at depth 1, which gives 6 faces x 2 x 2 = 24
  regions with IDs `f/ix/iy`, following Atlas `surface-cell.ts` conventions.
  The partition is in the manifest; changing it is a new model version.
- **Owns.** Region populations at tick boundaries, region capacity, region
  tech domains, polities and region ownership, cultures, hazard ledgers,
  chains, the energy tier, outbound launches and signals, and the outcome flags
  of the arc. It also owns every macro event on the body.

### 2.3 C: cell and settlement refinement

- **Unit.** One region over one P tick (a decade).
- **Space.** A fixed partition of each region into cells: 16 cells per region
  in stubs, about 100 km cells on an Earth-sized body (Turchin's scale,
  research T1.13). Settlement sites lie on cells.
- **Adds.** Per-cell population, settlement founding and abandonment, the
  anchor cell of each P event touching the region, and C-only events (RAID,
  TOWN_FOUNDED, LOCAL_FLOOD) that are budget-neutral.
- **Never** reads sibling regions or changes a P quantity.

### 2.4 H: households and persons (deferred past M3)

Named persons are minted by their owning event with ID `(eventId, role)`, so
no level ever searches for "who". Individuals are detail on cohorts, never
always-running agents.

### 2.5 N: narrative (orthogonal)

Names, chronicle text, era labels, motives and story sifting. N is a pure
function of the sorted causal log and IDs. It has its own RNG purposes (`nar.*`)
and its own digest, and it has **no import path** into the solver (enforced by
a lint test). N may add prose motives; it may never add causal edges.

### 2.6 Views (pure aggregation, never simulated)

- Century and chapter summaries carry `start`, `end`, `min`, `max`, the stage
  mask and event counts, because endpoints alone hide an intra-century collapse
  and recovery (trap 12, D3).
- Eras (Forager, Agrarian, ...) are intervals derived from the energy tier.
  An era is a label, not a level.
- Display indices: the Morris energy index and the Kardashev value from
  aggregated power (never averaged), research T2.13–14. They are never inputs.

---

## 3. Time

### 3.1 The axis

- The canonical axis is Atlas world-time: BigInt nanoseconds since the Big
  Bang, `YEAR_NS = 31_557_600n * 10n**9n` (`universe-atlas/src/world-time.ts`,
  `TIME_VERSION 'atlas-time-2'`). One civ year is exactly `YEAR_NS`, a fixed
  duration, not a planet's orbit (D4).
- Absolute year index: `Y = floorDiv(tNs, YEAR_NS)`. Use true floor division,
  because BigInt `/` truncates toward zero (trap 9). Today Y is about 1.38e10,
  so years are stored as exact `Number` values.
- `CIV_MAX_YEAR = 2^53 - 1`. A query beyond it, or beyond the scenario horizon,
  returns `status: "outside-model-range"`; it never clamps.
- All intervals are half-open, `[from, until)`.

### 3.2 Bucket ladder (globally aligned, D1 and D2)

`bucket_k(Y) = floorDiv(Y, B_k)`, aligned to absolute years, so all bodies and
the domain ledger share boundaries:

| Name | Width | Role |
|---|---|---|
| year | 1 | C and H refinement step; exact event dates |
| decade (**tick**) | 10 | **the only integration step of P, for every regime** |
| century | 100 | report bucket; summaries with min and max |
| millennium | 1,000 | environment epoch: Atlas inputs are sampled here and held constant |
| chapter | 6,400 (640 ticks) | checkpoint and Merkle-chunk boundary |

Nesting is exact. A chapter is not a decimal multiple of a century, so
summaries must never assume a chapter holds whole millennia.

### 3.3 One clock (decision)

The P solver integrates on a **fixed 10-year tick in every regime**. This is
D3's rule. D1 and D2 proposed regime-dependent steps; that is deferred as a
later optimisation (section 12). Reasons:

- A reporting interval is never an integration interval (trap 12), and a
  fixed tick removes the step-switch test entirely.
- The cost is acceptable. Per tick the solver does only integer updates;
  random draws happen once per hazard *episode*, not per tick (section 4.4).
  400,000 years is 40,000 ticks. **The performance budget is 10 s for one seed
  over 400 kyr on a 12-region stub. It is unmeasured and must be measured in
  M2.**

### 3.4 Exact dates inside a tick

- Hazard events get an exact year inside the tick in closed form (section
  4.4). Threshold events are dated at the tick's start year, because they are
  detected on the pre-state.
- Every event's *effects* are committed to P state at the tick's end
  boundary. The annual refinement places each effect at its `dateYear`. The two
  agree at every boundary by construction.
- Each event stores `dateYear` and a `precision` tag in {decade, year}. A
  child level may only refine below its parent's precision.

### 3.5 Before, after and far future

- Before the body's habitability window, or before sapience: `status:
  "uninhabited"`, with a reason code (`not-habitable`, `no-sapience-yet`,
  `no-lineage`).
- After the horizon: `"outside-model-range"`. Analytic long-term regimes are
  deferred (section 12).
- Cold seeks replay from the nearest checkpoint. Checkpoints sit at chapter
  boundaries, so at most 639 ticks are replayed when a checkpoint is cached,
  and the run starts from genesis when it is not. Checkpoints are caches that
  can be rebuilt from the seed (trap 30). They contain **no RNG state**,
  because every draw is addressed.

---

## 4. RNG and determinism (civ-rng-1)

### 4.1 Key encoding

- Each field is encoded as `[tag:u8][len:u32 big-endian][payload bytes]`, with
  tags `S` (UTF-8 string), `I` (integer as canonical decimal: no leading zeros
  and no `+`; `-0` is rejected) and `B` (raw bytes). This makes `("a","bc")` and
  `("ab","c")` impossible to alias (trap 3).
- The field order is fixed:
  `("civ-rng-1", worldSeed, manifestDigest, level, entityId, purpose,
  episodeOrBucket, ordinal, attempt)`.
- `key64 = mix64(fnv1a64(encodedBytes))`, where:
  - `fnv1a64` uses the same constants as Atlas `hash64` (`catalog.ts`), but over
    these bytes;
  - `mix64` is the SplitMix64 finaliser;
  - both are computed in BigInt and masked to 64 bits.
- **No Atlas RNG stream is consumed or reproduced.** An Atlas RNG refactor
  therefore cannot shift civilisation history (D1). FNV-64 is a stream seed,
  never an identity; IDs are structured strings (section 5.1).

### 4.2 Generator

- `draw(key, n) = mix64((key + (n + 1) * 0x9E3779B97F4A7C15) mod 2^64)`: the
  SplitMix64 output function in counter mode.
- Any draw `n` can be computed directly, and is independent of whether draws
  `0..n-1` were taken (research T3.9–10).
- **Reference vectors** for `mix64` and the counter mode must be *generated*
  by an independent implementation (for example the public SplitMix64 C
  reference, or a short Python script run by the runner) and committed with
  the script. They must never be recalled from memory.

### 4.3 Pinned samplers (versioned in the manifest)

| Sampler | Definition |
|---|---|
| `u53` | `draw >> 11`; a uniform 53-bit integer |
| `below(n)` | rejection: `limit = 2^64 - (2^64 mod n)`. Attempt `a` uses key field `attempt = a`. The first draw below `limit` returns `draw mod n`. After 128 attempts the sampler throws `RNG_EXHAUSTED`, which is deterministic. Unbiased. |
| `chance(ppm)` | `below(1_000_000) < ppm` |
| `expQ32` | `E = -ln(U)` with `U = (u53 + 0.5) / 2^53`. Computed with a port of Atlas `det-math.ts` `logPos`, which uses only `+ - * /`, a fixed iteration count, and range reduction by binary scaling. It is then **quantised at once** to Q32 BigInt: `E_q32 = floor(E * 2^32)`. |
| `weightedPick` | cumulative integer weights in sorted ID order, then `below(total)` |
| `sortedUniformYears(count, from, until)` | `count` draws of `below(until-from)`, sorted ascending, with ties broken by draw index. Used to place a known count of events. |

`Math.exp`, `Math.log`, `Math.pow`, `**` on non-integers and the
trigonometric functions are **banned in `src/`** outside `src/fixed.mjs`. The
determinism lint is extended to enforce this (D1 risk; trap 8).

### 4.4 Hazards (D2's design, research T4.11)

- **Threshold.** One `E_q32` is drawn per `(owner, kind, episode)` with purpose
  `haz.<kind>`. The key contains the episode index, **never** a time bucket, so
  the threshold is the same however time is subdivided.
- **Rate.** `h_q32` is the hazard per tick, computed from the **pre-state
  only**, as a sorted sum of integer *terms*. Terms are kept for causal
  attribution (section 5.6). The hazard is constant inside a tick.
- **Firing.** If `H_before + h >= E`, the event fires. The year offset inside
  the tick needs no draw:
  `yearOffset = ceilDiv(10 * (E - H_before), h) - 1`. Because
  `E > H_before`, `yearOffset` is in `[0, 9]`.
- **Further firings in the same tick.** After a firing the episode index
  increments and a new threshold `E'` is drawn. The overshoot carries over:
  `H_new = H_before + h - E`. The next firing in the same tick is dated with
  the cumulative threshold sum. There is a cap of 4 firings per
  `(owner, kind, tick)`; past the cap the fourth event records `saturated:
  true` and the remaining hazard of that tick is discarded.
- **Owners** are stable IDs: a region ID, a polity ID, an ordered polity pair
  `"A>B"` for directed kinds such as WAR, or the arc ID. When an owner ends,
  its hazard ledger is closed.
- **Competing causes** are independent ledgers. Same-year firings are ordered
  by the event order key (section 5.2).

### 4.5 Numbers

- **People, capacity, energy, capital and hazard accumulators** are BigInt.
  Small bounded quantities are `Number` integers: tiers, region indices,
  permille and ppm rates, and years.
- `mulDiv(a, b, c)` is BigInt floor division; `ceilDiv` is explicit. Every
  rounding direction is specified at its call site: floor for allocations,
  ceil for travel times and resource needs (D4).
- **Losses are fractions of the stock present when applied**, so a negative
  stock is impossible and no clipping can manufacture a collapse (trap 14).
- Environmental inputs are quantised at the adapter boundary **before** any
  decision. `NaN` and infinity are rejected there.

### 4.6 Ordering and collections

- Every collection that reaches state is a sorted array, sorted by an explicit
  total key using code-unit string order, never `localeCompare`.
- `Map`, `Set` and object-key iteration never reach state or a digest (trap 2).
- Purposes form a **closed, registered enum**, for example `haz.plague`,
  `evt.war.campaign`, `pol.split.part`, `ref.cell.site`, `nar.name`. An
  unregistered purpose throws.

### 4.7 Observation

- Querying, refining, narrating or viewing never consumes randomness that P
  uses: those purposes have different keys.
- None of them mutates P state.
- What has been realised is kept in a *materialisation record*. That record is
  excluded from every result digest (trap 4).

---

## 5. Event model (civ-event-1)

### 5.1 Record

```
CivEvent {
  id:        "<ownerId>|<kind>|<tick>|<ordinal>"   // ordinal = rank among the same
                                                   // (owner, kind, tick) by order key
  kind, kindRank                                   // from the versioned catalogue
  level:     "D" | "P" | "C"
  ownerId                                          // exactly one owner
  refs:      [{ role, entityId }]                  // sorted by (role, entityId)
  tick:      bigint-string                          // floorDiv(dateYear, 10)
  dateYear:  integer
  precision: "decade" | "year"
  phase:     0..5
  trigger:   { mode: "exogenous"|"threshold"|"hazard"|"chain"|"scheduled",
               episode?, E_q32?, Hbefore_q32?, h_q32?, crossed?: { var, value, threshold },
               saturated? }
  causes:    [{ eventId, edge: "TRIGGERED"|"RAISED_HAZARD"|"ENABLED"|"CHAIN"|"EXOGENOUS",
                weightPermille }]                  // sorted
  params:    { [k]: integer-string }               // magnitude, tier, deaths, ...
  effects:   [{ target, field, op: "add"|"set"|"scale"|"transfer", amount, to? }]
  chain:     { chainId, step, deadlineTick, status } | null
  salience:  0..1000                               // narrative filter only; not causal
  forced:    false                                 // reserved; v1 never forces
  modelVersion
}
```

`transfer` is **one conserving record**: what leaves one account arrives in
the other. It is used for migration, conquest of a region's people, colonists
and voyage passengers. `scale` applies a permille factor to the stock present
at application.

### 5.2 Total order

`orderKey = (dateYear, phase, ownerId, kindRank, ordinal)`, compared
lexicographically with code-unit strings. Events in one tick all read the same
frozen pre-state (DEVS confluent rule, research T3.12–13). Effects commit in
order-key order.

### 5.3 The six-phase tick (P)

| Phase | Name | What happens |
|---|---|---|
| 0 | Exogenous | Environment-epoch changes (CLIMATE_SHIFT, STELLAR_DOOM) and inbound D messages dated in this tick (arrivals, signals, shared-catastrophe consequences). |
| 1 | Threshold | Deterministic crossings on the pre-state: FAMINE, TECH_LOSS, ENERGY_TRANSITION, HEGEMONY, RECOVERY, EXTINCTION, COLONY_LOST, CLIMATE_CATASTROPHE. No draws, except magnitude draws keyed on the event ID. |
| 2 | Hazard | For each eligible `(owner, kind)` in sorted order: accumulate, fire, date (section 4.4). |
| 3 | Chain | Advance active chains whose next step falls in this tick. A chain whose participant no longer exists is INVALIDATED with a recorded reason (the Worlds/Zematus stale-event check, research T1.15). |
| 4 | Resolve | Competing intents on one target resolve by order key. A mutual war (A>B and B>A) merges into one war owned by `min(id)`. A losing intent is logged as `pre-empted`. |
| 5 | Commit | (a) Natural update from the pre-state (section 6.2). (b) Event effects in order-key order. (c) Derived fields: tiers, stage, polity sums. (d) The tick ledger is emitted. |

**Tick ledger** (D3's best idea). Each tick emits
`{ arcId, tick, startState digest, naturalDelta[region], eventIds, endState }`.
The ledger is the **specification every refinement must reproduce**.

### 5.4 Chains

Chains are guarded state machines (the Victoria 3 / Dominions pattern,
research T1.9–11). Each has:

- `chainId`, equal to the opener event's ID;
- typed `refs`;
- steps with eligibility rules;
- a `deadlineTick`;
- the transitions complete, fail, invalidate and timeout.

v1 chains are WAR (DECLARED, then CAMPAIGN each tick, then END as CONQUEST,
STALEMATE or PEACE, with a deadline of 3 ticks) and PLAGUE (OUTBREAK, then
SPREAD along contact edges, then BURNOUT).

### 5.5 Shared catastrophes

A shared catastrophe is one event with one owner and many refs. It is never
re-sampled per victim (trap 23). When it affects other bodies, the owner's
event is the cause, and D delivers each consequence as an inbound message at
the next tick or later.

### 5.6 Causal DAG (model attribution, labelled as such)

- Each P state variable keeps a **provenance slot**: the top 3 events by
  integer contribution to its deviation from the no-event path, decayed by
  half each tick.
- Edge rules:
  - a hazard event gets RAISED_HAZARD edges to the provenance of every term
    supplying at least 25% of `h`;
  - a threshold event gets a TRIGGERED edge to the provenance of the variable
    that crossed;
  - a prerequisite gate gives an ENABLED edge;
  - a chain step gives a CHAIN edge to its opener;
  - an inbound or environmental event gives an EXOGENOUS edge.
- Edges only point to strictly earlier order keys, so the graph is acyclic by
  construction (tested).

### 5.7 Event catalogue v1

The catalogue is data in `src/catalogue.mjs`. For each kind it holds the owner
level, trigger mode, eligibility, hazard terms or threshold, effects,
`kindRank` and base salience. The milestone column says when a kind must be
implemented **and reachable by a forced fixture**.

| # | Kind | Owner | Trigger | Driver (summary) | Effects | M |
|---|---|---|---|---|---|---|
| 1 | SAPIENCE | P | scheduled | hard-step waiting times `W_j = E_j / k_j` from the biosphere `complex` onset, inside the habitability window (research T4.8) | creates the lineage and arc; seeds 1–2 regions | M2 |
| 2 | MIGRATION | P | hazard per ordered adjacent region pair | pressure (pop/K, climate decline, war) x destination headroom x edge contact | `transfer` people | M2 |
| 3 | AGRICULTURE | P | hazard per region | Kremer term x domesticables proxy | Subsistence tier +1; raises K | M2 |
| 4 | FAMINE | P | threshold | pop > K x (1 + overshoot) or a K shock | deaths (`scale`); raises migration pressure | M2 |
| 5 | PLAGUE | P | hazard, chain | density x connectivity x (1 − immunity memory) | deaths; resets immunity; lowers elite share | M2 |
| 6 | CLIMATE_SHIFT | P | exogenous | environment-epoch change in the stub or Atlas sample | K changes | M2 |
| 7 | NATURAL_CATASTROPHE | P | hazard | impact or supervolcano rate, **capped by the Snyder-Beattie bound** (below about 1/14,000 per year as a *bound*, research T4.13) | deaths, infrastructure loss, K shock for N ticks | M2 |
| 8 | DISCOVERY | P | hazard per (region, domain) | Kremer `a · N_eff` with prerequisites and resource gates (research T5.1, T2.11) | domain tier +1 | M2 |
| 9 | DIFFUSION | P | hazard per contact edge and domain | tier gap x contact strength | the neighbour gains +1 | M2 |
| 10 | TECH_LOSS | P | threshold | Henrich: `N_eff < N*(domain, tier) x learningBias` for 2 ticks (research T5.2–3, contested) | domain tier −1 | M2 |
| 11 | ENERGY_TRANSITION | P | threshold | a region's era tier changes (section 7) | era label; enables hazard sets | M2 |
| 12 | POLITY_FOUNDING | P | hazard | an unowned region at Subsistence ≥ 2 and density ≥ threshold | creates a polity | M2 |
| 13 | WAR | P | hazard per ordered adjacent polity pair, chain | power ratio x stress x (1 − war-weariness) | chain; deaths each campaign tick | M2 |
| 14 | CONQUEST | P | chain outcome | `p_win = max(0, (Pa − Pd)/(Pa + Pd))` with power decaying over distance (research T2.7) | region ownership transfer | M2 |
| 15 | HEGEMONY | P | threshold | one polity holds ≥ 60% of the planet's population | flag; enables planetary institutions | M2 |
| 16 | FRAGMENTATION | P | hazard | stress plus Tainter administrative overhead x region count (research T2.10) | polity splits along sorted region halves | M2 |
| 17 | REVOLUTION | P | hazard | stress x Information tier | regime-type change; no territory change | M2 |
| 18 | SCHISM | P | hazard | cultural distance inside a polity | new culture ID; raises war hazard between the parts | M2 |
| 19 | COLLAPSE | P | hazard | stress x complexity overhead (swappable strategy; SDT is contested, trap 21) | `scale` population, infrastructure and maintained tiers down by 1–2; polities fragment; recovery targets recorded | M2 |
| 20 | RECOVERY | P | threshold | population ≥ ½ and infrastructure ≥ ¾ of the pre-collapse values (D3) | clears the collapsed flag | M2 |
| 21 | NUCLEAR_WAR | P | hazard | needs Energy ≥ 4 and ≥ 2 armed polities; war intensity x prior | population and infrastructure crash; nuclear-winter K shock that can trigger FAMINE | M2 |
| 22 | ENGINEERED_PANDEMIC | P | hazard | Medicine ≥ 4 and Information ≥ 4; prior | deaths; outcome draw | M2 |
| 23 | RUNAWAY_TECH | P | hazard | Information ≥ 5; prior | outcome draw: collapse, existential cap or extinction | M2 |
| 24 | CLIMATE_CATASTROPHE | P | threshold | accumulated anthropogenic forcing stock from fossil energy | K down for many ticks | M2 |
| 25 | SPACEFLIGHT | P | threshold | Transport ≥ 5 | enables launches | M2 |
| 26 | LAUNCH | P | hazard per launch window | `min(floor(I/C_I), floor(F/C_F), berths)` capacity (research T4.14); destination chosen by `weightedPick` over reachable bodies | `transfer` people to `transit:<voyageId>` | M2 |
| 27 | VOYAGE_LOST | D | hazard per voyage | tier-dependent transit risk | passengers die | M2 |
| 28 | COLONY_FOUNDED | D | scheduled at `launchYear + travelYears` | destination is habitable or habitat-buildable at arrival | creates a colony arc with founders and a tech **cap** | M2 |
| 29 | COLONY_LOST | P | threshold | colony population below the minimum viable size | arc terminal | M2 |
| 30 | EXTINCTION | P | threshold | arc population = 0 | arc terminal | M2 |
| 31 | LINEAGE_EXTINCTION | D | threshold | every arc of the lineage is extinct and no voyage is in transit | lineage outcome | M2 |
| 32 | STELLAR_DOOM | P | exogenous | the star's giant phase or engulfment year | at Energy ≥ 5, an evacuation hazard (LAUNCH); otherwise extinction | M3 |
| 33 | SIGNAL_ARRIVAL | D | scheduled | emissions start at Information ≥ 3 (radio); light travel time in whole years | inbound message | M3 |
| 34 | FIRST_CONTACT | P | hazard at the receiver | receiver's Information tier x signal strength, or a physical meeting at a shared body | contact record; diffusion edge | M3 |

This makes 31 kinds in M2 (the requirement is at least 20) and 34 in v1.
Interstellar war, trade, golden ages and religion-as-polity are deferred. D4
warns that a "golden age" must have defined effects or it is only flavour.

**C-only kinds** (M3, refinement level, budget-neutral): RAID, TOWN_FOUNDED,
TOWN_ABANDONED, LOCAL_FLOOD, LOCAL_SUCCESSION.

---

## 6. Civilisation state (P), all integers

### 6.1 Records

- **Per region `r`:**
  - `pop` (BigInt persons);
  - `Kbase` (from the environment epoch); `K = Kbase x subsistenceMult[tier] x (1 − damage‰)`;
  - `renewable‰` (Brander–Taylor style stock, research T2.2);
  - `infra` (BigInt capital, World3-style decay, research T2.12);
  - `forcing` (anthropogenic stock, BigInt);
  - `immunityTicks`;
  - `polityId` or `null`; `cultureId`;
  - `tiers[7]` (section 7);
  - `resources`: metals, fuels, fissiles and domesticables as ‰, frozen per environment epoch;
  - `collapse`: `{ active, recoverPop, recoverInfra }` or `null`.
- **Per polity:**
  - `id` (= its founding event ID); `regions` (sorted); `capital`;
  - `regime`: band, chiefdom, state, empire, republic, technocracy or federation;
  - `eliteShare‰`, `asabiya‰`, `legitimacy‰`, `stress‰`, `warWeariness‰`;
  - `foundedYear` and `endedYear`; `parentIds`.
  - Population and power are **derived** sums, never stored twice.
- **Per arc:**
  - `lineageId`, `body`, `episode`, `foundedYear`;
  - `hazardLedger` (a sorted array of `{ owner, kind, episode, H_q32, E_q32 }`);
  - `activeChains` (sorted); `provenance`;
  - `outcome` (section 8.3);
  - `perils` (none, active or exited);
  - `scenarioParams` (drawn once per lineage from wide priors and recorded).
- **Per lineage (D):**
  - `id = "lin:" + originBody`; `arcs` (sorted); `voyages`; `contacts` (an
    epistemic set kept apart from ground truth, the Aurora-4X pattern of
    research T4.18); `outcomeClass`.

### 6.2 Natural update, closed form per tick

- **Population:** a Beverton–Holt map, which is the exact time-10 map of the
  continuous logistic (research T2.1; D3's formula):
  `P' = floorDiv(P * K * (D + g), D * K + g * P)`, with `D = 1_000_000` and
  `g = round(D * (e^{10 r} − 1))`.
  - `g` is a **precomputed integer per era** in the manifest, never computed
    at run time.
  - It stays between P and K: no overshoot and no negative population. When
    K drops below P, the population declines toward K.
- **Infrastructure:** `I' = I * keep‰ / 1000 + build`, with `keep‰` a
  precomputed integer from `e^{−10/τ}` and τ = 14 years (World3,
  research T2.12).
- **Forcing:** a sum of fossil-energy use with a precomputed decay.
- **Immunity:** ticks since the last plague, capped.

### 6.3 Missing is not empty

Every query result carries a status (D1, D4, trap 26):

- `realised` and `unrealised-on-request` (not computed yet; never "zero");
- `not-modelled` (a feature outside v1);
- `absent` (proven none);
- `outside-model-range`;
- `uninhabited` (with a reason).

---

## 7. Technology and energy ladder

Technology is **maintained state per region and domain**, not a monotone tree
(trap 24; research implication 10).

| Domain | Tiers (0 upward) |
|---|---|
| Energy | 0 muscle and fire · 1 draft animals and biomass · 2 water and wind · 3 fossil heat engines · 4 electricity and fission · 5 fusion or large-scale solar · 6 stellar collection |
| Subsistence | 0 foraging · 1 horticulture · 2 agriculture · 3 irrigation and intensive farming · 4 mechanised · 5 synthetic, closed-loop |
| Materials | 0 stone · 1 copper and bronze · 2 iron · 3 steel · 4 polymers and semiconductors · 5 nanofabrication |
| Transport | 0 foot · 1 boat and animal · 2 sail and road · 3 rail and steam · 4 flight · 5 orbit · 6 in-system · 7 interstellar |
| Information | 0 speech · 1 writing · 2 print · 3 telegraph and radio · 4 computing · 5 general AI |
| Medicine | 0 herbal · 1 surgery and hygiene · 2 germ theory · 3 antibiotics and vaccines · 4 genetic |
| Organisation | 0 band · 1 chiefdom · 2 state · 3 empire and bureaucracy · 4 planetary institutions · 5 multi-world |

**Era tier** of a region: the highest row whose conjunction holds. Eras are
authored abstractions [scenario], not universal stages.

| Era | Name | Condition | Energy capture, kcal per person per day |
|---|---|---|---|
| E0 | Forager | (default) | 4,500. Morris anchor: about 4,000–5,000 for simple foragers (research T2.13, high) |
| E1 | Sedentary | Subsistence ≥ 1 | 8,000 [scenario] |
| E2 | Agrarian state | Subsistence ≥ 2, Organisation ≥ 2, Materials ≥ 1 | 26,000 [scenario] |
| E3 | Industrial | Energy ≥ 3, Materials ≥ 3, Transport ≥ 3 | 77,000 [scenario] |
| E4 | Atomic and information | Energy ≥ 4, Information ≥ 4 | 230,000. Morris anchor: the US in 2000 (research T2.13, high) |
| E5 | Interplanetary | Energy ≥ 5, Transport ≥ 6 | 1,000,000 [scenario] |
| E6 | Interstellar | Energy ≥ 5, Transport ≥ 7 | 5,000,000 [scenario] |
| E7 | Stellar engineering | Energy ≥ 6 | display only |

Rules:

- **Discovery** is a hazard per (region, domain, next tier). It has two terms:
  - a Kremer term, `a_d · N_eff`, where `N_eff` is the region's population
    plus contact-weighted neighbour populations;
  - a diffusion term along contact edges.
- **Prerequisites** are a small table of minimum tiers in other domains. They
  are gated by the region's **resource vector**. A missing resource is a
  recorded **ceiling** fact, never a silent stall.
- **Alternative prerequisite sets per planet profile** [scenario]. For
  example, Energy 1 and 3 on an anoxic world go through geothermal or
  electrochemical heat (research OQ 13). If no path exists, that is a ceiling.
- **Loss.** TECH_LOSS uses Henrich's threshold `N*(domain, tier)`, scaled by a
  `learningBias` knob drawn from a wide prior, because the evidence is
  contested (research T5.3). A COLLAPSE lowers maintained tiers directly.
- **Colonies** inherit a tech **cap** from the launch record, at most the
  source's tiers, and must maintain it at their founder population. Colony
  regression therefore emerges from the Henrich rule rather than being
  scripted.
- Planet "frontier era" is the maximum over regions, and planet "mean era" is
  the population-weighted mean. Both are views.

---

## 8. Expansion and extinction

### 8.1 Origin

- SAPIENCE uses ordered hard steps (research T4.8). The stage waiting times
  `W_j = E_j / k_j` are drawn with `expQ32` and purpose `orig.step.<j>`, from
  the body's biosphere complex onset, in integer years.
- If the sum overruns the habitability window, the body has **no lineage**.
  That is a recorded fact (`no-lineage`), never a rejection and retry
  (trap 18).
- Many seeds should be empty. The step rates `k_j` come from wide log-uniform
  priors (Sandberg, Drexler and Ord, research T4.7).

### 8.2 Perils, collapse and extinction

- **Self-inflicted hazards** exist only while `perils = active`, which starts
  at E3.
- Their rates come from wide seeded log-uniform priors per lineage. Ord's
  per-century figures (research T4.12) appear only as **labelled reference
  points** for those priors, converted with `h = −ln(1 − p100)/100` offline
  into precomputed Q32 per-tick constants. They are existential-risk numbers,
  not extinction numbers (trap 22).
- Each firing of NUCLEAR_WAR, ENGINEERED_PANDEMIC or RUNAWAY_TECH draws an
  **outcome class** (purpose `out.<kind>`):
  - `collapse`: regress 1–3 tiers, then RECOVERY is possible;
  - `existential-cap`: a permanent ceiling on given domains;
  - `extinction`: the arc population becomes 0.
- **Natural hazards** are bounded by Snyder-Beattie (below about 1/14,000 per
  year), as a cap and never as a rate.
- **Leaving perils.** `perils` becomes `exited` when the lineage has ≥ 3
  self-sustaining arcs on different bodies, or reaches Organisation 5
  [scenario].
- **Shared risk.** A perils event can be lineage-wide only through a declared
  scenario parameter `sharedRiskPpm`. One draw by the owner decides it. If it
  is shared, D delivers the consequence to every arc of the lineage as one
  shared catastrophe (section 5.5). Colonies therefore get no free independent
  survival rolls (trap 23), and they are not automatically doomed either
  (D3, D4).

### 8.3 Outcome fields

These are kept separate (research implication 11):

- `biological`: extant or extinct;
- `industrial`: the era tier and whether it is regressing;
- `political`: continuous, fragmented or none.

The lineage outcome class is one of EXTANT_PLANETARY, EXTANT_MULTI_BODY,
EXTANT_MULTI_SYSTEM, COLLAPSED_RECOVERING, REGRESSED_STABLE, EXISTENTIAL_CAP,
EXTINCT_SELF, EXTINCT_NATURAL, EXTINCT_STELLAR or NO_LINEAGE.

### 8.4 Spreading (the domain ledger)

- **Routes.** A route is an edge `(fromBody, toBody)` with integer
  `travelYears`:
  - in-system: a constant per Transport tier [scenario];
  - interstellar: `ceil(distanceMicroLy / speedMicroLyPerYear)` on the pinned
    stub graph; the Atlas catalogue graph comes later (D4).
- **Launch** (P-owned emigration) creates a voyage. The voyage keeps its own
  record, and it **survives the destruction of its source** (D3, D4).
- **Arrival** (D, scheduled):
  - if the destination has no arc, COLONY_FOUNDED creates one;
  - otherwise the arrivals are delivered as an inbound `transfer`;
  - if the destination cannot host them, they are recorded as lost.
- **Landis disposition** (research T4.3). Each colony arc draws once whether
  it is a coloniser (`colonizerPpm`, from the prior). This gives clusters and
  voids.
- **Arrivals at the same time** at one destination are grouped and resolved
  jointly in order-key order (D4).
- **Oracles** for M3 are the Aurora-effect front speed
  `v_f = d / (d/v_p + T_p)` and the steady state `X* = 1 − T_l/T_s` (research
  T4.1–2). Both are aggregate checks, never per-seed truth.

### 8.5 Domain compilation (lockstep, bounded)

- For each tick `t`, in increasing order:
  1. D delivers the messages dated in `t`. They were decided at tick `t − 1`
     or earlier, because the minimum latency is 1 tick.
  2. Every arc steps from its own pre-state plus its inbox. Arcs are stepped
     in sorted ID order, but the order is irrelevant, because arcs share
     nothing within a tick.
  3. D collects outbound launches, signals and shared-catastrophe
     consequences and schedules them for `t + 1` or later.
- **Contact horizon** (D2's best idea, as a *property*). An arc's history
  before its first inbound message is byte-identical to the same arc computed
  in isolation. M2 tests this property.
- Using it as a laziness shortcut, together with the conservative lower bound
  on the earliest inbound date, is deferred (section 12). D2 notes that its
  Chandy-Misra-Bryant attribution is from memory, unverified.

---

## 9. Consistency contract between levels

### 9.1 Projection law

`aggregate(refine(parentContract, address)) === parentContract`, checked for
**every tick** (research T3.1, implication 1). Refinement is
**constructive**: there is no rejection and no repair (OQ 5).

### 9.2 Refinement contract (D4)

A parent tick ledger defines, for each child unit:

- `budgets`: population at both boundaries; natural delta; deaths, migrants
  and transfers by cause;
- `mandatoryEvents`: every parent event touching the unit, with its date and
  effects;
- `environment`: the static capacity table of the unit's children;
- `recipeDigest`.

### 9.3 Allocation rule (D3)

- A **fixed binary partition tree** over the child IDs is used, with integer
  static weights (cell capacity).
- For a node total N and child weight sums WL and WR:
  `left = floorDiv(N * WL, WL + WR)` and `right = N − left`.
- Totals are exact, and each leaf is monotone in N.
- The rule is applied to the *after* and *before* totals of each ledger phase:
  `deltaLeaf = split(after) − split(before)`. A global decrease therefore never
  produces a spurious local increase.
- Randomness is used only for **placement**: settlement sites, the anchor cell
  of each P event, and the dates of C-only events. These draws are keyed on
  `(eventId, "anchor")` or on `(regionId, tick, "ref.cell.site", ordinal)`.

### 9.4 Annual path inside a tick (D3)

- `P(y) = P_start + floorDiv((y − tickStart) * naturalDelta, 10)`, plus each
  event's effect applied at its `dateYear`. At year 10 the path equals the
  ledger's `endState` exactly.
- Tiers, ownership and stage are a staircase that changes at event dates.
- This is a declared approximation, not a hidden annual simulation.

### 9.5 Tolerances

| Quantity | Class | Tolerance |
|---|---|---|
| Population per region and per arc at every tick boundary | EXACT | 0 persons |
| Σ cells = region; Σ regions = arc; arc + transit = lineage totals | EXACT | 0 |
| Σ transfers out = Σ transfers in (migration, colonists) | EXACT | 0 |
| Event existence, ID, kind, owner, `dateYear` and effects | EXACT | 0 |
| Every P event touching a region has exactly one C anchor at the same `dateYear` | EXACT | 0 |
| Polity membership, tiers, era, outcome flags | EXACT | 0 |
| Century summary `min`/`max` vs a fold over ticks | EXACT | 0 |
| Annual population path vs the unrounded linear path, before event jumps | BOUNDED | < 1 person |
| Displayed mean energy per person vs the exact rational mean | BOUNDED | < 1 kcal per day |
| Net effect of C-only events on any P total | EXACT | 0 |
| Magnitude of C-only events | BOUNDED | < 1% of the region's population at the tick start (salience cap; D1's closure rule) |
| Settlement-size distribution, names, minor-cause shares | DISTRIBUTIONAL | checked across seeds, never per seed |

If a refinement violates the contract, the result is a deterministic
`REFINEMENT_CONTRACT_ERROR`. **P is never adjusted** (D3).

### 9.6 Never write back

- Refine functions have the signature `(def, parentContract, unitAddress)` and
  get no world handle.
- They import only the contract and the static environment.
- Sibling units never read each other (D1 C5).
- This is enforced structurally, and by an import-graph lint test that also
  covers N.

---

## 10. Digests and versioning

- **Canonical bytes:** RFC 8785-style JSON with code-unit-sorted keys, BigInt
  as decimal strings, only safe integers allowed as numbers, and floats
  rejected (research T3.17).
- **Hash:** SHA-256 via `node:crypto` (`createHash`) in the lab. A synchronous
  pure-JS SHA-256 for the browser is deferred to integration. This is the
  digest only; draws do not use SHA-256 (section 13).
- **Three digests** (research implication 14, D3, D4):
  1. `recipeDigest`: the manifest, input tables, seed and all version pins.
  2. `resultDigest`: a Merkle tree. A leaf is one (arc, chapter): its tick
     ledgers and events. An arc root is the root over its chapters; the domain
     root is the root over sorted arc and D-ledger roots. A **materialisation
     record** of what was realised is kept apart and never hashed into the
     result.
  3. `narrativeDigest`: N output only.
- **Manifest** `civ-manifest-1` has these fields:
  - `modelVersion`, `rngVersion: "civ-rng-1"`, `samplerVersion`,
    `arithmeticVersion`, `catalogueVersion`, `partitionVersion`;
  - `tickYears: 10`, `chapterTicks: 640`, `envEpochYears: 1000`;
  - `scenarioPriors`;
  - `inputBundleDigest`;
  - `atlasVersions` (empty for stubs).
- Any change to these values is a new world, never a silent migration
  (trap 7).
- Goldens sit beside invariants and **negative tests**, because a golden digest
  alone proves only stability.

---

## 11. Atlas coupling contract (later; stubs until then)

Atlas stays **read-only** and outside the runtime dependency graph until an
integration milestone the owner approves.

### 11.1 Input: `CivEnvironment` (D4's AtlasView, narrowed)

```
interface CivEnvironment {
  manifestDigest
  lifecycle(body)    -> Availability<{ habitableFromYear, habitableUntilYear,
                                       complexLifeFromYear, stellarDoomYear|null }>
  regions(body)      -> Availability<{ partitionVersion, regions: [{ id, adjacency, weight }] }>
  epoch(body, region, millenniumIndex)
                     -> Availability<{ Kbase, landPpm, tempClass, aridityClass,
                                       airClass, gravityMicroMS2, resources, domesticablesPpm }>
  routes(domain)     -> Availability<[{ from, to, travelYearsByTransportTier }]>
}
Availability<T> = { status: "known", value: T, digest }
                | { status: "absent", reason }
                | { status: "unsupported", capability }
```

- **v1 implementation:** `StubEnvironment`, which reads `fixtures/planets/*.json`
  (PlanetStub).
- **Later:** `AtlasEnvironment`, which samples Atlas pure functions at fixed,
  manifest-pinned points. Each region is sampled at 16 fixed directions, with
  the `placeAt(ctx, direction, level)` signature as it really exists in
  `place-query.ts`. Sampling is done once per millennium epoch, never at
  "whatever tiles were viewed" (trap 4). The result is labelled
  `sampled-estimate`.
- **Fixture parity.** A frozen record of `AtlasEnvironment` outputs replayed
  through `StubEnvironment` must give byte-identical civ digests.

### 11.2 What Atlas provides vs what must be new

D4 inspected Atlas HEAD `d4032798`.

- **Atlas provides:**
  - time;
  - addresses (`formatAddress`, BodyAddress strings; **only canonical address
    strings are accepted**);
  - the stellar and planet lifecycle;
  - the dated biosphere stage;
  - surface climate and biome per direction;
  - geophysics;
  - habitat *suitability*.
- **Atlas does not provide**, so the civilisation layer needs new, separately
  versioned scenario models:
  - food yield or carrying capacity (suitability is not yield; OQ 8);
  - resource deposits;
  - domesticable species;
  - fauna abundance;
  - transport graphs between catalogue systems.
- **Do not infer** combustible air from `hasAir`, ore from core fraction,
  crops from forest suitability, or fossil fuel from a complex biosphere (D4).

### 11.3 Version enforcement

- The adapter **compares** the pinned Atlas versions and refuses a mismatch.
  Atlas writes most `WorldVersions` keys without reading them, and
  `biosphereStateAt` discards the versions passed to it (D2, D4).
- Known discrepancies are recorded, not silently reconciled. One example:
  `surface-climate` derives gravity from mass and radius, while `placeAt` uses
  `planetGeophysics`.

### 11.4 Outputs to Atlas (later)

These are pure functions:

- `civPresenceAt(ctx, bodyAddress)` returns
  `{ status, lineages, era, popClass, fidelity: "scenario" }`. It is answered
  from D and P checkpoints, and never forces C.
- `civEventsBetween(def, scope, fromNs, untilNs, cursor)` returns pages in
  total order. Its signature mirrors the planned Atlas
  `eventsBetween(definition, scope, fromNs, untilNs, cursor?)`
  (`docs/deterministic-temporal-universe-design-2026-09-23.md`).
- `civ-history-v1` JSONL export of the event log, so that other games and
  viewers build on a file format (research implication 15).

### 11.5 Write-back (deferred)

- Write-back is only ever a **derived overlay**:
  - civ overlay records such as settlement, land use, forest-removal mask,
    species mask, climate delta and orbital debris;
  - each keyed by cause event IDs;
  - composed as `effective = compose(base, overlay)`.
- **Atlas catalogue bodies and base history are never mutated.**
- Feedback is acyclic and has a one-tick lag:
  - `civ[k+1]` reads `effectiveEnv[k]`;
  - `overlay[k+1]` reads `civEffects[k]`.
- **Layer-off rule:** with civilisation disabled, every existing Atlas query
  returns byte-identical results, and the existing Atlas goldens pass
  unchanged (D4).

### 11.6 Branches (deferred)

Player interventions would be an overlay log keyed by `branchId`. Atlas has
only `baseline` today, so branches wait for Atlas branch support.

---

## 12. Deliberately deferred

- Atlas integration, overlays and write-back. Branches.
- The H level, districts and streets.
- A web inspector or timeline UI. That needs owner approval: the lab forbids a
  new web preview.
- Regime-dependent tick lengths and quiescent closed-form fast-forward (D2).
  Only add them with a test proving identical events to stepping.
- Contact-horizon *laziness* (computing an arc alone up to a proven lower
  bound). v1 tests only the property.
- Late-time analytic regimes and renewal blocks beyond the horizon (D1, D4).
- Interstellar war, trade economy, faster-than-light travel, intergalactic
  expansion.
- Rich narrative: Tracery grammars, Qud-style rationalised motives, story
  sifting (trap 29). M3 ships only names and a salience-filtered chronicle.
- Cross-engine (browser) identity. v1 guarantees pinned Node 22; a
  cross-engine golden test comes with integration (OQ 16).

---

## 13. What the rejected ideas contributed

| Rejected idea | Why rejected | What it contributed to this spec |
|---|---|---|
| D1: six canonical levels with Lineage milestones and World arcs bridged downward, and P steered by forced transitions | Two coarse authorities plus a steering bridge. Risks suppressing emergence; large test surface. | The absolute decimal bucket ladder; "environment aggregates up, history refines down"; the salience cap and budget-neutral child events; date precision tags; the tagged, length-prefixed key encoder; the closed purpose registry; the det-math `logPos` port; extending the lint to transcendentals; the arc concept (one occupation of one body); Landis dispositions; the "missing is not empty" statuses. |
| D1 and D2: regime-dependent integration steps | A step switch is a new failure mode, with no need in the lab. | Hazard thresholds keyed by episode stay valid if steps ever vary; deferred with a required equivalence test. |
| D2: the full contact-horizon laziness shortcut | Needs a proven conservative bound on the earliest emission. | Kept as a tested *property* (the pre-contact digest is independent of others). Its lockstep-with-latency rule became section 8.5. |
| D2: a 65,536-entry integer ln table | A ported `logPos` (exact IEEE `+ - * /`) is smaller and already used in Atlas. | Quantise to fixed point at once; banned transcendentals. |
| D3: fresh per-decade Bernoulli opportunities | The result depends on the step size, and it costs a draw per decade per opportunity. | The fixed-clock argument; forced fixtures that make every event type reachable. |
| D3: SHA-256 for every draw | Slow, and not available synchronously in browsers. | SHA-256 kept for digests. |
| D3: two planets, 20,000 years, one fixed route | Cannot show stone age to space age. | One causal solver; the tick ledger as the refinement spec; the monotone binary split; min and max in summaries; `outside-model-range`; the Beverton–Holt formula; recovery thresholds; voyages that survive source collapse; plausibility bands framed as scenario variety, not truth. |
| D4: seven spatial levels down to streets, and one-year causal coupling | Too large for a lab; streets need Atlas integration. | Refinement contracts; the Availability tri-state; fixture/live adapter parity; overlay write-back with acyclic feedback; the layer-off rule; bounded domains with `partial-galaxy` labels; three digests; version enforcement; the "do not infer X from Y" list; the game-facing API shape. |
| D4: reusing Atlas FNV/PCG streams | Couples civilisation history to Atlas RNG refactors. | FNV-1a constants reused only to hash civ's own encoded keys. |

---

## 14. Milestones and acceptance tests

General rules:

- Every test is a `node --test` file under `tests/`, each under 2 s, with no
  dependencies, network, browser or GPU.
- The runner quotes the observed `npm test` output in each commit message or
  report, and never claims an unobserved pass.
- Astra implements (workspace-write, files only). Opus reviews `git diff`,
  runs the checks and commits.

### M1: core (levels, time, split RNG, event log, digest, determinism)

**Modules:**

- `src/time.mjs`: floorDiv; buckets; tick, chapter and epoch helpers; ns
  conversion.
- `src/fixed.mjs`: Q32 helpers, `mulDiv`, `ceilDiv`, the `logPos` port.
- `src/rng.mjs`: the encoder, `fnv1a64`, `mix64`, `draw`, samplers, the
  purpose registry.
- `src/canonical.mjs` and `src/digest.mjs`: canonical bytes, SHA-256, Merkle.
- `src/events.mjs`: schema validation, order key, ID builder, the tick-ledger
  type.
- `src/hazard.mjs`: the episode ledger and the crossing formula.
- `src/manifest.mjs`.
- `src/levels.mjs`: the level registry and the
  `refine(def, contract, address)` contract with a generic projection checker.
- `src/toy.mjs`: a toy one-region P solver with two hazard kinds, plus its
  annual refinement. It exists to give the M1 harness something real to
  check.

| Test file | Acceptance |
|---|---|
| `rng.test.mjs` | `mix64` and counter vectors match the committed, independently generated vectors; `("a","bc") != ("ab","c")`; `draw(k, 1000)` computed directly equals the value after computing draws 0–999 first; `below(1)` and `below(2^32)` behave correctly; a forced-rejection fixture accepts on attempt 1; 128 rejections throw `RNG_EXHAUSTED`; an unregistered purpose throws. |
| `fixed.test.mjs` | `logPos` matches `Math.log` within 1 Q32 ulp over a fixed grid (Math.log only in the test); `floorDiv(-1, 10) = -1` for BigInt and Number; `mulDiv` rounding directions. |
| `time.test.mjs` | Negative offsets; nesting `b(k+1) = floorDiv(b(k), w)` near 2^53; half-open membership; `YEAR_NS` equals Atlas's value (constant copied, not imported); beyond `CIV_MAX_YEAR` gives `outside-model-range`. |
| `hazard.test.mjs` | For a constant hazard (h a multiple of 10 in Q32), the closed-form crossing year equals a 1-year-step reference; `yearOffset` is in [0, 9]; overshoot carries over; the 4-firing cap sets `saturated`; two causes give an order-key tie-break. |
| `events.test.mjs` | Shuffled insertion sorts identically; ordinals are dense per (owner, kind, tick); invalid records are rejected. |
| `digest.test.mjs` | Reordered object keys give the same digest; changed effects change it; the materialisation record does not change the result digest; BigInt and decimal canonical form. |
| `determinism.test.mjs` | The toy solver gives the same digest twice and in a child process; different seeds differ; the toy golden root digest for seed `civ-toy-1` is pinned. |
| `query-order.test.mjs` | Toy chapters realised forward, in reverse via checkpoints, shuffled, and with a cold cache all give identical roots. **Negative control:** a variant using one shared sequential stream fails. |
| `projection-toy.test.mjs` | `aggregate(refine(ledger)) === ledger` for every tick of a 1,000-year toy run. **Negative control:** a refine that writes back fails. |
| `determinism-lint.test.mjs` (extended) | Also bans `Math.exp`, `Math.log`, `Math.pow`, `Math.sin` and `Math.cos` in `src/` outside `fixed.mjs`, and `localeCompare` in `src/`. |

**M1 done when** all of the above pass and `npm run digest` prints the toy
golden digest.

### M2: civilisation model

**Modules:**

- `src/catalogue.mjs`: the 31 M2 kinds as data.
- `src/planet.mjs`: the P solver, its six phases, the tick ledger and
  checkpoints.
- `src/polities.mjs`, `src/tech.mjs` and `src/chains.mjs`.
- `src/domain.mjs`: the D ledger, voyages, lockstep compilation.
- `src/environment.mjs`: `StubEnvironment` and Availability.
- `fixtures/planets/*.json`: at least 3 stubs: temperate (12 regions), arid
  (8), cold archipelago (10, weak edges). Plus one anoxic world with
  alternative prerequisites, and a home system with 4 bodies (one habitable,
  two habitat-buildable, one barren).
- `fixtures/domains/toy-12.json`: a 12-system graph.

| Test file | Acceptance |
|---|---|
| `catalogue.test.mjs` | ≥ 20 kinds (31 targeted); unique `kindRank`; every kind's effects only use declared fields. |
| `fixtures-reach.test.mjs` | A **forced fixture** per kind (a stub plus a seed or parameter override) shows every M2 kind fires at least once, so rare branches are not left to ensemble chance (D3). |
| `dynamics.test.mjs` | Beverton–Holt stays between P and K; no stock is ever negative; losses are proportional; infrastructure decays; tiers stay inside the era bands; a missing resource gives a recorded ceiling. |
| `conservation.test.mjs` | Every tick: Σ transfers balance; arc + transit totals are conserved across launch and arrival; a voyage arrives after its source goes extinct. |
| `polities.test.mjs` | Every region has at most one owner; merges and splits conserve regions; retired polity IDs never come back. |
| `causal-dag.test.mjs` | The graph is acyclic; every cause has an earlier order key; hazard events satisfy `Hbefore < E <= Hbefore + h`. |
| `domain-order.test.mjs` | Permuting the arc step order in a tick gives an identical domain root. Querying the colony first, the homeworld first, or a cold cache gives identical roots. |
| `contact-horizon.test.mjs` | An arc's chapter digests before its first inbound message are identical with and without the other lineages present. |
| `expansion.test.mjs` | Known arrival chain on a 5-node graph; a disconnected node is never reached; equal-time arrivals are resolved by ID; a lost voyage records deaths; a colony inherits a capped tech level. |
| `outcomes.test.mjs` | Collapse is not extinction; an existential cap blocks the given domains; LINEAGE_EXTINCTION fires only when no arc and no voyage remains. |
| `perf-budget.test.mjs` | One seed for 20,000 years on the temperate stub finishes within the file's 2 s cap. The CLI separately reports the measured time for 400 kyr, against a 10 s target. |

**M2 done when** all pass, and the CLI runs one seed from SAPIENCE to a
terminal state or the horizon, printing:

- the outcome class;
- the 30 most salient events, with years and causes;
- the digests.

### M3: scenarios, statistics, level consistency, report and timeline SVG

**Modules:**

- `src/refine-cell.mjs`: P to C, with cells, settlement sites, anchors and
  C-only kinds.
- `src/refine-year.mjs`: the annual path.
- `src/views.mjs`: century and chapter summaries, eras.
- `src/narrative.mjs`: seeded names and a salience-filtered chronicle, with a
  separate digest.
- `src/ensemble.mjs`.
- `src/report.mjs`, which builds `out/report.md` and `out/timeline-<seed>.svg`.
  `out/` is git-ignored.
- **Signals and contact:** STELLAR_DOOM, SIGNAL_ARRIVAL and FIRST_CONTACT.
- **Scenarios** `fixtures/scenarios/*.json`:
  - `lonely-earthlike`;
  - `crowded-domain` (4 origins);
  - `harsh-anoxic`;
  - `doomed-star`;
  - `high-perils`.

**Timeline SVG content:**

- era bands along the time axis (log-scaled before E2);
- a population curve per arc;
- markers for salient events by family;
- the polity count;
- voyages as arcs between body lanes.

| Test file | Acceptance |
|---|---|
| `projection-cell.test.mjs` | Every §9.5 EXACT row holds for every tick of 4 scenarios × 1,000 years; C-only events have zero net effect and stay below the 1% cap. **Negative control:** a refine with an independent per-cell growth roll fails. |
| `projection-year.test.mjs` | Annual paths reproduce every ledger boundary; the BOUNDED tolerance is < 1 person. |
| `level-independence.test.mjs` | The P and D digests are unchanged after realising no cells, some cells or all cells, and after running narrative and views, in any order. |
| `views.test.mjs` | Century `min`/`max` equal a fold over ticks; a forced collapse-and-recovery inside one century is visible in `min`. |
| `narrative-isolation.test.mjs` | No import path from `narrative.mjs` into the solver modules; the narrative digest changes when a name grammar changes, while the result digest does not. |
| `plausibility-0N.test.mjs` | Shards of 16 seeds each, N = 64 seeds over all scenarios, each shard < 2 s with short horizons. Invariants on every seed: populations ≥ 0; energy and tiers in range; extinction is absorbing; transit accounting balances. |
| `signatures.test.mjs` | Statistical signatures, not truth: the cold-archipelago regions lag the temperate stub in median time to E2 (Kremer signature); a forced population cut causes TECH_LOSS (Henrich signature). |
| `report.test.mjs` | The report and SVG are byte-identical across two runs; the SVG is well-formed XML with no `NaN`; all events in the SVG exist in the log. |

**Ensemble variety bands** [scenario] are reported by the CLI and are *not*
claims of empirical plausibility. Over 64 seeds:

- at least 4 lineage outcome classes appear;
- at least 1 collapse followed by recovery;
- at least 1 arc reaches E3;
- at least 1 self-extinction;
- at least 1 multi-body lineage;
- at least 1 seed has `NO_LINEAGE`.

If a band fails, the runner investigates and documents any parameter change.
It never drops seeds and never reports targets as observed.

**Visual check (runner step, not a test).** Render the SVG to PNG with the
portable Inkscape or ImageMagick, then run
`node scripts/luna-eyes.mjs --prompt "<concrete questions>" <png>` from
`../universe-atlas`. Ask three times if Luna's verdict is disputed and report
every answer. Exit code 2 means "visual check NOT done".

**M3 done when** all tests pass, `npm run scenario -- --ensemble 64` writes
the report and SVG, and the Luna verdicts are recorded.

---

## 15. Risks carried forward

1. **Hazard tuning** can make every history dull or every history explode. The
   guard is the ensemble variety bands plus forced fixtures. Tuning without an
   inspector will be slow.
2. **Ten-year causal latency** inside a tick. A war and a famine in the same
   decade cannot react to each other except through chains. This is declared.
3. **Contested theories** (SDT stress, demography-driven tech, Tainter,
   Diamond-style connectivity) are swappable strategies with manifest knobs,
   never laws (trap 21).
4. **Causal attribution is a model choice.** Label the DAG "model
   attribution" everywhere it is shown.
5. **BigInt cost** over 40,000 ticks × 32 regions × 7 domains is unmeasured.
   The 10 s budget is measured in M2. If it fails, first cache hazard terms;
   only then consider varying the tick (section 12).
6. **Scenario priors dominate the outcomes** (trap 22). Present results as
   seeded scenarios, never as predictions.
7. **Atlas inputs are in flux.** Two Atlas workflows are merging, and the
   biosphere is still float `dateMyr` with a body-key seam. The stub plus
   version pins isolate the lab; integration needs a migration pass.
8. **Domain compilation cost.** Coupled arcs must be compiled jointly up to
   the queried time. The bounded domain caps this, but it is real work, not
   laziness (trap 28).
