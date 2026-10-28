## 2026-10-28 — Guided Species composition ZIP request v3

- Added a Civ-owned bounded reader for Species' exact deterministic five-entry
  composition archive and a v3 starter request/manifest. The original ZIP and
  source members are preserved and pinned; its review receipt is explicitly
  untrusted. The annual Atlas transport remains the established four files.
- The interactive guide accepts `--composition-packet`, requires the complete
  Civ ledger and annual source, checks source pins and envelope correspondence
  before requesting a decision, and compares the first review's source pins to
  its parsed inputs before preview and again before write. V1/v2 contracts stay
  intact. V3 output has a 192 MiB cap to retain both the input ZIP and extracted
  source artifacts. Static code inspection only; no tests or runtime checks ran.
- Added standalone closed JSON schemas for the v3 request and output manifest,
  documenting the request shape, exact body/arc/lineage/binding and adopted
  species/count anchor, fixed output artifact names, four Atlas inputs, receipt
  trust boundary and runtime-only cross-file checks.

## 2026-10-28 — Opt-in starter v2 retains its pinned Atlas envelope

- Added the separately versioned six-source v2 request and manifest. The
  original Atlas envelope is capped at 1 MiB; exact bytes must match the
  proposal's envelope SHA-256, identify the expected version, and have the
  same full binding as the validated proposal. These are correspondence
  checks; `atlasEnvelopeReviewed` remains false.
- Retains `atlas-envelope.json` with the role
  `original-pinned-atlas-authoring-envelope` for the earlier Civilization
  observation import. The annual `atlasImportFiles` list remains exactly four
  files. Existing v1 request/output/demo behavior is preserved. Reader/output
  caps remain 192/160 MiB; v2 role caps including request total 71 MiB.
- Added a separately named v2 template recipe, without generating a packet or
  repurposing the captured fictional v1 example. Static source inspection only;
  no tests, exporter execution, checks, builds, assets, commits, publishing or
  repository synchronization were performed for this addition.

## 2026-10-28 — One-command original-source Species counts starter

- Added `tools/export-species-atlas-starter.mjs` with a closed explicit request
  for the original composition proposal, complete source/history/annual JSON,
  exact Species bundle, authored decision and fixed annual policy. Existing
  strict readers compute real original pins; existing adoption/refinement APIs
  append the decision and derive conserved annual counts without simulation.
- Retains all originals and emits the exact four Atlas import files plus a
  bounded role/hash manifest. Every byte is composed before exclusive new-dir
  output. The final manifest is published by an exclusive atomic hard link
  after all files are flushed/closed; incomplete writes leave no published
  completion marker. Added only fixed starter names to the shared IO allowlist.
- Documented request, output roles, Atlas prerequisites, original-vs-new ledger
  identity, bounds and independent Species/Atlas review limits. Added a
  fictional one-sample example and generated its captured packet with the
  documented CLI; the manifest and output roles were inspected. No tests,
  builds, Atlas import/target/runtime checks, sibling edits, deployment,
  publication or repository synchronization were performed. The Civ repository's
  local-only rule remains in force.

## 2026-10-28 — Documentation index and handoff refreshed

Reconciled the Civilization README, annual settlement/species guides, and
improvement-loop handoff with the current source-backed documentation in this
repository. This is a documentation-only update; related implementation work
remains in the working tree and is not part of this docs commit. No tests,
builds, CLI/runtime checks, deployment or publication were run.

## 2026-10-28 — Named-individual handoff boundary recorded

The annual membership export remains Civilization Lab's exact, source-pinned
roster decision. Settlement Lab's separate arrangement-2 consumes the selected
membership transport together with its exact cohort transport and plan, then
partitions every named reference among existing plan instances or an explicit
unassigned list. The handoff preserves the Civ unnamed remainder, plan
unallocated demand, per-instance unnamed-attribution remainder and all upstream
residuals as distinct values. It does not replay Civ history or establish
currentness, residence, actors or physical placement.

