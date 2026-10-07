# Evacuation to doomed worlds: launches after stellar doom avoid them (2026-10-07)

Branch `scenario/evacuation-doom`, based on `main` at e735dbd. **Decided by
Fable 5.1 on Kasper's instruction; overrulable.** Opus implemented, ran the
checks and committed. Follows [neighbours-doom](neighbours-doom-2026-10-07.md),
which made the companion worlds die with the star and left "evacuation
targeting that knows about the doom" as an open decision.

## The rule

From the year a body's star doom occurs (`year >= own stellarDoomYear`), no
launcher on that body targets a destination whose star dies no later than its
own (`dest.stellarDoomYear != null && dest.stellarDoomYear <= own.stellarDoomYear`).
Before the doom year nothing changes (no foreknowledge).

- `src/m2b.mjs`: new exported pure helper `doomedDestination(def, body)`; one
  AND-ed clause in `routesFor`. LAUNCH opportunities (`extraOpportunities`) and
  the LAUNCH destination pick (`extraMagnitudes`) both go through `routesFor`, so
  a tier-6 launcher after the doom has no route and gets no LAUNCH opportunity.
  Stub definitions without `lifecycle` or `planets` switch the rule off. No new
  LAUNCH params.
- `src/civ-input.mjs` / `src/domain.mjs`: the manifest `stellarPolicy` block for
  worlds with non-null stellar doom is now the frozen
  `stellarPolicy(graceYears)` = `{version:'m5-stellar-2', graceYears,
  doomedDestinations:'excluded-from-own-doom-year'}` (was `m3b-stellar-1`). The
  RNG manifest digest is still taken after it.
- `docs/transition-table-v1.md`: section "Runner decision 2026-10-07 (M5):
  launches after stellar doom avoid doomed destinations" appended after the
  `<!-- M2A-WITNESS-ANNEX -->` marker. `contractDigest`
  `89357d1c…383e` and `tableDigest` `0ca39022…349e` are unchanged (printed before
  and after from `createDomainDefinition().manifest.scenarioPriors`).

## Decision text (Fable 5.1, verbatim)

## Fable 5.1 decision: evacuation to doomed worlds (2026-10-07), on Kasper's instruction, overrulable

Evidence: CONTRACT_TEXT/TABLE are cut at the `<!-- M2A-WITNESS-ANNEX -->` marker (line 6187 of docs/transition-table-v1.md); the m3b-stellar-1 JSON sits at line 6315, after it. A stellar-policy version bump lives only in src/domain.mjs:79 and src/civ-input.mjs:118, and the manifest moves only for fixtures with a doomed planet. doomed-star-0 on main: 0 LAUNCH, 0 COLONY_FOUNDED, EXTINCT_STELLAR at E3 (492 events); its digests move only via the re-keyed RNG stream. Probe of the m3b 3,000-year control (tests/stellar-grace setup, tiers[3] = 6 vs 7): at tier 7 home launches to s01:b0 at 3000/3010/3030/3040, founds the interstellar colony at 3400, reinforces by 3440 inside the 53-tick window to 3520; but also wastes launches on b1 (3020, 3060) and b2 (3050), and the undoomed b1/b2 colonies launch back to the dying b0 at 3100 and 3200. At tier 6 every launch goes to b1/b2.

### 1. Decision

(a) Default, not opt-in, gated on the observed doom. From the year a body's star doom occurs (`year >= own stellarDoomYear`), no launcher on that body targets a destination whose star dies no later than its own (`dest.stellarDoomYear != null && dest.stellarDoomYear <= own.stellarDoomYear`). Before the doom year nothing changes (no foreknowledge). The manifest stellarPolicy block is bumped from m3b-stellar-1 to a new version.

Reasoning: realism (STELLAR_DOOM fires on every arc at year D; a spaceflight civ knows which worlds share the star); default rather than opt-in because it is a correctness consequence of Kasper's physical ruling with an analytically exact effect, unlike the epistemic M5 policies; lifecycle-based rather than route.kind==='in-system' (the physical fact; generalises to Atlas systems); year gate rather than pre.evacuating (a colony founded on b1 at 25,010 by a pre-doom voyage never sees year 25,000 so is never flagged evacuating; stub defs without lifecycle switch the rule off naturally); determinism: pure function of (def, region, pre), integer compare, find over sorted def.planets, no floats, no `**`. Digest movement: only fixtures with non-null stellarDoomYear get the new manifest block; in tools/digest-capture.sh that is exactly doomed-star-0; the other 13 blocks byte-identical; no test pins a doomed digest.

