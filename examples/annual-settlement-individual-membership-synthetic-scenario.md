# Fictional exact annual membership example

This is hand-authored arithmetic and selection guidance, not an executable
source-complete fixture, allocator output, real identity or editor approval.
Original bytes and all digests must come from deliberately selected real inputs.
No claim was observed by running the API.

Continue the [fictional annual cohort example](annual-settlement-species-synthetic-scenario.md):
the anchor is year 0; the exact contiguous year-1 derived policy gives species A
720, species B 600 and annual policy unassigned 600. An explicit year-1 settlement
destination has 1,200 resident units: species A 400, B 300 and destination
speciesUnassigned 500. Its resident cell unallocated residual is 720. Species A
has known notLocated 220. These four residuals retain their different meanings.

Select the exact new annual child and full settlement/species-A target. With
declared origin 0, the exact later instant is `31557600000000000` ns and tick is
`"0"`. The original year-0 anchor key and year-1 resident key remain separate from
the annual child key. A subyear timestamp cannot stand in for this sample.

Retain the composition's original bundle unchanged. A separate individual source
bundle may append `PersonA@1` and `PersonB@2`, but its species-A exact definition
must remain structurally identical to that in the composition bundle. Both
persons have exact species-A revision, `identity.kind:'individual'`, and declared
half-open intervals containing the year-1 instant. The original bundles have
independent byte pins; the composition/profile bundle pin is never refreshed.

An author explicitly selects sorted refs:

```json
[
  {"id":"PersonA","revision":1},
  {"id":"PersonB","revision":2}
]
```

Then `namedCount` is `"2"`, explicit `unnamedRemainder` is `"398"`, and the selected
annual species count is `"400"`. This partitions only the A assignment, not B,
destination-unassigned, unlocated or cell-residual units. An explicitly empty
enumeration instead requires unnamed remainder `"400"`; absence is unknown.

`PersonA` cannot simultaneously be counted in another active annual membership
target in the same universe at that exact instant, even using another revision,
planet or source bundle. A different source context alone does not release the
claim. Explicitly replacing the first membership with an empty enumeration can
release it; a later append retaining known upstream replacement/competing-anchor
history can also retire that earlier claim. Historical illegal duplication is
still rejected. Legacy membership ledgers and external writers are outside this
ledger's coordination scope.

A representative/type specimen cannot supply either ref. A valid-until exactly
equal to the year-1 timestamp is outside its half-open interval and must reject.
Fixed annual policy counts do not extend biological applicability or establish
births, migration, residence, continuity or scientific truth.
