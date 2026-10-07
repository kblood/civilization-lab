import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit,render,SEED0,SEED0_DIGEST,REFUGE} from '../tools/m5-doomed-star-audit.mjs';
import {summarizeRun} from '../src/ensemble.mjs';
import {createDomain} from '../src/domain.mjs';
import {forced,region,setOverride} from './civ-helpers.mjs';

// Fable 5.1 brief 2026-10-07: the doomed-star audit's pure audit(runs) over
// summarizeRun records. Synthetic positives/negatives, then one real forced run.
const LIN='lin:stub:s00:b0',arc=body=>`arc:${body}:${LIN}:0`;
const HOME=arc('stub:s00:b0'),B1=arc('stub:s00:b1'),S01=arc('stub:s01:b0');
const ev=(id,kind,dateYear,ownerId,data={},causes=[])=>({id,kind,dateYear,ownerId,salience:0,causes,data:{outcome:null,launch:undefined,...data}});
const launch=(id,year,sourceArc,destination,travel)=>ev(id,'LAUNCH',year,sourceArc+'#r00',{launch:{id:'voy:'+id,lineageId:LIN,sourceArc,sourceRegion:sourceArc+'#r00',
  destination,launchEventId:id,launchYear:year,arrivalYear:year+travel,tiers:[5,5,4,7,4,3,4]}});
const arrival=(id,year,body,launchId,outcome=null)=>ev(id,'COLONY_FOUNDED',year,body,{outcome},[{eventId:launchId,edge:'EXOGENOUS',weightPermille:1000}]);
const arcRow=(id,body,isColony)=>({id,body,lineageId:LIN,isColony});
const summary=(seed,patch)=>({scenario:'doomed-star',seed,untilYear:'30000',endYear:30000,outcome:'EXTINCT_STELLAR',classes:['EXTINCT_STELLAR'],
  firstEras:[0,1000,3000,9000,null,null,null,null],firstEnergy:[0,1000,3000,9000,null,null,null],resultDigest:'0'.repeat(64),...patch});
function synthetic() {
  const dead=summary(SEED0,{endYear:25020,resultDigest:SEED0_DIGEST,timeline:{observations:[],arcs:[arcRow(HOME,'stub:s00:b0',false)],events:[
    ev('d0','STELLAR_DOOM',25000,HOME),ev('x0','EXTINCTION',25010,HOME),ev('l0','LINEAGE_EXTINCTION',25019,LIN,{outcome:'EXTINCT_STELLAR'})]}});
  const alive=summary('doomed-star-1',{outcome:'EXTANT_MULTI_SYSTEM',classes:['EXTANT_MULTI_SYSTEM'],resultDigest:'1'.repeat(64),
    firstEras:[0,1000,3000,9000,12000,20000,24990,null],firstEnergy:[0,1000,3000,9000,12000,20000,null],
    timeline:{observations:[],arcs:[arcRow(HOME,'stub:s00:b0',false),arcRow(B1,'stub:s00:b1',true),arcRow(S01,'stub:s01:b0',true)],events:[
      launch('L1',24500,HOME,'stub:s00:b1',5),arrival('c1',24510,'stub:s00:b1','L1'),
      ev('d1','STELLAR_DOOM',25000,HOME),ev('d2','STELLAR_DOOM',25000,B1),
      launch('L2',25001,HOME,REFUGE,400),arrival('c2',25410,REFUGE,'L2'),
      ev('d3','STELLAR_DOOM',25500,HOME),ev('d4','STELLAR_DOOM',25500,B1),ev('x1','EXTINCTION',25510,HOME),ev('x2','EXTINCTION',25510,B1),
      launch('L4',25600,S01,'stub:s00:b0',400),arrival('c3',26000,'stub:s00:b0','L4','rejected')]}});
  return [dead,alive];
}
const status=report=>Object.fromEntries(report.invariants.map(i=>[i.id,i.skipped?'skipped':i.pass]));

