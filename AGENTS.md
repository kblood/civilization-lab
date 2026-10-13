# Civilization Lab — agent rules

Read [README.md](README.md) first: the vision and the determinism rules there
are binding.

## Repository rules

- Local git only, branch `main`. **Never push, never add a remote, never
  deploy, never start a new web preview.**
- One writer at a time commits to `main`. Commit trailers:

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <session url>
  ```

  Add `Co-Authored-By: gpt-6-astra (Codex) <noreply@openai.com>` when Astra
  wrote the code.
- **Universe Atlas (`../universe-atlas`) is read-only** from this repository.
  Read its README, `docs/` and `src/` (time/universe model, planet queries,
  surface climate, habitat suitability, census/life placement, Creature Lab) to
  learn its determinism conventions and what a civilisation layer could query.
  Do not edit it.

## Determinism

- No `Date.now`, `new Date()`, `performance.now`, `Math.random`,
  `crypto.getRandomValues`, `randomUUID` in `src/` (enforced by
  `tests/determinism-lint.test.mjs`).
- Seeded split RNG streams per `(seed, entity, level, time bucket)`.
- No iteration-order dependence; sort explicitly.
- Integer or well-defined float math; quantise before digesting.
- The `**` operator and `Math.pow` are forbidden in `src/`; use integer shifts, BigInt shifts or literal constants (enforced by `tests/determinism-lint.test.mjs`).
- Same seed gives the same history independent of query order and of which
  levels were realised. Every scenario emits a digest of its results.

## Lean testing

- Minimal, fast, deterministic `node --test` files under `tests/`, each under
  two seconds. No browser, no GPU, no network, no dependencies.
- Never claim a pass you did not observe; quote the command and its result.

## Roles

- Always use the newest model available in the requested family. Check the
  current runtime's model list or aliases when assigning work; avoid pinning an
  outdated numbered release in these reusable role instructions.
- **OpenAI/Codex:** Sol handles coding; if Sol is unavailable, Astra may code.
  Luna handles tests and verification. Astra handles task planning, 3D model
  creation, and 3D quality assessment. Keep Astra implementation runs
  workspace-write and confined to this repository; the runner reviews diffs
  and observes checks before committing.
- **Claude:** Haiku handles tests and searches, Sonnet handles coding, and Opus
  handles task planning, 3D model creation, and 3D quality assessment. Use the
  newest available model in each family.
- For visual review, use the assigned planning/model-quality agent and retain
  the existing Luna-specific generated-image workflow when required by the
  asset or test instructions. Ask three times for a disputed image and report
  every answer. Exit code 2 means Luna is unavailable: report "visual check
  NOT done".
- Delegate bounded tasks, parallelize independent read-heavy work, and
  serialize shared-file edits and resource-heavy operations. A model assignment
  does not override this repository's permissions, single-writer, determinism,
  test, or no-deploy rules.

## Evidence standard

Every research claim carries a source URL and a confidence. Never fabricate a
citation; anything recalled rather than read is marked
"from memory, unverified". Research notes live in `docs/research/`.
