import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScenario,loadScenario,SCENARIOS} from '../src/scenario.mjs';
import {spawnSync} from 'node:child_process';
test('five closed scenarios load, bounded execution overrides preserve prefixes, direct descriptions work',()=>{
  assert.equal(SCENARIOS.length,5);
  for(const name of SCENARIOS){const a=createScenario(name,'scenario-prefix',{untilYear:100}),b=createScenario(name,'scenario-prefix',{untilYear:200}),x=a.world.run(),y=b.world.run();
    assert.equal(a.world.def.manifestDigest,b.world.def.manifestDigest);assert.equal(a.world.def.recipeDigest,b.world.def.recipeDigest);assert.deepEqual(x.events,y.events.filter(e=>BigInt(e.tick)<10n));
    assert.equal(loadScenario(name).schemaVersion,'civ-scenario-1');}
  assert.equal(createScenario('fixtures/planets/temperate.json','direct',{untilYear:100}).domain,false);
  const r=spawnSync(process.execPath,['src/cli.mjs','--scenario','lonely-earthlike','--seed','s1','--until-year','100'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  for(const field of ['Outcome:','maximum era','first reached:','model attribution','Level consistency: PASS','Manifest digest:','Recipe digest:','Result digest:','Narrative digest:'])assert.ok(r.stdout.includes(field),field);
});
