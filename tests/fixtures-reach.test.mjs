import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMPLEMENTED } from '../src/catalogue.mjs';
import { forced,runForced } from './civ-helpers.mjs';
test('all 31 kinds fire through their actual guards and hazards',()=>{
  assert.equal(IMPLEMENTED.length,31);
  for(const k of IMPLEMENTED){const result=runForced(forced(k.kind));assert.ok(result.events.some(e=>e.kind===k.kind&&e.resolution==='accepted'),k.kind);assert.ok(result.events.every(e=>IMPLEMENTED.some(k=>k.kind===e.kind)));}
});
