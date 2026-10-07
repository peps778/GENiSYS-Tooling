import { describe, expect, it } from 'vitest';
import { identifySignature } from '../tools/fileAnalyzer';
import { parseHeaders } from '../tools/headers';
import { extractStrings } from '../tools/strings';
import { findBytes } from '../tools/patternSearch';

describe('reverse engineering workflow', () => {
  it('keeps independent analysis stages consistent on one target', () => {
    const bytes = Uint8Array.from([0x4d,0x5a,0x00,0x00,72,101,108,108,111,0,0x40,0x00]);
    expect(identifySignature(bytes)?.name).toBe('Windows PE executable');
    expect(extractStrings(bytes, 4).some((item) => item.value === 'Hello')).toBe(true);
    expect(findBytes(bytes, Uint8Array.from([72,101,108,108,111]))).toEqual([4]);
  });
  it('does not execute or mutate target bytes during analysis', () => {
    const bytes = Uint8Array.from([0x7f,0x45,0x4c,0x46,2,1,1,0,0,0,0,0,0,0,0,0,2,0,0x3e,0]);
    const before = bytes.slice();
    parseHeaders(bytes);
    expect(bytes).toEqual(before);
  });
});
