# Astra's critique of spec v1 (2026-10-04)

This records one read-only critique pass by **Astra** (`gpt-6-astra`, Codex CLI)
over [spec.md](spec.md), what the runner (Opus 5.5) changed because of it, and
the objections that remain open.

## How the run was made

- Command, run from the session scratchpad (the prompt file and raw answer
  live in the scratchpad, which is temporary and outside the repository; the
  raw answer is reproduced in the appendix below):
  ```
  codex exec -m gpt-6-astra -s read-only --skip-git-repo-check --ephemeral \
    -C C:/LLM/IWSDK/civilization-lab -o answer.md - < prompt.txt
  ```
- Exit code 0. Astra read `docs/spec.md` in full, README, AGENTS, the
  relevant parts of `docs/research-2026-10-04.md`, and four Universe Atlas
  files (`world-time.ts`, `det-math.ts`, `catalog.ts`, `address.ts`), all
  read-only.
- No web search was enabled for this run, and none was needed: it is a review
  of the spec against the repository and the research synthesis.
- Astra states that it changed no files and ran no simulations or tests. So
  every performance claim in the spec is still **unverified**.

## Disposition of each finding

"Applied" means the spec text now implements the correction, marked
"Astra must-fix N" or "Astra should-fix N" at the change.

| # | Finding (short) | Disposition |
|---|---|---|
| MF1 | Annual refinement contradicts the commit order. Stock effects at `dateYear` versus the natural update over the whole tick can miss the endpoint or go negative. | **Applied, using Astra's second option.** Stock effects commit at the tick's end boundary, and the annual path shows them there; `dateYear` stays as the event date (spec 3.4, 9.4). Astra's *preferred* option, a chronological yearly flow ledger in P, is deferred (spec 12). See objection O1. |
| MF2 | `expQ32` can return 0, because `u53 + 0.5` rounds to `2^53`; `h = 0` is undefined. | **Applied.** `U = (u52 + 0.5) / 2^52`, which is exact; `E_q32 = max(1n, …)`; `h = 0` never fires; endpoint vectors are pinned (spec 4.3, 4.4). |
| MF3 | Multiple firings in one tick have an inconsistent residual and evidence. | **Applied.** Astra's cumulative-distance loop, an explicit `H_end`, the evidence invariant `0 < distance <= h`, and the cap belonging to the canonical decade (spec 4.4). |
| MF4 | Hazard identities omit domain, tier and edge; eligibility and pre-emption are undefined. | **Applied.** Structured `hazardId`; ineligibility pauses accumulation; pre-emption consumes the threshold (spec 4.4). |
| MF5 | Circular ordinal in the order key. | **Applied.** An immutable `intentKey` replaces the ordinal in the ID and order key; the ordinal is presentation only; the survivor of a merged reciprocal war is defined (spec 5.1, 5.2). |
| MF6 | Transfers can overdraw a shared source. | **Applied.** Every debit is resolved against the stock *remaining* in its source, in order-key order, and recorded once for both ends (spec 4.5). |
| MF7 | Exact arrival years conflict with the one-tick message latency. | **Applied.** Physical `arrivalYear` is kept separate from `deliveryTick`; passengers stay in transit until delivery; there are no partial ticks; inbox effects apply before the pre-state is frozen (spec 5.3, 8.4). |
| MF8 | Leaving perils needs a cross-arc read. | **Applied.** D evaluates the predicate after the tick barrier and sends `PERILS_EXIT`/`PERILS_REENTER` messages, so the state is reversible (spec 8.2). |
| MF9 | M2 lacks transition definitions: fuel, berths, armed, stress, power, cultural distance, prerequisites, priors, colony tiers. | **Partly applied.** "Armed" is now defined. The rest is made a gate, not filled in: `docs/transition-table-v1.md` must be written and reviewed before M2 code (spec 6.3, M2.0), and the catalogue test rejects undeclared reads. See objection O2. |
| MF10 | Derived transitions and repeated discovery are undefined. | **Applied.** ENERGY_TRANSITION is derived in phase 5d from the pre-state era versus the committed era; threshold kinds have latches; at most one tier is gained per (region, domain, tick) (spec 5.3, 5.7, 7). |
| MF11 | Mixed-lineage settlement has no consistent owner. | **Applied (prohibition).** v1 turns away voyages to a body held by another lineage, with the reason recorded; shared bodies are deferred (spec 8.4, 12). |
| MF12 | COLONY_LOST strands living people in a terminal arc. | **Applied.** COLONY_LOST makes an arc `nonviable` (people alive, extra mortality) until it recovers or reaches 0; extinction is absorbing per arc; recolonisation is a new episode (spec 5.7). |
| MF13 | Zero population or capacity divides by zero; capacity does not prove feasibility. | **Applied.** Zero cases are defined before division; a zero-weight subtree falls back to unit weights; capacities are called allocation weights, and the feasibility claim is withdrawn (spec 1, 6.2, 9.3). |
| MF14 | C-only stock effects and epoch reweighting are not constructive. | **Applied.** In v1, C-only events are annotations without stock effects; towns are derived from canonical boundary allocations; each boundary has one allocation, using the weights of the epoch containing it (spec 5.7, 9.3). |
| MF15 | The Snyder-Beattie bound is applied to the wrong event class; the per-tick hazard unit is wrong. | **Applied.** The bound now caps the rate of natural *extinction* only; `h_tick = −ln(1 − p100)/10` (spec 5.7, 8.2). Astra marks the original paper as unverified in its review; the bound's wording follows the research synthesis T4.13. |
| SF1 | The bucket ladder does not nest as claimed. | **Applied.** A chapter is 64 centuries; millennia overlap chapters; tests cover only divisibility-valid edges (spec 3.2, M1). |
| SF2 | Encoding and digest boundaries are underspecified. | **Applied.** Lone surrogates are rejected; the `below(n)` domain is defined; the Merkle construction (leaf and node prefixes, odd promotion, empty tree) is pinned with vectors (spec 4.1, 4.3, 10, M1). |
| SF3 | The contact-horizon test changes the RNG recipe it compares. | **Applied.** One immutable manifest with a test-only suppression flag, and a prefix digest over complete pre-contact ticks (spec 8.5, M2). |
| SF4 | Causal attribution is not reproducible. | **Applied.** The counterfactual is replaced by a defined heuristic score: the absolute committed delta, halved each tick, with ties broken by event ID (spec 5.6). |
| SF5 | Diffusion is double-counted; a colony "cap" is ambiguous; perils exit is irreversible. | **Applied.** DIFFUSION is the only transmission mechanism; colonies get inherited *starting* tiers, not a ceiling; perils exit is reversible. Fixtures for recovery after regression and for post-colonisation innovation were added (spec 5.7, 7, 8.2, M2). |
| SF6 | Performance and statistics are unverified and partly vacuous; there is no Aurora test. | **Applied to the tests.** Plausibility shards start from fixtures already in known regimes and assert nonzero exposure; a controlled `front-speed.test.mjs` was added; annual nonnegativity is tested. The under-2 s claims remain **unverified** until M1–M3 are measured. |

