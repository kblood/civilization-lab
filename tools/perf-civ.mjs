import { createPlanet } from '../src/planet.mjs';
import { sha256Hex } from '../src/digest.mjs';
import { canonicalBytes } from '../src/canonical.mjs';
import { IMPLEMENTED } from '../src/catalogue.mjs';
const years=Number(process.argv[2]??400000);
const seed=process.argv[3]??'civ-m2a-1';
const start=process.hrtime.bigint();
const cpuStart=process.cpuUsage();
const result=createPlanet('temperate',seed,{years}).compileSummary();
const ms=Number(process.hrtime.bigint()-start)/1000000;
const cpu=process.cpuUsage(cpuStart);
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
