import type { TransformResult } from '../types/reverseEngineering';

export function hexToBytes(
  input: string,
): TransformResult & { bytes?: Uint8Array } {
  const cleaned = input.replace(/[\s,:-]+/g, '').trim();
  if (!cleaned)
    return { ok: false, output: '', error: 'Provide hexadecimal bytes.' };
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hexadecimal byte sequence.',
    };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  return { ok: true, output: '', bytes };
}

export function bytesToHex(bytes: Uint8Array, separator = ' '): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    separator,
  );
}

export function bytesToAscii(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) =>
    byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.',
  ).join('');
}

export function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function toResult(
  bytes: Uint8Array,
  meta?: Record<string, string | number>,
): TransformResult {
  return { ok: true, output: bytesToHex(bytes), meta };
}
