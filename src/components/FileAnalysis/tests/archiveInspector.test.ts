import { describe, it, expect } from 'vitest';
import { inspectZipArchive, looksLikeZip } from '../lib/archiveInspector';

/**
 * Builds a minimal, valid single-entry ZIP archive with a stored (uncompressed)
 * entry, for deterministic testing without relying on an external fixture.
 */
function buildMinimalZip(entryName: string, contents: string): Uint8Array {
  const nameBytes = new TextEncoder().encode(entryName);
  const contentBytes = new TextEncoder().encode(contents);
  const crc = 0; // not validated by our parser; fine for this test fixture

  const localHeader: number[] = [
    0x50,
    0x4b,
    0x03,
    0x04, // local file header signature
    20,
    0, // version needed
    0,
    0, // flags
    0,
    0, // compression method (stored)
    0,
    0,
    0,
    0, // mod time/date
    ...u32le(crc),
    ...u32le(contentBytes.length), // compressed size
    ...u32le(contentBytes.length), // uncompressed size
    ...u16le(nameBytes.length),
    ...u16le(0), // extra length
    ...nameBytes,
    ...contentBytes,
  ];

  const centralDirOffset = localHeader.length;
  const centralHeader: number[] = [
    0x50,
    0x4b,
    0x01,
    0x02, // central directory signature
    20,
    0, // version made by
    20,
    0, // version needed
    0,
    0, // flags
    0,
    0, // compression method
    0,
    0,
    0,
    0, // mod time/date
    ...u32le(crc),
    ...u32le(contentBytes.length),
    ...u32le(contentBytes.length),
    ...u16le(nameBytes.length),
    ...u16le(0), // extra length
    ...u16le(0), // comment length
    ...u16le(0), // disk number
    ...u16le(0), // internal attrs
    ...u32le(0), // external attrs
    ...u32le(0), // offset of local header
    ...nameBytes,
  ];

  const eocd: number[] = [
    0x50,
    0x4b,
    0x05,
    0x06,
    0,
    0,
    0,
    0, // disk numbers
    ...u16le(1), // entries on this disk
    ...u16le(1), // total entries
    ...u32le(centralHeader.length), // central dir size
    ...u32le(centralDirOffset), // central dir offset
    ...u16le(0), // comment length
  ];

  return new Uint8Array([...localHeader, ...centralHeader, ...eocd]);
}

function u16le(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff];
}
function u32le(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}

describe('inspectZipArchive', () => {
  it('parses a valid single-entry ZIP', () => {
    const zip = buildMinimalZip('hello.txt', 'hello world');
    const info = inspectZipArchive(zip);
    expect(info.supported).toBe(true);
    expect(info.entryCount).toBe(1);
    expect(info.entries[0].name).toBe('hello.txt');
    expect(info.entries[0].uncompressedSize).toBe(11);
    expect(info.entries[0].isDirectory).toBe(false);
  });

  it('parses an empty archive (EOCD only) as zero entries', () => {
    const eocd = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0,
    ]);
    const info = inspectZipArchive(eocd);
    expect(info.supported).toBe(true);
    expect(info.entryCount).toBe(0);
  });

  it('reports unsupported for invalid/non-ZIP data', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const info = inspectZipArchive(data);
    expect(info.supported).toBe(false);
    expect(info.entryCount).toBe(0);
  });

  it('reports entry metadata correctly', () => {
    const zip = buildMinimalZip('dir/file.bin', 'abcdef');
    const info = inspectZipArchive(zip);
    expect(info.entries[0].compressionMethod).toBe('Stored (no compression)');
  });

  it('identifies directory entries by trailing slash', () => {
    const zip = buildMinimalZip('folder/', '');
    const info = inspectZipArchive(zip);
    expect(info.entries[0].isDirectory).toBe(true);
  });

  it('handles malformed/truncated central directory without throwing', () => {
    const zip = buildMinimalZip('a.txt', 'data');
    const truncated = zip.slice(0, zip.length - 10);
    expect(() => inspectZipArchive(truncated)).not.toThrow();
  });
});

describe('looksLikeZip', () => {
  it('recognizes a local-file-header signature', () => {
    expect(looksLikeZip(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });

  it('returns false for non-ZIP data', () => {
    expect(looksLikeZip(new Uint8Array([1, 2, 3, 4]))).toBe(false);
  });
});
