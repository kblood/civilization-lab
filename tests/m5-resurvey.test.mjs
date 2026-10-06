import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,createScenario} from '../src/scenario.mjs';
import {uninhabitableAt} from '../src/domain.mjs';
// With an absorbing window, any launch suppressed by the 10,000-year resurvey
// (TARGETING_M5.uninhabitableResurveyYears) would itself be rejected: resurvey
// cannot starve colonisation. A temporary window would make the delay a real cost.
function intervals(def,p){
  const found=[];let start=null;
  for(let t=def.fromTick;t<def.untilTick;t++){
    if(uninhabitableAt(def,p,t)){if(start===null)start=t;}
    else if(start!==null){found.push({from:start,until:t});start=null;}
  }
  if(start!==null)found.push({from:start,until:def.untilTick});return found;
}
const absorbing=(def,rows)=>{for(const r of rows)assert.equal(r.until,def.untilTick,'TEMPORARY uninhabitable interval');};
test('all reachable scenario destinations have only absorbing uninhabitable intervals',()=>{
  const actual={},expected={};
  for(const name of SCENARIOS){
    const {world,domain}=createScenario(name,name+'-0');if(!domain)continue;
    const def=world.def,destinations=[...new Set(def.routes.filter(r=>['habitable','habitat-buildable'].includes(r.destinationHosting)&&r.travelYearsByTransportTier.some(t=>t!==null)).map(r=>r.to))].sort();
    actual[name]={};expected[name]={};
    for(const body of destinations){const rows=intervals(def,def.planets.find(p=>p.body===body));absorbing(def,rows);if(rows.length)actual[name][body]=rows.map(r=>({fromYear:Number(r.from*10n),untilYear:Number(r.until*10n)}));}
  }
  expected['doomed-star']['stub:s00:b0']=[{fromYear:25500,untilYear:30000}];assert.deepEqual(actual,expected);
});
test('resurvey guard detects temporary habitability and middle-epoch gaps',()=>{
  const {world}=createScenario('crowded-domain','crowded-domain-0'),def=world.def,p=structuredClone(def.planets.find(p=>p.hosting==='habitable'));
  p.lifecycle.value.habitableFromYear=5000;
  const late=intervals(def,p);assert.ok(late.length);assert.equal(late[0].until,500n);assert.throws(()=>absorbing(def,late),/TEMPORARY/);
  const gap=structuredClone(def.planets.find(p=>p.hosting==='habitable')),base=gap.epochs.value.rows[0];
  gap.epochs.value.rows=[{...base,fromEpoch:'0',untilEpoch:'5'},{...base,fromEpoch:'5',untilEpoch:'6',Kbase:'0'},{...base,fromEpoch:'6',untilEpoch:'30'}];
  const middle=intervals(def,gap);assert.deepEqual(middle,[{from:500n,until:600n}]);assert.throws(()=>absorbing(def,middle),/TEMPORARY/);
});
