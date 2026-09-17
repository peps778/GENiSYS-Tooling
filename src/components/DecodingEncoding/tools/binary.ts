import type { TransformResult } from '../types/decoding';

const BINARY_PATTERN = /^[01\s]*$/;

export function binaryToText(input: string): TransformResult {
  const cleaned = input.trim();
  if (cleaned.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!BINARY_PATTERN.test(cleaned)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid binary input: only 0, 1, and whitespace are allowed.',
    };
  }
  const stripped = cleaned.replace(/\s+/g, '');
  if (stripped.length % 8 !== 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid binary input: bit count is not a multiple of 8.',
    };
  }
  let output = '';
  for (let i = 0; i < stripped.length; i += 8) {
    output += String.fromCharCode(parseInt(stripped.slice(i, i + 8), 2));
  }
  return { ok: true, output, meta: { bytes: stripped.length / 8 } };
}

export function textToBinary(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const bytes = new TextEncoder().encode(input);
  const output = Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join(' ');
  return { ok: true, output, meta: { bytes: bytes.length } };
}
