// Reproducible expansion of the authored contract; no random fixture inputs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { canonicalBytes } from '../src/canonical.mjs';
import { sha256Hex } from '../src/digest.mjs';
const path = 'docs/transition-table-v1.md';
let doc = readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const heading = doc.indexOf('## Machine-readable table');
const match = doc.slice(heading).match(/```json\r?\n([\s\S]*?)\n```/);
const table = JSON.parse(match[1]);
const dependencies = {
  'region.Kbase': ['region.tiers'],
  'region.K': ['region.Kbase', 'region.tiers', 'region.damage'],
  'region.era': ['region.tiers'],
  'region.energy': ['region.pop', 'region.tiers'],
  'region.ceilings': ['region.tiers', 'region.caps', 'region.resources'],
  'arc.outcome': ['region.pop', 'region.tiers', 'region.polityId', 'polity.endedYear'],
};
for (const [field, deps] of Object.entries(dependencies).sort()) {
  const re = new RegExp('^\\| ' + field.replace('.', '\\.') + ' \\| (?:BigInt|Number|Array|Outcome) \\|[^\\n]*$', 'm');
  const start = doc.indexOf('The dependency map is **exhaustive**:');
  doc = doc.slice(0, start) + doc.slice(start).replace(re, `| ${field} | ${deps.join(', ')}${field === 'arc.outcome' ? '; split occurrence this tick' : ''} |`);
}
table.rules.provenanceDependencies = dependencies;
table.rules.forcedTickMaximum = 40000;
doc = doc.replace('ticks:Int 1..640','ticks:Int 1..40000');
doc = doc.replace(match[0], '```json\n' + JSON.stringify(table, null, 2) + '\n```');
writeFileSync(path, doc);
const salience = [1000,200,700,500,600,400,850,650,450,500,750,650,700,800,750,700,650,600,900,700,1000,1000,1000,850,850,900,900,1000,850,1000,1000];
writeFileSync('src/catalogue-data.json', JSON.stringify(table.kinds.map((k,i) => ({...k, salience:salience[i]})), null, 2)+'\n');
mkdirSync('fixtures/planets', {recursive:true});
const known = value => ({status:'known', value, digest:sha256Hex(canonicalBytes(value))});
for (const [name, system, count, contact, barrier, Kbase, landPpm, tempClass, aridityClass, resources] of [
  ['temperate','s00',12,500,false,'5000',700000,2,1,[800,800,500,800]],
  ['arid','arid',8,300,false,'1500',900000,3,4,[800,600,300,200]],
  ['cold-archipelago','cold',10,100,true,'1000',200000,0,2,[500,300,100,300]],
]) {
  const id = i => 'r'+String(i).padStart(2,'0');
  const regions = Array.from({length:count}, (_,i) => ({id:id(i),weight:'1',
    adjacency:[(i+count-1)%count,(i+1)%count].sort((a,b)=>a-b).map(j=>({to:id(j),contactPermille:contact,barrier})),
    cells:Array.from({length:16},(_,j)=>({id:'c'+String(j).padStart(2,'0'),weight:'1'}))}));
  const rows = regions.map(r=>({fromEpoch:'0',untilEpoch:'2000',regionId:r.id,Kbase,landPpm,tempClass,aridityClass,airClass:'oxic',gravityMicroMS2:9810000,resources,domesticablesPpm:resources[3]*1000}));
  const planet = {schemaVersion:'civ-planet-stub-1',body:`stub:${system}:b0`,system,profile:system==='cold'?'cold':name,hosting:'habitable',
    lifecycle:known({habitableFromYear:0,habitableUntilYear:2000000,complexLifeFromYear:0,stellarDoomYear:null}),
    partition:known({partitionVersion:'civ-stub-regions-1',regions}),epochs:known({rows})};
  writeFileSync(`fixtures/planets/${name}.json`,JSON.stringify(planet,null,2)+'\n');
}
