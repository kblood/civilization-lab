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

## M3b — implementation and runner handoff (2026-10-04)

Implemented for Opus review. No git writes, network, dependencies, browser,
preview, deployment, or external-repository changes. The M3a limitations above
are historical: the annual interior mismatch and missing ensemble/report work
are superseded below. **Seeded scenarios, model attribution, not predictions.**

### APIs and deterministic statistics

- `refineYearTree(contract)` and `aggregateYearTree(tree)` enforce hierarchical
  annual population budgets. The root uses the original floor bridge; each
  parent apportions floors/ceilings among its sorted children with positive
  largest remainders and ID tie-breaking. `apportionYears(parent, contracts)`
  is the pure allocation primitive. Start is after phase 0; j=10 is the actual
  ledger end including all resolved events. The `<1` natural-path error bound
  applies to j=0..9, not across end-boundary event jumps. Standalone
  `refineYear` still treats its supplied unit as a root; callers needing a
  multi-level view must use the tree API. No sibling queries, RNG or writeback.
- `annualHierarchy(tickObservation)` adapts the region/cell contracts to that
  API. The CLI checks every annual sample in its sampled active arc-ticks.
  `projection-year` retains the existing 200-year bridge tests, adds every
  annual sample of all arcs/regions/cells in a 20-year active four-origin
  domain, and the sixteen delta-one cells negative control. The hierarchy's
  initially attempted 100-year fixture exceeded two seconds, so only the new
  fixture horizon was shortened; no previous assertion was removed.
- `createDomain(...).compileSummary({observe:true, inspectSampleTicks})`
  collects first attainment at every tick and compact century observations,
  plus requested full tick snapshots, without retaining all inspection states.
  It records all past arc identities before archival. Observation-only options
  do not enter any recipe or result; the report test verifies this explicitly.
  Sparse inspection starts a fresh settlement-view ancestry at each gap.
- `ensemblePlan`, `runSeed`, `runEnsemble`, `summarizeRun`, `aggregate`,
  `fraction`, `lowerMedian` and `causalExplanation` live in `ensemble.mjs`.
  Global i=0..N-1 selects `SCENARIOS[i % 5]` without `--scenario`, in the
  published order lonely-earthlike, crowded-domain, harsh-anoxic, doomed-star,
  high-perils. With `--scenario`, every index uses that scenario. In both
  cases seed is `<scenario>-<i>` (i is NOT restarted per scenario).
- Default parallelism is min(4, CPU count), with at most that many independent
  child processes. Results are sorted by (scenario, seed), using code-unit
  comparison. Failed seeds remain in N as ERROR, have explanations, and make
  the CLI exit nonzero. Tests exercise errors and jobs=1 versus jobs=2.
- Report measures count runs with any qualifying lineage. Thus lineage
  outcome rows overlap in the crowded domain; they are not a partition of N.
  Multi-body/system reach uses past or living arcs **within the same lineage**,
  independently of E5/E6. Era dates mean first attainment of at least that era
  at a stock boundary. E2/E3 durations are from the earliest origin (zero for
  already advanced starting fixtures); undefined durations are excluded from
  the lower median and explicitly labelled if none exist. Percentages truncate
  to one decimal using BigInt. They are not fitted empirical probabilities.
- Causes are counted per lineage within each outcome class. NATURAL_UPDATE
  and INITIAL_STATE explicitly mean no corresponding proximate event.
  Explanation arrows follow real DAG edges, selecting the longest ancestry
  with deterministic ties and retaining its last eight events. First expansion
  milestones are separately labelled chronology, not invented causal edges.
  The DAG pass is iterative and bounded; an intermediate recursive prototype
  stalled on busy branching histories and was interrupted and replaced.
- `reportMarkdown`, `timelineSVG`, `timeAxis`, `writeReport` and
  `timelineFilename` live in `report.mjs`. SVGs use a 1600x1000 light canvas,
  minimum 12 px text, integer Q16 logarithms and two-decimal coordinates.
  Before E2 the axis is log(year+1); after E2 it is linear. E2 at genesis uses
  a wholly linear axis; no E2 uses wholly logarithmic time. The break is marked.
  There are era/colour legends, per-arc log population, live polity steps,
  eight body lanes at most, twelve selected event labels in separate grid
  slots, and twelve voyage curves at most. Every event mark has its real ID.
  Centuries are sampled deterministically, capped to about 700 observations;
  at most eight arcs (peak population, ID ties) are plotted, with omitted counts.
  Report bytes exclude jobs, timing and absolute output paths.

