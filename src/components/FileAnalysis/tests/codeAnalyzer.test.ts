import { describe, expect, it } from 'vitest';
import { analyzeCode } from '../lib/codeAnalyzer';

describe('analyzeCode', () => {
  it('identifies shifts and byte remapping candidates in JavaScript', () => {
    const result = analyzeCode(
      'const b = (data[i] << 2) & 255;\nout[i ^ 3] = data[i];',
      'decode.js',
    );
    expect(result.language).toBe('javascript');
    expect(result.findings.some((f) => f.id.startsWith('shift:'))).toBe(true);
    expect(result.permutationCandidates.length).toBeGreaterThan(0);
  });

  it('identifies Python byte conversion and XOR patterns', () => {
    const result = analyzeCode(
      'out = bytes((b ^ key) for b in data)\nvalue = (x >> 3) & 255',
      'solve.py',
    );
    expect(result.language).toBe('python');
    expect(result.findings.some((f) => f.id.startsWith('xor:'))).toBe(true);
    expect(result.findings.some((f) => f.id.startsWith('shift:'))).toBe(true);
  });

  it('does not execute source code', () => {
    const result = analyzeCode('eval(payload)', 'sample.php');
    expect(
      result.findings.some((f) => f.id.startsWith('dynamic-execution:')),
    ).toBe(true);
  });
});
