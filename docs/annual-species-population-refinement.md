# Opt-in annual species population refinement · v1

Civilization Lab owns a separate, deterministic refinement of its actual supplied
annual arc populations using an explicitly selected active species composition
decision. `src/annual-species-population-refinement.mjs` exports
`refineAnnualSpeciesPopulation(input)` and returns a frozen
`civ-annual-species-population-refinement-1` artifact. The separate export CLI
provides an explicit runnable entry point. The simulation and default annual
exports do not invoke it.

This is an authored fixed composition policy over supplied model populations.
It supplies per-species counts that conserve each observed arc total. Counts do
not describe species-specific reproduction, births, deaths, migration,
inheritance, evolutionary causation, continuous membership or a complete census.
It creates no settlement residents or physical planet rendering. Species Lab
continues to own species definitions and exact revisions.

## Explicit export

Create a request with exactly these fields, replacing the digest with the actual
intended active record digest:

```json
{
  "version": "civ-annual-species-population-request-1",
  "sources": {
    "speciesCompositionLedger": "composition/ledger.json",
    "compositionSource": "original-composition-observations.json",
    "annualBody": "annual-observations.json"
  },
  "compositionRecordSha256": "COPY THE EXACT ACTIVE COMPOSITION RECORD DIGEST",
  "policy": "fixed-anchor-largest-remainder-contiguous-forward-1"
}
```

```powershell
node tools/export-annual-species-population.mjs --request annual-species-request.json --output-dir out/new-annual-species-export
```

The output parent directory must already exist; the target must be new. Relative
source paths resolve from the resolved request file's directory. Command paths
resolve from the invocation directory. Source paths are local files, using the
existing [population decision IO](population-decision-cli.md) path restrictions.
The complete composition ledger must be explicit. No latest record or newest
species revision is selected automatically.

The CLI computes original SHA-256 and byte length from each actual bounded file.
It rejects a composition source whose original hash differs from the selected
adoption proposal's `civilization.observationsSha256`. The complete original
composition source, including a whole bundle when named, must be supplied.
The annual source can be a single-body v2 document or multi-body v1 bundle from
the same exact run provenance and interval. It may contain a different set of
supplied years; it must include the anchor and reconstruct its exact arc,
population, era, event IDs and source tick. A different run or a different
compiled interval rejects. Shared known observation years for the selected body
must agree exactly across the two sources; a `not-inspected` row makes no known
population claim. To refine additional years, export those years from
the same compiled run; this does not extend or rerun that simulation.

All parsing, review, refinement and output composition finish before creating
the directory. The fixed output files are:

| File | Meaning |
| --- | --- |
| `request.json` | Exact original request bytes |
| `species-composition-ledger.json` | Exact original complete supplied composition history |
| `composition-source.json` | Exact original source pinned by the chosen composition |
| `annual-body.json` | Exact original complete annual source used for the refinement |
| `refinement.json` | Canonical Civ JSON refinement, no newline |
| `summary.json` | Completion artifact, written last; original input pins and exact output byte pins |

Files use exclusive creation and are flushed and closed. A write failure retains
partial contents; an absent summary means incomplete. Retry with a new directory.
This does not update source files or lock the supplied composition history.

## Guided annual-count export

```powershell
node tools/guide-annual-species-population.mjs
node tools/guide-annual-species-population.mjs --ledger inputs/composition-ledger.json --composition-source inputs/original-composition-observations.json --annual-body inputs/annual-observations.json --output-dir out/new-annual-species-export
```

The guide prompts for any omitted path, relative to the invocation directory.
Supply all three complete existing source documents; no history or source is
created implicitly. It hashes/strictly parses them through the existing bounded
`population-decision-io.mjs` reader, then replays the composition ledger once and
lists its active anchors with exact record/decision IDs, body, arc, lineage,
sample/tick/instant, declared target/provenance, species revision counts and
explicit unassigned share. Zero-budget anchors are displayed as ineligible.
Positive-budget candidates show whether the supplied original composition source
hash matches, but their annual source joins have not yet been reviewed. Listing
candidates does not run the refiner.

Choose one listed positive anchor explicitly and acknowledge the complete
`fixed-anchor-largest-remainder-contiguous-forward-1` policy identifier. The
guide explains its fixed species/unassigned weights, BigInt apportionment and
contiguous forward-only segment. It runs the unchanged refiner for that selected
anchor only. A source/anchor mismatch or failure ends the operation; it never
selects the latest record, switches anchors or retries a different candidate.

Before writing, the guide shows the selected parent/target/anchor, inclusive
coverage, derived sample extent, first interruption, complete unknown rows and
explicit missing-year gaps, all false verification/effect flags and exact input/
output pins. Record `refinementSha256` and the original `refinement.json` file
hash remain separate identities. Counts outside the contiguous segment stay
unknown; no biological applicability or species demography is inferred.

