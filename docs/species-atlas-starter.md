# One-command Species counts → Atlas starter

This opt-in local exporter combines two existing Civ operations: an explicit
Species composition adoption and its fixed-policy annual count refinement. It
uses the unchanged [adoption](species-composition-adoption.md) and
[annual refinement](annual-species-population-refinement.md) contracts. It creates
no new population/biology schema, simulation run, residents or physical placement.

The v1 starter retains all five supplied source originals, the original request,
the newly appended complete ledger, and the annual result in one new directory.
Opt-in v2 also retains the exact original Atlas authoring envelope pinned by the
proposal. V3 instead accepts the exact five-entry Species composition ZIP plus
the complete adoption ledger and annual source, retaining the ZIP and extracted
source artifacts. V1/v2 request and output behavior remain unchanged.
All three manifests identify exactly four annual-count files for Atlas. “Source-complete” here
means these listed JSON sources are retained; it does not mean Species asset
closure, a reviewed Atlas envelope, authentic history or consumer acceptance.

## Prepare explicit originals and a decision

Supply the exact original Species composition proposal JSON, the complete Civ
annual document it pins, the complete current composition-adoption ledger,
the complete annual source to refine, and the original Species `bundle.json`
pinned by the proposal. Export/download those original bytes from their owners;
do not replace them with reformatted JSON, a single selected bundle member,
unrelated ZIP bytes, hashes copied from a screenshot or a receipt. The v3
archive is accepted only as the exact Species composition review ZIP described
below.

Create a v1 request with exactly these root/source fields:

```json
{
  "version": "civ-species-atlas-starter-request-1",
  "sources": {
    "proposal": "inputs/species-composition-proposal.json",
    "compositionSource": "inputs/original-composition-observations.json",
    "speciesCompositionLedger": "inputs/complete-current-composition-ledger.json",
    "annualBody": "inputs/original-annual-observations.json",
    "speciesBundle": "inputs/original-species-bundle.json"
  },
  "decision": {
    "id": "decision:my-explicit-species-choice",
    "author": "REPLACE WITH THE ACTUAL SCENARIO AUTHOR",
    "policy": {
      "id": "policy:my-authored-composition-decision",
      "version": "1",
      "rationale": "REPLACE WITH THE AUTHOR'S ACTUAL POLICY RATIONALE"
    },
    "rationale": "REPLACE WITH THE AUTHOR'S ACTUAL DECISION RATIONALE",
    "choice": "choose",
    "replaces": null
  },
  "policy": "fixed-anchor-largest-remainder-contiguous-forward-1"
}
```

To carry the original envelope in the same local packet, explicitly use
`"version":"civ-species-atlas-starter-request-2"` and add exactly one source
field, `"atlasEnvelope":"inputs/original-atlas-envelope.json"`. All other root,
source, decision and policy fields stay the same. A v2 request must supply all
six sources; it never infers or fetches an envelope. The separately named
[v2 request recipe](../examples/species-atlas-starter-v2/README.md) is a template
for actual owner-exported originals, not a captured packet or accepted Atlas
target. Do not adapt the v1 demonstration's fictional binding into a target.

The decision uses the existing closed adoption shape. A first choice requires
`choose`/`null` and no active choice at the exact target. To replace an existing
choice, explicitly supply `"choice":"replace"` and
`"replaces":{"id":"EXACT CURRENT DECISION ID","recordSha256":"EXACT CURRENT RECORD DIGEST"}`.
The tool never selects a latest record, invents a decision, reuses a conflicting
ID or silently replaces a choice. This command always appends one new explicit
decision; use the existing annual exporter to refine an already adopted record
without creating a new decision.

An initial empty ledger is itself an explicitly supplied original file:
`{"version":"civ-species-composition-adoption-ledger-1","records":[]}`.
Use it only when it really is the complete current history. The exporter cannot
discover omitted records, lock a shared history or arbitrate concurrent writers.

## Guided v2 export without hand-authoring request JSON

For the envelope-preserving route, run the Civ-owned interactive guide:

