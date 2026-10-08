import { describe, expect, it } from 'vitest';
import { byteFrequency } from '../tools/byteFrequency';

describe('byte frequency', () => {
  it('counts repeated bytes and reports percentages', () => {
    const result = byteFrequency(Uint8Array.from([0, 0, 0, 1]));
    expect(result.output).toContain('00');
    expect(result.output).toContain('75.000%');
    expect(result.output).toContain('01');
  });
  it('handles empty input', () =>
    expect(byteFrequency(new Uint8Array()).output).toContain('No bytes'));
});
