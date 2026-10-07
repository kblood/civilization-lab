import { floorDiv as F, ceilDiv as C } from './time.mjs';
import { compare } from './canonical.mjs';
import { deepFreeze } from './manifest.mjs';
export const DOMAINS = Object.freeze(['Energy','Subsistence','Materials','Transport','Information','Medicine','Organisation']);
export const MAX_TIERS = Object.freeze([6,5,5,7,5,4,5]);
// M4a authored scenario values, in persons; these are not historical estimates.
export const NSTAR = deepFreeze([[0,100,500,2000,10000,40000,100000],[0,50,100,500,5000,30000],
  [0,100,500,1000,10000,50000],[0,100,300,1000,5000,15000,40000,80000],[0,50,200,1000,10000,40000],
  [0,50,200,1000,10000],[0,100,300,1000,10000,40000]]);
export const DISCOVERY_COST = deepFreeze([[0,2,5,10,20,100,3000],[0,2,5,10,20,100],[0,2,5,10,20,100],[0,2,5,10,20,100,500,2000],[0,2,5,10,20,100],[0,2,5,10,20],[0,2,5,10,20,100]]);
export const discoveryRate=(d,target,neff,ppm)=>F(400n*neff*BigInt(ppm),1000000n*BigInt(DISCOVERY_COST[d][target]));
// All COLONY_M5 values are [scenario], not historical estimates.
export const COLONY_M5=Object.freeze({version:'m5-colony-1',reserveInitialYears:1000,reserveCapYears:1000,maxDrainYearsPerTick:10,localRegainYearsPerTick:5,reinforcementYearsPerThousand:250});
export const colonyDrain=(maint,limit)=>maint>=limit?0:Number(C(BigInt(COLONY_M5.maxDrainYearsPerTick)*(limit-maint),limit));
export const colonyStock=(stock,drain)=>drain?Math.max(0,stock-drain):Math.min(COLONY_M5.reserveCapYears,stock+COLONY_M5.localRegainYearsPerTick);
export const qualifiedPopulation=a=>MAX_TIERS.map((max,d)=>Array.from({length:max+1},(_,k)=>a.regions.reduce((n,r)=>n+(r.pop>0n&&r.tiers[d]>=k?r.pop:0n),0n)));
// M5 round 3 opt-in superset of m5-colony-1 (reserve values inherited unchanged).
// Every added value is [scenario]; rationale in docs/transition-table-v1.md.
// D5 (changed in place; opt-in, unmeasured, unreleased): founding parties fill m5-colony-1's landing region
// first and spill in region order only when it is full; reinforcements split over populated regions by
// remaining room (largest remainder) and only the overflow starts empty regions; the specialist roster is
// for reinforcements only, since founders' knowledge already is the colony.
export const COLONY_M5_2=Object.freeze({...COLONY_M5,version:'m5-colony-2',extends:'m5-colony-1',allocation:'founders-together-reinforcements-by-remaining-room',
  diversionMaxTravelYears:500,strandedSurvivalYears:500,maxDiversions:1,maxStrandings:1,specialists:'reinforcement-status-roster'});