```powershell
node tools/guide-species-atlas-starter.mjs
```

It prompts for the exact original proposal, composition observations, complete
adoption ledger, annual source, Species `bundle.json`, and Atlas authoring
envelope. The equivalent flags are `--proposal`, `--composition-source`,
`--ledger`, `--annual-body`, `--species-bundle`, and `--atlas-envelope`; the
new output directory can be supplied with `--output-dir`. The guide always uses
request v2 and does not require the author to create request JSON by hand.
The Species five-entry `species-civilization-composition-review.zip` is not a
direct guide input. Select its untouched `composition-proposal.json`,
`sources/species-bundle.json`, `sources/atlas-envelope.json`, and
`sources/civilization-observations.json` entries as the four individual source
files. The other two inputs are the complete current Civ adoption ledger and the
annual source to refine. The Species review receipt remains an owner-specific
receipt and does not create or substitute for Civ's adoption decision.

The guide shows source paths and byte pins, the exact proposal observation and
population partition, and any active choice for that observation. It requires
an explicit initial `choose` or an exact current-record `replace`, plus a new
decision ID, author, policy rationale and decision rationale. It never creates
an empty ledger, substitutes a later proposal or supplies authored rationale.
The fixed annual policy is separately acknowledged by typing its complete ID.

Before confirmation, the guide runs the same starter review as the exporter:
the Atlas envelope's original bytes, version and complete binding must match the
proposal; the composition adoption rules must accept the proposed decision; and
the annual refiner must accept the selected sources and fixed policy. It shows
the exact decision identity and target, annual coverage and status counts,
bounded previews of rows/gaps, output pins and the four Atlas annual-count
inputs. The complete adopted record and annual rows are retained in the output
ledger/refinement files. After `write`, it reloads all six originals,
recomputes the complete prepared packet and compares every output byte before
calling the existing exclusive writer. The temporary request is private to the
guide and removed after completion; the exported `request.json` remains in the
starter packet. Cancellation before confirmation creates no starter output.

This guide improves authoring and transport only. The output does not establish
Species biology or asset rights, authenticate the sources, admit the Atlas
envelope or simulate population. Atlas still reviews the original envelope and
annual body in Civilization observation, then independently reviews exactly the
four annual-count files listed in `manifest.json`. Species bundle/GLB review
remains a separate owner-specific workflow.

