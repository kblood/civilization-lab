# M3 implementation — M3a runner handoff

2026-10-04. M3a is implemented for Opus review. No git writes, network,
dependency installation, preview, deployment, or files outside this repository
were used. M3b was not implemented. These are authored scenarios, not calibrated
historical predictions.

The complete added/modified file inventory is
[m3a-files.txt](evidence/m3a-files.txt).

## APIs and ownership

- `createPlanet(fixture, seed, {years, forced, untilYear})` and
  `createDomain(input, seed, {years, forced, untilYear})`: `untilYear` is an
  absolute execution endpoint. Only complete decades are compiled. Existing
  `years` semantics and the legacy CLI remain available. Inspection now exposes
  the actual boundary state separately from the phase-0 pre-state.
- `refineCell(def, parentContract, {regionId, tick})`, `aggregateCells(child)`:
  pure region-only allocation, with `civ-cell-binary-1`, 16 sorted cells,
  recursive integer floor splits, zero-weight fallback, resolved phase deltas,
  canonical end-epoch redistribution, P-event anchors and stock-neutral local
  annotations. Placement uses separately registered purposes. Lookup-only,
  bounded caches do not contain RNG cursors or modify a parent.
- `regionContract(def, boundary, pre, end, updates, events, regionId,
  boundaryHistory)` and `cellDefinition(def, localId)` construct explicit data
  contracts. `inspectionTicks` supplies each region's own boundary ancestry.
  Refiners do not import the inspection adapter or any solver. Boundary history
  recovers persistent `(siteId, foundingTick)` town identities, including
  abandonment and re-founding. Omitting earlier ancestry explicitly starts the
  settlement view at the supplied left boundary.
- `refineYear(def, contract, {tick})`, `aggregateYears(child)` accept an arc,
  region or cell contract `{tick,start,end,naturalDelta}`. There are 11 samples:
  ten floor-rounded natural-path samples and the exact ledger end boundary.
  Categorical fields remain at the starting state until that end boundary.
  Phase-0 delivery is represented separately from the preceding boundary.
- `centurySummaries`, `chapterSummaries`, `eras` consume tick observations.
  Population extrema include all tick endpoints. Energy is summed first.
  `displayEnergyIndices` returns per-person kcal/day and a Kardashev display
  value from aggregate watts; these floats never enter a digest.
- `narrative(def, sortedOrUnsortedEvents, identities?, grammar?)` produces seeded
  names, the 30 highest-salience chronicle rows, and `narrativeDigest`. The small
  JSON grammar covers arc, polity, culture and settlement identities. N never
  adds causal edges. Its transitive import graph cannot reach a solver, and
  solvers cannot reach N.
- `loadScenario` and `createScenario` validate a closed scenario envelope.
  Five scenario JSON files reference planet/domain descriptions and bounded
  regime fixtures. All default to year 1000. Crowded-domain has four origins,
  each initialized in its declared industrial regime. `--scenario` also accepts
  a repository-relative planet, system or domain description JSON path.

`node src/cli.mjs --scenario <name|path> --seed <seed> [--until-year Y]` prints
the outcome, maximum era, first attainment of each observed era, up to 30
salient events with causes labelled **model attribution**, sampled C/annual
projection status, and manifest/recipe/result/narrative digests.

## Horizon correction and binding table revision

The automatically generated standalone post-sapience fixture now declares a
fixed 40,000-tick model bound. Requested `years` selects execution ticks without
changing that fixture. Both P and D recipes omit the execution endpoint.
Explicit forced fixture bounds remain declared input data; varying `untilYear`
does not alter them.

Two additional endpoint leaks were corrected: structural P hashes now appear
only at canonical chapter boundaries or terminal states, and D does not declare
an all-extinct prefix terminal merely because another pending origin falls
beyond the requested slice. This preserves complete-tick witnesses and complete
chapter roots, including a final tick not aligned to a chapter boundary.

The dated **M3a, 2026-10-04** revision in `transition-table-v1.md` updates both
prose and machine JSON. The delta witness is now **m3a-delta-witness-1**, with
the new P fields included in the exhaustive field vector. Catalogue size is 39:
the original 31, kinds 32–34, and five C-only annotations.

- STELLAR_DOOM uses the existing lifecycle field, now optional with null
  semantics. It executes in phase 0. Energy >= 5 opens evacuation launch
  pressure; otherwise it removes the arc's people and yields EXTINCT_STELLAR.
- SIGNAL_ARRIVAL delivers the first radio emission on each outgoing route.
  Optional integer `lightYears` defaults to ceil(distanceMicroLy / 1,000,000).
  It uses the **binding transition table's ceiling delivery rule**, rather than
  the older floor expression in spec §8.4. Same-lineage signals are ignored.
