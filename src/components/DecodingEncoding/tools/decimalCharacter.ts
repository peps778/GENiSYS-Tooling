import type { TransformResult } from '../types/decoding';

export function decimalToCharacter(input: string): TransformResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const parts = trimmed.split(/\s+/);
  const codes: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return {
        ok: false,
        output: '',
        error: `Invalid decimal value: "${part}" is not a whole number.`,
      };
    }
    const value = Number(part);
    if (value > 0x10ffff) {
      return {
        ok: false,
        output: '',
        error: `Invalid decimal value: ${value} exceeds the maximum code point.`,
      };
    }
    codes.push(value);
  }
  try {
    return {
      ok: true,
      output: String.fromCodePoint(...codes),
      meta: { characters: codes.length },
    };
  } catch {
    return {
      ok: false,
      output: '',
      error: 'Invalid decimal input: could not convert to characters.',
    };
  }
}

export function characterToDecimal(input: string): TransformResult {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  const codes: number[] = [];
  for (const char of Array.from(input)) {
    const code = char.codePointAt(0);
    if (code === undefined) {
      return {
        ok: false,
        output: '',
        error: 'Invalid character input: could not read code point.',
      };
    }
    codes.push(code);
  }
  return {
    ok: true,
    output: codes.join(' '),
    meta: { characters: codes.length },
  };
}
