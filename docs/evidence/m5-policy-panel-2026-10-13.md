# M5 policy panel: 2026-10-13

The complete 360-run panel was executed on commit
`660f3d9b149434977b10d2e5eef7b1681f56d34b` (source hash
`e05874cdc3e2b53afa9fc3924a1a4cc4b087f11eb8672b004b8703f6d1cec5fc`). It
covered 30 matched seeds in each of `crowded-domain`, `high-perils`, and
`doomed-star`, with baseline (B), targeting (T), colony (C), and combined (TC)
arms through year 30,000. The panel completed all 360 rows and all 12
deterministic reruns.

The run is **not a passing policy validation**: it recorded 38 errors and
zero cohort-conservation failures among successful rows. Every error is
`TypeError: Invalid CivEvent` from event validation, and every one is in T or
TC. Failures occurred for both targeting arms on crowded-domain seeds 3, 5, 8,
10, 14, 15, 16, 17, 19, 20, and 21 (22 failures), and doomed-star seeds 1, 3,
12, 15, 17, 21, 23, and 24 (16 failures). Baseline and colony-only arms passed
all their rows; high-perils passed all 120 rows but produced no colonization,
so it gives no evidence about these policies.

The successful crowded-domain rows showed B with 339 launches, 27 new colonies
and 273 reinforcements; C had 532 launches, 22 new colonies and 487
reinforcements. The successful doomed-star rows showed B with 302 launches, 18
new colonies and 283 reinforcements; C had 619 launches, 24 new colonies and
581 reinforcements. These raw totals are descriptive only: the targeted arms
failed on a substantial, seed-dependent subset, so paired comparisons are
incomplete and no policy recommendation should be drawn from them. All 12
deterministic reruns matched their result digests. Runtime and per-seed
outcomes are in the machine report.

The next M5 step is to diagnose and fix the invalid event produced by targeting
before repeating the same frozen panel. Keep targeting disabled by default
until that rerun is clean. The complete JSON, Markdown and resumable checkpoint
were retained locally at
`out/m5-policy-panel-20261013.{json,md,checkpoint.json}`; `out/` is ignored by
Git.
