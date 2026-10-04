import {test} from 'node:test';
import {checkCellScenarios} from './projection-cell-helpers.mjs';
test('crowded and high-perils: every region/tick preserves populations, phase budgets, events and categorical state',()=>{
  checkCellScenarios(['crowded-domain','high-perils']);
});
