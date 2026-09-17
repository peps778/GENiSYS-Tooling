import type { TransformResult } from '../types/decoding';

export interface RotPreset {
  id: string;
  label: string;
  shift: number;
  description: string;
}

export const ROT_PRESETS: RotPreset[] = [
  {
    id: 'rot13',
    label: 'ROT13',
    shift: 13,
    description: 'Classic 13-position alphabet rotation.',
  },
  {
    id: 'rot5',
    label: 'ROT5',
    shift: 5,
    description: 'Rotates digits 0-9 by 5 positions.',
  },
  {
    id: 'rot18',
    label: 'ROT18',
    shift: 18,
    description: 'Combines ROT13 (letters) and ROT5 (digits).',
  },
  {
    id: 'rot47',
    label: 'ROT47',
    shift: 47,
    description: 'Rotates the full printable ASCII range (33-126).',
  },
];

function shiftAlpha(char: string, shift: number): string {
  const isUpper = char >= 'A' && char <= 'Z';
  const isLower = char >= 'a' && char <= 'z';
  if (!isUpper && !isLower) return char;
  const base = isUpper ? 65 : 97;
  const code = char.charCodeAt(0) - base;
  const shifted = (((code + shift) % 26) + 26) % 26;
  return String.fromCharCode(shifted + base);
}

function shiftDigit(char: string, shift: number): string {
  if (char < '0' || char > '9') return char;
  const code = char.charCodeAt(0) - 48;
  const shifted = (((code + shift) % 10) + 10) % 10;
  return String.fromCharCode(shifted + 48);
}

function shiftPrintable(char: string, shift: number): string {
  const code = char.charCodeAt(0);
  if (code < 33 || code > 126) return char;
  const offset = code - 33;
  const shifted = (((offset + shift) % 94) + 94) % 94;
  return String.fromCharCode(shifted + 33);
}

/**
 * Applies a Caesar/ROT style shift.
 * mode "alpha" shifts letters only (standard Caesar/ROT13-style rotation),
 * mode "digit" shifts digits only (ROT5), "alphanumeric" applies both
 * (ROT18-style), and "printable" shifts the full printable ASCII range (ROT47).
 */
export type CaesarMode = 'alpha' | 'digit' | 'alphanumeric' | 'printable';

export function caesarShift(
  input: string,
  shift: number,
  mode: CaesarMode = 'alpha',
): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!Number.isFinite(shift) || !Number.isInteger(shift)) {
    return {
      ok: false,
      output: '',
      error: 'Invalid shift value: must be a whole number.',
    };
  }
  let output = '';
  for (const char of input) {
    switch (mode) {
      case 'alpha':
        output += shiftAlpha(char, shift);
        break;
      case 'digit':
        output += shiftDigit(char, shift);
        break;
      case 'alphanumeric':
        output += shiftDigit(shiftAlpha(char, shift), shift);
        break;
      case 'printable':
        output += shiftPrintable(char, shift);
        break;
    }
  }
  return { ok: true, output };
}

export function modeForPreset(presetId: string): CaesarMode {
  switch (presetId) {
    case 'rot5':
      return 'digit';
    case 'rot18':
      return 'alphanumeric';
    case 'rot47':
      return 'printable';
    default:
      return 'alpha';
  }
}