Universe Atlas's separate reader requires fresh independent review and only
shows explicitly selected named-individual illustrations. This does not change
annual population or membership, connect a live Civ provider, or establish
historical/physical presence. Source and simulation implementations were not
changed by this documentation entry. Static documentation inspection only;
no tests, builds, CLI/runtime checks, Atlas edits, commits or publishing were
performed.

## 2026-10-28 — Current named-individual documentation handoff

The annual membership contract now links to the separately owned
Settlement arrangement-2, Atlas named-individual illustration, and Species
cross-project handoff guide. These references describe the source sequence and
consumer limits without expanding Civilization's transport authority. Only the
two documentation files are included in this handoff; unrelated source and
test work remains outside it. No tests or runtime checks were run.

## 2026-10-28 — Multi-anchor annual species handoff

Documented how to prepare several Civilization annual species refinements for
Atlas's separate multi-anchor workspace. Each export must use byte-identical
complete composition-ledger and annual-body sources and the same run, body, arc,
lineage and Atlas target; composition-source originals and Species bundle pins
may vary. The README and guide now explain why all anchors should be exported
from one final frozen source set and link to Atlas's independent consumer
contract, including its separately pinned Species-declaration companion. The
planet panel's visual-inspector handoff passes the anchor digest and highlights
only a composition packet matching an active Civ ledger record; representation
selection remains explicit.
This is documentation only; no Civ producer behavior changed. No tests,
builds or CLI/runtime checks were performed.

## Guided annual settlement species editor · 2026-10-27

Added a guide for eight original source files and complete parent/child histories.
Decision-free source/context APIs reuse current validators, full annual refinement,
resident reconstruction and child replay. Exact active parents and a strictly
later derived year/tick/full-nanosecond sample are explicit choices, with no
latest/fallback selection or fabricated decision.

The editor retains every settlement and cell residual, shows both destination
and exact species budgets for sparse edits, and rejects malformed counts or
BigInt over-allocation. Destination speciesUnassigned and known-species notLocated
require separate explicit applications, including zero rows. Annual policy
unassigned and resident cell residual budgets remain distinct. Full result,
current conflict, exact choose/replace and authored decision metadata precede
exact write. All eight source paths are then reloaded/pin-checked before unchanged
allocation and exclusive four-file output.

Shared authoring preserves request CLI arguments/original bytes, lossless scalar
chunk transport, output versions/names/encoding, summary-last and success text.
Docs and final guide output identify the existing Settlement annual editor and
Atlas annual cohort import entry points with their separate review meanings.
No inhabitants, biology, buildings, coordinates or population authority inferred.

Static source/document reading only. No tests, checks, builds, CLI/browser runs,
Git operations, assets, deployment, publication or synchronization were performed.

## Guided resident allocation editor · 2026-10-27

Added decision-free source/target/history inspection using the resident
allocator's existing validators and shared target resolver. The new Node guide
loads original spatial/matching single-body annual/full resident ledger sources,
lists exact observed targets and pages region/cell budgets. Initial complete
all-unallocated partitions require an explicit action. Settlement IDs, BigInt
counts and rationales use explicit add/edit/remove actions; duplicate IDs,
over-allocation, malformed counts and historical relocation reject. Stored
residuals are unchanged by edits and require separate explicit application.

Final paged inspection shows every settlement row/cell residual and the current
conflict. Choose or exact active-record replacement plus full author/policy
metadata is explicit. Exact write freshly reloads/pin-checks all three original
paths and recomputes the same append before new-directory request/ledger/summary
output. Shared residents-only tooling preserves the request CLI's original bytes,
arguments, artifact shapes, encoding, residual semantics and success text. Other
modes and allocator conservation/history rules are unchanged. No inhabitants,
biology, buildings or coordinates are inferred.

Static reading/editing only. No tests, checks, builds, CLI/browser/runtime work,
Git operations, assets, deployment, publication or synchronization were run.

## Guided annual species-count export · 2026-10-27

