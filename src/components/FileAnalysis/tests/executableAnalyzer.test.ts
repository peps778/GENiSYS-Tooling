import { describe, it, expect } from 'vitest';
import { analyzeExecutable } from '../lib/executableAnalyzer';

describe('analyzeExecutable', () => {
  it('recognizes an ELF header and architecture', () => {
    const data = new Uint8Array(64);
    data.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0], 0);
    data[18] = 0x3e; // x86-64
    const result = analyzeExecutable(data);
    expect(result.format).toBe('ELF');
    expect(result.architecture).toBe('x86-64');
    expect(result.bits).toBe(64);
  });

  it('recognizes a PE header', () => {
    const data = new Uint8Array(256);
    data[0] = 0x4d;
    data[1] = 0x5a;
    data[0x3c] = 0x80;
    data[0x80] = 0x50;
    data[0x81] = 0x45;
    data[0x82] = 0;
    data[0x83] = 0;
    data[0x84] = 0x64;
    data[0x85] = 0x86; // x86-64
    data[0x94] = 0xf0;
    data[0x95] = 0x00; // optional header size at COFF +16
    data[0x98] = 0x0b;
    data[0x99] = 0x02; // PE32+ magic (offset 0x98)
    const result = analyzeExecutable(data);
    expect(result.format).toBe('PE');
    expect(result.architecture).toBe('x86-64');
  });

  it('recognizes a tiny x86 instruction stream when mapped', () => {
    const data = new Uint8Array([
      0x7f,
      0x45,
      0x4c,
      0x46,
      1,
      1,
      1,
      0,
      ...new Array(64).fill(0),
    ]);
    data[18] = 3;
    const result = analyzeExecutable(data);
    expect(result.format).toBe('ELF');
    expect(result.instructions).toBeDefined();
  });
});
