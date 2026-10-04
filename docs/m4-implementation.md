# M4a implementation — 2026-10-04

Items 1–5 are implemented for runner review. This round does not change
`inputBundleDigest`, `forced.ticks`, or the standalone P horizon policy.
No git-writing command, network request, dependency installation, browser or
preview was used. Universe Atlas and `.agent-scratch/before` were read only.
No commit was made.

## Model changes

1. Discovery now divides the population-driven rate by a per-domain, per-target
   cost. Maintenance population requirements also rise with tier. Every changed
   number is **[scenario]**; no historical calibration or new research support
   is claimed. Era definitions and Morris energy anchors are unchanged.
2. A colony carries an archive and automated instruction for its founding
   technology, usable for maintenance for **1,000 years [scenario]**. It does
   not invent, supply extra people, repair catastrophe losses, or depend on
   instantaneous knowledge of the parent. Ordinary maintenance resumes at the
   deadline. This lets a small population grow toward self-sufficiency, while
   still allowing an inadequate or damaged settlement to fail.
3. Launches consult delivered occupancy signals and failure notices. Successful
   settlements send observations to connected lineage members. Failed voyages,
   rejected arrivals, colony loss and colony extinction send delayed notices.
   A lost voyage's notice waits at least until its planned arrival, then light
   travel time. These are assumed automated beacons; no claim is made that a
   destroyed expedition can always communicate. Target memory is committed
   state, not a memoization cache. Unknown occupied bodies remain eligible.
4. Accepted recovery retains institutional learning. After **four completed
   recoveries per region/arc [scenario]**, generic complexity-collapse exposure
   stops. Perils and external catastrophes are separate mechanisms and remain
   possible. Exited-perils polities with Information >=4 get a constitutional
   renewal hazard, including at zero stress, using existing REVOLUTION events.
5. `forager-future` starts at E0 and observes 120 kyr. `lonely-earthlike` now
   conditions on a stable 2 Myr habitability window and observes 320 kyr. Its
   hard-step origin distribution is unchanged, and NO_LINEAGE is still possible.
   The old short cutoff had no supplied stellar/ecological cause. The longer
   observation window is an explicit scenario change, not a like-for-like
   causal estimate of the other model changes.

## Parameters and records

All entries here are authored **[scenario]**. Arrays include unused tier zero.
Domain order is Energy, Subsistence, Materials, Transport, Information, Medicine,
Organisation; Nstar is persons, costs are dimensionless.

| Domain | Nstar | Discovery cost |
|---|---|---|
| Energy | 0,100,500,2000,10000,40000,100000 | 0,2,5,10,20,100,3000 |
| Subsistence | 0,50,100,500,5000,30000 | 0,2,5,10,20,100 |
| Materials | 0,100,500,1000,10000,50000 | 0,2,5,10,20,100 |
| Transport | 0,100,300,1000,5000,15000,40000,80000 | 0,2,5,10,20,100,500,2000 |
| Information | 0,50,200,1000,10000,40000 | 0,2,5,10,20,100 |
| Medicine | 0,50,200,1000,10000 | 0,2,5,10,20 |
| Organisation | 0,100,300,1000,10000,40000 | 0,2,5,10,20,100 |

Discovery Q32 per decade is floor(400 × N_eff × innovationPpm /
(1,000,000 × cost)); the existing domesticable multiplier still applies to
AGRICULTURE. The base 400 and existing innovation prior are unchanged. Local
invention does not receive the colony maintenance reserve.

New `region.recoveries` starts at 0 and saturates at 4. New
`arc.targetFailures` starts empty and holds sorted `{body,count,eventId,untilYear}`
records. `count` saturates at 4; cooldowns are **1,000, 2,000, 4,000, 8,000 years
[scenario]** from receipt. Duplicate last event IDs do not increment it.
Separate loss/extinction reports are distinct notices. TARGET_FAILURE payload
adds `failure` (default null, otherwise `{body,eventId}`). Receipt removes that
body's stale occupancy signals. Signals from one's own lineage inform targeting
but cannot trigger FIRST_CONTACT.

Constitutional renewal adds **4,294,967 Q32/decade [scenario]**, about a 10 kyr
standalone mean, when perils is exited and polity Information >=4. It reuses
`haz.REVOLUTION` and `evt.revolution.regime`; there are **no new RNG purposes**.
The witness version is `m4a-delta-witness-1`; the structural region tuple and
sorted delta field registers include the new state. The prose and machine
table specify these changes.

Authored diagnostic spans are E0→E1 1–20 kyr, E1→E3 2–30 kyr, E3→E4 0.3–5 kyr,
E4→E5 1–15 kyr, E5→E6 2–30 kyr and E6→E7 2–50 kyr. See
[the plausibility report](m4-plausibility.md) for observations and censoring.

## Golden receipts

