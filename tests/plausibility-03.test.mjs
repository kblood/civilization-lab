import {test} from 'node:test';
import {plausibilityShard} from './plausibility-helpers.mjs';
test('plausibility seeds 32..47: active mechanisms and exact invariants',()=>plausibilityShard(2));
