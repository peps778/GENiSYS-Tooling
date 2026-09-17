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
  let output = '';
  for (let i = 0; i < stripped.length; i += 2) {
    output += String.fromCharCode(parseInt(stripped.slice(i, i + 2), 16));
  }
  return { ok: true, output, meta: { bytes: stripped.length / 2 } };
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
