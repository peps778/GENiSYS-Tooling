import { describe, expect, it } from 'vitest';
import { hexView, renderHex } from '../tools/hexViewer';

describe('hex viewer', () => {
  it('renders offsets, bytes and ASCII', () => {
    const result = hexView('48 65 6C 6C 6F');
    expect(result.ok).toBe(true);
    expect(result.output).toContain('00000000');
    expect(result.output).toContain('Hello');
  });
  it('wraps at 16 bytes', () => {
    const bytes = Uint8Array.from({ length: 17 }, (_, i) => i);
    expect(renderHex(bytes).split('\n')).toHaveLength(2);
  });
  it('rejects malformed input', () => expect(hexView('0xZZ').ok).toBe(false));
});
