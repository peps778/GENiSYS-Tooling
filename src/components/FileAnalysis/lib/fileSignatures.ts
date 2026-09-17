/**
 * Structured file-signature ("magic bytes") database.
 *
 * This is deliberately conservative: every entry is a signature that is
 * genuinely reliable evidence of the named format. Ambiguous or weak
 * signatures are marked with `confidence: "probable"` so the UI never
 * reports them as confirmed.
 */

import type { Confidence } from '../types/fileAnalysis';

export interface FileSignatureDefinition {
  format: string;
  mime: string | null;
  extensions: string[];
  /** Bytes to match, as an array of 0-255 values. `null` = wildcard byte. */
  bytes: (number | null)[];
  /** Offset within the file where `bytes` should appear. */
  offset: number;
  confidence: Confidence;
  /** Short human explanation of the detection basis. */
  reason: string;
}

function hex(bytes: (number | null)[]): string {
  return bytes
    .map((b) =>
      b === null ? '??' : b.toString(16).toUpperCase().padStart(2, '0'),
    )
    .join(' ');
}

export const FILE_SIGNATURES: FileSignatureDefinition[] = [
  {
    format: 'JPEG image',
    mime: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    bytes: [0xff, 0xd8, 0xff],
    offset: 0,
    confidence: 'confirmed',
    reason: 'SOI marker (FF D8 FF) matched at offset 0',
  },
  {
    format: 'PNG image',
    mime: 'image/png',
    extensions: ['.png'],
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
    confidence: 'confirmed',
    reason: 'PNG signature matched at offset 0',
  },
  {
    format: 'GIF image',
    mime: 'image/gif',
    extensions: ['.gif'],
    bytes: [0x47, 0x49, 0x46, 0x38, null, 0x61],
    offset: 0,
    confidence: 'confirmed',
    reason: 'GIF87a/GIF89a header matched at offset 0',
  },
  {
    format: 'PDF document',
    mime: 'application/pdf',
    extensions: ['.pdf'],
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2d],
    offset: 0,
    confidence: 'confirmed',
    reason: '%PDF- header matched at offset 0',
  },
  {
    format: 'ZIP archive',
    mime: 'application/zip',
    extensions: ['.zip'],
    bytes: [0x50, 0x4b, 0x03, 0x04],
    offset: 0,
    confidence: 'confirmed',
    reason: 'Local file header signature matched at offset 0',
  },
  {
    format: 'ZIP archive (empty)',
    mime: 'application/zip',
    extensions: ['.zip'],
    bytes: [0x50, 0x4b, 0x05, 0x06],
    offset: 0,
    confidence: 'confirmed',
    reason: 'End-of-central-directory signature matched at offset 0',
  },
  {
    format: 'GZIP compressed data',
    mime: 'application/gzip',
    extensions: ['.gz'],
    bytes: [0x1f, 0x8b],
    offset: 0,
    confidence: 'confirmed',
    reason: 'GZIP magic bytes matched at offset 0',
  },
  {
    format: 'RAR archive',
    mime: 'application/vnd.rar',
    extensions: ['.rar'],
    bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00],
    offset: 0,
    confidence: 'confirmed',
    reason: 'RAR 1.5-4.x signature matched at offset 0',
  },
  {
    format: 'RAR archive (v5)',
    mime: 'application/vnd.rar',
    extensions: ['.rar'],
    bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00],
    offset: 0,
    confidence: 'confirmed',
    reason: 'RAR 5.0 signature matched at offset 0',
  },
  {
    format: '7-Zip archive',
    mime: 'application/x-7z-compressed',
    extensions: ['.7z'],
    bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c],
    offset: 0,
    confidence: 'confirmed',
    reason: '7z signature matched at offset 0',
  },
  {
    format: 'ELF binary',
    mime: 'application/x-elf',
    extensions: ['.elf', '.so', '.bin'],
    bytes: [0x7f, 0x45, 0x4c, 0x46],
    offset: 0,
    confidence: 'confirmed',
    reason: "ELF magic (0x7F 'ELF') matched at offset 0",
  },
  {
    format: 'PE/Windows executable',
    mime: 'application/x-msdownload',
    extensions: ['.exe', '.dll'],
    bytes: [0x4d, 0x5a],
    offset: 0,
    confidence: 'confirmed',
    reason: 'MZ header matched at offset 0 (DOS stub of a PE image)',
  },
  {
    format: 'WAV audio',
    mime: 'audio/wav',
    extensions: ['.wav'],
    bytes: [0x52, 0x49, 0x46, 0x46],
    offset: 0,
    confidence: 'probable',
    reason: 'RIFF container header matched; WAVE subtype not verified',
  },
  {
    format: 'WebP image',
    mime: 'image/webp',
    extensions: ['.webp'],
    bytes: [0x52, 0x49, 0x46, 0x46],
    offset: 0,
    confidence: 'probable',
    reason: 'RIFF container header matched; WEBP subtype not verified',
  },
  {
    format: 'MP3 audio',
    mime: 'audio/mpeg',
    extensions: ['.mp3'],
    bytes: [0x49, 0x44, 0x33],
    offset: 0,
    confidence: 'probable',
    reason: 'ID3 tag header matched; not conclusive proof of MPEG audio frames',
  },
  {
    format: 'BMP image',
    mime: 'image/bmp',
    extensions: ['.bmp'],
    bytes: [0x42, 0x4d],
    offset: 0,
    confidence: 'probable',
    reason: 'BM header matched; two-byte signature is weak evidence alone',
  },
  {
    format: 'TIFF image (little-endian)',
    mime: 'image/tiff',
    extensions: ['.tif', '.tiff'],
    bytes: [0x49, 0x49, 0x2a, 0x00],
    offset: 0,
    confidence: 'confirmed',
    reason: 'TIFF little-endian signature matched at offset 0',
  },
  {
    format: 'TIFF image (big-endian)',
    mime: 'image/tiff',
    extensions: ['.tif', '.tiff'],
    bytes: [0x4d, 0x4d, 0x00, 0x2a],
    offset: 0,
    confidence: 'confirmed',
    reason: 'TIFF big-endian signature matched at offset 0',
  },
  {
    format: 'SQLite database',
    mime: 'application/vnd.sqlite3',
    extensions: ['.sqlite', '.db'],
    bytes: [
      0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61,
      0x74, 0x20, 0x33, 0x00,
    ],
    offset: 0,
    confidence: 'confirmed',
    reason: 'SQLite format 3 header matched at offset 0',
  },
];

/** Formats whose signature is a RIFF wrapper; needs a 4-byte subtype check at offset 8. */
export const RIFF_SUBTYPES: Record<
  string,
  { format: string; mime: string; extensions: string[] }
> = {
  WAVE: { format: 'WAV audio', mime: 'audio/wav', extensions: ['.wav'] },
  WEBP: { format: 'WebP image', mime: 'image/webp', extensions: ['.webp'] },
};

export function bytesToHexString(bytes: (number | null)[]): string {
  return hex(bytes);
}