| Check | Old | New |
|---|---|---|
| M1 | `c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc` | unchanged, observed |
| P, temperate / civ-m2a-golden / 100 years | `71ec3bb7c8f3b406a8f8b2f5c10891cc6126b9dfb8a85bacd145785986803521` | `cfe5fb1723eb574aaf24af031359ffdfd837c9e8f21c2c0281d74df5987e2acd` |
| D, toy-12 / toy-1 / 100 years | `9357a58823cecb9e5e4431f5388e973edb5c5fcf2f53fe9585528fedd330a117` | `adbb432ab45d9fa9e4d0ae7e670066f0832df76574a87348bd714c76ed6f9b0d` |

The dynamics/table revision changes the manifest RNG namespace, and the new
state changes witnesses. Equal seed names across revisions therefore do not
hold every random variate fixed. These are stability goldens, not independent
correctness proofs. The receipt is outside the hashed contract to avoid a
self-referential golden.

## Existing assertions updated

- `civ-determinism.test.mjs`: the two P/D stability goldens above. Repeated,
  cold, reordered, child-process and different-seed assertions are retained.
- `scenario.test.mjs`: six registered scenarios instead of five.
- `ensemble.test.mjs`: the sixth round-robin task is now `forager-future-5`.
- `perf-budget.test.mjs` remains on its original `civ-m2a-2` workload in the
  final revision (131 events, a surviving advanced tier). A trial briefly used
  `civ-m2a-1`; that trial is not the final test. All workload/timing assertions
  remain unchanged.
- `refinement-order-child.mjs`: the bounded lonely refinement workload uses
  `m3-4` instead of `m3-2`, retaining mandatory and stochastic annotation
  exposure. The prior seed no longer produced local annotations in its two
  decades after the manifest revision. No assertion was removed or weakened.

## Validation receipts

The first focused run preceded the completed table update: the documentation
edit failed on Python's default Windows decoding. It reported 13 pass / 3 fail
(undeclared recovery field and old tuple). Explicit UTF-8 fixed the edit;
the same focused command then reported 16 pass / 0 fail. Later focused checks
found the two stale workload seeds described above; the refinement seed was replaced and the final cost revision restored the
original performance workload, retaining every original assertion.

Final validation, per-file timings, ensemble timing bounds and open limitations
are recorded below. `npm run perf:panel` is
reserved for the runner and was not run.


The diagnostic tool also uses the non-causal `onPerilsTick` projection, specified
in the transition table's observation annex outside the RNG contract. It exposes
only frozen tick strings and sorted exited-arc IDs, never mutable solver state.
The returned value is ignored. Older roots use the original inspection API for
the identical statistic. The callback-versus-full-inspection test checks flags
and result-digest equality. No dynamics/golden changed when it was introduced.

### Final golden revision receipt

The first cost trial's P/D roots were
`71cd40e483fd1795c1431200867599b94087bb90c88b9e7325f4be8f2144a4fd` /
`6f8383f3ec6108e9b8e47b669fa479aea401231b8116199b9a701a3cb4a551f0`.
The final cost schedule supersedes them with the roots in the Golden receipts
table above. They are not competing final goldens.


### Ensemble and performance receipts

All commands below were observed; the full-suite receipt is appended separately.

| Command | Exit | Observed result |
|---|---:|---|
| `node tools/m4-plausibility.mjs --root .agent-scratch/before --n 30 --jobs 2 --out docs/evidence/m4-plausibility-before.json` | 0 | 150 seeds, five scenarios, zero errors; slowest complete diagnostic 21,103.42 ms |
| `node tools/m4-plausibility.mjs --n 30 --jobs 2 --out docs/evidence/m4-plausibility-after.json` (initial cost trial) | 1 | 180 seeds, zero simulation errors; diagnostic exceeded 30 s, worst 47,745.66 ms; preserved as out/m4-first-trial.json |
| `node tools/m4-plausibility.mjs --n 30 --jobs 1 --out docs/evidence/m4-plausibility-after.json` (final costs) | 0 | 180 seeds, zero errors; slowest diagnostic 28,060.37 ms, forager-future-6 |
| `node tools/m4-plausibility.mjs --n 30 --jobs 2 --out out/m4-repeat.json` | 0 | Final code, 180 seeds, zero errors; slowest compile 21,914.29 ms and diagnostic 22,163.16 ms, lonely-earthlike-16 |
| `node tools/m4-plausibility.mjs --render docs/evidence/m4-plausibility-before.json` | 0 | Matching compact text produced |
| `node tools/m4-plausibility.mjs --render docs/evidence/m4-plausibility-after.json` | 0 | Trial text produced; final ensemble regenerated final text |
| `npm run digest` | 0 | Unchanged M1 c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc |
| `node src/cli.mjs --civ temperate --seed civ-m2a-golden --years 100 --digest` | 0 | Final P root cfe5fb1723eb574aaf24af031359ffdfd837c9e8f21c2c0281d74df5987e2acd |
| `node src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1 --years 100 --digest` | 0 | Final D root adbb432ab45d9fa9e4d0ae7e670066f0832df76574a87348bd714c76ed6f9b0d |
| `git --no-optional-locks diff --check` | 0 | No whitespace errors |

