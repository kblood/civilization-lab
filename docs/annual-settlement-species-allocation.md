# Authored settlement species cohorts from an annual policy sample · v1

The separate [annual individual membership boundary](annual-settlement-individual-membership.md)
can explicitly name existing exact Individuals within one positive annual child
destination/species assignment. Its history-only cohort helper leaves source
freshness unreviewed; membership creation still requires this contract's full
contextual annual review. Legacy same-year individual APIs remain separate.

`src/annual-settlement-species-allocation.mjs` supplies a separate decision
boundary for one **strictly later derived annual species sample** and one exact
active settlement resident allocation. Civilization Lab owns the child decision;
Species Lab retains identities, exact revisions and biology. The existing
composition adoption, resident allocation, v1 settlement species cohorts and
individual membership contracts are unchanged.

The record version is `civ-annual-settlement-species-allocation-1`; its complete
append-only ledger is `civ-annual-settlement-species-allocation-ledger-1`.
See the [closed ledger schema](../schemas/annual-settlement-species-allocation-ledger-v1.schema.json)
and [closed review transport schema](../schemas/annual-settlement-species-review-input-v1.schema.json).
They reference the existing closed parent definitions locally. Schema validation
does not establish arithmetic, source reconstruction, hashes or currentness.

The annual refiner supplies arc-wide species totals according to a fixed anchor
policy. The new child accepts an explicitly authored spatial partition of those
totals. It never chooses a settlement for a species, derives membership from an
anchor settlement, creates residents, runs demography, infers births/deaths or
migration, or establishes biological/scientific truth, continuity or residence.
`atlasPlacement` remains `not-bound`; all verification/effect flags are false.

## Pure API and exact input

`allocateAnnualSettlementSpecies(input)` takes exactly:

- `refinement`: the full annual species refinement, including every row/gap.
- `speciesCompositionLedger`: the complete current composition history used by
  that refinement, including replaced records.
- `compositionSource`: the complete original annual document/bundle named by
  the selected adopted composition.
- `refinementAnnualBody`: the complete original annual document/bundle used by
  the refinement, not merely its selected row or body projection.
- `spatial`, `residentAnnualBody`: the complete spatial v1 artifact and its
  complete matching single-body v2 artifact.
- `residentAllocationLedger`: the complete current resident history.
- `originalSourcePins`: exactly the seven source-role names above, each
  `{sha256, byteLength}`. The pure API treats these as declarations; the CLI
  computes them from actual original files. `ledger` is not a source-pin role.
- `parents`: exactly `{refinementSha256, speciesCompositionRecordSha256,
  residentAllocationRecordSha256}`, explicitly choosing all three identities.
- `sample`: exactly `{sampleYear, sourceTick, effectiveNs}`.
- `destinations`, `notLocated`: the complete explicit allocation below.
- `decision`: exactly `{id, author, policy, rationale, choice, replaces}`, using
  the established explicit editor decision shape. `policy` is
  `{id, version, rationale}`. Editor identity/approval remain declarations.
- `ledger`: the complete current new cohort ledger, explicitly empty on the
  first choice. This is not the v1 cohort ledger.

The core reviews both complete parent histories. It reruns
`refineAnnualSpeciesPopulation` with its full current original parsed inputs,
the actual selected anchor record and exact original pin declarations. **Every
field of the supplied refinement must equal the full fresh result.** Its digest
must equal the explicitly requested `refinementSha256`. This also rechecks
positive anchor weights, fixed BigInt arithmetic, competing anchors, supplied
gaps, unknown/interrupted rows, source identities and all unchanged false flags.
Neither an isolated row nor a matching population number is sufficient.

The selected year must be greater than the original anchor year and must be a
listed `derived` row. An unknown row, a missing year or the original anchor
cannot allocate. Exact source tick and absolute instant must match that row;
the instant is recomputed from the original binding's origin plus the exact
year times `31557600000000000` nanoseconds. No rounding or subyear matching is
used.

The initial boundary requires the complete `residentAnnualBody` to equal the
entire selected-body projection of `refinementAnnualBody`, including all sample
years, events, scopes, provenance and configured/compiled interval. If the
refinement source is a bundle, Atlas-facing original identity still refers to
the complete bundle; the resident API separately uses its full single-body v2
projection. Different sample sets with only a matching selected row reject.

