import { describe, expect, it } from 'vitest';
import { detectFormats } from '../tools/formatDetector';

function ids(value: string): string[] {
  return detectFormats(value).map((candidate) => candidate.toolId);
}

describe('formatDetector', () => {
  it('ranks a canonical Base64 value above weaker guesses', () => {
    const candidates = detectFormats('aGVsbG8gd29ybGQ=');
    expect(candidates[0].toolId).toBe('base64');
    expect(candidates[0].confidence).toBeGreaterThan(0.8);
  });

  it('detects unpadded Base64 from a real-world payload', () => {
    const input = 'YWNhZGVteXtwdXp6bDNkX20zdGFkYXRhX2YwdW5kIV85ZDNjYzY2OX0';
    const candidates = detectFormats(input);
    expect(candidates[0].toolId).toBe('base64');
    expect(candidates[0].suggestedMode).toBe('decode');
  });

  it('detects Base32 only when the RFC 4648 round-trip is valid', () => {
    const candidates = detectFormats('NBSWY3DP');
    expect(candidates[0].toolId).toBe('base32');
    expect(candidates[0].confidence).toBeGreaterThan(0.8);
  });

  it('detects a deterministic PNG signature above generic hex', () => {
    const candidates = detectFormats('89 50 4E 47 0D 0A 1A 0A');
    expect(candidates[0].toolId).toBe('file-signature');
    expect(candidates[0].confidence).toBeGreaterThan(0.95);
  });

  it('detects URL encoding only for valid percent sequences', () => {
    expect(ids('a%20b%26c%3Dd')).toContain('url');
    expect(ids('100% off%')).not.toContain('url');
  });

  it('detects binary when bytes decode to useful UTF-8 text', () => {
    const candidates = detectFormats('01001000 01101001');
    expect(candidates.some((c) => c.toolId === 'binary')).toBe(true);
  });

  it('detects decimal Unicode code points', () => {
    expect(ids('65 66 67')).toContain('decimal-character');
  });

  it('identifies a 32-character hexadecimal digest without claiming certainty', () => {
    const candidates = detectFormats('5d41402abc4b2a76b9719d911017c592');
    const hash = candidates.find((c) => c.toolId === 'hash-identifier');
    expect(hash).toBeDefined();
    expect(hash?.confidence).toBeLessThan(1);
  });

  it('suggests ROT13 only when the decoded text is substantially more English-like', () => {
    const candidates = detectFormats('Uryyb jbeyq, guvf vf n grfg zrffntr');
    const caesar = candidates.find((c) => c.toolId === 'caesar');
    expect(caesar).toBeDefined();
    expect(caesar?.suggestedShift).toBe(13);
  });

  it('does not call ordinary readable text Base64', () => {
    expect(ids('this is ordinary readable text')).not.toContain('base64');
  });

  it('does not call arbitrary hexadecimal a file signature', () => {
    expect(ids('deadbeef')).not.toContain('file-signature');
  });

  it('returns no candidates for empty input', () => {
    expect(detectFormats('')).toEqual([]);
    expect(detectFormats('   ')).toEqual([]);
  });

  it('never returns more than six ranked candidates', () => {
    expect(detectFormats('48656c6c6f20776f726c64').length).toBeLessThanOrEqual(
      6,
    );
  });
});
