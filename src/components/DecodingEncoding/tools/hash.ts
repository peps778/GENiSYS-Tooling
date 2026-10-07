import type { TransformResult } from '../types/decoding';

export type HashAlgorithm =
  'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'CRC32';

export const HASH_ALGORITHMS: Array<{
  id: HashAlgorithm;
  label: string;
  description: string;
}> = [
  {
    id: 'MD5',
    label: 'MD5',
    description:
      '128-bit message digest; useful for identification and legacy compatibility, not security.',
  },
  {
    id: 'SHA-1',
    label: 'SHA-1',
    description:
      '160-bit digest; legacy only and not suitable for collision-resistant security.',
  },
  {
    id: 'SHA-256',
    label: 'SHA-256',
    description:
      '256-bit SHA-2 digest; common general-purpose cryptographic hash.',
  },
  { id: 'SHA-384', label: 'SHA-384', description: '384-bit SHA-2 digest.' },
  { id: 'SHA-512', label: 'SHA-512', description: '512-bit SHA-2 digest.' },
  {
    id: 'CRC32',
    label: 'CRC32',
    description: '32-bit error-detection checksum; not a cryptographic hash.',
  },
];

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function add32(a: number, b: number): number {
  return (a + b) | 0;
}

function rotl(value: number, amount: number): number {
  return (value << amount) | (value >>> (32 - amount));
}

function md5(input: Uint8Array): Uint8Array {
  const bitLength = input.length * 8;
  const paddedLength = (((input.length + 8) >>> 6) + 1) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;

  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

  let a0 = 0x67452301 | 0;
  let b0 = 0xefcdab89 | 0;
  let c0 = 0x98badcfe | 0;
  let d0 = 0x10325476 | 0;

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];

  const k = Array.from(
    { length: 64 },
    (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0,
  );

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const m = new Int32Array(16);
    for (let i = 0; i < 16; i++) m[i] = view.getInt32(offset + i * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const next = d;
      d = c;
      c = b;
      b = add32(b, rotl(add32(add32(add32(a, f), k[i]), m[g]), s[i]));
      a = next;
    }

    a0 = add32(a0, a);
    b0 = add32(b0, b);
    c0 = add32(c0, c);
    d0 = add32(d0, d);
  }

  const digest = new Uint8Array(16);
  const output = new DataView(digest.buffer);
  output.setInt32(0, a0, true);
  output.setInt32(4, b0, true);
  output.setInt32(8, c0, true);
  output.setInt32(12, d0, true);
  return digest;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(input: Uint8Array): Uint8Array {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  const value = (crc ^ 0xffffffff) >>> 0;
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

export async function hashText(
  input: string,
  algorithm: HashAlgorithm,
): Promise<TransformResult> {
  if (input.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }

  const bytes = new TextEncoder().encode(input);

  try {
    if (algorithm === 'MD5') {
      return {
        ok: true,
        output: toHex(md5(bytes)),
        meta: { bytes: bytes.length, algorithm },
      };
    }

    if (algorithm === 'CRC32') {
      return {
        ok: true,
        output: toHex(crc32(bytes)),
        meta: { bytes: bytes.length, algorithm },
      };
    }

    const supported: Record<
      Exclude<HashAlgorithm, 'MD5' | 'CRC32'>,
      AlgorithmIdentifier
    > = {
      'SHA-1': 'SHA-1',
      'SHA-256': 'SHA-256',
      'SHA-384': 'SHA-384',
      'SHA-512': 'SHA-512',
    };

    const digest = await crypto.subtle.digest(supported[algorithm], bytes);
    return {
      ok: true,
      output: toHex(new Uint8Array(digest)),
      meta: { bytes: bytes.length, algorithm },
    };
  } catch {
    return {
      ok: false,
      output: '',
      error: `Unable to calculate ${algorithm}.`,
    };
  }
}