Added a guide for the complete composition ledger, exact original composition
source and intended annual source. It replays/lists active positive and zero
anchors with body/arc/sample/partition context, marks zero budgets ineligible
and requires one explicit positive anchor and full fixed-policy acknowledgement.
Candidate listing never invokes the refiner. Only the selected anchor is refined;
source mismatch/failure never chooses another anchor. Coverage, interruptions,
unknown rows/gaps, exact input/output pins and false claims are displayed.

After exact `write`, all three originals are reloaded with a fresh bounded reader,
realpaths/hashes/lengths compared, and the selected refinement and all shown output
pins recomputed before exclusive new-directory output. Shared export tooling
preserves the request CLI's original bytes and existing six artifacts, encoding,
summary-last behavior and success message. The core refiner is unchanged. The
guide identifies refinement/ledger/composition-source/annual-body as the four
Atlas selections and keeps request/summary separate. No biological applicability,
demography, continuous membership, source authenticity or admission is inferred.

Static source/document inspection only. No tests, checks, builds, CLI execution,
browser/runtime work, Git operations, assets, synchronization, deployment or
publication ran.

## Guided Species composition scenario decisions · 2026-10-27

Added pure exact-target/conflict inspection using the existing proposal,
observation, conflict-key and complete ledger replay logic, without manufacturing
a decision or appending history. Added a guided composition CLI for the original
Species proposal, exact complete Civ observation document and complete adoption
ledger. It shows exact body/sample/arc/species/count/residual context and current
choice, requires an explicitly authored decision and choose or exact replacement,
then shows the concrete proposed adopted record/digest before exact `write`.

Fresh source reload compares SHA-256, lengths and real paths, then reruns adoption
and encoding before exclusive new-directory output. The shared composition helper
preserves the existing request CLI's original request bytes and three output
artifacts/summary/success text; other population decision modes remain unchanged.
No empty history, automatic replacement or allocation is synthesized. Species
biological ZIP/Atlas envelope, biological truth/applicability, rights, source
authenticity, simulation and external history remain unverified; fixed flags stay
false. Source originals must remain separately available.

Static source/document inspection only. No tests, checks, builds, runtime/browser
work, Git operations, assets, synchronization, deployment or publication ran.

## Guided annual individual membership authoring · 2026-10-27

Added a local guided CLI for existing named Individuals at one exact current
annual settlement/species assignment. It accepts eleven prompted source paths or
an optional closed path mapping, reviews complete annual history/current sources,
shows exact child/body/sample context, positive targets and eligible Individuals
with exclusion reasons, and keeps conservative cross-context identity reservations.
All selections are explicit, including zero named, unnamed count, new choice or
replacement of the exact active decision digest, author and policy rationales.
Counts and upstream residuals remain separate and visible.

The unchanged allocator reviews the complete proposal before `write` confirmation.
A fresh reader then reloads mapping and all sources, rejects changed original
pins/real paths, and re-allocates/encodes before exclusive new-directory output.
EOF, interruption or cancellation before confirmation creates no output directory.
The existing four artifacts and summary-last I/O semantics remain in use.
Shared tooling now holds the original-byte transport and authoring implementation;
the existing explicit request CLI retains its arguments and output semantics.
No deterministic core or sibling repository files changed.

Static source/document inspection only. No tests, checks, builds, typechecks,
runtime/browser execution, network, assets, commits or publication ran.

## Separate exact annual individual membership · 2026-10-27

Added pure annual membership allocation/review, separate closed ledger and
lossless review transport schemas, an explicit original-byte CLI and fictional
scenario. The current annual child must pass full contextual source review;
species and exact identity Individuals are checked at the later annual instant.
Composition and individual source bundles have separate original/canonical pins
and structurally identical selected species definitions. Existing composition/
profile bundle pins and legacy membership APIs/hashes remain unchanged.

The additive annual cohort history-only reviewer reuses existing record,
refinement, hash and replacement validation while leaving source freshness
explicitly unreviewed. Membership histories retain exact monotone complete parent
prefixes, distinct annual/anchor/resident keys, BigInt named/remainder closure,
separate residuals and per-append universe/instant/identity uniqueness. Known
parent replacements/competing anchors can retire claims; unknown other contexts
cannot release identities. Historical biological snapshots remain consistent.