## Remaining objections (open)

These are Astra's design-level disagreements, kept as written in substance,
with the runner's response.

- **O1. Chronology (from MF1).** Astra prefers a P-owned, dated integer flow
  ledger that resolves stock availability year by year inside each tick, so
  stock effects land at their `dateYear`.
  - *Runner:* v1 chose end-of-tick commits, because the flow ledger multiplies
    the population update cost by ten and the performance budget is not yet
    measured.
  - *Open:* revisit after the M2 performance measurement, or if the M3
    timeline shows misleading in-tick staircases.
- **O2. Transition table (from MF9).** The spec still does not define every
  transition. The gate makes M2 wait for `docs/transition-table-v1.md`.
  - *Open:* until that table exists, two implementers could produce different
    histories from this spec.
- **O3. C is only an allocation view.** Astra: fixed capacity-proportional
  splitting redistributes every regional change mechanically across cells,
  which proves totals but gives little settlement history.
  - *Runner:* accepted as a label (spec 2.3). Persistent local dynamics are
    deferred and need their own contract.
- **O4. D3 was dismissed too strongly.** Astra: "two planets, 20,000 years
  cannot show stone age to space age" is unsupported. It can demonstrate the
  mechanism under authored rates, and longer horizons add workload, not
  necessarily explanatory power.
  - *Runner:* the spec's rejection reason is softened to "too narrow for the
    owner's goal" (spec 13). The disagreement about scope stands.
