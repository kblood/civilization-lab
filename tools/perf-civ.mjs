import { createPlanet } from '../src/planet.mjs';
import { sha256Hex } from '../src/digest.mjs';
import { canonicalBytes } from '../src/canonical.mjs';
import { IMPLEMENTED } from '../src/catalogue.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const years=Number(process.argv[2]??400000);
if(!Number.isSafeInteger(years)||years<=0)throw new Error('years must be a positive safe integer');
const targetMs=years===400000?10000:years===20000?700:null;
if(process.argv[3]==='--panel') {
  const seeds=(process.argv[4]??'').split(',').map(seed=>seed.trim());
  if(seeds.some(seed=>!seed)||process.argv.length!==5)throw new Error('Usage: node tools/perf-civ.mjs years --panel seed,seed,...');
  let worst=null;
  // Sequential fresh processes isolate each seed's caches and garbage collector.
  // The child times compilation only, just like the positional single-seed run.
  for(const seed of seeds) {
    const row=JSON.parse(execFileSync(process.execPath,[fileURLToPath(import.meta.url),String(years),seed,'--measurement-json'],{encoding:'utf8'}));
    console.log(`${seed}: ${row.ms.toFixed(2)} ms; ${row.events} events; ${row.resultDigest}`);
    if(worst===null||row.ms>worst.ms)worst={seed,...row};
  }
  const verdict=targetMs===null?'NOT EVALUATED':worst.ms<targetMs?'PASS':'FAIL';
  console.log(`Panel ${years} years: worst ${worst.ms.toFixed(2)} ms (${worst.seed}); target ${targetMs===null?'not specified':`${targetMs} ms`}; ${verdict}`);
  process.exitCode=verdict==='FAIL'?1:0;
} else {
  const seed=process.argv[3]??'civ-m2a-1';
  const start=process.hrtime.bigint();
  const cpuStart=process.cpuUsage();
  const result=createPlanet('temperate',seed,{years}).compileSummary();
  const ms=Number(process.hrtime.bigint()-start)/1000000;
  const cpu=process.cpuUsage(cpuStart);
  if(process.argv.includes('--measurement-json')) {
    console.log(JSON.stringify({ms,events:result.events.length,resultDigest:result.resultDigest}));
  } else {
    const target=years===400000?'10000 ms':years===20000?'700 ms':'not specified';
    console.log(`${years} years: ${ms.toFixed(2)} ms; target ${target}; ${result.events.length} events; ${result.resultDigest}`);
    console.log(`RSS: ${(process.memoryUsage().rss/1048576).toFixed(2)} MiB; largest P+D chapter: ${(result.maxChapterBytes/1048576).toFixed(2)} MiB`);
    console.log(`Events digest (sorted IDs, JSON): ${sha256Hex(JSON.stringify(result.events.map(e=>e.id).sort()))}`);
    console.log(`Heap: ${(process.memoryUsage().heapUsed/1048576).toFixed(2)} MiB used; ${(process.memoryUsage().heapTotal/1048576).toFixed(2)} MiB reserved`);
    console.log(`CPU: ${((cpu.user+cpu.system)/1000).toFixed(2)} ms`);
    // Optional, outside the timed compilation and RSS sample: also commit complete
    // event records, so equal IDs alone cannot hide a changed date/owner/effect.
    if(process.argv.includes('--identity')) {
      const counts=Object.fromEntries(IMPLEMENTED.map(k=>[k.kind,result.events.filter(e=>e.kind===k.kind).length]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0));
      console.log(JSON.stringify({seed,years,counts,idsHash:sha256Hex(JSON.stringify(result.events.map(e=>e.id).sort())),fullEventsHash:sha256Hex(canonicalBytes(result.events)),resultDigest:result.resultDigest}));
    }
  }
}