Timings were redirected to out/m4-before-timings.txt, out/m4-after-timings.txt
(trial), out/m4-final-timings.txt and out/m4-repeat-timings.txt respectively.
The final repeat uses the streaming observer throughout. Earlier final-cost
workers used the exact older inspection fallback before that non-causal
optimization landed; their identical statistics are verified by the full
180-seed byte comparison. All final-cost diagnostics, including those fallback
runs, were below 30 seconds. The failed trial is not silently reclassified as
passing. These are observed timings on this machine, not hardware guarantees.

Exact byte-repeat check (exit 0):

```powershell
node --input-type=module -e "import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';for(const ext of ['json','txt'])assert.deepEqual(readFileSync('docs/evidence/m4-plausibility-after.'+ext),readFileSync('out/m4-repeat.'+ext));console.log('PASS: final 180-seed JSON and text are byte-identical at jobs=1 and jobs=2');"
```

### Focused commands and failures retained

| Exact command | Exit / summary |
|---|---|
| `node --test tests/catalogue.test.mjs tests/expansion.test.mjs tests/scenario.test.mjs tests/m2a-fix.test.mjs` | First trial 1: 13 pass, 3 fail during incomplete table edit; repeat 0: 16 pass |
| `node --test tests/m4-tech-cost.test.mjs tests/m4-colony.test.mjs tests/m4-target-memory.test.mjs tests/m4-occupancy.test.mjs tests/m4-collapse.test.mjs tests/m4-scenarios.test.mjs` | 0: initial eight new tests passed |
| `node --test tests/m2a-perf.test.mjs tests/perf-budget.test.mjs tests/contact-horizon.test.mjs tests/domain-order.test.mjs tests/conservation.test.mjs tests/fixtures-reach.test.mjs tests/ensemble.test.mjs tests/determinism-lint.test.mjs` | 1: 26 pass, 1 fail; initial-trial busy-seed exposure failed |
| `node --test tests/perf-budget.test.mjs` | 0: 2 pass on the trial workload |
| `node --test tests/civ-determinism.test.mjs tests/stellar-grace.test.mjs tests/projection-year.test.mjs tests/projection-cell-domain.test.mjs tests/refinement-query-order.test.mjs tests/report.test.mjs tests/causal-dag.test.mjs tests/horizon-prefix.test.mjs` | 1: 20 pass, 1 fail; stale local-annotation exposure seed |
| `node --test tests/refinement-query-order.test.mjs` | 0: 1 pass after trial fixture adjustment |
| `node --test tests/m4-target-memory.test.mjs` | 0: 2 pass, including distinct receipt backoff and duplicate idempotence |
| `node --test tests/m4-tech-cost.test.mjs tests/m4-colony.test.mjs tests/m4-target-memory.test.mjs tests/m4-occupancy.test.mjs tests/m4-collapse.test.mjs tests/m4-scenarios.test.mjs tests/perf-budget.test.mjs tests/refinement-query-order.test.mjs tests/civ-determinism.test.mjs tests/expansion.test.mjs` | 1: 19 pass, 2 stale workload failures after final cost revision |
| `node --test tests/perf-budget.test.mjs tests/refinement-query-order.test.mjs` | 0: 3 pass after restoring original perf seed and final annotation seed; perf 131 events / 348.80 ms |
| `node --test tests/m4-plausibility.test.mjs` | 0: initially 2 pass; final observer parity extension 3 pass |
| `node --test tests/catalogue.test.mjs tests/m2a-fix.test.mjs tests/contact-horizon.test.mjs tests/domain-order.test.mjs tests/m2a-perf.test.mjs tests/scenario.test.mjs tests/ensemble.test.mjs tests/stellar-grace.test.mjs tests/front-speed.test.mjs` | 0: final 31 pass, 0 fail |

Small pilot `node --input-type=module` calls inspected scenario first-era years,
counted busy test seed workloads and annotation exposure, and compared the two
critic seeds. Those were investigations, not additional acceptance tests. No
plausibility assertion was rewritten to force the scenario distribution to pass.

### New test files, individually measured

Each exact command is `node --test <file>`; a PowerShell Stopwatch measured the
complete process, sequentially by file. All exit 0. The full log is
out/m4-tests-individual.txt. Final combined new coverage is 12 tests.

| File | Tests passed | Node duration ms | Process wall ms |
|---|---:|---:|---:|
| tests/m4-collapse.test.mjs | 2 | 116.9689 | 176.41 |
| tests/m4-colony.test.mjs | 2 | 147.2149 | 197.24 |
| tests/m4-occupancy.test.mjs | 1 | 122.3291 | 183.19 |
| tests/m4-plausibility.test.mjs | 3 | 108.2387 | 152.67 |
| tests/m4-scenarios.test.mjs | 1 | 143.6366 | 197.65 |
| tests/m4-target-memory.test.mjs | 2 | 162.0647 | 206.73 |
| tests/m4-tech-cost.test.mjs | 1 | 97.3440 | 139.80 |

