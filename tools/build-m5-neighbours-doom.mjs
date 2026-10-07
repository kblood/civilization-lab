// Reproducible authored scenario construction; no runtime fixture mutation.
import {readFileSync,writeFileSync} from 'node:fs';
import {Availability} from '../src/environment.mjs';
const path='fixtures/planets/m4c-doomed-star-system.json';
const system=JSON.parse(readFileSync(path,'utf8'));
const years=[...new Set(system.bodies.map(p=>p.lifecycle.value.stellarDoomYear).filter(y=>y!==null))];
if(years.length!==1)throw new Error('Expected one distinct non-null stellarDoomYear');
for(const p of system.bodies)p.lifecycle=Availability.known({...p.lifecycle.value,stellarDoomYear:years[0]});
writeFileSync(path,JSON.stringify(system,null,2)+'\n');
