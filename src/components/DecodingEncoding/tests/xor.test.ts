import { describe, expect, it } from 'vitest';
import { xorTransform } from '../tools/xor';

describe('xor', () => {
  it('performs repeating-key XOR with an ASCII key, output as hex', () => {
    const result = xorTransform('Hi', 'K', 'ascii', 'hex');
    expect(result.ok).toBe(true);
    // 'H' (0x48) ^ 'K' (0x4B) = 0x03, 'i' (0x69) ^ 'K' (0x4B) = 0x22
    expect(result.output).toBe('03 22');
  });

  it('round-trips text output when key format is ascii', () => {
    const encoded = xorTransform('secret', 'key', 'ascii', 'hex');
    expect(encoded.ok).toBe(true);
  });

  it('rejects a missing key', () => {
    const result = xorTransform('data', '', 'ascii', 'text');
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed hex key', () => {
    const result = xorTransform('data', 'zz', 'hex', 'text');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    const result = xorTransform('', 'key', 'ascii', 'text');
    expect(result.ok).toBe(false);
  });
});
