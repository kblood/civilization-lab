import { createHash, hash as hashOnce } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest();
export const sha256Hex = bytes => hashOnce('sha256',bytes,'hex');
export function merkleRoot(leafByteArrays) {
  if (!leafByteArrays.length) return sha256Hex(Buffer.concat([Buffer.from([2]), Buffer.from('civ-empty')]));
  return merkleRootFromHashes(leafByteArrays.map(merkleLeafHash));
}
export const merkleLeafHash = bytes => hash(Buffer.concat([Buffer.from([0]), bytes])).toString('hex');
// Stream canonical chapter fragments, retaining at most one small UTF-8 chunk.
export function merkleLeafParts(parts) {
  const h=createHash('sha256');h.update(Buffer.from([0]));
  let pending='',bytes=0;
  const flush=()=>{const b=Buffer.from(pending);bytes+=b.length;h.update(b);pending='';};
  for(const part of parts){pending+=part;if(pending.length>=32768)flush();}
  if(pending.length)flush();
  return {hash:h.digest('hex'),bytes};
}
export function merkleRootFromHashes(hashes) {
  if (!hashes.length) return sha256Hex(Buffer.concat([Buffer.from([2]), Buffer.from('civ-empty')]));
  if (hashes.some(h=>typeof h!=='string'||!/^[a-f0-9]{64}$/.test(h))) throw new TypeError('Invalid leaf hash');
  let nodes = hashes.map(h=>Buffer.from(h,'hex'));
  while (nodes.length > 1) {
    const next = [];
    for (let i = 0; i < nodes.length; i += 2) {
      next.push(i + 1 === nodes.length ? nodes[i] : hash(Buffer.concat([Buffer.from([1]), nodes[i], nodes[i + 1]])));
    }
    nodes = next;
  }
  return nodes[0].toString('hex');
}