Exact `write` confirmation is required. A new reader reloads all three selected
paths and compares real paths, original SHA-256 and lengths. The same explicitly
selected refinement is recomputed and every shown output-file pin must agree
before the existing six artifacts are written exclusively, with summary last.
Changed originals abort before directory creation; captured fresh bytes supply
the export even if the source changes after that capture. There is no concurrent
history arbitration or source-file locking. `:cancel`, Ctrl-C, EOF before
confirmation or any confirmation other than `write` creates no output directory.
I/O failures after writing starts retain the existing partial-directory semantics.

The guide creates canonical request JSON with absolute source paths. Both annual
export commands share `tools/annual-species-population-export.mjs`; the explicit
request command keeps its arguments, original request/source bytes, six artifact
names/order, canonical encoding, summary fields and success message. The core
refiner is unchanged. Original source/request/output caps remain as documented
below, including the 1 MiB generated request cap and 32 MiB encoded output cap.

After a successful guided write, select exactly these four export files in Atlas:
`refinement.json`, `species-composition-ledger.json`, `composition-source.json`
and `annual-body.json`. `request.json` and `summary.json` remain separate authoring
and completion artifacts. This export establishes no Atlas admission, biological
truth, source authenticity, continuous membership, residence or simulation effect.

## Pure input and parent checks

The API input has exactly `{speciesCompositionLedger,
compositionRecordSha256, compositionSource, annualBody, sourcePins, policy}`.
`sourcePins` has exactly `speciesCompositionLedger`, `compositionSource` and
`annualBody`, each `{sha256, byteLength}`. These are declarations in the pure
API; the CLI computes them. A digest of reformatted JSON is a different original
identity. `policy` must be the exact explicit policy string above.

The existing adoption ledger reviewer validates every stored record and replays
replacement history. The requested record must still be active in that complete
supplied ledger. An omitted history cannot be discovered. The source is checked
again through the existing full adoption source validator. That validates all
supplied source members/rows, ordering, totals, arc identities, era/status,
event references, clock and anchor. A private initial choice is used only for
validation; no adoption is appended, replaced or persisted. Original parent
decision ID, record digest and proposal remain unchanged, including when the
parent was an explicit replacement.

The annual source undergoes the same complete structural checks against the
selected proposal's run provenance, configured interval, body, lineage, arc and
anchor budget. Its original file identity can differ from the composition
source's identity. The selected anchor must have a positive population. A zero
anchor cannot supply composition weights and rejects.

## Arithmetic and temporal policy

Every exact species ID/revision retains its anchor count as an integer weight;
the explicit `unassigned` count is a separate category with the same treatment.
For each derived annual arc total `N`, the algorithm computes each category's
`N * weight / anchorBudget` using BigInt quotient and remainder. It distributes
the remaining units by descending remainder, ties by ascending canonical
species identity, with `unassigned` after species. Output assignments retain
the proposal's species order. All counts are decimal strings; assignments plus
`unassigned` equal the actual supplied arc total exactly. Zero rows/categories
are retained. Individual definitions, examples and representatives are not
population weights.

Refinement starts exactly at the anchor and proceeds forward only through
consecutive supplied integer years in which the exact arc is present. A missing
year, an uninspected row, an absent exact arc, or another active composition
anchor for the same exact run, arc and declared Atlas binding ends the segment.
No implicit policy choice overrides that other anchor. Later supplied rows stay
unknown even if the arc reappears. Another explicit refinement request may use
another suitable active anchor. Source rows before the anchor are outside this
refinement. Years after the last supplied row are outside coverage and unknown.

`rows` lists only supplied years from the anchor onward, in ascending order.
Each row is exactly `{year, effectiveNs, sourceTick, status, reason,
observedArcPopulation, population}`. `status: "derived"` uses `reason: null` and
`population: {budget, assignments, unassigned}`; each assignment is exactly
`{species: {id, revision}, count}`. Unknown rows use a reason and
`population: null`; `observedArcPopulation` retains the exact observed arc total
when supplied, otherwise null. An absent arc does not establish zero population.
Unknown rows are never interpolated or assigned zero counts.

`gaps` contains sorted inclusive missing year ranges
`{fromYear, untilYear, status: "unknown", reason: "years-not-supplied"}` between
the anchor and the last supplied sample. `coverage` declares that inclusive
scope and that only listed samples and explicit gaps are covered. Each row's
absolute instant follows the original declared origin plus the exact year times
`31557600000000000` nanoseconds. This temporal calculation does not verify the
Atlas binding.

## Provenance and Atlas handoff

