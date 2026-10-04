import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ensemblePlan,runEnsemble} from '../src/ensemble.mjs';
import {reportMarkdown,timelineSVG,timeAxis,writeReport,textBox,thinTicks,defaultTimelines,stratifiedEvents} from '../src/report.mjs';
import {readFileSync} from 'node:fs';
import {checkXML} from './xml-helpers.mjs';
import {createScenario} from '../src/scenario.mjs';
test('report and SVG repeat byte-for-byte across runs and jobs, with valid event IDs and XML',async()=>{
  const tasks=ensemblePlan(2,{untilYear:100}),a=await runEnsemble(tasks,{jobs:1}),b=await runEnsemble(tasks,{jobs:2}),c=await runEnsemble(tasks,{jobs:1});
  assert.ok(a.every(r=>!r.flags.error));assert.equal(reportMarkdown(a),reportMarkdown(b));assert.equal(reportMarkdown(a),reportMarkdown(c));
  const files=[a,b,c].map((runs,i)=>writeReport(runs,{out:`out/test-report-${i}`}));
  assert.deepEqual(files[0],files[1]);assert.deepEqual(files[0],files[2]);
  for(const file of ['report.md',...files[0]])for(const i of [1,2])assert.deepEqual(readFileSync(`out/test-report-0/${file}`),readFileSync(`out/test-report-${i}/${file}`));
  for(let i=0;i<a.length;i++){
    const svg=timelineSVG(a[i]);assert.equal(svg,timelineSVG(b[i]));assert.equal(svg,timelineSVG(c[i]));checkXML(svg);assertNoTextOverlap(svg);assertNumberBijection(svg);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);assert.ok(Buffer.byteLength(svg)<1000000);
    for(const m of svg.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy|r|width|height)="([^"]+)"/g))assert.match(m[1],/^\d+\.\d{2}$/);
    const ids=new Set(a[i].timeline.events.map(e=>e.id));for(const m of svg.matchAll(/data-event-id="([^"]*)"/g))assert.ok(ids.has(m[1].replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&apos;',"'")));
  }
  assert.ok(a.some(r=>r.timeline.events.length>0));
  for(const e2 of [null,0,30,100]){const axis=timeAxis(100,e2);for(let y=1;y<=100;y++)assert.ok(axis.x(y)>=axis.x(y-1));}
  for(const bad of ['<svg><g></svg>','<svg a=bad/>','<svg>a & b</svg>','<svg>a > b</svg>'])assert.throws(()=>checkXML(bad));
});
test('observation and sampled inspection leave all causal result bytes unchanged',()=>{
  const {world}=createScenario('crowded-domain','observer',{untilYear:40});
  const plain=world.compileSummary(),view=world.compileSummary({observe:true,inspectSampleTicks:['0','3']});
  assert.equal(plain.resultDigest,view.resultDigest);assert.deepEqual(plain.events,view.events);assert.equal(view.ledgers.length,2);assert.ok(view.observations.length>0);
});