(b) Align m3b-doomed-star-system.json (companions die at 3,000) and retire the exemption; the control's grace purpose survives with tiers[3] 6 -> 7 (interstellar survivor at s01:b0); tests/stellar-grace becomes the fixture-level proof of the new rule; closes the "colonies launch back to the dying home" pathology; m3b is not in digest-capture; tests/m4-scenarios only checks bodies[0] doom = 3000.

Risks: whole doomed-star history redrawn, seed-0 class may change (expected; say so); docs/evidence/m4-plausibility-after.json stays stale for doomed-star; a destination doomed later than the launcher stays an allowed refuge at full weight (open refinement); when habitats/arks are modelled this rule becomes conditional on that capability; matched variates via excluding the stellar block from rngManifestDigest deliberately not done.

### 2. Implementation brief

Read first: AGENTS.md, README.md determinism rules, docs/neighbours-doom-2026-10-07.md, docs/m5-round2-2026-10-07.md part (c), this decision. Branch scenario/evacuation-doom from main e735dbd. Commit on the branch with AGENTS.md trailers; no merge, no push, no remotes.

Commit 1, the rule:
- src/m2b.mjs: exported pure helper next to routesFor, e.g. doomedDestination(def, body): `dest != null && own != null && dest <= own`, own = def.planet.lifecycle?.value.stellarDoomYear ?? null, dest from def.planets.find(p => p.body === body) (def.planets carried by arcDefinition, src/domain.mjs:60-65). In routesFor (src/m2b.mjs:26-30) add one AND-ed clause: `!(pre && own != null && Number(pre.tick*10n) >= own && doomedDestination(def, e.to))`. Guard lookups so stub defs in tests/m5-targeting.test.mjs:61-62 (no lifecycle, no planets) leave the rule off. extraOpportunities (line 55) and extraMagnitudes destination pick (line 76) both go through routesFor. No new LAUNCH params.
- src/domain.mjs:79 and src/civ-input.mjs:118: replace the stellarPolicy block with the same new frozen object in both places, e.g. {version:'m5-stellar-2', graceYears, doomedDestinations:'excluded-from-own-doom-year'}. Keep rngManifestDigest (line 80) after it.
- docs/transition-table-v1.md: append "Runner decision 2026-10-07 (M5): launches after stellar doom avoid doomed destinations" with its json block AFTER the `<!-- M2A-WITNESS-ANNEX -->` marker (e.g. after the M5 round 2 section); M3b section stays as history. Confirm contractDigest/tableDigest unchanged (print createDomainDefinition().manifest.scenarioPriors.{contractDigest,tableDigest} before/after; crowded-domain CLI sha pinned in tests/m5-tooling.test.mjs:18 is the tripwire).
- New tests/m5-evacuation-doom.test.mjs (< 2 s): (i) unit: planets {home doom 25000, b1 doom 25000, s01 doom null, one doom 26000}, tier 7, E,B >= 5; tick 2499 all routes; tick 2500 only s01 and the later-doomed one; tier 6 after doom zero routes; pre = null unaffected. (ii) fixture: forced run like tests/stellar-grace.test.mjs:7-11 with base fixtures/domains/m4c-doomed-star.json, atTick '2499', ticks 53, tiers [5,5,4,7,4,3,4], LAUNCH hazard forced: every accepted LAUNCH has e.data.launch.destination === 'stub:s01:b0', COLONY_FOUNDED on s01:b0 at 25,400, outcome not EXTINCT_; tier-6 variant: no accepted LAUNCH after 25,000 and EXTINCT_STELLAR; pre-doom variant (atTick '2480', colonizer, tier 6): launches to b1/b2 still occur. (iii) manifest: createScenario('doomed-star', ..., {untilYear:10}).world.def.manifest.scenarioPriors.stellarPolicy deep-equals the new block; absent for crowded-domain. (Adjust exact numbers to what the code actually produces only if the assumption was wrong; explain any deviation.)
- README.md status paragraph; new docs/evacuation-doom-2026-10-07.md: decision text (decided by Fable 5.1 on Kasper's instruction, overrulable), the rule, digest table, test counts, open items.

Commit 2, m3b alignment:
- tools/build-m5-neighbours-doom.mjs takes the system path from process.argv[2] (default m4c); run on fixtures/planets/m3b-doomed-star-system.json; second run gives empty git diff --stat. Leave tools/build-m3b-fixtures.mjs untouched; document the two-step reproduction.
- tests/stellar-grace.test.mjs: survivors case tiers [5,5,4,7,4,3,4]; assert every accepted LAUNCH after 3000 targets stub:s01:b0 and COLONY_FOUNDED on s01:b0 at 3400; add tier-6 case expecting EXTINCT_STELLAR with zero accepted LAUNCH. Second test (origin 3600 -> NO_LINEAGE) untouched.
- tests/m5-neighbours-doom.test.mjs: delete the exemptions list, guard every civ-system-stub-1 fixture, keep a negative self-check by cloning the m4c system in memory, nulling one companion's doom, and asserting the guard throws.

Digests that may move: only the `### src/cli.mjs --scenario doomed-star --seed doomed-star-0` block. Everything else byte-identical; no pinned test digest changes.

Verification (quote commands and results):
1. npm test (Node v24, --test-concurrency=1): all pass, 0 fail, 0 skipped.
2. bash tools/digest-capture.sh <clean checkout of main e735dbd> before.txt; sha256 must be f94c1c042ae5262dee23d151ff423dbc9cd3df2e6557ade8b1ac8f48d9e75c4e. Then on the branch -> after.txt; diff hunks only inside the doomed-star-0 block. Record the new four digests and summary line. Repeat after commit 2: no further movement.
3. Builder idempotence.
4. Optional, quiet window only: node src/cli.mjs --ensemble 30 --scenario doomed-star --jobs 2 --out out/evac-doom; report outcome classes and zero LAUNCH to s00:b1/s00:b2 with dateYear >= 25000.

### 3. For Kasper
Evacuation now follows the ruling by default: from the year a star's doom is observed, nobody in that system launches to a world that dies no later than their own, so a tier-7 civilisation sends every evacuee interstellar. Only doomed-star digests move. The old 3,000-year m3b control is aligned too, because the same pathology existed there (its surviving colonies even launched back to the dying home world).

## Digests: only doomed-star-0 moved

`bash tools/digest-capture.sh` at concurrency 1; before on the clean `main`
checkout at e735dbd, after on the branch worktree.

| Capture | sha256 |
|---|---|
| before (main e735dbd) | `f94c1c042ae5262dee23d151ff423dbc9cd3df2e6557ade8b1ac8f48d9e75c4e` (as expected) |
| after commit 1 | `9dafd549e0195726afac458ddbc47d1a967a6b194ee29a7319e433d625725664` |

`diff before after` hunks: `294,295c`, `299a300`, `300a302`, `304,330c`,
`332,335c`, all inside the `--scenario doomed-star --seed doomed-star-0` block
(lines 293–336 of the before file). Every other block is byte-identical.

| doomed-star-0 | Before (e735dbd) | After |
|---|---|---|
| Manifest | `af7f025f…bdf4` | `4be5f38965e35020b063c3adb292d68bf9863f829f9c8cc7ecd3cf1ff21c9679` |
| Recipe | `f0cfd19e…fe95` | `ae78a00418c0590ebd32342a137e6634ecd48f87478dc2fb47e370f605e50660` |
| Result | `32f3e3db…860c` | `d0d26b3d082d9429ef936b8b1bf90dd1f433188523bd1beea6d26f245850afd0` |
| Narrative | `b88c9ca3…5078` | `c9569618751e35e71a8a2ea799d7fdbb507349017a4237b65b3594c1b58de4a2` |
| Summary | 492 events; EXTINCT_STELLAR; max era E3; extinction at 25,000 | 751 events; EXTINCT_STELLAR; max era E4 (12,790); extinction at 25,000 |

The whole doomed-star history is redrawn because the manifest (and therefore
every RNG address) changed; this is not a matched-variate comparison. Seed 0
keeps its class: it still never launches (0 LAUNCH, 0 COLONY_FOUNDED) and with
E < 5 the doom kills at 25,000 without an evacuation window, so the new rule is
not exercised by seed 0 itself; only its variates moved.

## Tests

New `tests/m5-evacuation-doom.test.mjs` (4 tests, about 0.3 s):

- unit: home doom 25,000, b1 doom 25,000, s01 doom null, one destination doomed
  at 26,000; at tick 2499 a tier-7 launcher sees all three routes, at tick 2500
  only s01 and the later-doomed one; tier 6 after the doom has no route;
  `pre = null` and stub defs without lifecycle/planets are unaffected.
- fixture (m4c-doomed-star, forced from tick 2499, 53 ticks, tiers
  [5,5,4,7,4,3,4], LAUNCH hazard forced): every accepted LAUNCH targets
  `stub:s01:b0`; the colony is founded on s01:b0; outcome not EXTINCT_. The
  tier-6 variant has no accepted LAUNCH from 25,000 on and ends EXTINCT_STELLAR.
- fixture, pre-doom (from tick 2480, tier 6): launches to b1/b2 before 25,000
  still occur.
- manifest: doomed-star carries the `m5-stellar-2` block; crowded-domain has no
  stellar block.

**Deviation from the brief:** the first COLONY_FOUNDED on s01:b0 is at
**25,410**, not 25,400. The forced region starts without the `spaceflight` flag,
gains SPACEFLIGHT at 24,990, and its first launch is dated 25,001 (inside tick
2500); the 400-year voyage arrives at 25,401 and is delivered at tick 2541. The
test asserts the first launch at 25,001 and founding at 25,410.

`npm test` (Node v24.7.0, `--test-concurrency=1`) after commit 1: **182 tests,
182 pass, 0 fail, 0 cancelled, 0 skipped** (178 on main + 4 new).

## Commit 2: the m3b 3,000-year control aligned

- `tools/build-m5-neighbours-doom.mjs` now takes the system fixture from
  `process.argv[2]` (default: the m4c system). Run on
  `fixtures/planets/m3b-doomed-star-system.json`, it set b1, b2 and b3 to
  `stellarDoomYear` 3000 (lifecycle digest `85f107b6…face` →
  `692e2ad6…f123`); nothing else in the file changed. A second run on m3b, and a
  run with the default m4c path, leave `git diff --stat` unchanged (idempotent).
  `tools/build-m3b-fixtures.mjs` is untouched, so the m3b control is reproduced
  in two steps: `node tools/build-m3b-fixtures.mjs`, then
  `node tools/build-m5-neighbours-doom.mjs fixtures/planets/m3b-doomed-star-system.json`.
- `tests/stellar-grace.test.mjs`, first test: survivors case at transport tier 7
  (tiers [5,5,4,7,4,3,4]); every accepted LAUNCH from 3,000 on targets
  `stub:s01:b0` (observed: 3,000 and 3,010) and COLONY_FOUNDED on s01:b0 at
  3,400. New tier-6 case with the LAUNCH hazard forced: zero accepted LAUNCH and
  EXTINCT_STELLAR. The no-launch case and the second test (origin 3,600 →
  NO_LINEAGE) are unchanged.
- `tests/m5-neighbours-doom.test.mjs`: the exemptions list is gone; every
  `civ-system-stub-1` fixture is guarded, and the negative self-check now clones
  the m4c system in memory, nulls one companion's doom and asserts the guard
  throws.

m3b is not in `tools/digest-capture.sh`; the capture after commit 2 is
byte-identical to the one after commit 1 (`9dafd549…5664`).

## Independent review (Astra, read-only)

`codex exec -m gpt-6-astra -s read-only` on `git diff e735dbd`: **no
implementation bug found** ("All launch callers apply the filter; colony
definitions retain `planets`; arrival acceptance remains consistent with the
launch-only decision. Manifest gating and deterministic arithmetic/order look
correct."). Two test findings, both addressed in commit 2:

1. (risk) no coverage of a companion colony that launches after the doom
   without the `evacuating` flag. Added: a unit case with a b1 colony launcher
   (home and s01 routes at tick 2499, only s01 at tick 2501 with
   `evacuating:false`), and the pre-doom fixture now also asserts a companion
   colony was founded before 25,000 and that no accepted launch from 25,000 on
   targets any `stub:s00:` body.
2. (nit) unit coverage lacked an earlier-doomed destination, explicit null own
   doom and missing `planets` with a known own doom; all three added. A mutation
   check (`dest<=own` → `dest===own`) now fails the unit test (3 pass, 1 fail),
   then was reverted.

`npm test` (Node v24.7.0, `--test-concurrency=1`) after commit 2: **182 tests,
182 pass, 0 fail, 0 cancelled, 0 skipped**, 29.1 s.

## Open items

- Later-doomed refuges and habitat/ark survival are decided in
  [stellar-survival-decision](stellar-survival-decision-2026-10-07.md): full
  weight now, survival deferred until its trigger, both reserved for
  `m5-stellar-3`.
- `docs/evidence/m4-plausibility-after.json` stays stale for doomed-star.
- Matched variates (excluding the stellar block from `rngManifestDigest`) were
  deliberately not done.
- The 30-seed doomed-star ensemble was not run (machine busy with other agents'
  universe-atlas tests); it is the measurement for the next quiet window:
  `node src/cli.mjs --ensemble 30 --scenario doomed-star --jobs 2 --out out/evac-doom`,
  then report outcome classes and confirm zero LAUNCH to s00:b1/s00:b2 with
  dateYear >= 25000.