- **O5. 31 kinds before chronology.** Astra: requiring 31 event kinds in M2
  before stock chronology and refinement feasibility are resolved is the wrong
  dependency order, and reachability alone does not validate interactions.
  - *Runner:* partly accepted. M2 is now staged as M2.0 (the transition
    table), then M2a (a small complete model of about 15 kinds that must pass
    the applicable tests), then M2b (up to 31 kinds).
  - *Open:* the task brief requires at least 20 kinds in M2, so the
    milestone still ends there.
- **O6. Atlas claims unverified by Astra.** Astra did not verify the spec's
  claims about `placeAt`, the climate/geophysics gravity discrepancy, biosphere
  version handling, census semantics or surface-cell conventions; the four
  files it read do not establish them.
  - *Runner:* after the critique, Opus checked three of these in Atlas
    (read-only):
    - `placeAt(ctx, direction, level = 'S4', options)` at `place-query.ts:197`;
    - `biosphereStateAt` contains `void versions;` at `world-surface.ts:324`;
    - `surface-climate.ts:121–123` derives gravity as `G*massKg/radiusM^2`.
  - *Still unverified:* which gravity `placeAt` uses, the census semantics,
    and the surface-cell conventions. Those are carried from D4's earlier
    Astra run (Atlas HEAD `d4032798`).

## Astra's "verified OK" list (as reported)

- `world-time.ts`: `atlas-time-2`, Big Bang origin, `YEAR_NS`, and a catalogue
  epoch of 13,787,000,000 years.
- `catalog.ts`: the FNV-1a constants and a separate, stateful PCG.
- `det-math.ts`: `logPos` uses binary scaling and a fixed arithmetic series,
  so porting it is a reasonable deterministic choice; its accuracy is
  unverified.
- The single-crossing formula is algebraically correct when `h > 0` and
  `0 < E − H_before <= h`.
- The fixed binary split conserves totals and is leafwise monotone for fixed,
  nonnegative weights with positive denominators.
- `address.ts`: `BodyAddress`, `formatAddress` and a baseline-only branch type.
  Canonical input enforcement still needs an explicit round-trip check.
- The synthesis supports separating existential catastrophe from extinction,
  suitability from carrying capacity, and narrative from causal state.

---

## Appendix: Astra's raw answer

The text below is reproduced verbatim from `answer.md`. It refers to the
pre-revision section numbers of `spec.md`.

````markdown
## Must fix

1. **§§3.4, 5.3, 9.4 — Annual refinement cannot reproduce the stated commit semantics.** P applies the entire natural update before event effects; annual refinement spreads that update around dated effects. Counterexample: `P_start=100`, `naturalDelta=100`, and a 50% loss at tick start. P ends at 100; applying the loss annually and then adding growth ends at 150. Recording the resolved loss of 100 instead fixes the endpoint, but a total-loss event then subtracts 200 from an initial 100, producing −100. **Correction:** choose one chronology. Prefer a P-owned, dated integer flow ledger that resolves stock availability chronologically and supplies the annual path as a feasibility witness. Otherwise move effects to the end boundary and withdraw exact in-tick effect dates.

2. **§§4.3–4.4 — `expQ32` can return zero, invalidating the crossing formula.** At `u53=2^53−1`, floating-point evaluation of `u53+0.5` rounds to `2^53`, giving `U=1`, `E=0`. Quantisation also produces zero for sufficiently small positive thresholds. With `H_before=0`, the specified offset is −1; with zero hazard, division is undefined. **Correction:** explicitly define a strictly positive discrete threshold, for example the proposed rule `E_q32 = max(1n, floorQ32(-logPos(U)))`, and skip accumulation/firing when `h=0`. Pin endpoint vectors as well as logarithm accuracy.

