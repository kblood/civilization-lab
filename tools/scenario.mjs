import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
const start=performance.now(),args=process.argv.slice(2);
const child=spawn(process.execPath,['src/cli.mjs',...args],{stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('exit',code=>{if(args.includes('--ensemble'))console.error(`Ensemble wall ms: ${(performance.now()-start).toFixed(2)}`);process.exitCode=code??1;});
