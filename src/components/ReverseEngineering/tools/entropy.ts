import type { TransformResult } from '../types/reverseEngineering';

export function shannonEntropy(bytes: Uint8Array): number {
  if (!bytes.length) return 0;
  const counts = new Uint32Array(256);
  for (const byte of bytes) counts[byte]++;
  let entropy = 0;
  for (const count of counts) {
    if (!count) continue;
    const probability = count / bytes.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

export function entropyTool(bytes: Uint8Array): TransformResult {
  const entropy = shannonEntropy(bytes);
  const interpretation = entropy < 1 ? 'Very low diversity / highly structured'
    : entropy < 4 ? 'Low-to-moderate diversity'
    : entropy < 7 ? 'Moderate-to-high diversity'
    : 'High entropy; compression, encryption, or packed data are possible';
  return { ok: true, output: `Shannon entropy: ${entropy.toFixed(6)} bits/byte\nInterpretation: ${interpretation}`, meta: { entropy } };
}
