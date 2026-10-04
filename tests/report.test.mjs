import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ensemblePlan,runEnsemble} from '../src/ensemble.mjs';
import {reportMarkdown,timelineSVG,timeAxis,writeReport} from '../src/report.mjs';
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
    const svg=timelineSVG(a[i]);assert.equal(svg,timelineSVG(b[i]));assert.equal(svg,timelineSVG(c[i]));checkXML(svg);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);assert.ok(Buffer.byteLength(svg)<1000000);
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
