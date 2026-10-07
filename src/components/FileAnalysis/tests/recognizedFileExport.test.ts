import { describe, it, expect } from 'vitest';
import {
  getRecognizedFileExport,
  withExtension,
} from '../lib/recognizedFileExport';
import { identifyFile } from '../lib/fileIdentifier';
import { extractMetadata } from '../lib/metadataExtractor';
import type { AnalysisResult } from '../types/fileAnalysis';

function ascii(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** Builds a minimal-but-valid AnalysisResult for a given raw buffer + filename. */
function buildResult(
  data: Uint8Array,
  filename: string,
  encodedContent: AnalysisResult['encodedContent'] = null,
): AnalysisResult {
  const identification = identifyFile(data, filename);
  const metadata = extractMetadata(data, identification, data.length);
  return {
    identification,
    metadata,
    strings: null,
    binaryStatistics: null,
    embeddedCandidates: [],
    anomalies: [],
    archive: null,
    image: null,
    sha256: null,
    encodedContent,
    ctf: null,
    executable: null,
    lsbFindings: [],
    pcm: null,
  };
}

describe('getRecognizedFileExport', () => {
  it("exports the whole file's own bytes when the raw signature is confirmed", () => {
    const data = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
    ]);
    const result = buildResult(data, 'mystery.bin');
    const exportInfo = getRecognizedFileExport(result, data);
    expect(exportInfo).not.toBeNull();
    expect(exportInfo!.isWholeFile).toBe(true);
    expect(exportInfo!.extension).toBe('.png');
    expect(exportInfo!.bytes).toBe(data);
  });

  it('returns null when the file is unrecognized and there is no encoded content', () => {
    const data = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
    const result = buildResult(data, 'mystery.bin');
    expect(getRecognizedFileExport(result, data)).toBeNull();
  });

  it('decodes and exports an ASCII binary-text encoded JPEG', () => {
    // "FF D8 FF" as an ASCII '0'/'1' bitstring
    const data = ascii('111111111101100011111111');
    const decodedIdentification = identifyFile(
      new Uint8Array([0xff, 0xd8, 0xff]),
      'x.jpg',
    );
    const result = buildResult(data, 'digits.bin', {
      encoding: 'ascii-binary-text',
      originalLength: data.length,
      decodedLength: 3,
      decodedIdentification,
    });
    const exportInfo = getRecognizedFileExport(result, data);
    expect(exportInfo).not.toBeNull();
    expect(exportInfo!.isWholeFile).toBe(false);
    expect(exportInfo!.extension).toBe('.jpg');
    expect(Array.from(exportInfo!.bytes)).toEqual([0xff, 0xd8, 0xff]);
  });

  it('prefers the whole-file signature over encoded content when both are somehow present', () => {
    const data = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // PDF
    const decodedIdentification = identifyFile(
      new Uint8Array([0xff, 0xd8, 0xff]),
      'x.jpg',
    );
    const result = buildResult(data, 'doc.pdf', {
      encoding: 'ascii-binary-text',
      originalLength: data.length,
      decodedLength: 3,
      decodedIdentification,
    });
    const exportInfo = getRecognizedFileExport(result, data);
    expect(exportInfo!.formatLabel).toBe('PDF document');
    expect(exportInfo!.isWholeFile).toBe(true);
  });

  it('returns null when encoded content exists but its decoded identification has no known extension', () => {
    const data = ascii('00000000'); // decodes to a single 0x00 byte, unknown format
    const decodedIdentification = identifyFile(new Uint8Array([0x00]), 'x');
    const result = buildResult(data, 'digits.bin', {
      encoding: 'ascii-binary-text',
      originalLength: data.length,
      decodedLength: 1,
      decodedIdentification,
    });
    expect(getRecognizedFileExport(result, data)).toBeNull();
  });
});

describe('withExtension', () => {
  it('replaces an existing extension', () => {
    expect(withExtension('digits.bin', '.jpg')).toBe('digits.jpg');
  });

  it("appends an extension when there isn't one", () => {
    expect(withExtension('README', '.txt')).toBe('README.txt');
  });

  it('does not treat a leading dot as an extension boundary', () => {
    expect(withExtension('.gitignore', '.txt')).toBe('.gitignore.txt');
  });
});