### Open items / NOT MET

- All authored calibration bands are **not** met: forager E3→E4 median 5,530
  years and E4→E5 21,260 years exceed 5,000 and 15,000; other cohort/tail misses
  and all censor counts are explicit in the plausibility report. Late-era
  samples are too small to call this calibrated.
- Colony archives, guaranteed failure beacons, stale occupancy and the hard
  four-recovery institutional bound remain coarse abstractions. Cooldowns do
  not prohibit all repeat attempts; colony deaths and long recovery states
  remain. The regional bound is not a global per-seed collapse cap.
- Energy capture remains constant within an era; the far-future driver here is
  political renewal, not a megaproject or E7 energy-growth model.
- P-path horizon dependence is intentionally deferred, as requested. The
  original 10 kyr signature panel does not have an observed cold median; the
  extended 90 kyr panel below is a different, explicitly longer observation.
- No perf:panel run or visual review was performed; neither was requested for
  this implementation handoff.


### Sole full-suite execution and follow-up

`npm test` was run **exactly once**, redirected to out/m4-full-tests.txt.
Observed exit **1**, exact summary:

```text
ℹ tests 137
ℹ suites 0
ℹ pass 134
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 16972.4265
```

The three failures were legacy test assumptions about behaviours intentionally
changed in M4. Production code and all ensemble bytes were frozen; only the
following test expectations/workloads were corrected afterward:

- `outcomes.test.mjs`, shared catastrophe: select inbox records whose closed
  message identity has type SHARED before asserting that every cause is
  RUNAWAY_TECH. Successful colonies now also receive SIGNAL observations; those
  are not shared catastrophe payloads. The nonempty shared-message assertion,
  every-cause assertion and every-region cap assertion are all retained.
- `outcomes.test.mjs`, perils reentry: extend the no-births colony fixture from
  6 to 106 ticks, covering the new 1,000-year archive deadline. Assert that the
  loss occurs no earlier than tick 101, and retain next-tick REENTER delivery,
  final one surviving arc and three founded arcs. Expecting habitat maintenance
  failure in six ticks would explicitly demand the bug this round fixes.
- `signatures.test.mjs`: preserve the same four seeds, both environments,
  initial state, latent prior families, minimum two observed attainments for
  each median, and cold-median > temperate-median assertion. Extend observation
  from 10 kyr to 90 kyr because discovery intentionally became slower. Observe
  chapters only until first E2 attainment, avoiding unrelated later futures.
  Forced fixture ticks remain 40,000; no P horizon hashing policy changed.
  A 100 kyr pilot passed but took 2,147.23 ms as a complete process. The final
  90 kyr file took **1,862.52 ms** (Node duration 1,821.4949 ms), below two seconds.
  This is a changed test observation window, not a changed production parameter.

Post-correction commands, run individually:

| Command | Exit | Observed summary |
|---|---:|---|
| `node --test tests/outcomes.test.mjs` | 0 | 7 tests, 7 pass, 0 fail; Node duration 333.9182 ms |
| `node --test tests/signatures.test.mjs` (100 kyr trial) | 0 | 2 tests, 2 pass; process 2,147.23 ms, lean time NOT MET for this superseded trial |
| `node --test tests/signatures.test.mjs` (final 90 kyr) | 0 | 2 tests, 2 pass, 0 fail; Node duration 1,821.4949 ms; process 1,862.52 ms |

The final fixed-panel E2 times are temperate [1004,11724,55144,8599], lower
median 8599, and cold [84516,11422,90001,90001], lower median 84516.
90001 marks right-censoring at 90 kyr, not an attainment. Exactly two cold
attainments are observed, satisfying the original median-exposure assertion.
This does not retrospectively pass the old 10 kyr experiment.

**NOT MET: a clean full-suite receipt on the final test tree.** The requested
single full invocation failed as recorded; after the focused corrections no
second full invocation was made. The focused checks passed, but they are not
represented as a newly observed full-suite pass. The runner should run its
normal final checks before committing. No assertion was removed or weakened.

The complete changed/new file inventory is [m4-files.txt](evidence/m4-files.txt).


## M4b — horizon independence

Item 6 only, 2026-10-04. No git writes, commits, network, dependencies,
preview, or edits to Universe Atlas / .agent-scratch/before. Earlier M4a
receipts above remain historical; this section supersedes the deferred
horizon issue and records the M4b tree.

### Before/after experiment

Run before any production edits:
`node tools/m4b-horizon-probe.mjs docs/evidence/m4b-horizon-before.json`
(exit 0). Repeat after the fix:
`node tools/m4b-horizon-probe.mjs docs/evidence/m4b-horizon-after.json`
(exit 0). Full hashes and equality observations are in those two JSON files.
These are local experimental observations, not external research claims.

