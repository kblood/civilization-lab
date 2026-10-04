import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest();
export const sha256Hex = bytes => hash(bytes).toString('hex');
export function merkleRoot(leafByteArrays) {
  if (!leafByteArrays.length) return sha256Hex(Buffer.concat([Buffer.from([2]), Buffer.from('civ-empty')]));
  let nodes = leafByteArrays.map(b => hash(Buffer.concat([Buffer.from([0]), b])));
  while (nodes.length > 1) {
    const next = [];
    for (let i = 0; i < nodes.length; i += 2) {
      next.push(i + 1 === nodes.length ? nodes[i] : hash(Buffer.concat([Buffer.from([1]), nodes[i], nodes[i + 1]])));
    }
    nodes = next;
  }
  return nodes[0].toString('hex');
}
