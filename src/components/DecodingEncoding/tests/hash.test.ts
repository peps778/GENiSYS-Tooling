import { describe, expect, it } from 'vitest';
import { hashText } from '../tools/hash';

describe('hash', () => {
  it('calculates the standard MD5 digest', async () => {
    const result = await hashText('hello', 'MD5');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('calculates SHA-256 using Web Crypto', async () => {
    const result = await hashText('hello', 'SHA-256');
    expect(result.ok).toBe(true);
    expect(result.output).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('calculates CRC32 independently of Web Crypto', async () => {
    const result = await hashText('hello', 'CRC32');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('3610a686');
  });

  it('supports Unicode through UTF-8 bytes', async () => {
    const result = await hashText('héllo 🌍', 'MD5');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('a4115cc10566f0181d01df50100b37ff');
  });

  it('rejects empty input', async () => {
    expect((await hashText('', 'SHA-256')).ok).toBe(false);
  });
});
