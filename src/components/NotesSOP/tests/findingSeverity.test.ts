import { describe, expect, it } from 'vitest';
import { inferConfidence } from '../lib/findingSeverity';

describe('finding confidence', () => {
  it('returns low when there is no observation', () => {
    expect(
      inferConfidence({
        observation: '',
        interpretation: '',
        evidenceType: '',
      }),
    ).toBe('low');
  });

  it('recognizes confirmed evidence', () => {
    expect(
      inferConfidence({
        observation: 'valid file',
        interpretation: 'confirmed',
        evidenceType: 'hash',
      }),
    ).toBe('confirmed');
  });

  it('recognizes candidate evidence', () => {
    expect(
      inferConfidence({
        observation: 'possible clue',
        interpretation: 'suspected',
        evidenceType: 'string',
      }),
    ).toBe('medium');
  });
});
