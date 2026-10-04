import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractTable} from './table-helpers.mjs';

test('binding table and witness annex parse identically with LF and CRLF',()=>{
  const lf=readFileSync(new URL('../docs/transition-table-v1.md',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  const crlf=lf.replace(/\n/g,'\r\n');
  for(const marker of ['## Machine-readable table','<!-- M2A-WITNESS-ANNEX -->']) {
    assert.deepEqual(extractTable(crlf,marker),extractTable(lf,marker));
  }
});

test('repository text checkout policy specifies LF',()=>{
  const attributes=readFileSync(new URL('../.gitattributes',import.meta.url),'utf8');
  assert.match(attributes,/^\*\s+text=auto\s+eol=lf\s*$/m);
});
