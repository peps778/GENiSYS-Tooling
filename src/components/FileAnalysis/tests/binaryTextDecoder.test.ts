import { describe, it, expect } from 'vitest';
import {
  detectAsciiBitstream,
  decodeAsciiBitstream,
} from '../lib/binaryTextDecoder';

function ascii(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('detectAsciiBitstream', () => {
  it('recognizes a pure 0/1 string with length divisible by 8', () => {
    const data = ascii('01000001'); // "A"
    const result = detectAsciiBitstream(data);
    expect(result.isBitstream).toBe(true);
    expect(result.otherCount).toBe(0);
  });

  it('rejects a string containing non-bit characters', () => {
    const data = ascii('0100xxxx');
    const result = detectAsciiBitstream(data);
    expect(result.isBitstream).toBe(false);
    expect(result.otherCount).toBeGreaterThan(0);
  });

  it('rejects a bit count not divisible by 8', () => {
    const data = ascii('0100001'); // 7 bits
    expect(detectAsciiBitstream(data).isBitstream).toBe(false);
  });

  it('tolerates whitespace between groups', () => {
    const data = ascii('01000001 01000010'); // "AB" with a space separator
    const result = detectAsciiBitstream(data);
    expect(result.isBitstream).toBe(true);
    expect(result.whitespaceCount).toBe(1);
  });

  it("rejects normal binary data (not composed solely of '0'/'1' bytes)", () => {
    const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectAsciiBitstream(data).isBitstream).toBe(false);
  });

  it('rejects an empty buffer', () => {
    expect(detectAsciiBitstream(new Uint8Array(0)).isBitstream).toBe(false);
  });
});

describe('decodeAsciiBitstream', () => {
  it('decodes a simple ASCII letter correctly', () => {
    const data = ascii('01000001'); // 'A' = 0x41
    const decoded = decodeAsciiBitstream(data);
    expect(decoded).not.toBeNull();
    expect(Array.from(decoded!)).toEqual([0x41]);
  });

  it('decodes multiple bytes in order', () => {
    const data = ascii('0100000101000010'); // "AB"
    const decoded = decodeAsciiBitstream(data);
    expect(Array.from(decoded!)).toEqual([0x41, 0x42]);
  });

  it('decodes a real JPEG-signature bitstring', () => {
    // FF D8 FF as binary text
    const data = ascii('111111111101100011111111');
    const decoded = decodeAsciiBitstream(data);
    expect(Array.from(decoded!)).toEqual([0xff, 0xd8, 0xff]);
  });

  it('skips whitespace between groups', () => {
    const data = ascii('01000001\n01000010\n');
    const decoded = decodeAsciiBitstream(data);
    expect(Array.from(decoded!)).toEqual([0x41, 0x42]);
  });

  it('returns null for non-bitstream input', () => {
    expect(decodeAsciiBitstream(ascii('hello world'))).toBeNull();
  });

  it("returns null when bit count isn't a multiple of 8", () => {
    expect(decodeAsciiBitstream(ascii('0101'))).toBeNull();
  });

  it('returns null for an empty buffer', () => {
    expect(decodeAsciiBitstream(new Uint8Array(0))).toBeNull();
  });

  it('returns null for ordinary binary data', () => {
    expect(decodeAsciiBitstream(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull();
  });
});
