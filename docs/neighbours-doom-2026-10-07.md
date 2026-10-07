# Doomed-star: the neighbouring worlds die with the star (2026-10-07)

Branch `scenario/neighbours-doom`, based on `main` at 3dbbb4e. Astra
(gpt-6-astra, workspace-write) made the edits; Opus reviewed the diff, ran the
checks and committed.

## Decision

Kasper (2026-10-07): the most natural reading is that the neighbouring worlds
die with the star. This closes the "fixture caveat" in
[M5 round 2 part (c)](m5-round2-2026-10-07.md). Before this change, the
companions of the doomed star in `fixtures/planets/m4c-doomed-star-system.json`
(`stub:s00:b1`, `stub:s00:b2`, habitat-buildable, and `stub:s00:b3`, barren) had
`stellarDoomYear: null`, so they outlived their own star.

**Future item, not modelled now:** an advanced civilisation might survive the
death of its star, for example in self-sufficient habitats or interstellar arks.
That capability is not modelled, and this change deliberately does not model it.

## What changed

| File | Change |
|---|---|
| `fixtures/planets/m4c-doomed-star-system.json` | `stellarDoomYear` null → 25000 for b1, b2 and b3; each lifecycle digest `85f107b6…face` → `ae80671a…b329`. Nothing else in the file changed. |
| `tools/build-m5-neighbours-doom.mjs` | Reproducible builder. It takes the system's star doom from the bodies' unique non-null `stellarDoomYear` (it throws on zero or several values) and sets it on every body through `Availability.known`. Re-running it is a no-op (checked: no diff after a second run). |
| `tests/m5-resurvey.test.mjs` | The doomed-star map now expects b0, b1 and b2 to have the interval [25,500, 30,000). All intervals are still absorbing. b3 is barren, so it is not a habitable or habitat route destination. |
| `tests/m5-neighbours-doom.test.mjs` (new, 2 tests) | (a) Every s00 body shares the home doom and has a correct lifecycle digest. (b) A fixture-wide guard: in every `civ-system-stub-1` fixture, stellar doom is the same on all bodies. The only exemption is the legacy 3,000-year control `m3b-doomed-star-system.json`, and a negative self-check shows the guard fails on it. (c) b1 and b2 are habitable at years 24,990, 25,000 and 25,490 and uninhabitable at 25,500. At 25,500 the only routes from any s00 body to a habitable destination are interstellar, tier 7 only. |

**Derived, not hard-coded.** `habitableUntilYear` was not touched. The
uninhabitable time comes from the existing stellar model: `uninhabitableAt`
(`src/domain.mjs`) and the STELLAR_DOOM handling in `stepPlanet`
(`src/planet.mjs`) use doom plus `parameters.stellarGraceYears` (500), which is
25,500. `src/` is unchanged.

**Not changed:**
- `m3b-doomed-star-system.json`, the 3,000-year control used by
  `tests/stellar-grace.test.mjs`. Its companions still have null doom. The guard
  lists it as the only exemption, so making the two fixtures agree is a separate,
  small follow-up.
- `docs/evidence/*`, which are historical records.

## Digests: only doomed-star moved

`tools/digest-capture.sh` ran at concurrency 1:
- before: on the `main` checkout at 3dbbb4e;
- after: on the branch worktree.

| Capture | sha256 |
|---|---|
| before | `364b9663323099c5741d5d19a9a5b24f1c1e1bc4ea755aebbfb1fc0429507149`, the same as rounds 1 and 2 |
| after | `f94c1c042ae5262dee23d151ff423dbc9cd3df2e6557ade8b1ac8f48d9e75c4e` |

`diff before after` has five hunks: `294,295c`, `300d`, `301a`, `303,331c` and
`333,336c`. All of them fall inside the `--scenario doomed-star --seed
doomed-star-0` block, which is lines 293–337 of the before file. Everything
else is byte-identical:
- the M1 toy;
- the three `--civ` planets and the temperate narrative;
- the three toy-12 runs;
- crowded-domain-0 and crowded-domain-1;
- high-perils-0;
- lonely-earthlike s1;
- forager-future-0;
- the signatures Kremer panel.

