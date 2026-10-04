# M2a performance round 2 — runner handoff

**Observed budget pass:** `node tools/perf-civ.mjs 400000` completes in
**9380.25 ms**, with **374.24 MiB end RSS**, 16797 events and a largest P+D
chapter of 1.81 MiB. Another final-implementation run measured 9338.46 ms /
367.50 MiB. The desired 7 s margin is not achieved; Opus should remeasure.
Node was v24.7.0. No heap flags, explicit GC, skipped ticks, network, dependencies,
git writes, commits or Atlas edits were used. Profiles and scratch stayed in TEMP.

## Performance changes and memory lifetime

- Hazard identities and static opportunity descriptors are memoized per
  definition. The owner table is capped at 256 owners; each owner's possible
  entries are bounded by the fixed partition, domains and maximum tiers.
  Regional and collapse caches retain one latest input vector per region.
  Rate templates are ephemeral solver workspace, never embedded in state or
  witnesses; diffusion target tiers are refreshed with the current opportunity.
- Provenance slots are materialized only for firing opportunities. Incoming
  adjacency, gates for all seven domains, learning thresholds and effective
  populations avoid repeated calculations. Non-firing hazard changes avoid
  threshold advancement/identity revalidation; the arithmetic and lazy clock
  values are unchanged. BigInt remains in all stock and hazard calculations.
- The prepared arc, population, pressure and hazard-index workspaces retain
  only the current evaluation. Historical or interleaved queries use the pure
  fallback/rebuild path. All Maps/Sets are keyed lookup workspaces; none are
  iterated to construct state or digests. Sorted source arrays determine order.
- Events are validated and sorted when created. Chronologically disjoint tick
  batches concatenate directly. Canonical safety validation no longer builds
  an event serialization merely to discard it. Its unsafe-value rejection is
  tested against canonicalBytes. SHA-256 uses Node's equivalent one-shot API.
- P/D chapter bytes stream through a small UTF-8 buffer. No encoded chapter or
  event trees/strings are retained. Chapter caching is a **two-entry LRU**,
  including reverse and cold result-root queries. compileSummary retains events,
  archive/checkpoints and live/current-chapter state, never the full tick history.
  `run()` remains an explicit inspection API returning per-tick full snapshots;
  it is not the long-history memory-budget API.

## Witness representation and replay

The normative append-only annex in [transition-table-v1.md](transition-table-v1.md)
specifies `m2a-delta-witness-1`. Each tick chains a SHA-256 commitment to the
changed arc/region fields and changed live hazards. Typed, length-prefixed text
avoids constructing and serializing a JSON patch tree. Equality is by value;
copy-on-write identity is only a shortcut. Full structural state digests remain
at every 640-tick checkpoint/chapter boundary, the final model tick and terminal
tick. Checkpoint records remain exactly `{tick,live,archiveRecords}`.

`ledger.endState` is now a transition commitment; `ledger.structural` is the
full stateDigest at a boundary, otherwise null. The next tick starts from the
structural digest when present, otherwise the prior endState. Compact ledgers
omit redundant naturalDelta/polityNatural rows; inspection output and the default
stepPlanet updates retain them. All resulting state changes are committed.

The prior contract prefix and machine table remain the RNG manifest domain.
The representation-only annex is excluded from CONTRACT_TEXT; its version is
committed in each P ledger and transition hash. This deliberate separation keeps
the manifest, RNG addresses, calibration and event outcomes unchanged. Editing
the original contract prefix still changes the RNG manifest. Result digests
change solely because the witness representation changes.

An independent test decoder reads the annex grammar, reconstructs every
replayed state from checkpoint 640 through environment epoch 700, checks the
full structural commitment, every tick ledger and the next chapter leaf.
Additional checks cover serialized clones, complete field coverage, streamed
encoder parity, warm/cold/interleaved caches, eviction and cache clearing.

## Exact observed checks (round 2)

