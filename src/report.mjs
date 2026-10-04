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
    if(e2===0)return 14000n+ratio(y,BigInt(end),112000n);
    if(split!==null)return y<=BigInt(split)?14000n+ratio(logFixed(y+1n),logFixed(BigInt(split)+1n),48000n):62000n+ratio(y-BigInt(split),BigInt(end-split),64000n);
    return 14000n+ratio(logFixed(y+1n),logFixed(BigInt(end)+1n),112000n);
  };
  const ticks=new Set([0,end]);if(split!==null){ticks.add(split);for(let i=1;i<=4;i++)ticks.add(split+Math.floor((end-split)*i/4));}
  if(e2===0)for(let i=1;i<5;i++)ticks.add(Math.floor(end*i/5));else for(let y=1;y<(split??end);y*=10)ticks.add(y);
  return {x,split,ticks:[...ticks].sort((a,b)=>a-b),mode:e2===0?'linear years':split===null?'log years (year + 1); E2 not reached':'log years before E2 / linear years after E2'};
}
// Conservative monospace glyph estimate, shared by layout and collision tests.
export const GLYPH_WIDTH_PPM=620000;
export const textWidth=(value,size=14)=>Math.ceil(String(value).length*size*GLYPH_WIDTH_PPM/1000000);
export function textBox(x,y,value,size=14,anchor='start'){
  const width=textWidth(value,size);return {left:x-(anchor==='middle'?width/2:anchor==='end'?width:0),right:x+(anchor==='middle'?width/2:anchor==='end'?0:width),top:y-size,bottom:y+3};
}
export function thinTicks(axis,horizon){
  const selected=[horizon];
  for(const year of axis.ticks.filter(y=>y!==horizon&&y!==1)){
    const box=textBox(Number(axis.x(year))/100,0,year,16,'middle');
    if(selected.every(v=>{const other=textBox(Number(axis.x(v))/100,0,v,16,'middle');return box.right+12<other.left||other.right+12<box.left;}))selected.push(year);
  }
  return selected.sort((a,b)=>a-b);
}
const finishSVG=s=>s.join('\n').replace(/\b(x|y|x1|y1|x2|y2|cx|cy|r|width|height)="(\d+(?:\.\d+)?)"/g,(_,key,value)=>`${key}="${Number(value).toFixed(2)}"`)+'\n';
const COLORS=['#0072b2','#d55e00','#009e73','#cc79a7','#a17c00','#56b4e9','#332288','#222222'];
const ERAS=['#cbd5e1','#c6d8ac','#c7be8d','#efba73','#77c8c0','#75a9e0','#a995d5','#dc9eba'];
const FAMILY=[['demographic','#53727f'],['technology','#205bb5'],['political','#9055a2'],['catastrophe/peril','#bd3434'],['expansion','#25864e'],['contact','#9a6300']];
function family(kind){if(/LAUNCH|COLONY|VOYAGE|SPACEFLIGHT/.test(kind))return 4;if(/SIGNAL|CONTACT/.test(kind))return 5;if(/DOOM|EXTINCT|COLLAPSE|PLAGUE|FAMINE|CATASTROPHE|PANDEMIC|NUCLEAR|RUNAWAY/.test(kind))return 3;if(/TECH|DISCOVERY|ENERGY|AGRICULTURE|DIFFUSION/.test(kind))return 1;if(/POLITY|WAR|CONQUEST|REVOLUTION|HEGEMONY|FRAGMENT|SCHISM/.test(kind))return 2;return 0;}
export const salience=e=>/LINEAGE_EXTINCTION|STELLAR_DOOM|COLONY_FOUNDED|FIRST_CONTACT/.test(e.kind)?100:/SPACEFLIGHT|LAUNCH|COLLAPSE|RECOVERY|RUNAWAY|PANDEMIC|NUCLEAR/.test(e.kind)?80:e.kind==='ENERGY_TRANSITION'?60:10;
const safe=s=>String(s).replace(/[^A-Za-z0-9_-]/g,c=>'_'+c.charCodeAt(0).toString(16)+'_');
export const timelineFilename=r=>`timeline-${safe(r.scenario)}-${safe(r.seed)}.svg`;
// One best event from every occupied equal-year bin, then fill by priority.
export function stratifiedEvents(events,horizon,limit=12,rank=(a,b)=>salience(b)-salience(a),date=e=>e.dateYear){
  const ordered=[...events].sort((a,b)=>rank(a,b)||date(a)-date(b)||compare(a.id,b.id)),chosen=[];
  const bin=e=>Math.min(limit-1,Number(BigInt(Math.max(0,date(e)))*BigInt(limit)/BigInt(Math.max(1,horizon))));
  for(let i=0;i<limit;i++){const e=ordered.find(e=>bin(e)===i);if(e)chosen.push(e);}
  for(const e of ordered)if(chosen.length<limit&&!chosen.includes(e))chosen.push(e);
  return chosen.sort((a,b)=>date(a)-date(b)||compare(a.id,b.id));
}
export const salientCount=r=>(r.timeline?.events??[]).filter(e=>salience(e)>10&&(!e.resolution||e.resolution==='accepted')).length;
export function defaultTimelines(runs){
  const chosen=[];
  for(const scenario of [...new Set(runs.map(r=>r.scenario))].sort(compare)){
    const own=runs.filter(r=>r.scenario===scenario).sort((a,b)=>compare(a.seed,b.seed));
    const active=own.filter(r=>!['NO_LINEAGE','PENDING_ORIGIN'].includes(r.outcome)&&r.outcome!=='ERROR').sort((a,b)=>salientCount(b)-salientCount(a)||compare(a.seed,b.seed));
    const empty=own.find(r=>['NO_LINEAGE','PENDING_ORIGIN'].includes(r.outcome));
    if(active.length)chosen.push(active[0].seed);else if(empty)chosen.push(empty.seed);
    if(empty&&!chosen.includes(empty.seed))chosen.push(empty.seed);
  }
  return chosen.sort(compare);
}
export function timelineSVG(run){
  const data=run.timeline??{observations:[],arcs:[],events:[]},horizon=Number(run.untilYear??run.endYear??1),axis=timeAxis(horizon,run.firstEras?.[2]??null);
  const rows=[...data.observations].sort((a,b)=>a.year-b.year),peak=id=>rows.reduce((n,r)=>{const p=BigInt(r.arcs.find(a=>a.id===id)?.pop??0);return p>n?p:n;},0n);
  const arcs=[...data.arcs].sort((a,b)=>compare(peak(b.id),peak(a.id))||compare(a.id,b.id)).slice(0,8).sort((a,b)=>compare(a.id,b.id));
  const bodies=[...new Set(arcs.map(a=>a.body))].sort(compare),color=b=>COLORS[bodies.indexOf(b)%COLORS.length];
  const short=a=>`B${bodies.indexOf(a.body)+1}/a${arcs.indexOf(a)+1}`;
  const empty=['NO_LINEAGE','PENDING_ORIGIN'].includes(run.outcome);
  const maxPop=arcs.reduce((n,a)=>peak(a.id)>n?peak(a.id):n,1n),popTop=logFixed(maxPop+1n)||1n;
  const points=rows.filter((_,i)=>i===rows.length-1||i%Math.max(1,Math.ceil(rows.length/700))===0);
  const events=stratifiedEvents(data.events.filter(e=>!e.resolution||e.resolution==='accepted'),horizon);
  const voyages=data.events.filter(e=>e.kind==='LAUNCH'&&e.data?.launch),eligible=voyages.filter(e=>{const v=e.data.launch,source=data.arcs.find(a=>a.id===v.sourceArc)?.body;return bodies.includes(source)&&bodies.includes(v.destination);});
  const shown=stratifiedEvents(eligible,horizon,12,()=>0,e=>e.data.launch.launchYear);
  const placements=[],ends=[];
  events.forEach((e,i)=>{const x=Number(axis.x(e.dateYear))/100,w=32,left=x-w/2;let row=0;while((ends[row]??-100)>=left-8)row++;ends[row]=x+w/2;placements.push({e,i,x,row});});
  const markerBottom=280+Math.max(1,ends.length)*36,popTitle=markerBottom+40,popStart=popTitle+30;
  const popHeight=Math.max(240,arcs.length*32),popBottom=popStart+popHeight;
  const py=p=>BigInt(popBottom)*100n-ratio(logFixed(BigInt(p)+1n),popTop,BigInt(popHeight)*100n);
  const keyY=popBottom+35,polTitle=keyY+(Math.ceil(arcs.length/2)+1)*30+35,polTop=polTitle+30,polBottom=polTop+100;
  const voyageTitle=polBottom+45,laneTop=voyageTitle+100,laneBottom=voyages.length?laneTop+Math.max(1,bodies.length-1)*42:voyageTitle+62,densityTitle=laneBottom+45,densityBottom=densityTitle+(voyages.length?65:0);
  const axisY=densityBottom+40,listY=axisY+150,footer=listY+Math.ceil(events.length/2)*32+40,height=empty?300:footer+60;
  const s=['<?xml version="1.0" encoding="UTF-8"?>',`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}">`,`<rect width="1600" height="${height}" fill="#fafbfc"/>`,'<g font-family="monospace" font-size="16" fill="#17212b">'];
  const text=(x,y,value,extra='')=>s.push(`<text x="${x}" y="${y}" ${extra.includes('font-size=')?'':'font-size="16"'} ${extra}>${xml(value)}</text>`);
  const line=(x1,y1,x2,y2,extra='')=>s.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c5ced7" ${extra}/>`);
  text(40,32,`${run.scenario} | ${run.seed}`, 'font-size="23" font-weight="bold"');
  text(40,60,`${run.outcome} | horizon ${horizon} years | ${LABEL}`);
  if(!empty)text(40,84,axis.mode+'; stocks at decade boundaries. Population: log2(persons + 1).');
  if(empty){
    text(40,132,'No lineage arose before year '+horizon+': nothing to plot','font-size="20" font-weight="bold"');
    text(40,168,'No inhabited population, polity or voyage history exists within this observation horizon.');
    text(40,204,'Empty panels omitted. No time axis is plotted.');
    text(40,256,`Result digest: ${run.resultDigest??'ERROR'}`);
    s.push('</g></svg>');return finishSVG(s);
  }
  ERA_NAMES.forEach((name,i)=>{const x=40+(i%4)*385,y=112+Math.floor(i/4)*25;s.push(`<rect x="${x}" y="${y-12}" width="16" height="14" fill="${ERAS[i]}"/>`);text(x+23,y,`E${i} ${name}`);});
  text(40,175,'Frontier era | '+axis.mode);
  points.forEach((r,i)=>{const end=points[i+1]?.year??Math.min(horizon,run.endYear??horizon),x=axis.x(r.year),w=axis.x(end)-x,live=r.arcs.filter(a=>BigInt(a.pop)>0n),era=live.reduce((n,a)=>Math.max(n,a.era),0);if(w>0n&&live.length)s.push(`<rect data-era="E${era}" x="${dec(x)}" y="195" width="${dec(w)}" height="24" fill="${ERAS[era]}"/>`);});
  // Guides share the exact year coordinate; only marker rows may move.
  for(const {e,i,x,row} of placements){
    for(const [top,bottom] of [[195,219],[280+row*36+12,markerBottom],[popStart,popBottom],[polTop,polBottom],...(voyages.length?[[laneTop-12,laneBottom],[densityTitle+20,densityBottom]]:[])])
      line(x,top,x,bottom,`data-event-guide="${i+1}" data-year="${e.dateYear}" stroke-dasharray="3 3" stroke-width="1"`);
  }
  text(40,250,'Events at exact years; vertical guides cross panels. Numbers stack when dates cluster.');
  if(!events.length)text(800,280,'No accepted events in this history','text-anchor="middle"');
  for(const {e,i,x,row} of placements){const y=280+row*36,c=FAMILY[family(e.kind)][1];s.push(`<circle data-event-id="${xml(e.id)}" cx="${x}" cy="${y-5}" r="15" fill="#ffffff" stroke="${c}"/>`);text(x,y,i+1,`data-marker-number="${i+1}" data-event-id="${xml(e.id)}" text-anchor="middle" fill="${c}"`);}
  text(40,popTitle,'Population — persons; log2(persons + 1) | '+axis.mode);
  {
    line(140,popBottom,1260,popBottom);text(125,popBottom+5,'0 persons','text-anchor="end"');
    let last=popBottom+5;
    for(let p=1n;p<=maxPop;p*=10n){const y=Number(py(p))/100+5;if(last-y<20)continue;line(140,y-5,1260,y-5);text(125,y,String(p),'text-anchor="end"');last=y;}
    const labels=[];
    for(const a of arcs){const coords=points.map(r=>`${dec(axis.x(r.year))},${dec(py(r.arcs.find(v=>v.id===a.id)?.pop??0))}`).join(' ');if(coords)s.push(`<polyline points="${coords}" fill="none" stroke="${color(a.body)}" stroke-width="2"/>`);
      const end=[...rows].reverse().find(r=>BigInt(r.arcs.find(v=>v.id===a.id)?.pop??0)>0n);if(end)labels.push({a,x:Number(axis.x(end.year))/100,y:Number(py(end.arcs.find(v=>v.id===a.id).pop))/100});
    }
    labels.sort((a,b)=>a.y-b.y||compare(a.a.id,b.a.id));let lastY=popStart-24;
    labels.forEach((l,i)=>{const y=Math.max(lastY+24,Math.min(l.y,popBottom-(labels.length-i-1)*24));lastY=y;line(l.x,l.y,1280,y);text(1290,y+5,short(l.a),`fill="${color(l.a.body)}"`);});
  }
  text(40,keyY,`${arcs.length} arcs plotted; ${Math.max(0,data.arcs.length-arcs.length)} omitted. Key: body and arc labels.`);
  arcs.forEach((a,i)=>text(40+i%2*760,keyY+30+Math.floor(i/2)*30,`${short(a)} = ${a.body}`,`fill="${color(a.body)}"`));
  const count=r=>r.arcs.reduce((n,a)=>n+a.polities,0),maxPol=BigInt(Math.max(1,...rows.map(count))),qy=n=>BigInt(polBottom)*100n-ratio(BigInt(n),maxPol,10000n);
  text(40,polTitle,'Live polities — count | '+axis.mode);
  {
    for(const n of [...new Set([0,Number(maxPol/2n),Number(maxPol)])]){line(140,dec(qy(n)),1260,dec(qy(n)));text(125,dec(qy(n)+500n),String(n),'text-anchor="end"');}
    let d='';points.forEach((r,i)=>{const x=dec(axis.x(r.year)),y=dec(qy(count(r)));d+=i?` H ${x} V ${y}`:`M ${x} ${y}`;});if(d)s.push(`<path d="${d}" fill="none" stroke="#26384c" stroke-width="2"/>`);
  }
  s.push('<defs><marker id="arrival" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#26384c"/></marker></defs>');
  const ly=b=>laneTop+bodies.indexOf(b)*42;
  text(40,voyageTitle,'Body lanes / voyages');
  text(40,voyageTitle+28,`${shown.length} of ${voyages.length} voyages shown — SAMPLE, not the full history`, 'font-size="20" font-weight="bold"');
  if(voyages.length)text(40,voyageTitle+56,'First per 12 equal-year bins, then chronological fill; plotted bodies only. Circle = launch; arrow = arrival.');
  if(!voyages.length)text(40,voyageTitle+56,'No voyages in this history');else{
    bodies.forEach(b=>{line(140,ly(b),1260,ly(b));text(125,ly(b)+5,`B${bodies.indexOf(b)+1}`,'text-anchor="end"');});
    if(!shown.length)text(800,laneBottom,'No voyages between plotted bodies','text-anchor="middle"');
    for(const e of shown){const v=e.data.launch,source=data.arcs.find(a=>a.id===v.sourceArc)?.body,x=axis.x(v.launchYear),end=axis.x(v.arrivalYear),y=ly(source),ey=ly(v.destination);s.push(`<path data-event-id="${xml(e.id)}" d="M ${dec(x)} ${y} L ${dec(end)} ${ey}" fill="none" stroke="${color(source)}" stroke-width="3" marker-end="url(#arrival)"/><circle cx="${dec(x)}" cy="${y}" r="4" fill="${color(source)}"/>`);}
  }
  const bins=Array(12).fill(0);for(const e of voyages)bins[Math.min(11,Math.floor(e.data.launch.launchYear*12/Math.max(1,horizon)))]++;
  text(40,densityTitle,'All launches per equal-year bin (bar height = count; total '+voyages.length+')');
  const maxLaunch=Math.max(1,...bins);
  bins.forEach((n,i)=>{const start=Math.floor(horizon*i/12),end=Math.floor(horizon*(i+1)/12),x=axis.x(start),w=axis.x(end)-x,h=Math.floor(n*40/maxLaunch);s.push(`<rect data-launch-count="${n}" x="${dec(x)}" y="${densityBottom-h}" width="${dec(w)}" height="${h}" fill="#53727f"><title>${start}–${end}: ${n} launches</title></rect>`);});
  line(140,axisY,1260,axisY);
  for(const year of thinTicks(axis,horizon)){const x=dec(axis.x(year));line(x,axisY-6,x,axisY+6);text(x,axisY+26,String(year),'text-anchor="middle"');}
  text(1320,axisY+26,'Year');
  if(axis.split!==null){
    const bx=Number(axis.x(axis.split))/100;
    for(const [top,bottom] of [[195,219],[popStart,popBottom],[polTop,polBottom],...(voyages.length?[[laneTop-12,laneBottom]]:[])])
      line(bx,top,bx,bottom,'data-scale-break="true" stroke-width="3" stroke-dasharray="8 4"');
    s.push(`<path data-scale-break-glyph="true" d="M ${bx-12} ${axisY+8} l 8 -16 m 0 16 l 8 -16 m 0 16 l 8 -16" stroke="#17212b" stroke-width="3" fill="none"/>`);
    text(40,axisY+56,`SCALE CHANGE at E2, year ${axis.split}: left = log2(year + 1); right = linear years.`, 'font-size="18" font-weight="bold"');
  }else text(40,axisY+56,axis.mode+'; all panels share this year axis.');
  FAMILY.forEach(([name,c],i)=>text(40+i*255,axisY+108,name,`fill="${c}"`));
  events.forEach((e,i)=>text(40+i%2*760,listY+Math.floor(i/2)*32,`${i+1}. ${e.kind}@${e.dateYear}`,`data-list-number="${i+1}" data-event-id="${xml(e.id)}" fill="${FAMILY[family(e.kind)][1]}"`));
  text(40,footer,'Model attribution; seeded scenario. Event dates are not in-tick stock jumps. No empirical prediction.');
  text(40,footer+26,`Result digest: ${run.resultDigest??'ERROR'}`);s.push('</g></svg>');
  return finishSVG(s);
}
const legacyEraMetrics=new Set(['industrialE3','atomicE4','eraE5','eraE6']);
const metricLabel=metric=>metric+(legacyEraMetrics.has(metric)?' (includes starts at/above threshold)':'');
export const eraText=a=>a.eraThresholds.map(e=>`E${e.era}: started at/above ${e.startedFraction}; reached during run (started below) ${e.reachedFraction}; never reached ${e.neverFraction}; unknown/error ${e.unknown}/${e.n}. Lower median time: ${e.median??'undefined (no uncensored attainment)'} years; censored: left ${e.leftCensored}/${e.n}, right ${e.rightCensored}/${e.n}.`).join('\n');
export function aggregateText(a){return ['Aggregate ('+LABEL+')',...a.table.map(r=>`${metricLabel(r.metric)}: ${r.fraction}`),...a.outcomes.map(r=>`${r.outcome}: ${r.fraction}; proximate causes: ${r.causes.map(c=>`${c.count} ${c.kind}`).join(', ')||'none / not extinct'}`),eraText(a),...a.calibration.map(c=>`Calibration, started exactly E3 -> E${c.era}: lower median ${c.median??'undefined'} years; attained ${c.reached}/${c.n}; censored ${c.censored}/${c.n}.`),...a.bands.map(b=>`${b.verdict}: ${b.name}; observed ${b.observed}`)].join('\n');}
export function reportMarkdown(runs,{timelines=[],extraRuns=[]}={}){
  const sorted=[...runs].sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)),a=aggregate(sorted);
  const table=a=>['| Measure | Count / runs (%) |','|---|---|',...a.table.map(r=>`| ${metricLabel(r.metric)} | ${r.fraction} |`)].join('\n');
  const out=['# Civilization Lab ensemble',LABEL,'',`Runs: ${runs.length}. Seeds: global index i = 0..N-1; scenario = named scenario, or SCENARIOS[i % 5]; seed = <scenario>-<i>. No seed is dropped. Jobs affect execution only and are excluded from report bytes.`,
    'Percentages truncate to one decimal using integer arithmetic. Measures count runs with at least one qualifying lineage; outcome classes can overlap in multi-origin domains. Proximate cause counts count lineages within that outcome class; INITIAL_STATE and NATURAL_UPDATE explicitly indicate no proximate event. Era times are years since the earliest inhabited boundary. Starting era is the frontier at that boundary. Lower medians exclude runs starting at/above the threshold (left censored), runs never attaining it (right censored, including PENDING_ORIGIN and NO_LINEAGE), and errors (unknown). All counts retain the full N. Later origins in a multi-origin run may contribute to its frontier; these are run-level measures. Zero eligible attainments are undefined.',
    'First era years mean first attainment of at least that era. Physical multi-body/system occupancy includes past arcs, grouped by lineage, independently of E5/E6. Colony-only loss is an EXTINCTION of a colony arc with its lineage extant at the horizon; COLONY_LOST alone means nonviability, not extinction.',
    '',table(a),'','```text',aggregateText(a),'```'];
  for(const scenario of [...new Set(sorted.map(r=>r.scenario))].sort(compare)){const own=sorted.filter(r=>r.scenario===scenario),stats=aggregate(own);out.push('',`## ${scenario}`,'',table(stats),'','```text',eraText(stats),'```');}
  out.push('','## Seeds, explanations and digests');
  for(const r of sorted){out.push('',`- ${r.scenario}/${r.seed}; horizon ${r.untilYear}; max era ${r.maxEra??'none'}; ${r.explanation}`,`  - First eras: ${r.firstEras?.map((y,i)=>`E${i}=${y??'not reached'}`).join(', ')??'error'}`,`  - Manifest: ${r.manifestDigest??'error'}; recipe: ${r.recipeDigest??'error'}; result: ${r.resultDigest??'error'}`);if(timelines.includes(r.seed))out.push(`  - [Timeline](${timelineFilename(r)})`);}
  if(extraRuns.length){out.push('','## Requested additional timelines (excluded from ensemble N)','');for(const r of [...extraRuns].sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)))out.push(`- [${r.scenario}/${r.seed}](${timelineFilename(r)}): ${r.explanation}; horizon ${r.untilYear}; manifest ${r.manifestDigest??'error'}; recipe ${r.recipeDigest??'error'}; result ${r.resultDigest??'error'}`);}
  return out.join('\n')+'\n';
}
export function writeReport(runs,{out='out',timelines=[],extraRuns=[]}={}){
  const all=[...runs,...extraRuns];
  const chosen=new Set(timelines);
  for(const seed of defaultTimelines(runs))chosen.add(seed);
  for(const seed of chosen)if(!all.some(r=>r.seed===seed))throw new Error(`Timeline seed not in ensemble: ${seed}`);
  mkdirSync(out,{recursive:true});const files=[];
  for(const r of all.sort((a,b)=>compare(a.scenario,b.scenario)||compare(a.seed,b.seed)))if(chosen.has(r.seed)){const file=timelineFilename(r);writeFileSync(join(out,file),timelineSVG(r));files.push(file);}
  writeFileSync(join(out,'report.md'),reportMarkdown(runs,{timelines:[...chosen].sort(compare),extraRuns}));return files;
}
