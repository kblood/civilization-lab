# M2a fix-round handoff

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
