// Exact authored fixture recipes in transition-table-v1.md; no random inputs.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Availability} from '../src/environment.mjs';
const base=JSON.parse(readFileSync('fixtures/planets/temperate.json','utf8'));
const save=(path,v)=>writeFileSync(path,JSON.stringify(v,null,2)+'\n');
function planet(body,system,profile,hosting,count,patch,contact=500) {
  const p=structuredClone(base);Object.assign(p,{body,system,profile,hosting});
  const id=i=>'r'+String(i).padStart(2,'0');
  p.partition=Availability.known({partitionVersion:'civ-stub-regions-1',regions:Array.from({length:count},(_,i)=>({id:id(i),weight:'1',cells:structuredClone(base.partition.value.regions[0].cells),adjacency:[(i+count-1)%count,(i+1)%count].sort((a,b)=>a-b).map(j=>({to:id(j),contactPermille:contact,barrier:false}))}))});
  p.epochs=Availability.known({rows:p.partition.value.regions.map(r=>({...base.epochs.value.rows[0],regionId:r.id,...patch}))});
  if(hosting!=='habitable')p.lifecycle=Availability.known({...p.lifecycle.value,complexLifeFromYear:null});return p;
}
save('fixtures/planets/anoxic.json',planet('stub:anoxic:b0','anoxic','anoxic','habitable',12,{Kbase:'4000',airClass:'anoxic',resources:[800,0,500,800]},400));
const bodies=[base,...[1,2,3].map(i=>planet('stub:s00:b'+i,'s00',i===3?'barren':'habitat',i===3?'barren':'habitat-buildable',8,{Kbase:i===3?'0':'1000',landPpm:1000000,tempClass:0,aridityClass:4,airClass:'none',gravityMicroMS2:1600000,resources:i===3?[0,0,0,0]:[800,0,300,800],domesticablesPpm:i===3?0:800000}))];
const routes=bodies.flatMap(a=>bodies.filter(b=>b!==a).map(b=>({from:a.body,to:b.body,kind:'in-system',distanceMicroLy:'0',travelYearsByTransportTier:[null,null,null,null,null,20,5,1],destinationHosting:b.hosting})));
save('fixtures/planets/home-system.json',{schemaVersion:'civ-system-stub-1',id:'s00',bodies,routes});
const id=i=>'s'+String(i).padStart(2,'0'),body=i=>'stub:'+id(i)+':b0';
const interstellar=[];for(let i=0;i<10;i++)for(const [a,b] of [[i,i+1],[i+1,i]])interstellar.push({from:body(a),to:body(b),kind:'interstellar',distanceMicroLy:'4000000',travelYearsByTransportTier:[null,null,null,null,null,null,null,400],destinationHosting:'habitable'});
interstellar.sort((a,b)=>a.from<b.from?-1:a.from>b.from?1:a.to<b.to?-1:1);
mkdirSync('fixtures/domains',{recursive:true});
save('fixtures/domains/toy-12.json',{schemaVersion:'civ-domain-stub-1',id:'toy-12',systems:Array.from({length:12},(_,i)=>({id:id(i),fixture:i?'fixtures/planets/temperate.json':'fixtures/planets/home-system.json',bodyPrefix:'stub:'+id(i)})),routes:interstellar,origins:[body(0)],fromYear:0,untilYear:2000000});
