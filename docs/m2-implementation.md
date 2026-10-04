# M2a implementation handoff

Implemented for Opus runner review; no commit, push, remote, deployment,
preview, dependency installation or network access performed. Atlas was read
only and has no runtime import. These are authored scenarios, not calibrated
historical predictions. All causal labels mean **model attribution**.

## APIs and scope

- `createPlanet(fixture, seed, {years, forced})` in `src/planet.mjs` constructs
  an immutable definition and exposes `chapter(index, {cold})`,
  `resultDigest(order, {cold})`, `run()`, `compileSummary()`, `checkpoints`,
  and `clearCache()`. Chapter indices are absolute. Invalid horizons fail;
  unavailable required inputs produce `not-modelled` or `uninhabited`.
- `run()` retains ledgers for short inspection/tests. `compileSummary()` hashes
  and releases each completed chapter, retaining events and checkpoints. The
  CLI and performance tool use this bounded chapter working set. Do not use
  full `run()` for a long, highly active history: it retains every snapshot.
- The default standalone run records a complete post-sapience ForcedFixture,
  including `origin.deliveryYear="0"`, seed and tick count. It does not pretend
  to execute D's natural origin schedule. InitialOverride fixtures support
  arbitrary valid starting ticks; post-sapience SAPIENCE starts at year zero.
  Different requested horizons change this forced input and thus its manifest;
  query-order comparisons always use one immutable manifest.
- The explicit fixtures are `temperate.json` (12 regions), `arid.json` (8),
  and `cold-archipelago.json` (10). CLI aliases `temperate-12`, `arid-8`, and
  `cold-archipelago-10` resolve to these paths. `StubEnvironment` validates
  closed input schemas, content digests, adjacency, ordering and epoch coverage.
  Its Availability union preserves known, absent and unsupported separately.
- `catalogue-data.json` declares all 31 rows; only the 15 M2a rows execute.
  `tools/build-m2-data.mjs` reproducibly expands the three authored fixture
  recipes and catalogue data, and records the two contract corrections below.
  The catalogue test parses the committed document independently.
- Forced fixtures are built as complete records by `tests/civ-helpers.mjs`;
  all unrelated hazards are explicitly zeroed when isolating reachability.
  Overrides enter the input bundle and parameters manifest before any draw.
  There are no callback/event injections or unrecorded RNG overrides.

## Execution and serialization

P freezes the post-environment boundary, evaluates threshold latches, advances
episode-addressed hazards with M1 `advanceHazard`, schedules pre-existing
chains, assigns locks in M1 event order, then computes natural updates and
commits ordered remaining-stock effects. Era events compare only pre-state
and committed tiers. Same-tick gains share a region/domain lock. Population
transfers record one amount and the receiver field; ownership never transfers
population. Zero-capacity natural mortality precedes every event debit.

M2 uses half-up Beverton–Holt in `tech.mjs`; M1's floor-rounded toy remains
unchanged. Events reuse M1 identities, intents, ordering and ledger construction,
with model-specific validation and closed set payloads. Every hazard purpose
named by the table is registered. No wall clock exists in `src/`; the lint also
bans `process.hrtime` there.

Latches allocate on their first true predicate and subsequently retain/reset
their state. Hazard entries allocate on first eligibility and persist while
paused. Retired polities, hazards and terminal chains leave live state exactly
once in the tick archive. Chain steps still advance after stock pre-emption;
extinction produces explicit invalidation steps. Death witnesses use application
order, and transfers do not overwrite them.

Provenance records intermediate primitive changes, derives endpoint scores,
decays old scores, merges repeated source IDs and retains the top three with
event-ID tie breaks. Causes use pre-state provenance plus explicit earlier
chain and enabling events. The strict ordering filter makes the DAG acyclic.

The standalone domain envelope contains the complete typed DomainState, one
reserved lineage/arc and no D catalogue events. It records barrier ledgers and
terminal arc archival. Roots use sorted P/D chapter leaves and the domain
wrapper, with M1 Merkle primitives. Complete chapter checkpoints have exactly
`{tick, live, archiveRecords}` and no RNG cursor. Cross-body execution, natural
origin scheduling and D event kinds remain M2b work.

Canonical serialization now memoizes only objects it has recursively validated
and frozen, using a non-iterated WeakMap. Large chapter strings are not retained
in that cache. Immutable returned chapter witnesses reject caller mutation.
The M1 bytes and pinned golden remain unchanged. `merkleRootFromHashes` supports
streaming chapter disposal using the same leaf/domain separators.

## Contract corrections

1. Repaired six malformed provenance dependency rows. Their right-hand columns
   contained field-register type/unit/writer text rather than dependencies.
   Added the corresponding `rules.provenanceDependencies` JSON lists. No rate,
   gate, effect magnitude or field permission changed.
