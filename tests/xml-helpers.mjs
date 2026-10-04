// Small strict checker for the emitted XML subset (no DTD, CDATA or entities).
import assert from 'node:assert/strict';
export function checkXML(source){
  const stack=[];let root=0,pos=0;
  const escaped=text=>{assert.doesNotMatch(text,/[<>]/);assert.doesNotMatch(text,/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/);};
  for(const token of source.matchAll(/<[^>]*>/g)){
    escaped(source.slice(pos,token.index));pos=token.index+token[0].length;const t=token[0];
    if(/^<\?xml [^?]*\?>$/.test(t)){assert.equal(token.index,0);continue;}
    if(/^<\/[A-Za-z][\w:-]*>$/.test(t)){assert.equal(stack.pop(),t.slice(2,-1));continue;}
    const m=/^<([A-Za-z][\w:-]*)([\s\S]*?)(\/?)>$/.exec(t);assert.ok(m,t);
    let attrs=m[2],seen=new Set();while(attrs.trim()){
      const a=/^\s+([\w:-]+)="([^"<>]*)"/.exec(attrs);assert.ok(a,attrs);assert.ok(!seen.has(a[1]));seen.add(a[1]);escaped(a[2]);attrs=attrs.slice(a[0].length);
    }
    if(!stack.length)root++;if(!m[3])stack.push(m[1]);
  }
  escaped(source.slice(pos));assert.equal(stack.length,0);assert.equal(root,1);
}