The refinement contains the selected parent record/decision and observation key,
the three original source byte pins, separate canonical parsed-source SHA-256
pins, the retained species bundle digest, exact anchor composition and instant,
declared Atlas binding, Civ run provenance and exact body/arc/lineage identities.
`refinementSha256` hashes canonical UTF-8 bytes of all other refinement fields.
It is distinct from the original file SHA-256 in the summary. `summary.json`
does not hash itself. Its flags state that the export CLI computed actual input
pins and matched the composition source; the pure artifact's source-byte
verification flag remains false.

Species definitions are not loaded. Their existence and applicability are
unknown; exact IDs/revisions remain references. All scientific and simulation
effect flags are false. The source validator checks parsed consistency and
declared provenance, rather than replaying model inspections or authenticating
authors. A structurally consistent forged source is not authenticated by a hash.

The separate [Atlas annual species consumer](../../universe-atlas/docs/annual-species-population-import.md)
now reads these four CLI originals against the exact current annual/envelope
bytes, reviews the complete composition history, recomputes the entire artifact,
and shows fixed-policy counts at exact samples on selected planet and active
Universe import panels. It retains unknown gaps and unknown species applicability;
it does not create a provider, inhabitants or a physical planet rendering.
A later parent replacement makes an old result stale relative to an updated
supplied ledger; files are not monitored automatically. That consumer has static
source review evidence, with runtime review outstanding.

### Compare multiple authored anchors in Atlas

Atlas also has a separate **Flere årlige species-ankre** workspace. It can
compare up to eight independently exported refinements when every export uses
the exact same complete composition-ledger bytes and annual-body bytes, and all
refinements target the same run, body, arc, lineage and Atlas binding. Each
entry still needs its own four original export files. The composition-source
original and selected Species bundle pin may differ between entries.

For a comparable collection, finish the adoption ledger and annual-body export
first, then export each chosen positive anchor against those unchanged source
files. Import the first refinement's four originals into Atlas, then add each
other four-file set in that workspace. If the ledger or annual-body export
changes between refinements, their original bytes no longer match and Atlas
rejects the collection; export all desired anchors again from the same final
sources. The collection reports each fixed policy separately at exact supplied
samples. It does not select the newest policy, add counts, interpolate, or
assert that an anchor transition is evolution, migration or demographic
change. It does not feed settlement cohorts or membership automatically.
For any entry, Atlas can separately review the exact Species bundle named by
that refinement to show declared species names, intervals and lineage beside
the counts; this does not verify biology or load a visual representation.
For a visual illustration, the adjacent Species composition inspector can
independently reopen the exact adopted packet and its biological ZIP and preview
one explicitly chosen representation at that packet's own sample instant. It
does not attach that GLB to the annual counts or claim planet occurrence. On the
planet panel, opening the inspector from an annual series passes the anchor
digest and highlights a packet only when its active Civ record and proposal
match; representation selection remains explicit.

See Atlas's [multi-anchor import contract](../../universe-atlas/docs/annual-species-population-import.md#compare-several-authored-annual-anchors)
for its freshness, conflict, unknown-gap and memory limits.

The separate [annual settlement species decision](annual-settlement-species-allocation.md)
can explicitly partition one later derived row among exact resident destinations.
It requires a new authored decision and full source reconstruction. Existing
adoption, v1 cohort and individual ledgers remain unchanged; nothing propagates
automatically to them.

## Bounds and implementation evidence

Original files are capped at 1 MiB for the request, 32 MiB for the ledger, and
16 MiB each for the two complete annual sources. The strict shared IO reader
rejects malformed UTF-8, BOMs, duplicate decoded keys, unsafe numeric tokens and
changing/nonregular files. It retains its 192 MiB aggregate cap. The pure input
snapshot has depth 64, one million nodes, 50,000 entries per array, 65,536 UTF-16
units per string/key, and 32 Mi combined text units. The adoption APIs retain
their additional bounds. Derived sample/category entries are capped at 100,000
before allocation. A bounded per-sample plan first applies the exact gap,
competing-anchor, not-inspected and absent-arc rules. It stores source references,
row reasons/instants and actual gap endpoints, without category arrays or output
rows. Both sizing and final construction use that same plan; only its derived
samples count toward the category-entry cap. A separate conservative 32 MiB
encoded-size preflight runs before constructing any derived category arrays or
output rows. It counts static metadata and the final digest, repeated exact
species identity text, the maximum
count digits permitted by each planned derived total, row fields, JSON
punctuation, and the exact unknown rows and actual gaps. Static fields are counted
without allocating a combined serialization. Unknown rows never reserve species
partitions. The count digit bound can still conservatively reject an output
whose actual apportioned counts would have used fewer digits.
Composed CLI outputs retain the shared one-million-node, depth/text and 32 MiB
encoded bounds. Oversized operations reject in full.

Implementation evidence is source inspection only. No tests, builds, typechecks,
simulation runs, browser/device checks, commits, remote sync or deployment were
performed for the original refiner slice. An independent Atlas consumer is now
implemented as described above; runtime review remains open.
