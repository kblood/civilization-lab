# Civ-owned Species composition decisions · v1

`src/species-composition-adoption.mjs` gives Civilization Lab an explicit first
acceptance boundary for one Species Lab composition proposal. Acceptance means
**an authored scenario annotation at one exact supplied annual observation and
arc**. The separate opt-in [annual species refinement](annual-species-population-refinement.md)
can validate an adopted anchor through this API and derive a bounded fixed-weight
partition of supplied annual totals. Default simulation/annual exports do not
invoke adoption.
It changes no simulation or population state and establishes no continuity,
historical membership, biological truth or complete species census.

This boundary owns the decision to use a partition in a scenario. Species Lab
continues to own species identity/revision, biology, lineage, visual definitions,
and composition proposal authoring. The decision never rewrites their proposal
or automatically selects a newer species revision.

## Inputs and exact target

`adoptSpeciesComposition(input)` accepts exactly these parsed JSON fields:

- `proposal`: the closed `species-civilization-composition-proposal-1` object.
- `civilization`: the complete parsed annual single-body v2 document or
  multi-body v1 bundle named by the proposal.
- `proposalPin`: `{sha256, byteLength}` for the original proposal bytes, supplied
  as declarations. It is not a digest of a reformatted JSON serialization.
- `decision`: an explicit `{id, author, policy, rationale, choice, replaces}`.
  `policy` contains `{id, version, rationale}`. The author and human rationale
  are declarations supplied by the scenario editor; this module cannot
  authenticate a human, obtain their approval, or invent their decision.
- `ledger`: the complete current `{version, records}` ledger. An initial empty
  ledger must be supplied explicitly; there is no implicit replacement/default.

The core checks bounded plain JSON, closed proposal fields, exact proposal
revision and source pins, full Civ provenance equality, configured interval,
body/year/source tick, observed status, and the exact lineage/arc budget. Source
years, bundle body IDs and row arc IDs must be sorted and unique. Duplicate
observation years or body members are rejected rather than resolved with a
first-match policy. All supplied members/rows are checked for the supported
annual structure, totals, era and event-reference consistency. This is not full
event semantics validation or inspection/model replay.

The configured end year can be an explicitly supplied terminal observation. Its
source tick is the preceding decade, as in the annual export contract. No
interpolation, carry-forward, population growth or interval coverage is inferred.
The absolute instant must equal the proposal's declared origin plus its exact
sample year multiplied by `31557600000000000` nanoseconds.

Assignments retain exact species IDs/revisions, lexical ordering and authored
rationales. BigInt arithmetic requires assignments plus explicit `unassigned`
to equal the supplied arc budget exactly. `unassigned` means **not attributed by
this proposal**. It is not an inferred unknown species, biological absence,
uninhabited population, or permission to discard the remainder. Empty assignments
with the whole budget left explicitly unassigned are valid. The closed
`populationMeaning` field retains this interpretation in every stored record.
Individual examples are never counted or extrapolated.

This first acceptance boundary does not load the Species bundle or Atlas
envelope. Their hashes and binding fields are retained as declarations;
species definition existence/applicability and the physical Atlas address remain
unverified. A future source-complete tool must perform those owner-specific
checks explicitly before claiming them.

## Inspect the exact target without a decision

`inspectSpeciesCompositionAdoption({proposal,civilization,proposalPin,ledger})`
is an additive pure inspection API. It reuses the same bounded JSON/proposal/pin
checks, complete observation selection, observation conflict key and full ledger
replay as adoption. It returns `parsed-composition-target-inspected`, the exact
proposal/observation/key, and `currentChoice`: the exact active record for that
key, or explicit null. It creates no trial decision, does not append history and
does not mutate inputs. Its detached frozen result keeps all verification/effect
flags false. Proposal pins remain supplied declarations at this pure boundary.

