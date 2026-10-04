# M4a plausibility audit — 2026-10-04

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

## Final before/after results

N=30 for each available scenario; zero errored seeds in both ensembles. Complete receipts:

- [Before JSON](evidence/m4-plausibility-before.json) / [before text](evidence/m4-plausibility-before.txt).
- [After JSON](evidence/m4-plausibility-after.json) / [after text](evidence/m4-plausibility-after.txt).

Values separated by → are before → after. A dash means the new scenario did not exist before.

### Attainment counts (all denominators 30)

| Scenario | E3 | E4 | E5+ | Multi-body | NO_LINEAGE |
|---|---:|---:|---:|---:|---:|
| crowded-domain | 30 → 30 | 30 → 30 | 30 → 13 | 30 → 7 | 0 → 0 |
| doomed-star | 30 → 30 | 24 → 8 | 19 → 0 | 19 → 0 | 0 → 0 |
| forager-future | — → 26 | — → 25 | — → 5 | — → 10 | — → 0 |
| harsh-anoxic | 16 → 8 | 15 → 7 | 12 → 1 | 12 → 1 | 0 → 0 |
| high-perils | 30 → 30 | 15 → 12 | 3 → 0 | 1 → 0 | 0 → 0 |
| lonely-earthlike | 7 → 18 | 7 → 18 | 4 → 4 | 4 → 9 | 23 → 11 |

E3 starts in crowded-domain, doomed-star and high-perils are left-censored advanced starts, not stone-age advances. Exact per-mille shares and all first-era witnesses are in the receipts. Lonely produces a lineage in 19/30 seeds versus 7/30 before, with 11/30 still NO_LINEAGE. The longer declared window and horizon are part of that comparison.

### Outcome classes (seeds containing each class)

| Scenario | Before | After |
|---|---|---|
| crowded-domain | COLLAPSED_RECOVERING=10, EXISTENTIAL_CAP=16, EXTANT_MULTI_BODY=17, EXTANT_MULTI_SYSTEM=21, EXTANT_PLANETARY=24, EXTINCT_NATURAL=4, EXTINCT_SELF=11 | COLLAPSED_RECOVERING=18, EXISTENTIAL_CAP=20, EXTANT_MULTI_BODY=1, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=26, EXTINCT_NATURAL=6, EXTINCT_SELF=11 |
| doomed-star | COLLAPSED_RECOVERING=2, EXTANT_MULTI_SYSTEM=5, EXTANT_PLANETARY=6, EXTINCT_NATURAL=3, EXTINCT_STELLAR=11, REGRESSED_STABLE=3 | EXTINCT_STELLAR=30 |
| forager-future | — | COLLAPSED_RECOVERING=10, EXISTENTIAL_CAP=9, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=4, EXTINCT_NATURAL=1, EXTINCT_SELF=5 |
| harsh-anoxic | COLLAPSED_RECOVERING=3, EXISTENTIAL_CAP=3, EXTANT_MULTI_SYSTEM=10, EXTANT_PLANETARY=14 | COLLAPSED_RECOVERING=7, EXTANT_MULTI_BODY=1, EXTANT_PLANETARY=21, EXTINCT_SELF=1 |
| high-perils | COLLAPSED_RECOVERING=17, EXISTENTIAL_CAP=6, EXTINCT_SELF=7 | COLLAPSED_RECOVERING=21, EXISTENTIAL_CAP=5, EXTANT_PLANETARY=2, EXTINCT_SELF=2 |
| lonely-earthlike | COLLAPSED_RECOVERING=1, EXTANT_MULTI_SYSTEM=1, EXTINCT_NATURAL=1, EXTINCT_SELF=2, NO_LINEAGE=23, REGRESSED_STABLE=2 | COLLAPSED_RECOVERING=3, EXISTENTIAL_CAP=10, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=2, EXTINCT_SELF=3, NO_LINEAGE=11 |

### Lineage extinction events by class

