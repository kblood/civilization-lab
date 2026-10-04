import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest();
export const sha256Hex = bytes => hash(bytes).toString('hex');
export function merkleRoot(leafByteArrays) {
  if (!leafByteArrays.length) return sha256Hex(Buffer.concat([Buffer.from([2]), Buffer.from('civ-empty')]));
  return merkleRootFromHashes(leafByteArrays.map(merkleLeafHash));
}
export const merkleLeafHash = bytes => hash(Buffer.concat([Buffer.from([0]), bytes])).toString('hex');
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
