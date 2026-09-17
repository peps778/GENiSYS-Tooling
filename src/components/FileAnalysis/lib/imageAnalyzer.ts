import type { ImageInformation } from '../types/fileAnalysis';

export interface ImageDimensions {
  width: number;
  height: number;
}

/** Reads a big-endian uint32 at `offset`. */
function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  );
}

/** PNG: IHDR chunk (width/height) always starts at byte 16. */
function readPngDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 24) return null;
  const isPng =
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47;
  if (!isPng) return null;
  const width = readUint32BE(data, 16);
  const height = readUint32BE(data, 20);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/** GIF: little-endian uint16 width/height at bytes 6-9. */
function readGifDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 10) return null;
  const header = String.fromCharCode(data[0], data[1], data[2]);
  if (header !== 'GIF') return null;
  const width = data[6] | (data[7] << 8);
  const height = data[8] | (data[9] << 8);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/** BMP: little-endian int32 width/height in the DIB header at bytes 18-25. */
function readBmpDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 26) return null;
  if (data[0] !== 0x42 || data[1] !== 0x4d) return null;
  const width =
    data[18] | (data[19] << 8) | (data[20] << 16) | (data[21] << 24);
  const heightRaw =
    data[22] | (data[23] << 8) | (data[24] << 16) | (data[25] << 24);
  const height = Math.abs(heightRaw);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/**
 * JPEG: scans SOF (Start Of Frame) markers for dimensions. This walks the
 * marker segments rather than guessing an offset, since JPEG headers vary
 * in length depending on embedded metadata (EXIF, ICC profiles, etc.).
 */
function readJpegDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return null;
  let offset = 2;
  const SOF_MARKERS = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);

  while (offset + 4 <= data.length) {
    if (data[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) break; // EOI
    if (offset + 4 > data.length) break;
    const segmentLength = (data[offset + 2] << 8) | data[offset + 3];
    if (SOF_MARKERS.has(marker)) {
      if (offset + 9 > data.length) return null;
      const height = (data[offset + 5] << 8) | data[offset + 6];
      const width = (data[offset + 7] << 8) | data[offset + 8];
      if (width > 0 && height > 0) return { width, height };
      return null;
    }
    offset += 2 + segmentLength;
  }
  return null;
}

/** WebP (simple lossy VP8): dimensions at a fixed offset within the VP8 chunk. */
function readWebpDimensions(data: Uint8Array): ImageDimensions | null {
  if (data.length < 30) return null;
  const riff = String.fromCharCode(data[0], data[1], data[2], data[3]);
  const webp = String.fromCharCode(data[8], data[9], data[10], data[11]);
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;
  const chunkId = String.fromCharCode(data[12], data[13], data[14], data[15]);
  if (chunkId === 'VP8 ' && data.length >= 30) {
    const width = (data[26] | (data[27] << 8)) & 0x3fff;
    const height = (data[28] | (data[29] << 8)) & 0x3fff;
    if (width > 0 && height > 0) return { width, height };
  }
  // VP8L / VP8X layouts are not parsed -- dimensions unavailable rather than guessed.
  return null;
}

export function readImageDimensions(
  data: Uint8Array,
  format: string,
): ImageDimensions | null {
  switch (format) {
    case 'PNG image':
      return readPngDimensions(data);
    case 'GIF image':
      return readGifDimensions(data);
    case 'BMP image':
      return readBmpDimensions(data);
    case 'JPEG image':
      return readJpegDimensions(data);
    case 'WebP image':
      return readWebpDimensions(data);
    default:
      return null;
  }
}

/**
 * Builds the basic (non-pixel) image information block. `objectUrl` is
 * created by the caller (component layer) since URL.createObjectURL is a
 * browser API tied to a File/Blob, not something this pure module should
 * own -- but its shape lives here for type consistency.
 */
export function analyzeImage(
  data: Uint8Array,
  format: string,
  mime: string | null,
  objectUrl: string | null,
): ImageInformation {
  const dims = readImageDimensions(data, format);
  return {
    format,
    mime,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    hasAlpha: format === 'PNG image' ? detectPngAlpha(data) : null,
    colorInfo: format === 'PNG image' ? describePngColorType(data) : null,
    exifAvailable: false,
    exif: null,
    objectUrl,
  };
}

function detectPngAlpha(data: Uint8Array): boolean | null {
  if (data.length < 26) return null;
  const colorType = data[25];
  // 4 = grayscale+alpha, 6 = truecolor+alpha
  return colorType === 4 || colorType === 6;
}

function describePngColorType(data: Uint8Array): string | null {
  if (data.length < 26) return null;
  const map: Record<number, string> = {
    0: 'Grayscale',
    2: 'Truecolor (RGB)',
    3: 'Indexed (palette)',
    4: 'Grayscale + alpha',
    6: 'Truecolor + alpha (RGBA)',
  };
  return map[data[25]] ?? null;
}
