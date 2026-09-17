import { describe, expect, it } from 'vitest';
import { caesarShift, modeForPreset } from '../tools/caesar';

describe('caesar', () => {
  it('applies ROT13 to letters', () => {
    const result = caesarShift('Hello', 13, 'alpha');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('Uryyb');
  });

  it('reverses a shift with a negative value', () => {
    const shifted = caesarShift('Hello', 13, 'alpha');
    const reversed = caesarShift(shifted.output, -13, 'alpha');
    expect(reversed.output).toBe('Hello');
  });

  it('applies ROT5 to digits only', () => {
    const result = caesarShift('Room 42', 5, 'digit');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('Room 97');
  });

  it('maps preset ids to the correct mode', () => {
    expect(modeForPreset('rot13')).toBe('alpha');
    expect(modeForPreset('rot5')).toBe('digit');
    expect(modeForPreset('rot18')).toBe('alphanumeric');
    expect(modeForPreset('rot47')).toBe('printable');
  });

  it('rejects a non-integer shift', () => {
    const result = caesarShift('test', 1.5, 'alpha');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(caesarShift('', 13, 'alpha').ok).toBe(false);
  });
});
