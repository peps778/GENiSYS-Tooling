import { describe, expect, it } from 'vitest';
import { base64Decode } from '../tools/base64';
import { detectFormats } from '../tools/formatDetector';

describe('Base64 detection and decoding workflow', () => {
  it('detects and decodes the same unpadded Base64 value used by the UI', () => {
    const input = 'YWNhZGVteXtwdXp6bDNkX20zdGFkYXRhX2YwdW5kIV85ZDNjYzY2OX0';
    const candidates = detectFormats(input);
    const top = candidates[0];

    expect(top?.toolId).toBe('base64');
    expect(top?.suggestedMode).toBe('decode');

    const decoded = base64Decode(input);
    expect(decoded.ok).toBe(true);
    expect(decoded.output).toBe('academy{puzzl3d_m3tadata_f0und!_9d3cc669}');
  });

  it('keeps invalid Base64 out of both detection and decoding', () => {
    const input = 'ABCDE';
    expect(base64Decode(input).ok).toBe(false);
    expect(
      detectFormats(input).some((candidate) => candidate.toolId === 'base64'),
    ).toBe(false);
  });
});