### Carry-over decisions and scenario changes

Spec 9.4 now retains the old text but explicitly supersedes independent child
floor bridges with the dated runner decision. The transition table has an
append-only M3b policy block and the field `parameters.stellarGraceYears`,
default 500, range 0..2000000, multiples of ten, labelled [scenario]. A nullable
stellar-doom world commits `m3b-stellar-1` and its grace to its manifest. Worlds
without stellar doom preserve their old RNG manifests; no M1/M3a short P/D
golden was changed. The original M3a machine block is historical for the two
superseded rules, as explicitly noted in the appendix.

At doom, Energy >=5 enables evacuation. At doom+grace, STELLAR_DOOM kills all
remaining residents regardless of tiers. The domain refuses later landings
and hard-step origins. Death of the last arc does not extinguish a lineage
while another arc or voyage survives. Forced tests cover surviving evacuees,
everyone left behind, late origins and validation of the grace override.

| Scenario | Before M3b | Final M3b prior |
|---|---|---|
| lonely-earthlike | Standalone temperate P; agrarian at year 0; horizon 1000 | Single-origin domain; hard steps, no fixed regime; home-body habitability ends 100000; horizon 120000 |
| harsh-anoxic | Standalone anoxic P; post-sapience at 0; horizon 1000 | Single-origin domain with anoxic home; same post-sapience regime; horizon 30000 |
| high-perils | Standalone temperate P; industrial at 0; horizon 1000 | Single-origin domain; same industrial regime and all three existing elevated hazard overrides; horizon 30000 |
| doomed-star | One body, no routes; agrarian at 0; doom 500; horizon 1000 | Single-origin domain; industrial at 0; doom 3000, grace 500; horizon 30000 |
| crowded-domain | Four industrial origins; horizon 1000 | Same domain, regime and startingRegime override; horizon 30000 |

Each new single-origin domain has the existing four-body home system (one
habitable, two habitat-buildable, one barren) plus two temperate star nodes and
the corresponding toy-graph routes. `tools/build-m3b-fixtures.mjs` regenerates
these explicit, hashed fixtures from the existing descriptions. No Atlas import.

The first measured prior used doom=20000. Its 64-run ensemble had 12/13
doomed-star seeds reaching other bodies and one self-extinction, with zero
stellar extinctions. That gave inadequate exposure to the desired stellar
branch. Doom was changed **only in the authored scenario lifecycle** to 3000,
with the same industrial regime and grace. The final ensemble below exhibits
both evacuation and stellar extinction. No hazard coefficient was tuned to
force a band; all changes to horizons, origins and geometry are listed above.

The bounded `lonely-bounded.json` retains M3a's original active agrarian P
fixture for its short refinement tests. The shared M3 helper maps its existing
lonely test cases to that explicit fixture; no test now passes by inspecting
an empty hard-step history. All other M3a test horizons remain short.

The longer crowded pilot uncovered duplicate physical-contact signal IDs when
two voyages from one source reached an occupied body simultaneously. D now
assigns deterministic per-source/target/tick ordinals, and identifies the
signal's actual source body. A forced two-arrival regression test verifies both
IDs survive. This is a bug fix, not a new random draw or parameter adjustment.

### Exact CLI usage

```powershell
npm run scenario -- --ensemble 64
node src/cli.mjs --ensemble 64 --scenario doomed-star --jobs 2
node src/cli.mjs --ensemble 8 --until-year 1000 --out out/short
node src/cli.mjs --ensemble 8 --timeline crowded-domain-1
node src/cli.mjs --ensemble 2 --scenario high-perils --timeline custom-seed
node src/cli.mjs --scenario doomed-star --seed m3b-1
node tools/verify-m3b.mjs tests
node tools/verify-m3b.mjs ensemble
node tools/verify-m3b.mjs scenarios
```

`--timeline` may be repeated. The first seed in code-unit order per represented
scenario is always plotted. Extra requested seeds outside the ensemble are
run separately, linked and labelled as excluded from N. Such a seed needs a
scenario prefix or `--scenario`. `--out` defaults to git-ignored `out/`.
The tools wrapper prints ensemble time to stderr; worker tools print per-seed
times to stderr. Neither is written into report.md or SVG.

### Test interpretation and known gaps

