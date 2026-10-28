# Individuals at one exact annual settlement sample

`src/annual-settlement-individual-membership.mjs` adds a separate Civ-owned
`civ-annual-settlement-individual-membership-1` record and
`civ-annual-settlement-individual-membership-ledger-1` ledger. Legacy same-year
membership APIs, records, number encodings and hashes retain their meaning.
Species owns biological definitions and individual identities. Civ owns only
the explicit partial scenario enumeration at one later annual observation.

See the [closed ledger schema](../schemas/annual-settlement-individual-membership-ledger-v1.schema.json),
[lossless review transport schema](../schemas/annual-settlement-individual-membership-review-input-v1.schema.json)
and [fictional scenario](../examples/annual-settlement-individual-membership-synthetic-scenario.md).
Schema shape alone cannot establish source joins, hashes, time applicability,
currentness, history prefixes or arithmetic.

## Pure APIs and explicit inputs

`allocateAnnualSettlementIndividuals(input)` and
`reviewAnnualSettlementIndividualMembershipLedger(input)` receive these exact
source fields:

- `refinement`, `speciesCompositionLedger`, `compositionSource`,
  `refinementAnnualBody`, `spatial`, `residentAnnualBody`,
  `residentAllocationLedger`: the complete annual cohort context, with exactly
  the unchanged meanings used by the annual cohort API.
- `annualCohortLedger`: complete separate annual cohort history, including
  replaced child records; never the legacy cohort ledger.
- `compositionSpeciesBundle`: original anchor composition's Species bundle.
- `individualSourceBundle`: separately pinned Species bundle containing the
  selected Individuals. Appended Individuals may change this bundle's original
  digest. They never rewrite the composition or existing profile bundle pin.
- `originalSourcePins`: exactly those ten source-role names, each with original
  `{sha256,byteLength}`. The pure API treats them as supplied declarations;
  only a byte-reading consumer can compare the actual originals.
- `parents:{annualCohortRecordSha256}` explicitly selects one exact child.
- `sample:{sampleYear,sourceTick,effectiveNs}` must equal that child's later sample.
- `ledger`: complete annual membership history, explicitly empty initially.

Allocation additionally requires `target`, `individuals`, `unnamedRemainder` and
`decision`. Target is the complete `{regionId,cellId,siteId,kind:'settlement',
settlementId,species:{id,revision}}` tuple and must select one positive annual
destination/species assignment. Individual references are explicit exact
`{id,revision}` values, sorted by unique individual ID. Decisions retain the
established `{id,author,policy:{id,version,rationale},rationale,choice,replaces}`
shape. `choose` requires null replacement; `replace` pins the exact previous
active decision's ID and record digest. Nothing selects latest revisions.

Creation freshly calls `reviewAnnualSettlementSpeciesAllocationLedger` with all
complete sources and requires the exact selected child to be
`current-supplied-sources-only`. That reviewer reruns the full refinement,
selected-body projection and resident reconstruction. Unknown/gapped annual rows,
stale children or mismatched exact instants cannot create membership.

The additive `reviewAnnualSettlementSpeciesAllocationHistory({
speciesCompositionLedger,residentAllocationLedger,ledger})` reuses the existing
annual record/refinement/hash/replacement validation. It reports known replaced
upstream parents and competing composition anchors; all other active children
are `not-reviewed-source-context`. It explicitly returns
`sourceFreshnessReviewed:false`. A history-only result never grants currentness.

## Separate source bundles and biology

The composition bundle's original SHA-256 must match the anchor proposal's
unchanged `speciesBundle.sha256`. The exact target species definition must be
structurally identical in both supplied bundles. Original byte pins and canonical
parsed pins remain separate; each canonical bundle pin also retains its byte
length. Annual source pins must equal the exact child, and canonical history
pins must match complete retained histories. The same original digest cannot
have conflicting lengths or parsed content across roles/history.

The selected species and every selected Individual must apply at the child's
`sample.effectiveNs`, **not the anchor date**. Applicability is half-open:
`validFromNs <= effectiveNs < validUntilNs`, with null end unbounded and exact
`big-bang-nanoseconds` axis. Individuals must match the exact assigned species
revision and have `identity.kind:'individual'`; representatives/type specimens
cannot be named members. Selected biological snapshots, evidence/provenance and
documented finite numeric facts are retained. This is selected declaration
review, not complete Species artifact closure, identity verification or biology
acceptance. No person or species is created or mutated.

