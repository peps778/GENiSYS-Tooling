import { describe, it, expect } from 'vitest';
import { extractStrings } from '../lib/stringExtractor';

function asciiBuf(...parts: (string | number[])[]): Uint8Array {
  const bytes: number[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      for (let i = 0; i < part.length; i++) bytes.push(part.charCodeAt(i));
    } else {
      bytes.push(...part);
    }
  }
  return new Uint8Array(bytes);
}

describe('extractStrings (ASCII)', () => {
  it('extracts a single printable ASCII string', () => {
    const data = asciiBuf('password');
    const result = extractStrings(data, { minLength: 4 });
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].value).toBe('password');
    expect(result.matches[0].offset).toBe(0);
  });

  it('respects the minimum length option', () => {
    const data = asciiBuf('ab', [0], 'cdef');
    const result = extractStrings(data, { minLength: 4 });
    expect(result.matches.map((m) => m.value)).toEqual(['cdef']);
  });

  it('extracts multiple strings with correct offsets', () => {
    const data = asciiBuf('hello', [0, 0], 'world!');
    const result = extractStrings(data, { minLength: 4 });
    expect(result.matches.length).toBe(2);
    expect(result.matches[0]).toMatchObject({
      value: 'hello',
      offset: 0,
      length: 5,
    });
    expect(result.matches[1]).toMatchObject({
      value: 'world!',
      offset: 7,
      length: 6,
    });
  });

  it('ignores binary noise below the minimum length', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x41, 0x42, 0x00, 0xff]);
    const result = extractStrings(data, { minLength: 4 });
    expect(result.matches.length).toBe(0);
  });

  it('returns no matches for empty data', () => {
    const result = extractStrings(new Uint8Array(0));
    expect(result.matches.length).toBe(0);
    expect(result.totalFound).toBe(0);
  });

  it('handles one long printable sequence spanning the whole buffer', () => {
    const long = 'x'.repeat(500);
    const data = asciiBuf(long);
    const result = extractStrings(data, { minLength: 4 });
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].length).toBe(500);
  });

  it('truncates results beyond maxMatches while reporting the true total', () => {
    const parts: string[] = [];
    for (let i = 0; i < 20; i++) parts.push(`str${i}`, '\u0000');
    const data = asciiBuf(...parts);
    const result = extractStrings(data, { minLength: 4, maxMatches: 5 });
    expect(result.matches.length).toBe(5);
    expect(result.totalFound).toBe(20);
    expect(result.truncated).toBe(true);
  });
});
