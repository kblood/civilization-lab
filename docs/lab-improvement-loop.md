# Lab improvement handoff

## Pass 316 · Keep Species ZIP JSON strict at the Civ→Atlas boundary · 2026-10-28

Hardened the guided starter's interactive v2/v3 mode selection: choosing a ZIP
after supplying individual source flags now fails rather than silently ignoring
those paths. The ZIP decoder preserves a UTF-8 BOM for the bounded JSON parser
to reject, matching the individual-file reader and Atlas annual importer's
original-byte contract. This prevents Civ from exporting pinned JSON that Atlas
will reject on import.

Evidence: static source and consumer-contract review only. No tests, builds,
deployment, publication, push or repository synchronization were performed.

## Pass 315 · Direct Species composition ZIP input for guided v3 · 2026-10-28

The Civ-owned guide and request exporter now accept the exact five-entry
Species composition review ZIP as one bounded source. V3 validates the ZIP's
fixed entry set/order, stored headers, CRCs, member byte caps and unique-key
JSON, but treats `composition-review.json` as untrusted input. The guide still
requires the complete Civ adoption ledger, annual source and an authored
choose/replace decision; request v1/v2 and the manual-member v2 guide remain
available. The output retains the original ZIP and original extracted source
bytes with pins, while Atlas still receives its four established count files.

Evidence: static source/contract inspection only. No tests, builds, deployment,
publication, push or repository synchronization were performed. Runtime ZIP
compatibility and Atlas handoff remain unverified.

## Pass 314 · Guided Species-to-Atlas starter v2 · 2026-10-28

Added a Civ-owned interactive v2 path that accepts the six exact original
Species/Civ/Atlas files without requiring hand-authored starter request JSON.
It reviews the exact observation and current decision, asks for an explicit
choose/replace record and authored rationales, requires acknowledgement of the
fixed annual policy, and presents the envelope-pinned adoption/refinement and
output file pins. After exact write confirmation it reruns the same preparation
and compares every output byte before invoking the existing exclusive writer.
The request-based v1/v2 exporter and source ownership boundaries remain intact.
The Species composition ZIP is not accepted as one input; the guide uses the
untouched proposal and four source JSON members separately, while the Species
review receipt remains distinct from Civ's adoption ledger.

Evidence: source and contract inspection only. No tests, builds, deployment,
publication, push or repository synchronization were performed. Runtime prompt
behavior and an actual Atlas handoff remain unverified.

## Pass 313 · Civilization Lab exports multiple bodies from one compiled run · 2026-10-26

Added the `civ-lab-annual-body-observation-bundle-1` format and the CLI `--bodies ID[,ID...]` selector. The domain is compiled once; provenance, interval and domain-wide events are stored once, and annual observations are separated into canonically sorted body entries. The library can project one member back into the unchanged single-body v2 format for the Atlas offline importer. The existing `--body` output path remains v2.

Evidence: `node --test tests/annual-body-export-bundle.test.mjs tests/annual-body-export-bundle-cli.test.mjs` passed 2/2 in 534 ms. The real forced colony run preserved home E0 and colony E5 at years 10/20, common lineage and result/event digests; projection exactly matched separate single-body exports. CLI coverage verified canonical JSON, sorting, inclusive years, shared events and preservation of existing output on invalid body lists. `node --test --test-name-pattern="annual export command supports a configured horizon" tests/annual-body-export-cli.test.mjs` passed 1/1 for the existing single-body path. Syntax and scoped whitespace checks passed. Pre-edit copies are in `.codex-civ-multibody-export-bundle-before-20261026-pass834/`. Atlas remained read-only; no deploy or push.

Next: add an Atlas offline import path for one selected bundle member using its own authored planet binding, then verify same-run planet levels together in the Universe registry.

## Pass 312 · Civilization Lab explains its offline Universe Atlas review path · 2026-10-26

Clarified the README status: Civilization Lab's annual body exports can be manually paired with a bound Atlas authoring envelope and reviewed on planet and Universe timelines, while there is still no live provider or automatic sync. The README links to the export command and Atlas integration contract and states that supplied samples do not prove complete or verified coverage. Atlas files remained read-only. No tests were needed for this README-only update; both linked files exist. Snapshot: `.codex-pass312-civ-atlas-offline-review-docs-before-20261026/`.