| Public path / selector | Before | After |
|---|---|---|
| createPlanet, forced.ticks 11 vs 23, from tick 0 | Dependent manifest, recipe and ledger/witness prefix; event IDs and full events happened to agree | All equal |
| createDomain, forced.ticks 11 vs 23, from tick 0 | Dependent manifest, recipe, full events and ledger/witness prefix; event IDs happened to agree | All equal |
| P and D, forced.ticks 3 vs 7, initial.atTick=638 | Dependent manifest, recipe, event IDs, full events and ledgers/witnesses | All equal |
| P and D, untilYear 110 vs 230 with unchanged fixture | Already independent | All equal |
| P and D, untilYear 6410 vs 6450, initial.atTick=638 | Already independent | All equal |
| P and D, years 110 vs 230, no forced fixture | Already independent | All equal |
| P scenario lonely-bounded and D scenario crowded-domain, untilYear 110 vs 230 | Already independent | All equal |
| Actual --civ --years, --domain --years, --scenario --until-year (P and D) processes | Already equal manifest/recipe digests; corresponding API runs above verify full prefixes | Still equal |

All 16 probe rows pass after the change. The seed is m4b-probe except for
the explicit PLAGUE start (m2-reach:PLAGUE). Domain years measures duration
after first sapience, so its absolute endpoints differ from standalone P.
No claim is made that the CLI prints complete ledgers: the experiment checks
those through the same public APIs the CLI calls.

### Root fix and validation

Both constructors use forcedModelInput: null stays null; otherwise remove
only ticks and add the fixed JSON integer modelTickMaximum=40000. Preserve
schemaVersion, id, base, seed, initial (including atTick), overrides and expect.
The input fixture remains immutable and retains its requested ticks for
execution. The recipe remains digest({seed,manifest,fromTick}); neither endpoint
nor requested duration reaches a manifest or RNG address.

Validate supplied ticks even when untilYear overrides it, and independently
validate the effective duration (1..40000), the two-million-year fixture
endpoint, and D's declared domain upper bound. P resolves the supported
initial override alias before endpoint arithmetic. Domain bounds, lifecycle
bounds and initial state remain genuine declared data, not normalized away.
No dynamics, prior, hazard, witness encoding, or timeout was changed.

The binding contract's exact manifest construction, fixture schema prose,
M3a exception and machine-readable forcedManifestProjection /
forcedExecutionBounds / horizon rules are updated. The dated M4b rule revision
is hashed; golden receipts are in an annex outside the hashed contract.

### Golden receipts

| Check | M4a old | M4b new | Reason |
|---|---|---|---|
| P: temperate / civ-m2a-golden / 100 years | `cfe5fb1723eb574aaf24af031359ffdfd837c9e8f21c2c0281d74df5987e2acd` | `1567cb59f6fcb4243e8b492ef3243ea6631711335ea0ba048027e2db795213f8` | Forced model projection replaces ticks with fixed modelTickMaximum; revised contract/table also changes RNG namespace. |
| D: toy-12 / toy-1 / 100 years | `adbb432ab45d9fa9e4d0ae7e670066f0832df76574a87348bd714c76ed6f9b0d` | `c998e6fff27bc9394f24e9882959f8ef08409c9871eb28a334c796ade079dbed` | This non-forced bundle is unchanged, but the revised shared contract/table changes RNG namespace. |
| M1 | `c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc` | unchanged, observed | M1 does not use this contract or projection. |

Observed commands (each exit 0):
`npm run digest`;
`node src/cli.mjs --civ temperate --seed civ-m2a-golden --years 100 --digest`;
`node src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1 --years 100 --digest`.

### Regression coverage and retained failures

The existing horizon-prefix file is unchanged. The new m4b-horizon-prefix
file checks P and D forced durations across tick 640 (638..641 vs 638..645),
absolute endpoint precedence and rounding, P via scenario, full events and
event IDs, complete inspection ledgers, P chapter prefixes and D per-arc
prefix roots. The negative control reconstructs the old actual
digest({domain,systems,forced}) rule and independently detects unequal
manifest, recipe and ledger witnesses. Boundary checks retain non-horizon
data, reject invalid input/effective bounds, and cover nonzero initial alias
arithmetic and input immutability.

Initial focused command:
`node --test tests/horizon-prefix.test.mjs tests/fixtures-reach.test.mjs tests/catalogue.test.mjs tests/refinement-query-order.test.mjs tests/perf-budget.test.mjs tests/signatures.test.mjs`
returned **11 pass / 2 fail, exit 1**. Both failures were seed exposure checks
after the RNG namespace revision, not prefix or timeout failures:

- perf-budget's civ-m2a-2 no longer emitted >=100 events. Change only the
  workload seed to civ-m2a-9, observed 122 events and three populated regions.
  Keep the 20 kyr horizon, >=100 events, advanced/populated-state checks,
  result digest validation and <2000 ms timing assertion.
