import type { TransformResult } from '../types/decoding';

export interface FileSignatureDefinition {
  name: string;
  mime: string;
  extension: string;
  offset: number;
  signature: number[];
  /** Optional wildcard positions within `signature` (value -1 means "any byte"). */
}

/**
 * A small, extensible table of common magic-byte signatures. Detection is
 * based purely on these bytes — never on the filename or its extension.
 */
export const FILE_SIGNATURES: FileSignatureDefinition[] = [
  {
    name: 'PNG Image',
    mime: 'image/png',
    extension: '.png',
    offset: 0,
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    name: 'JPEG Image',
    mime: 'image/jpeg',
    extension: '.jpg',
    offset: 0,
    signature: [0xff, 0xd8, 0xff],
  },
  {
    name: 'GIF Image (87a)',
    mime: 'image/gif',
    extension: '.gif',
    offset: 0,
    signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  },
  {
    name: 'GIF Image (89a)',
    mime: 'image/gif',
    extension: '.gif',
    offset: 0,
    signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  },
  {
    name: 'PDF Document',
    mime: 'application/pdf',
    extension: '.pdf',
    offset: 0,
    signature: [0x25, 0x50, 0x44, 0x46],
  },
  {
    name: 'ZIP Archive',
    mime: 'application/zip',
    extension: '.zip',
    offset: 0,
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  {
    name: 'ZIP Archive (empty)',
    mime: 'application/zip',
    extension: '.zip',
    offset: 0,
    signature: [0x50, 0x4b, 0x05, 0x06],
  },
  {
    name: 'GZIP Archive',
    mime: 'application/gzip',
    extension: '.gz',
    offset: 0,
    signature: [0x1f, 0x8b],
  },
  {
    name: 'RAR Archive (v1.5+)',
    mime: 'application/x-rar-compressed',
    extension: '.rar',
    offset: 0,
    signature: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00],
  },
  {
    name: '7-Zip Archive',
    mime: 'application/x-7z-compressed',
    extension: '.7z',
    offset: 0,
    signature: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],
  },
  {
    name: 'ELF Executable',
    mime: 'application/x-elf',
    extension: '.elf',
    offset: 0,
    signature: [0x7f, 0x45, 0x4c, 0x46],
  },
  {
    name: 'Windows PE / EXE',
    mime: 'application/x-msdownload',
    extension: '.exe',
    offset: 0,
    signature: [0x4d, 0x5a],
  },
  {
    name: 'BMP Image',
    mime: 'image/bmp',
    extension: '.bmp',
    offset: 0,
    signature: [0x42, 0x4d],
  },
  {
    name: 'WAV Audio',
    mime: 'audio/wav',
    extension: '.wav',
    offset: 8,
    signature: [0x57, 0x41, 0x56, 0x45],
  },
  {
    name: 'MP3 Audio (ID3)',
    mime: 'audio/mpeg',
    extension: '.mp3',
    offset: 0,
    signature: [0x49, 0x44, 0x33],
  },
  {
    name: 'OGG Container',
    mime: 'application/ogg',
    extension: '.ogg',
    offset: 0,
    signature: [0x4f, 0x67, 0x67, 0x53],
  },
  {
    name: 'SQLite Database',
    mime: 'application/vnd.sqlite3',
    extension: '.sqlite',
    offset: 0,
    signature: [
      0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61,
      0x74, 0x20, 0x33, 0x00,
    ],
  },
];

export interface FileSignatureMatch {
  definition: FileSignatureDefinition;
}

export function matchFileSignature(
  bytes: Uint8Array,
): FileSignatureMatch | null {
  for (const def of FILE_SIGNATURES) {
    if (bytes.length < def.offset + def.signature.length) continue;
    let matched = true;
    for (let i = 0; i < def.signature.length; i++) {
      if (bytes[def.offset + i] !== def.signature[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { definition: def };
  }
  return null;
}

export function bytesToHexPreview(bytes: Uint8Array, maxBytes = 64): string {
  const slice = bytes.slice(0, maxBytes);
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
}

/** Identifies a file signature from a raw hex string (for manual signature lookups). */
export function identifyFromHexString(hex: string): TransformResult {
  const cleaned = hex.trim().replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { ok: false, output: '', error: 'Input is empty.' };
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned) || cleaned.length % 2 !== 0) {
    return {
      ok: false,
      output: '',
      error: 'Invalid hexadecimal input for signature lookup.',
    };
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2)
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);

  const match = matchFileSignature(bytes);
  if (!match) {
    return {
      ok: true,
      output: JSON.stringify({ matched: false }),
      meta: { bytes: bytes.length },
    };
  }
  return {
    ok: true,
    output: JSON.stringify({
      matched: true,
      name: match.definition.name,
      mime: match.definition.mime,
      extension: match.definition.extension,
      offset: match.definition.offset,
      signatureHex: match.definition.signature
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
        .toUpperCase(),
    }),
    meta: { bytes: bytes.length },
  };
}
