// Reproducible authored scenario construction; no runtime fixture mutation.
import {readFileSync,writeFileSync} from 'node:fs';
import {Availability} from '../src/environment.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const old=read('fixtures/scenarios/lonely-earthlike.json');
if(old.description==='fixtures/planets/temperate.json')write('fixtures/scenarios/lonely-bounded.json',{...old,id:'lonely-bounded'});
for(const name of ['lonely-earthlike','harsh-anoxic','high-perils','doomed-star']){
  const home=read('fixtures/planets/home-system.json');
  home.id='m3b-'+name;
  home.bodies[0]=read('fixtures/planets/'+(name==='harsh-anoxic'?'anoxic':'temperate')+'.json');
  if(name==='lonely-earthlike')home.bodies[0].lifecycle=Availability.known({...home.bodies[0].lifecycle.value,habitableUntilYear:100000});
  if(name==='doomed-star')home.bodies[0].lifecycle=Availability.known({...home.bodies[0].lifecycle.value,stellarDoomYear:3000});
  write('fixtures/planets/m3b-'+name+'-system.json',home);
  const domain=read('fixtures/domains/toy-12.json');domain.id='m3b-'+name;domain.systems=domain.systems.slice(0,3);domain.systems[0].fixture='fixtures/planets/m3b-'+name+'-system.json';
  domain.routes=domain.routes.filter(r=>[r.from,r.to].every(b=>['stub:s00:b0','stub:s01:b0','stub:s02:b0'].includes(b)));
  write('fixtures/domains/m3b-'+name+'.json',domain);
  const s=read('fixtures/scenarios/'+name+'.json');s.description='fixtures/domains/m3b-'+name+'.json';s.untilYear=name==='lonely-earthlike'?120000:30000;
  if(name==='lonely-earthlike'){s.startingFixture=null;s.overrides=[];}
  if(name==='doomed-star'){s.startingFixture='fixtures/regimes/industrial.json';s.overrides=[{key:'parameters.stellarGraceYears',value:'500'}];}
  write('fixtures/scenarios/'+name+'.json',s);
}
const crowded=read('fixtures/scenarios/crowded-domain.json');crowded.untilYear=30000;write('fixtures/scenarios/crowded-domain.json',crowded);