- crowded-domain refinement m3-1 had no local annotation in two ticks.
  Change only that workload to m3-2 (three local annotations observed).
  Keep mandatory/local exposure, every warm/cold/reordered byte comparison
  and the 1500 ms child timeout. Lonely m3-4 is unchanged.

Repeat:
`node --test tests/civ-determinism.test.mjs tests/refinement-query-order.test.mjs tests/perf-budget.test.mjs`
returned **7 pass / 0 fail, exit 0**.

Additional affected checks:
`node --test tests/outcomes.test.mjs tests/expansion.test.mjs tests/m2a-fix.test.mjs tests/contact-horizon.test.mjs tests/domain-order.test.mjs tests/conservation.test.mjs tests/scenario.test.mjs tests/stellar-grace.test.mjs tests/projection-year.test.mjs tests/projection-cell-domain.test.mjs tests/report.test.mjs`
returned **39 pass / 0 fail, exit 0**. Parallel focused durations are not
presented as individual-file timing evidence.

### Supplemental ensemble-wrapper experiment

The initial before probe exercised all requested P/D/scenario paths before
editing production. A supplemental wrapper probe also exercises ensemblePlan,
runSeed, runEnsemble with jobs=2, and actual --ensemble --until-year CLI
processes at 110/230 years. For the before observation only, source, fixtures,
the contract and the ensemble worker were exported from commit 2efec1e with
read-only git ls-tree / git show into out/m4b-baseline. No git index/worktree
operation or edit to .agent-scratch/before was used.

Commands:
`node tools/m4b-ensemble-probe.mjs out/m4b-baseline docs/evidence/m4b-ensemble-before.json`;
`node tools/m4b-ensemble-probe.mjs . docs/evidence/m4b-ensemble-after.json`.
Both completed with exit 0. All three wrapper rows were already independent
and remain independent: manifest/recipe agree; runSeed and worker outputs
also have identical accepted event prefixes. CLI reports expose digests,
not full ledgers. The earlier D/scenario probe supplies ledger evidence.
The first supplemental before attempt failed because the exported tree omitted
tools/ensemble-worker.mjs; after exporting that file it passed. That failed
probe is an export setup error, not evidence of horizon dependence.

### Refreshed ensemble

`node tools/m4-plausibility.mjs --n 30 --jobs 1 --out docs/evidence/m4-plausibility-after.json`
uses the same final-M4a arguments and all 180 seeds. Observed exit **1**:
zero simulation errors, but lonely-earthlike-6 compiled in **35,868.78 ms**
and completed diagnostics in **36,179.71 ms**, exceeding the tool's 30-second
compile budget. Timings are in out/m4b-after-timings.txt. No performance
parameter was changed to hide this failure.

Both docs/evidence/m4-plausibility-after.json and .txt are regenerated.
**Numbers changed:** all six summaries and all 180 per-seed result digests
differ from M4a. docs/m4-plausibility.md now uses the fresh data throughout,
including outcomes, colonisation, collapse, late events and all era-duration
censoring rows. The pre-M4 baseline was not changed. E5+ counts M4a → M4b:
crowded 13→18, doomed 0→0, forager 5→7, harsh 1→2, high-perils 0→0,
lonely 4→5. No new calibration or fixed-random-variates causal claim is made.

### Individual-file timings

Each row ran sequentially as `node --test <file>`, with PowerShell Stopwatch
measuring the complete process. Every row exited 0. During the ensemble,
civ-determinism and refinement-query-order initially took 2772.87 and
2771.85 ms; they were remeasured after the ensemble stopped. The unchanged
signatures file took 5408.30 ms during the ensemble, then 2560.39 ms alone.

| File | Passed | Node duration ms | Process wall ms |
|---|---:|---:|---:|
| tests/m4b-horizon-prefix.test.mjs | 5 | 1834.8106 | 1931.38 |
| tests/horizon-prefix.test.mjs (unchanged) | 3 | 712.1833 | 789.37 |
| tests/civ-determinism.test.mjs (after ensemble) | 4 | 1303.7169 | 1359.13 |
| tests/perf-budget.test.mjs | 2 | 1278.0457 | 1350.71 |
| tests/refinement-query-order.test.mjs (after ensemble) | 1 | 1386.6702 | 1426.84 |
| tests/signatures.test.mjs (unchanged, after ensemble) | 2 | 2520.9526 | 2560.39 |

New/changed test files meet the two-second individual target in these
measurements. **NOT MET:** the unchanged legacy signatures file exceeds two
seconds on the revised RNG history. Its horizon, seed panel and assertions
are untouched. Its observed cold median remains 26,697 > temperate 11,538;
each has at least two attainments, so neither assertion was skipped.
The ensemble's 30-second compile target is also **NOT MET** as recorded above.

### Sole final full-suite execution

`npm test` was run **exactly once**, after the final code, fixtures, test
repins and ensemble/report updates. Full output is out/m4b-full-tests.txt.
Observed exit **0**, exact summary:

```text
ℹ tests 142
ℹ suites 0
ℹ pass 142
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 19830.0413
```

