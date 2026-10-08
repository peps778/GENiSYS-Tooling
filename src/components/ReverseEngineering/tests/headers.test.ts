import { describe, expect, it } from 'vitest';
import { parseHeaders } from '../tools/headers';

describe('executable headers', () => {
  it('parses ELF class, endian and machine', () => {
    const bytes = Uint8Array.from([
      0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0x3e, 0,
    ]);
    const result = parseHeaders(bytes);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('ELF');
    expect(result.output).toContain('64-bit');
    expect(result.output).toContain('little-endian');
  });
  it('parses a PE offset when the PE signature is present', () => {
    const bytes = new Uint8Array(0x80);
    bytes[0] = 0x4d;
    bytes[1] = 0x5a;
    bytes[0x3c] = 0x40;
    bytes[0x40] = 0x50;
    bytes[0x41] = 0x45;
    const result = parseHeaders(bytes);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('PE/COFF');
  });
  it('rejects unrelated data', () =>
    expect(parseHeaders(Uint8Array.from([1, 2, 3, 4])).ok).toBe(false));
});
