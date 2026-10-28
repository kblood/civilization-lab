# Settlement resident allocation

[`src/settlement-resident-allocation.mjs`](../src/settlement-resident-allocation.mjs)
defines the pure Civ-owned `civ-settlement-resident-allocation-1` decision and
`civ-settlement-resident-allocation-ledger-1` append-only ledger. It partitions
each exact annual cell population into explicitly authored settlement residents
and an explicit `unallocated` residual. These are scenario decisions for one
observed arc at one exact supplied year. They provide the resident data boundary
that future Settlement Lab and Atlas consumers can inspect.

The module performs no IO, compilation, simulation mutation or physical
placement. It imports no sibling lab. Source values come from the existing
[annual spatial exporter](annual-spatial-export.md) and its matching annual
body export. The [closed serialized ledger schema](../schemas/settlement-resident-allocation-ledger-v1.schema.json)
describes structural output; the module additionally enforces the semantic,
hash, ordering, conservation, identity and resource requirements below.

## API and explicit input

```js
import {
  allocateSettlementResidents,
  reviewSettlementResidentAllocationLedger,
  inspectSettlementResidentAllocation,
  SETTLEMENT_RESIDENT_LEDGER_VERSION,
} from './src/settlement-resident-allocation.mjs';

const result = allocateSettlementResidents({
  spatial,       // complete parsed single-body spatial artifact
  annualBody,    // complete parsed matching annual body v2 artifact
  target: {body, sampleYear, sourceTick, lineageId, arcId},
  allocations,   // complete authored region/cell allocations, sorted by IDs
  decision,      // explicit human author declaration, policy and rationale
  ledger: {version: SETTLEMENT_RESIDENT_LEDGER_VERSION, records: []},
});
// The caller owns saving result.ledger and retaining the source artifacts.
// Review requires the complete supplied ledger, including replaced records.
const review = reviewSettlementResidentAllocationLedger(result.ledger);
```

The input root is closed to those six fields. Use parsed JSON data: no BigInt
values, accessors, symbols, cycles, sparse arrays, prototype-bearing instances,
non-finite/fractional numbers or negative zero. All population quantities are
canonical decimal strings, with at most 4,096 digits. Years are safe integer
numbers, including signed years; ticks are canonical signed decimal strings.

`allocations` contains every region of the selected observed arc, in exact
region-ID order. A region contains `{regionId, cells}` and all sixteen cells in
exact cell-ID order. Each cell contains:

```js
{
  cellId: '...exact observed cell ID...',
  siteId: '...exact observed logical site ID...',
  unallocated: '70',
  settlements: [{
    id: 'settlement:authored-hamlet',
    residents: '30',
    rationale: 'An explicit scenario allocation for this cell and year.',
  }],
}
```

Settlement IDs use the explicit `settlement:` namespace followed by ID-safe
characters; they are independent of logical site IDs and threshold `townId`
hashes. Settlement IDs must be unique across the whole decision, and each
cell's settlements must be sorted by ID. An empty settlement list is valid.
An authored settlement with zero residents is valid. Every cell still needs its
explicit residual, including zero-population cells.

The decision contains exactly `{id, author, policy, rationale, choice, replaces}`.
`policy` contains `{id, version, rationale}`. `author` declares a human editor;
the module does not authenticate that declaration. The first choice uses
`choice: 'choose'` and `replaces: null`. Replacement uses `choice: 'replace'`
and `replaces: {id, recordSha256}` matching the currently active record's
decision ID and canonical parsed-record hash.

## Source matching and retained observations

Creation computes both complete artifacts' canonical UTF-8 SHA-256 and byte
length itself. It accepts no caller-supplied spatial digest. The spatial
`annualBodyPin` must match the complete canonical annual body value, using
`civ-canonical-json-utf8-no-newline`. The spatial-to-body projection must then
equal the complete supplied annual artifact: remove spatial policies/scopes,
the pin and annual offsets, and remove each arc's sampled state and regions.
Body, provenance, interval, all requested years, all arc summaries, events,
outcomes and observation/event scopes must match. The module accepts only the
single-body v2 annual artifact; bundle callers must explicitly project the
matching member first.

All source observations are checked, not just the chosen year. Arc IDs, regions,
local region IDs, cells and sites must be sorted and exactly qualified by their
parents. Every region has sixteen cells, each site is its cell's `/site`, and
the placement token remains an integer from 0 to 1,023. Annual source tick and
offset use the actual compiled final boundary: intermediate decade boundaries
belong to the new decade; only the actual final boundary uses the preceding
decade at offset ten. Configured and actual end years remain distinct.