3. **§4.4 — Multiple firings lack a consistent residual and evidence convention.** Example in integer hazard units: `H_before=0`, `h=10`, thresholds 2 then 3. After the first event, the stated `H_new=8` already exceeds the second threshold, contradicting both `E>H_before` and M2’s required `Hbefore<E`. Reusing the single-event formula also dates it incorrectly. **Correction:** track cumulative crossing distance within the original tick:
   ```
   distance = E_current - H_start
   while distance <= h:
       offset = ceilDiv(10 * distance, h) - 1
       emit(offset)
       draw E_next
       distance += E_next
   ```
   Specify final residual accumulation, crossing evidence, and cap behaviour separately. Apply the cap to the canonical decade even in a subdivided reference calculation; discarding hazard separately per substep would violate the claimed subdivision invariance.

4. **§§4.4, 6.1, 7 — Hazard identities omit required dimensions.** The ledger stores `(owner, kind, episode)`, but DISCOVERY distinguishes domains and next tiers; DIFFUSION distinguishes edges and domains. Two discoveries in one region can therefore share a threshold or overwrite one ledger entry. Eligibility interruption and rejected-intent behaviour are also undefined. **Correction:** use a structured `hazardId=(owner, kind, domain?, targetTier?, edge?)`; key and checkpoint it explicitly. Define whether ineligibility pauses or closes an episode, and whether pre-emption consumes its threshold.

5. **§§5.1–5.3 — Event ordinals are circular, so the “total order” is incomplete.** Ordinal is defined as rank by an order key that itself contains ordinal. Two same-year firings with identical owner and kind have no independent tie-break; insertion order can determine their IDs, magnitude draws and effects. **Correction:** assign immutable intent identities first, using hazard episode, chain step or scheduled-message ID. Sort by those identities before assigning dense presentation ordinals. Define the surviving identity and references when reciprocal wars merge.

6. **§§4.5, 5.3, 5.7 — Conserving transfers can still overdraw stocks.** A region with 100 people can propose two migrations of 80 to different destinations from the same pre-state. Each transfer balances, but the source becomes −60. “Competing intents on one target” does not resolve a shared source account, and proportional-loss protection does not cover transfers. **Correction:** resolve all debits against explicit source budgets in canonical order, including migration, launches and casualties. Record the accepted amount once for both endpoints; define partial acceptance versus rejection.

7. **§§3.4, 5.3, 8.4–8.5 — Exact arrivals conflict with minimum message latency.** A launch dated year 2 with one-year travel must arrive in year 3, but D only receives it after compiling that decade and cannot deliver it before the next tick. Founding an arc midway through a decade also lacks a rule preventing pre-arrival growth and hazards. **Correction:** distinguish physical arrival from causal delivery, for example:
   `deliveryYear=max(launchYear+travelYears, tickStart+10)`,
   and explicitly account for passengers while awaiting delivery. Alternatively require cross-body effects to land in a later canonical tick. Define partial founding ticks and whether inbox effects precede the frozen pre-state.

8. **§§6.1, 8.2, 8.5 — Leaving perils requires an undeclared cross-arc read.** An arc must know whether its lineage has three self-sustaining arcs, yet arcs may only learn external state through messages. Checking a live D registry during stepping can make a new colony disable hazards on some arcs before others. **Correction:** D evaluates a defined self-sufficiency predicate after the tick barrier and sends a dated `PERILS_EXIT` message. P changes `perils` only upon delivery.

9. **§§5.3, 5.7, 6–8 — M2 lacks essential transition definitions.** LAUNCH uses fuel `F`, berths and costs without a fuel stock or replenishment/debit rule; nuclear eligibility uses undeclared “armed” state. Damage duration, infrastructure construction, stress evolution, power, cultural distance, prerequisite tables, prior sampling and colony initial tiers are likewise unspecified. Implementers can produce incompatible histories while following the prose. **Correction:** add a versioned transition table defining every input field, unit, initial value, update equation, rounding rule, eligibility predicate and conflict policy. Make catalogue validation reject undeclared **reads**, not merely undeclared effect targets.

