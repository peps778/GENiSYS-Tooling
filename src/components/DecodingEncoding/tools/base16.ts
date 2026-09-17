import type { TransformResult } from '../types/decoding';

const HEX_PATTERN = /^[0-9a-fA-F]*$/;

export function base16Encode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const bytes = new TextEncoder().encode(input);
  const output = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return { ok: true, output };
}

export function base16Decode(input: string): TransformResult {
  const cleaned = input.trim().replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!HEX_PATTERN.test(cleaned)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base16 input: only 0-9 and A-F are allowed.',
    };
  }
  if (cleaned.length % 2 !== 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base16 input: odd number of hex digits.',
    };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  try {
    const output = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { ok: true, output, meta: { bytes: bytes.length } };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base16 input: could not decode.',
    };
  }
}