- FIRST_CONTACT is a receiver hazard on Information × signal strength, also
  reachable by an occupied-body physical encounter. It records contact and an
  immutable received-knowledge edge. Only DIFFUSION transfers technology.
- `origins.startingRegime` is a bounded fixture override. The separate
  `oracle.launchPeriodYears` fixture override schedules one affordable launch
  per arc at its declared age; ordinary runs keep their existing launch hazard.

Final self-generated stability goldens (not independent correctness oracles):

| Case | Before M3a | After M3a |
|---|---|---|
| P, temperate / civ-m2a-golden / 100 years | `d1a2ba85d1f62958a62d4b911d9f55da51d7be480f7e42f438e81b0b47b38d42` | `71ec3bb7c8f3b406a8f8b2f5c10891cc6126b9dfb8a85bacd145785986803521` |
| D, toy-12 / toy-1 / 100 years after sapience | `4f1fcd8754c19ee4560cb5cef2d32ac6747c05e320c973226fe6333d7534c477` | `9357a58823cecb9e5e4431f5388e973edb5c5fcf2f53fe9585528fedd330a117` |
| Observed 20 kyr perf result, civ-m2a-2 | `40b360ab5be669b76efc8fb1bffb7c30af20dbdfba0c5c83290e50a7ca58e48d` | `599d35eefe5371b360c369d174edc28f939accea3c129761e7d94c6eb9bf629e` |

M1 is unchanged:
`c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc`.
The performance test retains seed civ-m2a-2, the >=100-event guard, the
population/advanced-state guard and the 2000 ms ceiling. Final suite output:

```text
Observed short toy-12: 224.32 ms; 19245 ticks; 1 populated arcs
Observed 20 kyr civ-m2a-2: 321.15 ms; 403 events; 2 populated regions
```

## Acceptance evidence

`node tools/verify-m3a.mjs` exited 0. It launches commands sequentially in fresh
processes and saves stdout, stderr, exit status and process wall time to
`docs/evidence/m3a-*.txt`. It measures outside `src/` and fails if a new test
file takes >=2000 ms or a scenario takes >=15000 ms.

`npm test` exited 0. Exact final summary:

```text
ℹ tests 101
ℹ suites 0
ℹ pass 101
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 10229.443
```

Process wall time: **10480.38 ms**. Raw transcript:
[m3a-tests.txt](evidence/m3a-tests.txt). This includes the determinism lint and
both directions of the transitive narrative isolation check.

`npm run digest` exited 0 and printed the unchanged M1 digest above; process
wall time **333.54 ms**. Raw transcript: [m3a-digest.txt](evidence/m3a-digest.txt).
The documented wrapper command
`npm run scenario -- --scenario lonely-earthlike --seed s1` also exited 0;
its full output is [m3a-npm-scenario.txt](evidence/m3a-npm-scenario.txt).
After restoring the original, unfiltered shared-message assertion,
`node --test tests/outcomes.test.mjs` exited 0 (7 tests, 7 pass, 0 fail);
see [m3a-outcomes.txt](evidence/m3a-outcomes.txt). No outcome assertion was weakened.

| Exact standalone command (all exit 0) | Wall ms | Evidence / property |
|---|---:|---|
| `node --test tests/horizon-prefix.test.mjs` | 442.73 | Busy standalone chapter and unaligned endpoint; active toy-12 P/D prefix; horizon-in-manifest negative control |
| `node --test tests/projection-cell.test.mjs` | 1845.64 | Every tick/region of four active scenarios through 1000 years; zero subtrees, canonical epoch boundary, event anchors, categorical fields, stock-neutral annotations, persistent towns; independent cell-growth negative control |
| `node --test tests/projection-year.test.mjs` | 1169.75 | Arc, region and every cell over a 200-year active history; exact endpoints, staircase fields, nonnegativity, rational error <1; negative deltas and tampered interior samples |
| `node --test tests/level-independence.test.mjs` | 352.84 | P/D roots unchanged after none/some/all cells, shuffled evaluation, N/views, cleared caches and cold construction |
| `node --test tests/views.test.mjs` | 196.18 | Independent century fold; synthetic and actual forced collapse/recovery within one century |
| `node --test tests/narrative-isolation.test.mjs` | 123.69 | Transitive graph, injected forbidden-edge control, grammar-only digest change |
| `node --test tests/front-speed.test.mjs` | 147.18 | Actual launches/deliveries on a uniform graph, 3 hops; distance 200000 micro-ly, speed 10000 micro-ly/year, period 20 years; arrival years 40,80,120 |
| `node --test tests/scenario.test.mjs` | 432.92 | Five scenarios, execution-prefix invariance, direct description, CLI fields |

