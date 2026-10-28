# Annual spatial observation export

`createAnnualSpatialExport(world, result, {body, years})` in
[`src/annual-spatial-export.mjs`](../src/annual-spatial-export.mjs) emits
`civ-lab-annual-spatial-observations-1`. The
[serialized schema](../schemas/annual-spatial-observations-v1.schema.json)
describes this separate authored scenario artifact. It supplies explicit
arc → region → cell population budgets for a future settlement allocation
boundary. It creates no settlement, resident assignment, geography or Atlas
binding. Civilization Lab remains the owner of the simulation observations.

## Export command

Reuse the existing annual export command from the repository root:

```powershell
node tools/export-annual-body.mjs --domain fixtures/domains/toy-12.json --seed spatial-review-1 --body stub:s00:b0 --year-range 0:20 --format spatial --output out/annual-spatial.json
```

The parent directory must exist. `--format spatial` requires a single `--body`;
the existing `--bodies` bundle has no spatial variant. Omitting `--format`, or
using `--format body`, retains the existing annual body export behavior.
Explicit years/ranges, the 10,000-observation limit, optional `--until-year`,
fixture restrictions, and atomic output replacement use the
[existing CLI boundary](annual-body-export-cli.md). Neither parsing nor writing
the spatial format runs a second simulation.

Spatial output has two additional limits: at most **250,000 emitted cell rows**
across all requested observations, preflighted before constructing the spatial
projection, and at most **32 MiB of canonical UTF-8 JSON** before returning or
writing the artifact. Both reject the whole export with an actionable error;
neither truncates. Request fewer years or smaller year groups when a limit is
exceeded. The transport newline is excluded from the canonical byte limit.

The CLI captures only selected decade inspections. It does not claim to have
observed a continuous town history between sparsely requested samples. Request
all required decades through an annual range when contiguous boundary evidence
is needed; even then histories begin at the first available regional boundary.

## Matching annual body artifact and provenance

The exporter first creates the matching
`civ-lab-annual-body-observations-2` artifact using the same compiled result,
body and requested years. It retains its full provenance, actual/configured
intervals, compiled events, annual outcomes and event association scopes.
`annualBodyPin` records the SHA-256 and byte length of that artifact's Civ
canonical JSON encoded as UTF-8 **without a trailing newline**. CLI output
adds a newline, so hashing the raw CLI file directly does not produce this pin.
Use `canonicalBytes` on the parsed matching body artifact, or
`serializeAnnualBodyExport` without appending a newline. Pretty printing, key
order and a transport newline are not part of the canonical identity.

The pin binds that complete canonical body artifact, including its exact year
selection. It does not authenticate original result witnesses or replay the
simulation. The inherited provenance validation label states that inspection
payloads have not been replayed. A separate body export is not embedded or
written as a side effect; export it separately with matching arguments if needed.

## Annual populations and categorical state

Each observation preserves the annual body year, source tick, status,
population, era and event IDs. `annualOffset` is the year minus ten times the
source tick. Each arc retains its exact source arc and lineage ID and adds
sorted regions and cells with exact identifiers. `localId` is the region's
partition-local identity, alongside its fully qualified region ID.

The exporter uses `annualHierarchy(t).children` and their child samples at the
**same offset** as the body sample. It does not independently interpolate or
re-split a rounded body/arc population. Annual hierarchical apportionment and
its tie breaking remain authoritative. It explicitly checks that cell
populations sum to their region, regions to their arc and arcs to the body at
every emitted observed year. Decimal JSON strings preserve all BigInt values.

`sampledState` contains the sample's categorical fields after removing only
`year` and `pop`: arc era; region/cell era, tiers, polity ID and the source
outcome record. These are the annual hierarchy's staircase values, including
the phase-0 annual start and endpoint changes. Cells inherit region categories;
they are not independently simulated societies. A zero-population sample may
retain categorical state; the existing body/arc `era` summary remains null at
zero population. `annualOutcome.status` stays `not-modelled`: the copied
categorical outcome record does not establish an annually simulated lineage
outcome.

`policies.regionPartitionVersion` comes directly from
`world.def.manifest.partitionVersion`; `cellPartitionVersion` is
`civ-cell-binary-1`. `annualPopulation` pins the hierarchy sampling policy.

## Logical sites and threshold episodes

Each cell has a logical `site.id` supplied by the cell refiner and an integer
`placementToken` copied from its site `offset` draw. **The token is opaque.**
It is not longitude, latitude, a normalized distance, a world position, a
building anchor or a terrain placement. The logical site denotes neither an
established settlement nor an inhabited building.

`thresholdState` is deliberately distinct from the annual interpolated cell
population. It evaluates the static cell allocation at the selected regional
**boundary population**, using the existing threshold of 1,000 people:

- Offsets 0 through 9 use source tick's start boundary, before phase-0 arrivals.
- Offset 10 uses the endpoint boundary at source tick plus one.
- `boundaryTick`, `boundaryPopulation` and `threshold` expose that evidence.
  Therefore an annual sample can exceed 1,000 while its boundary threshold
  state remains inactive, or be below it while that state remains active.

The exporter reconstructs episodes from the inspection adapter's per-region
`boundaryHistory`. Each fresh contiguous segment begins with unknown prior
history. If a cell is already active at its first available boundary, its
episode has `leftCensored: true`, `firstObservedActiveTick` equal to that
boundary, and **null `foundingTick` and `townId`**. It retains this censoring
while that observed episode continues. A witnessed inactive → active crossing
inside the segment has `leftCensored: false`, with the crossing tick as both
`firstObservedActiveTick` and `foundingTick`, and the existing deterministic
hash of `[siteId, foundingTick]` as `townId`. This is a threshold episode
identity, not proof of a settlement's founding or a resident count.

Inactive states have `episode: null`. An abandonment followed by a witnessed
crossing starts another episode. After any inspection gap the adapter supplies
a fresh history, so no episode is inherited across that gap; the first active
boundary is left censored again. `historyAvailableFromTick` identifies the
beginning of the contiguous evidence segment. The exporter never uses
`refineCell().cells[].townId`, which can describe an endpoint-associated episode
even when it is not active at the annual observation's boundary.

Before trusting a contiguous join, the exporter also checks that the prior
inspection's regional endpoint population equals the next inspection's start
boundary population at that same tick. A mismatch rejects the artifact. Tick
adjacency alone does not establish matching stocks. A genuine tick gap starts
fresh history as described above.

## Sparse and terminal observations

The annual body exporter owns year selection. Intermediate decade boundaries
belong to their new decade. Only the actual compiled final boundary uses the
preceding decade's offset 10; configured and actual end years remain distinct.
Requests beyond the actual compiled interval are rejected.

`not-inspected` retains null population, era and civilisation event IDs, and
empty arcs. An inspected snapshot with no selected body arc retains
`no-active-arc-observed`, population `"0"`, null era and empty arcs. Neither is
an absence-of-life claim. Zero-population arcs remain explicit observed arcs
when the supplied inspection includes them. Missing observations, geography,
species assignments and residents are never inferred from these statuses.

The separate [settlement resident allocation boundary](settlement-resident-allocation.md)
now computes canonical pins for the complete spatial and matching body artifacts
and explicitly partitions every cell of one observed arc/year among authored
settlement residents and an unallocated residual. It preserves threshold evidence
as context and requires a complete ledger plus a human decision. Species
assignments and physical placement still require their own contracts.
