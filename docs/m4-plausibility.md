# M4a/M4b plausibility audit — 2026-10-04

These are authored scenarios and model attribution, not predictions. No new
research claim supports the cost schedule, colony reserve, cooldowns, learning
bound or political renewal rate. All are **[scenario]**. The existing Morris
energy figures retain their attribution in the transition table.

## Method

`tools/m4-plausibility.mjs` uses the public `createScenario`,
`compileSummary` and `summarizeRun` APIs. The same code reads the pre-M4 source
root at `.agent-scratch/before` (3d3453a) and the current root. Each registered
scenario gets seeds `<scenario>-0` through `<scenario>-29`. The bounded P-only
`lonely-bounded` fixture is a refinement test helper, not a registered ensemble
scenario. The new `forager-future` has no pre-M4 counterpart.

Each JSON includes all seed result digests, outcome classes, first-era witnesses,
counts, censoring, and per-seed collapses. The accompanying text is a compact
rendering of those same statistics. No timings enter either artifact. Timings
go to stderr; primary compilation and the additional diagnostic inspection are
reported separately. Errors remain in N and have their own count.

Reach includes advanced starts and means ever reached. Multi-body means one
lineage ever inhabited two bodies; it does not require simultaneous survival.
Crowded-domain has multiple lineages, so per-seed outcome-class counts can sum
above N. Separate lineage-class counts and LINEAGE_EXTINCTION event counts are
also retained. Domain era durations follow the domain frontier; in a crowded
domain, different lineages may supply different first-era witnesses.

Duration percentiles use sorted[floor((n−1)×p/100)], with no interpolation.
A duration is observed only if the run starts at/below its source era, reaches
that source, and reaches the target. Starts above the source are left censored.
Inhabited runs missing the source or target are right censored, with source-not-
reached a separately identified subset. NO_LINEAGE is separately censored,
never silently removed. Observed + left + right + no-lineage + errors = N for
every duration row. Extinction before attainment is retained among unobserved
durations; it is a competing terminal outcome, not evidence of eventual advance.
The reported quantiles are conditional on observed attainment, not survival-
analysis estimates of the whole population.

The late-history statistic counts accepted **P** events dated in the final
50% of the configured horizon, whose owning arc's event-tick pre-state has
perils=`exited`. A read-only per-tick callback streams those pre-state flags in M4. On older
roots a second public inspection pass samples exactly those event ticks and
checks the same result digest. The callback is checked against full inspection. This handles exits and reentries
exactly; it does not extrapolate from sparse century plots. D has no perils
state, so D events are excluded. This is an activity measure, not a measure of
cultural novelty. A terminal run ending before the midpoint contributes zero.

COLONY_FOUNDED accepted counts exclude scheduled arrival rejections, even
though those dispositions are accepted ledger events. Rejection reasons remain
separate. Repeated launches are measured against actual earlier failures at
that lineage/target, including failures whose notices have not arrived. That
omniscient measurement is confined to this tool; launch policy itself has only
delivered knowledge. COLONY_LOST is the model's small-positive-population event;
an abrupt habitat failure can pass directly to zero and EXTINCTION without it.

Changing the binding table changes the RNG manifest. Identical seed names
therefore do not hold every random variate fixed across revisions. Further,
lonely-earthlike changes from a 100 kyr habitability window / 120 kyr horizon
to a 2 Myr window / 320 kyr horizon. Its before/after figures compare declared
scenarios; they do not isolate any single mechanism's causal effect.

## Authored target spans

| Era interval | Intended rough scale [scenario] |
|---|---:|
| E0→E1 | 1–20 kyr |
| E1→E3 | 2–30 kyr |
| E3→E4 | 0.3–5 kyr |
| E4→E5 | 1–15 kyr |
| E5→E6 | 2–30 kyr |
| E6→E7 | 2–50 kyr |

An initial M4 trial overshot the middle-tier targets: crowded-domain E3→E4
median 7,650 years, and forager-future median 17,890. It is preserved in
`out/m4-first-trial.json`. The final schedule reduces middle-tier costs while
keeping costs increasing within each domain and retaining expensive final
tiers. Targets were declared before that trial and were not relabelled to fit
the observations. The final receipts below use the final schedule only.

