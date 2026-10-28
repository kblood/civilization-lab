# Authored settlement individual membership

Civ owns these membership decisions. Species Lab continues to own biological
species and individual definitions. A decision explicitly enumerates existing
exact Species individual revisions inside one positive settlement-species
cohort at one exact supplied observation. It changes no biological definition,
simulation population, physical residence, history or Atlas placement.

An absent membership attachment means **unknown**. An authored empty enumeration
means zero named individuals and an explicit unnamed remainder equal to the full
cohort species count. Even an enumeration with zero unnamed remainder establishes
no complete census or verified identity, residence or historical membership.

## API and exact inputs

`src/settlement-individual-membership.mjs` exports
`allocateSettlementIndividuals` and `reviewSettlementIndividualMembershipLedger`.
Both are deterministic, pure parsed-data boundaries: no file reads, source
parsing, ambient clocks, randomness, latest-revision lookup or simulation.

The closed review input has exactly these fields:

```js
{
  spatial, annualBody, compositionSource, speciesBundle, originalSourcePins,
  speciesCompositionLedger, residentAllocationLedger, cohortLedger,
  parents: {cohortRecordSha256}, ledger
}
```

`allocateSettlementIndividuals` adds exactly `target`, `individuals`,
`unnamedRemainder`, and `decision`. The three Civ sources are complete parsed
artifacts accepted by the existing cohort API. `speciesBundle` is the complete
parsed `species-authoring-bundle-1`; its exact original SHA-256 must be the
selected composition proposal's `speciesBundle.sha256`. Source species and
individual arrays must have unique `(id, revision)` pairs. Unselected biological
documents and representations are retained source context, not newly validated
biology or imported assets. Selected species and individuals undergo the closed
snapshot and temporal checks below.

`originalSourcePins` has exactly `spatial`, `annualBody`, `compositionSource`,
and `speciesBundle`, each exactly `{sha256, byteLength}`. These are **caller
declarations** in the pure core. The composition original hash must also equal
the exact selected proposal's `civilization.observationsSha256`. The CLI derives
all four pins from actual, strictly parsed source bytes; it never accepts a
user-authored hash in their place. Original-byte hashes, canonical parsed-source
hashes and canonical record hashes remain separate identities. None authenticates
the author or proves that declared biology is true.

All three complete current parent histories are required, including replaced
records. `parents.cohortRecordSha256` selects one existing exact cohort record.
Creation requires that cohort to be active and its composition and resident
parents also to remain active. The existing contextual cohort reviewer rebuilds
the exact selected parent records against complete parsed spatial, annual body
and composition sources. No parent or source is selected implicitly.

The exact target is:

```json
{
  "regionId": "COPY EXACT REGION ID",
  "cellId": "COPY EXACT CELL ID",
  "siteId": "COPY EXACT SITE ID",
  "kind": "settlement",
  "settlementId": "settlement:example",
  "species": {"id": "species:example", "revision": 1}
}
```

It must match one existing settlement destination and one positive species
assignment there. Cell resident residual destinations cannot receive named
settlement membership. The selected species reference includes its exact
revision. `individuals` is a sorted array of exact `{id, revision}` references;
IDs must be strictly increasing, irrespective of revision. Every reference must
resolve to an existing individual in the supplied exact bundle. Representatives
and synthetic type specimens are rejected, including representative identity
fields masquerading as an individual. Each chosen definition must have exactly
`identity: {kind: "individual"}` and exactly the assigned species revision.

The selected species and every individual must contain the selected composition
proposal's exact `temporal.effectiveNs` in their declared half-open
`[validFromNs, validUntilNs)` interval; a null end is open. The already validated
composition clock binds that instant to the exact Civ sample year and source
tick. Neither interval inference nor date rounding is used. Exact selected
biological snapshots are preserved without changes in `sourceEvidence`.

Every individual contributes exactly one. Using BigInt arithmetic:

```text
namedCount = number of unique selected individual IDs
namedCount + explicit unnamedRemainder = selected destination species count
```

Counts are canonical decimal strings. An omitted remainder, over-budget named
list, altered destination budget, mismatched species revision or out-of-interval
definition rejects the whole operation. No rounding or automatic residual fill
occurs. `upstreamResiduals` retains four separate parent values:
`destinationSpeciesUnassigned`, `knownSpeciesNotLocated`, `proposalUnassigned`,
and `cellResidentUnallocated`. None is relabelled as unnamed cohort membership.

## Histories, replacements and simultaneous identities

The initial ledger is exactly:

```json
{"version":"civ-settlement-individual-membership-ledger-1","records":[]}
```

Every record version is `civ-settlement-individual-membership-1`. Decisions use
the existing closed `{id, author, policy, rationale, choice, replaces}` shape.
Choose uses `replaces: null`. Replacement uses a fresh decision ID and pins the
active membership decision's exact ID and record SHA-256. The membership conflict
key hashes the exact observation key and complete target, including exact species
revision. Replacement cannot switch destination, observation or species revision.
An unchanged target still requires replacement after its cohort parent changes.
A different exact species revision is a new explicit target and choice; nothing
automatically follows the latest revision.