Additional extended tests: `fixtures-reach` exercises all 39 kinds through
actual guards or C allocation; `catalogue` checks declared reads/writes against
the independently parsed table; `contact-horizon` includes radio delivery;
`domain-order` includes signals/contact. Existing conservation and witness
decoder tests remain in the suite. The import lint permits N only in the new
CLI composition module; the new transitive lint preserves solver isolation.

| Exact CLI command (all exit 0) | Wall ms |
|---|---:|
| `node src/cli.mjs --scenario lonely-earthlike --seed m3-1` | 139.04 |
| `node src/cli.mjs --scenario crowded-domain --seed m3-1` | 297.58 |
| `node src/cli.mjs --scenario harsh-anoxic --seed m3-1` | 136.19 |
| `node src/cli.mjs --scenario doomed-star --seed m3-1` | 114.89 |
| `node src/cli.mjs --scenario high-perils --seed m3-1` | 156.71 |

All five are below 15 seconds. These observations cover seed m3-1, not an
unmeasured seed ensemble. Complete per-scenario output is preserved under
`docs/evidence/m3a-scenario-*.txt`.

## Limits and open items

- C remains an allocation view. It does not simulate independent local stocks.
  Town chronology needs the explicit region-only boundary ancestry; an isolated
  contract with no ancestry declares a new settlement-view genesis.
- Annual paths obey the prescribed independent floor bridge. Exact child sums
  are guaranteed at tick boundaries. **NOT MET if §9.5 is interpreted to require
  exact sums at interior annual samples:** separately rounded cell/region/arc
  paths can disagree in their interior sums. For example, 16 cells each with
  natural delta 1 have total annual delta 0 at j=1, while the region bridge has
  floor(16/10)=1. Making both independent floor equations and that stronger
  interior sum equality hold requires a contract change. The tests do not
  claim that stronger property.
- Signals are one first-emission snapshot per outgoing route, at authored
  strength 1000. Repeated broadcasts, attenuation and rich diplomacy are not
  modelled. Contact itself never grants a tier.
- The 400 kyr / 10 s seed-panel performance target from M2 remains **NOT MET**
  by the previously recorded evidence; it was not remeasured here. Historical
  400 kyr roots were not regenerated or asserted as current goldens.
- M3b ensemble statistics, report.md, timeline SVG, plausibility shards,
  signatures and report tests remain unimplemented, as requested. No visual
  asset was produced and no visual check was attempted.
- Opus still owns diff review and commit. `git diff --check` was observed to
  exit 0 with no output.

## One complete observed CLI output

```text
$ node src/cli.mjs --scenario doomed-star --seed m3-1
Scenario doomed-star; seed m3-1; through year 510; 10 events.
Outcome: EXTINCT_STELLAR; maximum era E1.
E1 first reached: 0
Most salient events (model attribution):
EXTINCTION@500 (arc:stub:s00:b0:lin:stub:s00:b0:0); causes none
STELLAR_DOOM@500 (arc:stub:s00:b0:lin:stub:s00:b0:0); causes none
LINEAGE_EXTINCTION@509 (lin:stub:s00:b0); causes TRIGGERED: STELLAR_DOOM@500 (arc:stub:s00:b0:lin:stub:s00:b0:0)
HEGEMONY@0 (arc:stub:s00:b0:lin:stub:s00:b0:0#pol:fixture:a); causes none
PLAGUE@160 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes none
PLAGUE@170 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes CHAIN: PLAGUE@160 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00)
PLAGUE@180 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes CHAIN: PLAGUE@160 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00)
PLAGUE@344 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes none
PLAGUE@350 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes CHAIN: PLAGUE@344 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00)
PLAGUE@360 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00); causes CHAIN: PLAGUE@344 (arc:stub:s00:b0:lin:stub:s00:b0:0#r00)
Level consistency: PASS (36 sampled region-ticks, C and annual).
Manifest digest: 08c7738c1969000440267dbdff877a6c76846d31d52e3fb2bf80156f7ae55a14
Recipe digest: b12489807e6be62ad7648b382e5cd043f78686936ea29b47956ce79a69a5615d
Result digest: 7806caa195cbf5270036157cbcb50d948b00e159aee64e85ff12f11780730f07
Narrative digest: 492b2244fe4900ab1ba995d8d9149d9d915778ffb698716f6e2623a1c6fed97b

Exit: 0
Wall ms: 114.89
```