## Final before/after results (M4b refresh)

The after ensemble was regenerated after the horizon manifest revision with
`node tools/m4-plausibility.mjs --n 30 --jobs 1 --out docs/evidence/m4-plausibility-after.json`.
All 180 seeds completed with zero simulation errors. Exit was **1** because
lonely-earthlike-6 compiled in **35,868.78 ms** (diagnostic **36,179.71 ms**),
exceeding the tool's 30-second compile budget on this shared machine. This
is a complete ensemble receipt, not a passing performance receipt.

**The numbers changed.** All six scenario summaries and all 180 result digests
differ from M4a after the shared contract/manifest RNG namespace revision.
No dynamics or calibration constants were changed in M4b; equal seed names
across revisions do not imply equal variates. The pre-M4 baseline is unchanged.

- [Before JSON](evidence/m4-plausibility-before.json) / [before text](evidence/m4-plausibility-before.txt).
- [M4b after JSON](evidence/m4-plausibility-after.json) / [after text](evidence/m4-plausibility-after.txt).

Values separated by → below are **pre-M4 → M4b**, except the explicitly labelled M4a comparison. All denominators are 30; a dash marks the new forager scenario.

### Attainment counts

| Scenario | E3 | E4 | E5+ | Multi-body | NO_LINEAGE |
| --- | --- | --- | --- | --- | --- |
| crowded-domain | 30 → 30 | 30 → 30 | 30 → 18 | 30 → 11 | 0 → 0 |
| doomed-star | 30 → 30 | 24 → 5 | 19 → 0 | 19 → 0 | 0 → 0 |
| forager-future | — → 26 | — → 24 | — → 7 | — → 10 | — → 0 |
| harsh-anoxic | 16 → 10 | 15 → 7 | 12 → 2 | 12 → 4 | 0 → 0 |
| high-perils | 30 → 30 | 15 → 11 | 3 → 0 | 1 → 0 | 0 → 0 |
| lonely-earthlike | 7 → 15 | 7 → 13 | 4 → 5 | 4 → 7 | 23 → 11 |

E3 starts in crowded-domain, doomed-star and high-perils are left-censored advanced starts. Lonely produces a lineage in 19/30 seeds versus 7/30 before; the longer declared scenario window remains part of that comparison.

### Change from the M4a after ensemble

| Scenario | E4 M4a → M4b | E5+ M4a → M4b | Multi-body M4a → M4b |
| --- | --- | --- | --- |
| crowded-domain | 30 → 30 | 13 → 18 | 7 → 11 |
| doomed-star | 8 → 5 | 0 → 0 | 0 → 0 |
| forager-future | 25 → 24 | 5 → 7 | 10 → 10 |
| harsh-anoxic | 7 → 7 | 1 → 2 | 1 → 4 |
| high-perils | 12 → 11 | 0 → 0 | 0 → 0 |
| lonely-earthlike | 18 → 13 | 4 → 5 | 9 → 7 |


### Outcome classes (seeds containing each class)

