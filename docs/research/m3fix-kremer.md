# M3 fix: fixed-panel Kremer investigation

Local code and simulation evidence only; no external research or network.
The predeclared panel is `signature-0` through `signature-15` on each planet,
10,000 years, with identical r00-only initial population 10,000 and seven
tiers at 1. No seeds were replaced. The lower panel median uses 10,001 for
nonattainment; attained-only medians are separately identified.

| Observed quantity | Temperate | Cold archipelago |
|---|---:|---:|
| Lower panel median first E2, years | 4,866 | 9,264 |
| Attained-only lower median, years | 3,751 | 5,990 |
| Nonattainment by 10,000 | 6/16 | 7/16 |
| DIFFUSION opportunity-ticks | 23,251 | 0 |
| Accepted AGRICULTURE / DISCOVERY / DIFFUSION | 6 / 528 / 163 | 0 / 109 / 0 |
| Total accepted tier gains | 697 | 109 |
| Accepted MIGRATION events | 24 | 0 |
| Accepted PLAGUE events (all stages) | 226 | 59 |
| Sum N_eff over living-region ticks | 3,895,877,202 | 82,013,095 |
| Sum local population over those ticks | 2,625,421,292 | 82,013,095 |
| Contact-weighted neighbour contribution | 1,270,455,910 | 0 |
| Living-region tick denominator | 27,511 | 15,628 |

Source: [complete panel](../evidence/m3fix-kremer.json) and
[deterministic audit](../evidence/m3fix-audit.json). Confidence **high** for
these observations. The audit tabulates every accepted kind/domain/target-tier
count; the panel also retains region-resolved counts, gate opportunity counts,
priors and all 32 manifest/recipe/result digests. Full-horizon sums are not
pre-E2 causal effects: rapid development itself raises population and exposure.

The fixtures match their declared contrast: temperate has 12 ring regions,
Kbase 5,000 each (60,000 total), contact 500 without barriers; cold has 10,
Kbase 1,000 each (10,000 total), contact 100 with barriers (effective 25).
Resource vectors are respectively [800,800,500,800] and [500,300,100,300],
domesticables 800,000 and 300,000 ppm. S1 starting capacities are 12,500 and
2,500, so the common initial 10,000 exceeds cold capacity fourfold.
Sources: [temperate](../../fixtures/planets/temperate.json),
[cold](../../fixtures/planets/cold-archipelago.json),
[binding fixture descriptions](../transition-table-v1.md).
Confidence **high**, direct inspection.

[Spec §7](../spec.md) requires contact-weighted N_eff. The
[implementation](../../src/planet.mjs) computes local population plus the
sum of floored contact-weighted neighbour populations; the
[input adapter](../../src/civ-input.mjs) quarters barrier contact. DIFFUSION
uses tier gap times contact. The [gate table](../../src/tech.mjs) is common
to temperate and cold and both resource vectors pass the E2 gates. Thus
there is no identified mismatch to repair. Confidence **high**, code inspection.

Why the four-seed result is insufficient: its medians remain cold 3,981 versus
temperate 4,843, but the fixed larger panel reverses that ordering. The common
starting population initially makes N_eff equal, and different body IDs key
different RNG streams even for equal seed strings. The larger-panel exposure
counts show the intended connectivity contrast actually occurs: cold has no
accepted migration, no neighbour-population contribution and no diffusion;
temperate has all three. Confidence **high** for the observations, **moderate**
for interpreting the small-panel inversion as sample sensitivity. This is not
a counterfactual decomposition of its cause.

Stronger contact also increases plague hazard, and propagation requires
effective contact >=100, excluding cold's 25. More temperate plague events
are observed, but more living-region exposure also occurs. Assigning the
four-seed inversion specifically to plague is **unverified**; these totals
cannot isolate that effect. Source: [planet solver](../../src/planet.mjs),
[binding plague rule](../transition-table-v1.md), and the panel above.

Decision: no fixture, prior, solver or golden changes. The original four-seed
signature remains **NOT MET**, skipped with its real medians. The additional
16-seed direction is **MET**, without replacing the regression test or treating
either panel as empirical validation.
