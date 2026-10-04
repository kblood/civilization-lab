// Read the fixed panel evidence and generated report; no simulations or tuning.
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {textBox} from '../src/report.mjs';
import {checkXML} from '../tests/xml-helpers.mjs';
const k=JSON.parse(readFileSync('docs/evidence/m3fix-kremer.json','utf8'));
const summary={};
for(const planet of k.planets){
  const runs=k.runs.filter(r=>r.planet===planet),steps={},kinds={};
  for(const r of runs){
    for(const s of r.acceptedTierSteps){const [kind,,domain,tier]=s.key.split('|'),key=`${kind}|${domain}|${tier}`;steps[key]=(steps[key]??0)+s.count;}
    for(const s of r.acceptedKindCounts)kinds[s.kind]=(kinds[s.kind]??0)+s.count;
  }
  const sum=key=>runs.reduce((n,r)=>n+BigInt(r.neff[key]),0n);
  summary[planet]={...k.summary[planet],neffSum:String(sum('sum')),populationSum:String(sum('populationSum')),
    neighbourContribution:String(sum('sum')-sum('populationSum')),liveRegionTicks:runs.reduce((n,r)=>n+r.neff.liveRegionTicks,0),
    acceptedKinds:Object.fromEntries(Object.entries(kinds).sort()),acceptedTierSteps:Object.fromEntries(Object.entries(steps).sort())};
}
const report=readFileSync('out/report.md','utf8');
const files=[...new Set([...report.matchAll(/\]\((timeline-[^)]+\.svg)\)/g)].map(m=>m[1]))].sort();
assert.ok(files.length>=5);
const unxml=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&amp;','&');
for(const file of files){
  const svg=readFileSync('out/'+file,'utf8');checkXML(svg);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
  const boxes=[...svg.matchAll(/<text ([^>]+)>([^<]*)<\/text>/g)].map(([,attrs,value])=>{
    const attr=key=>attrs.match(new RegExp(`(?:^| )${key}="([^" ]+)"`))?.[1];
    return {...textBox(Number(attr('x')),Number(attr('y')),unxml(value),Number(attr('font-size')??14),attr('text-anchor')??'start'),value};
  });
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`${file}: ${a.value} / ${b.value}`);
  }
  const numbers=key=>[...svg.matchAll(new RegExp(`data-${key}-number="(\\d+)"`,'g'))].map(m=>m[1]);
  assert.deepEqual(numbers('marker'),numbers('list'));
  copyFileSync('out/'+file,'docs/evidence/'+file);
  console.log(`${file}: XML, text boxes and marker/list correspondence PASS`);
}
writeFileSync('docs/evidence/m3fix-audit.json',JSON.stringify({summary,files,svgChecks:'PASS; structural checks only, not visual review'},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
