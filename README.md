# Civilization Lab

**Status: theoretical lab.** Nothing here is integrated with Universe Atlas yet.
**M1 implemented:** deterministic core, one-region toy, chapter replay and exact
annual projection, with independent RNG/Merkle vectors and negative controls.
**M2a implemented for runner review:** the 15-kind standalone planet solver,
three explicit environment stubs, ordered stock effects, chains, provenance,
archives and chapter checkpoints. The 20 kyr acceptance check passes; the
400 kyr / 10 s performance target is **not met**. M2b remains unimplemented.
This repository exists to work out — on paper first, then in small deterministic
Node simulations — how civilisations can be generated so that they cohere with
a deterministic 4D universe.

## Vision

[Universe Atlas](../universe-atlas) is a deterministic procedural universe in
space *and* time, travelable from beginning to end, and a platform other games
build on. Its next big capability is **civilisations**:

- from the **stone age** to whatever the future holds on each planet;
- science-fiction futures in which a civilisation **travels between planets and
  spreads**, or **wipes itself out**, or stagnates, collapses and recovers;
- a rich vocabulary of **historical events** (migrations, wars, plagues,
  discoveries, schisms, collapses, contact, colonisation, extinction);
- **levels** — of abstraction, of time and of spatial scale — that hold
  together, so that a coarse answer ("is planet X inhabited in epoch Y, at what
  tech level?") and a fine answer ("what happened in this city in this century?")
  never contradict each other.

The lab plays the role [Creature Lab](../universe-atlas) plays for fauna: a
standalone place to design, test and inspect the generator before it is wired
into Atlas's planets, climate, biomes, fauna and time.

## Determinism rules

Every generator in this repository must obey these rules; `npm test` lints for
the most common violations.

1. **No wall clock, no unseeded randomness.** No `Date.now`, `new Date()`,
   `performance.now`, `Math.random`, `crypto.getRandomValues`.
2. **Seeded, split RNG streams** keyed by `(seed, entity, level, time bucket)`.
   A stream for one entity never consumes from another's.
3. **Order independence.** The same seed yields the same history regardless of
   query order and of which levels have been realised. Never depend on object
   key order, `Map`/`Set` insertion order from unordered sources, or iteration
   over the results of earlier queries; sort explicitly.
4. **Well-defined arithmetic.** Prefer integers (with explicit overflow
   semantics; never `Math.imul` for distances). Floats only where the operation
   is IEEE-exact and platform-independent; no transcendental functions on a
   path that feeds a digest unless their result is quantised first.
5. **Coarse constrains fine.** A finer level is a refinement conditioned on the
   coarser level's outcome; it may add detail, never contradict it.
6. **Digests.** Each scenario emits a stable digest of its results so that
   determinism is checked by comparing hashes across runs and query orders.

## How to run

Requires Node 22 or newer; there are no dependencies.

```powershell
npm test            # node --test "tests/**/*.test.mjs"  (fast, deterministic, no browser/GPU)
npm run scenario    # node src/cli.mjs
npm run digest      # node src/cli.mjs --digest
node src/cli.mjs --civ temperate --seed civ-m2a-1 --years 20000
npm run perf        # tools/perf-civ.mjs: 400 kyr, measured outside src/
```

## Layout

- `docs/` — design notes; `docs/research/` holds sourced web research.
- `src/` — generator code (`src/cli.mjs` is the entry point).
  Core modules: `time.mjs`, `fixed.mjs`, `rng.mjs`, `canonical.mjs`,
  `digest.mjs`, `events.mjs`, `hazard.mjs`, `manifest.mjs`, `levels.mjs`;
  `toy.mjs` supplies the M1 solver and annual refinement.
- M2a: `catalogue.mjs`, `planet.mjs`, `tech.mjs`, `polities.mjs`,
  `chains.mjs`, `provenance.mjs`, `environment.mjs`, `civ-input.mjs`;
  `fixtures/planets/` contains temperate, arid and cold-archipelago inputs.
- `tests/` — `node --test` files, each well under two seconds.

See [AGENTS.md](AGENTS.md) for the rules that agents working here follow.
M1's API choices, toy parameters and acceptance map are in
[docs/m1-implementation.md](docs/m1-implementation.md).
M2a's APIs, acceptance map, measurements and limitations are in
[docs/m2-implementation.md](docs/m2-implementation.md).
