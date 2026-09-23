import { describe, it, expect } from 'vitest';
import { readImageDimensions, analyzeImage } from '../lib/imageAnalyzer';

function pngHeaderWithDims(width: number, height: number): Uint8Array {
  const data = new Uint8Array(33);
  data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  // IHDR chunk: length(4) + "IHDR"(4) + width(4) + height(4) + bitdepth + colortype ...
  data.set([0, 0, 0, 13], 8);
  data.set([0x49, 0x48, 0x44, 0x52], 12);
  data[16] = (width >>> 24) & 0xff;
  data[17] = (width >>> 16) & 0xff;
  data[18] = (width >>> 8) & 0xff;
  data[19] = width & 0xff;
  data[20] = (height >>> 24) & 0xff;
  data[21] = (height >>> 16) & 0xff;
  data[22] = (height >>> 8) & 0xff;
  data[23] = height & 0xff;
  data[24] = 8; // bit depth
  data[25] = 6; // color type (RGBA)
  return data;
}

function gifHeaderWithDims(width: number, height: number): Uint8Array {
  const data = new Uint8Array(10);
  data.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
  data[6] = width & 0xff;
  data[7] = (width >> 8) & 0xff;
  data[8] = height & 0xff;
  data[9] = (height >> 8) & 0xff;
  return data;
}

describe('readImageDimensions', () => {
  it('reads valid PNG dimensions', () => {
    const data = pngHeaderWithDims(800, 600);
    expect(readImageDimensions(data, 'PNG image')).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('reads valid GIF dimensions', () => {
    const data = gifHeaderWithDims(320, 240);
    expect(readImageDimensions(data, 'GIF image')).toEqual({
      width: 320,
      height: 240,
    });
  });

  it('returns null for invalid/malformed image data', () => {
    const data = new Uint8Array([0x89, 0x50]); // truncated
    expect(readImageDimensions(data, 'PNG image')).toBeNull();
  });

  it('returns null for unsupported formats', () => {
    const data = new Uint8Array(20);
    expect(readImageDimensions(data, 'SQLite database')).toBeNull();
  });
});

describe('analyzeImage', () => {
  it('builds full image information for a valid PNG', () => {
    const data = pngHeaderWithDims(100, 50);
    const info = analyzeImage(data, 'PNG image', 'image/png', null);
    expect(info.width).toBe(100);
    expect(info.height).toBe(50);
    expect(info.hasAlpha).toBe(true);
    expect(info.colorInfo).toBe('Truecolor + alpha (RGBA)');
  });

  it('reports null dimensions gracefully for invalid image data', () => {
    const data = new Uint8Array([0x89, 0x50]);
    const info = analyzeImage(data, 'PNG image', 'image/png', null);
    expect(info.width).toBeNull();
    expect(info.height).toBeNull();
  });
});
