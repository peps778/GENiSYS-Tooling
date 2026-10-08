import { describe, expect, it } from 'vitest';
import { bytesToAscii, bytesToHex, hexToBytes } from '../tools/bytes';

describe('bytes', () => {
  it('parses spaced and compact hex', () => {
    expect(hexToBytes('48 65 6c 6c 6f').bytes).toEqual(
      Uint8Array.from([72, 101, 108, 108, 111]),
    );
    expect(hexToBytes('48656c6c6f').bytes).toEqual(
      Uint8Array.from([72, 101, 108, 108, 111]),
    );
  });
  it('rejects odd or invalid hex', () => {
    expect(hexToBytes('abc').ok).toBe(false);
    expect(hexToBytes('zz').ok).toBe(false);
  });
  it('renders printable ASCII and dots for non-printable bytes', () => {
    expect(bytesToAscii(Uint8Array.from([0, 65, 255]))).toBe('.A.');
    expect(bytesToHex(Uint8Array.from([0, 255]))).toBe('00 ff');
  });
});