Neither civ-determinism nor refinement-query-order timed out, so the
conditional post-full-run timeout reruns were not needed. No test, source or
hashed contract edits followed the full invocation; only documentation
receipts and file inventory were appended. All original assertions remain;
the existing horizon-prefix file and both 1500 ms child timeouts are unchanged.

`git --no-optional-locks diff --check` returned exit 0 (only Windows
line-ending notices). Final inventory: [m4b-files.txt](evidence/m4b-files.txt).

**M4b correctness items are met.** Remaining NOT MET measurements are the
ensemble tool's 30-second compilation target for lonely-earthlike-6 and the
unchanged signatures test's two-second file target, detailed above. Neither
was hidden by changing a timeout, assertion, model parameter or seed panel.
No visual review was requested or performed.


## M4c — critique fixes

2026-10-04. Exactly B1–B5 addressed; no git writes, network, preview, or
changes to Universe Atlas or `.agent-scratch/before`. The pre-M4 evidence is
untouched. The incoming M4b after JSON is retained as
[evidence/m4b-plausibility-after.json](evidence/m4b-plausibility-after.json).
All new numeric choices are **[scenario]** authored values. No new research
claim, calibration claim, or RNG purpose is introduced.

* B1: summary/report labels distinguish PENDING_ORIGIN from true NO_LINEAGE;
  both remain in N. Duration rows have a separate pendingOrigin censor count.
  This observation change does not write simulation state or results.
* B2: generic collapse eligibility persists after recovery; both Q32 terms
  are divided by 1+min(4,recoveries), with integer flooring. Positive overhead
  guarantees nonzero natural exposure. The cache and provenance include
  recoveries. Saturation and forced-fixture hazard overrides remain intact.
* B3: own occupancy permits reinforcement, subject to failure cooldowns.
  Foreign knowledge expires 2000 years after signal arrival into UNKNOWN.
  Delivered same-source signals refresh the record; arrivalYear remains in
  committed signals. No foreign live state is read.
* B4: new m4c-doomed-star system/domain places doom at 25000 years. Incoming
  M4b crowded E3->E5 p10/p50/p90 are 4290/13120/22240 years, conditional on
  18/30 attainments. The chosen time allows roughly that p90 plus margin;
  it does not guarantee T7 or evacuation. The 3000-year m3b fixture/domain
  is preserved unregistered; its M4b control numbers are in the audit.
* B5: the permitted minimal option retains the reserve cliff. The ordinary
  founding test now observes 2100 years and survives. A zero-growth authored
  fixture isolates inadequate support: TECH_LOSS at 1030 and EXTINCTION at
  1050, colony ages 1020/1040. It intentionally demonstrates the defect,
  rather than asserting universal survival. Tool diagnostics include death
  ages, p10/p50/p90, inclusive ages 1000–1200 count, and surviving arcs.

### M4c goldens

| Check | M4b old | M4c new |
|---|---|---|
| P temperate / civ-m2a-golden / 100 years | `1567cb59f6fcb4243e8b492ef3243ea6631711335ea0ba048027e2db795213f8` | `c54edd6106c8367b0380ecb65fd6c1304e390a86e04d2a082893f69ea9cf9f1f` |
| D toy-12 / toy-1 / 100 years | `c998e6fff27bc9394f24e9882959f8ef08409c9871eb28a334c796ade079dbed` | `38c4b80bb32d3dd4a7dcce8d0bb8086c0c06f65c28d6e10147d4229283570cd1` |
| M1 | `c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc` | unchanged, observed |

Observed commands: `node src/cli.mjs --civ temperate --seed civ-m2a-golden --years 100 --digest`,
`node src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1 --years 100 --digest`,
and `npm run digest` (all produced the values above; exit 0).
The dated binding prose and machine-readable rules change the manifest/RNG
namespace. Equal seed names across revisions do not hold variates fixed;
ensemble differences cannot isolate one fix's causal effect.

### Workload exposure and intermediate checks

No assertion or timeout was weakened or removed. The collapse-immunity
assertion was replaced with the requested persistent-exposure assertion.
The busy workload changes civ-m2a-9 (9 events under M4c) to civ-m2a-2
(253 events, terminal history with retained advanced tiers). All workload,
terminal-stop, digest and 2000 ms assertions remain. The lonely refinement
fixture changes m3-4 (no local annotations) to m3-1 (2 anchors, 2 local
annotations). Crowded m3-2 is unchanged. Query order and cold-process checks
are unchanged. Seed changes restore exposure, not plausibility targets.

Intermediate command receipts (logs in out/):

* `node --test tests/m4-collapse.test.mjs tests/m4-occupancy.test.mjs tests/m4-colony.test.mjs tests/m4-plausibility.test.mjs tests/catalogue.test.mjs tests/report.test.mjs`:
  18 pass / 1 fail, exit 1. The first colony death test incorrectly assumed the
  growing control would die. The zero-growth fixture corrects this assumption.
