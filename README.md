# Civilization Lab

**Status: theoretical lab.** Nothing here is integrated with Universe Atlas yet.
**Evacuation avoids doomed worlds (2026-10-07, default):** from the year a
star's doom occurs, no launcher on that star's worlds targets a destination that
dies no later than its own, so a tier-7 civilisation sends every evacuee
interstellar and a tier-6 one has nowhere to go. Decided by Fable 5.1 on
Kasper's instruction (overrulable); manifest `stellarPolicy` is now
`m5-stellar-2`. The m3b 3,000-year control's companions now share its doom too
(no exemptions left). Only the doomed-star digests changed; `npm test` 182/182. See
[the doc](docs/evacuation-doom-2026-10-07.md).
**Doomed-star neighbours (2026-10-07):** the companion worlds of the doomed
star now die with it (shared `stellarDoomYear`, uninhabitable from 25,500 via
the existing stellar model), so only tier-7 interstellar evacuation can save a
lineage. Only the doomed-star digests changed; all other digests are
byte-identical; `npm test` 178/178. Surviving stellar death (habitats, arks) is
not modelled. See [the doc](docs/neighbours-doom-2026-10-07.md).
**M5 round 1 (opt-in):** failure-reason-aware targeting behind the domain API
option `targetingPolicy: 'm5-targeting-1'`. There are four failure reasons, each
with its own retry rule, and delivered success clears the failure memory.
Default runs and digests are byte-identical; `npm test` passes 159/159 with
0 skipped. The effect on launches is not yet measured with an ensemble. See
[the M5 round 1 doc](docs/m5-round1-2026-10-07.md).
**M4d:** delivered own-lineage STATUS reports now support tier maintenance
across declared interplanetary routes, with light-speed delay and expiry after
silence. The 1 kyr founding reserve remains a bridge. Lonely near-expiry colony
deaths fall from 47 to 0 in the 30-seed audit, but repeat failed-target launches
rise from 4,054 to 4,376; sustainability is not established. All 180 ensemble
runs completed without simulation errors; 13 exceeded the 30-second compile
budget. The seven colony tests pass in 533 ms alone; the signatures file exceeds
two seconds. Final `npm test`: **151/151 pass, 0 skipped; exit 0**.
M1 is unchanged. See the [M4d handoff](docs/m4-implementation.md#m4d--lineage-support-network)
and [plausibility audit](docs/m4-plausibility.md) for comparisons and limitations.

**M3 legibility round 2:** exact-year event guides, 16-pixel minimum text,
compact empty histories, explicit scale breaks and directed voyage connectors.
`npm test`: **123 pass, 0 fail, 1 skipped**; the changed report test file took
**0.627 seconds** alone. The M1 digest and prior 64-seed report are unchanged.
The report and all six SVGs are byte-identical at jobs=1 and jobs=4.
Visual check NOT done; rasterisation and Luna review remain runner work.
See [the M3 handoff](docs/m3-implementation.md) for fresh validation evidence.

**Previous M3 fix round:** revised timelines, representative and empty-history SVGs,
time-stratified event/voyage samples, launch density and explicit era censoring.
Previous round `npm test`: **122 pass, 0 fail, 1 skipped**; all seven changed test
files finish below two seconds alone. Fresh commands and timing evidence are in
[the M3 handoff](docs/m3-implementation.md). The M1 digest is unchanged.
The full 64-seed report and six SVGs are byte-identical at jobs=4 and jobs=1.
The fixed 16-seed-per-planet Kremer panel has cold median **9,264** versus
**4,866** temperate. At M3 the original four-seed test was **NOT MET** and
skipped (3,981 versus 4,843); since M4 it **passes** on `main` (cold lower
median 36,373 versus temperate 27,598 years; 0 skipped, re-verified 2026-10-07).
No model, fixture, prior or golden changed in M3.
E3-start lower median times to E5/E6/E7 are **480/540/580 years**, an open
calibration item. **Visual check NOT done** for revised SVGs: structural
collision/XML checks passed; rasterisation and Luna remain runner work.
**M1 implemented:** deterministic core, one-region toy, chapter replay and exact
annual projection, with independent RNG/Merkle vectors and negative controls.
**M2b implemented for runner review:** all 31 kinds, hard-step origins,
the lockstep domain ledger, voyages, colonies, shared catastrophes, perils
messages and lineage outcomes. The anoxic, home-system and toy-12 fixtures
are included. `npm test`: **82/82 pass** (M2 fix round, 2026-10-04; 26 test
files, each below two seconds). The standalone 400 kyr / 10 s
target is met only for civ-m2a-1 (8.8–9.2 s); busy seeds civ-m2a-2 and
civ-m2a-6 take 12.3–12.8 s in the runner's measurements. The target is
**NOT MET on the seed panel**, an open item for a future performance round.
Exact measurements and the 16-seed domain survey are in
[the M2 handoff](docs/m2-implementation.md). M1's golden is unchanged.
These remain authored scenarios, not calibrated historical predictions.
This repository exists to work out — on paper first, then in small deterministic
Node simulations — how civilisations can be generated so that they cohere with
a deterministic 4D universe.

## Vision

[Universe Atlas](../universe-atlas) is a deterministic procedural universe in
space *and* time, travelable from beginning to end, and a platform other games
build on. Its next big capability is **civilisations**:

- from the **stone age** to whatever the future holds on each planet;
- science-fiction futures in which a civilisation **travels between planets and
  spreads**, or **wipes itself out**, or stagnates, collapses and recovers;
- a rich vocabulary of **historical events** (migrations, wars, plagues,
  discoveries, schisms, collapses, contact, colonisation, extinction);
- **levels** — of abstraction, of time and of spatial scale — that hold
  together, so that a coarse answer ("is planet X inhabited in epoch Y, at what
  tech level?") and a fine answer ("what happened in this city in this century?")
  never contradict each other.

The lab plays the role [Creature Lab](../universe-atlas) plays for fauna: a
standalone place to design, test and inspect the generator before it is wired
into Atlas's planets, climate, biomes, fauna and time.

## Determinism rules

Every generator in this repository must obey these rules; `npm test` lints for
the most common violations.

1. **No wall clock, no unseeded randomness.** No `Date.now`, `new Date()`,
   `performance.now`, `Math.random`, `crypto.getRandomValues`.
2. **Seeded, split RNG streams** keyed by `(seed, entity, level, time bucket)`.
   A stream for one entity never consumes from another's.
3. **Order independence.** The same seed yields the same history regardless of
   query order and of which levels have been realised. Never depend on object
   key order, `Map`/`Set` insertion order from unordered sources, or iteration
   over the results of earlier queries; sort explicitly.
4. **Well-defined arithmetic.** Prefer integers (with explicit overflow
   semantics; never `Math.imul` for distances). Floats only where the operation
   is IEEE-exact and platform-independent; no transcendental functions on a
   path that feeds a digest unless their result is quantised first.
   The `**` operator and `Math.pow` are forbidden in `src/`; use integer shifts, BigInt shifts or literal constants (enforced by `tests/determinism-lint.test.mjs`).
5. **Coarse constrains fine.** A finer level is a refinement conditioned on the
   coarser level's outcome; it may add detail, never contradict it.
6. **Digests.** Each scenario emits a stable digest of its results so that
   determinism is checked by comparing hashes across runs and query orders.

## How to run

Requires Node 22 or newer; there are no dependencies.

```powershell
npm test            # node --test "tests/**/*.test.mjs"  (fast, deterministic, no browser/GPU)
npm run scenario    # node src/cli.mjs
npm run digest      # node src/cli.mjs --digest
node src/cli.mjs --civ temperate --seed civ-m2a-1 --years 20000
node src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1
node src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-14 --years 100000
npm run scenario -- --scenario lonely-earthlike --seed s1
node src/cli.mjs --scenario crowded-domain --seed m3-1 --until-year 1000
npm run scenario -- --ensemble 64
node src/cli.mjs --ensemble 8 --scenario doomed-star --jobs 2 --out out/doom
node src/cli.mjs --ensemble 8 --until-year 1000 --timeline crowded-domain-1
node src/cli.mjs --ensemble 2 --scenario high-perils --timeline custom-seed
npm run perf        # tools/perf-civ.mjs: 400 kyr, measured outside src/
npm run perf:panel  # 400 kyr, seeds civ-m2a-1, -2, -6; worst-seed verdict
```

## Layout

- `docs/` — design notes; `docs/research/` holds sourced web research.
- `src/` — generator code (`src/cli.mjs` is the entry point).
  Core modules: `time.mjs`, `fixed.mjs`, `rng.mjs`, `canonical.mjs`,
  `digest.mjs`, `events.mjs`, `hazard.mjs`, `manifest.mjs`, `levels.mjs`;
  `toy.mjs` supplies the M1 solver and annual refinement.
- M2a: `catalogue.mjs`, `planet.mjs`, `tech.mjs`, `polities.mjs`,
  `chains.mjs`, `provenance.mjs`, `environment.mjs`, `civ-input.mjs`;
  `fixtures/planets/` contains temperate, arid and cold-archipelago inputs.
- M2b: `domain.mjs` compiles D and isolated P ticks; `m2b.mjs` supplies the
  additional P recipes. Domain runs default to 400 kyr after first sapience,
  stop on terminal lineage outcomes, and respect the declared 2 Myr bounds.
  `--years N` overrides that post-sapience duration. The observation-only
  survey is `node tools/survey-domain.mjs`.
- `tests/` — `node --test` files, each well under two seconds.

See [AGENTS.md](AGENTS.md) for the rules that agents working here follow.
M1's API choices, toy parameters and acceptance map are in
[docs/m1-implementation.md](docs/m1-implementation.md).
M2a's APIs, acceptance map, measurements and limitations are in
[docs/m2-implementation.md](docs/m2-implementation.md).

M2a fix-round evidence and remaining performance work are recorded in
[docs/m2-implementation.md](docs/m2-implementation.md). Reproduce the eight-seed
400 kyr survey with `node tools/survey-civ.mjs` (long-running, outside the lean
unit suite). It writes counts, maximum eras, first attainment years and roots to
`docs/evidence/m2a-fix-survey.json`. No survey outcome is a unit-test assertion.

Ensemble seeds use global indices i=0..N-1: without --scenario, choose
[lonely-earthlike, crowded-domain, harsh-anoxic, doomed-star, high-perils, forager-future][i % 6],
then name the seed <scenario>-<i>. With --scenario, use that scenario at every i.
Default horizons are 320,000 years for lonely-earthlike, 120,000 for
forager-future and 30,000 for the other four. Default jobs = min(4, CPU count). Results are sorted by scenario
and seed before aggregation; errored seeds stay in N. Output is out/report.md
and a representative timeline per scenario: the inhabited non-error seed with
the most accepted salient events, ties by seed. The first empty-history (NO_LINEAGE or PENDING_ORIGIN) seed per
scenario also gets a timeline when present; it is the fallback if no active
history exists. All-error scenarios have no automatic timeline. Repeated --timeline flags add requested
seeds; additional seeds outside the ensemble get timelines but do not change N.
An extra seed needs a scenario prefix or --scenario. Percentages truncate to
one decimal using integer arithmetic. Wall times print separately to stderr,
never into the byte-reproducible report or SVG. These are **seeded scenarios,
model attribution, not predictions**.

PENDING_ORIGIN means an origin scheduled beyond the horizon (right-censored);
NO_LINEAGE means its window was exhausted or it was preempted. Both stay in N.

Era counts E3–E6 distinguish starts at/above, attainment during the run from
below, and never reached, with errors separately unknown; every fraction keeps
all runs in N. Lower time-to-era medians include only runs starting below and
reaching the threshold, with left/right censor counts alongside. Legacy metric
names remain and explicitly include advanced starts. Calibration rows report
E3-to-E5/E6/E7 times for runs starting exactly at E3. Timeline curves use short
body/arc labels with the full body key retained. SVG height adapts to avoid
text collisions.