The new-directory CLI preserves request plus all eleven source originals and
pins, writes summary last and rejects oversize composed transport. Partial new
contents may remain on I/O failure. No automatic source selection, person
creation, biology mutation, migration, continuity, residence or population
authority is introduced. No sibling/downstream files were changed.

Static source/document inspection only. No tests, builds, schema/runtime/browser
execution, network, commits, synchronization, deployment or publication ran.

## Explicit annual settlement species child decisions · 2026-10-27

Added a separate `civ-annual-settlement-species-allocation-1` record/ledger and
pure API for one strictly later derived annual policy sample and an exact active
resident parent. The core reruns and compares the complete annual refinement,
requires the resident annual source to equal the full selected-body projection,
rebuilds the resident decision using its exact history prefix, and joins exact
run/interval/body/arc/lineage/year/tick/outcome/arc summary and declared instant.
Derived sample keys are distinct from retained original anchor/resident keys.
Every destination and cell residual is explicit; BigInt closes per-destination,
per-species and aggregate policy/unlocated/unassigned budgets. No location is
inferred from the annual policy.

Records retain full refinements, exact parent snapshots, original/canonical pins,
authored choices and complete replacement history. Review marks replaced parents,
competing anchors, changed refinements and source contexts stale; unknown policy
rows cannot create allocations. Existing composition, resident, v1 cohort and
individual core contracts are unchanged.

Added closed ledger/review schemas, a separate explicit CLI and bounded lossless
current-original transport retaining request, prior child ledger and all source
bytes/pins. Summary is written last to a new directory. Added the contract and a
clearly fictional arithmetic example. Updated stale annual/v1 cohort docs to
reflect their already implemented CLI and independent Atlas consumers. No Atlas,
Settlement, Building or Species files were edited by this slice.
Static source inspection only: no tests, builds, typechecks, simulations, browser
or device review, network, commits, push/sync, publication or deployment ran.

## Opt-in annual species population refinement · 2026-10-27

Added `src/annual-species-population-refinement.mjs` and the separate explicit
`tools/export-annual-species-population.mjs` CLI. A requested active composition
record is checked against its complete ledger and original annual source; a
second complete annual source must share the exact run/interval and anchor.
BigInt largest-remainder apportionment preserves each actual supplied arc total
and the explicit unassigned weight. Derivation stops at missing years,
uninspected/absent arcs or another active composition anchor. Later samples stay
unknown. Exact source originals, original and canonical pins, exact revisions,
policy, anchor and parent identity are retained in a new directory; summary is
written last. The shared writer's fixed filename allowlist adds only these new
artifact names. No simulation or source ledger changes occur.

Static review identified an output expansion risk from many repeated long count
strings. Added a conservative 32 MiB output preflight before derived category
arrays/rows are constructed. It accounts for metadata/digest, repeated species
identities, each planned derived total's count digit bound, row fields/punctuation
and actual gaps, without serializing a combined prospective artifact. A bounded
per-sample plan applies the exact temporal interruption policy before sizing and
drives final construction too. Unknown rows reserve only their actual unknown
representation; only derived samples count toward the category-entry cap. This
removes excessive rejection from hypothetically deriving interrupted rows. The
existing CLI encoded-size and structural checks remain in place.

The [contract and Atlas handoff](annual-species-population-refinement.md)
document source consistency versus authentication, unknown species applicability,
staleness after parent replacement, resource bounds and all residual meanings.
This is fixed composition over Civ's annual population trajectory; it makes no
species reproduction, migration, inheritance or scientific causation claim.
Atlas import/rendering and settlement demographic use remain unimplemented.
Source inspection only: no tests, builds, typechecks, simulations, browser checks,
commits, pushes or deployment ran. Universe Atlas was not edited.

## Membership Species fractional values · 2026-10-27

