import { describe, expect, it } from 'vitest';
import { entropyTool, shannonEntropy } from '../tools/entropy';

describe('entropy', () => {
  it('returns zero for empty and constant input', () => {
    expect(shannonEntropy(new Uint8Array())).toBe(0);
    expect(shannonEntropy(new Uint8Array(100))).toBe(0);
  });
  it('returns one bit for two equally likely symbols', () => {
    expect(shannonEntropy(Uint8Array.from([0, 1, 0, 1]))).toBeCloseTo(1, 10);
  });
  it('never exceeds eight bits per byte', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(shannonEntropy(bytes)).toBeCloseTo(8, 10);
    expect(entropyTool(bytes).ok).toBe(true);
  });
});
