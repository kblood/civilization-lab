// Supplemental public-wrapper probe; accepts a read-only exported source root.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]??'.');
const {ensemblePlan,runSeed,runEnsemble}=await import(pathToFileURL(join(root,'src/ensemble.mjs')));
const rows=[];
for(const [name,run] of [['runSeed',tasks=>tasks.map(runSeed)],['runEnsemble jobs=2',tasks=>runEnsemble(tasks,{jobs:2})]]){
  const [a]=await run(ensemblePlan(1,{scenario:'crowded-domain',untilYear:110}));
  const [b]=await run(ensemblePlan(1,{scenario:'crowded-domain',untilYear:230}));
  assert.equal(a.flags.error,false);assert.equal(b.flags.error,false);
  const eventsEqual=JSON.stringify(a.timeline.events)===JSON.stringify(b.timeline.events.filter(e=>e.dateYear<110));
  rows.push({name,manifest:[a.manifestDigest,b.manifestDigest],recipe:[a.recipeDigest,b.recipeDigest],eventsEqual});
}
const reports=[110,230].map(until=>{
  const out=resolve('out/m4b-wrapper-'+(root===resolve('.')?'after':'before')+'-'+until);
  const child=spawnSync(process.execPath,['src/cli.mjs','--ensemble','1','--scenario','crowded-domain','--until-year',String(until),'--jobs','1','--out',out],{cwd:root,encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);
  const report=readFileSync(join(out,'report.md'),'utf8');
  return {manifest:report.match(/Manifest: (\w+)/)[1],recipe:report.match(/recipe: (\w+)/)[1]};
});
rows.push({name:'--ensemble --until-year',reports,manifestAndRecipeEqual:JSON.stringify(reports[0])===JSON.stringify(reports[1])});
const output=JSON.stringify(rows,null,2)+'\n';
if(process.argv[3])writeFileSync(process.argv[3],output);
console.log(output);
