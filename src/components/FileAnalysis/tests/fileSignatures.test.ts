import { describe, it, expect } from 'vitest';
import { FILE_SIGNATURES } from '../lib/fileSignatures';
import { findSignatureMatches } from '../lib/fileIdentifier';

function buf(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

describe('fileSignatures database', () => {
  it('contains an entry for every required baseline format', () => {
    const formats = FILE_SIGNATURES.map((s) => s.format);
    const required = [
      'JPEG image',
      'PNG image',
      'GIF image',
      'PDF document',
      'ZIP archive',
      'GZIP compressed data',
      'ELF binary',
      'PE/Windows executable',
      'SQLite database',
    ];
    for (const name of required) {
      expect(formats).toContain(name);
    }
  });

  it('matches a known signature at offset zero', () => {
    const data = buf([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const matches = findSignatureMatches(data);
    expect(
      matches.some((m) => m.format === 'PNG image' && m.offset === 0),
    ).toBe(true);
  });

  it('does not match signatures at non-zero offsets for offset-anchored formats', () => {
    const data = buf([0, 0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const matches = findSignatureMatches(data);
    expect(matches.some((m) => m.format === 'PNG image')).toBe(false);
  });

  it('returns no matches for unknown/random binary data', () => {
    const data = buf([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
    const matches = findSignatureMatches(data);
    expect(matches.length).toBe(0);
  });
});
