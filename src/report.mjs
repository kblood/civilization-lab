import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {compare} from './canonical.mjs';
import {aggregate,LABEL} from './ensemble.mjs';
import {ERA_NAMES} from './views.mjs';

export const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
// Q16 binary logarithm, integer range reduction and repeated squaring.
export function logFixed(value){let n=BigInt(value);if(n<=1n)return 0n;const bits=n.toString(2).length-1;
  let x=(n<<32n)>>BigInt(bits),fraction=0n;for(let i=15;i>=0;i--){x=x*x>>32n;if(x>=2n<<32n){x>>=1n;fraction|=1n<<BigInt(i);}}return BigInt(bits)*65536n+fraction;}
const dec=n=>{n=BigInt(n);return `${n/100n}.${String(n%100n).padStart(2,'0')}`;};
const ratio=(n,d,scale)=>d===0n?0n:BigInt(n)*BigInt(scale)/BigInt(d);
export function timeAxis(horizon,e2){
  const end=Math.max(1,Number(horizon)),split=e2!==null&&e2>0&&e2<end?e2:null;
  const x=year=>{const y=BigInt(Math.max(0,Math.min(end,year)));
    if(e2===0)return 14000n+ratio(y,BigInt(end),138000n);
    if(split!==null)return y<=BigInt(split)?14000n+ratio(logFixed(y+1n),logFixed(BigInt(split)+1n),48000n):62000n+ratio(y-BigInt(split),BigInt(end-split),90000n);
    return 14000n+ratio(logFixed(y+1n),logFixed(BigInt(end)+1n),138000n);
  };
  const ticks=new Set([0,end]);if(split!==null){ticks.add(split);for(let i=1;i<=4;i++)ticks.add(split+Math.floor((end-split)*i/4));}
  if(e2===0)for(let i=1;i<5;i++)ticks.add(Math.floor(end*i/5));else for(let y=1;y<(split??end);y*=10)ticks.add(y);
  return {x,split,ticks:[...ticks].sort((a,b)=>a-b),mode:e2===0?'linear years':split===null?'log years (year + 1); E2 not reached':'log years before E2 / linear years after E2'};
}
const COLORS=['#235789','#a33f2b','#26734d','#854c98','#9a6500','#157d8d','#b53c75','#515a64'];
const ERAS=['#cbd5e1','#c6d8ac','#c7be8d','#efba73','#77c8c0','#75a9e0','#a995d5','#dc9eba'];
const FAMILY=[['demographic','#53727f'],['technology','#205bb5'],['political','#9055a2'],['catastrophe/peril','#bd3434'],['expansion','#25864e'],['contact','#9a6300']];
function family(kind){if(/LAUNCH|COLONY|VOYAGE|SPACEFLIGHT/.test(kind))return 4;if(/SIGNAL|CONTACT/.test(kind))return 5;if(/DOOM|EXTINCT|COLLAPSE|PLAGUE|FAMINE|CATASTROPHE|PANDEMIC|NUCLEAR|RUNAWAY/.test(kind))return 3;if(/TECH|DISCOVERY|ENERGY|AGRICULTURE|DIFFUSION/.test(kind))return 1;if(/POLITY|WAR|CONQUEST|REVOLUTION|HEGEMONY|FRAGMENT|SCHISM/.test(kind))return 2;return 0;}
const salience=e=>/LINEAGE_EXTINCTION|STELLAR_DOOM|COLONY_FOUNDED|FIRST_CONTACT/.test(e.kind)?100:/SPACEFLIGHT|LAUNCH|COLLAPSE|RECOVERY|RUNAWAY|PANDEMIC|NUCLEAR/.test(e.kind)?80:e.kind==='ENERGY_TRANSITION'?60:10;
const safe=s=>String(s).replace(/[^A-Za-z0-9_-]/g,c=>'_'+c.charCodeAt(0).toString(16)+'_');
export const timelineFilename=r=>`timeline-${safe(r.scenario)}-${safe(r.seed)}.svg`;
export function timelineSVG(run){
  const data=run.timeline??{observations:[],arcs:[],events:[]},horizon=Number(run.untilYear??run.endYear??1),axis=timeAxis(horizon,run.firstEras?.[2]??null);
  const rows=[...data.observations].sort((a,b)=>a.year-b.year),peak=id=>rows.reduce((n,r)=>{const p=BigInt(r.arcs.find(a=>a.id===id)?.pop??0);return p>n?p:n;},0n);
  const arcs=[...data.arcs].sort((a,b)=>compare(peak(b.id),peak(a.id))||compare(a.id,b.id)).slice(0,8).sort((a,b)=>compare(a.id,b.id));
  const bodies=[...new Set(arcs.map(a=>a.body))].sort(compare),color=b=>COLORS[bodies.indexOf(b)%COLORS.length];
  const maxPop=arcs.reduce((n,a)=>peak(a.id)>n?peak(a.id):n,1n),popTop=logFixed(maxPop+1n)||1n;
  const py=p=>39500n-ratio(logFixed(BigInt(p)+1n),popTop,17500n);
  const points=rows.filter((_,i)=>i===rows.length-1||i%Math.max(1,Math.ceil(rows.length/700))===0);
  const events=[...data.events].sort((a,b)=>salience(b)-salience(a)||a.dateYear-b.dateYear||compare(a.id,b.id)).slice(0,12).sort((a,b)=>a.dateYear-b.dateYear||compare(a.id,b.id));
  const s=['<?xml version="1.0" encoding="UTF-8"?>','<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">','<rect width="1600" height="1000" fill="#fafbfc"/>','<g font-family="Arial, sans-serif" font-size="14" fill="#17212b">'];
  const text=(x,y,value,extra='')=>s.push(`<text x="${x}" y="${y}" ${extra}>${xml(value)}</text>`);
  const line=(x1,y1,x2,y2,extra='')=>s.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c5ced7" ${extra}/>`);
  text(40,32,`${run.scenario} | ${run.seed}`, 'font-size="23" font-weight="bold"');
  text(40,58,`${run.outcome} | horizon ${horizon} years | ${LABEL}`,'font-size="16"');
  text(40,84,axis.mode+'; stocks at decade boundaries. Population: log2(persons + 1).');
  ERA_NAMES.forEach((name,i)=>{const x=40+(i%4)*385,y=109+Math.floor(i/4)*23;s.push(`<rect x="${x}" y="${y-12}" width="16" height="14" fill="${ERAS[i]}"/>`);text(x+23,y,`E${i} ${name}`);});
  text(40,170,'Frontier era');
  const bandRows=points.length?points:[{year:0,arcs:[]}];
  bandRows.forEach((r,i)=>{const end=bandRows[i+1]?.year??Math.min(horizon,run.endYear??horizon),x=axis.x(r.year),w=axis.x(end)-x,era=r.arcs.reduce((n,a)=>Math.max(n,a.era),0);if(w>0n)s.push(`<rect x="${dec(x)}" y="151" width="${dec(w)}" height="24" fill="${ERAS[era]}"/>`);});
  text(40,206,'Population');
  line(140,dec(py(0n)),1520,dec(py(0n)));text(40,dec(py(0n)+450n),'0');
  for(let p=10n;p<=maxPop*2n;p*=10n){const y=py(p);if(y<21200n)break;line(140,dec(y),1520,dec(y));text(40,dec(y+450n),String(p));}
  for(const a of arcs){const coords=points.map(r=>`${dec(axis.x(r.year))},${dec(py(r.arcs.find(v=>v.id===a.id)?.pop??0))}`).join(' ');if(coords)s.push(`<polyline points="${coords}" fill="none" stroke="${color(a.body)}" stroke-width="2"/>`);}
  text(40,427,`${arcs.length} arcs plotted; ${Math.max(0,data.arcs.length-arcs.length)} others omitted. Body colours:`);
  bodies.forEach((b,i)=>text(520+(i%4)*245,427+Math.floor(i/4)*20,b,`fill="${color(b)}"`));
  const count=r=>r.arcs.reduce((n,a)=>n+a.polities,0),maxPol=BigInt(Math.max(1,...rows.map(count))),qy=n=>53500n-ratio(BigInt(n),maxPol,6500n);
  text(40,475,'Live polities');for(const n of [...new Set([0,Number(maxPol/2n),Number(maxPol)])]){line(140,dec(qy(n)),1520,dec(qy(n)));text(65,dec(qy(n)+450n),String(n));}
  let d='';points.forEach((r,i)=>{const x=dec(axis.x(r.year)),y=dec(qy(count(r)));d+=i?` H ${x} V ${y}`:`M ${x} ${y}`;});if(d)s.push(`<path d="${d}" fill="none" stroke="#26384c" stroke-width="2"/>`);
  const lanes=bodies.slice(0,8),ly=b=>580+lanes.indexOf(b)*20;
  text(40,561,'Body lanes / voyages');lanes.forEach(b=>{line(140,ly(b),1520,ly(b));text(40,ly(b)+5,b.replace('stub:',''));});
  const voyages=data.events.filter(e=>e.kind==='LAUNCH'&&e.data.launch),shown=voyages.filter(e=>{const v=e.data.launch,source=data.arcs.find(a=>a.id===v.sourceArc)?.body;return lanes.includes(source)&&lanes.includes(v.destination);}).slice(0,12);
  for(const e of shown){const v=e.data.launch,source=data.arcs.find(a=>a.id===v.sourceArc)?.body,x=axis.x(v.launchYear),end=axis.x(v.arrivalYear),y=ly(source),ey=ly(v.destination);s.push(`<path data-event-id="${xml(e.id)}" d="M ${dec(x)} ${dec(BigInt(y)*100n)} Q ${dec((x+end)/2n)} ${dec(BigInt(Math.min(y,ey)-15)*100n)} ${dec(end)} ${dec(BigInt(ey)*100n)}" fill="none" stroke="${color(source)}" stroke-width="2"/>`);}
  text(1050,561,`${shown.length} voyages shown; ${voyages.length-shown.length} omitted`);
  line(140,757,1520,757);let previous=-10000n;
  for(const year of axis.ticks){const x=axis.x(year);if(x-previous<6500n&&year!==horizon)continue;previous=x;line(dec(x),751,dec(x),763);text(dec(x),783,String(year),'text-anchor="middle"');}
  text(1450,805,'Year');
  if(axis.split!==null){const x=dec(axis.x(axis.split));line(x,145,x,757,'stroke-dasharray="5 4"');text(x,739,`E2 ${axis.split} — scale break`,'text-anchor="middle"');}
  FAMILY.forEach(([name,c],i)=>text(40+i*255,827,name,`fill="${c}"`));
  events.forEach((e,i)=>{const x=dec(axis.x(e.dateYear)),c=FAMILY[family(e.kind)][1];s.push(`<circle data-event-id="${xml(e.id)}" cx="${x}" cy="${185+i%3*8}" r="4" fill="${c}"><title>${xml(eventLabel(e))}</title></circle>`);
    text(40+i%4*390,857+Math.floor(i/4)*25,`${i+1}. ${e.kind}@${e.dateYear}`,`data-event-id="${xml(e.id)}" fill="${c}" font-size="12"`);});
  text(40,957,'Model attribution; seeded scenario. Event labels are dates, not in-tick stock jumps. No empirical prediction.');
  text(40,981,`Result digest: ${run.resultDigest??'ERROR'}`,'font-size="12"');s.push('</g></svg>');
  return s.join('\n').replace(/\b(x|y|x1|y1|x2|y2|cx|cy|r|width|height)="(\d+)"/g,'$1="$2.00"')+'\n';
}
const eventLabel=e=>`${e.kind}@${e.dateYear}`;
export function aggregateText(a){return ['Aggregate ('+LABEL+')',...a.table.map(r=>`${r.metric}: ${r.fraction}`),...a.outcomes.map(r=>`${r.outcome}: ${r.fraction}; proximate causes: ${r.causes.map(c=>`${c.count} ${c.kind}`).join(', ')||'none / not extinct'}`),`Lower median time to E2: ${a.medianE2??'undefined (no attainment)'}`,`Lower median time to E3: ${a.medianE3??'undefined (no attainment)'}`,...a.bands.map(b=>`${b.verdict}: ${b.name}; observed ${b.observed}`)].join('\n');}
export function reportMarkdown(runs,{timelines=[],extraRuns=[]}={}){
  const sorted=[...runs].sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)),a=aggregate(sorted);
  const table=a=>['| Measure | Count / runs (%) |','|---|---|',...a.table.map(r=>`| ${r.metric} | ${r.fraction} |`)].join('\n');
  const out=['# Civilization Lab ensemble',LABEL,'',`Runs: ${runs.length}. Seeds: global index i = 0..N-1; scenario = named scenario, or SCENARIOS[i % 5]; seed = <scenario>-<i>. No seed is dropped. Jobs affect execution only and are excluded from report bytes.`,
    'Percentages truncate to one decimal using integer arithmetic. Measures count runs with at least one qualifying lineage; outcome classes can overlap in multi-origin domains. Proximate cause counts count lineages within that outcome class; INITIAL_STATE and NATURAL_UPDATE explicitly indicate no proximate event. E2/E3 times are years since the earliest origin (initial fixtures start at their boundary); lower median among attained runs. Zero attained runs are reported as undefined.',
    'First era years mean first attainment of at least that era. Physical multi-body/system occupancy includes past arcs, grouped by lineage, independently of E5/E6. Colony-only loss is an EXTINCTION of a colony arc with its lineage extant at the horizon; COLONY_LOST alone means nonviability, not extinction.',
    '',table(a),'','```text',aggregateText(a),'```'];
  for(const scenario of [...new Set(sorted.map(r=>r.scenario))].sort(compare)){const own=sorted.filter(r=>r.scenario===scenario),stats=aggregate(own);out.push('',`## ${scenario}`,'',table(stats),'',`Lower median E2: ${stats.medianE2??'undefined'}; E3: ${stats.medianE3??'undefined'}.`);}
  out.push('','## Seeds, explanations and digests');
  for(const r of sorted){out.push('',`- ${r.scenario}/${r.seed}; horizon ${r.untilYear}; max era ${r.maxEra??'none'}; ${r.explanation}`,`  - First eras: ${r.firstEras?.map((y,i)=>`E${i}=${y??'not reached'}`).join(', ')??'error'}`,`  - Manifest: ${r.manifestDigest??'error'}; recipe: ${r.recipeDigest??'error'}; result: ${r.resultDigest??'error'}`);if(timelines.includes(r.seed))out.push(`  - [Timeline](${timelineFilename(r)})`);}
  if(extraRuns.length){out.push('','## Requested additional timelines (excluded from ensemble N)','');for(const r of [...extraRuns].sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)))out.push(`- [${r.scenario}/${r.seed}](${timelineFilename(r)}): ${r.explanation}; horizon ${r.untilYear}; manifest ${r.manifestDigest??'error'}; recipe ${r.recipeDigest??'error'}; result ${r.resultDigest??'error'}`);}
  return out.join('\n')+'\n';
}
export function writeReport(runs,{out='out',timelines=[],extraRuns=[]}={}){
  const all=[...runs,...extraRuns];
  const chosen=new Set(timelines);
  for(const scenario of [...new Set(runs.map(r=>r.scenario))].sort(compare)){const r=[...runs].filter(r=>r.scenario===scenario).sort((a,b)=>compare(a.seed,b.seed))[0];if(r)chosen.add(r.seed);}
  for(const seed of chosen)if(!all.some(r=>r.seed===seed))throw new Error(`Timeline seed not in ensemble: ${seed}`);
  mkdirSync(out,{recursive:true});const files=[];
  for(const r of all.sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)))if(chosen.has(r.seed)){const file=timelineFilename(r);writeFileSync(join(out,file),timelineSVG(r));files.push(file);}
  writeFileSync(join(out,'report.md'),reportMarkdown(runs,{timelines:[...chosen].sort(compare),extraRuns}));return files;
}
