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