Added an isolated finite-number codec for individual membership authoring/review.
Species biology fact values and representation metersPerUnit can retain finite
fractions; embedded membership snapshots retain fractional fact values. Original
source bytes stay unchanged. Nonfinite/negative-zero/unsafe-integer values reject,
and all non-Species paths retain canonical safe-integer numeric tokens. Existing
integer-only membership bytes/hashes and generic canonical APIs are unchanged.
Source inspection only; no tests, builds, validation commands or deployments ran.

## Authored settlement individual membership · 2026-10-27

Added the pure, versioned `src/settlement-individual-membership.mjs`, its closed
standalone ledger schema and the [membership contract](settlement-individual-membership.md).
An explicit decision selects one active exact settlement-species cohort and
existing exact Species individuals with `identity.kind = individual`. Their
exact species revision and both half-open applicability intervals must match
the exact observation. Representatives, missing revisions, duplicate identities,
stale parent selection, invalid replacements and over-budget counts reject.
Named count plus an explicit unnamed remainder conserves the cohort count with
BigInt. All four upstream residual meanings remain separate.

Records retain complete parent histories, original byte pin declarations,
canonical parsed-source pins and unchanged exact selected biological snapshots.
Parent-history snapshots advance as monotone prefixes. Every append checks
individual-ID uniqueness at the same universe and instant against that retained
context's active parents. Explicit parent replacements make older memberships
stale and release their current claims; historical simultaneous duplicates remain
invalid. There is no implicit latest-revision retargeting. Empty enumeration is
zero named; absent attachment is unknown. All verification/effect flags are
false and placement stays `not-bound`.

Added the closed `individuals` mode to the existing authoring CLI, which derives
original hashes from its strict UTF-8 reader and matches the exact composition
and Species bundle declarations. Its independent review transport retains
complete current histories, the new complete membership ledger, original input
pins and lossless scalar-boundary UTF-8 text chunks for the four current source
artifacts. Original pins remain separate from canonical source and record hashes.
The transport fits the existing combined output bound before any filesystem
mutation. It provides a future consumer boundary, not a live Atlas importer.

Implementation evidence is source inspection only. No tests, builds,
simulations, browser/device review, assets, Git operations, commits, pushes,
publication or deployment were run for this addition. Universe Atlas and Species
Lab were read-only. Runtime and independent consumer review remain outstanding.

## Partial settlement species cohort boundary · 2026-10-27

Added `src/settlement-species-allocation.mjs`, a standalone closed versioned
ledger schema with embedded parent definitions, paired fictional input/ledger
artifacts and [the cohort contract](settlement-species-allocation.md). An explicit
editor choice joins the active species-composition and resident-allocation
records for one exact observation key. Complete parent histories, exact embedded
snapshots and full parsed spatial/body/composition sources are rechecked through
the existing pure parent boundaries. The complete composition body projection
must equal the complete annual body source. No simulation is invoked.

Every settlement and cell resident residual retains an explicit destination,
including zero budgets. Sparse exact-revision species rows, per-destination
`speciesUnassigned` and per-known-species `notLocated` conserve arc, destination
and species budgets with BigInt arithmetic. Their aggregate residuals also close
exactly. The boundary intersects parent years at 0..2,000,000 and enforces finite
region/cell/settlement/species/row, canonical byte, depth, node and ledger limits.

The append-only cohort ledger requires exact choose/replace decisions. Contextual
review marks a cohort `stale-parent` after either parent is replaced; unchanged
observations outside the supplied source context remain explicitly not reviewed.
No automatic source, parent or species retargeting occurs. All verification and
effect flags remain false, and physical placement stays `not-bound`.

