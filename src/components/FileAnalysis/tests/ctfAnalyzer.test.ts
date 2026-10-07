import { describe, it, expect } from 'vitest';
import { analyzeCtfContent } from '../lib/ctfAnalyzer';

describe('analyzeCtfContent', () => {
  it('finds a common CTF flag-shaped token', () => {
    const data = new TextEncoder().encode('hello FLAG{browser_ctf_123} world');
    const result = analyzeCtfContent(data, null, []);
    expect(
      result.findings.some(
        (f) =>
          f.category === 'flag' && /FLAG\{browser_ctf_123\}/i.test(f.value),
      ),
    ).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('finds network and credential-like indicators', () => {
    const data = new TextEncoder().encode(
      'password=letmein123 https://10.10.10.5:8080/api',
    );
    const result = analyzeCtfContent(data, null, []);
    expect(result.findings.some((f) => f.category === 'credential')).toBe(true);
    expect(result.findings.some((f) => f.category === 'network')).toBe(true);
  });

  it('does not require a known file format', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const result = analyzeCtfContent(data, null, []);
    expect(result.findings).toBeDefined();
    expect(result.recommendedCommands.length).toBeGreaterThan(0);
  });
});
