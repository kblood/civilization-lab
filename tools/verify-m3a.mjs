// Runner evidence only: clocks and child processes never enter src/ digests.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const root='docs/evidence';mkdirSync(root,{recursive:true});
const records=[];
function run(label,command,args,display,cap=null){
  const start=process.hrtime.bigint(),r=spawnSync(command,args,{encoding:'utf8',maxBuffer:16000000}),ms=Number(process.hrtime.bigint()-start)/1000000;
  const output=`$ ${display}\n${r.stdout??''}${r.stderr??''}\nExit: ${r.status}\nWall ms: ${ms.toFixed(2)}\n`;
  writeFileSync(`${root}/m3a-${label}.txt`,output);records.push({command:display,exit:r.status,wallMs:ms.toFixed(2),capMs:cap});
  console.log(`${display}: exit ${r.status}; ${ms.toFixed(2)} ms${cap!==null?`; cap ${cap} ms; ${ms<cap?'PASS':'FAIL'}`:''}`);
  if(r.status!==0||cap!==null&&ms>=cap)process.exitCode=1;
  if(label==='tests')console.log((r.stdout??'').split('\n').filter(l=>/^(ℹ|#) (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)/.test(l)).join('\n'));
}
const npm=args=>process.platform==='win32'?['cmd.exe',['/d','/s','/c','npm '+args.join(' ')]]:['npm',args];
run('tests',...npm(['test']),'npm test');
run('digest',...npm(['run','digest']),'npm run digest');
for(const file of ['horizon-prefix','projection-cell','projection-year','level-independence','views','narrative-isolation','front-speed','scenario'])run('test-'+file,process.execPath,['--test',`tests/${file}.test.mjs`],`node --test tests/${file}.test.mjs`,2000);
for(const name of ['lonely-earthlike','crowded-domain','harsh-anoxic','doomed-star','high-perils'])run('scenario-'+name,process.execPath,['src/cli.mjs','--scenario',name,'--seed','m3-1'],`node src/cli.mjs --scenario ${name} --seed m3-1`,15000);
writeFileSync(`${root}/m3a-measurements.txt`,records.map(r=>`${r.command}\nexit=${r.exit} wall_ms=${r.wallMs}${r.capMs!==null?` cap_ms=${r.capMs}`:''}`).join('\n\n')+'\n');
