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
- Same seed gives the same history independent of query order and of which
  levels were realised. Every scenario emits a digest of its results.

## Lean testing

- Minimal, fast, deterministic `node --test` files under `tests/`, each under
  two seconds. No browser, no GPU, no network, no dependencies.
- Never claim a pass you did not observe; quote the command and its result.

## Roles

- **Sonnet agents** — web research. Economical with WebSearch (per-session
  quota); read pages with WebFetch; `gh search`/`gh api` for code.
- **Astra** (`gpt-6-astra` via the Codex CLI) — research, design and
  implementation. Read-only runs for research/design/review; workspace-write
  runs for implementation, confined to this directory. Astra edits files only;
  the runner reviews `git diff`, runs checks and commits. Never invent Astra's
  answer — if a run fails, say so.
- **Opus** — design, review, and running the runner steps (checks, commits).
- **Luna** (GPT Luna 6) — judges anything visual, only generated images, via
  `node scripts/luna-eyes.mjs` from `../universe-atlas`. Ask three times for a
  disputed image and report every answer. Exit code 2 means Luna is unavailable:
  report "visual check NOT done".

## Evidence standard

Every research claim carries a source URL and a confidence. Never fabricate a
citation; anything recalled rather than read is marked
"from memory, unverified". Research notes live in `docs/research/`.