| doomed-star-0 | Before | After |
|---|---|---|
| Manifest | `e5bd4073…3303` | `af7f025f…bdf4` |
| Recipe | `3f0f31a3…041e` | `f0cfd19e…fe95` |
| Result | `63888785…ff0e` | `32f3e3db…860c` |
| Narrative | `3578ba3f…e9da` | `b88c9ca3…5078` |
| Summary | EXTINCT_STELLAR, maximum era E4 (12,620), extinction at 25,500 | EXTINCT_STELLAR, maximum era E3, extinction at 25,000 |

**The whole doomed-star history is redrawn, not only the part after 25,000.**
RNG addresses are keyed by the manifest digest, and the manifest contains the
`inputBundleDigest` of the domain's systems. So any fixture change re-seeds
every variate of the scenario. This is the intended, provenance-correct
behaviour: a different universe gets different variates. The after run is
therefore not a matched-variate comparison. Seed 0 now stays at E3, and with
E < 5 the doom kills at 25,000 itself without an evacuation window. That is
existing model behaviour (`planet.mjs` line 601), not something this change
causes.

## Tests

`npm test` (Node v24.7.0, `--test-concurrency=1`) gave **178 tests, 178 pass,
0 fail, 0 skipped**, in 27.1 s. That is 176 before plus the 2 new tests. No
other test pinned doomed-star results. Astra's own run also gave 178/178, and
its three focused files took 0.48 s.

## Starvation re-check (10,000-year `uninhabitable` resurvey)

This section uses code reading and the interval test only. No simulation was
run for it.

- **Every window is still absorbing.** Each reachable uninhabitable interval in
  every domain scenario runs to the horizon. In doomed-star these are b0, b1 and
  b2, each [25,500, 30,000). The round 2 theorem still holds: a launch
  suppressed by delivered `uninhabitable` knowledge would itself be rejected on
  arrival. So the resurvey cannot starve colonisation.
- **Which launches are newly rejectable.**
  - Launches to b1 can come only from b0 or b2, and launches to b2 only from b0
    or b1. Barren b3 has routes but no origin and no viable colony, so it never
    launches.
  - These launches need transport tier 5, 6 or 7 and Energy and Biotech ≥ 5.
    They take 20, 5 or 1 years.
  - Every possible launcher dies at 25,500. So only voyages already in transit
    can arrive and be rejected. No surviving arc routes to b1 or b2 (the
    s01/s02 routes reach only s00:b0), so the resulting failure memories cannot
    suppress any useful launch.
- **The real evacuation targets are never suppressed.** `s01:b0` and `s02:b0`
  never become uninhabitable within the horizon. The resurvey can still suppress
  futile tier-7 returns from s01 to the dead s00:b0, as before.
- **The 10,000-year length is moot here.** The decision to keep 10,000 years
  stands, and the guard test remains the tripwire.

## Evacuation mechanics after the change (not altered)

From `src/planet.mjs` and `src/m2b.mjs`, confirmed by Astra and by Opus.

- **Doom with E ≥ 5.** At doom (25,000) a home arc with E ≥ 5 sets
  `evacuating`. Otherwise it takes a 1,000‰ loss at once.
- **Targeting ignores the destination's doom.** `routesFor` does not check
  whether the destination is doomed.
  - During the grace window [25,000, 25,500), evacuation launches can still
    pick b1 or b2.
  - Those launches are accepted if they arrive before 25,500. They found or
    reinforce a colony, which then dies at 25,500 through the `expired` branch,
    taking the same 1,000‰ loss.
  - Arrivals at or after 25,500 are rejected as `destination-uninhabitable`.
- **Which targets save anyone.** Only interstellar launches to s01:b0 save
  anyone, and they need transport tier 7. There is no direct route from the home
  system to s02.