This API can expose a replacement conflict before an author supplies a new
decision. Re-exported single/bundle sources retain the existing conflict-key
meaning; a current choice is never found by last array position or newer revision.
The complete supplied ledger remains the only history the API can know.

## Decision ledger and replacement

The version is `civ-species-composition-adoption-ledger-1`; each appended record
has version `civ-species-composition-adoption-1`. The core returns a fresh frozen
`{record, ledger, active}` result. It does not mutate the supplied ledger or
persist files. `reviewSpeciesCompositionAdoptionLedger(ledger)` independently
checks stored records and replays choice/replacement rules, returning active
records sorted by their observation conflict key.

The conflict key includes complete declared Civ run provenance, body, sample
year, source tick, lineage and arc. It deliberately excludes the source JSON
file hash and single/bundle format. Re-exporting one run into another file or
switching between a bundle and a single-body export cannot create a second
active choice for the same observation. A different declared run is a different
target; no migration or historical continuity between runs is implied.

An initial `choice: "choose"` requires `replaces: null` and no current record
for that exact observation. Any subsequent decision for it requires
`choice: "replace"` and `replaces: {id, recordSha256}` pinning its currently active
decision. The target must belong to that same observation, including when the
new partition is numerically identical. Stale, missing or cross-observation
replacement targets and reused decision IDs are rejected. The old record stays
in the ordered ledger. Record order is the authored decision sequence, not
universe chronology, and is never used to infer historical membership.

`recordSha256` hashes the Civ canonical parsed record excluding `recordSha256`
itself. It detects altered record content and pins replacement targets; it is
not a signature, the source proposal byte hash, or a proof of authenticity.
There is at most one active choice per observation **in the supplied ledger**.
The caller must load and atomically persist the complete ledger; this pure
module cannot discover omitted records or arbitrate concurrent file writers.

```js
import {adoptSpeciesComposition} from '../src/species-composition-adoption.mjs';

const result = adoptSpeciesComposition({
  proposal, civilization, proposalPin,
  decision: {
    id: 'decision:editor-choice-1',
    author: humanEditorName,
    policy: {
      id: 'policy:authored-single-observation', version: '1',
      rationale: humanPolicyRationale
    },
    rationale: humanDecisionRationale,
    choice: 'choose', replaces: null
  },
  ledger: {version: 'civ-species-composition-adoption-ledger-1', records: []}
});

// A replacement uses the actual current record and a newly authored decision.
const current = result.active.find(entry => entry.observationKey === targetKey);
const replaced = adoptSpeciesComposition({
  proposal: newlySelectedProposal, civilization, proposalPin: newlySelectedPin,
  decision: {
    id: 'decision:editor-choice-2', author: humanEditorName,
    policy: humanReplacementPolicy, rationale: humanReplacementRationale,
    choice: 'replace',
    replaces: {id: current.decision.id, recordSha256: current.recordSha256}
  },
  ledger: result.ledger
});
```

## Verification limits and artifacts

All `verification` fields in every adoption record are fixed to `false`, including
`sourceBytesVerified`. Parsed-data comparison cannot prove that supplied hashes
match original files, that a proposal snapshot is the content of its pinned
bytes, that a source is authentic, or that a Species review receipt was valid.
No receipt supplied by another lab is treated as acceptance authority.

The pure module performs no original-byte IO. The explicit request CLI and
guided tool below hash their selected original proposal, Civ and ledger JSON,
reject ambiguous JSON and compare the original Civ digest to the proposal pin.
They do not load the Species bundle/biological ZIP or original Atlas envelope,
and do not promote the record's verification flags. Complete source verification
still requires those owner-specific sources. Byte correspondence does not
establish biological truth, model replay or provenance authenticity.

## Guided local adoption

```powershell
node tools/guide-species-composition.mjs
node tools/guide-species-composition.mjs --proposal inputs/composition-proposal.json --civilization inputs/annual-body.json --ledger inputs/composition-ledger.json --output-dir out/composition-choice-001
```

