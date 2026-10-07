import type { TransformResult } from '../types/decoding';

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function normalizeBase64(input: string): string | null {
  const compact = input.trim().replace(/[\t\n\r ]+/g, '');
  if (!compact || !BASE64_PATTERN.test(compact)) return null;

  const firstPadding = compact.indexOf('=');
  const body = firstPadding === -1 ? compact : compact.slice(0, firstPadding);
  const padding = firstPadding === -1 ? '' : compact.slice(firstPadding);

  // One Base64 character cannot represent a complete 8-bit byte group.
  if (body.length % 4 === 1) return null;

  // Padding, when supplied, must be exactly what the body length requires.
  const requiredPadding = (4 - (body.length % 4)) % 4;
  if (padding.length > 0 && padding.length !== requiredPadding) return null;

  return body + '='.repeat(requiredPadding);
}

export function base64Encode(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  try {
    const bytes = stringToBytes(input);
    const output = btoa(bytesToBinaryString(bytes));
    return { ok: true, output };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Unable to encode input as Base64.',
    };
  }
}

export function base64Decode(input: string): TransformResult {
  const normalized = normalizeBase64(input);
  if (!normalized) {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base64 input: unexpected characters, length, or padding.',
    };
  }

  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Re-encoding catches non-zero unused trailing bits that permissive atob implementations accept.
    const canonical = btoa(bytesToBinaryString(bytes));
    if (canonical !== normalized) {
      return {
        ok: false,
        output: '',
        error: 'Invalid Base64 input: non-canonical trailing bits.',
      };
    }

    const output = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, output, meta: { bytes: bytes.length } };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Invalid Base64 input: decoded bytes are not valid UTF-8 text.',
    };
  }
}