- Four plausibility shards each execute 16 distinct seeds across all five
  domain geometries using short, already inhabited mechanism fixtures. They
  assert nonzero hazard, transfer, polity, transit AND extinction exposure in
  each shard, plus every seed's stock, tier, energy, absorbing-extinction and
  exact transit-account invariants. These are deliberately bounded test priors,
  not the long-horizon production ensemble or evidence of calibration.
- **Kremer signature NOT MET.** Four fixed seeds, identical starting
  proto-agrarian population/tier fixtures, ordinary hazard priors, 10000-year
  horizon, fixed 40000-tick recipe bounds: temperate first E2 event dates
  `[4843, censored, 3751, 8314]`; cold `[3981, 5990, 1537, censored]`. Lower
  medians are **4843** and **3981**, both actually observed (the single censored
  value per group lies beyond the median). Cold is earlier, not later. The
  test computes this panel, reports it, then explicitly skips the contradicted
  signature assertion, as authorised in the prompt. No silent tuning. The
  Henrich cut/control test passes. The runner has been asked whether to retain
  the documented skip or commission a separate prior investigation.
- Therefore the strict **all tests pass, no skips** interpretation is
  **NOT MET** even though npm test exits zero and no test fails.
- **Visual check NOT done.** XML validity, deterministic bytes, event IDs,
  coordinate monotonicity and size are tested. These do not prove legibility.
  Rasterisation at 1600 px and Luna evaluation remain the runner's external
  repository step, outside this edit-only/no-network run. No visual verdict is
  invented.
- Timeline population and polity traces are sampled views, not all decade
  fluctuations. The populations are authoritative; cells remain allocations.
  No actual household dynamics or Atlas integration was added.
- The old M2 400 kyr seed-panel target remains outside this task and retains
  its historical NOT MET status; the separate M3b measurements are below.
- Opus still owns review, any approval of the statistical exception, and commit.

### Final observed evidence

<!-- M3B-OBSERVED-EVIDENCE -->
The full changed-file inventory is [m3b-files.txt](evidence/m3b-files.txt).
`node tools/verify-m3b.mjs tests`, `ensemble` and `scenarios` each exited 0.
The wrapper launches the exact npm commands below and the standalone node
commands in fresh sequential processes, preserving stdout, stderr and exit codes.

`npm test` exited 0; wall **14832.31 ms**. Verbatim summary:

```text
ℹ tests 117
ℹ suites 0
ℹ pass 116
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 14582.8134
```

Raw [test transcript](evidence/m3b-tests.txt). This is **116 pass, zero failures,
one explicitly skipped contradicted signature**, not a claim of 117 passes.

`npm run digest` exited 0; wall **329.22 ms**; printed:

```text
c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc
```

Each new test file, and both extended projection files, measured alone:

| Exact command | Process wall ms | Exit |
|---|---:|---:|
| `node --test tests/plausibility-01.test.mjs` | 531.61 | 0 |
| `node --test tests/plausibility-02.test.mjs` | 584.57 | 0 |
| `node --test tests/plausibility-03.test.mjs` | 549.80 | 0 |
| `node --test tests/plausibility-04.test.mjs` | 551.36 | 0 |
| `node --test tests/signatures.test.mjs` | 780.74 | 0 |
| `node --test tests/report.test.mjs` | 436.07 | 0 |
| `node --test tests/ensemble.test.mjs` | 194.22 | 0 |
| `node --test tests/stellar-grace.test.mjs` | 240.96 | 0 |
| `node --test tests/projection-year.test.mjs` | 1840.00 | 0 |
| `node --test tests/projection-cell.test.mjs` | 1861.84 | 0 |

Individual transcripts are in docs/evidence/m3b-<name>.txt; the pure ensemble
test uses m3b-ensemble-test.txt to keep the 64-seed console transcript separate.
All listed files are below 2000 ms. Single-run CLI measurements:

| Exact command | Process wall ms | Exit |
|---|---:|---:|
| `node src/cli.mjs --scenario lonely-earthlike --seed m3b-1` | 198.53 | 0 |
| `node src/cli.mjs --scenario crowded-domain --seed m3b-1` | 3579.27 | 0 |
| `node src/cli.mjs --scenario harsh-anoxic --seed m3b-1` | 1539.48 | 0 |
| `node src/cli.mjs --scenario doomed-star --seed m3b-1` | 229.81 | 0 |
| `node src/cli.mjs --scenario high-perils --seed m3b-1` | 1803.44 | 0 |

