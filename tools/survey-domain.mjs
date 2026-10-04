import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createDomain} from '../src/domain.mjs';
import {IMPLEMENTED} from '../src/catalogue.mjs';
if(process.argv[2]==='--one') {
  const seed=process.argv[3],start=process.hrtime.bigint(),world=createDomain('fixtures/domains/toy-12.json',seed),r=world.compileSummary();
  const ms=Number(process.hrtime.bigint()-start)/1000000;
  const first=kind=>r.events.find(e=>e.kind===kind&&e.resolution==='accepted')?.dateYear??null;
  const counts=Object.fromEntries(IMPLEMENTED.map(k=>[k.kind,r.events.filter(e=>e.kind===k.kind).length]));
  let maxIdentityBytes=0;const seen=new WeakSet();
  function audit(v){if(typeof v==='string'){maxIdentityBytes=Math.max(maxIdentityBytes,Buffer.byteLength(v));if(Buffer.byteLength(v)>65536)throw new Error('Identity/string bound exceeded');}else if(v&&typeof v==='object'&&!seen.has(v)){seen.add(v);for(const key of Object.keys(v).sort())audit(v[key]);}}
  audit(r.events);audit(r.archiveRecords);audit(r.state);
  const arcTicks=[...r.state.arcs,...r.archiveRecords.filter(a=>a.kind==='arc').map(a=>a.record)].reduce((n,a)=>n+Number(a.tick)-a.foundedYear/10,0);
  console.log(JSON.stringify({seed,outcome:r.outcome,maxEra:r.maxEra,sapience:first('SAPIENCE'),spaceflight:first('SPACEFLIGHT'),launch:first('LAUNCH'),colony:first('COLONY_FOUNDED'),firstInterstellar:r.events.find(e=>e.kind==='LAUNCH'&&e.data.launch&&e.data.launch.destination.split(':')[1]!==e.data.launch.sourceArc.split(':')[2])?.dateYear??null,arcs:r.state.lineages.reduce((n,l)=>n+l.foundedArcs,0),perils:r.events.filter(e=>['NUCLEAR_WAR','ENGINEERED_PANDEMIC','RUNAWAY_TECH'].includes(e.kind)).map(e=>({kind:e.kind,year:e.dateYear,outcome:e.data.outcome})),counts,ms,rssMiB:process.memoryUsage().rss/1048576,arcTicks,maxIdentityBytes,resultDigest:r.resultDigest,recipeDigest:r.recipeDigest}));
} else {
  const refresh=process.argv[2]==='--refresh'?process.argv[3].split(',').map(Number):null;
  const records=refresh?JSON.parse(readFileSync('docs/evidence/m2b-domain-survey.json','utf8')).records:[];
  for(const i of refresh??Array.from({length:16},(_,i)=>i+1)) {
    const child=spawnSync(process.execPath,['tools/survey-domain.mjs','--one','toy-'+i],{encoding:'utf8',maxBuffer:16*1024*1024});
    if(child.status!==0)throw new Error(child.stderr);
    const r=JSON.parse(child.stdout),index=records.findIndex(v=>v.seed===r.seed);if(index<0)records.push(r);else records[index]=r;records.sort((a,b)=>Number(a.seed.slice(4))-Number(b.seed.slice(4)));
    writeFileSync('docs/evidence/m2b-domain-survey.json',JSON.stringify({observed:true,records,counts: Object.fromEntries(IMPLEMENTED.map(k=>[k.kind,records.reduce((n,r)=>n+r.counts[k.kind],0)]))},null,2)+'\n');
    console.log(`${r.seed}: ${r.outcome}; E${r.maxEra}; sapience ${r.sapience}; spaceflight ${r.spaceflight}; launch ${r.launch}; colony ${r.colony}; interstellar ${r.firstInterstellar}; arcs ${r.arcs}; perils ${r.perils.length}; ${r.ms.toFixed(2)} ms; ${r.rssMiB.toFixed(2)} MiB`);
  }
  console.log('Summed kind counts: '+JSON.stringify(Object.fromEntries(IMPLEMENTED.map(k=>[k.kind,records.reduce((n,r)=>n+r.counts[k.kind],0)]))));
}