Cell sums must equal regions; region sums must equal arcs; arc sums must equal
the observed body population, using BigInt throughout. Copied categorical state,
era summaries, provenance, policies, annual outcomes and domain/arc event
associations are checked against the supplied declarations. Events pass the
existing Civ event validator. This verifies supplied parsed-data consistency;
it does not replay inspection witnesses or authenticate a compiled history.

Each decision retains the complete selected spatial arc, including every region,
cell, logical site, placement token, categorical state and threshold state. It
also retains full provenance, interval, policies, scopes, exact annual/source-tick
metadata, body population/era summaries and event-ID lists. Complete source
artifacts are retained separately by the caller and pinned in `sources`.
Standalone ledger review checks all retained declarations and parsed-record
digests but cannot redo full artifact projection equality without those sources.

## Residents, threshold evidence and missing assignments

For every cell, `sum(settlement.residents) + unallocated` must equal that cell's
exact annual population. This conserves the region and arc budgets without
renaming regional, boundary or threshold populations as settlement residents.
`unallocated` means the decision has not assigned those people to settlements;
it does not mean wilderness, homelessness, absence or a second species.

Boundary threshold state is copied as context. Its boundary tick must match
offset zero through nine's start boundary or offset ten's endpoint; its status
must agree with boundary population and the existing threshold of 1,000.
The available history and episode onset must fit the supplied interval and
boundary. An active left-censored episode retains **null `foundingTick` and
`townId`** and its first observation at the available-history boundary.
A non-censored episode must retain the exact witnessed threshold hash. No
settlement founding is inferred from either case.

An inactive or below-threshold site can have an authored settlement; an active
threshold site can have none. Annual interpolated population and boundary
population can differ. Threshold activity is not settlement existence, a
capacity measurement, housing or proof of habitation.

`speciesAllocation` stays `not-assigned`: the existing arc-wide Species
composition decision does not say where those species live. `atlasPlacement`
stays `not-bound`: an opaque placement token supplies no geographic coordinate.
No inherited species assignment, building capacity, resident continuity,
interpolation, migration, physical location or founding date is created.

## Ledger conflicts and identity

Each record computes a canonical `observationKey` from the complete declared
provenance, body, sample year, source tick, lineage and arc. Artifact digests and
the artifact's selected year set are excluded. Re-exporting the same run's exact
observation into another file cannot create a second active choice. Competing
partitions require explicit replacement. Decision IDs are unique across the
whole ledger, and replaced records remain present in their original order.

An authored settlement ID may appear at later exact observations in the same
scenario context, but its declared provenance/body/lineage/arc/region/cell/site
location must match every prior appearance in the supplied ledger, including
replaced records. Relocation or reuse in another declared run requires a new ID
in this version. Keeping an ID at a site does not prove continuous residence
between observations. The module cannot discover decisions omitted by its
caller; append-only durability requires the caller's complete retained ledger.

All verification and effect flags are false in every record, including
original source-byte authenticity, simulation replay, event/threshold history,
settlement existence, species, Atlas binding, simulation/population mutation,
founding, continuity and physical placement. Canonical pins computed here bind
the supplied parsed values, not original file bytes or authoritative reality.

## Guided local resident editor

The optional Node guide avoids manually composing complete allocation arrays,
request JSON, conflict digests and source references:

```powershell
node tools/guide-settlement-residents.mjs --spatial inputs/annual-spatial.json --annualBody inputs/annual-body.json --ledger inputs/resident-ledger.json --output-dir out/residents-choice-001
node tools/guide-settlement-residents.mjs --help
```

Use Node 22 or newer. Omitted paths are prompted relative to the invocation
directory; all three existing original files are required. Supply complete
resident history, including replaced records. The guide never creates an empty
ledger or discovers omitted history, and does not arbitrate concurrent writers.
The existing bounded local reader enforces regular files, strict JSON, resource
limits and original hash/length/real-path capture. The matching annual input must
be the complete **single-body v2** document, not a multi-body bundle.

The additive pure inspection API accepts exactly
`{spatial, annualBody, ledger, target}`. With `target:null` it validates both
complete sources through the existing projection/source validators, replays the
complete ledger and returns exact observed target summaries. With an explicit
target it uses the same target-observation resolver as the allocator to return
the full selected observation, its conflict key and current active choice. It
manufactures no decision, partition or ledger record and preserves the existing
false verification/effect claims. Target summaries beyond the allocator's
256-region/4096-cell limit are explicitly ineligible.

