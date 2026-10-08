import { describe, expect, it } from 'vitest';
import { extractStrings, stringsTool } from '../tools/strings';

describe('strings extractor', () => {
  it('extracts ASCII strings with offsets', () => {
    const bytes = Uint8Array.from([0, 72, 101, 108, 108, 111, 0]);
    expect(extractStrings(bytes, 4)).toContainEqual({
      offset: 1,
      encoding: 'ASCII',
      value: 'Hello',
    });
  });
  it('extracts UTF-16LE strings', () => {
    const bytes = Uint8Array.from([0x48, 0, 0x69, 0, 0]);
    expect(extractStrings(bytes, 2)).toContainEqual({
      offset: 0,
      encoding: 'UTF-16LE',
      value: 'Hi',
    });
  });
  it('rejects unreasonable minimum length', () =>
    expect(stringsTool(new Uint8Array([1]), 101).ok).toBe(false));
});
