#!/usr/bin/env node
import { createToy } from './toy.mjs';
const toy = createToy();
const root = toy.resultDigest();
if (process.argv.includes('--digest')) console.log(root);
else {
  const chapters = [toy.chapter(0), toy.chapter(1)];
  console.log(`Toy civ-toy-1: 12,800 years, 1 region, ${chapters.reduce((n, c) => n + c.events.length, 0)} events; final population ${chapters[1].ledgers.at(-1).endState.pop}.`);
  console.log(`Result digest: ${root}`);
}