function assertNoTextOverlap(svg){
  const unxml=s=>s.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'");
  const boxes=[...svg.matchAll(/<text ([^>]+)>([^<]*)<\/text>/g)].map(([,attrs,value])=>{
    const attr=key=>attrs.match(new RegExp(`(?:^| )${key}="([^" ]+)"`))?.[1];
    return {...textBox(Number(attr('x')),Number(attr('y')),unxml(value),Number(attr('font-size')??14),attr('text-anchor')??'start'),value};
  });
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`text collision: ${a.value} / ${b.value}`);
  }
}
function assertNumberBijection(svg){
  const markers=[...svg.matchAll(/data-marker-number="(\d+)"/g)].map(m=>m[1]);
  const list=[...svg.matchAll(/data-list-number="(\d+)"/g)].map(m=>m[1]);
  assert.deepEqual(markers,list);assert.equal(new Set(markers).size,markers.length);
  for(const number of markers){assert.match(svg,new RegExp(`data-marker-number="${number}"[^>]*>${number}<`));assert.match(svg,new RegExp(`data-list-number="${number}"[^>]*>${number}\\.`));}
}
test('timeline text does not collide, including log endpoints, crowded markers and empty panels',()=>{
  const empty={scenario:'lonely-earthlike',seed:'empty',outcome:'NO_LINEAGE',untilYear:120000,firstEras:Array(8).fill(null),timeline:{arcs:[],observations:[],events:[]}};
  const svg=timelineSVG(empty);assertNoTextOverlap(svg);assertNumberBijection(svg);checkXML(svg);
  assert.equal([...svg.matchAll(/No lineage arose before year 120000: nothing to plot/g)].length,4);
  assert.match(svg,/No voyages in this history/);assert.doesNotMatch(svg,/data-era="E0"/);
  const ticks=thinTicks(timeAxis(120000,null),120000);assert.ok(ticks.includes(120000));assert.ok(!ticks.includes(100000));assert.ok(!(ticks.includes(0)&&ticks.includes(1)));
  const arcs=Array.from({length:8},(_,i)=>({id:`a${i}`,body:`stub:body${i}`}));
  const events=Array.from({length:24},(_,i)=>({id:`event${i}`,kind:'COLLAPSE',dateYear:i<12?1:i*5000,data:{}}));
  const active={...empty,outcome:'EXTANT_PLANETARY',seed:'crowded',firstEras:[0,0,0,null,null,null,null,null],timeline:{arcs,events,observations:[0,50000,120000].map(year=>({year,arcs:arcs.map(a=>({...a,pop:'1000000',era:2,polities:3}))}))}};
  const plotted=timelineSVG(active);assertNoTextOverlap(plotted);assertNumberBijection(plotted);checkXML(plotted);
  assert.equal([...plotted.matchAll(/data-marker-number=/g)].length,12);assert.match(plotted,/0 persons/);
  assert.ok(stratifiedEvents(events,120000).some(e=>e.dateYear>=100000));
  // Force all twelve labels into one time position to exercise row staggering.
  active.timeline.events=events.slice(0,12);assertNoTextOverlap(timelineSVG(active));
});
test('representative seeds favour salient inhabited histories and retain a no-lineage example',()=>{
  const r=(seed,outcome,count)=>({scenario:'fixture',seed,outcome,timeline:{events:Array.from({length:count},()=>({kind:'COLLAPSE'}))}});
  const runs=[r('a','NO_LINEAGE',0),r('b','EXTANT_PLANETARY',1),r('c','EXTANT_PLANETARY',3),r('d','EXTANT_PLANETARY',3),r('e','ERROR',100)];
  assert.deepEqual(defaultTimelines(runs),['a','c']);assert.deepEqual(defaultTimelines([...runs].reverse()),['a','c']);assert.deepEqual(defaultTimelines([runs[0],runs[4]]),['a']);
});

test('voyage sampling spans the history and density counts every launch',()=>{
  const arcs=[{id:'a',body:'home'},{id:'b',body:'colony'}];
  const launches=Array.from({length:120},(_,i)=>({id:`launch${i}`,kind:'LAUNCH',dateYear:i*250,data:{launch:{sourceArc:'a',destination:'colony',launchYear:i*250,arrivalYear:i*250+50}}}));
  const run={scenario:'voyages',seed:'fixed',outcome:'EXTANT_MULTI_BODY',untilYear:30000,firstEras:[0,0,0,0,null,null,null,null],timeline:{arcs,events:launches,observations:[{year:0,arcs:arcs.map(a=>({...a,pop:'1000',era:3,polities:1}))},{year:30000,arcs:arcs.map(a=>({...a,pop:'1000',era:3,polities:1}))}]}};
  const svg=timelineSVG(run);assertNoTextOverlap(svg);assertNumberBijection(svg);checkXML(svg);
  const paths=[...svg.matchAll(/<path data-event-id="(launch\d+)"/g)].map(m=>m[1]);
  assert.equal(paths.length,12);assert.ok(paths.includes('launch110'));
  const bins=[...svg.matchAll(/data-launch-count="(\d+)"/g)].map(m=>Number(m[1]));assert.deepEqual(bins,Array(12).fill(10));
});
