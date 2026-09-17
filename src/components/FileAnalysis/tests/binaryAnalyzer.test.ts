import { describe, it, expect } from 'vitest';
import { analyzeBinary } from '../lib/binaryAnalyzer';

describe('analyzeBinary', () => {
  it('handles an empty buffer without throwing', () => {
    const stats = analyzeBinary(new Uint8Array(0));
    expect(stats.sizeBytes).toBe(0);
    expect(stats.entropyEstimate).toBe(0);
    expect(stats.printableRatio).toBe(0);
    expect(stats.nullByteRatio).toBe(0);
  });

  it('reports a high null-byte ratio for null-heavy data', () => {
    const data = new Uint8Array(100); // all zero bytes
    const stats = analyzeBinary(data);
    expect(stats.nullByteRatio).toBe(1);
    expect(stats.entropyEstimate).toBe(0); // single symbol => zero entropy
  });

  it('reports a high printable ratio for text data', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    const data = new TextEncoder().encode(text);
    const stats = analyzeBinary(data);
    expect(stats.printableRatio).toBe(1);
  });

  it('computes a plausible entropy value for uniformly random-like byte distribution', () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) data[i] = i; // each byte value exactly once
    const stats = analyzeBinary(data);
    expect(stats.entropyEstimate).toBeCloseTo(8, 1); // maximal entropy for 256 distinct symbols
  });

  it('produces deterministic output for the same input', () => {
    const data = new TextEncoder().encode('deterministic output check 12345');
    const a = analyzeBinary(data);
    const b = analyzeBinary(data);
    expect(a).toEqual(b);
  });

  it('returns byte-frequency statistics sorted by count descending', () => {
    const data = new Uint8Array([0x41, 0x41, 0x41, 0x42]); // 'A' x3, 'B' x1
    const stats = analyzeBinary(data);
    expect(stats.topBytes[0]).toEqual({ byte: 0x41, count: 3 });
  });
});
