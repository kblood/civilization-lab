import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routesFor,doomedDestination} from '../src/m2b.mjs';
import {createDomain} from '../src/domain.mjs';
import {createScenario} from '../src/scenario.mjs';
import {stellarPolicy} from '../src/civ-input.mjs';
import {forced,region,setOverride} from './civ-helpers.mjs';

// Fable 5.1 decision 2026-10-07 (m5-stellar-2): from the year a body's star doom
// occurs, no launcher on that body targets a destination doomed no later than itself.
const life=stellarDoomYear=>({value:{stellarDoomYear}});
const planets=[['home',25000],['b1',25000],['early',24000],['s01',null],['later',26000]].map(([body,y])=>({body,lifecycle:life(y)}));
const inSystem=[null,null,null,null,null,20,5,1],interstellar=[null,null,null,null,null,null,null,400];
const route=(from,to,destinationHosting,travelYearsByTransportTier)=>({from,to,destinationHosting,travelYearsByTransportTier});
const routes=[route('b1','home','habitable',inSystem),route('b1','s01','habitable',interstellar),route('home','b1','habitat-buildable',inSystem),
  route('home','early','habitat-buildable',inSystem),route('home','later','habitable',interstellar),route('home','s01','habitable',interstellar)];
const def={planet:planets[0],planets,routes};
const at=tick=>({tick,lineageId:'own',signals:[],targetFailures:[]});
const tier=t=>({id:'r',tiers:[5,5,4,t,4,3,4]});
const to=(r,pre)=>routesFor(def,r,pre).map(e=>e.to);

test('unit: routes avoid doomed destinations only from the launcher\'s own doom year',()=>{
  assert.deepEqual(['home','b1','early','s01','later'].map(b=>doomedDestination(def,b)),[true,true,true,false,false]);
  const all=['b1','early','later','s01'];
  assert.deepEqual(to(tier(7),at(2499n)),all);
  assert.deepEqual(to(tier(7),at(2500n)),['later','s01']);
  assert.deepEqual(to(tier(6),at(2499n)),['b1','early']);
  assert.deepEqual(to(tier(6),at(2500n)),[]);
  assert.deepEqual(to(tier(7),null),all);
  // Rule off: own doom null, missing lifecycle, missing planets (own doom known).
  for(const d of [{...def,planet:{body:'home',lifecycle:life(null)}},{...def,planet:{body:'home'}},{planet:planets[0],routes}])
    assert.deepEqual(routesFor(d,tier(7),at(2500n)).map(e=>e.to),all);
  // A companion colony launches by its own doom year, not by an `evacuating` flag
  // (a colony founded after the doom is never flagged): no return to the dying home.
  const colony={...def,planet:planets[1]};
  assert.deepEqual(routesFor(colony,tier(7),at(2499n)).map(e=>e.to),['home','s01']);
  assert.deepEqual(routesFor(colony,tier(7),{...at(2501n),evacuating:false}).map(e=>e.to),['s01']);
});

function evac(atTick,t,ticks=53) {
  const f=forced('STELLAR_DOOM');f.base='fixtures/domains/m4c-doomed-star.json';f.initial.atTick=atTick;f.ticks=ticks;
  f.initial.regions=[region('r00',{pop:'100000',infra:'10000000',tiers:[5,5,4,t,4,3,4]})];
  setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.keepPermille','1000');setOverride(f,'hazard.LAUNCH.q32','171798691840');
  const r=createDomain(f.base,f.seed,{forced:f}).run();
  return {r,launches:r.events.filter(e=>e.kind==='LAUNCH'&&e.data.launch)};
}
test('fixture: a tier-7 evacuation sends every launch interstellar; tier 6 has nowhere to go',()=>{
  const {r,launches}=evac('2499',7);
  assert.ok(launches.length>0);
  for(const e of launches)assert.equal(e.data.launch.destination,'stub:s01:b0');
  const founded=r.events.filter(e=>e.kind==='COLONY_FOUNDED');
  // The forced region gains SPACEFLIGHT at 24,990, so the first launch is dated 25,001
  // (inside tick 2500) and its 400-year voyage is delivered at tick 2541 = year 25,410.
  assert.equal(launches[0].dateYear,25001);
  assert.ok(founded.length>0&&founded.every(e=>e.ownerId==='stub:s01:b0'));assert.equal(founded[0].dateYear,25410);
  assert.deepEqual(r.state.arcs.map(a=>a.body),['stub:s01:b0']);
  assert.ok(!r.outcome.startsWith('EXTINCT_'));
  const six=evac('2499',6);
  assert.equal(six.launches.filter(e=>e.dateYear>=25000).length,0);
  assert.equal(six.r.outcome,'EXTINCT_STELLAR');
});
test('fixture: before the doom year nothing changes (no foreknowledge)',()=>{
  const {r,launches}=evac('2480',6);
  assert.ok(launches.some(e=>e.dateYear<25000&&['stub:s00:b1','stub:s00:b2'].includes(e.data.launch.destination)));
  assert.ok(r.events.some(e=>e.kind==='COLONY_FOUNDED'&&e.dateYear<25000&&e.ownerId!=='stub:s00:b0'));
  assert.equal(launches.filter(e=>e.dateYear>=25000&&e.data.launch.destination.startsWith('stub:s00:')).length,0);
});
test('manifest: doomed worlds carry m5-stellar-2, others no stellar block',()=>{
  assert.deepEqual(createScenario('doomed-star','m5-evac',{untilYear:10}).world.def.manifest.scenarioPriors.stellarPolicy,
    {version:'m5-stellar-2',graceYears:500,doomedDestinations:'excluded-from-own-doom-year'});
  assert.deepEqual(stellarPolicy(500),{version:'m5-stellar-2',graceYears:500,doomedDestinations:'excluded-from-own-doom-year'});
  assert.equal(createScenario('crowded-domain','m5-evac',{untilYear:10}).world.def.manifest.scenarioPriors.stellarPolicy,undefined);
});