`npm test`: **59 tests, 59 pass, 0 fail, 0 skipped, 0 todo**, 3579.3917 ms.
The determinism lint and M1 tests pass. The new test file alone,
`node --test tests/m2a-perf.test.mjs`, reports **5 pass, 0 fail**, 1107.9622 ms;
it is the largest file in this round and remains under two seconds. The suite's
20 kyr check measured 111.17 ms. Transcript:
[m2a-perf-round2-tests.txt](evidence/m2a-perf-round2-tests.txt).

`npm run digest`:

```text
c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc
```

The updated self-generated 100-year M2 witness golden (not an independent
correctness oracle) is
`868931e18ed59a4c11a68df399be4ce074911d44d1886176a4f07bd9011c57e5`.

`node tools/perf-civ.mjs 20000`:

```text
20000 years: 110.99 ms; target 700 ms; 3 events; 82dcfb55bc598208b9d53a386b57d0403346f5316d651618bab33abda957d675
RSS: 109.38 MiB; largest P+D chapter: 0.34 MiB
Events digest (sorted IDs, JSON): 0a3f42fbaa13922ce809686748f663dc1347317618579e178a5c903b0da41766
Heap: 32.82 MiB used; 49.97 MiB reserved
CPU: 281.00 ms
```

`node tools/perf-civ.mjs 150000`:

```text
150000 years: 3049.13 ms; target not specified; 6320 events; c640571804f47f544cce203afa50aaab09a6d0e61894a8e3ea6fd40d90c1d64d
RSS: 283.69 MiB; largest P+D chapter: 2.17 MiB
Events digest (sorted IDs, JSON): dc6e593a4eb1d4e89728dca41a1dbe69aa8de7b8699ad398da5b8e2184688009
Heap: 151.22 MiB used; 219.75 MiB reserved
CPU: 4452.00 ms
```

`node tools/perf-civ.mjs 400000`:

```text
400000 years: 9380.25 ms; target 10000 ms; 16797 events; e09da2d6624c2afc1b5688e102fa1e7e8c1e212b9a6bf7f8dd24a534be329a43
RSS: 374.24 MiB; largest P+D chapter: 1.81 MiB
Events digest (sorted IDs, JSON): 4903cd4325a4cb5605d1a9e1fc46d7c5f7cf9f5d9bcaf069c7f3398bbcca3938
Heap: 164.31 MiB used; 305.86 MiB reserved
CPU: 12031.00 ms
```

These are complete fresh-process compilations including root hashing. Optional
`--identity` work and printing occur after the timed compilation and RSS sample.

## Event identity before/after at 150 kyr

Baseline was captured from 4228517 before source edits. Full records, not just
IDs, match: kinds, dates, owners, effects, causes and resolutions are identical.
Counts include accepted and pre-empted events. Evidence, including both old/new
result roots: [m2a-perf-round2-events.json](evidence/m2a-perf-round2-events.json).
Reproduce the after records with `node tools/perf-civ.mjs 150000 civ-m2a-1 --identity`
and the same command with `civ-m2a-2`.

| Kind | Seed 1 before → after | Seed 2 before → after |
|---|---:|---:|
| AGRICULTURE | 6 → 6 | 3 → 3 |
| COLLAPSE | 66 → 66 | 30 → 30 |
| CONQUEST | 1058 → 1058 | 505 → 505 |
| DIFFUSION | 66 → 66 | 259 → 259 |
| DISCOVERY | 882 → 882 | 338 → 338 |
| ENERGY_TRANSITION | 46 → 46 | 50 → 50 |
| EXTINCTION | 0 → 0 | 0 → 0 |
| FAMINE | 68 → 68 | 36 → 36 |
| MIGRATION | 20 → 20 | 19 → 19 |
| PLAGUE | 793 → 793 | 510 → 510 |
| POLITY_FOUNDING | 13 → 13 | 12 → 12 |
| RECOVERY | 66 → 66 | 30 → 30 |
| SAPIENCE | 1 → 1 | 1 → 1 |
| TECH_LOSS | 0 → 0 | 0 → 0 |
| WAR | 3235 → 3235 | 1541 → 1541 |

