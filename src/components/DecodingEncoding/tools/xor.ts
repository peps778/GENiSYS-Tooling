import type { TransformResult } from '../types/decoding';

export type XorKeyFormat = 'ascii' | 'hex' | 'binary';
export type XorInputFormat = 'text' | 'hex' | 'binary';
export type XorOutputFormat = 'text' | 'hex' | 'binary';

function parseKeyBytes(key: string, format: XorKeyFormat): Uint8Array | null {
  const trimmed = key.trim();
  if (trimmed.length === 0) return null;

  if (format === 'ascii') {
    return new TextEncoder().encode(key);
  }

  if (format === 'hex') {
    const cleaned = trimmed.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0)
      return null;
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < cleaned.length; i += 2)
      bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
    return bytes;
  }

  // binary
  const cleaned = trimmed.replace(/\s+/g, '');
  if (!/^[01]+$/.test(cleaned) || cleaned.length % 8 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < cleaned.length; i += 8)
    bytes[i / 8] = parseInt(cleaned.slice(i, i + 8), 2);
  return bytes;
}

function parseInputBytes(
  input: string,
  format: XorInputFormat,
): Uint8Array | null {
  if (format === 'text') return new TextEncoder().encode(input);
  if (format === 'hex') {
    const cleaned = input.trim().replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0)
      return null;
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
  const cleaned = input.trim().replace(/\s+/g, '');
  if (!/^[01]+$/.test(cleaned) || cleaned.length % 8 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

function formatOutput(
  bytes: Uint8Array,
  format: XorOutputFormat,
): string | null {
  if (format === 'hex') {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
  }
  if (format === 'binary') {
    return Array.from(bytes)
      .map((b) => b.toString(2).padStart(8, '0'))
      .join(' ');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function xorTransform(
  input: string,
  key: string,
  keyFormat: XorKeyFormat,
  outputFormat: XorOutputFormat,
  inputFormat: XorInputFormat = 'text',
): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (key.trim().length === 0) {
    return { ok: false, output: '', error: 'XOR key is missing.' };
  }

  const keyBytes = parseKeyBytes(key, keyFormat);
  if (!keyBytes || keyBytes.length === 0) {
    return {
      ok: false,
      output: '',
      error: `Invalid XOR key: does not match the selected ${keyFormat} format.`,
    };
  }

  const inputBytes = parseInputBytes(input, inputFormat);
  if (!inputBytes || inputBytes.length === 0) {
    return {
      ok: false,
      output: '',
      error: `Invalid XOR input: does not match the selected ${inputFormat} format.`,
    };
  }
  const resultBytes = new Uint8Array(inputBytes.length);
  for (let i = 0; i < inputBytes.length; i++) {
    resultBytes[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  const output = formatOutput(resultBytes, outputFormat);
  if (output === null) {
    return {
      ok: false,
      output: '',
      error:
        'XOR result is not valid UTF-8 text. Choose Hex or Binary output instead.',
    };
  }

  return {
    ok: true,
    output,
    meta: { bytes: resultBytes.length, keyLength: keyBytes.length },
  };
}