10. **§§5.3, 5.7, 7 — Derived transitions and repeated discovery have undefined semantics.** ENERGY_TRANSITION tests whether a derived era “changes” on a frozen pre-state, but no previous-era latch exists. A discovery can change the era at commit without an event at that date. Multiple DISCOVERY firings against the same pre-state can also increment several tiers without checking intermediate prerequisites. **Correction:** define derived-transition events from explicit before/after states at commit, or store threshold latches with declared delayed dates. Limit acquisition to one accepted transition per `(region, domain, tick)`, or validate a canonical sequence of target-tier intents.

11. **§§2.2, 6.1, 8.3–8.4 — Mixed-lineage settlement has no consistent owner.** If lineage B arrives at A’s occupied body, §8.4 transfers B’s passengers into the existing arc, although an arc belongs to one lineage. B’s people can disappear from its lineage accounting and trigger a false LINEAGE_EXTINCTION. Creating another arc instead duplicates access to the same body’s capacity and territory. **Correction:** either make one body solver own lineage cohorts and shared resources, or explicitly prohibit mixed-lineage settlement in v1 and define the passengers’ disposition.

12. **§§5.7, 8.3, 14 — COLONY_LOST can strand living people in a terminal arc.** A colony below minimum viable size need not have zero population. Marking it terminal neither kills nor evacuates those people; LINEAGE_EXTINCTION then requires an extinction that may never occur. **Correction:** separate loss of settlement viability from biological extinction. Specify a conserving evacuation, an explicit mortality transition, or continued population evolution. State that extinction is absorbing per **arc**, while recolonisation creates a new episode.

13. **§§6.2, 9.2–9.3 — Zero-capacity states are undefined, and capacity does not prove feasibility.** `P=K=0` makes Beverton–Holt divide by zero; an all-zero cell-weight subtree also divides by zero. Such states are natural fixtures for extinction and barren or devastated regions. Moreover, P explicitly permits `P>K`, so summing capacities does not establish allocation below capacity. **Correction:** define zero-population and zero-capacity transitions before division. Distinguish allocation weights from hard occupancy bounds and specify a zero-weight rule or explicit displaced/transit account.

14. **§§9.3–9.5 — C-only effects and spatial continuity are not constructively defined.** A budget-neutral raid moving one person from a cell containing zero to another cell still creates a negative population. If a town or local transfer persists, independently splitting the next tick’s boundary totals erases it; if it does not persist, abandonment or reversal needs an explanation. Epoch-dependent capacity weights can likewise give different cell populations on the two sides of one shared boundary. **Correction:** define canonical boundary allocations and settlement state, require every local debit to have an available source, and provide a deterministic bridge between boundaries. If C-only events are annotations without stock effects, state that explicitly.

15. **§§5.7, 8.2 — The research’s extinction bound is applied to the wrong event class, and hazard units conflict.** The synthesis’s T4.13 concerns **natural extinction**, whereas NATURAL_CATASTROPHE includes survivable infrastructure and capacity shocks. A bound on lethal outcomes does not bound the frequency of all catastrophes. Separately, `−ln(1−p100)/100` is an annual hazard, not the stated per-tick constant. **Correction:** remove the catastrophe-frequency cap or label it an authored scenario restriction; distinguish event frequency from conditional extinction severity. Use `h_tick=−ln(1−p100)/10` for decade hazards. Confidence: high for the synthesis mismatch and unit derivation; the original paper is **unverified** in this review.

## Should fix

1. **§§3.2, 14/M1 — The bucket ladder does not nest as claimed.** A 6,400-year chapter contains exactly 64 centuries, contradicting “not a decimal multiple of a century”; it does not contain an integer number of millennia. A universal adjacent-level nesting test cannot pass. **Correction:** say “years, decades and centuries nest into chapters; millennium epochs overlap chapters,” and test only divisibility-valid edges plus interval intersections.

2. **§§4.1–4.3, 10 — Encoding and digest rules need executable boundaries.** UTF-8 encoding can map distinct lone-surrogate JS strings to the same replacement character. `below(n)` has no declared domain, and Merkle construction lacks empty-tree, odd-leaf and domain-separation rules. Different implementations can therefore produce different bytes without violating the text. **Correction:** reject malformed Unicode and unsafe numeric inputs; define `1≤n≤2^64`; pin counter types, hash constants, canonical serialization and Merkle vectors.