```text
Sorted IDs: SHA256(UTF8(JSON.stringify(lexically sorted IDs)))
civ-m2a-1 before dc6e593a4eb1d4e89728dca41a1dbe69aa8de7b8699ad398da5b8e2184688009
civ-m2a-1 after  dc6e593a4eb1d4e89728dca41a1dbe69aa8de7b8699ad398da5b8e2184688009
civ-m2a-2 before 8fad4f6e94925cf4de239e382ad2a10619f1b9ce0c62da90d599b38b1c662241
civ-m2a-2 after  8fad4f6e94925cf4de239e382ad2a10619f1b9ce0c62da90d599b38b1c662241

Full records: SHA256(canonicalBytes(events in event order))
civ-m2a-1 before 33ce4520d43abef6d194db851d003072515fe1a1293c3fa549b8e0f9947ee843
civ-m2a-1 after  33ce4520d43abef6d194db851d003072515fe1a1293c3fa549b8e0f9947ee843
civ-m2a-2 before 4a35709611c2784d308f4abb1910b767e90046b7286acd1677421b2b84c2ec96
civ-m2a-2 after  4a35709611c2784d308f4abb1910b767e90046b7286acd1677421b2b84c2ec96
```

## Round 2 files and known gaps

Runtime: `canonical.mjs`, `delta-witness.mjs` (new), `digest.mjs`,
`environment.mjs`, `events.mjs`, `hazard.mjs`, `planet.mjs`, `polities.mjs`,
`provenance.mjs`, `state-witness.mjs`, `tech.mjs`, `witness.mjs` under src/.
Tests: `m2a-perf.test.mjs` (new), `m2a-fix.test.mjs`, `civ-determinism.test.mjs`.
Tool: `tools/perf-civ.mjs`. Docs: this handoff, README, the table annex and two
round-2 evidence files. No calibration, fixture, catalogue or event recipe changed.

The final measured time margin is about 620 ms; **under 7 s was not achieved**.
Runner remeasurement is still needed. The full eight-seed 400 kyr survey was
not rerun; the minimum two-seed 150 kyr audit additionally verifies all event
fields. The earlier eight-seed survey below is historical evidence, not a new
round-2 measurement. M2b and the earlier non-performance scope gaps remain deferred.

## Historical fix-round 1 handoff (4228517; performance superseded above)

**Not ready for acceptance: the 400 kyr / 10 s budget still fails.** The dynamics
survey meets the requested progression target (8/8 reach E4). The 20 kyr run is
below 700 ms. All 54 tests pass, including every M1 test and the unchanged toy
golden. This is a substantial performance improvement over the runner's 343 s
baseline, but it does not fix both blocking issues; Opus should not mark the
round complete on this evidence. No commit, git write, push, remote, deployment,
preview, network access or dependency installation was performed. Atlas stayed
read-only. All calibration changes are authored scenarios, not historical claims.

## Causes and changes

The old COLLAPSE recipe was arc-wide and removed 1–2 tiers in **every domain of
every region**, with additive complexity across the entire occupied partition.
Its stress500 contribution alone implied a mean 4000 years between exposures.
RECOVERY cleared a demographic/infrastructure flag and gave no tiers back.
ENERGY_TRANSITION counted downward transitions too: 162 events did not mean 162
advances. Together these rules repeatedly destroyed the sources of diffusion.

The revised recipe has a region owner, local complexity, one-tier loss, a stress
coefficient one tenth as large, one accepted collapse per region per tick, and
no exposure during active recovery. Population/infra losses remain 300/700
permille. Only the victim's polity may split; other regions retain stocks and
knowledge. Recovery retains its old stock thresholds and no tier gift. Ordinary
rediscovery/diffusion can now rebuild a damaged region from surviving neighbours.