The selected resident must be present in its complete history. The core invokes
the existing resident allocator with the exact preceding history prefix,
original allocations and decision; the reconstructed record must equal the
selected resident snapshot. This rechecks the full spatial hierarchy, annual
projection/pins, threshold context, clock, cell budgets and authored resident
allocation. Creation requires both the exact composition and resident parent
to remain active. No parent is rewritten or fabricated.

The join explicitly checks exact run provenance, interval, body, lineage, arc,
year, tick, annual outcome, observed arc total and full annual arc summary
including era and event IDs. The record retains that observation separately
from the spatial parent snapshot. Re-exporting identical totals cannot join
different context.

## Keys and explicit replacement

The record retains three distinct keys:

- `anchorObservationKey`: the original adopted composition's key.
- `residentObservationKey`: the exact later resident parent key.
- `observationKey`: a separate hash for this annual child observation. It hashes
  `{kind: "civ-annual-settlement-species-observation-1", provenance, body,
  sampleYear, sourceTick, effectiveNs, lineageId, arcId, atlasBinding}`.

The new key includes the entire declared Atlas binding and exact later instant.
It excludes parent/refinement/source file digests, so a changed parent or
refinement cannot create a second choice for the same child observation. It is
not substituted for either original parent's key.

First choice requires `choice: "choose"`, `replaces: null` and no prior child
choice for that key. A later decision requires `choice: "replace"` and exact
`replaces: {id, recordSha256}` for the active child decision at that key, even
when counts are unchanged. IDs cannot repeat. Cross-observation, absent or stale
replacements reject. Hashes are Civ canonical UTF-8 SHA-256, excluding only
`recordSha256` from the record itself. They are not signatures.

## Explicit destinations and residual conservation

