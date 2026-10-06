#!/usr/bin/env bash
# Usage: capture.sh <repo-dir> <out-file>   (sequential, concurrency 1)
set -u
cd "$1" || exit 2
out="$2"
: > "$out"
run() { echo "### $*" >> "$out"; node "$@" >> "$out" 2>&1; echo "### exit $?" >> "$out"; }
run src/cli.mjs --digest
for p in temperate arid cold-archipelago; do run src/cli.mjs --civ fixtures/planets/$p.json --seed civ-m2a-1 --digest; done
run src/cli.mjs --civ fixtures/planets/temperate.json --seed civ-m2a-1
run src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1 --digest
run src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-14 --years 100000 --digest
run src/cli.mjs --domain fixtures/domains/toy-12.json --seed toy-1
for s in crowded-domain-0 crowded-domain-1; do run src/cli.mjs --scenario crowded-domain --seed $s; done
run src/cli.mjs --scenario high-perils --seed high-perils-0
run src/cli.mjs --scenario doomed-star --seed doomed-star-0
run src/cli.mjs --scenario lonely-earthlike --seed s1
run src/cli.mjs --scenario forager-future --seed forager-future-0 --until-year 20000
echo "### signatures" >> "$out"
node --test --test-concurrency=1 tests/signatures.test.mjs 2>&1 | grep -E "Observed Kremer panel|^. (tests|pass|fail|skipped) " >> "$out"
