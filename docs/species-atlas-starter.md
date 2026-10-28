# One-command Species counts → Atlas starter

This opt-in local exporter combines two existing Civ operations: an explicit
Species composition adoption and its fixed-policy annual count refinement. It
uses the unchanged [adoption](species-composition-adoption.md) and
[annual refinement](annual-species-population-refinement.md) contracts. It creates
no new population/biology schema, simulation run, residents or physical placement.

The starter retains all five supplied source originals, the original request,
the newly appended complete ledger, and the annual result in one new directory.
Its manifest identifies exactly four files for Atlas. “Source-complete” here
means these listed JSON sources are retained; it does not mean Species asset
closure, a reviewed Atlas envelope, authentic history or consumer acceptance.

## Prepare explicit originals and a decision

Supply the exact original Species composition proposal JSON, the complete Civ
annual document it pins, the complete current composition-adoption ledger,
the complete annual source to refine, and the original Species `bundle.json`
pinned by the proposal. Export/download those original bytes from their owners;
do not replace them with reformatted JSON, a single selected bundle member,
ZIP bytes, hashes copied from a screenshot or a receipt.

Create a request with exactly these root/source fields:

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
| `species-composition-ledger.json` | New canonical complete history including the explicit decision; **Atlas input** |
| `composition-source.json` | Exact original complete source pinned by the adoption; **Atlas input** |
| `annual-body.json` | Exact original complete annual source refined here; **Atlas input** |
| `refinement.json` | Existing canonical annual refinement, no newline; **Atlas input** |
| `manifest.json` | Final completion manifest: source pins, output roles/hashes/lengths, decision/refinement identities and unperformed review boundaries |

First load the separately retained original Atlas authoring envelope and this
exact `annual-body.json` in the intended planet's Civilization observation
panel. The proposal's original envelope/target must match; this exporter neither
loads that envelope nor resolves an Atlas address.

Then, in **Årlige species-counts**, select exactly the four marked Atlas inputs
together, with their filenames unchanged. Select no request, original input
ledger, proposal, bundle or manifest in that four-file picker. Atlas independently
recomputes/reviews the import. Its existing retained-source and target budgets
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
| Existing shared input reader budget | 192 MiB across all role reads (these role caps total 70 MiB including request) |
| New canonical ledger / refinement | 32 MiB each, plus their existing contract budgets |
| Encoded manifest | 1 MiB |
| Composed data files plus final manifest | 160 MiB |

All original paths are captured through the existing reader; no history or
source-file lock is acquired. Later external source changes do not alter the
captured originals already composed for output. There are no hidden source
downloads, defaults, migrations, automatic revisions or repository source changes.
The transport's extra byte checks do not upgrade the unchanged false
verification/effect flags in adoption/refinement records.

Implementation evidence is static source/diff inspection only. No tests,
builds, CLI/help execution, Atlas import, runtime checks, assets, commits,
synchronization, deployment or publication were performed.
