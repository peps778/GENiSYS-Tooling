import { describe, it, expect } from 'vitest';
import {
  readHexRange,
  formatOffset,
  parseOffsetInput,
  searchAscii,
  searchHex,
} from '../lib/hexReader';

describe('readHexRange', () => {
  it('formats bytes as uppercase hex pairs and ASCII representation', () => {
    const data = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    ]);
    const result = readHexRange(data, 0, data.length, 16);
    expect(result.rows[0].hex).toEqual([
      'FF',
      'D8',
      'FF',
      'E0',
      '00',
      '10',
      '4A',
      '46',
      '49',
      '46',
    ]);
    expect(result.rows[0].ascii).toBe('......JFIF');
  });

  it('reports correct row offsets across multiple rows', () => {
    const data = new Uint8Array(40);
    for (let i = 0; i < 40; i++) data[i] = i;
    const result = readHexRange(data, 0, 40, 16);
    expect(result.rows.map((r) => r.offset)).toEqual([0, 16, 32]);
  });

  it('clamps the range to buffer boundaries', () => {
    const data = new Uint8Array(10);
    const result = readHexRange(data, 5, 100, 16);
    expect(result.endOffset).toBe(10);
    expect(result.rows[0].hex.length).toBe(5);
  });

  it('returns no rows for an empty buffer', () => {
    const result = readHexRange(new Uint8Array(0), 0, 16, 16);
    expect(result.rows.length).toBe(0);
  });

  it('handles a partial final row correctly', () => {
    const data = new Uint8Array(18);
    const result = readHexRange(data, 0, 18, 16);
    expect(result.rows.length).toBe(2);
    expect(result.rows[1].hex.length).toBe(2);
  });
});

describe('formatOffset', () => {
  it('formats an offset as zero-padded 8-digit hex', () => {
    expect(formatOffset(0)).toBe('00000000');
    expect(formatOffset(42)).toBe('0000002A');
  });
});

describe('parseOffsetInput', () => {
  it('parses 0x-prefixed hex', () => {
    expect(parseOffsetInput('0x1A00')).toBe(0x1a00);
  });

  it('parses plain decimal', () => {
    expect(parseOffsetInput('100')).toBe(100);
  });

  it('returns null for invalid input', () => {
    expect(parseOffsetInput('not-a-number')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseOffsetInput('')).toBeNull();
  });
});

describe('searchAscii / searchHex', () => {
  it('finds an ASCII substring at the correct offset', () => {
    const data = new Uint8Array([0, 0, 0x68, 0x69, 0]); // "hi"
    expect(searchAscii(data, 'hi')).toEqual([2]);
  });

  it('finds a hex pattern at the correct offset', () => {
    const data = new Uint8Array([0x00, 0xff, 0xd8, 0xff, 0x00]);
    expect(searchHex(data, 'FF D8 FF')).toEqual([1]);
  });

  it('returns an empty array when there is no match', () => {
    const data = new Uint8Array([1, 2, 3]);
    expect(searchAscii(data, 'zzz')).toEqual([]);
  });
});
