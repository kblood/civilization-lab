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
