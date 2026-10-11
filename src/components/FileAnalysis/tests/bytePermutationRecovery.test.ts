import { describe, expect, it } from 'vitest';
import { recoverBytePermutations } from '../lib/bytePermutationRecovery';

describe('recoverBytePermutations', () => {
  it('finds a readable candidate when bytes are reversed', () => {
    const clear = new TextEncoder().encode('flag{byte_permutation_test}');
    const reversed = clear.slice().reverse();
    const results = recoverBytePermutations(reversed, 20);
    expect(
      results.some(
        (candidate) =>
          candidate.name === 'Reverse byte order' && candidate.flagLike,
      ),
    ).toBe(true);
  });

  it('limits analysis and result count for large inputs', () => {
    const results = recoverBytePermutations(
      new Uint8Array(100_000).fill(65),
      3,
    );
    expect(results.length).toBeLessThanOrEqual(3);
    expect(
      results.every((candidate) => candidate.bytes.length === 65_536),
    ).toBe(true);
  });

  it('handles empty and one-byte inputs', () => {
    expect(recoverBytePermutations(new Uint8Array())).toEqual([]);
    expect(recoverBytePermutations(new Uint8Array([65]))).toEqual([]);
  });
});
