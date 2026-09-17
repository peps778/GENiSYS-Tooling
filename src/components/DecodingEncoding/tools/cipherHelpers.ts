import type { TransformResult } from '../types/decoding';

/**
 * Lightweight, modular classical-cipher helpers. Add new helpers here without
 * touching the page component — register them in CIPHER_HELPERS below.
 */

function atbash(input: string): string {
  let output = '';
  for (const char of input) {
    if (char >= 'A' && char <= 'Z') {
      output += String.fromCharCode(90 - (char.charCodeAt(0) - 65));
    } else if (char >= 'a' && char <= 'z') {
      output += String.fromCharCode(122 - (char.charCodeAt(0) - 97));
    } else {
      output += char;
    }
  }
  return output;
}

function reverseText(input: string): string {
  return Array.from(input).reverse().join('');
}

function swapCase(input: string): string {
  let output = '';
  for (const char of input) {
    if (char >= 'A' && char <= 'Z') output += char.toLowerCase();
    else if (char >= 'a' && char <= 'z') output += char.toUpperCase();
    else output += char;
  }
  return output;
}

export interface CipherHelper {
  id: string;
  label: string;
  description: string;
  apply: (input: string) => string;
}

export const CIPHER_HELPERS: CipherHelper[] = [
  {
    id: 'atbash',
    label: 'Atbash',
    description: 'Mirrors each letter across the alphabet (A↔Z, B↔Y, ...).',
    apply: atbash,
  },
  {
    id: 'reverse',
    label: 'Reverse',
    description: 'Reverses the character order of the input.',
    apply: reverseText,
  },
  {
    id: 'swap-case',
    label: 'Swap Case',
    description: 'Toggles upper/lower case for every letter.',
    apply: swapCase,
  },
];

export function runCipherHelper(id: string, input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const helper = CIPHER_HELPERS.find((h) => h.id === id);
  if (!helper) {
    return { ok: false, output: '', error: `Unknown cipher helper: "${id}".` };
  }
  return { ok: true, output: helper.apply(input) };
}