Atlas's combined starter intake can optionally accept the complete Species Lab
biological package alongside the six Civ originals. Species Lab downloads that
file as `biological-species-package.zip`; Atlas also accepts its own descriptive
alias `species-biological-package.zip`. This ZIP is not a Civ export artifact,
is not included in Civ's manifest, and is not read or charged by Civ. Atlas
independently checks its full artifact closure against the exact Species bundle
digest in the freshly reviewed annual refinement before publishing the combined
import. Omit it for the supported counts-only route. A different or newer
Species bundle does not qualify merely because its IDs match; its original
`bundle.json` bytes must match the refinement pin exactly. See Atlas's
[combined import contract](../../universe-atlas/docs/annual-species-population-import.md#import-a-complete-civ-starter-in-one-selection).

## Guided v3 export from the Species composition ZIP

When the original five-entry Species composition archive is available, the
guide can consume it directly and avoid manually extracting four JSON files:

```powershell
node tools/guide-species-atlas-starter.mjs --composition-packet path\to\species-civilization-composition-review.zip
```

The ZIP path cannot be combined with individual proposal/source path flags. If
the guide is started with those flags and ZIP mode is then selected at the
interactive prompt, it rejects the conflicting inputs instead of silently
ignoring the supplied paths. JSON members inside the ZIP preserve their exact
bytes, including a leading UTF-8 BOM; BOM-prefixed members are rejected just as
they are through the individual-file reader, so exported composition-source
bytes remain acceptable to Atlas's strict annual importer.

An equivalent request for the low-level exporter uses this closed v3 source
shape; its paths resolve relative to the request file:

See the standalone [v3 request schema](../schemas/species-atlas-starter-request-v3.schema.json)
for the closed JSON shape. Runtime path, byte, ZIP, source-pin and domain
validation still happens in Civ's exporter.

```json
{
  "version": "civ-species-atlas-starter-request-3",
  "sources": {
    "compositionPacket": "inputs/species-civilization-composition-review.zip",
    "speciesCompositionLedger": "inputs/complete-current-composition-ledger.json",
    "annualBody": "inputs/original-annual-observations.json"
  },
  "decision": {
    "id": "decision:my-explicit-species-choice",
    "author": "REPLACE WITH THE ACTUAL SCENARIO AUTHOR",
    "policy": {"id": "policy:my-authored-composition-decision", "version": "1", "rationale": "REPLACE WITH THE AUTHOR'S ACTUAL POLICY RATIONALE"},
    "rationale": "REPLACE WITH THE AUTHOR'S ACTUAL DECISION RATIONALE",
    "choice": "choose",
    "replaces": null
  },
  "policy": "fixed-anchor-largest-remainder-contiguous-forward-1"
}
```

Replace every decision placeholder with an actual authored value and use
`replace` plus the exact current decision ID/digest when a choice is already
active. The ZIP supplies the original proposal, three listed source JSONs and
Species receipt; v3 does not read receipt claims as authority.

V3 prompts separately for the complete current Civ adoption ledger and annual
source. It accepts the exact five-entry format documented by Species Lab's
[composition ZIP contract](../../species-lab/docs/civilization-composition.md#reopen-and-edit-guards)
and [receipt schema](../../species-lab/schemas/species-civilization-composition-packet-review-v1.schema.json).
The ZIP uses stored entries with matching local/central headers and CRCs; it is
bounded to 55 MiB and rejects compression, encryption, comments, ZIP64, extra
data and overlap. Its exact member paths and limits are:

| ZIP member | Maximum | Civ handling |
| --- | ---: | --- |
| `composition-proposal.json` | 1 MiB | Strict bounded JSON; checked against actual source pins and the explicit adoption |
| `composition-review.json` | 32 MiB | Bounded UTF-8, unique-key JSON and exact format version; review claims are not trusted |
| `sources/atlas-envelope.json` | 1 MiB | Strict bounded JSON; exact bytes/version/full binding correspondence checked |
| `sources/civilization-observations.json` | 16 MiB | Strict bounded JSON; exact proposal pin and annual refinement input |
| `sources/species-bundle.json` | 4 MiB | Species-aware bounded JSON; exact proposal pin and bundle version checked |

The interactive guide checks the composition, bundle and envelope pins, bundle
and envelope versions, and complete envelope binding before asking the author
for a choose/replace decision and rationale. The request exporter repeats these
checks after that decision and the guide reloads them again before writing.

The proposal and three source JSON members are checked for valid UTF-8, unique
keys and bounded structure. The receipt's review claims are not used or trusted;
it does not create Civ adoption. Civ independently checks the proposal's Species bundle
and Atlas envelope pins, validates the requested
choose/replace decision, and refines the supplied annual source under the same
fixed policy as v2.

The output keeps the exact original ZIP, exact original proposal, three source
documents, both pre- and post-adoption ledgers, annual source, refinement and
the pinned Atlas envelope. Manifest v3 records the ZIP input pin and explicitly
states that the Species review receipt was not trusted. V3 output is capped at
192 MiB to retain both the original ZIP and all existing starter artifacts;
v1/v2 retain their existing 160 MiB output cap. Atlas's established
four annual-count inputs and independent envelope/body review are unchanged.
See the closed [v3 manifest schema](../schemas/species-atlas-starter-manifest-v3.schema.json);
it captures the target body/arc/lineage, Atlas binding, Civ provenance and the
exact adopted species/count anchor. Cross-file hash equality and
completion-marker publication remain runtime concerns.
V1/v2 request contracts and the guided v2 route remain available.

The fixed annual policy string is required separately from the decision's
authored policy/rationale. Its weights include explicit unassigned counts,
largest-remainder BigInt apportionment, and only the contiguous supplied annual
segment forward from a positive anchor. Gaps and interruptions remain unknown.
Species biology and authored validity do not change those weights or counts.

## Export once

From Civilization Lab, using Node 22+:

```powershell
node tools/export-species-atlas-starter.mjs --request starter-request.json --output-dir out/new-species-atlas-starter
```

The [synthetic one-sample demonstration](../examples/species-atlas-starter/README.md)
includes an explicit request and one captured output packet. It documents its
source pins and limits; its fictional Atlas binding is not an accepted Atlas
target and the example is not an Atlas import test. The guided v2/v3 routes above are
the normal operator path when an exact original envelope is available; the
request-based CLI remains available for explicit v1/v2/v3 automation.

The output parent directory must already exist; the target must be new. Relative
source paths resolve from the resolved original request file's directory.
Command paths resolve from the invocation directory. The existing local-path
rules reject URLs, UNC/device aliases, alternate streams and reserved components.

The existing strict bounded reader preserves original bytes, computes SHA-256
and lengths, rejects duplicate decoded keys/BOM/malformed UTF-8 and detects size
or metadata changes during each read. Civ/request numbers retain the existing
canonical safe-integer rules; the existing Species number mode also accepts
finite supported biological-fact values and representation scale numbers.

The actual composition-source hash must match the proposal's
`civilization.observationsSha256`; the actual Species bundle hash must match
`speciesBundle.sha256`, and that JSON must identify `species-authoring-bundle-1`.
This is an exact-byte pin/version check, not a full Species declaration review.
For v2, the exact original envelope SHA-256 must also equal
`proposal.atlas.envelopeSha256`, its version must be
`atlas-civilization-authoring-envelope-1`, and its **complete** `binding` must
equal the validated proposal's `atlas.binding` under Civ's canonical JSON
comparison. Extra/missing binding fields or any differing value reject the
request. These are correspondence checks only: the exporter does not validate
Atlas address grammar, envelope declarations, evidence or referenced fixtures.
The existing adoption API checks the original proposal pin, complete supplied
history, exact observed target/budget and explicit choose/replace decision.

The new complete ledger is encoded with the existing canonical encoder and its
actual byte pin supplies the annual refiner. The unchanged refiner checks that
new active anchor against both complete annual sources, provenance/interval,
overlapping known observations, populations and the explicit fixed policy.
All results, originals and manifest bytes are composed and bounded before the
first output-directory creation. Supplied files remain unchanged.

## Output and Atlas handoff

| File | Role |
| --- | --- |
| `request.json` | Exact original starter request; its source paths are not rewritten |
| `species-composition-proposal.json` | Exact original Species composition proposal |
| `input-species-composition-ledger.json` | Exact original complete history before this adoption |
| `species-bundle.json` | Exact original pinned Species JSON; optional Atlas biology companion |
| `atlas-envelope.json` | **V2/V3:** exact original pinned Atlas envelope, role `original-pinned-atlas-authoring-envelope`; for the earlier Civilization observation import |
| `species-civilization-composition-review.zip` | **V3 only:** exact original five-entry Species packet, retained byte-for-byte |
| `species-composition-ledger.json` | New canonical complete history including the explicit decision; **Atlas input** |
| `composition-source.json` | Exact original complete source pinned by the adoption; **Atlas input** |
| `annual-body.json` | Exact original complete annual source refined here; **Atlas input** |
| `refinement.json` | Existing canonical annual refinement, no newline; **Atlas input** |
| `manifest.json` | Final completion manifest: source pins, output roles/hashes/lengths, decision/refinement identities and unperformed review boundaries |

First load the original Atlas authoring envelope and this
exact `annual-body.json` in the intended planet's Civilization observation
panel. For v1, obtain that separately retained envelope; for v2/v3, use the exact
`atlas-envelope.json` retained in this packet. The proposal's original
envelope/target must match. V2 loads its bytes for correspondence only; Atlas
must independently review the envelope and resolve the selected planet.

V1 emits `civ-species-atlas-starter-manifest-1`; v2/v3 emit their corresponding
versioned manifests. V2 includes the envelope pin under
`inputOriginalBytes.atlasEnvelope`. V3 records the input ZIP pin under
`inputOriginalBytes.compositionPacket`; its retained envelope and ZIP each have
an output artifact role/hash/length. Both set
`atlasPrerequisites.originalAuthoringEnvelope: "atlas-envelope.json"`.
V2/V3 `originalAtlasEnvelopePinMatched` and
`originalAtlasEnvelopeBindingMatched` flags are true, while
`atlasEnvelopeReviewed` remains false and `atlasImportReview` remains
`not-performed`. Neither pin matching nor binding equality claims Atlas acceptance.

Then, in **Årlige species-counts**, select exactly the four marked Atlas inputs
together, with their filenames unchanged. Select no request, original input
ledger, proposal, bundle, envelope, ZIP or manifest in that four-file picker.
All three manifest versions keep `atlasImportFiles` at exactly the same four annual
inputs. Atlas independently recomputes/reviews the import. Its existing
retained-source and target budgets
can still reject an export; the manifest explicitly says Atlas import review
was **not performed**. See the [Atlas reader contract](../../universe-atlas/docs/annual-species-population-import.md).

After successful independent annual import, the optional biology companion
picker can review `species-bundle.json` separately. The starter does not validate
Species definitions/lineage/applicability, resolve assigned species revisions,
load model/evidence artifacts, verify rights or select a representation. Exact
byte correspondence does not establish any biological or historical truth.
This export also does not create a Species composition review ZIP or GLB preview
packet; those owner-specific workflows remain separate.

The original input ledger and appended output ledger are different artifacts.
The refinement pins the exact **output** ledger. Its `refinementSha256` is the
existing canonical record identity; `outputArtifacts.refinement.json.sha256`
is the complete output-file byte hash. Original proposal, ZIP, Species bundle,
ledger-record and output-file digests keep their different meanings.

## Exclusive output, bounds and incomplete writes

The shared writer creates the target directory nonrecursively and every data
file exclusively, then flushes/closes it. A staged
`starter-manifest.pending.json` is also fully written/flushed/closed. Only after
all listed data files succeed does an exclusive atomic hard link publish
`manifest.json`; there is no overwrite or non-atomic fallback. The pending name
is removed after successful publication. If that cleanup fails, the export is
complete and its duplicate staged manifest remains explicitly reported.

Only `manifest.json` is a completion marker. Write/sync/close/link failures leave
the partial new directory and no published marker; a pending manifest is never
completion evidence. Retry with a new directory. The destination filesystem
must support same-directory hard links. Filesystem durability across a machine
or power failure is not established by this source-only implementation.

| Resource | Bound |
| --- | --- |
| Original request / proposal | 1 MiB each |
| Original composition / annual source | 16 MiB each |
| Original complete adoption ledger | 32 MiB |
| Original Species bundle | 4 MiB |
| Original Atlas envelope (v2/v3) | 1 MiB |
| Original Species composition ZIP (v3) | 55 MiB |
| Existing shared input reader budget | 192 MiB across all role reads; v1 caps total 70 MiB including request, v2 caps total 71 MiB including request, v3 caps total 104 MiB including request |
| New canonical ledger / refinement | 32 MiB each, plus their existing contract budgets |
| Encoded manifest | 1 MiB |
| Composed data files plus final manifest | 160 MiB for v1/v2; 192 MiB for v3 |

All original paths are captured through the existing reader; no history or
source-file lock is acquired. Later external source changes do not alter the
captured originals already composed for output. There are no hidden source
downloads, defaults, migrations, automatic revisions or repository source changes.
The transport's extra byte checks do not upgrade the unchanged false
verification/effect flags in adoption/refinement records.

The v1 exporter source received static review. The v1 documented command was also
run once to generate the synthetic packet linked above; its files and manifest
were inspected. No tests, builds, Atlas import, target/runtime checks, assets,
deployment, publication or repository synchronization were performed.
The opt-in v2 addition has static source inspection evidence only; no v2 CLI
execution, output packet, tests, builds or Atlas import/runtime review is claimed.
