import type { TransformResult } from '../types/decoding';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_PATTERN = /^[A-Z2-7]*=*$/;

export function base32Encode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const bytes = new TextEncoder().encode(input);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');

  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    output += ALPHABET[parseInt(chunk, 2)];
  }
  while (output.length % 8 !== 0) output += '=';
  return { ok: true, output };
}

export function base32Decode(input: string): TransformResult {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!BASE32_PATTERN.test(cleaned)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base32 input: unexpected characters.',
    };
  }
  const firstPadding = cleaned.indexOf('=');
  if (firstPadding >= 0) {
    const padding = cleaned.length - firstPadding;
    if (
      padding > 6 ||
      firstPadding % 8 === 0 ||
      !/^=+$/.test(cleaned.slice(firstPadding))
    ) {
      return {
        ok: false,
        output: '',
        error: 'Invalid Base32 input: padding is in the wrong position.',
      };
    }
  }
  const withoutPadding = cleaned.replace(/=+$/, '');
  const remainder = withoutPadding.length % 8;
  if (![0, 2, 4, 5, 7].includes(remainder)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base32 input: invalid encoded length.',
    };
  }
  let bits = '';
  for (const char of withoutPadding) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      return {
        ok: false,
        output: '',
        error: `Invalid Base32 character: "${char}".`,
      };
    }
    bits += value.toString(2).padStart(5, '0');
  }
  const byteCount = Math.floor(bits.length / 8);
  if (byteCount === 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base32 input: too short to decode.',
    };
  }
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  try {
    const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const canonical = base32Encode(output);
    if (!canonical.ok || canonical.output !== cleaned) {
      return {
        ok: false,
        output: '',
        error: 'Invalid Base32 input: non-canonical padding or trailing bits.',
      };
    }
    return { ok: true, output, meta: { bytes: byteCount } };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base32 input: decoded bytes are not valid UTF-8 text.',
    };
  }
}