Next: verify real non-null per-arc annual levels from a deterministic Civilization Lab scenario through Atlas import, retaining distinct arc identity and declared source provenance. Do not claim full coverage or automatic integration.

## Pass 311 · Civilization Lab exports inclusive annual year ranges · 2026-10-26

The annual body export CLI now supports inclusive `--year-range START:END` as an alternative to `--years`. Exactly one selector is required, and the range is limited to 10,000 safe integer observations. Tests cover inclusion, exact decade/final-boundary sampling, the maximum count, malformed and reversed ranges, and preserving an existing output on failure. No interpolation was added. `node --test tests/annual-body-export-cli.test.mjs` passed 3/3; a targeted trailing-whitespace scan found no trailing whitespace. Pre-edit copies: `.codex-civ-year-range-export-before-20261026-pass311/`. Atlas source was read-only; no deployment or push.

Next: inspect the separate Atlas Civilization Observation import boundary against dense annual exports and exact configured-end samples, changing it only if a concrete integration gap remains.

## Pass 310 · Civilization Lab annual exports preserve era regression · 2026-10-26

Added a deterministic regression to the existing annual body-export test. A forced Technology Loss commits the source arc from era 4 to era 0; direct annual hierarchy samples and exported body/arc observations remain era 4 at years 0 and 9, then report era 0 at years 10 and 19. The rows retain positive population and `annualOutcome: not-modelled`, so era zero is not presented as extinction. The result and event digests remain unchanged by export. This adds verification coverage for existing behavior; simulation and export production code did not change.

Pass-start state: Civilization Lab was on branch `main` at `350d327360664777fe8682571248a74f14ac1a7f`, with 17 tracked dirty and 34 untracked paths. The test and handoff files were already untracked; `.codex-civ-annual-era-regression-export-before-20261026-pass310/` preserves their pre-edit contents. `node --test tests/annual-body-arrival-era.test.mjs` passed 5/5 in 0.77 s. Atlas source remained read-only. No deployment or push.

Next pass: consider a bounded `--year-range` selector for dense timeline exports, retaining the 10,000-observation cap and exact-year/early-terminal semantics.

## Pass 309 · Civilization Lab early terminal boundary observations · 2026-10-25

Annual body export CLI now retains the previous decade's inspection tick alongside intermediate decade boundaries. This lets the existing exporter select the correct final endpoint when the simulation terminates early at that boundary. Added a focused forced-extinction regression and documented the retained endpoint snapshot behavior.

Civilization Lab remains on branch `main`, HEAD `350d327360664777fe8682571248a74f14ac1a7f`, with 66 pre-existing changed paths at pass start. The touched CLI, test and guide were untracked before this pass; `.codex-civ-annual-endpoint-cli-before-20261025-pass309/` preserves their pre-edit copies. `node --check` passed; `node --test tests/annual-body-export-cli.test.mjs` passed 2/2; scoped `git diff --check` passed. No deploy or push.

Next pass: resume the Atlas lab improvement loop with Biosphere Lab's date-retained export flow.

## Pass 308 · Civilization Lab annual observation cap · 2026-10-25

Annual body export now rejects more than 10,000 requested years in both its library API and CLI. This matches the offline Atlas importer limit declared in `../universe-atlas/src/civilization-observation-import.ts`. The CLI rejects oversized requests before domain compilation. Existing exports up to the cap retain their schema and event/observation semantics.

Civilization Lab remains on branch `main`, HEAD `350d327360664777fe8682571248a74f14ac1a7f`, with 58 pre-existing changed paths. The edited exporter, CLI, and their docs were untracked before the pass, so a pre-edit copy is retained in `.codex-annual-body-export-observation-limit-before-20261025-pass308/`. Atlas was read-only. Syntax checks and scoped whitespace checks passed. No tests or deployment ran.

Next pass: choose a different Atlas lab. Review Time Machine Lab's browser storage and recovery behavior against its current scenario/storage tests, then make one bounded change only if source review shows an uncovered failure path.