All historical snapshots with the same biological kind, ID and revision must
agree structurally, even after a membership is replaced or stale. Supplied
bundles containing a known historical revision must preserve that snapshot.
When original bundle pins match, all selected snapshots must be present and
their canonical parsed pins must match as well.

## Counts, history and identity conflicts

Each explicitly named Individual consumes one unit:

```text
namedCount + unnamedRemainder = exact annual destination species count
```

Counts use canonical decimal strings and BigInt. Empty enumeration explicitly
means zero named; absent membership remains unknown. Upstream residuals are
copied separately as `destinationSpeciesUnassigned`, `knownSpeciesNotLocated`,
`annualPolicyUnassigned` and `cellResidentUnallocated`. None becomes additional
named or unnamed demand. Child `observationKey`, original `anchorObservationKey`
and later `residentObservationKey` remain distinct and are all retained.

The conflict key hashes `{version,observationKey,target}` with the annual
membership version discriminator. Parent/refinement digests are excluded:
changing those sources cannot evade an existing choice for the same target.
Record and conflict digests use the existing membership canonical JSON number
codec and SHA-256. This does not alter legacy hashes.

Every entry retains complete composition, resident and annual cohort histories.
Each is an exact prefix of the supplied current history, and entry histories
must extend monotonically. After **every append**, active memberships are checked
within that append's retained complete history. Across destinations, bodies,
arcs and species/individual revisions, `(universeSeed,effectiveNs,individualId)`
may be counted once. Known child/upstream replacements or competing composition
anchors can retire an earlier claim in a later append's history. Unknown or
not-reviewed other source contexts cannot release the identity. An illegal past
collision cannot be repaired retroactively by supplying a future replacement.

Review includes full `records` with `replaced` annotations and the current
membership choices in `active`. States distinguish `stale-parent`,
`stale-competing-composition-anchor`, contextual annual `stale-refinement` or
`stale-source-context`, `not-reviewed-other-observation`,
`not-reviewed-other-source-context`, and `current-supplied-sources-only`.
Other bundle/source contexts remain inspectable declarations rather than current
claims. Uniqueness covers only this complete supplied annual membership ledger;
it does not coordinate legacy membership ledgers or external writers.

## Explicit CLI and transport

```powershell
node tools/author-annual-settlement-individuals.mjs --request request.json --output-dir NEW_DIRECTORY
node tools/guide-annual-settlement-individuals.mjs --output-dir NEW_DIRECTORY
node tools/guide-annual-settlement-individuals.mjs --sources source-paths.json --output-dir NEW_DIRECTORY
```

The guided CLI removes manual request JSON, digest copying and exact reference
assembly. It prompts for all eleven source-role paths, including a complete prior
annual membership ledger (explicitly empty for a first decision). Prompted paths
resolve against the invocation directory. Optional `--sources` accepts a **closed
object of exactly those eleven path keys**, identical to a request's `sources`
field, with paths relative to the mapping file. It is a path mapping, not a full
request; it supplies no default child, target, people or decision. `--output-dir`
can also be omitted and entered at its later prompt. Parent directories must
already exist.

After bounded original-byte loading, the guide displays every source pin and
reviews complete annual history. For each active annual child it reruns the full
contextual annual cohort reviewer and the annual membership reviewer. Eligible
choices show exact child digest, body, arc, lineage, Atlas binding, provenance,
sample year/tick/instant and the distinct observation/anchor/resident keys.
Replaced, stale or source-incompatible children carry exclusion reasons. Only a
child with `current-supplied-sources-only` cohort status can be selected. The guide
requires an explicit numbered choice, even when there is only one.

It next lists positive settlement/species assignments, checking the exact species
definition occurs identically in both bundles and applies at that later sample.
Individual candidates retain their exact ID and revision and show a reason for
eligibility or exclusion: exact species, individual identity kind, biological
declaration/interval, or an identity reservation elsewhere in the complete annual
membership ledger. Known retired parent/competing-anchor claims release identities;
unknown other contexts still reserve them. The target's existing choice can be
replaced explicitly. Choosing multiple revisions of one individual ID is rejected.
Enter comma-separated candidate numbers, or exact `none` to explicitly name zero.
Candidate declaration review does not establish biological truth or real identity.

