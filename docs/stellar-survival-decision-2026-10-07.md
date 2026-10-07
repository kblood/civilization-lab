# Stellar survival: later-doomed refuges and advanced-civilisation survival (2026-10-07)

**Decided by Fable 5.1 on Kasper's instruction; overrulable.** Opus recorded it.
This is a decision record only: `src/`, `fixtures/`, the manifest and
`docs/transition-table-v1.md` are unchanged, and no digest moves. It closes the
two open items left by [evacuation-doom](evacuation-doom-2026-10-07.md)
("later-doomed refuge" and "habitats/arks"), which follows
[neighbours-doom](neighbours-doom-2026-10-07.md).

The rule in force stays `m5-stellar-2`: from the year a body's star doom occurs,
no launcher on that body targets a destination whose star dies no later than its
own.

## (a) Later-doomed destinations: full weight, no weighting

A destination whose star dies **later** than the launcher's stays an allowed
refuge at full weight. No weighting is added.

Reasons:

- No fixture exercises it. Within a system all bodies share the star's doom
  (`tests/m5-neighbours-doom.test.mjs` guards every `civ-system-stub-1`
  fixture), and in doomed-star the only interstellar refuge, `stub:s01:b0`,
  is never doomed.
- A weight would need a `stellarPolicy` bump and a third redraw of the
  doomed-star history, for zero observable effect.
- Stepping-stone refuges are legitimately valuable: a world that dies later
  still buys time and a further launch.

**The only exact refinement is a feasibility cut**, deferred into the next bump
`m5-stellar-3`: exclude a destination whose earliest arrival is already past its
doom-end,

```js
Number(pre.tick*10n) + travelYears >= dest.stellarDoomYear + grace
```

Such a voyage can only be rejected on arrival (`destination-uninhabitable`), so
the cut changes no outcome except that the launch is not wasted. It is not done
now because it needs the same manifest bump as (b).

## (b) Advanced-civilisation survival: explicitly deferred

Surviving the death of one's star (self-sufficient habitats, arks) is **not
modelled** and is deferred.

Evidence: in `docs/evidence/m4-plausibility-after.json`, **0/30** doomed-star
seeds reached E7 (Energy tier 6, "stellar collection") by 30,000, while
crowded-domain (2/30), forager-future (6/30) and lonely-earthlike (1/30) do.
Doom also has no physical type yet (no remnant, no nova, no red giant), so
there is nothing for a capability to be conditional on.

**Trigger** (any one of these reopens it):

1. the doomed-star ensemble shows at least one seed with
   `firstEnergy[6] < 25,000` (the audit tool `tools/m5-doomed-star-audit.mjs`
   reports this as its trigger metric);
2. Atlas supplies a doom or remnant type;
3. Kasper asks for it as a narrative capability.

**Design when triggered** (`m5-stellar-3`):

- Self-sufficient habitat survival: at doom-end a region survives iff
  `r.tiers[0] >= 6 && r.tiers[1] >= 5`.
- After doom-end, `Kbase` is 0 unless the region meets that gate.
- A surviving arc gets `evacuating` cleared.
- `m5-stellar-2` becomes conditional: qualifying launchers may target
  same-doom bodies.
- Arrivals at a dead body stay rejected.
- Manifest block:

  ```js
  {version:'m5-stellar-3', graceYears,
   doomedDestinations:'excluded-from-own-doom-year-unless-launcher-self-sufficient',
   laterDoomed:'excluded-if-earliest-arrival-at-or-after-destination-doom-end',
   survival:{energyTier:6, subsistenceTier:5}}
  ```

**Rejected alternatives:** starlifting or doom delay; routeless generation
ships; a new event kind.

## What this changes

Nothing in the model. The README status paragraph points here, and the two open
items in [evacuation-doom](evacuation-doom-2026-10-07.md) now point here.

## Results: the 30-seed doomed-star ensemble (2026-10-07)

Branch `scenario/doomed-ensemble` from `main` 40c8bd2. This is the run the
audit work left pending (and the "quiet window" measurement named in
[evacuation-doom](evacuation-doom-2026-10-07.md) and
[neighbours-doom](neighbours-doom-2026-10-07.md)). It was run exactly as the
audit tool pre-registers: 30 seeds `doomed-star-0` … `doomed-star-29`, the
scenario's default horizon (30,000), default policies (no targeting or colony
policy opt-in), invariants I1–I8 as coded in `tools/m5-doomed-star-audit.mjs`,
no thresholds changed, `src/` untouched. Seeded scenarios, model attribution,
not predictions.

```
node tools/m5-doomed-star-audit.mjs --n 30 --jobs 2 --out out/m5-doomed-star-audit.json
audit PASS; exit 0
```

