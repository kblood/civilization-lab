import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createPlanet} from '../src/planet.mjs';
import {IMPLEMENTED} from '../src/catalogue.mjs';
if(process.argv[2]==='--one') {
  const seed=process.argv[3],start=process.hrtime.bigint(),r=createPlanet('temperate',seed,{years:400000}).compileSummary();
  console.log(JSON.stringify({seed,outcome:r.outcome,maxEra:r.maxEra,firstReachedYear:r.firstReachedYear,
    firstAgriculture:r.events.find(e=>e.kind==='AGRICULTURE'&&e.resolution==='accepted')?.dateYear??null,
    counts:Object.fromEntries(IMPLEMENTED.map(k=>[k.kind,r.events.filter(e=>e.kind===k.kind).length])),
    ms:Number(process.hrtime.bigint()-start)/1e6,rssMiB:process.memoryUsage().rss/1048576,resultDigest:r.resultDigest}));
} else {
  const rows=[];
  for(let i=1;i<=8;i++) {
    const child=spawnSync(process.execPath,['tools/survey-civ.mjs','--one',`civ-m2a-${i}`],{encoding:'utf8',timeout:180000});
    if(child.status!==0)throw new Error(child.stderr||`seed ${i}: ${child.status}`);
    const row=JSON.parse(child.stdout);rows.push(row);console.log(JSON.stringify(row));
  }
  mkdirSync('docs/evidence',{recursive:true});writeFileSync('docs/evidence/m2a-fix-survey.json',JSON.stringify(rows,null,2)+'\n');
}