Each membership record retains the **complete** composition, resident and cohort
histories supplied at its creation, plus its explicit parent digest, original
source byte pins, canonical source pins and exact selected source snapshots.
Those retained histories must be exact prefixes of the latest supplied histories.
Across membership records the retained parent histories must also advance as
monotone prefixes: a later entry cannot roll its context backward or silently
drop a retained replacement.

After each membership append, uniqueness is checked against that entry's retained
parent-active context. For every still-current claim, the tuple
`(universeSeed, exact effectiveNs, individual ID)` may occur only once across all
active destination/species decisions. A second individual revision cannot count
the same identity twice. Under unchanged parents, moving a name to another
destination therefore requires first explicitly replacing its old enumeration,
for example with empty plus the full unnamed remainder. Replacing one membership
record removes its prior enumeration before the duplicate check.

An explicit cohort or upstream replacement invalidates old claims: records whose
exact cohort or upstream parents are no longer active are `stale-parent` and
consume no current named units. Historical duplicate checks still run at every
retained context where both claims were current. This lets an ID be explicitly
chosen under a new active cohort/species revision without permanently stranding
it in a stale enumeration. Reusing the old parent digest never refreshes it.

Contextual review labels unchanged records `current-supplied-sources-only`,
`not-reviewed-other-observation`, or `not-reviewed-other-source-context` as
appropriate. Records using the supplied original bundle hash are also compared
against its canonical parsed pin and exact selected definitions, including
replaced membership records. Other original bundles are retained pins awaiting
independent source review. Complete supplied histories are caller-owned: this
contract cannot discover omitted external decisions or arbitrate concurrent
edits to separate histories.

## Standalone schema, transport and bounds

The closed standalone schema is
`schemas/settlement-individual-membership-ledger-v1.schema.json`. It embeds the
closed parent record definitions and Species snapshot definitions, with no
external schema references. Runtime checks additionally enforce exact parent
activity, monotone prefixes, digests, temporal containment, sorted IDs,
simultaneity and BigInt budget conservation.

The [population authoring CLI](population-decision-cli.md#individuals) exposes
`mode: "individuals"` and writes `individual-membership-review.json`. Its
`civ-settlement-individual-membership-review-input-1` transport is a future
independent consumer boundary, not an implemented Atlas importer. It carries the
new complete membership ledger, complete current parent histories, explicit
parent selection, original input pins and four original source byte sequences.
Each original is encoded as exactly
`{encoding: "utf8-json-text-parts", sha256, byteLength, parts}`. Parts contain at
most 32,768 UTF-16 units and split only between Unicode scalar values.

The CLI reader first validates fatal UTF-8, rejects BOMs and malformed Unicode,
and rejects duplicate decoded JSON keys. Only because of those checks does
joining the parts and encoding UTF-8 reproduce the exact original bytes,
including whitespace and final newlines. An independent consumer must perform
its own bounded reconstruction, length/hash comparison, strict parsing and
parent/source checks. Original source files for earlier records remain necessary
when their pins differ; this transport retains the four current originals and
all historical pins, not an archive of every historical source file.

The core retains the existing depth-64, one-million-node, 65,536-unit token and
32 MiB canonical JSON limits. Membership and each parent ledger have at most
1,024 records; a membership has at most 4,096 named individuals. Species bundles
have at most 1,024 species, 4,096 individuals and 4,096 representations; bundle
original and canonical pins are capped at 16 MiB. Original spatial is at most
32 MiB; annual body and composition originals are at most 16 MiB. The CLI retains
the 192 MiB aggregate input-role limit and its 32 MiB combined output artifact
limit. Embedded complete histories and original source transport can hit that
combined limit before individual inputs do. The whole operation rejects rather
than truncates. The membership path uses its own finite-number codec for Species biology
fact values and `representations[].coordinates.metersPerUnit`. These paths can
retain finite JSON fractional values, including JSON exponent spellings, without
additional quantization. Nonfinite numbers, negative zero and integer-valued JS
numbers outside the safe integer range reject. All identity/revision/time/count
checks remain unchanged. Requests and non-Species source documents still require
canonical safe-integer numeric tokens; embedded ledger exceptions are limited to
`sourceEvidence` biological fact values. Original Species bytes are preserved.

Membership canonical parsed-source pins and record hashes use sorted object keys,
original array order and `JSON.stringify` number spelling. For every previously
supported integer-only value this is byte-for-byte the existing Civ canonical
encoding, so prior membership hashes remain valid. This codec is isolated in
`src/membership-json.mjs`; generic Civ canonical APIs remain integer-only. Original
byte pins continue to identify the exact source spelling/whitespace separately
from parsed canonical pins. The CLI reparses cached bytes using each requested
role's numeric policy, so a finite Species parse cannot relax another role.

All stored verification and effect flags remain false. `atlasPlacement` remains
`not-bound`. A hash comparison proves agreement with a supplied declaration;
it establishes no source authenticity, rights, true identity, biological fact,
complete membership, physical residence, continuity, migration or history.

This implementation has no test, build, simulation, browser/device, consumer
integration or deployment evidence. Source inspection is not a runtime pass.
