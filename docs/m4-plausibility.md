# M4c plausibility audit — 2026-10-04

These are authored scenarios and model attribution, not predictions. All numerical choices are **[scenario]**. No new research claim or calibration is made. Local evidence has high confidence as a record of these runs, not as a forecast.

## Method and receipts

`node tools/m4-plausibility.mjs --n 30 --jobs 4 --out docs/evidence/m4-plausibility-after.json` observes all six registered scenarios, seeds `<scenario>-0` through `-29`. All counts retain N=30, including errors and pending origins. Timings remain outside deterministic JSON/text. Observed exit **1**, zero simulation errors; eight compiles exceeded 30 seconds (maximum 78,634.87 ms). The exact performance receipt is in the [M4c handoff](m4-implementation.md#m4c--critique-fixes).

[Pre-M4 JSON](evidence/m4-plausibility-before.json) and [text](evidence/m4-plausibility-before.txt) remain untouched. [M4b JSON](evidence/m4b-plausibility-after.json) preserves the incoming comparison. [M4c JSON](evidence/m4-plausibility-after.json) and [text](evidence/m4-plausibility-after.txt) contain every digest and seed result. Tables below compare **M4b → M4c**, except the explicitly labelled pre-M4 collapse column.

The shared binding contract changes the manifest/RNG namespace, so equal seed names do not hold variates fixed. The doomed-star lifecycle also changes. These comparisons do not isolate a single mechanism’s causal effect.

Quantiles are sorted[floor((n−1)×p/100)], without interpolation. Era durations are conditional on observed attainment. Starts above the source are left censored; inhabited nonattainment is right censored (source-not-reached is retained separately in JSON). Pending origins and true NO_LINEAGE are separate censor categories. Observed + left + right + no-lineage + pending + errors = N. Extinction before attainment is a competing outcome, not evidence of eventual advancement.

Reach includes advanced starts. Multi-body means a lineage ever inhabited at least two bodies, not simultaneous survival. Crowded outcome classes can overlap across lineages. Accepted founding includes reinforcement; rejected arrivals remain separate. Repeat-failure launch measurement is omniscient only in the diagnostic; targeting uses delivered messages. Late activity counts accepted P events in the final half of the configured horizon whose exact tick pre-state has perils=exited; it excludes D events.

## B1: origin censoring

The incoming M4b lonely audit’s 11 “NO_LINEAGE” runs were pending beyond 320 kyr (supplied independent critique: scheduled 325,131–1,340,714 years, within the 2 Myr window). Correct interpretation: **19/30 emerged by 320 kyr; 11/30 censored pending; 0 true no-lineage**. PENDING_ORIGIN is now an observation label; it does not change simulation state/results.

With the M4c manifest: **20/30 emerged by 320 kyr; 9/30 censored pending; 1/30 true no-lineage; 0/30 errors**. Both absent categories remain in N.

## Attainment counts

| Scenario | E3 | E4 | E5+ | Multi-body | M4c pending / true no-lineage |
|---|---|---|---|---|---|
| crowded-domain | 30 → 30 | 30 → 30 | 18 → 17 | 11 → 11 | 0 / 0 |
| doomed-star | 30 → 30 | 5 → 22 | 0 → 4 | 0 → 5 | 0 / 0 |
| forager-future | 26 → 26 | 24 → 24 | 7 → 7 | 10 → 14 | 0 / 0 |
| harsh-anoxic | 10 → 5 | 7 → 4 | 2 → 0 | 4 → 1 | 0 / 0 |
| high-perils | 30 → 30 | 11 → 0 | 0 → 0 | 0 → 0 | 0 / 0 |
| lonely-earthlike | 15 → 19 | 13 → 19 | 5 → 4 | 7 → 8 | 9 / 1 |

## Outcome classes (seeds containing each class)

| Scenario | M4b | M4c |
|---|---|---|
| crowded-domain | COLLAPSED_RECOVERING=24, EXISTENTIAL_CAP=17, EXTANT_MULTI_BODY=3, EXTANT_PLANETARY=26, EXTINCT_NATURAL=3, EXTINCT_SELF=12 | COLLAPSED_RECOVERING=21, EXISTENTIAL_CAP=19, EXTANT_MULTI_BODY=5, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=26, EXTINCT_NATURAL=3, EXTINCT_SELF=10 |
| doomed-star | EXTINCT_STELLAR=30 | EXTANT_MULTI_BODY=1, EXTINCT_NATURAL=4, EXTINCT_SELF=2, EXTINCT_STELLAR=23 |
| forager-future | COLLAPSED_RECOVERING=8, EXISTENTIAL_CAP=6, EXTANT_MULTI_BODY=1, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=5, EXTINCT_NATURAL=1, EXTINCT_SELF=7 | COLLAPSED_RECOVERING=7, EXISTENTIAL_CAP=11, EXTANT_MULTI_BODY=2, EXTANT_MULTI_SYSTEM=3, EXTANT_PLANETARY=4, EXTINCT_NATURAL=1, EXTINCT_SELF=2 |
| harsh-anoxic | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=1, EXTANT_MULTI_BODY=3, EXTANT_PLANETARY=21, EXTINCT_SELF=1 | COLLAPSED_RECOVERING=2, EXISTENTIAL_CAP=1, EXTANT_MULTI_BODY=1, EXTANT_PLANETARY=26 |
| high-perils | COLLAPSED_RECOVERING=19, EXISTENTIAL_CAP=5, EXTANT_PLANETARY=5, EXTINCT_SELF=1 | COLLAPSED_RECOVERING=30 |
| lonely-earthlike | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=4, EXTANT_MULTI_SYSTEM=4, EXTANT_PLANETARY=5, EXTINCT_SELF=2, NO_LINEAGE=11 | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=8, EXTANT_MULTI_BODY=1, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=2, EXTINCT_NATURAL=1, EXTINCT_SELF=3, NO_LINEAGE=1, PENDING_ORIGIN=9 |

## Lineage extinction events

| Scenario | M4b | M4c |
|---|---|---|
| crowded-domain | EXTINCT_NATURAL=3, EXTINCT_SELF=15 | EXTINCT_NATURAL=3, EXTINCT_SELF=12 |
| doomed-star | EXTINCT_STELLAR=30 | EXTINCT_NATURAL=4, EXTINCT_SELF=2, EXTINCT_STELLAR=23 |
| forager-future | EXTINCT_NATURAL=1, EXTINCT_SELF=7 | EXTINCT_NATURAL=1, EXTINCT_SELF=2 |
| harsh-anoxic | EXTINCT_SELF=1 | none |
| high-perils | EXTINCT_SELF=1 | none |
| lonely-earthlike | EXTINCT_SELF=2 | EXTINCT_NATURAL=1, EXTINCT_SELF=3 |

## B2: generic collapse and late activity

The former four-recovery exclusion was permanent generic-collapse immunity. M4c divides each stress/overhead hazard term by 1+min(4,recoveries), with integer flooring; positive overhead remains. Recoveries enter the cache key and provenance. Counts below are per seed, not per region; separate perils-collapse counts remain in JSON.

| Scenario | Pre-M4 collapse median/max | M4b → M4c median/max | Late accepted P events M4b → M4c | M4c seeds with late activity |
|---|---|---|---|---|
| crowded-domain | 26/48 | 14/21 → 11/18 | 5275 → 6057 | 15/30 |
| doomed-star | 3/13 | 0/1 → 1/5 | 0 → 779 | 5/30 |
| forager-future | — | 10/65 → 10/77 | 22356 → 35583 | 11/30 |
| harsh-anoxic | 1/13 | 0/5 → 0/3 | 247 → 0 | 0/30 |
| high-perils | 35/301 | 15/26 → 33/88 | 0 → 0 | 0/30 |
| lonely-earthlike | 0/47 | 0/117 → 7/134 | 54851 → 33657 | 4/30 |

## B3: colonisation and targeting

Own-lineage occupancy now permits reinforcement, while target-failure cooldowns still apply. Foreign observations expire to UNKNOWN after 2,000 years from arrival unless refreshed. UNKNOWN is targetable, never known-empty. Undelivered knowledge cannot affect policy. One-shot alien broadcasts remain one-shot; foreign extinctions are not instantaneously known.

| Scenario | Launches | Accepted founding | New colonies | Reinforcements | Lost voyages | Repeated failed-target launches | M4c rejected reasons |
|---|---|---|---|---|---|---|---|
| crowded-domain | 59 → 454 | 59 → 381 | 45 → 35 | 14 → 346 | 0 → 1 | 22 → 168 | occupied-by-other-lineage=62 |
| doomed-star | 0 → 495 | 0 → 494 | 0 → 17 | 0 → 477 | 0 → 1 | 0 → 406 | none |
| forager-future | 129 → 6149 | 128 → 6095 | 83 → 100 | 45 → 5995 | 1 → 25 | 79 → 4390 | none |
| harsh-anoxic | 10 → 1 | 10 → 1 | 10 → 1 | 0 → 0 | 0 → 0 | 2 → 0 | none |
| high-perils | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | none |
| lonely-earthlike | 221 → 4665 | 221 → 4651 | 112 → 99 | 109 → 4552 | 0 → 13 | 167 → 4054 | none |

## B4: authored evacuation window

Before choosing the new doom date, the incoming M4b crowded industrial cohort had E3→E5 p10/median/p90 **4,290/13,120/22,240 years**, conditional on 18/30 attainments. The explicitly versioned `m4c-doomed-star-system.json` and domain set doom to **25,000 years [scenario]**, giving roughly that observed p90 plus margin within the unchanged 30 kyr horizon. E5 era requires Energy≥5, but evacuation on these routes also requires T7; this choice does not guarantee success. No hazard was tuned.

The original `m3b-doomed-star-system.json` and domain remain available as an **unregistered 3,000-year early-doom control**. Its incoming M4b N=30 evidence is 30 EXTINCT_STELLAR, 0 launches, 0 accepted colonies, 0 multi-body. These are historical M4b control numbers, not a new M4c control ensemble. The registered doomed-star now uses only the versioned late fixture.

M4c late-doom N=30: EXTANT_MULTI_BODY=1, EXTINCT_NATURAL=4, EXTINCT_SELF=2, EXTINCT_STELLAR=23; 495 launches, 494 accepted colonies/reinforcements, 5 multi-body histories.

## B5: reserve cliff and colony death ages

The permitted minimal option **keeps the 1,000-year cliff**. It is not fixed by relabelling it as gradual degradation. The ordinary forced founding fixture survives beyond expiry (observed through 2,100 years); an authored zero-growth control fixes inadequate support and produces TECH_LOSS at year 1,030 and EXTINCTION at 1,050 (colony ages 1,020/1,040). Neither behaviour proves general survival.

Diagnostics use accepted COLONY_FOUNDED/FOUNDED arc identities and EXTINCTION event dates. Percentiles condition on deaths; survivors/unfinished arcs are right censored. “Near expiry” means inclusive death age 1,000–1,200 years [scenario]. Across all scenarios, 201 deaths include 61 near expiry. The old JSON did not retain death ages, so there is no fabricated M4b age comparison.

| Scenario | Deaths | Death-age p10 / p50 / p90 (years) | Near expiry | Right-censored colony arcs |
|---|---|---|---|---|
| crowded-domain | 18 | 1040 / 1440 / 10780 | 8 | 17 |
| doomed-star | 15 | 1510 / 4190 / 8130 | 0 | 2 |
| forager-future | 74 | 1040 / 7810 / 22320 | 6 | 26 |
| harsh-anoxic | 0 | None / None / None | 0 | 1 |
| high-perils | 0 | None / None / None | 0 | 0 |
| lonely-earthlike | 94 | 1040 / 1070 / 16990 | 47 | 5 |

## Era durations and authored targets

Target spans [scenario]: E0→E1 1–20 kyr; E1→E3 2–30 kyr; E3→E4 0.3–5 kyr; E4→E5 1–15 kyr; E5→E6 2–30 kyr; E6→E7 2–50 kyr. All M4c duration rows follow, including empty cohorts. L/R/N/P = left/right/true no-lineage/pending. Null means undefined, not zero. Errors are listed in JSON.

| Scenario | Interval | Observed | p10 / p50 / p90 years | L/R/N/P |
|---|---|---|---|---|
| crowded-domain | E0→E1 | 0 | None / None / None | 30/0/0/0 |
| crowded-domain | E1→E3 | 0 | None / None / None | 30/0/0/0 |
| crowded-domain | E3→E4 | 30 | 1030 / 3330 / 9310 | 0/0/0/0 |
| crowded-domain | E4→E5 | 17 | 3420 / 10030 / 12760 | 0/13/0/0 |
| crowded-domain | E5→E6 | 11 | 4200 / 14390 / 20020 | 0/19/0/0 |
| crowded-domain | E6→E7 | 2 | 4590 / 4590 / 4590 | 0/28/0/0 |
| crowded-domain | E3→E5 | 17 | 5530 / 11040 / 18750 | 0/13/0/0 |
| crowded-domain | E3→E7 | 2 | 27320 / 27320 / 27320 | 0/28/0/0 |
| doomed-star | E0→E1 | 0 | None / None / None | 30/0/0/0 |
| doomed-star | E1→E3 | 0 | None / None / None | 30/0/0/0 |
| doomed-star | E3→E4 | 22 | 1460 / 4800 / 17740 | 0/8/0/0 |
| doomed-star | E4→E5 | 4 | 11020 / 14080 / 17880 | 0/26/0/0 |
| doomed-star | E5→E6 | 0 | None / None / None | 0/30/0/0 |
| doomed-star | E6→E7 | 0 | None / None / None | 0/30/0/0 |
| doomed-star | E3→E5 | 4 | 18980 / 19670 / 19870 | 0/26/0/0 |
| doomed-star | E3→E7 | 0 | None / None / None | 0/30/0/0 |
| forager-future | E0→E1 | 30 | 1140 / 8890 / 59410 | 0/0/0/0 |
| forager-future | E1→E3 | 26 | 9440 / 20390 / 52650 | 0/4/0/0 |
| forager-future | E3→E4 | 24 | 1380 / 5020 / 16050 | 0/6/0/0 |
| forager-future | E4→E5 | 7 | 2450 / 6090 / 20680 | 0/23/0/0 |
| forager-future | E5→E6 | 6 | 600 / 12140 / 23110 | 0/24/0/0 |
| forager-future | E6→E7 | 6 | 3810 / 5980 / 12330 | 0/24/0/0 |
| forager-future | E3→E5 | 7 | 4700 / 7890 / 32060 | 0/23/0/0 |
| forager-future | E3→E7 | 6 | 13390 / 25190 / 50500 | 0/24/0/0 |
| harsh-anoxic | E0→E1 | 19 | 1180 / 9400 / 22840 | 0/11/0/0 |
| harsh-anoxic | E1→E3 | 5 | 5680 / 13440 / 18340 | 0/25/0/0 |
| harsh-anoxic | E3→E4 | 4 | 3370 / 3660 / 4010 | 0/26/0/0 |
| harsh-anoxic | E4→E5 | 0 | None / None / None | 0/30/0/0 |
| harsh-anoxic | E5→E6 | 0 | None / None / None | 0/30/0/0 |
| harsh-anoxic | E6→E7 | 0 | None / None / None | 0/30/0/0 |
| harsh-anoxic | E3→E5 | 0 | None / None / None | 0/30/0/0 |
| harsh-anoxic | E3→E7 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E0→E1 | 0 | None / None / None | 30/0/0/0 |
| high-perils | E1→E3 | 0 | None / None / None | 30/0/0/0 |
| high-perils | E3→E4 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E4→E5 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E5→E6 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E6→E7 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E3→E5 | 0 | None / None / None | 0/30/0/0 |
| high-perils | E3→E7 | 0 | None / None / None | 0/30/0/0 |
| lonely-earthlike | E0→E1 | 19 | 2770 / 9470 / 31760 | 0/1/1/9 |
| lonely-earthlike | E1→E3 | 19 | 8600 / 21120 / 77030 | 0/1/1/9 |
| lonely-earthlike | E3→E4 | 19 | 1350 / 4500 / 19230 | 0/1/1/9 |
| lonely-earthlike | E4→E5 | 4 | 7660 / 12680 / 13380 | 0/16/1/9 |
| lonely-earthlike | E5→E6 | 2 | 4160 / 4160 / 4160 | 0/18/1/9 |
| lonely-earthlike | E6→E7 | 2 | 1730 / 1730 / 1730 | 0/18/1/9 |
| lonely-earthlike | E3→E5 | 4 | 11100 / 15940 / 16960 | 0/16/1/9 |
| lonely-earthlike | E3→E7 | 2 | 30600 / 30600 / 30600 | 0/18/1/9 |

## Still implausible / NOT MET

The unchanged four-seed Kremer check is also NOT MET (cold lower median 19,223 versus temperate 37,206 years; existing skip). Refinement-query-order and signatures exceed the two-second individual-file target.

Calibration bands are not all met; conditional observed medians and censor counts above are not population estimates. Thirty seeds give weak tails, especially with sparse late-era attainment. No historical prediction is established.

The far-future addition is only political churn: energy capture remains static within eras. There are no evolving E7 energy stocks, megaprojects, richer post-biological futures, continuous astronomy or resource economics. Existing wars, plagues and natural hazards persist; finite topology and fixed short routes remain.

The reserve cliff remains an acknowledged failure mode. Archives, tools and instruction do not model schools, occupations, spare parts, actual archive degradation or supply chains. Failure beacons and expiring occupancy simplify communication and diplomacy; rejected arrivals still kill passengers under the inherited recipe. Reinforcement can produce large launch counts and does not establish sustainable settlement.

The saturating recovery reduction is an authored abstraction, not four historically justified lessons. It no longer confers immunity, but recovery can still remain active for long intervals without restoring knowledge. Sapience remains an uncalibrated three-hard-step lottery; the E0 fixture starts with 10,000 people rather than reconstructing Earth.

The 30-second compilation budget is NOT MET on this shared machine; see the handoff for the exact final test and timing receipts. No perf:panel or visual review was performed.


Final `npm test` (sole invocation): **147 tests, 146 pass, 0 fail, 1 skipped,
exit 0**, duration 42004.2065 ms. The skip is the unchanged Kremer NOT MET
check. No child-process timeout occurred in the final run.
