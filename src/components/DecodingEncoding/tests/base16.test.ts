import { describe, expect, it } from 'vitest';
import { base16Decode, base16Encode } from '../tools/base16';

describe('base16', () => {
  it('encodes plain text', () => {
    const result = base16Encode('AB');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('4142');
  });

  it('decodes valid hex', () => {
    const result = base16Decode('4142');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('AB');
  });

  it('rejects odd-length hex', () => {
    const result = base16Decode('414');
    expect(result.ok).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const result = base16Decode('41ZZ');
    expect(result.ok).toBe(false);
  });
});
