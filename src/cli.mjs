#!/usr/bin/env node
// Civilization Lab CLI — placeholder until the first scenario engine lands.
// Deterministic by construction: no clock, no Math.random, no I/O beyond stdout.

const args = process.argv.slice(2);

if (args.includes('--digest')) {
  process.stdout.write('civilization-lab: no scenarios implemented yet; nothing to digest\n');
} else {
  process.stdout.write('civilization-lab: theoretical lab, no scenarios implemented yet\n');
}
