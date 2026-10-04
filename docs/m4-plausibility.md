# M4d plausibility audit — 2026-10-04

These are authored scenarios and model attribution, not predictions. Numerical choices are **[scenario]**. Local evidence has high confidence as a record of these runs, not as a forecast; no new research or historical calibration claim is made.

## Method and receipts

`node tools/m4-plausibility.mjs --n 30 --jobs 4 --out docs/evidence/m4-plausibility-after.json` completed 180 seeds, with 0 simulation errors. 13/180 compiles exceeded 30 seconds; maximum 108,894.91 ms; observed tool exit **1**. Timings are in out/m4d-ensemble.txt and the [handoff](m4-implementation.md#m4d--lineage-support-network).

[Pre-M4 JSON](evidence/m4-plausibility-before.json), [M4c JSON](evidence/m4c-plausibility-after.json) and [M4c text](evidence/m4c-plausibility-after.txt) are preserved. [M4d JSON](evidence/m4-plausibility-after.json) and [text](evidence/m4-plausibility-after.txt) contain all new seed results and digests.

Tables compare M4c → M4d unless labelled otherwise. The binding contract changes the manifest/RNG namespace: matching seed names do not preserve variates, so these comparisons do not isolate one causal mechanism. Pre-M4 also used a different lonely horizon and early doomed-star lifecycle; forager-future did not exist.

Quantiles are sorted[floor((n−1)×p/100)], without interpolation. All fractions retain N=30. Outcome classes can overlap across lineages. Multi-body means ever inhabited at least two bodies, not simultaneous survival. Era durations condition on observed attainment; left/right/true no-lineage/pending/error categories retain censoring. Repeat-failure targeting is measured omnisciently by the diagnostic only; decisions use delivered knowledge.

## Lineage support and colony survival

At founding and every 100 years, living arcs send own-lineage STATUS reports over declared routes at light speed. Delivered reports contribute 100‰ of qualifying populations to per-domain tier maintenance. Freshness lasts 300 years plus route delay from report year. These authored choices approximate remote knowledge contact, not supplies, labour, specialist occupations or invention. The 1,000-year archive remains a bridge. Silence removes network support after freshness expires.

The zero-growth fixture now survives beyond 2,000 years with a sufficiently populous, reporting parent. Continuing that exact colony without new reports yields TECH_LOSS after staleness and then habitat extinction. A disconnected destination receives no STATUS, and queued reports supply no support. The old unsupported zero-growth fixture still loses tiers at colony age 1,020 and dies at age 1,040. This is conditional support, not guaranteed sustainability.

Colony death ages use accepted FOUNDED arc identities and EXTINCTION dates. Percentiles condition on deaths; surviving/unfinished arcs are right censored. Near expiry means inclusive ages 1,000–1,200 years. Pre-M4 did not record death ages or censor counts: “unrecorded” is not zero.

| Scenario | Deaths pre-M4 → M4c → M4d | Death age p10/p50/p90 pre-M4 → M4c → M4d | Near expiry pre-M4 → M4c → M4d | Right censored M4c → M4d |
|---|---|---|---|---|
| crowded-domain | unrecorded → 18 → 15 | unrecorded → 1040/1440/10780 → 650/3370/11020 | unrecorded → 8 → 2 | 17 → 12 |
| doomed-star | unrecorded → 15 → 12 | unrecorded → 1510/4190/8130 → 1760/5650/9110 | unrecorded → 0 → 1 | 2 → 5 |
| forager-future | unrecorded → 74 → 89 | unrecorded → 1040/7810/22320 → 1610/8560/23590 | unrecorded → 6 → 2 | 26 → 17 |
| harsh-anoxic | unrecorded → 0 → 0 | unrecorded → None/None/None → None/None/None | unrecorded → 0 → 0 | 1 → 1 |
| high-perils | unrecorded → 0 → 0 | unrecorded → None/None/None → None/None/None | unrecorded → 0 → 0 | 0 → 0 |
| lonely-earthlike | unrecorded → 94 → 59 | unrecorded → 1040/1070/16990 → 3120/9560/26250 | unrecorded → 47 → 0 | 5 → 9 |

Across all scenarios, M4c → M4d deaths: 201 → 175; near-expiry deaths: 61 → 5.

## Colonisation and repeated failed targets

Own-lineage occupancy permits reinforcement; foreign occupancy and failure cooldowns use delivered observations. Repeated launch counts include attempts after any earlier failure at the target, even if later reinforcement succeeds. They are not a count of repeated deaths.

| Scenario | Launches pre-M4 → M4c → M4d | Repeated failed-target launches pre-M4 → M4c → M4d | New colonies M4c → M4d | Reinforcements M4c → M4d | Lost voyages M4c → M4d |
|---|---|---|---|---|---|
| crowded-domain | 7975 → 454 → 339 | 5597 → 168 → 106 | 35 → 27 | 346 → 273 | 1 → 2 |
| doomed-star | 1373 → 495 → 406 | 349 → 406 → 223 | 17 → 17 | 477 → 386 | 1 → 1 |
| forager-future | absent → 6149 → 4814 | absent → 4390 → 3207 | 100 → 106 | 5995 → 4673 | 25 → 17 |
| harsh-anoxic | 684 → 1 → 1 | 209 → 0 → 0 | 1 → 1 | 0 → 0 | 0 → 0 |
| high-perils | 1 → 0 → 0 | 0 → 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| lonely-earthlike | 1007 → 4665 → 5329 | 409 → 4054 → 4376 | 99 → 68 | 4552 → 5241 | 13 → 17 |

## Attainment counts

| Scenario | E3 | E4 | E5+ | Multi-body | M4d pending / true no-lineage |
|---|---|---|---|---|---|
| crowded-domain | 30 → 30 | 30 → 30 | 17 → 10 | 11 → 10 | 0 / 0 |
| doomed-star | 30 → 30 | 22 → 20 | 4 → 4 | 5 → 6 | 0 / 0 |
| forager-future | 26 → 28 | 24 → 26 | 7 → 8 | 14 → 13 | 0 / 0 |
| harsh-anoxic | 5 → 5 | 4 → 3 | 0 → 0 | 1 → 1 | 0 / 0 |
| high-perils | 30 → 30 | 0 → 0 | 0 → 0 | 0 → 0 | 0 / 0 |
| lonely-earthlike | 19 → 15 | 19 → 15 | 4 → 4 | 8 → 5 | 10 / 4 |

## Outcome classes (seeds containing each class)

| Scenario | M4c | M4d |
|---|---|---|
| crowded-domain | COLLAPSED_RECOVERING=21, EXISTENTIAL_CAP=19, EXTANT_MULTI_BODY=5, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=26, EXTINCT_NATURAL=3, EXTINCT_SELF=10 | COLLAPSED_RECOVERING=20, EXISTENTIAL_CAP=18, EXTANT_MULTI_BODY=3, EXTANT_MULTI_SYSTEM=3, EXTANT_PLANETARY=24, EXTINCT_NATURAL=6, EXTINCT_SELF=10 |
| doomed-star | EXTANT_MULTI_BODY=1, EXTINCT_NATURAL=4, EXTINCT_SELF=2, EXTINCT_STELLAR=23 | EXISTENTIAL_CAP=1, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=1, EXTINCT_NATURAL=2, EXTINCT_SELF=2, EXTINCT_STELLAR=23 |
| forager-future | COLLAPSED_RECOVERING=7, EXISTENTIAL_CAP=11, EXTANT_MULTI_BODY=2, EXTANT_MULTI_SYSTEM=3, EXTANT_PLANETARY=4, EXTINCT_NATURAL=1, EXTINCT_SELF=2 | COLLAPSED_RECOVERING=11, EXISTENTIAL_CAP=11, EXTANT_MULTI_SYSTEM=2, EXTANT_PLANETARY=3, EXTINCT_SELF=3 |
| harsh-anoxic | COLLAPSED_RECOVERING=2, EXISTENTIAL_CAP=1, EXTANT_MULTI_BODY=1, EXTANT_PLANETARY=26 | COLLAPSED_RECOVERING=1, EXISTENTIAL_CAP=1, EXTANT_MULTI_BODY=1, EXTANT_PLANETARY=27 |
| high-perils | COLLAPSED_RECOVERING=30 | COLLAPSED_RECOVERING=30 |
| lonely-earthlike | COLLAPSED_RECOVERING=4, EXISTENTIAL_CAP=8, EXTANT_MULTI_BODY=1, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=2, EXTINCT_NATURAL=1, EXTINCT_SELF=3, NO_LINEAGE=1, PENDING_ORIGIN=9 | EXISTENTIAL_CAP=6, EXTANT_MULTI_BODY=3, EXTANT_MULTI_SYSTEM=1, EXTANT_PLANETARY=2, EXTINCT_SELF=4, NO_LINEAGE=4, PENDING_ORIGIN=10 |

## Lineage extinction events

| Scenario | M4c | M4d |
|---|---|---|
| crowded-domain | EXTINCT_NATURAL=3, EXTINCT_SELF=12 | EXTINCT_NATURAL=6, EXTINCT_SELF=11 |
| doomed-star | EXTINCT_NATURAL=4, EXTINCT_SELF=2, EXTINCT_STELLAR=23 | EXTINCT_NATURAL=2, EXTINCT_SELF=2, EXTINCT_STELLAR=23 |
| forager-future | EXTINCT_NATURAL=1, EXTINCT_SELF=2 | EXTINCT_SELF=3 |
| harsh-anoxic | none | none |
| high-perils | none | none |
| lonely-earthlike | EXTINCT_NATURAL=1, EXTINCT_SELF=3 | EXTINCT_SELF=4 |

## Generic collapse and late activity

M4c’s recovery-dependent hazard reduction remains: each generic-collapse term is divided by 1+min(4,recoveries), retaining positive overhead exposure. No immunity is added. Late activity counts accepted P events in the final half of the horizon with exact pre-state perils=exited.

| Scenario | Pre-M4 collapse median/max | M4c → M4d median/max | Late accepted P events M4c → M4d | M4d seeds with late activity |
|---|---|---|---|---|
| crowded-domain | 26/48 | 11/18 → 9/17 | 6057 → 2781 | 10/30 |
| doomed-star | 3/13 | 1/5 → 2/7 | 779 → 753 | 2/30 |
| forager-future | absent | 10/77 → 12/63 | 35583 → 30267 | 10/30 |
| harsh-anoxic | 1/13 | 0/3 → 0/4 | 0 → 0 | 0/30 |
| high-perils | 35/301 | 33/88 → 23/54 | 0 → 0 | 0/30 |
| lonely-earthlike | 0/47 | 7/134 → 0/118 | 33657 → 21936 | 4/30 |

## Authored evacuation window

The registered doomed-star still uses the M4c versioned 25,000-year doom fixture, within a 30 kyr horizon. The early 3,000-year M3b fixture remains an unregistered control. M4d does not alter that lifecycle or tune hazards. STATUS cannot indefinitely preserve knowledge after the homeworld stops reporting.

## Era durations and authored targets

Target spans [scenario]: E0→E1 1–20 kyr; E1→E3 2–30 kyr; E3→E4 0.3–5 kyr; E4→E5 1–15 kyr; E5→E6 2–30 kyr; E6→E7 2–50 kyr. All M4d rows follow. L/R/N/P = left/right/true no-lineage/pending; None is undefined, not zero. Errors and source-not-reached counts are in JSON.

| Scenario | Interval | Observed | p10/p50/p90 years | L/R/N/P |
|---|---|---|---|---|
| crowded-domain | E0→E1 | 0 | None/None/None | 30/0/0/0 |
| crowded-domain | E1→E3 | 0 | None/None/None | 30/0/0/0 |
| crowded-domain | E3→E4 | 30 | 1000/2800/13300 | 0/0/0/0 |
| crowded-domain | E4→E5 | 10 | 1880/11620/17560 | 0/20/0/0 |
| crowded-domain | E5→E6 | 7 | 2510/8970/13940 | 0/23/0/0 |
| crowded-domain | E6→E7 | 2 | 5980/5980/5980 | 0/28/0/0 |
| crowded-domain | E3→E5 | 10 | 2880/13390/21150 | 0/20/0/0 |
| crowded-domain | E3→E7 | 2 | 11370/11370/11370 | 0/28/0/0 |
| doomed-star | E0→E1 | 0 | None/None/None | 30/0/0/0 |
| doomed-star | E1→E3 | 0 | None/None/None | 30/0/0/0 |
| doomed-star | E3→E4 | 20 | 2010/4380/12220 | 0/10/0/0 |
| doomed-star | E4→E5 | 4 | 9230/10480/11210 | 0/26/0/0 |
| doomed-star | E5→E6 | 1 | 11450/11450/11450 | 0/29/0/0 |
| doomed-star | E6→E7 | 0 | None/None/None | 0/30/0/0 |
| doomed-star | E3→E5 | 4 | 12490/12590/14520 | 0/26/0/0 |
| doomed-star | E3→E7 | 0 | None/None/None | 0/30/0/0 |
| forager-future | E0→E1 | 30 | 1060/5480/26900 | 0/0/0/0 |
| forager-future | E1→E3 | 28 | 6720/24710/72410 | 0/2/0/0 |
| forager-future | E3→E4 | 26 | 1190/4670/12600 | 0/4/0/0 |
| forager-future | E4→E5 | 8 | 9910/13930/22280 | 0/22/0/0 |
| forager-future | E5→E6 | 7 | 480/17730/30100 | 0/23/0/0 |
| forager-future | E6→E7 | 6 | 1110/7550/17070 | 0/24/0/0 |
| forager-future | E3→E5 | 8 | 10740/19250/24380 | 0/22/0/0 |
| forager-future | E3→E7 | 6 | 20460/44070/75120 | 0/24/0/0 |
| harsh-anoxic | E0→E1 | 21 | 910/9020/16030 | 0/9/0/0 |
| harsh-anoxic | E1→E3 | 5 | 7490/17360/22520 | 0/25/0/0 |
| harsh-anoxic | E3→E4 | 3 | 3610/3660/3660 | 0/27/0/0 |
| harsh-anoxic | E4→E5 | 0 | None/None/None | 0/30/0/0 |
| harsh-anoxic | E5→E6 | 0 | None/None/None | 0/30/0/0 |
| harsh-anoxic | E6→E7 | 0 | None/None/None | 0/30/0/0 |
| harsh-anoxic | E3→E5 | 0 | None/None/None | 0/30/0/0 |
| harsh-anoxic | E3→E7 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E0→E1 | 0 | None/None/None | 30/0/0/0 |
| high-perils | E1→E3 | 0 | None/None/None | 30/0/0/0 |
| high-perils | E3→E4 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E4→E5 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E5→E6 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E6→E7 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E3→E5 | 0 | None/None/None | 0/30/0/0 |
| high-perils | E3→E7 | 0 | None/None/None | 0/30/0/0 |
| lonely-earthlike | E0→E1 | 16 | 5810/17070/40210 | 0/0/4/10 |
| lonely-earthlike | E1→E3 | 15 | 20440/37480/61510 | 0/1/4/10 |
| lonely-earthlike | E3→E4 | 15 | 1700/9310/21690 | 0/1/4/10 |
| lonely-earthlike | E4→E5 | 4 | 17100/20150/49370 | 0/12/4/10 |
| lonely-earthlike | E5→E6 | 1 | 27430/27430/27430 | 0/15/4/10 |
| lonely-earthlike | E6→E7 | 1 | 82590/82590/82590 | 0/15/4/10 |
| lonely-earthlike | E3→E5 | 4 | 26410/37390/71060 | 0/12/4/10 |
| lonely-earthlike | E3→E7 | 1 | 136430/136430/136430 | 0/15/4/10 |

## Still implausible / NOT MET

Connected maintenance fixes the demonstrated unsupported-colony mechanism only when sufficient qualified knowledge arrives. Near-reserve deaths and repeated failed-target launches remain measured above; neither zero colony mortality nor universal sustainability is an acceptance claim. The retained reserve can still produce an expiry cliff for isolated, weakly supported or damaged colonies.

Population-weighted maximum reported tier can overstate the specialists available to teach each technology. Static routes, automatic reports, guaranteed failure beacons, hard freshness cutoffs and coarse occupancy memory simplify communication. No schools, actual archives, spare parts, material supply chains or changing communications infrastructure are simulated. Reinforcement can produce large launch counts; rejected arrivals still kill passengers.

Calibration bands are not all met. Conditional medians are not population estimates, and N=30 gives weak tails. The uncalibrated hard-step origin lottery and recovery abstraction remain. Far future still means political churn with static within-era energy capture, not evolving E7 energy stocks, megaprojects or resource economics.

The 30-second compile target is NOT MET: 13/180 runs. The final colony file passes 7/7 in 532.8933 ms alone; signatures takes 7158.5673 ms and misses the two-second target. The unchanged Kremer panel now passes (cold lower median 36,373 > temperate 27,598 years). Final `npm test` (exactly one invocation): **151 tests, 151 pass, 0 fail, 0 skipped; exit 0**, 26582.8859 ms. Neither specified child-process test timed out; no conditional rerun was needed. No perf:panel or visual review was run.