| Scenario | Before | After |
| --- | --- | --- |
| crowded-domain | COLLAPSED_RECOVERING=10, EXISTENTIAL_CAP=16, EXTANT_MULTI_BODY=17, EXTANT_MULTI_SYSTEM=21, EXTANT_PLANETARY=24, EXTINCT_NATURAL=4, EXTINCT_SELF=11 | COLLAPSED_RECOVERING=24, EXISTENTIAL_CAP=17, EXTANT_MULTI_BODY=3, EXTANT_PLANETARY=26, EXTINCT_NATURAL=3, EXTINCT_SELF=12 |
| doomed-star | COLLAPSED_RECOVERING=2, EXTANT_MULTI_SYSTEM=5, EXTANT_PLANETARY=6, EXTINCT_NATURAL=3, EXTINCT_STELLAR=11, REGRESSED_STABLE=3 | EXTINCT_STELLAR=30 |
| forager-future | — | COLLAPSED_RECOVERING=8, EXISTENTIAL_CAP=6, EXTANT_MULTI_BODY=1, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=5, EXTINCT_NATURAL=1, EXTINCT_SELF=7 |
| harsh-anoxic | COLLAPSED_RECOVERING=3, EXISTENTIAL_CAP=3, EXTANT_MULTI_SYSTEM=10, EXTANT_PLANETARY=14 | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=1, EXTANT_MULTI_BODY=3, EXTANT_PLANETARY=21, EXTINCT_SELF=1 |
| high-perils | COLLAPSED_RECOVERING=17, EXISTENTIAL_CAP=6, EXTINCT_SELF=7 | COLLAPSED_RECOVERING=19, EXISTENTIAL_CAP=5, EXTANT_PLANETARY=5, EXTINCT_SELF=1 |
| lonely-earthlike | COLLAPSED_RECOVERING=1, EXTANT_MULTI_SYSTEM=1, EXTINCT_NATURAL=1, EXTINCT_SELF=2, NO_LINEAGE=23, REGRESSED_STABLE=2 | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=4, EXTANT_MULTI_SYSTEM=4, EXTANT_PLANETARY=5, EXTINCT_SELF=2, NO_LINEAGE=11 |


### Lineage extinction events by class

| Scenario | Before | After |
| --- | --- | --- |
| crowded-domain | EXTINCT_NATURAL=4, EXTINCT_SELF=12 | EXTINCT_NATURAL=3, EXTINCT_SELF=15 |
| doomed-star | EXTINCT_NATURAL=3, EXTINCT_STELLAR=11 | EXTINCT_STELLAR=30 |
| forager-future | — | EXTINCT_NATURAL=1, EXTINCT_SELF=7 |
| harsh-anoxic | none | EXTINCT_SELF=1 |
| high-perils | EXTINCT_SELF=7 | EXTINCT_SELF=1 |
| lonely-earthlike | EXTINCT_NATURAL=1, EXTINCT_SELF=2 | EXTINCT_SELF=2 |


### Colonisation

Accepted includes founding and reinforcement. Their separate counts are in the receipts. All COLONY_LOST counts remain zero in both ensembles; abrupt zero-population deaths instead emit EXTINCTION.

| Scenario | LAUNCH | Accepted COLONY_FOUNDED | Rejected by reason | VOYAGE_LOST | Repeat failed target launches |
| --- | --- | --- | --- | --- | --- |
| crowded-domain | 7975 → 59 | 3215 → 59 | occupied-by-other-lineage=4571 → none | 28 → 0 | 5597 → 22 |
| doomed-star | 1373 → 0 | 1233 → 0 | destination-uninhabitable=131 → none | 4 → 0 | 349 → 0 |
| forager-future | — → 129 | — → 128 | — → none | — → 1 | — → 79 |
| harsh-anoxic | 684 → 10 | 670 → 10 | none → none | 2 → 0 | 209 → 2 |
| high-perils | 1 → 0 | 1 → 0 | none → none | 0 → 0 | 0 → 0 |
| lonely-earthlike | 1007 → 221 | 909 → 221 | destination-uninhabitable=94 → none | 2 → 0 | 409 → 167 |

The small-founder test verifies removal of immediate maintenance death; it does not establish universal colony survival. Later deaths and repeat attempts remain.

### Generic collapse and late history

| Scenario | Collapse median/max before | Collapse median/max after | Late post-exit accepted P events before → after | After seeds with late activity |
| --- | --- | --- | --- | --- |
| crowded-domain | 26/48 | 14/21 | 62647 → 5275 | 15/30 |
| doomed-star | 3/13 | 0/1 | 6916 → 0 | 0/30 |
| forager-future | — | 10/65 | — → 22356 | 8/30 |
| harsh-anoxic | 1/13 | 0/5 | 6975 → 247 | 3/30 |
| high-perils | 35/301 | 15/26 | 0 → 0 | 0/30 |
| lonely-earthlike | 0/47 | 0/117 | 14975 → 54851 | 5/30 |

