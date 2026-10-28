# Civ-owned partial settlement species cohorts · v1

`src/settlement-species-allocation.mjs` joins an explicitly selected active
[species composition decision](species-composition-adoption.md) with an active
[settlement resident allocation](settlement-resident-allocation.md) for the
**same exact annual observation and civilisation arc**. It records a partial,
authored scenario matrix. The [population decision CLI](population-decision-cli.md)
now calls this API explicitly, and Atlas separately reviews its exported cohort
transport through its own [allocation consumer](../../universe-atlas/docs/settlement-allocation-import.md).
Default simulation and annual refinement do not call this v1 module. The
separate [annual child contract](annual-settlement-species-allocation.md) uses a
later derived policy sample without changing this same-observation v1 contract.
Species Lab retains ownership of exact species identities,
revisions and biology; Civ owns this additional authored decision.

The versions are `civ-settlement-species-allocation-1` for a record and
`civ-settlement-species-allocation-ledger-1` for the append-only ledger. The
[standalone closed JSON schema](../schemas/settlement-species-allocation-ledger-v1.schema.json)
includes the closed parent record definitions. Schema validation alone cannot
establish the runtime conservation, source consistency or replacement rules.

## Exact inputs and parent checks

`allocateSettlementSpecies(input)` takes exactly these parsed JSON fields:

- `spatial`: the complete annual spatial v1 artifact.
- `annualBody`: its complete matching annual body v2 artifact.
- `compositionSource`: the complete single-body v2 or multibody v1 artifact
  named by the adopted proposal. A complete bundle is required when the parent
  uses a bundle; extracting only its selected member is insufficient.
- `speciesCompositionLedger`, `residentAllocationLedger`: the complete current
  parent ledgers, including replaced records.
- `parents`: `{speciesCompositionRecordSha256, residentAllocationRecordSha256}`,
  explicitly selecting the two parent decisions by their exact record digests.
- `ledger`: the complete current cohort `{version, records}` ledger, including
  an explicitly supplied empty ledger for a first choice.
- `destinations`: every settlement and every cell's explicit resident residual.
- `notLocated`: one exact species/revision/count row per adopted known species,
  including zero counts.
- `decision`: `{id, author, policy, rationale, choice, replaces}`. The policy
  contains `{id, version, rationale}`. Author and rationale are editor
  declarations; the module cannot authenticate a human or obtain approval.

Both selected parents must be active at creation. Their independently checked
`observationKey` values must agree. This key retains complete run provenance,
body, exact sample year, source tick, lineage and arc, excluding export hashes
and selected year sets. Parent interval, annual outcome and complete arc summary
must also agree; equal population numbers alone cannot join different sources.
This contract intersects the parent time domains at years `0..2,000,000` and
retains their exact source-tick and terminal-observation rules. There is no
interpolation, year rounding or carry-forward.

The core reviews both complete parent histories and invokes their existing pure
creation boundaries using each selected record's exact preceding ledger prefix.
The reconstructed parent record must equal the supplied snapshot. This rechecks
the complete spatial hierarchy and annual-body pin/projection, clocks, scopes,
policies, event declarations, categorical/threshold state, cell budgets and
authored resident allocations. It also rechecks the complete composition source
and selected proposal observation. The entire matching body projection of
`compositionSource`, including all supplied observations and events, must equal
`annualBody`; a selected-row-only match is insufficient.

Each cohort record embeds both exact parent record snapshots. Its `sources`
contains canonical parsed-value pins for `spatial`, `annualBody` and
`compositionSource`: `{schemaVersion, encoding, sha256, byteLength}`, with encoding
`civ-canonical-json-utf8-no-newline`. These pins bind supplied parsed values, not
original file bytes. Parent proposal/source-byte pins, Species bundle identities
and Atlas envelope/binding declarations retain their original unverified meaning.
No Species bundle or Atlas envelope is loaded here.

## Destinations and the two residuals

Every destination has exactly
`{regionId, cellId, siteId, kind, settlementId, budget, assignments, speciesUnassigned}`.
A `kind: "settlement"` row keeps its parent's exact `settlementId` and resident
budget. A `kind: "cell-residual"` row has `settlementId: null` and uses that
cell's parent's explicit `unallocated` resident budget. Every such destination
is present, including zero-budget cells and empty authored settlements.

Destinations are unique and ordered by the Civ canonical serialization of
`[regionId, cellId, kind, settlementId]`, using lexical comparison. Coverage,
identities and budgets must exactly equal the parent resident allocation.
Threshold activity is context and cannot establish settlement existence or
founding. The original parent continues to declare `speciesAllocation:
"not-assigned"`; the new child decision supplies the additional partial cohorts.

`assignments` is a sparse array of `{species: {id, revision}, count}`. It contains
only positive counts and only exact adopted species revisions. Species IDs are
sorted and unique within a destination. Omitted known species have a zero
located count there. A zero adopted species total is permitted and still needs
an explicit zero `notLocated` row. No individual example is counted or expanded
into population, and no newer species revision is selected automatically.

