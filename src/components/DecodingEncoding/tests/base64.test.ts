import { describe, expect, it } from 'vitest';
import { base64Decode, base64Encode } from '../tools/base64';

describe('base64', () => {
  it('encodes plain text', () => {
    const result = base64Encode('hello world');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('aGVsbG8gd29ybGQ=');
  });

  it('decodes valid base64', () => {
    const result = base64Decode('aGVsbG8gd29ybGQ=');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('hello world');
  });

  it('decodes valid unpadded Base64', () => {
    const input = 'YWNhZGVteXtwdXp6bDNkX20zdGFkYXRhX2YwdW5kIV85ZDNjYzY2OX0';
    const result = base64Decode(input);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('academy{puzzl3d_m3tadata_f0und!_9d3cc669}');
  });

  it('accepts both padded and unpadded forms of the same payload', () => {
    expect(base64Decode('aGVsbG8').output).toBe('hello');
    expect(base64Decode('aGVsbG8=').output).toBe('hello');
  });

  it('rejects invalid base64 characters', () => {
    const result = base64Decode('not_valid_base64!!');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('rejects an impossible unpadded length', () => {
    expect(base64Decode('A').ok).toBe(false);
    expect(base64Decode('ABCDE').ok).toBe(false);
  });

  it('rejects incorrect explicit padding', () => {
    expect(base64Decode('aGVsbG8==').ok).toBe(false);
    expect(base64Decode('aGVsbG8===').ok).toBe(false);
  });

  it('rejects valid Base64 whose decoded bytes are not UTF-8 text', () => {
    const result = base64Decode('/w==');
    expect(result.ok).toBe(false);
  });

  it('rejects empty input', () => {
    expect(base64Encode('').ok).toBe(false);
    expect(base64Decode('').ok).toBe(false);
  });

  it('round-trips unicode text', () => {
    const encoded = base64Encode('héllo 🌍');
    expect(encoded.ok).toBe(true);
    const decoded = base64Decode(encoded.output);
    expect(decoded.ok).toBe(true);
    expect(decoded.output).toBe('héllo 🌍');
  });
});
