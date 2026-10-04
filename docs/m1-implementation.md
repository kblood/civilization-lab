# M1 implementation notes

This is an authored test scenario, not a calibrated civilisation model. Atlas
is neither imported nor modified. The binding spec, critique and runner's
independent vectors are unchanged.

## Choices where the spec leaves an API or toy detail open

- **Toy scope:** one arc, one region, genesis at year zero, population 10,000,
  capacity 100,000 and precomputed Beverton–Holt `g = 100000`. The one-region
  M1 fixture is the explicit exception to P's later 8–32-region partition.
  The CLI evaluates 1,280 ticks (12,800 years, two chapters). Tests may request
  1–1,920 ticks; the manifest pins a 19,200-year maximum. Incomplete final
  chapters contain only complete requested ticks. The requested tick count is
  included in `recipeDigest` alongside the seed and manifest.
- **Toy hazards:** `boom` and `plague`, in the closed purpose registry.
  Their per-decade Q32 rates are respectively 429496730 and 214748365.
  Each boom adds 20–100 permille of the stock remaining at its commit; each
  plague removes 100–300 permille. Magnitudes are addressed by immutable event
  ID with purpose `evt.toy.magnitude`. Hazard eligibility pauses at zero
  population. All constants, ranges and versions are manifest-pinned. None
  of these choices is an empirical claim or an M2 transition definition.
- **Identity encoding:** hazard tuples use the existing S/I encoder, with
  presence bits before optional domain, tier and edge fields. This distinguishes
  missing components from empty strings or tier zero. The tuple's hex bytes are
  used as the RNG entity ID and in hazard intent keys. Subject IDs in `t:`
  intents are likewise encoded and hexified. Episode suffixes remain canonical
  decimal and sort lexically, as required by the intent-key order. `c:` and
  `m:` retain the literal chain/message ID. Owner IDs and kinds reject `|`;
  the final intent suffix may contain it (for an embedded chain event ID).
- **Event catalogue scope:** M1 registers BOOM (rank 0) and PLAGUE (rank 1),
  both P-owned. Validation rejects unknown kinds, mismatched rank/owner level,
  malformed records and duplicate IDs. The D/C event catalogue is M2/M3 work.
  Cause arrays sort by `(eventId, edge)`; refs by `(role, entityId)`.
  Effect arrays retain their declared application order. Intent creation uses
  placeholder ordinal zero; `sortEvents` assigns presentation ordinals anew.
- **Time boundaries:** signed years in the inclusive safe-integer range are
  supported; either sign beyond it returns `outside-model-range`. Bucket
  indices are Numbers for Number input, BigInts for BigInt input. Bucket
  intervals have BigInt endpoints, since the enclosing upper boundary near
  the model limit need not be a safe Number. Empty intersections return null.
  Number division goes through BigInt, including near the safe-integer limit.
- **Sampler API:** address first, then sampler parameters, then optional draw
  index. `below` returns BigInt; `belowWithAttempt` additionally exposes the
  accepted attempt. Its last argument is the test-only injected draw seam.
  `sortedUniformYears` returns `{year, index}` records to expose the tie-break.
  String `"-0"` is legal S data; numeric negative zero is rejected as I data.
- **Canonical JSON:** signed BigInts become decimal JSON strings. Number
  negative zero becomes `0` (JSON convention); fractional/unsafe numbers and
  unsupported values are rejected. Malformed Unicode, cycles, accessors,
  sparse arrays and symbol keys are rejected rather than silently normalised.
- **Result root:** M1's single-arc result is the Merkle root over sorted
  `(arcId, chapter)` leaves, each containing `{arcId, chapter, ledgers, events}`.
  It does not add a synthetic D-ledger/domain wrapper. Chapter start-state
  witnesses are not duplicate leaf data: ledgers already hash them. The future
  multi-arc/D composition remains beyond this toy. The manifest has an explicit
  `manifestVersion` tag in addition to all section 10 fields.
- **Refinement:** because `startState` in a ledger is only a digest, annual
  refinement receives its full start-state witness and mandatory events in a
  static definition, verifies the witness digest, and gets no world handle.
  It returns 11 samples, including both boundaries; the first ten carry only
  the natural change. `aggregate` validates that bridge, replays resolved
  effects, checks the endpoint and reconstructs the ledger. Unrefined hazard
  and capacity fields are carried as boundary metadata. The generic checker
  uses exact structural equality (BigInt is distinct from a decimal string),
  with sorted declared field names. It runs the refiner on a private clone,
  detects parent mutation, and returns stable error reasons. Caller-owned
  parent data is never adjusted, even by the write-back negative control.
- **Checkpoints and observations:** checkpoints are sorted `{tick, state}`
  records at multiples of 640, plus genesis. Hazard episodes and thresholds
  are causal state; no generator cursor or stream state is saved. Cold mode
  always replays from genesis; warm mode uses the nearest checkpoint at or
  before the chapter start. `clearCache` drops both chapter and checkpoint
  caches. The separate materialisation record never enters a hash.
- **Saturation:** exactly four firings need not saturate. The fourth is marked
  saturated, and residual hazard discarded, only if a fifth threshold also
  lies within the decade, following section 4.4's pseudocode literally.
- **Negative controls:** `WRONG_sequentialRoot` deliberately shares a mutable
  draw counter across chapter queries; `WRONG_refineWritesParent` mutates its
  parent argument. Production entry points never call these exports. The
  projection test also corrupts an interior annual value while retaining the
  endpoints, demonstrating that endpoint checks alone would be insufficient.

## Acceptance map

All paths below are under `tests/`. Every row in the M1 acceptance table has
executable assertions, not just a golden comparison.

| File | Assertions |
|---|---|
| `rng.test.mjs` | All independent mix/counter/FNV/key-byte/key64/draw/u53/below vectors and attempts; field aliasing, types and malformed Unicode; direct draw 1000; domain bounds; rejection fixture and 128-attempt exhaustion; closed purposes; exponential accuracy and exact endpoints; other samplers. |
| `fixed.test.mjs` | Fixed logarithm grid within one Q32 ulp; signed Number/BigInt floor and ceil; mulDiv and Q32 rounding. |
| `time.test.mjs` | Copied Atlas year constant; negative offsets; range status; safe-limit division; valid nesting edges; overlapping millennium/chapter intervals and half-open membership. |
| `hazard.test.mjs` | Independent yearly accumulation with the decade cap; explicit second/third crossing years; evidence and residual bounds; four versus five crossings; zero/paused rates; structured identity and same-year cause tie-break. |
| `events.test.mjs` | Reversed/shuffled insertion, total order, same-year intent ordering, dense per-group ordinals, stable IDs and invalid schema rejection. |
| `digest.test.mjs` | Canonical key order and decimal forms, rejected types, effects sensitivity, observation independence, all five independent Merkle cases, manifest fields/version sensitivity. |
| `determinism.test.mjs` | Two independent same-seed runs, different seed, fresh CLI child process and pinned toy golden. |
| `query-order.test.mjs` | Three chapters forward/reverse/shuffled/cold/refinement-first, checkpoint contents and cache clearing; shared-stream negative control. |
| `projection-toy.test.mjs` | All 100 ticks of a 1,000-year run, exact aggregation, nonnegative annual samples, boundary continuity, committed debit arithmetic; mutation/interior-path/type-mismatch negative controls; Beverton–Holt zero cases. |
| `determinism-lint.test.mjs` | Existing clock/random bans, transcendental and locale bans, offending-string self-checks and local import boundaries. |

The default `civ-toy-1` result golden is
`c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc`.