The guide prompts for any omitted path, all relative to the invocation directory.
Supply the exact original Species `composition-proposal.json`, its complete
original single-body v2/multi-body v1 observation document and a complete adoption
ledger, including replaced records. An initial empty ledger must be a deliberately
supplied file; the guide never invents empty history or obtains another ledger.
Source limits remain 1 MiB proposal, 16 MiB Civ and 32 MiB ledger. Existing local
path/regular-file/UTF-8/duplicate-key/bounded integer JSON rules apply through
`population-decision-io.mjs`.

After source review, the guide displays original pins, exact body/sample/tick/
instant/arc and source context, all exact species revision counts/rationales,
unassigned remainder, and the current active choice. It requires explicit
`choose` for a first decision, or `replace DECISION_ID RECORD_SHA256` matching
the displayed active record exactly. Author a fresh decision ID, author, policy
ID/version/rationale and decision rationale. No decision identity or replacement
is generated automatically and no species allocation is edited by this guide.

The unchanged `adoptSpeciesComposition` reviews the complete proposed append.
The guide shows the concrete resulting record and digest, then requires exact
`write`. A new input reader reloads all three originals from the selected paths;
changed SHA-256, length or resolved real path aborts before output. Adoption and
encoding run again and must yield the same record digest before exclusive output.
Captured fresh bytes supply that operation; a later source change cannot alter
the already captured record. This is no concurrent-history arbitration.

Outputs are the existing `request.json`, complete `ledger.json` and `summary.json`
last, in a new directory whose parent must exist. The guide's request is canonical
JSON with absolute source paths. The shared `tools/species-composition-authoring.mjs`
also serves the explicit request CLI's composition mode; its original request
bytes, output names/schema/encoding and success message are unchanged. Other
population CLI modes retain their existing implementation. Original sources are
not copied into these three artifacts and must be retained separately.

`:cancel`, Ctrl-C, EOF before confirmation or a confirmation other than `write`
stops without creating an output directory. Encoding/review failures precede
directory creation. Once writing starts, an I/O failure can leave a partial new
directory; summary-last is the existing completion marker, not a rollback promise.
This flow verifies no biological existence/applicability, original Atlas envelope,
rights, source authenticity, complete external history or simulation population.

Guided-tool/inspection additions received static source/document inspection only.
No tests, checks, builds, browser/runtime work, Git operations or publishing ran.

## Shared artifacts and historical evidence

The standalone, closed
[`schemas/species-composition-adoption-ledger-v1.schema.json`](../schemas/species-composition-adoption-ledger-v1.schema.json)
describes stored ledgers without sibling-repository schema dependencies. Runtime
checks additionally enforce bounded JSON, cross-field identity, tick rules,
BigInt conservation, parsed-data hashes and exact replacement semantics.

[`examples/species-composition-adoption-ledger.json`](../examples/species-composition-adoption-ledger.json)
is an illustrative output generated from Species Lab's fictional composition
and annual observation examples. Its author/policy are fictional declarations,
not an actual user acceptance. Its partition remains 40 + 35 + 30 = 105. The
proposal byte pin was calculated while producing the example, but every stored
verification flag remains false because the core does not perform that check.
There is no runtime dependency on those sibling files.

Limits: 10,000 ledger records, 1,024 assignments per proposal, 10,000 annual rows
per body, 256 bundled bodies, 4,096 arcs per row, decimal counts up to 4,096
digits, and aggregate JSON budgets (1,000,000 nodes, depth 64, 32 MiB text).
The lower aggregate bound may reject a structurally valid but large ledger.
No truncation or rescaling is performed.

Earlier core implementation evidence, recorded before the guided/inspection
additions: `node --check src/species-composition-adoption.mjs` exited 0 and the
example generation command completed successfully. No fresh execution supports
the additions above; they received static source/document inspection only.
