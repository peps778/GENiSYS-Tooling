import type { TransformResult } from '../types/reverseEngineering';
import { bytesToAscii, bytesToHex, hexToBytes } from './bytes';

export function renderHex(bytes: Uint8Array, width = 16): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += width) {
    const row = bytes.slice(offset, offset + width);
    const hex = bytesToHex(row).padEnd(width * 3 - 1, ' ');
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${hex}  |${bytesToAscii(row)}|`);
  }
  return lines.join('\n');
}

export function hexView(input: string): TransformResult {
  const parsed = hexToBytes(input);
  if (!parsed.ok || !parsed.bytes) return parsed;
  return { ok: true, output: renderHex(parsed.bytes), meta: { bytes: parsed.bytes.length } };
}
