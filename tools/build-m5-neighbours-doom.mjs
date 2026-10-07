// Reproducible authored scenario construction; no runtime fixture mutation.
import {readFileSync,writeFileSync} from 'node:fs';
import {Availability} from '../src/environment.mjs';
// Usage: node tools/build-m5-neighbours-doom.mjs [system-fixture]
// (default fixtures/planets/m4c-doomed-star-system.json). The m3b control is built
// in two steps: tools/build-m3b-fixtures.mjs, then this tool on
// fixtures/planets/m3b-doomed-star-system.json.
const path=process.argv[2]??'fixtures/planets/m4c-doomed-star-system.json';
const system=JSON.parse(readFileSync(path,'utf8'));
const years=[...new Set(system.bodies.map(p=>p.lifecycle.value.stellarDoomYear).filter(y=>y!==null))];
if(years.length!==1)throw new Error('Expected one distinct non-null stellarDoomYear');
for(const p of system.bodies)p.lifecycle=Availability.known({...p.lifecycle.value,stellarDoomYear:years[0]});
writeFileSync(path,JSON.stringify(system,null,2)+'\n');