High-perils-4 has 59 → 23 generic collapses. The bound remains per region and per arc; it is not a seed-wide cap. New colony episodes can increase totals. Perils collapses are reported separately.

The baseline already had substantial late activity, so this audit does not establish a blanket pre-M4 static-history claim. Renewal guarantees exposure, not a firing in every finite interval. High-perils has no sampled post-exit late activity in either revision.

### Era durations versus the authored targets

Durations are years conditional on observed attainment. L/R/N are left/right/no-lineage censor counts; errors are zero. R includes source-not-reached (separately listed in JSON/text). All M4b intervals are included, even empty cohorts.

| Scenario/version | Interval | Observed | p10 / p50 / p90 | L/R/N |
| --- | --- | --- | --- | --- |
| crowded-domain before | E3→E4 | 30 | 190 / 290 / 470 | 0/0/0 |
| crowded-domain before | E4→E5 | 30 | 50 / 160 / 380 | 0/0/0 |
| crowded-domain before | E5→E6 | 30 | 30 / 70 / 210 | 0/0/0 |
| crowded-domain before | E6→E7 | 30 | 10 / 20 / 90 | 0/0/0 |
| crowded-domain before | E3→E7 | 30 | 420 / 540 / 1290 | 0/0/0 |
| crowded-domain after | E0→E1 | 0 | — / — / — | 30/0/0 |
| crowded-domain after | E1→E3 | 0 | — / — / — | 30/0/0 |
| crowded-domain after | E3→E4 | 30 | 1160 / 3190 / 6510 | 0/0/0 |
| crowded-domain after | E4→E5 | 18 | 2700 / 8520 / 18630 | 0/12/0 |
| crowded-domain after | E5→E6 | 6 | 6050 / 9560 / 11190 | 0/24/0 |
| crowded-domain after | E6→E7 | 3 | 1110 / 4670 / 4670 | 0/27/0 |
| crowded-domain after | E3→E7 | 3 | 20150 / 21860 / 21860 | 0/27/0 |
| doomed-star after | E0→E1 | 0 | — / — / — | 30/0/0 |
| doomed-star after | E1→E3 | 0 | — / — / — | 30/0/0 |
| doomed-star after | E3→E4 | 5 | 1440 / 1660 / 2470 | 0/25/0 |
| doomed-star after | E4→E5 | 0 | — / — / — | 0/30/0 |
| doomed-star after | E5→E6 | 0 | — / — / — | 0/30/0 |
| doomed-star after | E6→E7 | 0 | — / — / — | 0/30/0 |
| doomed-star after | E3→E7 | 0 | — / — / — | 0/30/0 |
| forager-future after | E0→E1 | 30 | 960 / 6830 / 67790 | 0/0/0 |
| forager-future after | E1→E3 | 26 | 10530 / 26530 / 74400 | 0/4/0 |
| forager-future after | E3→E4 | 24 | 1340 / 4720 / 20320 | 0/6/0 |
| forager-future after | E4→E5 | 7 | 2670 / 14080 / 28860 | 0/23/0 |
| forager-future after | E5→E6 | 5 | 890 / 16820 / 44630 | 0/25/0 |
| forager-future after | E6→E7 | 4 | 5410 / 11270 / 12100 | 0/26/0 |
| forager-future after | E3→E7 | 4 | 29750 / 34550 / 69940 | 0/26/0 |
| harsh-anoxic after | E0→E1 | 18 | 370 / 2220 / 6510 | 0/12/0 |
| harsh-anoxic after | E1→E3 | 10 | 10190 / 14820 / 21150 | 0/20/0 |
| harsh-anoxic after | E3→E4 | 7 | 2380 / 3130 / 5220 | 0/23/0 |
| harsh-anoxic after | E4→E5 | 2 | 3090 / 3090 / 3090 | 0/28/0 |
| harsh-anoxic after | E5→E6 | 0 | — / — / — | 0/30/0 |
| harsh-anoxic after | E6→E7 | 0 | — / — / — | 0/30/0 |
| harsh-anoxic after | E3→E7 | 0 | — / — / — | 0/30/0 |
| high-perils after | E0→E1 | 0 | — / — / — | 30/0/0 |
| high-perils after | E1→E3 | 0 | — / — / — | 30/0/0 |
| high-perils after | E3→E4 | 11 | 9600 / 16900 / 25580 | 0/19/0 |
| high-perils after | E4→E5 | 0 | — / — / — | 0/30/0 |
| high-perils after | E5→E6 | 0 | — / — / — | 0/30/0 |
| high-perils after | E6→E7 | 0 | — / — / — | 0/30/0 |
| high-perils after | E3→E7 | 0 | — / — / — | 0/30/0 |
| lonely-earthlike after | E0→E1 | 16 | 5810 / 10970 / 26680 | 0/3/11 |
| lonely-earthlike after | E1→E3 | 15 | 11910 / 28760 / 52760 | 0/4/11 |
| lonely-earthlike after | E3→E4 | 13 | 1840 / 7920 / 21920 | 0/6/11 |
| lonely-earthlike after | E4→E5 | 5 | 4550 / 8330 / 42650 | 0/14/11 |
| lonely-earthlike after | E5→E6 | 4 | 5660 / 9550 / 47400 | 0/15/11 |
| lonely-earthlike after | E6→E7 | 4 | 3850 / 8520 / 10370 | 0/15/11 |
| lonely-earthlike after | E3→E7 | 4 | 18170 / 25110 / 80290 | 0/15/11 |

