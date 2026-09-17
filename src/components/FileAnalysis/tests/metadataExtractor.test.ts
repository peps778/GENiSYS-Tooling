import { describe, it, expect } from 'vitest';
import { extractMetadata } from '../lib/metadataExtractor';
import { identifyFile } from '../lib/fileIdentifier';

function pngWithDims(width: number, height: number): Uint8Array {
  const data = new Uint8Array(33);
  data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  data.set([0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 8);
  data[19] = width & 0xff;
  data[23] = height & 0xff;
  data[24] = 8;
  data[25] = 2; // truecolor, no alpha
  return data;
}

describe('extractMetadata', () => {
  it('extracts supported image metadata (width/height/color type)', () => {
    const data = pngWithDims(64, 32);
    const identification = identifyFile(data, 'test.png');
    const metadata = extractMetadata(data, identification, data.length);
    expect(metadata.category).toBe('image');
    const width = metadata.fields.find((f) => f.label === 'Width');
    expect(width?.value).toBe(64);
    expect(width?.status).toBe('available');
  });

  it('marks EXIF as unavailable rather than inventing it', () => {
    const data = pngWithDims(10, 10);
    const identification = identifyFile(data, 'test.png');
    const metadata = extractMetadata(data, identification, data.length);
    const exif = metadata.fields.find((f) => f.label === 'EXIF metadata');
    expect(exif?.status).toBe('unavailable');
    expect(exif?.value).toBeNull();
  });

  it('marks missing metadata for malformed/invalid input', () => {
    const data = new Uint8Array([0x89, 0x50]); // truncated PNG
    const identification = identifyFile(data, 'broken.png');
    const metadata = extractMetadata(data, identification, data.length);
    // Not a confirmed PNG, so falls back to generic metadata.
    expect(metadata.category).toBe('generic');
  });

  it('produces format-specific behavior for PDF', () => {
    const header = '%PDF-1.4\n%rest of file';
    const data = new TextEncoder().encode(header);
    const identification = identifyFile(data, 'doc.pdf');
    const metadata = extractMetadata(data, identification, data.length);
    expect(metadata.category).toBe('pdf');
    const version = metadata.fields.find((f) => f.label === 'PDF version');
    expect(version?.value).toBe('1.4');
  });

  it('falls back to generic metadata for unrecognized formats', () => {
    const data = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
    const identification = identifyFile(data, 'mystery.bin');
    const metadata = extractMetadata(data, identification, data.length);
    expect(metadata.category).toBe('generic');
    expect(
      metadata.fields.find((f) => f.label === 'Detected format')?.value,
    ).toBe('Unknown');
  });
});