Subsistence uses coefficient 400 instead of 40, retaining the domesticables
multiplier for agriculture. This also reconciles the table with the existing
400 for post-agriculture Subsistence discovery. Six survey seeds first farmed
before 25 kyr, one at 30.7 kyr and one at 55.5 kyr. The slow first seed remains
consistent with D6's explicit permission for foragers throughout a 20 kyr run;
no seed exception or asserted survey outcome was introduced.

Natural wartime legitimacy loss and subsequent stress increases now propagate
actual WAR source IDs. Pre-state legitimacy/stress/weariness attribution feeds
increasing stress. While stress exceeds 100, its bounded top-three attribution
scores use ceil-half decay, preserving residual war attribution instead of
rounding it immediately to zero. Other fields retain floor-half decay. Baseline
stress/complexity still has no invented cause: the CLI's first collapse occurs
before its first war. The later displayed collapses carry real RAISED_HAZARD
WAR links. Famine reduces population pressure here; it need not raise stress.

The CLI prints kind@year and short owner labels for causes, preserves descending
base salience, and limits each kind to three of the 30 displayed entries. It also
prints the maximum occupied era and first committed boundary year. Full counts
and root contents are unaffected by this presentation cap.

## Witness format, replay and performance work

- `chapter()` retains compact tick witnesses. Start, phase-0 and end state are
  structural SHA-256 digests. The exact encoding is `[rest,regionTuples,
  hazardRoot,episodeRoot]`, specified field-by-field in the machine-readable
  transition table and independently reconstructed by a test. The keyed rest
  includes every other arc field. Natural and polity deltas use fixed tuples.
- `stepPlanet()` returns `{ledger,state,pre,updates,events,exposures}`; state and
  pre are the replayable solver records. `run().ledgers` expands short inspection
  runs to the original named deltas/full snapshots. Those inspection copies do
  not enter chapter roots. Use `compileSummary()` for long histories.
- Checkpoints remain exactly `{tick,live,archiveRecords}` with complete domain
  state and no RNG cursor. A test starts at checkpoint 640, reproduces every tick
  witness and the next chapter leaf, and compares internal encoder bytes with
  public canonicalBytes. Existing reverse/cold/cache-clear root tests still pass.
- M2 hazard keys are SHA-256 of the original hex identity; the original identity
  still addresses threshold RNG. Entries use exact lazy clocks: effective H at
  boundary t is stored H+(t-atTick)*rate. Changes, pauses and firings materialize
  H; an eager M1 advancement test covers this equivalence.
- Attained acquisition targets retire to the append-only archive. A sorted
  `{key,episode}` counter preserves a fresh episode on later reacquisition.
  Other ineligible hazards still pause. Archive IDs include the episode.
- Standalone M2a D witnesses reference the P digest. Complete domain envelopes
  remain in checkpoints; cross-body coupling and M2b barrier formats are deferred.
- The implementation reuses frozen hazard/latch records, cached gates and
  regional opportunities, per-snapshot population/pressure/member lookups, and
  indexed distances. Generated witnesses avoid repeatedly validating descriptors
  of internally constructed records; public input validation remains strict.
  Event validation memoization applies only after recursive freezing. Map/Set
  caches are used for keyed lookup, never unordered state iteration.
- Small Number floor divisions use a bounded, exact binary64 fast path;
  large safe-integer edge cases retain BigInt division. BigInt division avoids
  unnecessary conversions. M1 arithmetic tests and the toy digest remain intact.

The largest P+D chapter is 2.77 MiB in the measured 400 kyr run, rather than the
reported ~250 MB. End RSS remains high (938.93 MiB); chapter text was only one
source of cost. The event/archive/checkpoint working set and remaining solver/
serialization overhead still need work. No sub-10-second result is claimed.