A Species lineage event or an Atlas planet illustration does not advance these
counts. To count a later descendant, Civ must separately adopt that exact
species ID/revision in a new composition decision; the corresponding annual
refinement must then name that exact adopted revision, and this settlement
cohort decision must explicitly allocate its count to resident destinations.
No count follows a parent reference or visual mapping. See Species Lab's
[descendant authoring workflow](../../species-lab/README.md#author-a-descendant-from-a-captured-root-package)
and Atlas's [lineage planet illustration contract](../../universe-atlas/docs/annual-species-population-import.md#later-lineage-descendant-planet-illustration).

`speciesUnassigned` is explicit at **each destination**: resident budget not
attributed to a species by this cohort decision. `notLocated` is explicit for
**each adopted known species**: adopted species count not attributed to any
destination by this decision. These are different axes of incomplete knowledge.
A known species may remain partly unlocated while resident destinations have
unattributed species. No particular destination is inferred for that remainder.
Neither residual establishes biological absence, an additional unknown species,
empty habitation, migration or permission to discard population.

All counts are canonical unsigned decimal strings (at most 4,096 digits).
BigInt arithmetic enforces every equality exactly:

```text
sum(adopted known species totals) + proposal.unassigned = arc population
sum(destination budgets) = arc population
for each destination:
  sum(assigned known species counts) + speciesUnassigned = destination budget
for each known species:
  sum(destination counts) + notLocated = adopted species total
sum(local speciesUnassigned) = sum(notLocated) + proposal.unassigned
```

Empty known-species assignments and a wholly unassigned arc are supported.
An entirely unlocated known composition is also supported. Neither case invents
a location, presence claim or complete species census.

## Explicit decisions and contextual review

Creation returns a fresh frozen `{status, record, ledger, active,
reviewedObservationKey, sourceBytesVerified, simulationStateChanged,
continuityEstablished}` result. It performs no IO and never mutates its inputs.
The caller owns durable storage and must retain complete histories; this core
cannot discover omitted decisions or original files.

A first `choice: "choose"` requires `replaces: null` and no cohort decision for
that observation. A subsequent decision requires `choice: "replace"` and
`replaces: {id, recordSha256}` pinning the currently active cohort decision for
the **same observation key**. Duplicate decision IDs, stale replacements and
cross-observation replacements are rejected. Even numerically identical
partitions need an explicit replacement. Old records remain in authored ledger
order. `recordSha256` hashes the canonical record excluding its own digest; it
is no signature or source-byte authenticity claim.

`reviewSettlementSpeciesAllocationLedger(input)` takes exactly the seven
context fields `spatial`, `annualBody`, `compositionSource`,
`speciesCompositionLedger`, `residentAllocationLedger`, `parents`, and `ledger`.
It checks all cohort records against exact snapshots retained in the complete
parent histories and replays the cohort choices. It rechecks the complete
supplied sources for the explicitly selected parent pair. Review may select a
historical pair with its retained sources so that a replaced parent can still
be inspected; creation always requires active parent selections.

Each `active` member is `{record, status}`:

- `current-supplied-sources-only`: both parent snapshots are still active and
  this selected observation's complete supplied canonical sources match.
- `stale-parent`: either parent snapshot has been replaced, including when its
  replacement changes only rationale and leaves all counts identical.
- `not-reviewed-other-observation`: unchanged parents exist, but this review
  supplies source context for another exact observation.
- `stale-source-context`: unchanged parents exist at the selected observation,
  but the retained cohort source pins differ from the supplied parsed context.

Staleness is computed at review time, never written into an old hashed record.
No stale record is retargeted to a newer parent, new source export or species
revision. Reauthoring against new active parents requires an explicit new cohort
replacement. Missing parent history, altered snapshots or inconsistent supplied
source context cause rejection rather than an invented current status.

## Bounds and limits of the claim

Each top-level parsed input field, including every ledger, must fit 32 MiB
canonical UTF-8, depth 64 and one million visited nodes. The resulting complete
cohort ledger has the same limits and at most 1,024 records. Both supplied parent
ledgers are capped at 1,024 records by this child boundary. The parent spatial
limits also apply: at most 10,000 observations and 250,000 source cell rows,
32 MiB spatial and 16 MiB annual body. `compositionSource` has a 16 MiB cap;
its complete parent structural limits still apply. Strings and object keys have
a 65,536 UTF-16-unit ceiling; total copied text is bounded before canonical
encoding. All records and arrays must be plain acyclic JSON with own enumerable
data properties, dense arrays, safe integer numbers and well-formed text.

A decision has at most 256 regions, 4,096 cells, 4,096 settlements, 8,192 total
destinations, 1,024 adopted known species, and 65,536 positive destination/species
rows in aggregate. Each destination can contain at most 1,024 such rows. Limits
reject the entire operation without truncation or rounding.

All stored verification/effect flags are fixed false: original source bytes,
simulation replay, event semantics, threshold history, settlement existence,
species definitions/applicability/assignment, biological truth, Atlas binding,
simulation/population mutation, settlement founding, continuity, historical
membership, migration and physical placement. `atlasPlacement` remains
`not-bound`. A current record is still authored partial scenario data.

The paired [fictional input](../examples/settlement-species-allocation-input.json)
and [fictional ledger](../examples/settlement-species-allocation-ledger.json)
were assembled directly using canonical encoding, without invoking the allocator
or any simulation. The example has 1,600 residents, known species totals 600
and 500, and arc proposal unassigned 500. Located species counts are 300 and 200;
each retains 300 `notLocated`. Local `speciesUnassigned` totals 1,100, including
both residual contributions. All sixteen cell residuals and both settlements
(one empty) remain present. Parent hashes/provenance and editor declarations are
fictional. The artifacts provide no runtime verification or real editor approval.

Only JavaScript syntax, JSON parsing and whitespace checks were performed for
this addition. No tests, build, simulation, browser/device review, commit,
publication or synchronization was performed for that original addition. The
CLI and independent Atlas review consumer are now implemented as described
above; runtime population integration and physical planet placement remain
additional contracts.