- **Split at tier 7.** A tier-7 home launcher picks among b1 (weight 200),
  b2 (200) and s01:b0 (1000). So **2/7 of its evacuation launches are wasted**
  on doomed habitats. `weightedPick` chooses a destination per launch; it does
  not split passengers.
- **Open decision, not for this change.** Should evacuation targeting know that
  the destinations share the doomed star? Excluding same-star bodies once the
  doom is observed would change model semantics for every doomed fixture. It
  needs a manifest/version entry and a decision from Kasper or the Opus advisor.

## Outcomes against the recorded results (no ensembles run)

The M4d record `docs/evidence/m4-plausibility-after.json` covers doomed-star
with N=30 and the policy off. The variates now differ (see above), so the
following is a **counterfactual on the recorded histories**. It is not a
prediction of the new ensemble.

Recorded outcome classes:

| Class | Runs |
|---|---|
| EXTINCT_STELLAR | 23 |
| EXTINCT_NATURAL | 2 |
| EXTINCT_SELF | 2 |
| EXISTENTIAL_CAP | 1 |
| EXTANT_PLANETARY | 1 |
| EXTANT_MULTI_SYSTEM | 1 |

Transport tier 7 is visible as era 6 (E ≥ 5 and T ≥ 7). Only one run reached it.

| Seed | Recorded outcome | Tier 7? | Under the new fixture |
|---|---|---|---|
| doomed-star-4 | EXISTENTIAL_CAP; multi-body; E5 at 12,490 | never | Its survivors lived only in s00, so the run becomes **EXTINCT_STELLAR** at 25,500 at the latest. |
| doomed-star-12 | EXTANT_PLANETARY; multi-body; E5 at 14,520; 2 `destination-uninhabitable` rejections | never | Becomes **EXTINCT_STELLAR**. Its two recorded rejections were launches back to the dead home world from companion colonies, and those colonies now die at 25,500 too. |
| doomed-star-18 | EXTANT_MULTI_SYSTEM; tier 7 at 24,040 | yes | Its interstellar colony is unaffected. It stays **EXTANT_MULTI_SYSTEM**, and its companion arcs die. |
| 14, 15 (NATURAL); 23, 24 (SELF) | already extinct | — | The record does not give the extinction year. So whether doom would have come first is **not computable** from the record. |
| the 23 EXTINCT_STELLAR runs | — | — | Unchanged |

Counterfactual totals:

| Class | Recorded | Counterfactual |
|---|---|---|
| EXTINCT_STELLAR | 23 | 25 |
| EXISTENTIAL_CAP | 1 | 0 |
| EXTANT_PLANETARY | 1 | 0 |
| EXTANT_MULTI_SYSTEM | 1 | 1 |

That is 1/30 runs alive at the horizon instead of 3/30. The four other
extinctions keep their class, unless one of them happened after 25,000, which
cannot be checked from the record. Only the tier-7 run survives. This is
consistent with "evacuation only has interstellar targets".

## Consequences for the round 2 measurement commands

These parts of [M5 round 2](m5-round2-2026-10-07.md#measurement-commands-for-the-quiet-window)
no longer hold:

- **Step 1 control.** `cmp out/m5r2-plaus-off.json
  docs/evidence/m4-plausibility-after.json` no longer applies on this branch or
  on a `main` that includes it. The doomed-star block is expected to differ,
  including its `{"destination-uninhabitable":2}`. Every other scenario should
  still match. Either run the control on 3dbbb4e, or compare per scenario.
- **Step 4.** The doomed-star ensemble no longer matches the efeeb37 output.
- **New measurement for the quiet window.** Re-run the doomed-star 30-seed
  audit, then record the new outcome classes and how many evacuation launches
  went to b1 or b2 during the grace window.

## Not done

- No perf, ensemble or plausibility runs.
- Survival of stellar death by advanced civilisations (habitats, arks): a
  future item.
- Evacuation targeting that knows about the doom: open decision, see above.
- Bringing the m3b 3,000-year control fixture into agreement: a follow-up.