## Exact observed checks

`npm test`: **54 tests, 54 pass, 0 fail, 0 skipped**, 2924.777 ms total.
The suite's own 20 kyr performance test measured 305.75 ms. Each file stayed
under two seconds. `node --test tests/catalogue.test.mjs`: **2 pass, 0 fail**;
this independently parses and audits the committed JSON table. The builder
`node tools/build-m2-data.mjs` was rerun; fixture/catalogue payloads did not change.
The complete test transcript is in `docs/evidence/m2a-fix-tests.txt`.

`npm run digest` printed:

```text
c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc
```

The M2 self-generated 100-year golden changed, as expected for a revised
manifest/representation. It is a stability check, not independent correctness
evidence. `node src/cli.mjs --civ temperate --seed civ-m2a-golden --years 100 --digest`:

```text
3e26dc98be723f670615397d4115b3edab0bd43bb3a914e826aa76b3ff767ee3
```

`node tools/perf-civ.mjs 20000`:

```text
20000 years: 309.53 ms; target 700 ms; 3 events; da16e0528a755905cb62fe13bf8f73c173b52577c3309f363e8fa52cc4a1aecd
RSS: 156.88 MiB; largest P+D chapter: 0.96 MiB
```

`node tools/perf-civ.mjs 400000`:

```text
400000 years: 39310.20 ms; target 10000 ms; 16797 events; ccecf4c68fa9430fbb585c03ae12f4a90756898296f8f9332bb2130779d6dbca
RSS: 938.93 MiB; largest P+D chapter: 2.77 MiB
```

## Eight-seed 400 kyr survey

Command: `node tools/survey-civ.mjs`. Each seed runs in a fresh Node process.
All outcomes below are EXTANT_PLANETARY; all maxima are E4. They are observations,
not tests or research claims. Exact roots/timings/RSS and counts are saved in
`docs/evidence/m2a-fix-survey.json`.

| Seed | Outcome | Max era | First reached year | First agriculture year |
|---|---|---:|---:|---:|
| civ-m2a-1 | EXTANT_PLANETARY | E4 | 96230 | 55522 |
| civ-m2a-2 | EXTANT_PLANETARY | E4 | 25990 | 2685 |
| civ-m2a-3 | EXTANT_PLANETARY | E4 | 47380 | 24197 |
| civ-m2a-4 | EXTANT_PLANETARY | E4 | 62850 | 14636 |
| civ-m2a-5 | EXTANT_PLANETARY | E4 | 78260 | 30718 |
| civ-m2a-6 | EXTANT_PLANETARY | E4 | 19880 | 6382 |
| civ-m2a-7 | EXTANT_PLANETARY | E4 | 31580 | 12125 |
| civ-m2a-8 | EXTANT_PLANETARY | E4 | 28200 | 14100 |

Counts include accepted and pre-empted events, matching CLI totals.

| Kind | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| SAPIENCE | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| MIGRATION | 53 | 40 | 37 | 33 | 37 | 47 | 44 | 38 |
| AGRICULTURE | 1 | 6 | 4 | 2 | 1 | 6 | 2 | 4 |
| FAMINE | 167 | 211 | 214 | 180 | 179 | 224 | 216 | 200 |
| PLAGUE | 2735 | 2554 | 2654 | 3048 | 2699 | 2727 | 2525 | 2520 |
| DISCOVERY | 820 | 1538 | 1550 | 858 | 922 | 1584 | 1536 | 1669 |
| DIFFUSION | 805 | 423 | 447 | 884 | 847 | 462 | 429 | 256 |
| TECH_LOSS | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ENERGY_TRANSITION | 61 | 46 | 50 | 66 | 61 | 48 | 48 | 46 |
| POLITY_FOUNDING | 12 | 13 | 12 | 12 | 12 | 12 | 12 | 12 |
| WAR | 8886 | 10411 | 9796 | 9697 | 8951 | 11154 | 11307 | 10220 |
| CONQUEST | 2902 | 3393 | 3188 | 3162 | 2929 | 3654 | 3687 | 3337 |
| COLLAPSE | 177 | 219 | 222 | 192 | 195 | 232 | 220 | 207 |
| RECOVERY | 177 | 219 | 222 | 192 | 195 | 232 | 220 | 207 |
| EXTINCTION | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Exact CLI example

