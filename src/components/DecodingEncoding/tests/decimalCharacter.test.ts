import { describe, expect, it } from 'vitest';
import {
  characterToDecimal,
  decimalToCharacter,
} from '../tools/decimalCharacter';

describe('decimalCharacter', () => {
  it('converts decimal values to characters', () => {
    const result = decimalToCharacter('65 66 67');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('ABC');
  });

  it('converts characters to decimal values', () => {
    const result = characterToDecimal('ABC');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('65 66 67');
  });

  it('rejects non-numeric decimal input', () => {
    const result = decimalToCharacter('65 six 67');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(decimalToCharacter('').ok).toBe(false);
    expect(characterToDecimal('').ok).toBe(false);
  });
});
