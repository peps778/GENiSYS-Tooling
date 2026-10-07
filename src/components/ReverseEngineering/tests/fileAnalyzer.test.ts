import { describe, expect, it } from 'vitest';
import { analyzeFile, identifySignature } from '../tools/fileAnalyzer';

describe('file analyzer', () => {
  it('identifies deterministic magic bytes', () => {
    expect(identifySignature(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))?.name).toBe('PNG image');
    expect(identifySignature(Uint8Array.from([0x7f,0x45,0x4c,0x46]))?.name).toContain('ELF');
  });
  it('does not guess unknown files', () => {
    expect(identifySignature(Uint8Array.from([1,2,3,4]))).toBeNull();
  });
  it('includes file metadata', () => {
    const result = analyzeFile('test.bin', Uint8Array.from([1,2,3]));
    expect(result.ok).toBe(true);
    expect(result.output).toContain('test.bin');
    expect(result.output).toContain('3 bytes');
  });
});