The guide pages exact observed year/arc targets; enter an explicit numbered
choice. `regions` pages exact region IDs/budgets, and `cells` pages complete
region/cell/site IDs, budgets, settlement sums, proposed remainders, stored
residuals and threshold context. Thresholds and placement tokens remain scenario
context, not housing, physical coordinates or evidence of habitation.

There is initially **no partition**. Type the complete action
`start with all cell budgets unallocated` to explicitly create one complete
region/cell partition with empty settlement lists and the cell budgets retained
as unallocated. Repeating that action requires a separate `reset partition`
confirmation and discards the authored draft rows.

`add`, `edit` and `remove` explicitly select a cell or existing settlement row.
Every added/edited row requires the entire `settlement:` ID, a canonical decimal
resident count and a rationale. Zero counts are permitted. Counts use BigInt;
malformed counts, duplicate IDs, over-allocation, source/threshold identity reuse
and historical movement of a settlement ID reject rather than clamp. Editing
keeps the selected cell; relocation requires another explicitly authored ID.
Removal requires the exact displayed `remove <settlement ID>` action. Settlement
lists are sorted for the existing contract; no row or count is inferred.

Settlement edits leave stored residuals unchanged and retire their approval.
`apply residuals` first pages every proposed cell settlement sum/remainder, then
requires a separate exact `apply residuals` confirmation before copying those
remainders into all cells. The initial all-unallocated partition also requires
this separate residual approval. `done` refuses unapproved residuals and performs
a final paged inspection of the exact target/current conflict and every cell's
settlement rows, counts, rationales and residual. `inspect` is also available
while editing. Paging requires `next`; no rows are silently truncated.

After final inspection, an initial target requires explicit `choose`. An active
conflict requires `replace <current decision ID> <current record SHA-256>` and a
new unique decision ID. Author, policy ID/version/rationale and decision
rationale are all explicit declarations. The unchanged allocator reviews the
complete proposed append before showing its record digest, target, decision,
original pins, output pins and residual total.

Only exact `write` authorizes output. The guide then freshly reopens all three
original paths with a new reader, compares original SHA-256, length and real path,
reruns the same allocator and requires an identical reviewed record/summary.
It writes `request.json`, the complete appended `ledger.json` and `summary.json`
last into an exclusive new directory whose parent already exists. EOF,
`:cancel`, interruption or other text before confirmation writes nothing. A
write failure preserves the partial newly created directory, as with the request
CLI. Source files/ledgers are never overwritten; keep the original source files
separately for downstream review.

Both the guide and residents mode of `author-population-decision.mjs` use
`tools/settlement-resident-authoring.mjs`. The request CLI keeps its existing
arguments, original request bytes, request/ledger/summary schemas, artifact names,
encoding, success message and residual semantics. Composition/cohort/individual
modes are unchanged. The allocator's partition and ledger rules are unchanged;
only the existing target resolution is shared with the new inspection API.

All output remains authored scenario data. No actual inhabitants, biological
assignment, building capacity, coordinates, continuity, population provider or
physical settlement is established. Implementation evidence is static source
reading only; no tests, checks, builds, CLI runs, browser, Git, assets, deployment
or publication were performed for this addition.

## Resource bounds and illustrative artifacts

The complete spatial artifact is limited to 32 MiB canonical UTF-8, 250,000 total
cell rows and 10,000 observations. The matching annual body artifact is limited
to 16 MiB. One decision has at most 256 regions, 4,096 cells and 4,096 settlements;
each cell has at most 256 settlements. The complete ledger has at most 1,024
records and 32 MiB canonical UTF-8. Each supplied parsed value and the resulting
ledger have a depth-64 and one-million-node budget. Limits reject the entire
operation rather than truncating data.

The paired [fictional input](../examples/settlement-resident-allocation-input.json)
and [fictional ledger](../examples/settlement-resident-allocation-ledger.json)
illustrate a sixteen-cell region, a below-threshold hamlet with thirty residents,
an empty authored settlement at an active left-censored threshold site, and all
explicit residuals. They were assembled as documentation artifacts using the
canonical encoding, without invoking the allocator or compiling a simulation.
Their repeated provenance hashes and validation declaration are authored
fiction; they establish no real source, history, verified runtime execution or
planet placement. No tests, browser checks or simulation runs were performed
for this implementation.
