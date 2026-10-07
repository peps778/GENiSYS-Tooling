import { describe, it, expect } from 'vitest';
import { runVirtualShell } from '../lib/virtualShell';

describe('runVirtualShell', () => {
  const ctx = {
    filename: 'challenge.bin',
    data: new TextEncoder().encode('hello FLAG{shell_test}\\nsecret=value'),
  };

  it('supports strings and grep pipelines', async () => {
    const result = await runVirtualShell('strings | grep -i flag', ctx);
    expect(result).toContain('FLAG{shell_test}');
  });

  it('supports file identification without host execution', async () => {
    const result = await runVirtualShell('file challenge.bin', ctx);
    expect(result).toContain('Unknown');
  });

  it('supports bounded hex inspection', async () => {
    const result = await runVirtualShell('xxd -l 8', ctx);
    expect(result).toContain('00000000');
  });
});
