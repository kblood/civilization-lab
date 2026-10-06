# Determinism hygiene: removing `**` from src/ (2026-10-07)

Lane L5 of `universe-atlas/docs/parallel-development-plan-2026-10-07.md`.
Branch `hygiene/determinism`, based on `main` at 99527f4. Astra (gpt-6-astra,
workspace-write) made the edits; Opus reviewed the diff, ran the checks and
committed.

## What changed

| File | Change | Value |
|---|---|---|
| `src/planet.mjs` (TARGET_FAILURE handler, line 572) | `1000*2**(count-1)` becomes `1000*(1<<(count-1))` | `count` is clamped to 1..4, so the result is 1000/2000/4000/8000 either way |
| `src/fixed.mjs` | `ONE = 2n ** 32n` becomes `1n << 32n` | 4294967296n |
| `src/time.mjs` | `10n ** 9n` becomes the literal `1_000_000_000n` | `YEAR_NS` stays 31557600000000000n |
| `tests/determinism-lint.test.mjs` | Adds an `EXPONENT` rule (`/[\w$)\]]\s*\*\*/`) to every `src/` file. Removes the `fixed.mjs` exemption from the transcendental rule. Adds negative self-checks. | — |
| `tests/fixed.test.mjs` | Asserts `ONE === 4294967296n` | — |
| `README.md`, `AGENTS.md` | One sentence: `**` and `Math.pow` are forbidden in `src/` | — |

The `fixed.mjs` exemption was safe to remove. `logPos` is a pure-arithmetic
series ported from Atlas `det-math.ts`, and the only `Math` call left in the file
is `Math.floor`. With no exemption, the transcendental rule passes on every
`src/` file.

The `EXPONENT` regex looks for the operator: an identifier, number, `)` or `]`
followed by `**`. So it matches `2**(n-1)`, `2n ** 32n`, `x **= 2`, `a[i]**2`
and `f(x) ** 2`. It does not match `/**` doc-comment openers, ` * ` bullets or
`a*b*c`. The self-check test asserts all of these cases.

## Evidence

**The lint has teeth.** We copied the new lint test next to `main`'s untouched
`src/` (via `git archive main src`) and ran it. It fails with exactly three
offenders: `fixed.mjs`, `planet.mjs` and `time.mjs`.

**Digests are byte-identical.** One shell script ran these commands in
sequence (concurrency 1), once on `main` before the edits and once on the
branch after them:

- `node src/cli.mjs --digest` (the M1 toy; same as `npm run digest`)
- `--civ fixtures/planets/{temperate,arid,cold-archipelago}.json --seed civ-m2a-1 --digest`
- `--domain fixtures/domains/toy-12.json --seed toy-1 --digest`
- `--domain fixtures/domains/toy-12.json --seed toy-14 --years 100000 --digest`
- `--scenario` runs, keeping only the manifest, recipe, result and narrative
  digests: crowded-domain-0, crowded-domain-1, high-perils-0, doomed-star-0
  and lonely-earthlike s1

`cmp` reported no differences. Both captures have sha256
`184ba8c2717c5c0fb624f4b3290c82bb54db43de84ea037bf726f3c2cf825538`.
Selected values:

```
M1 toy                     c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc
toy-12 / toy-1             4dfa1f02aaeea2cacad29fdb29decdaaa983540bb32001c79d889769c04ec67b
toy-12 / toy-14 / 100 kyr  93d2f18bc142d9557e0618974f19b1f23c86da68ba8a6ec8ebd542919abdd106
crowded-domain-0 result    68756757785dbf532a85dbc61c4c5e874e6217f746d63a38644d7261cb2c4bc7
lonely-earthlike s1 result dce258cbe7a5b7bc4fa5d694c564b5e1af8fbc76f1f7a1b99f42bd4550d17fe6
```

**The changed line is exercised.** A probe walked each `compileSummary()`
result for `targetFailures` entries. This check only observes the results; it
is not a test.

- toy-12/toy-1: 98 memory entries, with counts 1, 2 and 3.
- toy-12/toy-14 (100 kyr): 40 entries, with counts 1, 2, 3 and 4.

So the digests above cover every backoff step. The five scenario runs record no
target failures (they top out at E4). They guard the BigInt constant changes.
`tests/m4-target-memory.test.mjs` also asserts the exact backoff values
`[1000,2000,4000,8000,8000]`.

**Signature output is identical.** `tests/signatures.test.mjs` prints the same
observed Kremer panel on `main` and on the branch:
`{"temperate":{"times":[27598,36050,50044,1416],"median":27598},"cold-archipelago":{"times":[50142,36373,90001,21946],"median":36373}}`.

**`npm test`** uses the repo's `--test-concurrency=1`. It ran on Node v24.7.0,
first on `main` and then on the branch, one after the other.
Both gave 151 tests, 151 pass, 0 fail, 0 skipped, exit 0. The test count does
not change because the new assertions went into existing tests.

## Not done

- No perf, perf:panel or ensemble runs. Timing work waits for a quiet window.
- The digests were not checked on Node 22, because that needs a Node 22
  install.