Destination shape and ordering follow the established
[v1 cohort partition](settlement-species-allocation.md#destinations-and-the-two-residuals):
`{regionId, cellId, siteId, kind, settlementId, budget, assignments,
speciesUnassigned}`. Every authored settlement and every cell residual appears,
including zero budgets. IDs/sites/budgets/order must match the later resident
parent exactly. Ordering uses lexical Civ canonical
`[regionId, cellId, kind, settlementId]`.

Assignments are positive sparse `{species: {id, revision}, count}` rows, sorted
and unique by species ID, referencing only exact revisions in the selected
annual policy partition. An omitted assignment is zero located at that
destination. `notLocated` contains one row for every known policy species, in
the same order, including explicit zero counts. Zero policy species totals
remain present in `notLocated`.

BigInt enforces these exact equalities, with canonical decimal strings:

```text
sum(annual known species totals) + annual policy unassigned = annual arc total
sum(all destination resident budgets) = annual arc total
for every destination:
  sum(known assignments) + speciesUnassigned = destination resident budget
for every known species:
  sum(destination counts) + notLocated = selected annual species total
sum(destination speciesUnassigned) = sum(notLocated) + annual policy unassigned
```

`speciesUnassigned` is a destination's resident budget not attributed by this
decision. `notLocated` is known annual policy population not attributed to a
destination. `annual policy unassigned` is the separate arc-wide fixed-policy
residual. A cell residual is residents not assigned to a settlement by the
resident parent. None implies absence, an extra species, physical residence or
a settlement location for an unlocated species. Full unlocation and wholly
unassigned compositions are supported.

## Retained history and staleness

Each record retains the entire refinement, both exact parent record snapshots,
selected sample, derived observation, all seven original byte pin declarations,
separate canonical parsed-source hashes, explicit partition and decision. The
complete original source documents are supplied separately for current review.
The resident parent's `speciesAllocation: "not-assigned"` remains unchanged.

History replay validates closed fields, exact parent presence in complete
histories, fixed flags/meanings, refinement hashes and anchor metadata, every
retained derived row's deterministic apportionment, known gaps/interruption
structure and exact clocks, selected later row/key, residual closure and child
replacement history. It does not claim to reopen missing historical source
originals. Full original-source reconstruction applies to the explicitly
supplied current refinement and resident pair.

`reviewAnnualSettlementSpeciesAllocationLedger(input)` takes the same context
fields, omitting `destinations`, `notLocated`, and `decision`. It reviews all
records and returns current active child choices as `{record, status}`:

- `stale-parent`: the exact anchor composition or later resident has been
  replaced in the complete supplied histories.
- `stale-competing-composition-anchor`: a later active composition for the same
  exact run/arc/binding falls after the retained anchor and no later than the
  allocated year.
- `not-reviewed-other-target`: supplied context is for another exact target.
- `stale-refinement`: the supplied full refinement changed, even when numeric
  counts happen to agree, or its selected row is now unknown.
- `not-reviewed-other-observation`: unchanged refinement, different child sample.
- `stale-source-context`: the selected sample's original/canonical source pins
  differ from the current reconstructed context.
- `current-supplied-sources-only`: exact current parents, same refinement/sample
  and complete supplied source context. It remains authored scenario data.

Review permits a policy-interrupted unknown row only when the supplied complete
resident context can still be reconstructed at that exact sample; it can then
mark old cohorts stale. Missing/contradictory source context rejects instead of
inventing a reviewed status. Creation always requires `derived`. Currentness
is computed outside old hashed records. There is no retargeting, carry-forward,
inheritance or automatic new child choice. Omitting decisions cannot be
detected; the complete supplied histories define the review's scope.

## Explicit CLI and review transport

Use `tools/author-annual-settlement-species.mjs` with a closed request:

```json
{
  "version": "civ-annual-settlement-species-request-1",
  "sources": {
    "refinement": "annual/refinement.json",
    "speciesCompositionLedger": "annual/species-composition-ledger.json",
    "compositionSource": "annual/composition-source.json",
    "refinementAnnualBody": "annual/annual-body.json",
    "spatial": "later-spatial.json",
    "residentAnnualBody": "later-body-projection.json",
    "residentAllocationLedger": "resident/ledger.json",
    "ledger": "annual-cohorts/ledger.json"
  },
  "parents": {
    "refinementSha256": "COPY EXACT FULL REFINEMENT DIGEST",
    "speciesCompositionRecordSha256": "COPY EXACT ACTIVE ANCHOR RECORD DIGEST",
    "residentAllocationRecordSha256": "COPY EXACT ACTIVE LATER RESIDENT RECORD DIGEST"
  },
  "sample": {
    "sampleYear": 1,
    "sourceTick": "0",
    "effectiveNs": "COPY THE EXACT ROW INSTANT"
  },
  "destinations": [],
  "notLocated": [],
  "decision": {
    "id": "annual-cohort:explicit-choice",
    "author": "COPY EXPLICIT EDITOR DECLARATION",
    "policy": {"id": "policy:explicit-cohorts", "version": "1", "rationale": "COPY EXPLICIT POLICY RATIONALE"},
    "rationale": "COPY EXPLICIT EDITOR RATIONALE",
    "choice": "choose",
    "replaces": null
  }
}
```

This is a shape example, not a valid allocation: replace placeholders and supply
every destination/notLocated row from the intended sources. A first child
ledger must explicitly contain
`{"version":"civ-annual-settlement-species-allocation-ledger-1","records":[]}`.
The [fictional arithmetic example](../examples/annual-settlement-species-synthetic-scenario.md)
illustrates the separate residuals without claiming a compiled source.

```powershell
node tools/author-annual-settlement-species.mjs --request annual-cohort-request.json --output-dir out/new-annual-cohort
```

Source paths resolve from the resolved request directory. Command paths resolve
from the invocation directory. The output parent must exist and the target
directory must be new. The shared strict IO reader rejects malformed UTF-8,
BOMs, duplicate decoded keys, unsafe numeric tokens and changing/nonregular
files. It computes all original SHA-256/length pins; callers cannot substitute
declared digests in the request for files.

All parsing, core review, allocation and output composition finish before mkdir.
The fixed outputs are exact original `request.json`, canonical new `ledger.json`,
`annual-settlement-species-review.json`, and `summary.json` written last.
Writes are exclusive, flushed and closed. A failed write leaves partial contents
for inspection; absent summary means incomplete. Retry with a new directory.
Source files and prior ledgers are never overwritten.

The independent review transport has exactly `{version, parents, sample,
inputOriginalBytes, originalRequest, originalSources, ledger}`. Its version is
`civ-annual-settlement-species-review-input-1`. `originalSources` includes all
eight source roles, including the original prior child ledger. `originalRequest`
and each source are `{encoding: "utf8-json-text-parts", sha256, byteLength,
parts}`, split at Unicode scalar boundaries into chunks of at most 32,768
UTF-16 units. Joining parts and encoding UTF-8 recovers exact original bytes
because the reader rejected malformed UTF-8, BOMs and Unicode beforehand.
`inputOriginalBytes` independently retains request and all eight role pins.
`ledger` is the complete new child history. The whole transport must fit 32 MiB.
Historical originals with different pins remain external and are not invented.

Summary identifies the new record, all three observation keys, parents/sample,
actual input pins, exact written output pins and separately named aggregate
`speciesUnassigned`, `notLocated`, and `annualPolicyUnassigned`. It does not hash
itself. The CLI's `originalInputPinsComputed: true` does not rewrite the pure
record's false verification flags or authenticate editor approval.

## Guided annual settlement species editor

Use the optional interactive Node guide instead of hand-writing the complete
request, exact references and residual arrays:

```powershell
node tools/guide-annual-settlement-species.mjs --output-dir out/new-annual-cohort
node tools/guide-annual-settlement-species.mjs --help
```

The guide prompts for all eight existing source originals. Any source can instead
be passed as `--<role> PATH`, using exactly the eight role names in the request
example above. Omitted source/output paths are prompted relative to the invocation
directory. Supply complete composition, resident and annual-child histories,
including replaced records. No empty history is invented; the guide cannot
discover omitted records or coordinate concurrent authors.

The additive pure `inspectAnnualSettlementSpeciesSources` accepts the seven
source roles, `originalSourcePins` and complete child `ledger`. It uses current
parent validators, full child-history replay, the existing annual refiner and
the resident source inspection API. The supplied refinement's own declared
anchor is freshly reviewed; this validates source correspondence and is not an
editor parent selection. The source catalog exposes exact active composition
and resident parents, full later sample clocks, known coverage/gaps and explicit
source/target compatibility. It manufactures no child, decision or partition.

Explicitly select one active composition parent whose digest matches the supplied
full refinement, then one **strictly later derived sample** by its complete
`{sampleYear, sourceTick, effectiveNs}`, then an exact active resident parent.
Source-incompatible, unknown or anchor samples are ineligible. Resident choices
must match the selected source/target/sample and exact annual arc budget. There
is no latest-parent/sample fallback. All choices are paged with explicit indices;
an invalid choice selects nothing else.

`inspectAnnualSettlementSpeciesAllocation` accepts the existing context-only
input (the same fields as ledger review). It freshly recomputes the full
refinement and selected resident/history prefix, requires both exact parents to
be active and replays the child history. It returns the exact context/current
conflict, every settlement and cell-residual destination **identity/budget** and
every exact annual species total. It supplies no authored assignment or residual.
Creation still runs the unchanged full allocator.

There is initially no allocation draft. Type `start empty assignments` explicitly
to create empty sparse assignment lists for all source-derived destinations.
Every settlement and cell residual remains explicit, including zero resident
budgets. No destination is inferred from a species or threshold; no authored
settlement is omitted. Repeating the action requires `reset assignments` and
discards the draft.

`destinations` and `species` page the exact identities/budgets, current located
counts and proposed remainders. `set` explicitly selects a destination and exact
species revision and enters a positive canonical decimal count. It displays
both the destination resident budget and the species' total/located budget
before the edit. Setting an existing pair explicitly replaces that pair's count;
otherwise it adds one sparse row. `remove` selects an existing exact pair and
requires the displayed `remove <id>@<revision>` action. Zero sparse rows are not
allowed; use Remove instead. All arithmetic is BigInt. Over-allocation of either
budget, malformed counts, duplicate row construction or contract resource
overflow rejects rather than clamps. Species revisions are copied only from the
explicitly selected policy row and assignments sort by the existing contract.

Assignment edits never silently change stored residuals and retire **both**
residual approvals. `apply speciesUnassigned` first displays every destination's
assigned sum and proposed resident remainder, then requires a separate exact
`apply speciesUnassigned` confirmation. `apply notLocated` separately displays
every exact known species total, located sum and proposed remainder, including
zero rows, then requires exact `apply notLocated`. The initial empty-assignment
draft also requires both actions before completion.

The separate annual policy unassigned amount remains visible. A resident
`cell-residual` destination's budget is residents not assigned to a settlement
by the parent; it is not `speciesUnassigned` or `notLocated`. The guide does not
merge or reinterpret these amounts. `done` requires both residual approvals after
the last edit and performs complete paged inspection of all destinations,
assignments, species totals and residuals, plus the exact current child conflict.

An initial child requires explicit `choose`; a conflicting active child requires
`replace <current decision ID> <current record SHA-256>`. Enter a new unique
decision ID and explicit author, policy ID/version/rationale and decision
rationale. The guide then displays the **whole allocator result without
truncation**, record digest, separate residual totals and original/output pins.

Only exact `write` permits output. After confirmation, all eight original paths
are freshly reopened using a new bounded reader. Real paths, original hashes and
lengths must match the session's captures, then the unchanged allocator and full
output composition run again. The record and complete summary/output pins must
match the inspected result. EOF, `:cancel`, interruption or another confirmation
value before writing creates no output directory. Output remains exclusive;
partial new directories after write errors remain inspectable.

Both guide and request CLI share `tools/annual-settlement-species-authoring.mjs`.
The request CLI's arguments, original request bytes, four output names/versions,
Unicode-scalar transport chunking, canonical encoding, summary-last ordering and
success message are preserved. Existing allocator conservation/history rules
are unchanged. Source inspection evidence only; no CLI run or runtime check was
performed for this addition.

## Existing Settlement and Atlas import entry points

The guide ends by identifying the existing separate entry points:

- **Settlement Lab:** use its existing `/editor/annual.html` annual-demand
  workspace. Import `annual-settlement-species-review.json`, explicitly select
  the newly appended child digest and complete settlement destination tuple.
  The [annual declaration adapter](../../settlement-lab/docs/annual-plan-authoring.md)
  checks original-byte/declaration correspondence and leaves Civ replay/currentness
  unreviewed. It does not grant plan admission, buildings or physical placement.
- **Universe Atlas:** after loading the intended original envelope, whole annual
  document/bundle and exact original spatial source, open
  `annual-settlement-species-review.json` in **Annual settlement species-cohorts**
  on the selected planet or active Universe import. Its
  [independent annual consumer](../../universe-atlas/docs/annual-settlement-species-import.md)
  reconstructs the originals, refinement, resident parent and explicit child.
  Counts remain current only at the full exact sample instant.

`request.json`, `ledger.json` and `summary.json` are separate outputs and are not
substitutes for the review transport. The existing four-file arc-wide annual
species viewer and legacy v1 cohorts retain separate inputs/state. The separate
annual individual membership workflow requires its own source/context review.
This export creates no people, biological facts, buildings, coordinates,
residence, demographic process, continuity, provider or population authority.

## Bounds and evidence

Each public input field and complete output ledger is bounded to 32 MiB
canonical UTF-8, depth 64, one million values, 250,000 entries per array,
65,536 UTF-16 units per string/key and 32 Mi aggregate text units. Encoded size
is counted while detaching, before combined canonical text allocation. Both
parent histories and the child ledger allow at most 1,024 records. The annual
refiner and resident APIs retain their additional complete-source budgets.
Samples intersect the parent year domain at `0..2,000,000`; exact absolute
instant strings have at most 128 decimal digits.

Per decision: 4,096 cells, 4,096 settlements, 8,192 destinations, 1,024 known
species and 65,536 positive assignment rows. Destination assignments must be
sparse; all cell-residual and zero-budget destinations stay explicit.

CLI originals are limited to 32 MiB for request, refinement, spatial and each
ledger, and 16 MiB for composition/refinement annual/resident annual sources.
The shared reader retains its 192 MiB aggregate original-byte cap, counting
repeated role paths separately. Encoded new ledger, transport and summary each
retain the shared 32 MiB/one-million-node bounds. Individually valid inputs can
exceed combined transport bounds and reject before any output directory exists.

Implementation evidence is static source inspection only. No tests, builds,
typechecks, simulations, browser/device review, network, commits, pushes,
publication, deployment or synchronization ran for this slice. Runtime and
independent consumer review remain outstanding.