test('audit: synthetic positive passes every invariant and reports the grace window',()=>{
  const report=audit(synthetic());
  assert.deepEqual(status(report),{I1:true,I2:true,I3:true,I4:true,I5:true,I6:true,I7:true,I8:true});
  assert.equal(report.pass,true);
  const r=report.reported;
  assert.deepEqual(r.outcomeClasses,{EXTANT_MULTI_SYSTEM:1,EXTINCT_STELLAR:1});
  assert.equal(r.graceWindowLaunches.count,1);assert.equal(r.graceWindowLaunches.wasted,0);
  assert.equal(r.preDoomCompanionLaunches.count,1);assert.deepEqual(r.preDoomCompanionLaunches.fates,{'died at doom-end (STELLAR_DOOM)':1});
  assert.deepEqual(r.tier7Before25500,[{seed:'doomed-star-1',year:24990}]);assert.equal(r.survivorsOnlyViaTier7,true);
  assert.equal(r.trigger.count,0);assert.equal(r.returnsToHome.length,1);
  assert.deepEqual(r.refugeArrivals.map(x=>[x.seed,x.firstArrival,x.withinLatestPossible]),[['doomed-star-1',25410,true]]);
  const I8=report.invariants.find(i=>i.id==='I8');
  assert.deepEqual(I8.rejections.map(x=>[x.id,x.reason,x.category]),[['c3','destination-uninhabitable','s01 -> s00:b0 return']]);
  assert.match(render(report),/verdict PASS/);
});

test('audit: fabricated violations flip I1 and I4; a wrong seed-0 digest or ERROR flips I7/I6',()=>{
  const runs=synthetic();runs[1].timeline.events.push(launch('Lx',25010,HOME,'stub:s00:b1',5));
  let report=audit(runs);assert.equal(status(report).I1,false);assert.equal(status(report).I2,false);assert.equal(report.pass,false);
  assert.deepEqual(report.invariants.find(i=>i.id==='I1').violations.map(v=>[v.id,v.dateYear,v.destination]),[['Lx',25010,'stub:s00:b1']]);
  const living=synthetic();living[1].timeline.arcs.push(arcRow(arc('stub:s00:b2'),'stub:s00:b2',true));
  report=audit(living);assert.equal(status(report).I4,false);assert.equal(status(report).I1,true);assert.equal(report.pass,false);
  const stray=synthetic();stray[1].timeline.events.push(launch('Ly',25500,HOME,REFUGE,400));
  assert.equal(status(audit(stray)).I3,false);
  assert.equal(status(audit(synthetic(),{expectedSeed0Digest:'f'.repeat(64)})).I7,false);
  assert.equal(status(audit(synthetic(),{reruns:[{seed:'doomed-star-1',mode:'jobs=1',resultDigest:'2'.repeat(64)}]})).I7,false);
  const error=synthetic();error.push({scenario:'doomed-star',seed:'doomed-star-2',outcome:'ERROR',classes:['ERROR'],explanation:'ERROR: x'});
  assert.equal(status(audit(error)).I6,false);
  const noT7=synthetic();noT7[1].firstEras[6]=null;assert.equal(status(audit(noT7)).I5,false);
});

test('audit: real forced tier-7 evacuation (m5-evacuation-doom setup) passes I1-I6 and I8',()=>{
  const f=forced('STELLAR_DOOM');f.base='fixtures/domains/m4c-doomed-star.json';f.initial.atTick='2499';f.ticks=53;
  f.initial.regions=[region('r00',{pop:'100000',infra:'10000000',tiers:[5,5,4,7,4,3,4]})];
  setOverride(f,'parameters.g',Array(8).fill(0));setOverride(f,'parameters.keepPermille','1000');setOverride(f,'hazard.LAUNCH.q32','171798691840');
  const world=createDomain(f.base,f.seed,{forced:f}),run=summarizeRun({scenario:'doomed-star',seed:'forced-evac-2499-t7'},world,world.compileSummary({observe:true}));
  const report=audit([run]);
  assert.deepEqual(status(report),{I1:true,I2:true,I3:true,I4:true,I5:true,I6:true,I7:'skipped',I8:true});
  const g=report.reported.graceWindowLaunches;
  assert.ok(g.count>0);assert.equal(g.wasted,0);assert.ok(g.launches.every(l=>l.destination===REFUGE));
  assert.equal(report.reported.refugeArrivals[0].firstArrival,25410);
});