Wall time 14.4 s (ensemble 10.4 s at jobs=2, I7 re-runs 2.5 s, detail run
1.4 s) on a machine loaded by a Chromium build; not a timing measurement. A
second identical invocation wrote byte-identical JSON and text
(`41cc7ef3…296a`, `929be65a…fa3a`). Evidence:
[audit JSON](evidence/m5-doomed-star-audit.json),
[rendered audit](evidence/m5-doomed-star-audit.txt),
[stderr](evidence/m5-doomed-star-audit-stderr.txt), and a supplementary,
not pre-registered [per-seed fate table](evidence/m5-doomed-star-perseed.txt).

### Hard invariants: all eight held

| Id | Invariant | Result |
|---|---|---|
| I1 | no accepted LAUNCH dated ≥ 25,000 from an s00 body to an s00 body | PASS, 0 violations |
| I2 | every accepted LAUNCH dated ≥ 25,000 from s00 targets `stub:s01:b0` | PASS, 156/156 |
| I3 | no accepted LAUNCH dated ≥ 25,500 from s00 | PASS, 0 (last at 25,493) |
| I4 | no s00 arc alive at the horizon; every s00 arc alive at 25,500 died with STELLAR_DOOM | PASS, 0 violations |
| I5 | every non-extinct lineage has a living arc in s01/s02 and tier 7 before 25,500 | PASS (1 lineage, doomed-star-21, tier 7 at 14,280) |
| I6 | no ERROR seed | PASS, 0/30 |
| I7 | seed-0 resultDigest `d0d26b3d…afd0`; jobs=1 re-runs identical | PASS; doomed-star-0 and doomed-star-21 (first surviving seed) identical at jobs=1 and in the in-process detail run |
| I8 | every `destination-uninhabitable` rejection is a pre-doom in-system voyage arriving ≥ 25,500 or an s01 → s00:b0 return | PASS, vacuously: 0 rejections |

### Pre-registered claims

- **Evacuation-doom step 4** ("zero LAUNCH to s00:b1/s00:b2 with dateYear ≥
  25,000"): **held**, 0 (I1).
- **Neighbours-doom measurement** ("how many evacuation launches went to b1 or
  b2 during the grace window"): **0 of 156** grace-window launches (the old
  "2/7 wasted" pathology is gone). All 156 came from doomed-star-21 and carried
  2,496,000 persons to `stub:s01:b0`.
- **Survival trigger (1) of this decision** (any seed with
  `firstEnergy[6] < 25,000`): **did not fire**, 0/30. Advanced-civilisation
  survival stays deferred.
- **Survivors only via tier 7**: held; the single survivor reached tier 7 at
  14,280.

### What happened, in plain terms

| Outcome class | Seeds |
|---|---|
| EXTINCT_STELLAR | 24 |
| EXTINCT_NATURAL | 3 |
| EXTINCT_SELF | 2 |
| COLLAPSED_RECOVERING (alive) | 1 |

- **1/30 lineages survive their star's death**, and only by having left it:
  doomed-star-21 founded `stub:s01:b0` at 19,410, long before the doom, then
  evacuated 156 shiploads during the grace window (last s00-sourced arrival
  25,893, inside the latest possible 25,899). Its home-system arcs all died at
  doom-end. At the horizon it is alive but collapsed and recovering.
- **24/30 are killed by the star.** From the supplementary table: 19 died at
  once (lineage end 25,009), i.e. without the E ≥ 5 grace window (3 of them,
  doomed-star-17, 19 and 27, had reached Energy 5 earlier but evidently lost
  it before 25,000; inferred, not separately measured); 5
  (doomed-star-1, 3, 12, 23, 24) had Energy ≥ 5, got the 500-year grace window,
  but lacked transport tier 7, so the rule left them no destination and they
  died at doom-end (25,509). None of their launches was wasted after the doom;
  the 105 pre-doom launches to companion worlds (8 seeds) founded 17
  companion colonies, which died either before the doom (8) or with the star
  at 25,500 (9).
- **5/30 went extinct before the doom** on their own (3 natural, 2
  self-inflicted, between 2,299 and 14,789).
- No seed returned from s01/s02 to the dead home world (0 returns, 0
  rejections).

Against the M4d record (pre-neighbours fixture, different variates, so a
comparison of distributions only): EXTINCT_STELLAR 23 → 24, alive at horizon
3 → 1; the neighbours-doom counterfactual predicted 1/30 alive. Era E5 by
25,000: 3/30 (record 4/30 E5+ over 30,000). Energy tier 5 by 25,000: 11/30.

### Checks

- `npm test` (Node v24.7.0, `--test-concurrency=1`): **193 tests, 193 pass,
  0 fail, 0 cancelled, 0 skipped**, 29.9 s.
- `bash tools/digest-capture.sh <worktree> <file>`: sha256
  `9dafd549e0195726afac458ddbc47d1a967a6b194ee29a7319e433d625725664`
  (unchanged), 14/14 blocks exit 0.

### Open items from this run

- I8 held only vacuously (no rejection occurred), so its classification code
  was exercised by the synthetic test alone, not by real data.
- Only one seed exercised the tier-7 evacuation path; I2/I3/I5 rest on that
  single lineage.
