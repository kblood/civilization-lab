import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createScenario} from '../src/scenario.mjs';
import {scenarioCLI} from '../src/scenario-cli.mjs';
import {createDomain} from '../src/domain.mjs';
import {ensemblePlan,runSeed,runEnsemble} from '../src/ensemble.mjs';
import {reportMarkdown} from '../src/report.mjs';
import {aggregate,measure,render} from '../tools/m4-plausibility.mjs';
const cwd=fileURLToPath(new URL('../',import.meta.url)),targetingPolicy='m5-targeting-1',untilYear=200;
const cli=args=>spawnSync(process.execPath,['src/cli.mjs',...args],{cwd,encoding:'utf8'});
const hash=s=>createHash('sha256').update(s).digest('hex');
test('scenario CLI preserves default bytes and opts into the policy manifest',()=>{
  const args=['--scenario','crowded-domain','--seed','crowded-domain-0','--until-year',String(untilYear)],plain=cli(args),opt=cli([...args,'--targeting-policy',targetingPolicy]);
  assert.equal(plain.status,0,plain.stderr);assert.equal(opt.status,0,opt.stderr);
  assert.equal(hash(plain.stdout),'4844f6e1a3a43f93e56386ba5560ecd5a7faa5346de1573146675d64c20fc4c5');
  const lines=[],log=console.log;try{console.log=s=>lines.push(s);scenarioCLI('crowded-domain','crowded-domain-0',untilYear);}finally{console.log=log;}
  assert.equal(plain.stdout,lines.join('\n')+'\n');
  const {world}=createScenario('crowded-domain','crowded-domain-0',{untilYear,targetingPolicy});
  assert.ok(opt.stdout.includes('Manifest digest: '+world.compileSummary().manifestDigest));
  assert.notEqual(opt.stdout.match(/Manifest digest: (\w+)/)[1],plain.stdout.match(/Manifest digest: (\w+)/)[1]);
});
test('domain CLI preserves default digest and forwards targeting policy',()=>{
  const args=['--domain','fixtures/domains/toy-12.json','--seed','toy-1','--years','200','--digest'],plain=cli(args),opt=cli([...args,'--targeting-policy',targetingPolicy]);
  assert.equal(plain.status,0,plain.stderr);assert.equal(opt.status,0,opt.stderr);
  assert.equal(plain.stdout,'0c6ba1c14fcff3a4e20dba0b63e49768df7ca754ca4167ac434bd5936a83f531\n');
  assert.equal(opt.stdout,createDomain('fixtures/domains/toy-12.json','toy-1',{years:200,targetingPolicy}).compileSummary().resultDigest+'\n');
  assert.equal(plain.stdout,createDomain('fixtures/domains/toy-12.json','toy-1',{years:200}).compileSummary().resultDigest+'\n');
  // This short toy-1 history has no targeting decisions: result digests coincide.
  // The CLI's manifest still proves that the policy reached the domain.
  const full=cli([...args.slice(0,-1),'--targeting-policy',targetingPolicy]);assert.equal(full.status,0,full.stderr);
  const def=createDomain('fixtures/domains/toy-12.json','toy-1',{years:200,targetingPolicy}).def;
  assert.ok(full.stdout.includes('Manifest digest: '+def.manifestDigest));
  assert.notEqual(def.manifestDigest,createDomain('fixtures/domains/toy-12.json','toy-1',{years:200}).def.manifestDigest);
});
test('CLI rejects unknown targeting policies and planet-only targeting',()=>{
  for(const args of [['--scenario','crowded-domain'],['--domain','fixtures/domains/toy-12.json'],['--civ','temperate']]){
    const r=cli([...args,'--until-year','200','--years','200','--targeting-policy','bogus']);assert.notEqual(r.status,0);assert.match(r.stderr,/targeting policy/i);
  }
  assert.notEqual(cli(['--civ','temperate','--targeting-policy',targetingPolicy]).status,0);
});
test('ensemble tasks, summaries and forked workers carry only opt-in policy',async()=>{
  assert.deepEqual(ensemblePlan(2),[{scenario:'lonely-earthlike',seed:'lonely-earthlike-0',untilYear:undefined},{scenario:'crowded-domain',seed:'crowded-domain-1',untilYear:undefined}]);
  const tasks=ensemblePlan(2,{scenario:'crowded-domain',untilYear,targetingPolicy});assert.ok(tasks.every(t=>t.targetingPolicy===targetingPolicy));
  const plain=runSeed({scenario:'crowded-domain',seed:'crowded-domain-0',untilYear});assert.equal('targetingPolicy' in plain,false);
  const own=runSeed(tasks[0]),{world}=createScenario(tasks[0].scenario,tasks[0].seed,{untilYear,targetingPolicy});
  assert.equal(own.targetingPolicy,targetingPolicy);assert.equal(own.manifestDigest,world.compileSummary().manifestDigest);
  assert.notEqual(own.manifestDigest,plain.manifestDigest);
  assert.deepEqual(await runEnsemble(tasks,{jobs:2}),tasks.map(runSeed));
  assert.equal(runSeed({...tasks[0],targetingPolicy:'bogus'}).flags.error,true);
  assert.equal(reportMarkdown([plain]).includes('Targeting policy:'),false);
  assert.equal(reportMarkdown([own]).split('Targeting policy: '+targetingPolicy+' (opt-in)').length,2);
});
const row=()=>({seed:'synthetic',classes:[],lineageClasses:[],startedEra:null,firstEras:Array(8).fill(null),multiBody:false,extinctionEvents:{},
  colonisation:{LAUNCH:0,COLONY_FOUNDED:0,newColonies:0,reinforcements:0,COLONY_LOST:0,VOYAGE_LOST:0,repeatLaunchesToFailedTarget:0,rejected:{}},
  collapses:0,perilsCollapses:0,latePostExitEvents:0,latePostExitKinds:{}});
