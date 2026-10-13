# M5 matched policy measurement protocol

This is an observational harness for the current simulation. It changes no
scenario, policy, RNG stream or simulation rule. The policies remain opt-in.
These authored scenario results describe model behaviour; they are not forecasts
or calibrated probabilities.

## Frozen primary panel

| Arm | Targeting | Colony |
| --- | --- | --- |
| B | default | default |
| T | `m5-targeting-1` | default |
| C | default | `m5-colony-2` |
| TC | `m5-targeting-1` | `m5-colony-2` |

Run each arm for `crowded-domain`, `high-perils` and `doomed-star`, using the
existing configured horizon of 30,000 years. Every arm receives exactly the same
30 seeds per scenario, `<scenario>-0` through `<scenario>-29`: **360 primary
runs**. Seed index i rotates the arm order `[B,T,C,TC]` by i modulo four. Each
run uses a fresh worker; jobs must be one. Early terminal stops remain in the
sample, and the actual `endYear` is retained.

Compare **T−B**, **TC−C**, **C−B**, **TC−T**, and interaction
**(TC−C)−(T−B)** separately for each scenario. The report retains paired counts,
missing/error seeds, lower-order p10/p50/p90, means and positive/zero/negative
delta counts. Person counts use BigInt internally and decimal strings in JSON;
their means retain an exact numerator and denominator. No result is pooled
across scenarios. The colony policy contrast includes its inherited
`m5-colony-1` behaviour; it does not isolate the incremental `m5-colony-2`
change against colony-1.

Repeat seed zero under every arm and scenario after the panel: **12 extra
reproducibility runs**, making 372 compiles in the full command. Compare every
deterministic observation, including raw diagnostics, outcome classes and
result/manifest/recipe digests, excluding timing and memory measurements.

## Cohorts and terminal fates

`tools/m5-voyage-diagnostics.mjs` consumes the raw accepted events and the final
ledger/archive accounts before `summarizeRun` discards stages, params and
reasons. A cohort starts at an original LAUNCH transit account. Rescue transfers
explicitly connect later accounts to that original cohort, so diversion and
stranding legs never inflate the original launch or person count.

For every cohort, the diagnostic verifies:

```text
original passengers = landed + died before landing + currently in transit
```

This describes voyage accounting. Landed passengers may subsequently die or
have descendants; the simulation does not identify individual people after
landing. Consequently `deliveredPersons` and `rescuedDeliveredPersons` measure
landings, not living descendants or horizon survivors. Horizon lineage outcomes
are reported separately, and uncompleted transit is right-censored at actual
`endYear`. Fixture voyages that precede the event log are explicitly counted
as fixture cohorts and reconstruct their original account from the first debit
or a still-live account.

The diagnostic separates arrival stages `FOUNDED`, `REINFORCEMENT`, `DIVERTED`,
`STRANDED` and `REJECTED`, plus terminal transit-loss events. It retains attempt
rejection reasons, terminal rejection reasons, pending leg types and original
cohort fates. A diverted cohort can later strand and finally die: those are
three arrival attempts and one cohort loss. Rescue success requires an eventual
landing. An alive stranded account alone is not a successful rescue.

Sample detail is bounded to twenty rescued cohorts and twenty conservation
failures per run. Full counts and all per-seed measurements are retained; the
entire simulation event log is never copied into the benchmark output.

## Stock metric interpretation

- `colonisation.rejected` in `m4-plausibility.mjs` counts every rejected attempt,
  including rescued `DIVERTED` and `STRANDED` attempts. The new
  `terminalRejectionEvents` paired metric only counts `REJECTED` stages.
- Stock `repeatLaunchesToFailedTarget` links failures to original LAUNCH
  voyages. The new `repeatFailedLegDestinationLaunches` observation includes
  rejection/loss at rescue-leg destinations too. Both observe actual earlier
  failures omnisciently; neither means the launcher knew those facts.
- `launchPriorFailure` is emitted only with targeting enabled (T/TC). B/C
  expose no such causal-knowledge field. The report marks it unavailable and
  leaves counts null; an absent field is never interpreted as zero knowledge.
- Stock `colonyDeaths.within200YearsAfterReserve` actually counts death ages
  1,000 through 1,200 years since founding, inclusive. Reinforcement can
  replenish reserve; this is **not** time since measured reserve depletion.
  The paired report names it `colonyDeathAge1000To1200`.
- Stock colony death ages and their p10/p50/p90 condition on observed
  extinction. Remaining colony arcs are right-censored. Avoid treating the
  death-age median as an unconditional survival estimate.
- `multiBody` means that a lineage ever inhabited at least two bodies, not
  that both remained inhabited simultaneously at the end.
- Stock outcome classes can overlap in a multi-lineage domain. Report per-seed
  classes, lineage classes and surviving lineage counts separately.

## Performance and reproducibility

Compile wall time and process CPU span `createScenario` plus
`compileSummary({observe:true})`. Diagnostic wall time includes analysis after
compilation. RSS after compilation is a process snapshot; process peak RSS is
the lifetime maximum through compilation, including startup/imports. No value
is described as isolated compilation allocation or browser/GPU cost. Each
arm reports medians, quantiles, maximum and the number of compiles taking at
least thirty seconds. The pass field checks completion, no errors, cohort
conservation and deterministic reruns; performance limits are disclosed
separately rather than silently equated with model correctness.

Run on a quiet CPU after other track checks finish. Runtime Node version,
platform/architecture, Git HEAD and content hashes of `src/`, `fixtures/` and
the observational tooling are pinned into the checkpoint. Every completed run
writes a checkpoint; resume requires identical sources, runtime and panel
configuration. Source drift during a run stops the harness. A changed source
requires a new output path and a fresh panel.

```powershell
# Plan only: inspect all 360 task definitions; no simulation executes.
node tools/m5-policy-panel.mjs --plan

# Tooling smoke: twelve short primary runs plus twelve repeat checks.
# SMOKE is labelled explicitly and provides no policy evidence.
node tools/m5-policy-panel.mjs --run --smoke --n 1 --until-year 100 --out out/m5-policy-smoke.json

# Frozen panel: serial CPU slot, 360 primary runs plus twelve repeat checks.
node tools/m5-policy-panel.mjs --run --jobs 1 --out out/m5-policy-panel.json

# Resume the same source/runtime/config after interruption.
node tools/m5-policy-panel.mjs --run --jobs 1 --resume --out out/m5-policy-panel.json
```

The JSON retains every per-seed measurement, observational digests, conservation
summaries, paired contrasts and methods. The matching Markdown report is
generated from those observations. Checkpoint, report and smoke output live
under ignored `out/`; once independently inspected, retain the final evidence
with a concise results note under `docs/evidence/` and link it from this
protocol. **No primary panel result is claimed by adding this harness.**