3. **§§4.1, 8.5, 14/M2 — The contact-horizon test can change the RNG recipe it compares.** Removing other lineages by changing a manifest or its input bundle changes `manifestDigest` in every local RNG key, even before contact. Chapter digests also cannot isolate a pre-contact prefix when contact occurs midway through a chapter. **Correction:** compare runs under the same immutable manifest with external execution suppressed until contact; compare complete pre-contact ticks or an explicit prefix digest.

4. **§5.6 — Causal attribution is not reproducible enough to implement.** “Top three contributions to deviation from the no-event path” does not define the counterfactual, attribution of interacting scales, signed contributions, ties or rounding during decay. Equal contributors can produce different DAGs despite identical populations. **Correction:** define a deterministic attribution algorithm and tie-break, or replace the counterfactual claim with explicitly defined heuristic scores.

5. **§§7, 8.2, 14/M2–M3 — Existing checks can certify implausible progression.** Separate DISCOVERY diffusion and DIFFUSION events can double-count transmission. A colony “cap” may mean either inherited starting knowledge or a permanent ceiling. Three colonies can permanently eliminate self-inflicted hazards even after two fail. **Correction:** choose one diffusion mechanism, separate inherited knowledge from permanent ceilings, and define reversible risk-state transitions. Add fixtures for recovery after regression, loss of habitat support, post-colonisation innovation and renewed risk after colony loss.

6. **§§8.4, 14 — Performance and statistical acceptance remain unverified and partly vacuous.** No simulations or tests were run in this review; the under-two-second claim is **unverified** for M1, M2 and M3. Short-horizon ensembles can contain only pre-sapience states and pass every invariant. The stated Aurora oracles have no corresponding acceptance test, defined parameter mapping or tolerance. A 12-system heterogeneous graph is not automatically an equilibrium benchmark. **Correction:** use bounded fixtures beginning in known regimes, assert nonzero exposure to each tested mechanism, and benchmark actual worst-case active workloads. Add separate controlled front-speed/equilibrium fixtures. Test annual nonnegativity and dated event feasibility, not just endpoint equality.

## Objections / disagreements

- **§§2.3, 9.3:** Fixed capacity-proportional population splitting makes every regional gain or loss redistribute mechanically across cells. It proves totals but offers little settlement history. I would describe C as a spatial allocation view until persistent settlements have a defined contract.

- **§§0, 13:** “Two planets, 20,000 years … cannot show stone age to space age” is unsupported. It can demonstrate that mechanism under authored rates. Longer horizons and more bodies increase workload, not necessarily explanatory power.

- **§§5.7, 14:** Requiring 31 event kinds in M2 before resolving stock chronology and refinement feasibility is the wrong dependency order. A smaller complete model would expose these defects earlier; reachability alone does not validate interactions.

- **§11:** Claims about `placeAt`, climate/geophysics discrepancies, biosphere version handling, census semantics and surface-cell conventions are **unverified** here. The inspected time, math, catalogue and address files do not establish them.

## Verified OK

- Read **all of `docs/spec.md`**, README, AGENTS, and the relevant research sections. No files changed; no simulations or tests run.
- Atlas `world-time.ts` confirms `atlas-time-2`, Big Bang origin, the specified `YEAR_NS`, and catalogue epoch of 13,787,000,000 years.
- Atlas `catalog.ts` confirms the stated FNV-1a constants and separate stateful PCG implementation.
- Atlas `det-math.ts` confirms that `logPos` uses binary scaling and a fixed arithmetic series. The port is a reasonable deterministic choice; quantisation alone would not make an implementation-dependent logarithm deterministic. Accuracy tests remain **unverified**.
- The single-crossing formula is algebraically correct when `h>0` and `0<E−H_before≤h`.
- The fixed binary split conserves totals and is leafwise monotone for nonnegative, fixed weights with positive denominators.
- Atlas `address.ts` provides `BodyAddress`, `formatAddress` and a baseline-only branch type. Canonical input enforcement still needs an explicit round-trip check.
- The synthesis supports separating existential catastrophe from extinction, suitability from carrying capacity, and narrative from causal state.
````
