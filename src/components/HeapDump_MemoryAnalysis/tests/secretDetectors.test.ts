import { describe, expect, it } from 'vitest';
import { detectSecrets, redactValue } from '../lib/secretDetectors';

describe('redactValue', () => {
  it('masks short values entirely', () => {
    expect(redactValue('abcd')).toBe('****');
  });

  it('keeps a few leading/trailing characters for longer values', () => {
    const redacted = redactValue('supersecretvalue123');
    expect(redacted.startsWith('supe')).toBe(true);
    expect(redacted.endsWith('e123')).toBe(true);
    expect(redacted).toContain('*');
  });
});

describe('detectSecrets', () => {
  it('detects an AWS access key id', () => {
    const matches = detectSecrets(['config: AKIAABCDEFGHIJKLMNOP loaded']);
    expect(matches.some((m) => m.type === 'aws_key')).toBe(true);
  });

  it('detects a JWT', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PYU';
    const matches = detectSecrets([`Authorization: Bearer ${jwt}`]);
    expect(matches.some((m) => m.type === 'jwt')).toBe(true);
  });

  it('detects a PEM private key header', () => {
    const matches = detectSecrets([
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----',
    ]);
    expect(matches.some((m) => m.type === 'private_key')).toBe(true);
  });

  it('detects api_key style assignments and captures just the value', () => {
    const matches = detectSecrets([
      'api_key: "sk_live_abcdefghijklmnopqrstuvwx"',
    ]);
    const found = matches.find((m) => m.type === 'api_key');
    expect(found).toBeDefined();
    expect(found?.value).toBe('sk_live_abcdefghijklmnopqrstuvwx');
  });

  it('detects password fields', () => {
    const matches = detectSecrets(['password=Sup3rSecretPass!']);
    expect(matches.some((m) => m.type === 'password')).toBe(true);
  });

  it('detects URLs', () => {
    const matches = detectSecrets([
      'fetch from https://api.example.com/v1/resource?x=1',
    ]);
    expect(matches.some((m) => m.type === 'url')).toBe(true);
  });

  it('detects API endpoint-style paths', () => {
    const matches = detectSecrets([
      'route registered: /api/v1/users/{id}/profile',
    ]);
    expect(matches.some((m) => m.type === 'endpoint')).toBe(true);
  });

  it('detects flag-like CTF values', () => {
    const matches = detectSecrets(['found flag{th1s_is_a_test_flag}']);
    expect(matches.some((m) => m.type === 'flag')).toBe(true);
  });

  it('returns redacted values that never expose the full secret by default', () => {
    const matches = detectSecrets(['password=Sup3rSecretPass!']);
    const found = matches.find((m) => m.type === 'password');
    expect(found?.redacted).not.toBe(found?.value);
    expect(found?.redacted).toContain('*');
  });

  it('does not flag ordinary prose as a secret', () => {
    const matches = detectSecrets([
      'The quick brown fox jumps over the lazy dog.',
    ]);
    expect(matches).toHaveLength(0);
  });

  it('handles an empty string list', () => {
    expect(detectSecrets([])).toEqual([]);
  });

  it('scans multiple strings and tracks the correct source index', () => {
    const matches = detectSecrets(['nothing here', 'password=hunter2222']);
    const found = matches.find((m) => m.type === 'password');
    expect(found?.sourceStringId).toBe(1);
  });
});
