# Population decision authoring CLI

For later derived annual membership, use the separate
[`author-annual-settlement-individuals.mjs` workflow](annual-settlement-individual-membership.md#explicit-cli-and-transport).
It has distinct request/ledger/review versions and separate composition and
individual source bundles. The legacy commands documented below are unchanged.

Run from Civilization Lab with Node 22 or newer. No dependencies are required.
This opt-in local command appends one explicit authored scenario decision using
the existing [composition](species-composition-adoption.md),
[resident](settlement-resident-allocation.md), or
[cohort](settlement-species-allocation.md), or
[individual membership](settlement-individual-membership.md) pure API.

```powershell
node tools/author-population-decision.mjs --request authoring/composition-request.json --output-dir out/composition-choice-001
node tools/author-population-decision.mjs --request authoring/residents-request.json --output-dir out/residents-choice-001
node tools/author-population-decision.mjs --request authoring/cohorts-request.json --output-dir out/cohorts-choice-001
node tools/author-population-decision.mjs --request authoring/individuals-request.json --output-dir out/individuals-choice-001
node tools/author-population-decision.mjs --help
```

Create `out` beforehand. Each selected output directory must be a new entry;
existing files, directories and symlinks are errors. `--help` works alone. Both
other flags are required exactly once; unknown flags and positional arguments
are errors. Paths on the command line resolve from the invocation directory.
Paths in `sources` resolve from the real request file's directory, including
when the request is named through a symlink. Paths are limited to 4,096 UTF-16
code units. Absolute local paths are accepted. URLs, UNC/network paths, device
namespaces, drive-relative paths, alternate data streams, NULs, malformed
Unicode and reserved Windows path components are rejected. Input paths are
resolved to their real local file before opening; use regular files only.
Directories and special files are rejected after opening their file descriptor.

Prepare complete source artifacts and ledgers beforehand and retain them after
authoring. The command does not export observations, compile a simulation,
contact another lab, fetch a newer species revision, infer allocations, choose
parents, fill in residuals or obtain editor approval. All decision fields are
supplied declarations. Supply the complete current history, including replaced
records; the command cannot discover omitted records or arbitrate concurrent
edits to independently supplied histories.

## Closed requests

Every request has `"version": "civ-population-decision-request-1"`. The following
tables give the complete allowed root and source keys. Every source value is a
local filename, never an embedded document or digest declaration. Unknown and
missing keys are errors.

| Mode | Exact request root keys | Exact `sources` keys |
| --- | --- | --- |
| `composition` | `version`, `mode`, `sources`, `decision` | `proposal`, `civilization`, `ledger` |
| `residents` | `version`, `mode`, `sources`, `target`, `allocations`, `decision` | `spatial`, `annualBody`, `ledger` |
| `cohorts` | `version`, `mode`, `sources`, `parents`, `destinations`, `notLocated`, `decision` | `spatial`, `annualBody`, `compositionSource`, `speciesCompositionLedger`, `residentAllocationLedger`, `ledger` |
| `individuals` | `version`, `mode`, `sources`, `parents`, `target`, `individuals`, `unnamedRemainder`, `decision` | `spatial`, `annualBody`, `compositionSource`, `speciesBundle`, `speciesCompositionLedger`, `residentAllocationLedger`, `cohortLedger`, `ledger` |

Every `decision` has exactly this shape. Replace the editor and rationale
placeholders with an explicit declaration of the intended decision; these
sample declarations are not actual approval.

```json
{
  "id": "decision:my-explicit-choice-001",
  "author": "REPLACE WITH THE DECLARED EDITOR",
  "policy": {
    "id": "policy:single-observation",
    "version": "1",
    "rationale": "REPLACE WITH THE EDITOR'S POLICY RATIONALE"
  },
  "rationale": "REPLACE WITH THE EDITOR'S DECISION RATIONALE",
  "choice": "choose",
  "replaces": null
}
```

An initial decision requires `choice: "choose"` and `replaces: null`. An existing
choice for the exact observation requires a new decision ID, `choice: "replace"`
and `replaces: {"id": "<current decision ID>", "recordSha256": "<current record digest>"}`.
Pin the actual current record. A numerically identical partition still requires
replacement. An empty ledger is an explicit source file containing exactly
`{"version":"<mode ledger version>","records":[]}`, with the appropriate version:

| Mode | Initial ledger version |
| --- | --- |
| `composition` | `civ-species-composition-adoption-ledger-1` |
| `residents` | `civ-settlement-resident-allocation-ledger-1` |
| `cohorts` | `civ-settlement-species-allocation-ledger-1` |
| `individuals` | `civ-settlement-individual-membership-ledger-1` |

### Composition

For example, save this request in `authoring/composition-request.json`, replace
its decision declarations, and supply the three referenced original files:

```json
{
  "version": "civ-population-decision-request-1",
  "mode": "composition",
  "sources": {
    "proposal": "../inputs/composition-proposal.json",
    "civilization": "../inputs/annual-body.json",
    "ledger": "../inputs/composition-ledger.json"
  },
  "decision": {
    "id": "decision:composition-001",
    "author": "REPLACE WITH THE DECLARED EDITOR",
    "policy": {
      "id": "policy:single-observation",
      "version": "1",
      "rationale": "REPLACE WITH THE EDITOR'S POLICY RATIONALE"
    },
    "rationale": "REPLACE WITH THE EDITOR'S DECISION RATIONALE",
    "choice": "choose",
    "replaces": null
  }
}
```

`proposal` must be the complete Species composition proposal. `civilization`
must be its complete named single-body export or multi-body bundle, including
all supplied observations and events. The CLI hashes the original proposal
bytes itself and passes that `{sha256, byteLength}` as `proposalPin` to
`adoptSpeciesComposition`. No user-supplied proposal digest is accepted. It
also requires the original civilization file SHA-256 to equal
`proposal.civilization.observationsSha256`. Reformatting those original Civ
bytes changes their hash even if their parsed JSON is identical. The API checks
the complete parsed source and exact target; no member or year is auto-selected
by the CLI.

For guided composition decisions, use:

```powershell
node tools/guide-species-composition.mjs --proposal inputs/composition-proposal.json --civilization inputs/annual-body.json --ledger inputs/composition-ledger.json --output-dir out/composition-choice-001
```

Any omitted path is prompted, relative to the invocation directory. All three
existing originals and complete history are required; an empty ledger is never
created implicitly. The pure `inspectSpeciesCompositionAdoption` API exposes the
exact target/current choice without a fabricated decision. The guide displays
body/sample/arc and species/count/unassigned declarations, requires explicit
choose or the displayed exact active decision ID/digest for replacement, and
collects every author/policy/rationale field. It shows the concrete proposed
record/digest before requiring exact `write`. It then reloads the original
proposal, Civ source and ledger, compares hashes/lengths/real paths and reruns the
unchanged adoption before writing the same three artifacts. Cancellation/EOF
before confirmation writes nothing. Source originals stay separate and must be
retained. The guide does not read the Species biological ZIP or Atlas envelope.

Both composition commands share `tools/species-composition-authoring.mjs` for
the existing source digest comparison, pure adoption, encoding and exclusive
output. The request CLI keeps its existing arguments/original-request bytes,
summary fields, filenames and success text. Resident/cohort/individual modes
are unchanged. See [guided adoption and limits](species-composition-adoption.md#guided-local-adoption).

### Residents

Use `mode: "residents"`, the three source filenames from the table, and the same
explicit `decision` shape. `target` is exactly
`{body, sampleYear, sourceTick, lineageId, arcId}`: year is a safe integer number
and tick is a decimal string. Copy those exact identities from the supplied
observed spatial arc. `allocations` is the complete authored array documented
in [resident allocation](settlement-resident-allocation.md#api-and-explicit-input).
Each region has `{regionId, cells}`; every cell has exactly
`{cellId, siteId, unallocated, settlements}`. Each settlement has exactly
`{id, residents, rationale}`. Provide every region and all sixteen cells in
each region, with explicit residuals even for zero-population cells, sorted
as required by the API.

The CLI passes precisely
`{spatial, annualBody, target, allocations, decision, ledger}` to
`allocateSettlementResidents`. The complete single-body spatial and annual
sources must match their canonical parsed pins and full projection. This
resident API does not accept a bundle in place of its annual body source.
All population counts are decimal strings and are conserved using BigInt.
`unallocated` remains residents not assigned to a settlement.

For a guided resident editor, use:

```powershell
node tools/guide-settlement-residents.mjs --spatial inputs/annual-spatial.json --annualBody inputs/annual-body.json --ledger inputs/resident-ledger.json --output-dir out/residents-choice-001
```

Omitted source/output paths are prompted relative to the invocation directory.
The guide uses decision-free source/history inspection, explicit target choice,
paged exact regions/cells and authored settlement add/edit/remove operations.
No initial partition is implicit: type `start with all cell budgets unallocated`.
Counts, IDs and rationales are explicit; residuals are shown and applied only by
a separate `apply residuals` action/confirmation. Final inspection covers every
cell and settlement row, then explicit choose or exact current-record replacement
and all decision metadata are required. Exact `write` triggers fresh source
real-path/hash/length checks and the unchanged allocator before exclusive output.

The shared `settlement-resident-authoring.mjs` preserves this request mode's
arguments, original request bytes and existing three artifact formats/encoding,
residual summary and success message. Other modes retain their behavior.
See the [guided resident workflow](settlement-resident-allocation.md#guided-local-resident-editor)
for commands, cancellation, complete-history requirements and narrow claims.

### Cohorts

Use `mode: "cohorts"`, all six source filenames from the table, and the same
explicit `decision` shape. Supply `parents` exactly as:

```json
{
  "speciesCompositionRecordSha256": "<actual selected composition record SHA-256>",
  "residentAllocationRecordSha256": "<actual selected resident record SHA-256>"
}
```

The placeholders above are invalid until replaced by the two intended digests.
Both parents must already be active in the complete supplied histories. The
CLI never chooses the last record, a first match or a newer revision.
`compositionSource` must be the complete original source named by the selected
composition record, including the whole bundle when it names a bundle. After
`allocateSettlementSpecies` identifies and validates the explicitly selected
parents, the CLI compares that source file's original SHA-256 with the selected
composition parent's `proposal.civilization.observationsSha256` and rejects a
mismatch before writing any output.

Supply the complete `destinations` and `notLocated` arrays documented in
[partial cohorts](settlement-species-allocation.md#destinations-and-the-two-residuals).
Every destination is exactly
`{regionId, cellId, siteId, kind, settlementId, budget, assignments, speciesUnassigned}`.
Include every settlement and every cell residual, even at zero budget; retain
the parent's exact identities, ordering and budgets. Positive sparse
assignments and every known species' explicit `notLocated` row use exactly
`{species: {id, revision}, count}`. Do not omit known species with zero
`notLocated`. The pure API checks both histories, parent reconstructions,
the full source projection, exact observation joins and both residual axes.

`speciesUnassigned` is destination residents not attributed to a species;
`notLocated` is adopted known species counts not attributed to a destination.
The proposal's arc-wide `unassigned` is retained too. None establishes absence,
an extra species, migration, continuity or a complete census.

### Individuals

Use `mode: "individuals"`, all eight source filenames from the table, the same
explicit decision shape, and `parents` exactly
`{"cohortRecordSha256": "<actual selected cohort record digest>"}`. Creation
requires the selected exact cohort and its upstream parents to be active in the
complete supplied histories. Include every replaced record. The selected source
bundle must already contain the intended exact species and individual revisions;
this command creates no individuals or representatives.

The additional request fields are exactly:

```json
{
  "target": {
    "regionId": "COPY EXACT REGION ID",
    "cellId": "COPY EXACT CELL ID",
    "siteId": "COPY EXACT SITE ID",
    "kind": "settlement",
    "settlementId": "settlement:example",
    "species": {"id": "species:example", "revision": 1}
  },
  "individuals": [{"id": "individual:example", "revision": 1}],
  "unnamedRemainder": "9"
}
```

These placeholders do not constitute a valid request. Copy the existing exact
destination, species and individual identities and calculate the explicit
remainder from the selected positive cohort species count. `individuals` must be
sorted by unique ID. Each selected definition must have exactly
`identity: {kind: "individual"}`, the exact assigned species revision and an
interval containing the exact observation. The selected species interval must
contain that instant too. Representatives, missing revisions, out-of-interval
definitions, stale parents, invalid replacements, duplicate simultaneous IDs
through other active destinations/revisions and nonconserving counts reject.

The CLI hashes original `speciesBundle` and `compositionSource` bytes through
its existing strict input reader. The core compares those pins against the
selected composition proposal's `speciesBundle.sha256` and
`civilization.observationsSha256`; no digest can be supplied in the request in
their place. Reformatting either source changes its original hash. It passes
the four original source pins, complete parsed sources, three complete current
parent histories and exact requested fields to `allocateSettlementIndividuals`.
The core rebuilds the selected cohort's upstream parent context and preserves
original-byte and canonical-source identities separately.

Named count plus the explicit unnamed remainder equals the selected destination
species count using BigInt. The separate `destinationSpeciesUnassigned`,
`knownSpeciesNotLocated`, `proposalUnassigned`, and `cellResidentUnallocated`
values retain their parent meanings. `individuals: []` authors zero named
individuals with the full cohort count as the remainder. An absent membership
attachment means unknown. Neither case establishes complete membership,
physical residence or history.

Membership record snapshots retain all three complete parent histories. Their
contexts must advance as monotone prefixes. At every membership append,
simultaneous identity uniqueness uses that retained context's active parents.
An explicit parent replacement makes older membership claims stale and releases
their current named units. Under unchanged parents, a duplicate identity still
rejects, and changing the enumeration at the same exact target requires an exact
replacement. See the [membership contract](settlement-individual-membership.md)
for the exact stale and revision rules.

The added `individual-membership-review.json` has exactly
`{version, parents, parentHistories, originalSources, inputOriginalBytes, ledger}`.
Its version is `civ-settlement-individual-membership-review-input-1`.
`parentHistories` contains the complete current `speciesCompositionLedger`,
`residentAllocationLedger`, and `cohortLedger`. `originalSources` contains
`spatial`, `annualBody`, `compositionSource`, and `speciesBundle`, each exactly
`{encoding: "utf8-json-text-parts", sha256, byteLength, parts}`. Parts preserve
the original UTF-8 source text in chunks of at most 32,768 UTF-16 units, splitting
only between Unicode scalar values.

Joining those chunks and encoding UTF-8 reconstructs exact original bytes only
because the reader already used fatal UTF-8 and rejected malformed Unicode and
BOMs. An independent consumer must recheck length/hash and strictly parse them.
`inputOriginalBytes` retains original request and every source-role pin, and
`ledger` is the complete new membership history. Historical source pins remain
in records; a different historical original must still be supplied separately.
This is a future independent review boundary, not an implemented Atlas import.
Its whole combined encoded artifact must fit the existing 32 MiB limit.

## Output and failure behavior

All parsing, bounds, pure API calls, original-source comparisons and output
composition finish before creating the output directory. The command then
creates that directory without recursive parent creation and writes fixed child
names with exclusive creation. Each file is flushed and closed before the next.

| Artifact | Contents |
| --- | --- |
| `request.json` | Exact original request bytes, preserving whitespace and newline |
| `ledger.json` | Exactly `result.ledger`, serialized as Civ canonical UTF-8 JSON without a newline; complete history including the new record |
| `atlas-cohort-review.json` | Cohorts only: the existing Atlas review transport below |
| `individual-membership-review.json` | Individuals only: complete current histories, complete membership ledger, original pins and four lossless current source byte sequences |
| `summary.json` | Written last as the completion artifact; original input pins, output pins, created record digest, exact observation and residual totals |

The summary version is `civ-population-decision-summary-1`. It contains `mode`,
`observationKey`, `observation`, `recordSha256`, `inputOriginalBytes`,
`outputArtifacts`, and `residualTotals`. Composition and residents copy the
created record's observation; cohorts copy the created record's embedded
composition parent's exact observation. Individuals copy their selected cohort's
composition parent's exact observation. `inputOriginalBytes` maps `request`
and every source role to its original `{sha256, byteLength}`. `outputArtifacts`
maps the preceding output filenames to their exact written byte pins; summary
does not hash itself. Residual totals are decimal strings: composition
`unassigned`; residents aggregate `unallocated`; cohorts aggregate
`speciesUnassigned`, aggregate `notLocated`, and `proposalUnassigned`. Individuals
retain `namedCount`, `unnamedRemainder` and the four separately named upstream
residual values documented above.

The cohort transport is exactly the existing
[Atlas input](../../universe-atlas/docs/settlement-allocation-import.md):
`{version: "atlas-settlement-cohort-review-input-1", residentAllocationLedger,
speciesCompositionLedger, compositionSource, parents, ledger}`. It preserves
both complete supplied histories, the complete supplied composition source,
the explicit requested parent digests and the new complete cohort ledger. It
contains no spatial or annual body artifact: Atlas independently imports those
sources first. The combined transport must fit its own bounds; individually
valid sources can still exceed them.

The command exits nonzero on any failure. Pre-write failures create no output
directory. A failure after directory creation leaves its partial contents for
inspection. An absent summary means the directory is incomplete; choose a new
directory when retrying. Do not treat this as an atomic update of an existing
ledger or a lock on the supplied histories. Source artifacts and the original
ledger files are never overwritten. The request copy still references the
original source paths. The individuals review transport retains the four current
source originals; the other modes do not make a portable source archive, and
earlier historical originals with different pins remain external.

## Bounds and verification limits

Original UTF-8 byte limits are 32 MiB for the request, spatial source and each
ledger; 16 MiB for civilization, composition source, annual body and the
individuals mode's Species bundle; and 1 MiB
for the proposal. Aggregate original bytes for the request plus every source
role are capped at 192 MiB, counting repeated paths per role. A repeated resolved
pathname is opened and read once. Files changing during a read are rejected.

Before generic JSON objects are materialized, recursive parsing rejects
duplicate decoded object keys (including escaped aliases), empty/BOM input,
malformed UTF-8, lone surrogates, negative zero, unsafe integer values, leading
zeroes and trailing content. Fractional/exponent numeric tokens reject outside
the membership-only Species value paths described below. Each document is
limited to depth 64, one million values, 250,000 entries per array, 65,536 UTF-16
units per string or key, and 32 Mi UTF-16 units of combined string/key text.
Composed outputs have the same structural limits and a 32 MiB canonical UTF-8
cap. The existing APIs impose additional bounds, including complete source
structure, counts, ledger lengths and canonical parsed bytes. Limits reject
whole operations without rounding, interpolation, carry-forward or truncation.

Original file byte pins in the summary describe the actual files read by this
tool. Original hashes, canonical parsed-value hashes and canonical record hashes
remain different identities. The source comparisons above check exact byte
agreement with supplied declarations; they do not authenticate their authors.
Stored verification and effect flags remain exactly as the pure APIs produced
them, including `sourceBytesVerified: false`. Individuals mode loads the explicitly
named Species bundle and checks selected definitions and applicability intervals;
it does not authenticate source authorship or biological truth. The tool does not
load an Atlas envelope, independently verify biology, replay history,
authenticate human approval, place a settlement, mutate population or establish
continuity. An Atlas consumer must perform its own import checks.

This addition has no test-run or runtime integration evidence. JavaScript syntax
checking, if reported separately, does not verify an authoring request or an
Atlas import. No test, build, simulation, browser/device review, commit, remote
sync, publication or deployment is part of this command's implementation work.

### Species numeric values in individual membership

Only `mode: "individuals"` enables the membership Species number codec. Biology
fact values and representation `coordinates.metersPerUnit` in the original
`speciesBundle` may be finite JSON fractions; existing membership ledger
`sourceEvidence` fact values use the same rule. NaN, Infinity, negative zero and
unsafe integer-valued numbers reject. Requests, parent histories, annual,
spatial and composition inputs retain strict canonical safe-integer numeric
tokens. Reusing a local pathname under another role reapplies that role's policy.

Outputs preserve original Species bytes in text parts. Membership parsed pins
and record hashing encode finite numbers with `JSON.stringify`, sorted object
keys and original array order, preserving all previous integer-only encodings.
No simulation float arithmetic or generic Civ canonical serializer changed.