`node src/cli.mjs --civ temperate --seed civ-m2a-1 --years 400000`:

```text
M2a temperate; seed civ-m2a-1; 400000 years; 12 regions; 16797 events.
Outcome: EXTANT_PLANETARY; population 5939684; era E4; live polities 3.
Maximum era: E4; first reached at year 96230.
Event counts (all / accepted / openers / steps / pre-empted / eligible hazard opportunity-ticks):
SAPIENCE: 1 / 1 / 0 / 0 / 0 / n/a
MIGRATION: 53 / 53 / 0 / 0 / 0 / 856988
AGRICULTURE: 1 / 1 / 0 / 0 / 0 / 29755
FAMINE: 167 / 167 / 0 / 0 / 0 / n/a
PLAGUE: 2735 / 2733 / 687 / 2048 / 2 / 427476
DISCOVERY: 820 / 817 / 0 / 0 / 3 / 195549
DIFFUSION: 805 / 800 / 0 / 0 / 5 / 155748
TECH_LOSS: 0 / 0 / 0 / 0 / 0 / n/a
ENERGY_TRANSITION: 61 / 61 / 0 / 0 / 0 / n/a
POLITY_FOUNDING: 12 / 12 / 0 / 0 / 0 / 1966
WAR: 8886 / 8807 / 3012 / 5874 / 79 / 185374
CONQUEST: 2902 / 2901 / 0 / 2902 / 1 / n/a
COLLAPSE: 177 / 177 / 0 / 0 / 0 / 391784
RECOVERY: 177 / 177 / 0 / 0 / 0 / n/a
EXTINCTION: 0 / 0 / 0 / 0 / 0 / n/a
Most salient events (model attribution):
SAPIENCE@0 (arc); causes none
COLLAPSE@68438 (r03); causes none
COLLAPSE@92763 (r07); causes RAISED_HAZARD: WAR@90580 (pol:9051:12:r07:0>pol:8832:12:r05:0), RAISED_HAZARD: WAR@90590 (pol:9051:12:r07:0>pol:8832:12:r05:0), RAISED_HAZARD: WAR@90600 (pol:9051:12:r07:0>pol:8832:12:r05:0)
COLLAPSE@97228 (r11); causes RAISED_HAZARD: WAR@90269 (pol:8954:12:r10:0>pol:8965:12:r01:0), RAISED_HAZARD: WAR@89755 (pol:8965:12:r01:0>pol:8738:12:r00:0), RAISED_HAZARD: WAR@90047 (pol:8965:12:r01:0>pol:8954:12:r10:0)
CONQUEST@87670 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes CHAIN: WAR@87640 (pol:8738:12:r00:0>pol:8590:12:r11:0)
CONQUEST@88050 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes CHAIN: WAR@88028 (pol:8738:12:r00:0>pol:8590:12:r11:0)
CONQUEST@88360 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes CHAIN: WAR@88330 (pol:8738:12:r00:0>pol:8590:12:r11:0)
ENERGY_TRANSITION@55522 (r02); causes ENABLED: AGRICULTURE@55522 (r02)
ENERGY_TRANSITION@55982 (r03); causes ENABLED: DIFFUSION@55982 (r02~r03)
ENERGY_TRANSITION@57326 (r01); causes ENABLED: DIFFUSION@57326 (r02~r01)
AGRICULTURE@55522 (r02); causes none
RECOVERY@69230 (r03); causes none
WAR@87640 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes none
WAR@87650 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes CHAIN: WAR@87640 (pol:8738:12:r00:0>pol:8590:12:r11:0)
WAR@87660 (pol:8738:12:r00:0>pol:8590:12:r11:0); causes CHAIN: WAR@87640 (pol:8738:12:r00:0>pol:8590:12:r11:0)
RECOVERY@97590 (r11); causes TRIGGERED: WAR@97460 (pol:9722:19:r00:0>pol:9730:19:r05:1), TRIGGERED: WAR@97500 (pol:9730:19:r05:1>pol:9722:19:r00:0), TRIGGERED: WAR@97510 (pol:9730:19:r05:1>pol:9722:19:r00:0), TRIGGERED: PLAGUE@97480 (r10)
RECOVERY@97670 (r09); causes none
DISCOVERY@61415 (r11); causes none
DISCOVERY@62827 (r11); causes RAISED_HAZARD: PLAGUE@62760 (r01), RAISED_HAZARD: PLAGUE@62770 (r01)
DISCOVERY@65738 (r04); causes none
POLITY_FOUNDING@85900 (r11); causes RAISED_HAZARD: PLAGUE@85830 (r00)
POLITY_FOUNDING@87385 (r00); causes RAISED_HAZARD: PLAGUE@87370 (r02)
POLITY_FOUNDING@88253 (r06); causes none
PLAGUE@13890 (r11); causes none
PLAGUE@13900 (r11); causes CHAIN: PLAGUE@13890 (r11)
PLAGUE@13910 (r11); causes CHAIN: PLAGUE@13890 (r11)
FAMINE@68440 (r03); causes TRIGGERED: COLLAPSE@68438 (r03)
FAMINE@92770 (r07); causes TRIGGERED: WAR@92710 (pol:8832:12:r05:0>pol:9051:12:r07:0), TRIGGERED: WAR@92720 (pol:8832:12:r05:0>pol:9051:12:r07:0), TRIGGERED: COLLAPSE@92763 (r07)
FAMINE@97230 (r11); causes TRIGGERED: PLAGUE@97100 (r10), TRIGGERED: COLLAPSE@97228 (r11)
DIFFUSION@55982 (r02~r03); causes none
Manifest digest: f8942d82925185e803bfa081bb29586319bba78ebe89f873dec4fd6950648693
Recipe digest: 69a4ae9a610e253197a5ad2df98ec0b25095dc04173ba99bfcc48b33e17cdd45
Result digest: ccecf4c68fa9430fbb585c03ae12f4a90756898296f8f9332bb2130779d6dbca
```

## Files and remaining gaps

Changed solver/support files: `src/planet.mjs`, `src/state-witness.mjs` (new),
`src/witness.mjs` (new), `src/civ-input.mjs`, `src/events.mjs`, `src/hazard.mjs`,
`src/polities.mjs`, `src/provenance.mjs`, `src/tech.mjs`, `src/time.mjs`,
`src/cli.mjs`. Tests: `tests/m2a-fix.test.mjs` (new),
`tests/civ-determinism.test.mjs` (M2 golden). Tools: `tools/perf-civ.mjs`,
`tools/survey-civ.mjs` (new). Docs: README, transition table (prose + JSON +
revision log), this handoff, and `docs/evidence/m2a-fix-*` transcripts/data.

**Blocking:** 400 kyr takes 39310.20 ms, over the 10000 ms budget. End RSS is
938.93 MiB. Dynamics/provenance/replay checks pass, but the performance fix is
incomplete. The observation-only survey has no extinction or TECH_LOSS; reach
fixtures still test both. Natural growth/war calibration remains authored and
war-heavy; it is not an empirical fit. M2b, cross-body execution, spaceflight,
additional anoxic/system fixtures, repeated-recolonisation stress, and C/H/N
refinement remain deferred. No M2b event implementation was started.
