import { createPlanet } from '../src/planet.mjs';
const years=Number(process.argv[2]??400000);
const start=process.hrtime.bigint();
const result=createPlanet('temperate','civ-m2a-1',{years}).compileSummary();
const ms=Number(process.hrtime.bigint()-start)/1000000;
console.log(`${years} years: ${ms.toFixed(2)} ms; target ${years===400000?10000:700} ms; ${result.events.length} events; ${result.resultDigest}`);
console.log(`RSS: ${(process.memoryUsage().rss/1048576).toFixed(2)} MiB; largest P+D chapter: ${(result.maxChapterBytes/1048576).toFixed(2)} MiB`);