* `node --test tests/m4-colony.test.mjs`: 3 pass, exit 0, 513.4503 ms.
* `node --test tests/civ-determinism.test.mjs tests/refinement-query-order.test.mjs tests/perf-budget.test.mjs tests/m4-plausibility.test.mjs tests/report.test.mjs`:
  16 pass / 2 fail, exit 1 (lost workload exposures described above).
* `node --test tests/refinement-query-order.test.mjs tests/perf-budget.test.mjs tests/m4-plausibility.test.mjs tests/m4-scenarios.test.mjs`:
  8 pass / 1 fail, exit 1 (1500 ms refinement child timeout while ensemble
  workers ran). Busy workload observed 1626.56 ms / 253 events and passed.
* `node --test tests/expansion.test.mjs tests/contact-horizon.test.mjs tests/stellar-grace.test.mjs tests/horizon-prefix.test.mjs tests/m4b-horizon.test.mjs`:
  13 pass, 0 fail, exit 0, 1156.3672 ms.

Final ensemble, individually measured changed files and sole full-suite
receipts follow below after completion. No perf:panel or visual review.

### Final ensemble and focused verification

`node tools/m4-plausibility.mjs --n 30 --jobs 4 --out docs/evidence/m4-plausibility-after.json`
completed **180/180 seeds, zero simulation errors, exit 1**. Eight compiles
exceeded 30 seconds: forager-future-{2,3,14,10} and
lonely-earthlike-{6,10,7,20}. Slowest was lonely-earthlike-7 at **78,634.87 ms**
(compilation), **79,366.27 ms** including diagnostics. This is NOT MET,
not an ensemble correctness failure. Log: out/m4c-ensemble.txt.

M4b → M4c lonely: 19 emerged / 11 pending / 0 true no-lineage →
20 emerged / 9 pending / 1 true no-lineage. High-perils generic collapse
median/max: 15/26 → 33/88. Doomed-star: 0 → 495 launches;
30 → 23 EXTINCT_STELLAR (different declared lifecycle). Across the M4c
ensemble 201 colony deaths include 61 within ages 1000–1200. The growing
fixture survives; the zero-growth fixture still dies at age 1040. See the
audit for every scenario, censor count, colonisation result and duration.

Individual commands are `node --test <file>`, run sequentially after the
ensemble ended. All exit 0; out/m4c-individual.txt records full output.

| File | Pass | Node ms | Process ms |
|---|---:|---:|---:|
| tests/m4-collapse.test.mjs | 3 | 199.8209 | 290.4346 |
| tests/m4-colony.test.mjs | 3 | 478.1397 | 563.9801 |
| tests/m4-occupancy.test.mjs | 1 | 170.1987 | 258.0828 |
| tests/m4-plausibility.test.mjs | 4 | 305.2022 | 393.5687 |
| tests/m4-scenarios.test.mjs | 2 | 290.2742 | 376.9465 |
| tests/report.test.mjs | 7 | 849.4839 | 934.5523 |
| tests/civ-determinism.test.mjs | 4 | 1247.5835 | 1340.0902 |
| tests/perf-budget.test.mjs | 2 | 1177.2463 | 1267.6061 |
| tests/refinement-query-order.test.mjs | 1 | 2677.1314 | 2758.2974 |

All change-specific M4 files meet the two-second target. **NOT MET:** the
existing refinement-query-order file, using the replacement exposure seed,
takes 2677.1314 ms alone (its assertions pass); its timeout remains 1500 ms.
No timeout was increased or query/coverage assertion removed.

`node --test tests/signatures.test.mjs`: **1 pass, 0 fail, 1 skipped, exit 0**,
8603.1781 ms alone. The unchanged four-seed signature panel has cold lower
median 19,223 <= temperate 37,206 years, invoking its existing NOT MET skip.
Both cohorts have three observed attainments; no seed, horizon, assertion,
or prior was changed. Its two-second file target is also NOT MET.

### Sole final full-suite execution

`npm test` ran **exactly once**, after the final source, fixture, test and
ensemble edits. Observed exit **0**; out/m4c-full-tests.txt records:

```text
ℹ tests 147
ℹ suites 0
ℹ pass 146
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 42004.2065
```

The skip is the existing Kremer NOT MET check above. Neither civ-determinism
nor refinement-query-order timed out in this invocation, so no conditional
post-suite timeout rerun was needed. The earlier preflight timeout remains
reported. Only documentation receipts and inventory followed the full run.
`git --no-optional-locks diff --check` returned exit 0 (line-ending notices
only). Changed-file inventory: [m4c-files.txt](evidence/m4c-files.txt).

**NOT MET:** all calibration bands; the unchanged Kremer panel; the 30-second
compile target (8/180); two-second file target for refinement-query-order and
signatures. The colony reserve cliff is deliberately retained under B5's
permitted minimal option and still causes deaths. Far future remains only
political churn with static within-era energy capture; N=30 has weak tails.
No universal plausibility, sustainability or calibrated prediction is claimed.