Observed checks: `node --check src/settlement-species-allocation.mjs` exited 0;
PowerShell `ConvertFrom-Json -Depth 100` parsed the new schema and both examples
(exit 0). Scoped `git -c core.safecrlf=false diff --check -- README.md` exited 0
without diagnostics. All six new/untracked files' `git diff --no-index --check
-- NUL <file>` checks emitted no whitespace diagnostics and exited 1 for the
content difference from NUL. Fictional examples were assembled using canonical encoding without
invoking the allocator; they provide no runtime verification evidence. No tests,
build, simulation, UI/browser/device check, Atlas/Species edit, commit,
deployment, push or synchronization occurred.

Next: an independently owned consumer can review explicit partial cohorts;
runtime population integration and physical planet placement need their own
contracts and verification.

## Settlement resident allocation boundary · 2026-10-27

Added the pure Civ-owned `src/settlement-resident-allocation.mjs`, a closed
versioned ledger schema, paired fictional input/output artifacts and
[the allocation contract](settlement-resident-allocation.md). Creation computes
canonical pins from complete parsed spatial/body artifacts, checks the spatial
annual-body pin and full projection equality, and accepts one explicit authored
allocation for every region and all sixteen cells of one exact observed arc/year.
BigInt resident counts plus explicit per-cell residuals conserve cell/region/arc
budgets. All source categorical state, site tokens, policies and threshold evidence
are retained. A left-censored active episode keeps null founding/town identity;
below-threshold and zero-resident authored settlements are permitted.

The bounded append-only ledger requires exact replacement of the active decision
and forbids reusing an authored settlement ID at another declared location across
all supplied records. Conflict identity excludes export digests/year selections.
Species allocation stays `not-assigned`, Atlas placement stays `not-bound`, and
all verification/effect flags remain false. Source pins bind canonical supplied
values without authenticating original file bytes. No simulator, refiner, Atlas
or Species source was changed; no tests or simulation were run.

Observed checks: `node --check src/settlement-resident-allocation.mjs` exited 0;
the schema and both examples parsed with PowerShell `ConvertFrom-Json -Depth
100` (exit 0). Scoped `git -c core.safecrlf=false diff --check` on the tracked
README emitted no diagnostics. Each new/untracked file's `git diff --no-index
--check -- NUL <file>` emitted no whitespace diagnostics and exited 1 for its
content difference from NUL. The fictional artifacts were assembled without
invoking the allocator or simulation and provide no runtime verification
evidence. No commit, deployment, push or synchronization occurred.

Next: inspect this allocation with retained source artifacts in an independently
owned consumer, then define explicit species residents and physical placement.

## Annual spatial observation boundary · 2026-10-27

Added `src/annual-spatial-export.mjs`, the versioned serialized schema and
[the spatial export contract](annual-spatial-export.md). A separate authored
artifact pins the exact canonical matching annual body export, carries its
provenance and interval, and exposes exact annual hierarchy arc/region/cell
samples with conservation checks. Categorical staircase state and opaque
logical site placement tokens remain distinct from geography and settlement
residents. Boundary threshold episodes use only contiguous regional history;
first-observed active episodes are left censored, and no founding identity is
invented across an inspection gap. The endpoint-associated cell refiner town ID
is never used as an annual active-town observation.
Adjacent history joins additionally require matching endpoint/start regional
population. A 250,000-cell-row preflight and 32 MiB canonical UTF-8 cap reject
oversized exports without truncating observations.

The existing offline command accepts `--format spatial` for one `--body`,
reusing fixture/year validation, inspection selection and atomic output writing.
The simulation and the existing body format are unchanged. Observed checks:
`node --check src/annual-spatial-export.mjs` and
`node --check tools/export-annual-body.mjs` exited 0. The schema parsed with
PowerShell `ConvertFrom-Json -Depth 100`; scoped tracked/untracked
`git -c core.safecrlf=false diff --check` checks emitted no whitespace diagnostics.
No tests, simulation runs, Atlas/Species edits, commits, deployment, push or
synchronization.

Next: define explicit settlement resident allocations against pinned cell
observations, with an unassigned residual and separately owned physical placement.

## Species composition scenario decision boundary · 2026-10-27

Added the Civ-owned pure `src/species-composition-adoption.mjs`, a standalone versioned ledger schema, a fictional output example and [the acceptance contract](species-composition-adoption.md). A decision pins the exact Species proposal bytes as declarations and one exact supplied Civ observed sample/lineage/arc, checks the full source identity and BigInt partition including explicit residual, and records an editor author/policy/rationale. The append-only ledger permits one active choice per observation and requires a replacement to pin its current decision ID and parsed-record digest. Its conflict key excludes the source export file hash, so re-exporting the same run cannot bypass explicit choice.

All source-byte, Species applicability, Atlas binding, replay and biology verification flags remain false. Acceptance is an authored scenario annotation only; no simulator, refiner, annual exporter or Atlas file was changed. `node --check src/species-composition-adoption.mjs` exited 0; the documented fictional ledger generation completed successfully. No tests or simulation runs were run, and no commit, deployment, push or repository synchronization was performed.

Next: add an explicit source-byte tool boundary before claiming original file hashes match the supplied proposal/Civ/Species/Atlas documents. Planet presentation and simulation adoption require separately owned integration work.

## Pass 313 · Civilization Lab exports multiple bodies from one compiled run · 2026-10-26

Added `createAnnualBodyExportBundle` and CLI `--bodies` for exporting multiple planets from one already compiled domain result. The canonical bundle stores shared provenance, interval and domain-wide events once, with per-body observations sorted by body ID. `annualBodyExportFromBundle` projects a member back to the existing single-body v2 import shape; the existing `--body` path remains unchanged. The CLI rejects duplicate, missing and foreign body IDs before replacing output.

Focused checks: `node --test tests/annual-body-export-bundle.test.mjs tests/annual-body-export-bundle-cli.test.mjs` passed 2/2 in 534 ms, including same-run populated home E0/colony E5 exports and per-body projection parity. `node --test --test-name-pattern="annual export command supports a configured horizon" tests/annual-body-export-cli.test.mjs` passed 1/1, verifying the legacy single-body CLI path. Syntax checks and scoped `git diff --check` passed. Pre-edit sources, docs and handoff are preserved in `.codex-civ-multibody-export-bundle-before-20261026-pass834/`. Atlas remained read-only; no deployment or push.

Next: let Atlas consume a selected member of this bundle with its own authored planet binding, then display the same-run planets together in the Universe registry.

## Pass 312 · Civilization Lab documents offline Universe Atlas review · 2026-10-26

The README previously said that nothing was integrated with Universe Atlas. Updated that status to distinguish the existing manual/offline path from the still-absent live provider and automatic sync. It now explains that the authored annual body JSON needs a separately authored Atlas binding envelope, and Atlas displays only supplied samples and arc levels without establishing complete coverage or verified history. Added links to the annual export command and Atlas integration contract.

Evidence: read the current Atlas `src/civilization-observation-panel.ts`, `lab-center.html` card and `docs/civilization-integration-contract.md`; all describe the locally selected export/envelope path and preserve the non-provider limitation. The CLI guide explicitly says the export does not contain Atlas binding. Both new README links resolve to files. This was documentation-only; no tests, simulation runs, Atlas edits, deployment or push. Pre-edit README, handoff and changelog are in `.codex-pass312-civ-atlas-offline-review-docs-before-20261026/`.

Next: verify real non-null per-arc annual levels from a deterministic Civilization Lab scenario through Atlas import, retaining distinct arc identity and declared source provenance.

## Pass 311 · Civilization Lab exports inclusive annual year ranges · 2026-10-26

The annual body export CLI now accepts `--year-range START:END` as an inclusive alternative to `--years`. It requires exactly one selector, expands only safe signed integer years, and rejects reversed, malformed, unsafe, or over-10,000-observation ranges before touching the output file. Boundary sampling and early-terminal behavior continue through the existing exact-year adapter; range syntax does not interpolate development levels. The CLI guide documents both forms.

Pass-start state: branch `main` at `350d327360664777fe8682571248a74f14ac1a7f`, with the pre-existing dirty Civilization Lab work preserved. `.codex-civ-year-range-export-before-20261026-pass311/` contains pre-edit copies of the CLI, focused test, annual export guide, changelog and loop handoff. The first test run corrected an assertion to match the existing rule that a final compiled decade boundary uses the preceding endpoint. `node --test tests/annual-body-export-cli.test.mjs` passed 3/3. A targeted trailing-whitespace scan found no trailing whitespace. Atlas remained read-only. No deployment or push.

Next pass: inspect the separate Atlas Civilization Observation import boundary against dense annual exports and exact configured-end samples; change it only if a concrete integration gap remains.

## Pass 310 · Civilization Lab annual exports preserve era regression · 2026-10-26

Added regression coverage for an era downgrade in annual observations. A forced Technology Loss verifies direct annual hierarchy and exported body/arc eras as 4 at years 0 and 9, then 0 at years 10 and 19. The observations remain populated and keep annual lineage outcome explicitly `not-modelled`; source result and event digests are unchanged by export. This verifies existing model/export behavior without changing production code or the Atlas import schema. `node --test tests/annual-body-arrival-era.test.mjs` passed 5/5. Snapshot: `.codex-civ-annual-era-regression-export-before-20261026-pass310/`. No deployment or push.

Next: consider a bounded `--year-range` selector for dense timeline exports, retaining the existing 10,000-observation cap and exact-year/early-terminal semantics.

## Pass 308 · Bound annual body observations to Atlas import capacity · 2026-10-25

- Pass-start evidence: `civilization-lab` is a separate `main` repository at `350d327360664777fe8682571248a74f14ac1a7f` with 58 pre-existing dirty/untracked paths. Workspace inventory still reports 18 Lab Center entries and one external Civilization Lab repo. Local `AGENTS.md` requires preserving determinism, keeping Atlas read-only from this repo, and never deploying or pushing.
- Cross-repo review found Atlas's `CIVILIZATION_OBSERVATION_IMPORT_LIMITS.observations` is 10,000, while the Civilization annual export API/CLI previously accepted unbounded observation-year lists. A valid authored export could therefore exceed the consumer's accepted row count.
- Added a single Lab export maximum of 10,000, enforced both by `createAnnualBodyExport` and before the CLI compiles the domain. Documented the shared limit in the two export guides. Atlas source was only read; no Atlas file was edited.
- Preserved pre-existing source/docs in `.codex-annual-body-export-observation-limit-before-20261025-pass308/` before the edit.
- Validation observed: `node --check src/annual-body-export.mjs tools/export-annual-body.mjs` passed; scoped `git diff --check` emitted no whitespace errors. Test suites and deployment were not run.
- Next candidate: review Time Machine Lab's browser storage/recovery boundary as a different lab; preserve its existing dirty state and read current Atlas instructions/status before editing.

## Pass 309 · Early terminal endpoint inspection · 2026-10-25

- Read Civilization Lab and workspace instructions; preserved its existing dirty tree. The separate checkout was on `main` at `350d327`, with 66 changed/untracked paths at pass start. Atlas remained read-only during the Civilization change.
- The annual export adapter already selects the preceding tick for the actual compiled end, but the CLI only requested that tick for the configured horizon. A forced extinction terminating at year 10 under a configured horizon of 30 reproduced the mismatch: the CLI selection omitted tick 0, which the adapter needs for the final boundary.
- Added `annualBodyInspectionTicks` to retain both the containing and prior tick at intermediate decade boundaries, bounded to the configured interval. Existing adapter semantics pick the predecessor only when compilation really ends there. Added regression coverage for the forced early terminal and documented the extra candidate snapshot.
- Preserved pre-edit files in `.codex-civ-annual-endpoint-cli-before-20261025-pass309/`.
- Validation: `node --check src/annual-body-inspection-ticks.mjs tools/export-annual-body.mjs tests/annual-body-export-cli.test.mjs` passed; `node --test tests/annual-body-export-cli.test.mjs` passed 2/2; scoped `git diff --check` passed. No broad suite, deploy or push.
- Next: resume Biosphere Lab review in Atlas.
