import type { TransformResult } from '../types/reverseEngineering';
import { bytesToHex } from './bytes';

export function byteFrequency(bytes: Uint8Array): TransformResult {
  const counts = new Uint32Array(256);
  for (const byte of bytes) counts[byte]++;
  const rows = Array.from(counts, (count, byte) => ({ byte, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.byte - b.byte);
  const output = rows.map((row) => `${bytesToHex(Uint8Array.of(row.byte))}  ${row.count.toString().padStart(8)}  ${(row.count / bytes.length * 100).toFixed(3)}%`).join('\n');
  return { ok: true, output: output || 'No bytes to analyze.', meta: { uniqueBytes: rows.length } };
}
