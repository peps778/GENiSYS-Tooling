import type { TransformResult } from '../types/reverseEngineering';

function u16(b: Uint8Array, o: number, little = true): number {
  return little ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1];
}
function u32(b: Uint8Array, o: number, little = true): number {
  return little
    ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
    : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}
function hex(n: number, width = 8): string {
  return `0x${n.toString(16).padStart(width, '0')}`;
}

export function parseHeaders(bytes: Uint8Array): TransformResult {
  if (bytes.length < 4)
    return {
      ok: false,
      output: '',
      error: 'Not enough bytes for an executable header.',
    };

  if (
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    if (bytes.length < 20)
      return { ok: false, output: '', error: 'Truncated ELF header.' };
    const className =
      bytes[4] === 1 ? '32-bit' : bytes[4] === 2 ? '64-bit' : 'Unknown';
    const endian =
      bytes[5] === 1
        ? 'little-endian'
        : bytes[5] === 2
          ? 'big-endian'
          : 'unknown';
    const little = bytes[5] !== 2;
    return {
      ok: true,
      output: [
        `Format: ELF`,
        `Class: ${className}`,
        `Endian: ${endian}`,
        `OS ABI: ${bytes[7]}`,
        `Type: ${hex(u16(bytes, 16, little), 4)}`,
        `Machine: ${hex(u16(bytes, 18, little), 4)}`,
      ].join('\n'),
    };
  }

  if (bytes[0] === 0x4d && bytes[1] === 0x5a) {
    if (bytes.length < 0x40)
      return { ok: false, output: '', error: 'Truncated DOS/PE header.' };
    const peOffset = u32(bytes, 0x3c);
    if (
      peOffset + 24 > bytes.length ||
      bytes[peOffset] !== 0x50 ||
      bytes[peOffset + 1] !== 0x45 ||
      bytes[peOffset + 2] !== 0 ||
      bytes[peOffset + 3] !== 0
    ) {
      return {
        ok: true,
        output: 'Format: DOS MZ\nPE signature: not present in supplied bytes.',
      };
    }
    return {
      ok: true,
      output: [
        `Format: PE/COFF`,
        `PE header offset: ${hex(peOffset)}`,
        `Machine: ${hex(u16(bytes, peOffset + 4), 4)}`,
        `Sections: ${u16(bytes, peOffset + 6)}`,
        `Optional header size: ${u16(bytes, peOffset + 20)}`,
      ].join('\n'),
    };
  }

  const magic = u32(bytes, 0, false);
  const macho = new Map<number, string>([
    [0xfeedface, 'Mach-O 32-bit big-endian'],
    [0xcefaedfe, 'Mach-O 32-bit little-endian'],
    [0xfeedfacf, 'Mach-O 64-bit big-endian'],
    [0xcffaedfe, 'Mach-O 64-bit little-endian'],
  ]);
  if (macho.has(magic))
    return {
      ok: true,
      output: `Format: ${macho.get(magic)}\nMagic: ${hex(magic)}`,
    };

  return {
    ok: false,
    output: '',
    error: 'No supported PE, ELF, or Mach-O header was recognized.',
  };
}
