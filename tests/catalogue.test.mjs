import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {extractTable} from './table-helpers.mjs';
import { CATALOGUE,IMPLEMENTED,validateCatalogue } from '../src/catalogue.mjs';
import { loadPlanet,StubEnvironment,validatePlanet } from '../src/environment.mjs';
test('catalogue agrees with independently parsed binding JSON; undeclared read rejected',()=>{
  const text=readFileSync(new URL('../docs/transition-table-v1.md',import.meta.url),'utf8');
  const table=extractTable(text);
  assert.equal(CATALOGUE.length,39);assert.equal(IMPLEMENTED.length,39);assert.equal(validateCatalogue(CATALOGUE,table),true);
  assert.throws(()=>validateCatalogue([{...CATALOGUE[0],reads:[...CATALOGUE[0].reads,'region.secret']}],table),/Undeclared/);
  assert.throws(()=>validateCatalogue([CATALOGUE[0],CATALOGUE[0]],table));
});
test('three explicit stubs and availability cannot confuse missing with empty',()=>{
  for(const [name,count] of [['temperate',12],['arid',8],['cold-archipelago',10]]){const p=loadPlanet(name).planet;assert.equal(p.partition.value.regions.length,count);const env=new StubEnvironment([p]);assert.equal(env.lifecycle(p.body).status,'known');assert.equal(env.lifecycle('missing').status,'absent');assert.equal(env.epoch(p.body,'r00',0n).value.Kbase,p.epochs.value.rows[0].Kbase);}
  const p=loadPlanet().planet;p.partition.value.regions[0].adjacency=[];assert.throws(()=>validatePlanet(p));
});