export const COLONY_POLICIES=Object.freeze([COLONY_M5,COLONY_M5_2]);
// Largest-remainder split of persons over rows {id, room}; zero-room rows get nobody,
// remainder ties go to the lower id. Returns id-sorted rows with persons > 0.
export function allocateByCapacity(persons,rows) {
  const open=rows.filter(r=>r.room>0n),total=open.reduce((n,r)=>n+r.room,0n);
  if(!total||persons<=0n)return [];
  const shares=open.map(r=>({id:r.id,persons:persons*r.room/total,rem:persons*r.room%total}));
  let left=persons-shares.reduce((n,s)=>n+s.persons,0n);
  for(const s of [...shares].sort((a,b)=>compare(b.rem,a.rem)||compare(a.id,b.id))){if(left===0n)break;s.persons++;left--;}
  return shares.filter(s=>s.persons>0n).map(s=>({id:s.id,persons:s.persons})).sort((a,b)=>compare(a.id,b.id));
}
export const COLONY_ARCHIVE_YEARS=1000;
export const STATUS_PERIOD_YEARS=100;
export const STATUS_STALE_YEARS=300;
export const INTERPLANETARY_LINK_PERMILLE=100;
export const MAX_RECOVERIES=4;
export function maintenancePopulation(a,r,d,neff,limit,policy=null,reserve=true) {
  const year=Number(a.tick*10n);
  let reported=0n;
  for(const report of [...(a.lineageReports??[])].sort((a,b)=>compare(a.source,b.source))) {
    if(report.source!==a.id&&report.lineageId===a.lineageId&&year>=report.reportYear&&year<report.reportYear+STATUS_STALE_YEARS+report.routeDelayYears&&report.tiers[d]>=r.tiers[d])reported+=BigInt(policy&&report.qualified?report.qualified[d][r.tiers[d]]:report.population);
  }
  neff+=F(reported*BigInt(INTERPLANETARY_LINK_PERMILLE),1000n);
  return reserve&&a.isColony&&r.pop>0n&&(policy?a.colonyReserve>0:Number(a.tick*10n)<a.foundedYear+COLONY_ARCHIVE_YEARS)&&r.tiers[d]<=a.foundingTiers[d]?max(neff,limit):neff;
}
export const GROWTH = Object.freeze([10050,20201,105171,221403,161834,105171,105171,105171]);
export const CAPTURE = Object.freeze([4500n,8000n,26000n,77000n,230000n,1000000n,5000000n,10000000n]);
export const BUILD = Object.freeze([1,2,4,8,16,32,64,128]);
export const FUEL = Object.freeze([0,0,0,2,4,8,16,32]);
const SUBS = [1000n,2500n,10000n,25000n,60000n,120000n];
const names = ['metals','fuels','fissiles','domesticables'];
// Each row: prerequisite pairs, resource pairs. Index = target tier - 1.
export const GATES = deepFreeze([
  [[[[1,1]],[[3,100]]],[[[2,1],[3,1]],[[0,100]]],[[[2,3],[3,2]],[[1,100]]],[[[2,4],[4,3]],[[2,50]]],[[[2,4],[4,4]],[[0,100]]],[[[2,5],[3,7],[6,5]],[[0,100]]]],
  [[[],[[3,100]]],[[[0,1],[6,1]],[[3,100]]],[[[2,2],[3,2]],[[0,100]]],[[[0,3],[2,3]],[[1,100]]],[[[0,4],[5,3]],[[0,100]]]],
  [[[[0,1]],[[0,100]]],[[[0,1]],[[0,200]]],[[[0,2]],[[0,200]]],[[[0,3],[4,2]],[[0,200]]],[[[0,5],[4,5]],[[0,200]]]],
  [[[[1,1]],[]],[[[2,1],[6,1]],[[0,100]]],[[[0,3],[2,3]],[[0,200]]],[[[0,3],[2,3],[4,3]],[[1,100]]],[[[0,4],[2,4],[4,4]],[[0,200]]],[[[0,5],[1,5],[6,4]],[[0,200]]],[[[0,5],[2,5],[6,5]],[[0,200]]]],
  [[[[1,1]],[]],[[[2,1],[6,2]],[]],[[[0,3],[2,3]],[[0,100]]],[[[0,4],[2,4]],[[0,200]]],[[[0,4],[5,3]],[[0,200]]]],
  [[[[1,1]],[]],[[[4,2]],[]],[[[0,3],[4,3]],[]],[[[4,4],[2,4]],[]]],
  [[[[1,1]],[]],[[[1,2],[4,1]],[]],[[[3,2],[4,2]],[]],[[[4,3],[3,4]],[]],[[[4,4],[3,6]],[]]],
]);
const gateCaches=new WeakMap();
export function gate(r,d,profile,polity=null) {
  if(r.pop===0n||!Object.isFrozen(r.tiers)||!Object.isFrozen(r.caps)||!Object.isFrozen(r.resources))return computeGate(r,d,profile,polity);
  let entries=gateCaches.get(r.tiers);if(!entries){entries=[];gateCaches.set(r.tiers,entries);}
  const old=entries.find(e=>e.caps===r.caps&&e.resources===r.resources&&e.profile===profile&&e.hegemony===!!polity?.hegemony);
  if(old)return old.results[d];
  const results=DOMAINS.map((_,i)=>computeGate(r,i,profile,polity));entries.push({caps:r.caps,resources:r.resources,profile,hegemony:!!polity?.hegemony,results});return results[d];
}
function computeGate(r, d, profile, polity = null) {
  const target = r.tiers[d]+1, ceilings = [];
  if (target > MAX_TIERS[d]) return {eligible:false, ceilings, prerequisites:[]};
  let [prerequisites, resources] = GATES[d][target-1];
  if (profile === 'anoxic') {
    if (d===0 && target===1) { prerequisites=[[2,0],[1,1]]; resources=[[0,100]]; }
    if ((d===0 && target===3) || (d===1 && target===4) || (d===3 && target===4)) resources=[[0,200]];
  }
  if (target>r.caps[d]) ceilings.push({domain:DOMAINS[d],targetTier:target,reason:'existential-cap'});
  for (const [i,min] of resources) if (r.resources[i]<min) ceilings.push({domain:DOMAINS[d],targetTier:target,reason:`resource:${names[i]}`});
  return {eligible:r.pop>0n && !ceilings.length && prerequisites.every(([i,min])=>r.tiers[i]>=min) &&
    !(d===6 && target===4 && !polity?.hegemony), ceilings:ceilings.sort((a,b)=>compare(a.reason,b.reason)), prerequisites};
}
export function era([E,S,M,T,I,V,O]) {
  if(E>=6)return 7; if(E>=5&&T>=7)return 6; if(E>=5&&T>=6)return 5;
  if(E>=4&&I>=4)return 4; if(E>=3&&M>=3&&T>=3)return 3;
  if(S>=2&&O>=2&&M>=1)return 2; return S>=1?1:0;
}
export const damage = r => Math.min(1000,r.damage.reduce((n,d)=>n+d.permille,0));
export const capacity = r => F(r.Kbase*SUBS[r.tiers[1]]*BigInt(1000-damage(r)),1000000n);
const pressures=new Map();
export function prepareRegions(regions){pressures.clear();for(const r of regions)pressures.set(r,Number(min(2000n,F(r.pop*1000n,max(1n,r.K)))));}
export const pressure=r=>pressures.get(r)??Number(min(2000n,F(r.pop*1000n,max(1n,r.K))));
export const min = (a,b)=>a<b?a:b;
export const max = (a,b)=>a>b?a:b;
export function bevertonHolt(P,K,g) {
  if(typeof P!=='bigint'||typeof K!=='bigint'||P<0n||K<0n||!Number.isSafeInteger(g)||g<0)throw new RangeError('Invalid BH inputs');
  if(!P||!K)return 0n;
  if(P===K)return P;
  const num=P*K*(1000000n+BigInt(g)),den=1000000n*K+BigInt(g)*P;
  return F(2n*num+den,2n*den);
}
