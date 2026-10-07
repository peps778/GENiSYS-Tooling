import { describe, expect, it } from 'vitest';
import { xorTransform } from '../tools/xor';

describe('xor', () => {
  it('performs repeating-key XOR with an ASCII key, output as hex', () => {
    const result = xorTransform('Hi', 'K', 'ascii', 'hex');
    expect(result.ok).toBe(true);
    // 'H' (0x48) ^ 'K' (0x4B) = 0x03, 'i' (0x69) ^ 'K' (0x4B) = 0x22
    expect(result.output).toBe('03 22');
  });

  it('can consume hex input and emit text', () => {
    const encoded = xorTransform(
      '1B 0E 0B 0F 0E 1F',
      'K',
      'ascii',
      'text',
      'hex',
    );
    expect(encoded.ok).toBe(true);
    expect(encoded.output).toBe('PE@DET');
  });

  it('can consume binary input', () => {
    const result = xorTransform(
      '00000011 00100010',
      'K',
      'ascii',
      'hex',
      'binary',
    );
    expect(result.ok).toBe(true);
    expect(result.output).toBe('48 69');
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
