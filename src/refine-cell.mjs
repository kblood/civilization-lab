// A spatial allocation view: only an explicit contract and static region data.
import {compare,canonicalBytes} from './canonical.mjs';
import {sha256Hex} from './digest.mjs';
import {floorDiv} from './time.mjs';
import {below} from './rng.mjs';
const hash=x=>sha256Hex(canonicalBytes(x));
export const PARTITION_VERSION='civ-cell-binary-1';
export function contractError(reason){throw Object.assign(new Error('REFINEMENT_CONTRACT_ERROR: '+reason),{code:'REFINEMENT_CONTRACT_ERROR'});}
const sum=xs=>xs.reduce((a,b)=>a+b,0n);
export function splitPopulation(total,weights) {
  if(typeof total!=='bigint'||total<0n||!weights.length||weights.some(w=>typeof w!=='bigint'||w<0n))contractError('invalid split');
  function split(n,ws){if(ws.length===1)return [n];const mid=floorDiv(ws.length,2),left=ws.slice(0,mid),right=ws.slice(mid),wl=sum(left),wr=sum(right);
    const l=wl+wr===0n?floorDiv(n*BigInt(mid),BigInt(ws.length)):floorDiv(n*wl,wl+wr);
    return [...split(l,left),...split(n-l,right)];}
  return split(total,weights);
}
export function cellWeights(def,year) {
  const epoch=floorDiv(BigInt(year),1000n),row=def.epochs?.find(r=>BigInt(r.fromEpoch)<=epoch&&epoch<BigInt(r.untilEpoch));
  const cells=def.cells??Array.from({length:16},(_,i)=>({id:'c'+String(i).padStart(2,'0'),weight:String(BigInt(def.weight??16)/16n+(BigInt(i)<BigInt(def.weight??16)%16n?1n:0n))}));
  const sorted=[...cells].sort((a,b)=>compare(a.id,b.id));
  if(sorted.length!==16||new Set(sorted.map(c=>c.id)).size!==16)contractError('partition');
  return sorted.map((c,i)=>({id:c.id,weight:BigInt(row?.cellWeights?.[i]??c.weight)}));
}
const allocationCache=new Map();
export function allocate(def,pop,year){
  const weights=cellWeights(def,year).map(c=>c.weight),key=String(pop)+':'+weights.join(',');let value=allocationCache.get(key);
  if(value===undefined){value=Object.freeze(splitPopulation(pop,weights));if(allocationCache.size>=4096)allocationCache.clear();allocationCache.set(key,value);}return value;
}
const rng=(def,id,purpose,tick,ordinal=0)=>({worldSeed:def.seed,manifestDigest:def.manifestDigest,level:'C',entityId:id,purpose,episodeOrBucket:BigInt(tick),ordinal});
// Bounded, lookup-only caches of addressed placement draws, never RNG cursors.
const placementCache=new Map();
function placement(def,id,purpose,bound){const key=hash([def.seed,def.manifestDigest,id,purpose]);let n=placementCache.get(key);if(n===undefined){n=Number(below(rng(def,id,purpose,0n),bound));if(placementCache.size>=4096)placementCache.clear();placementCache.set(key,n);}return n;}
const townStateCache=new Map();let townCacheNodes=0;
function townEpisodes(def,p,threshold){
  const history=p.boundaryHistory??[{tick:p.tick,pop:p.start.pop},{tick:String(BigInt(p.tick)+1n),pop:p.end.pop}];
  const key=hash([def.cells??null,def.weight??null,def.epochs??null,threshold]);
  if(townCacheNodes>=4096){townStateCache.clear();townCacheNodes=0;}
  let node=townStateCache.get(key);if(!node){node={active:Object.freeze(Array(16).fill(null)),children:new Map()};townStateCache.set(key,node);}
  let active=node.active,before=active;
  for(let j=0;j<history.length;j++){const row=history[j];if(j&&BigInt(row.tick)!==BigInt(history[j-1].tick)+1n)contractError('boundary history gap');
    before=active;const rowKey=row.tick+':'+row.pop;let child=node.children.get(rowKey);
    if(child===undefined){const allocation=row.pop<threshold?Array(16).fill(0n):allocate(def,row.pop,Number(BigInt(row.tick)*10n));child={active:Object.freeze(active.map((f,i)=>allocation[i]>=threshold?(f??row.tick):null)),children:new Map()};node.children.set(rowKey,child);townCacheNodes++;}
    node=child;active=node.active;
  }
  if(history.at(-1).pop!==p.end.pop||BigInt(history.at(-1).tick)!==BigInt(p.tick)+1n)contractError('boundary history endpoint');
  return {before,after:active};
}
export function refineCell(def,parentContract,unitAddress) {
  try{return refineCellImpl(def,parentContract,unitAddress);}catch(error){if(error.code==='REFINEMENT_CONTRACT_ERROR')throw error;contractError('invalid cell contract');}
}
function refineCellImpl(def,parentContract,unitAddress) {
  const p=structuredClone(parentContract),tick=BigInt(p.tick),year=Number(tick*10n);
  if(unitAddress.regionId!==p.regionId||BigInt(unitAddress.tick)!==tick)contractError('address');
  const ids=cellWeights(def,year).map(c=>c.id),start=allocate(def,p.start.pop,year),end=allocate(def,p.end.pop,year+10);
  let total=p.start.pop,previous=start;
  const phases=p.phases.map(phase=>{const after=total+phase.delta;if(after<0n)contractError('negative phase');const next=allocate(def,after,year);const delta=next.map((n,i)=>n-previous[i]);total=after;previous=next;return {...phase,delta};});
  if(total!==p.end.pop)contractError('population budget');
  const redistribution=end.map((n,i)=>n-previous[i]);
  const naturalBefore=p.phases.filter(x=>x.phase==='phase0').reduce((n,x)=>n+x.delta,p.start.pop);
  const naturalAfter=naturalBefore+p.naturalDelta;
  const nb=allocate(def,naturalBefore,year),na=allocate(def,naturalAfter,year);
  const cells=ids.map((id,i)=>({id:p.regionId+'/'+id,start:{...p.start,pop:start[i]},end:{...p.end,pop:end[i]},annualStart:nb[i],naturalDelta:na[i]-nb[i],redistribution:redistribution[i]}));
  const anchors=p.mandatoryEvents.map(e=>({event:structuredClone(e),cellId:cells[placement(def,e.id,'ref.cell.anchor',16n)].id,dateYear:e.dateYear}));
  const threshold=BigInt(def.townThreshold??1000),annotations=[],sites=cells.map(c=>({id:c.id+'/site',cellId:c.id,offset:placement(def,c.id,'ref.cell.site',1024n)}));
  const towns=townEpisodes(def,p,threshold);
  for(const [i,c] of cells.entries()){
    const founding=towns.after[i]??towns.before[i];c.townId=founding===null?null:hash([c.id+'/site',founding]);
    for(const [kind,predicate] of [['TOWN_FOUNDED',c.start.pop<threshold&&c.end.pop>=threshold],['TOWN_ABANDONED',c.start.pop>=threshold&&c.end.pop<threshold]])if(predicate)annotations.push({id:hash([c.id+'/site',kind,tick+1n]),kind,siteId:c.id+'/site',townId:c.townId,foundingTick:founding,dateYear:year+10,effects:[]});
  }
  for(const [i,kind] of ['RAID','LOCAL_FLOOD','LOCAL_SUCCESSION'].entries())if(p.start.pop>0n&&below(rng(def,p.regionId,'ref.cell.local',tick,i),20n)===0n)annotations.push({id:hash([p.regionId,tick,kind]),kind,cellId:cells[Number(below(rng(def,p.regionId,'ref.cell.local',tick,i+3),16n))].id,dateYear:year+Number(below(rng(def,p.regionId,'ref.cell.local',tick,i+6),10n)),effects:[]});
  return {version:PARTITION_VERSION,contract:p,cells,phases,anchors,sites,annotations:annotations.map(e=>({...e,ownerId:e.siteId??e.cellId,level:'C',salience:100})).sort((a,b)=>compare(a.dateYear,b.dateYear)||compare(a.id,b.id))};
}
export function aggregateCells(child) {
  try{return aggregateCellsImpl(child);}catch(error){if(error.code==='REFINEMENT_CONTRACT_ERROR')throw error;contractError('invalid cell projection');}
}
function aggregateCellsImpl(child) {
  const p=structuredClone(child.contract),cells=child.cells;
  if(cells.length!==16||child.annotations.some(e=>e.effects.length))contractError('local stock effect');
  const total=key=>sum(cells.map(c=>c[key].pop));
  p.start.pop=total('start');p.end.pop=total('end');
  p.naturalDelta=sum(cells.map(c=>c.naturalDelta));
  for(const c of cells){if(c.start.pop<0n||c.end.pop<0n||c.annualStart<0n||c.annualStart+c.naturalDelta<0n)contractError('negative cell');
    for(const key of ['start','end'])for(const field of Object.keys(p[key]).filter(k=>k!=='pop'))if(c[key][field]!==child.contract[key][field]&&!canonicalBytes(c[key][field]).equals(canonicalBytes(p[key][field])))contractError('staircase');}
  p.phases=child.phases.map(phase=>({...phase,delta:sum(phase.delta)}));
  if(sum(cells.map(c=>c.redistribution))!==0n)contractError('redistribution');
  let stocks=cells.map(c=>c.start.pop);
  for(const phase of child.phases){stocks=stocks.map((n,i)=>n+phase.delta[i]);if(stocks.some(n=>n<0n))contractError('negative phase');}
  if(stocks.some((n,i)=>n+cells[i].redistribution!==cells[i].end.pop))contractError('cell budget');
  p.mandatoryEvents=child.anchors.map(a=>{if(a.dateYear!==a.event.dateYear||!cells.some(c=>c.id===a.cellId))contractError('anchor');return a.event;});
  return p;
}