`npm run scenario -- --ensemble 64` exited 0. The tools wrapper measured
**29913.38 ms**; the full outer npm process measured
**30161.30 ms**. **MET: <=10 minutes.** All 64 seeds have worker timing
lines; slowest was **7050.27 ms** (crowded-domain/crowded-domain-1), **MET: <=30 s**.
No seed failed or was dropped. Raw console: [m3b-ensemble.txt](evidence/m3b-ensemble.txt).
The byte-for-byte report copy is [m3b-report.md](evidence/m3b-report.md).

Verbatim final aggregate and observed band verdicts:

```text
Aggregate (seeded scenarios, model attribution, not predictions)
industrialE3: 48/64 (75.0%)
atomicE4: 40/64 (62.5%)
interplanetary: 31/64 (48.4%)
eraE5: 33/64 (51.5%)
interstellar: 30/64 (46.8%)
eraE6: 30/64 (46.8%)
extinct: 10/64 (15.6%)
extinctSelf: 5/64 (7.8%)
extinctNatural: 1/64 (1.5%)
extinctStellar: 4/64 (6.2%)
extinctNaturalStellar: 5/64 (7.8%)
colonyOnlyLoss: 27/64 (42.1%)
noLineage: 10/64 (15.6%)
collapseRecovery: 43/64 (67.1%)
firstContact: 13/64 (20.3%)
existentialCap: 9/64 (14.0%)
error: 0/64 (0.0%)
COLLAPSED_RECOVERING: 16/64 (25.0%); proximate causes: 14 COLLAPSE, 2 RUNAWAY_TECH, 1 ENGINEERED_PANDEMIC
EXISTENTIAL_CAP: 8/64 (12.5%); proximate causes: 5 RUNAWAY_TECH, 3 ENGINEERED_PANDEMIC, 1 NUCLEAR_WAR
EXTANT_MULTI_BODY: 7/64 (10.9%); proximate causes: 4 COLONY_FOUNDED, 3 ENERGY_TRANSITION
EXTANT_MULTI_SYSTEM: 23/64 (35.9%); proximate causes: 13 COLONY_FOUNDED, 12 ENERGY_TRANSITION
EXTANT_PLANETARY: 17/64 (26.5%); proximate causes: 21 ENERGY_TRANSITION, 2 INITIAL_STATE
EXTINCT_NATURAL: 1/64 (1.5%); proximate causes: 1 NATURAL_UPDATE
EXTINCT_SELF: 5/64 (7.8%); proximate causes: 3 ENGINEERED_PANDEMIC, 2 RUNAWAY_TECH
EXTINCT_STELLAR: 4/64 (6.2%); proximate causes: 4 STELLAR_DOOM
NO_LINEAGE: 10/64 (15.6%); proximate causes: none / not extinct
REGRESSED_STABLE: 2/64 (3.1%); proximate causes: 2 ENERGY_TRANSITION
Lower median time to E2: 0
Lower median time to E3: 0
PASS: outcome classes >= 4; observed 10
PASS: collapse then recovery >= 1; observed 43
PASS: E3 >= 1; observed 48
PASS: self-extinction >= 1; observed 5
PASS: multi-body lineage >= 1; observed 31
PASS: NO_LINEAGE >= 1; observed 10
```

The final doomed-star subset has 8/13 reaching other bodies, 4/13 stellar
extinctions and 1/13 self-extinction. This is the observed mixed result of the
3000-year prior, not an asserted target.

SVGs written by that exact command (XML checked, all below 1 MB):

| File in out/ | Bytes |
|---|---:|
| timeline-crowded-domain-crowded-domain-1.svg | 78609 |
| timeline-doomed-star-doomed-star-13.svg | 68503 |
| timeline-harsh-anoxic-harsh-anoxic-12.svg | 43350 |
| timeline-high-perils-high-perils-14.svg | 42302 |
| timeline-lonely-earthlike-lonely-earthlike-0.svg | 60062 |

The explicit additional-timeline path was also observed to exit 0:
`node src/cli.mjs --ensemble 2 --scenario high-perils --until-year 100 --jobs 2 --timeline custom-seed --out out/requested-timeline`.
It retained N=2 and wrote timeline-high-perils-custom-seed.svg plus
timeline-high-perils-high-perils-0.svg in that directory. The short ensemble's
variety failures are expected observations, not overridden verdicts.

`git diff --check` exited 0 with no output. No commit was made.
