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
  const bytes = new Uint8Array(stripped.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(stripped.slice(i * 8, i * 8 + 8), 2);
  }
  try {
    const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, output, meta: { bytes: bytes.length } };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Invalid binary input: byte sequence is not valid UTF-8 text.',
    };
  }
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