2. Raised ForcedFixture tick maximum from 640 to 40000, also recorded as
   `rules.forcedTickMaximum`. Required 20 kyr/400 kyr post-sapience runs could
   not be represented under the previous bound. Individual reach fixtures
   retain their short prescribed horizons.

Both corrections are marked runner-review-pending in the contract revision log.

## Acceptance map

| Test file | Real assertions |
|---|---|
| catalogue | 31 declarations, 15 implemented, unique ranks, independent document parsing, exact declared reads/writes; synthetic undeclared-read and duplicate-rank negatives; three stubs and invalid environment rejection. |
| fixtures-reach | Every M2a kind actually fires and is accepted in its short recorded forcing construction; no M2b kind fires. |
| dynamics | Half-up BH bounds/zero cases, decay, stock replay and remaining-stock losses, one gain per domain, exact committed era transitions, missing fissile ceiling, K=0 before migration, simultaneous same-domain loss/gain. |
| conservation | Two 800-permille migrations debit 80 then 16, every accepted transfer balances, final population conserved; rejects the original-stock arithmetic result. |
| polities | Unique owners, conquest conservation/retirement, reciprocal-war merge, competing collapse splits, flat child IDs, no retired identity returns. |
| causal-dag | Strictly earlier causal order and nonvacuous real chain/enabling edges, hazard crossing evidence, deterministic provenance merging/ties, natural extinction and explicit chain invalidation/archival. |
| civ-determinism | Same seed twice and fresh CLI child, different seeds, pinned short golden, streaming/root equality, forward/reverse/cold chapter crossing, cache clearing, immutable witnesses and serialization-cache negative controls. |
| perf-budget | 2000 canonical ticks plus root hashing in under 2000 ms; nonzero event exposure. |

`npm test` runs files serially (`--test-concurrency=1`) to isolate each file's
wall-time budget from other CPU-heavy tests. Existing M1 tests still execute.

The short golden below was **self-generated from the CLI**, so it is only a
stability check, not independent evidence of model correctness:

```text
node src/cli.mjs --civ temperate --seed civ-m2a-golden --years 100 --digest
d478f72a109dd8447a27bea9d1e7d477095caa2832596e15cc17d02bba7bc550
```

## Observed runs and known gaps

Observed final `npm test`: **46 tests, 46 pass, 0 fail**, total 4350.0289 ms.
Its 20 kyr performance measurement was **1696.27 ms**, including compilation
and root hashing. No unobserved pass is claimed.

`npm run perf` completed a 400 kyr streaming run in **342773.81 ms**, with
12777 events and root
`82d38b59fd371f3dcebf293dff1361a1fe40a5d39f25ff3abc1feb735c812778`.
The **10000 ms target fails**. An earlier full-history attempt exhausted the
default Node heap; chapter disposal fixed that failure, not the time budget.
Serialization of large live hazard ledgers remains a major cost. Subsequent
small validation/reporting edits do not change this root, but this number is
the observed measurement, not an assertion that every revision takes that time.

The requested 40000-tick repeated-split/recolonisation stress scenario is not
implemented: recolonisation is M2b. Event/ref and generated hazard-key length
limits are checked, flat polity IDs are tested, and the ordinary 400 kyr run
completed. That is not a substitute for the specified repeated-recolonisation
stress test. Anoxic/home-system fixtures, voyage/domain interactions, and all
M2b kinds remain deferred. C/H refinement and narrative remain M3.

Observed default 20 kyr CLI summary:

```text
M2a temperate; seed civ-m2a-1; 20000 years; 12 regions; 7 events.
Outcome: EXTANT_PLANETARY; population 16055; era E0; live polities 0.
SAPIENCE: 1
MIGRATION: 3
AGRICULTURE: 0
FAMINE: 0
PLAGUE: 3 (1 opener, 2 chain steps)
DISCOVERY: 0
DIFFUSION: 0
TECH_LOSS: 0
ENERGY_TRANSITION: 0
POLITY_FOUNDING: 0
WAR: 0
CONQUEST: 0
COLLAPSE: 0
RECOVERY: 0
EXTINCTION: 0
Manifest digest: 250f211a616f6648b77f76df218066802d2bd0cfc2b57a3f2e54aeb5a1e20261
Recipe digest: 0344fb490da35cee97b5d986eab49b84f78218756ea966c70abf99df00fd59d2
Result digest: a5a9fd03afae89b4e64949f9a885c9982a9dbac863d1854527a5ab8fc799dea7
```

All seven events were accepted (zero pre-emptions). This observed seed stays
foraging, with migrations and an occasional plague, consistent with the table's
explicit allowance for slow-innovation seeds. It has no exposure to political
or later-tier mechanisms; their reachability evidence is the forced fixtures,
not this ordinary run. These counts are observations, not asserted mix targets.
