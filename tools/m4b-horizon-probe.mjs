// Run before and after M4b; observations, never an assumed defect.
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createPlanet} from '../src/planet.mjs';
import {createDomain} from '../src/domain.mjs';
import {createScenario} from '../src/scenario.mjs';
import {postSapience} from '../src/civ-input.mjs';
import {digest} from '../src/environment.mjs';
import {forced} from '../tests/civ-helpers.mjs';
const rows=[];
function pair(label,a,b,domain=false){
  const end=a.def.untilTick,x=a.run({prefixUntil:end}),y=b.run({prefixUntil:end});
  const prefix=r=>({events:r.events.filter(e=>BigInt(e.tick)<end),ledgers:r.ledgers.filter(l=>BigInt(domain?l.ledger.tick:l.tick)<end)});
  const p=prefix(x),q=prefix(y),ids=r=>r.events.map(e=>e.id);
  rows.push({label,fromTick:String(a.def.fromTick),endpoints:[String(end),String(b.def.untilTick)],
    manifest:[a.def.manifestDigest,b.def.manifestDigest],recipe:[a.def.recipeDigest,b.def.recipeDigest],
    eventIdsEqual:digest(ids(p))===digest(ids(q)),eventsEqual:digest(p.events)===digest(q.events),
    ledgersAndWitnessesEqual:digest(p.ledgers)===digest(q.ledgers),prefix:[digest(p),digest(q)]});
}
for(const domain of [false,true]){
  const path=domain?'fixtures/domains/toy-12.json':'fixtures/planets/temperate.json',make=domain?createDomain:createPlanet;
  const f=postSapience(path,'m4b-probe',11);
  pair(`${domain?'D':'P'} forced.ticks`,make(path,f.seed,{forced:f}),make(path,f.seed,{forced:{...f,ticks:23}}),domain);
  pair(`${domain?'D':'P'} untilYear`,make(path,f.seed,{forced:f,untilYear:110}),make(path,f.seed,{forced:f,untilYear:230}),domain);
  const initial=forced('PLAGUE');initial.base=path;initial.initial.atTick='638';initial.ticks=3;
  pair(`${domain?'D':'P'} forced.ticks with initial.atTick=638`,make(path,initial.seed,{forced:initial}),make(path,initial.seed,{forced:{...initial,ticks:7}}),domain);
  pair(`${domain?'D':'P'} untilYear with initial.atTick=638`,make(path,initial.seed,{forced:initial,untilYear:6410}),make(path,initial.seed,{forced:initial,untilYear:6450}),domain);
  pair(`${domain?'D':'P'} years (CLI backing API)`,make(path,'m4b-probe',{years:110}),make(path,'m4b-probe',{years:230}),domain);
}
for(const scenario of ['fixtures/scenarios/lonely-bounded.json','crowded-domain']){
  const a=createScenario(scenario,'m4b-probe',{untilYear:110}),b=createScenario(scenario,'m4b-probe',{untilYear:230});
  pair(`scenario ${scenario} untilYear`,a.world,b.world,a.domain);
}
for(const args of [['--civ','temperate','--years'],['--domain','fixtures/domains/toy-12.json','--years'],['--scenario','fixtures/scenarios/lonely-bounded.json','--until-year'],['--scenario','crowded-domain','--until-year']]){
  const outputs=[110,230].map(n=>{
    const r=spawnSync(process.execPath,['src/cli.mjs',...args,String(n),'--seed','m4b-probe'],{encoding:'utf8'});
    if(r.status!==0)throw new Error(r.stderr);
    return {manifest:r.stdout.match(/Manifest digest: (\w+)/)[1],recipe:r.stdout.match(/Recipe digest: (\w+)/)[1]};
  });
  rows.push({label:args.join(' '),outputs,manifestAndRecipeEqual:digest(outputs[0])===digest(outputs[1])});
}
const output=JSON.stringify(rows,null,2)+'\n';
if(process.argv[2])writeFileSync(process.argv[2],output);
console.log(output);
