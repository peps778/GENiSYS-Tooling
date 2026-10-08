import { describe, expect, it } from 'vitest';
import { findBytes, searchHexPattern } from '../tools/patternSearch';

describe('pattern search', () => {
  it('finds overlapping matches', () => {
    expect(
      findBytes(Uint8Array.from([1, 1, 1]), Uint8Array.from([1, 1])),
    ).toEqual([0, 1]);
  });
  it('finds all exact hexadecimal occurrences', () => {
    const result = searchHexPattern(
      '48 65 6C 6C 6F 20 48 65 6C 6C 6F',
      '48 65 6C 6C 6F',
    );
    expect(result.ok).toBe(true);
    expect(result.output).toContain('0x00000000');
    expect(result.output).toContain('0x00000006');
  });
  it('returns no match instead of guessing', () => {
    const result = searchHexPattern('00 01 02', 'FF');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('No matches found.');
  });
});
