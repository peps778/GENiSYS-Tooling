import type { TransformResult } from '../types/decoding';

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return binary;
}

export function base64Encode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  try {
    const bytes = stringToBytes(input);
    const output = btoa(bytesToBinaryString(bytes));
    return { ok: true, output };
  } catch (err) {
    return {
      ok: false,
      output: '',
      error: 'Unable to encode input as Base64.',
    };
  }
}

export function base64Decode(input: string): TransformResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const cleaned = trimmed.replace(/\s+/g, '');
  if (cleaned.length % 4 !== 0 || !BASE64_PATTERN.test(cleaned)) {
    return {
      ok: false,
      output: '',
      error:
        'Invalid Base64 input: unexpected characters or incorrect padding length.',
    };
  }
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const output = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { ok: true, output, meta: { bytes: bytes.length } };
  } catch (err) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base64 input: could not decode.',
    };
  }
}