The guide displays the exact named/unnamed count equation and requires the author
to enter its canonical decimal unnamed remainder. A new target requires explicit
`choose`; an existing target requires `replace RECORD_SHA256` with the exact
displayed active digest. It then collects a fresh decision ID, author and policy/
decision rationales. The unchanged allocator reviews the complete proposed append
and all history before the guide shows the final target, people, decision, all
four distinct upstream residuals and resulting record digest.

Nothing is written until exact `write` confirmation. The guide then creates a
fresh input reader, reloads the optional mapping and all eleven sources from their
originally selected paths, compares both resolved real paths and original byte
pins, and reruns allocation/encoding. Any changed source aborts the operation;
restart with current inputs. The four artifacts use these freshly captured bytes.
Source changes after that capture cannot alter the captured output snapshot.
Enter `:cancel` at any prompt, Ctrl-C, or end input before confirmation to stop
without creating an output directory. Any confirmation other than `write` also
cancels. After writing starts, the existing partial-output I/O semantics apply.

Both CLIs share `tools/annual-individual-authoring.mjs` for bounded source reads,
allocation, transport construction, encoding and exclusive output writing. The
explicit CLI retains its arguments, exact original request bytes, output names,
summary fields and success message. The guide creates a canonical request with
absolute source paths; all prompts stay under `tools/`, outside deterministic
`src/`. No source ledger is updated in place and no missing source is synthesized.

The closed `civ-annual-settlement-individual-membership-request-1` request has
exactly `version,sources,parents,sample,target,individuals,unnamedRemainder,decision`.
`sources` contains all ten source-role paths above plus the prior membership
`ledger` path. Paths resolve relative to the request. The existing local IO
boundary rejects URLs/device paths/nonregular files, detects changed file sizes
and metadata, strictly decodes UTF-8 and rejects duplicate decoded keys. Bundles
and membership snapshots use the existing path-specific biological numeric codec.
No source is written back and no simulation is run.

Outputs are `request.json` (exact original bytes), `ledger.json`,
`annual-individual-membership-review.json` and `summary.json` last. The review
transport's version is
`civ-annual-settlement-individual-membership-review-input-1`; it retains original
request plus **all eleven source originals**, including prior membership history,
as bounded UTF-8 text parts that never split surrogate pairs. Original pins,
explicit parents/sample/target and complete appended ledger are included.
A future independently owned consumer must reopen/hash/strictly parse every
original, rerun allocation against the original prior histories, and compare the
entire result. Saved flags or parsed equality cannot substitute for original bytes.

The output directory must be new and its parent must exist. Creation is exclusive
and nonrecursive; each child is opened exclusively. Encoding failures happen
before directory creation. I/O failures may leave partial new contents; no rollback
is claimed. `summary.json` is written last as the completion artifact.

Limits reject rather than truncate: 1,024 history records; 4,096 named Individuals;
16 MiB per bundle and annual-body/composition source; 32 MiB ledger/transport and
other source roles; depth 64, one million JSON values, 65,536 units per string/key,
32 MiB aggregate JSON text per public field, and 192 MiB aggregate request/source
original bytes in the CLI. The pure boundary also limits aggregate canonical
parsed input to 192 MiB. Composed transport may exceed its cap even when inputs
individually fit; the whole operation is rejected.

## Claims and evidence

The result remains partial authored scenario membership, `atlasPlacement:'not-bound'`.
All source, identity, biological, residence, history, simulation and demographic
verification/effect flags are false. No complete census, physical residence,
continuity, migration, evolution or population provider is established. Historical
originals with different pins remain external; retaining their snapshots is not
source freshness review. This transport itself is not an Atlas reader. The
separate [Settlement Lab arrangement-2 contract](../../settlement-lab/docs/settlement-individual-arrangement-v2.md)
joins the membership transport with an exact plan and cohort transport; the
[Atlas named-individual preview](../../universe-atlas/docs/annual-settlement-individual-preview.md)
then independently reviews the sidecar and can show selected existing GLBs as
illustrations. That downstream view does not grant population or residence
authority. The [cross-project handoff guide](../../species-lab/docs/annual-settlement-handoff.md)
lists the full source sequence and exact artifact roles.

Implementation evidence for the membership implementation is static
source/document inspection only. No tests, builds, schema/runtime/browser
execution, network or publication ran. The downstream links above document
separately owned consumers; they do not change this transport's contract.