| Scenario | Before | After |
|---|---|---|
| crowded-domain | EXTINCT_NATURAL=4, EXTINCT_SELF=12 | EXTINCT_NATURAL=7, EXTINCT_SELF=11 |
| doomed-star | EXTINCT_NATURAL=3, EXTINCT_STELLAR=11 | EXTINCT_STELLAR=30 |
| forager-future | — | EXTINCT_NATURAL=1, EXTINCT_SELF=5 |
| harsh-anoxic | none | EXTINCT_SELF=1 |
| high-perils | EXTINCT_SELF=7 | EXTINCT_SELF=2 |
| lonely-earthlike | EXTINCT_NATURAL=1, EXTINCT_SELF=2 | EXTINCT_SELF=3 |

### Colonisation

Accepted includes founding and reinforcement; new-colony and reinforcement counts are separate in the receipts. All COLONY_LOST counts are zero in both ensembles; abrupt zero-population deaths instead emit EXTINCTION.

| Scenario | LAUNCH | Accepted COLONY_FOUNDED | Rejected by reason | VOYAGE_LOST | Repeat failed target launches |
|---|---:|---:|---|---:|---:|
| crowded-domain | 7975 → 30 | 3215 → 30 | occupied-by-other-lineage=4571 → none | 28 → 0 | 5597 → 10 |
| doomed-star | 1373 → 0 | 1233 → 0 | destination-uninhabitable=131 → none | 4 → 0 | 349 → 0 |
| forager-future | — → 120 | — → 118 | — → none | — → 2 | — → 73 |
| harsh-anoxic | 684 → 4 | 670 → 4 | none → none | 2 → 0 | 209 → 2 |
| high-perils | 1 → 0 | 1 → 0 | none → none | 0 → 0 | 0 → 0 |
| lonely-earthlike | 1007 → 116 | 909 → 115 | destination-uninhabitable=94 → none | 2 → 1 | 409 → 73 |

Crowded-domain-1 specifically changes from **269 occupied rejections / 514 arrivals** (245 accepted) to **0 / 0**. It does not launch in the final revision, so that seed alone provides no targeting-effect estimate. Across crowded-domain, occupied rejections fall **4,571 → 0**, but launches also fall **7,975 → 30**. The unit test independently establishes that unknown occupancy remains targetable and delivered occupancy is avoided. This is not an isolated causal estimate from the ensemble.

The small-founder test preserves habitat-critical tiers and growth through 500 years with other hazards disabled. That verifies removal of the immediate maintenance death mechanism. It does not establish universal colony survival: the long runs still contain colony deaths and repeat attempts, now governed by delayed knowledge and cooldowns.

### Generic collapse and late history

| Scenario | Collapse median/max before | Collapse median/max after | Late post-exit accepted P events before → after | After seeds with late activity |
|---|---:|---:|---:|---:|
| crowded-domain | 26/48 | 13/22 | 62647 → 3742 | 12/30 |
| doomed-star | 3/13 | 0/2 | 6916 → 0 | 0/30 |
| forager-future | — | 12/77 | — → 17478 | 9/30 |
| harsh-anoxic | 1/13 | 0/4 | 6975 → 24 | 1/30 |
| high-perils | 35/301 | 15/29 | 0 → 0 | 0/30 |
| lonely-earthlike | 0/47 | 4/78 | 14975 → 13279 | 4/30 |

High-perils-4 falls from **59 to 4** generic collapses. High-perils across seeds falls from **35/301 to 15/29 median/max**. The bound is regional and per arc, not a universal per-seed event cap. Longer horizons and new colony episodes can increase a seed’s total; lonely-earthlike’s max increases from 47 to 78. Perils-caused collapse counts are separate in the receipts.

The baseline already had substantial late activity. Therefore this audit does **not** substantiate a blanket claim that all pre-M4 post-perils histories were static. The added positive renewal term guarantees exposure for eligible low-stress polities; it does not guarantee a firing in every finite run. Fewer M4 lineages leave perils, so total post-exit events can decline despite that new driver. High-perils has no sampled post-exit late activity in either revision.

### Era durations versus the authored targets

