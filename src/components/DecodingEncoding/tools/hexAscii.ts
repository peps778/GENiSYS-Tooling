import type { TransformResult } from '../types/decoding';

const HEX_PATTERN = /^[0-9a-fA-F\s]*$/;

export function hexToAscii(input: string): TransformResult {
  const cleaned = input.trim();
  if (cleaned.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!HEX_PATTERN.test(cleaned)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hexadecimal input: only 0-9 and A-F are allowed.',
    };
  }
  const stripped = cleaned.replace(/\s+/g, '');
  if (stripped.length % 2 !== 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hexadecimal input: odd number of hex digits.',
    };
  }
  const bytes = new Uint8Array(stripped.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
  }
  try {
    const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, output, meta: { bytes: bytes.length } };
  } catch {
    return {
      ok: false,
      output: '',
      error:
        'Invalid hexadecimal input: byte sequence is not valid UTF-8 text.',
    };
  }
}

export function asciiToHex(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const bytes = new TextEncoder().encode(input);
  const output = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
  return { ok: true, output, meta: { bytes: bytes.length } };
}