test('plausibility aggregation and rendering add delivered-knowledge counts only when present',()=>{
  const plain=aggregate('fixture',[row()]);assert.equal('launchPriorFailure' in plain,false);
  const counts={none:2,'transit-loss':3,occupied:4,uninhabitable:5,'colony-died':6,active:7};
  const opt=aggregate('fixture',[row(),{...row(),launchPriorFailure:counts},{...row(),launchPriorFailure:counts}]);
  assert.deepEqual(opt.launchPriorFailure,Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v*2])));
  assert.equal(render({scenarios:[plain]}).includes('Launch prior failure'),false);
  assert.equal(render({scenarios:[opt]}).split('Launch prior failure').length,2);
});
test('short plausibility measurement exposes policy launch counts only on request',async()=>{
  const plain=await measure('crowded-domain','crowded-domain-0',{untilYear}),opt=await measure('crowded-domain','crowded-domain-0',{untilYear,targetingPolicy});
  assert.equal('launchPriorFailure' in plain,false);
  assert.deepEqual(Object.keys(opt.launchPriorFailure).sort(),['none','transit-loss','occupied','uninhabitable','colony-died','active'].sort());
  assert.equal(Object.entries(opt.launchPriorFailure).filter(([k])=>k!=='active').reduce((n,[,v])=>n+v,0),opt.colonisation.LAUNCH);
});

test('ensemble CLI forwards policy to additional timelines and rejects unknown values',()=>{
  const out=mkdtempSync(join(cwd,'.m5-tooling-'));
  try{
    const args=['--ensemble','1','--scenario','crowded-domain','--until-year','200','--jobs','1','--out',out];
    const r=cli([...args,'--targeting-policy',targetingPolicy,'--timeline','extra']);assert.equal(r.status,0,r.stderr);
    const md=readFileSync(join(out,'report.md'),'utf8'),{world}=createScenario('crowded-domain','extra',{untilYear,targetingPolicy});
    assert.ok(md.includes('manifest '+world.def.manifestDigest));assert.equal(md.split('Targeting policy:').length,2);
    assert.notEqual(cli([...args,'--targeting-policy','bogus']).status,0);
  }finally{rmSync(out,{recursive:true,force:true});}
});
