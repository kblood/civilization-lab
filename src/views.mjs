import {floorDiv} from './time.mjs';
import {compare} from './canonical.mjs';
import {logPos} from './fixed.mjs';
export const ERA_NAMES=['Forager','Sedentary','Agrarian state','Industrial','Atomic and information','Interplanetary','Interstellar','Stellar engineering'];
const pop=a=>a.regions.reduce((n,r)=>n+r.pop,0n);
const power=a=>a.regions.reduce((n,r)=>n+r.energy,0n);
export function summaries(ticks,events,width=100) {
  const groups=new Map();
  for(const t of [...ticks].sort((a,b)=>compare(BigInt(a.tick),BigInt(b.tick)))){const key=String(floorDiv(BigInt(t.tick)*10n,BigInt(width)));const rows=groups.get(key)??[];rows.push(t);groups.set(key,rows);}
  return [...groups].sort((a,b)=>compare(BigInt(a[0]),BigInt(b[0]))).map(([bucket,rows])=>{
    const states=[rows[0].start,...rows.map(t=>t.end)],values=states.map(pop),fromYear=Number(BigInt(bucket)*BigInt(width)),untilYear=fromYear+width;
    const own=events.filter(e=>e.dateYear>=fromYear&&e.dateYear<untilYear),kinds=[...new Set(own.map(e=>e.kind))].sort(compare);
    return {fromYear,untilYear,start:values[0],end:values.at(-1),min:values.reduce((a,b)=>a<b?a:b),max:values.reduce((a,b)=>a>b?a:b),stageMask:states.reduce((mask,a)=>mask|(1<<a.outcome.industrialEra),0),eventCounts:kinds.map(kind=>({kind,count:own.filter(e=>e.kind===kind).length})),powerStart:power(states[0]),powerEnd:power(states.at(-1))};
  });
}
export const centurySummaries=(ticks,events)=>summaries(ticks,events,100);
export const chapterSummaries=(ticks,events)=>summaries(ticks,events,6400);
export function eras(ticks) {
  const out=[];
  for(const t of [...ticks].sort((a,b)=>compare(BigInt(a.tick),BigInt(b.tick)))){const fromYear=Number(BigInt(t.tick)*10n),era=t.start.outcome.industrialEra,last=out.at(-1);if(last&&last.era===era&&last.untilYear===fromYear)last.untilYear+=10;else out.push({era,name:ERA_NAMES[era],fromYear,untilYear:fromYear+10});}
  return out;
}
// Display only; these floating values must never be included in digests.
// energy is kcal/day; one kcal = 4184 joules. Aggregate before conversion.
export function displayEnergyIndices(energyKcalPerDay,population) {
  const watts=Number(energyKcalPerDay)*4184/86400;
  return {morris:population>0n?Number(energyKcalPerDay)/Number(population):null,kardashev:watts>0?(logPos(watts)/logPos(10)-6)/10:null,watts};
}