Durations below are years, conditional on observed attainment. L/R/N are left-censored / right-censored / no-lineage counts. Errors are zero. R includes failure to reach the source, itemised in the complete receipts.

| Scenario/version | Interval | Observed | p10 / p50 / p90 | L/R/N |
|---|---|---:|---:|---:|
| crowded-domain before | E3→E4 | 30 | 190 / 290 / 470 | 0/0/0 |
| crowded-domain before | E4→E5 | 30 | 50 / 160 / 380 | 0/0/0 |
| crowded-domain before | E5→E6 | 30 | 30 / 70 / 210 | 0/0/0 |
| crowded-domain before | E6→E7 | 30 | 10 / 20 / 90 | 0/0/0 |
| crowded-domain before | E3→E7 | 30 | 420 / 540 / 1290 | 0/0/0 |
| crowded-domain after | E3→E4 | 30 | 1130 / 2820 / 7650 | 0/0/0 |
| crowded-domain after | E4→E5 | 13 | 8280 / 10690 / 13900 | 0/17/0 |
| crowded-domain after | E5→E6 | 6 | 3930 / 10010 / 16330 | 0/24/0 |
| crowded-domain after | E6→E7 | 4 | 2970 / 3040 / 3440 | 0/26/0 |
| crowded-domain after | E3→E7 | 4 | 25290 / 27120 / 28890 | 0/26/0 |
| forager-future after | E0→E1 | 30 | 330 / 4840 / 53430 | 0/0/0 |
| forager-future after | E1→E3 | 26 | 9170 / 23250 / 71670 | 0/4/0 |
| forager-future after | E3→E4 | 25 | 1620 / 5530 / 17000 | 0/5/0 |
| forager-future after | E4→E5 | 5 | 3560 / 21260 / 21320 | 0/25/0 |
| forager-future after | E5→E6 | 4 | 2500 / 16650 / 23890 | 0/26/0 |
| forager-future after | E6→E7 | 3 | 8350 / 30150 / 30150 | 0/27/0 |
| forager-future after | E3→E7 | 3 | 37830 / 63250 / 63250 | 0/27/0 |
| lonely-earthlike after | E0→E1 | 19 | 660 / 6490 / 43720 | 0/0/11 |
| lonely-earthlike after | E1→E3 | 18 | 12490 / 19550 / 60250 | 0/1/11 |
| lonely-earthlike after | E3→E4 | 18 | 1140 / 6550 / 26230 | 0/1/11 |
| lonely-earthlike after | E4→E5 | 4 | 9340 / 11840 / 13620 | 0/15/11 |
| lonely-earthlike after | E5→E6 | 2 | 4660 / 4660 / 4660 | 0/17/11 |
| lonely-earthlike after | E6→E7 | 1 | 22620 / 22620 / 22620 | 0/18/11 |
| lonely-earthlike after | E3→E7 | 1 | 63100 / 63100 / 63100 | 0/18/11 |

The crowded-domain E3→E7 observed median grows **540 → 27,120 years**; E6→E7 grows **20 → 3,040 years**. All four crowded-domain middle/late interval medians lie in the authored bands, but only 4/30 seeds reach E7. That censoring prevents claiming a typical whole-ensemble E7 time.

**Calibration targets are not all met.** Forager-future E3→E4 median **5,530** exceeds the 5 kyr target ceiling; E4→E5 median **21,260** exceeds 15 kyr (only five observed runs). Lonely E3→E4 median **6,550** also exceeds 5 kyr. High-perils E3→E4 median is **13,270**, with 18 right-censored runs. Forager E0→E1 p10/p90 are **330/53,430**, outside the intended 1–20 kyr span; a central median inside a band does not calibrate the tails. These are remaining model limitations, not passed plausibility assertions.

Forager-future reaches E3 in 26/30 seeds, E4 in 25/30, E5+ in 5/30, multi-body history in 10/30, and E7 in 3/30 by 120 kyr. Thus the new E0 experiment actually reaches the far future in some runs while retaining and reporting all nonattainment.



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

P-path horizon dependence is deliberately untouched in M4a and remains a
separate later round. No visual work or Luna review was required or performed.
