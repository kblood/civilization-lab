import {test} from 'node:test';
import {plausibilityShard} from './plausibility-helpers.mjs';
test('plausibility seeds 0..15: active mechanisms and exact invariants',()=>plausibilityShard(0));