Crowded-domain E3→E7 observed median grows **540 → 21,860 years** and E6→E7 **20 → 4,670 years**; only 3/30 seeds reach E7, so these are not whole-ensemble typical times.

**Calibration targets remain unmet overall.** Forager E3→E4 and E4→E5 medians are now **4,720** and **14,080** years, inside their bands, but only 7/30 reach E5. Its E0→E1 p10/p90 remain outside the 1–20 kyr span at **960/67,790** years. Lonely E3→E4 median **7,920** and high-perils **16,900** still exceed 5 kyr, with 6 and 19 right-censored runs respectively (lonely also has 11 no-lineage runs). No new calibration is claimed.

Forager reaches E3 in 26/30, E4 in 24/30, E5+ in 7/30, multi-body history in 10/30 and E7 in 4/30 by 120 kyr. Nonattainment remains in the denominator.

## Still implausible / not modelled

The four-recovery bound is a coarse assertion that this generic failure
mechanism has four learnable institutional weaknesses. It should not be read
as a historical law or permanent immunity. New colony episodes reset that
region-local learning; perils and external catastrophes remain separate risks.
Recovery can remain active for a long time without restoring lost knowledge.

The founding reserve abstracts manuals, tools and automated instruction into
maintenance capability for 1,000 years. It does not model occupations, schools,
spare parts, actual archive degradation, supply chains or parent subsidies.
Catastrophes can still remove habitat-critical tiers during the reserve period.
The failure beacon and conservative stale-occupancy policy simplify unreliable
communication, reconnaissance and diplomatic access. Rejected arrivals still
kill passengers under the inherited disposition recipe.

Political renewal produces events after perils exit; energy capture stays fixed
within an era. There are no megaproject stocks, evolving E7 capture, richer
post-biological futures, continuous astronomy, migration diplomacy or resource
economics. Many wars and plagues remain generated by the inherited recipes.
The topology has a finite number of bodies and short fixed routes.

The E0 scenario reuses the existing post-sapience fixture: 10,000 people in one
region, above its initial forager capacity, so initial demographic correction
is part of the scenario. It is not an Earth reconstruction. Sapience is still
the authored three-hard-step lottery in lonely-earthlike, with uncalibrated
rates. Thirty seeds give weak tail information, especially when only one or a
few seeds attain a late era. Censored rows cannot establish a typical future.

M4b fixes P/D forced-fixture horizon dependence; the after receipts above
use that revised manifest. No visual work or Luna review was required or performed.
