import { describe, it, expect } from 'vitest';
import { isSafeReferenceCommand } from '../lib/commandValidation';
describe('command validation', () => {
  it('accepts documented tools', () =>
    expect(isSafeReferenceCommand('nmap -sV TARGET')).toBe(true));
  it('rejects arbitrary input', () =>
    expect(isSafeReferenceCommand('rm -rf /')).toBe(false));
});
