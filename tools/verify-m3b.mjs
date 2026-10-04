import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
mkdirSync('docs/evidence',{recursive:true});
const mode=process.argv[2]??'tests';
const names=['plausibility-01','plausibility-02','plausibility-03','plausibility-04','signatures','report','ensemble','stellar-grace','projection-year','projection-cell'];
const commands=mode==='ensemble'?[['ensemble',['tools/scenario.mjs','--ensemble','64']]]:
  mode==='scenarios'?['lonely-earthlike','crowded-domain','harsh-anoxic','doomed-star','high-perils'].map(name=>['scenario-'+name,['src/cli.mjs','--scenario',name,'--seed','m3b-1']]):
  [['tests',['--test','--test-concurrency=1','tests/**/*.test.mjs']],['digest',['src/cli.mjs','--digest']],...names.map(n=>[n,['--test',`tests/${n}.test.mjs`]])];
let failed=false;
for(const [name,args] of commands){const start=performance.now(),npm=mode==='ensemble'?'npm run scenario -- --ensemble 64':name==='tests'?'npm test':name==='digest'?'npm run digest':null,r=spawnSync(npm?'cmd.exe':process.execPath,npm?['/d','/c',npm]:args,{encoding:'utf8',maxBuffer:20*1024*1024}),elapsed=(performance.now()-start).toFixed(2);
  const transcript=`$ ${npm??'node '+args.join(' ')}\n${r.stdout??''}${r.stderr??''}\nExit: ${r.status}\nWall ms: ${elapsed}\n`;
  const evidenceName=name==='ensemble'&&mode!=='ensemble'?'ensemble-test':name;
  writeFileSync(`docs/evidence/m3b-${evidenceName}.txt`,transcript);console.log(transcript);if(r.status!==0||!npm&&names.includes(name)&&Number(elapsed)>=2000||mode==='scenarios'&&Number(elapsed)>30000)failed=true;
}
if(mode==='ensemble')copyFileSync('out/report.md','docs/evidence/m3b-report.md');
process.exitCode=failed?1:0;
