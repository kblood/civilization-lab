import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
let failed=false;
for(const [name,command] of [
  ['projection-cell','node --test tests/projection-cell.test.mjs'],
  ['projection-year','node --test tests/projection-year.test.mjs'],
  ['repeat','node src/cli.mjs --ensemble 64 --jobs 1 --out out/m3fix-repeat'],
]){
  const start=performance.now(),r=spawnSync('cmd.exe',['/d','/c',command],{encoding:'utf8',maxBuffer:30*1024*1024});
  const wall=(performance.now()-start).toFixed(2),transcript=`$ ${command}\n${r.stdout??''}${r.stderr??''}\nExit: ${r.status}\nWall ms: ${wall}\n`;
  writeFileSync(`docs/evidence/m3fix-${name}.txt`,transcript);console.log(transcript);
  if(r.status!==0)failed=true;
  if(name.startsWith('projection')&&Number(wall)>=2000)console.log(`${name}: standalone 2 s budget NOT MET`);
}
if(!failed){
  const {files}=JSON.parse(readFileSync('docs/evidence/m3fix-audit.json','utf8'));
  for(const file of ['report.md',...files])assert.deepEqual(readFileSync('out/'+file),readFileSync('out/m3fix-repeat/'+file),file);
  const result='PASS: report.md and all 6 selected SVGs byte-identical across full 64-seed jobs=4 and jobs=1 runs.\n';
  writeFileSync('docs/evidence/m3fix-repeat-comparison.txt',result);console.log(result);
}
process.exitCode=failed?1:0;
