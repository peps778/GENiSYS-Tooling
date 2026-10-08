import type {
  ExifData,
  ImageAnomaly,
  ImageChunk,
  ImageInformation,
} from '../types/fileAnalysis';

export interface ImageDimensions {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Bounds-safe primitives. All throw-free; return null on OOB.
// ---------------------------------------------------------------------------

function readUint32BE(data: Uint8Array, offset: number): number | null {
  if (offset + 4 > data.length) return null;
  return (
    data[offset] * 0x1000000 +
    ((data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3])
  );
}

function readUint16BE(data: Uint8Array, offset: number): number | null {
  if (offset + 2 > data.length) return null;
  return (data[offset] << 8) | data[offset + 1];
}

function readUint16LE(data: Uint8Array, offset: number): number | null {
  if (offset + 2 > data.length) return null;
  return data[offset] | (data[offset + 1] << 8);
}

function readUint32LE(data: Uint8Array, offset: number): number | null {
  if (offset + 4 > data.length) return null;
  return (
    data[offset] +
    (data[offset + 1] << 8) +
    (data[offset + 2] << 16) +
    data[offset + 3] * 0x1000000
  );
}

function asciiAt(
  data: Uint8Array,
  offset: number,
  length: number,
): string | null {
  if (offset + length > data.length) return null;
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(data[offset + i]);
  return s;
}

function hexPreview(
  data: Uint8Array,
  offset: number,
  length: number,
  cap = 32,
): string {
  const end = Math.min(offset + length, offset + cap, data.length);
  let s = '';
  for (let i = offset; i < end; i++) {
    s += data[i].toString(16).padStart(2, '0');
    if ((i - offset) % 2 === 1) s += ' ';
  }
  return s.trim();
}

/** Extract printable ASCII runs from a byte range as a single string. */
function printableSlice(
  data: Uint8Array,
  offset: number,
  length: number,
): string {
  const end = Math.min(offset + length, data.length);
  let s = '';
  for (let i = offset; i < end; i++) {
    const b = data[i];
    s +=
      b >= 0x20 && b <= 0x7e
        ? String.fromCharCode(b)
        : b === 0
          ? '\u0000'
          : '.';
  }
  return s;
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function isPng(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  for (let i = 0; i < 8; i++) if (data[i] !== PNG_SIG[i]) return false;
  return true;
}

interface PngChunk {
  type: string;
  length: number;
  dataOffset: number;
  crcOffset: number;
  totalEnd: number;
}

function walkPngChunks(data: Uint8Array, cap = 4096): PngChunk[] | null {
  if (!isPng(data)) return null;
  const chunks: PngChunk[] = [];
  let offset = 8;
  let count = 0;
  while (offset + 12 <= data.length && count < cap) {
    const length = readUint32BE(data, offset);
    if (length === null) return chunks;
    const type = asciiAt(data, offset + 4, 4);
    if (type === null) return chunks;
    const dataOffset = offset + 8;
    const crcOffset = dataOffset + length;
    const totalEnd = crcOffset + 4;
    if (totalEnd > data.length) {
      chunks.push({
        type,
        length,
        dataOffset,
        crcOffset,
        totalEnd: data.length,
      });
      return chunks;
    }
    chunks.push({ type, length, dataOffset, crcOffset, totalEnd });
    offset = totalEnd;
    count++;
    if (type === 'IEND') break;
  }
  return chunks;
}

let CRC_TABLE: Uint32Array | null = null;
function crc32Table(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}
function crc32(data: Uint8Array, offset: number, length: number): number {
  const t = crc32Table();
  let c = 0xffffffff;
  const end = Math.min(offset + length, data.length);
  for (let i = offset; i < end; i++) c = t[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function readPng(data: Uint8Array): {
  dims: ImageDimensions | null;
  depth: number | null;
  colorType: number | null;
  interlace: boolean | null;
  chunks: ImageChunk[];
  anomalies: ImageAnomaly[];
} {
  const chunks: ImageChunk[] = [];
  const anomalies: ImageAnomaly[] = [];
  const pngChunks = walkPngChunks(data);
  if (!pngChunks) {
    return {
      dims: null,
      depth: null,
      colorType: null,
      interlace: null,
      chunks,
      anomalies,
    };
  }

  let width: number | null = null;
  let height: number | null = null;
  let depth: number | null = null;
  let colorType: number | null = null;
  let interlace: boolean | null = null;

  let chunkIndex = 0;
  for (const c of pngChunks) {
    if (c.totalEnd === data.length && c.crcOffset + 4 > data.length) {
      anomalies.push({
        kind: 'truncated-chunk',
        detail: `PNG chunk ${c.type} is truncated.`,
        offset: c.dataOffset - 8,
        severity: 'medium',
      });
    } else {
      const expected = readUint32BE(data, c.crcOffset);
      const actual = crc32(data, c.dataOffset - 4, c.length + 4);
      if (expected !== null && expected !== actual) {
        anomalies.push({
          kind: 'crc-mismatch',
          detail: `PNG chunk ${c.type} CRC mismatch (declared ${expected.toString(
            16,
          )}, computed ${actual.toString(16)}).`,
          offset: c.dataOffset - 8,
          severity: 'high',
        });
      }
    }

    if (chunkIndex === 0 && c.type !== 'IHDR') {
      anomalies.push({
        kind: 'missing-ihdr',
        detail: 'First PNG chunk is not IHDR.',
        offset: c.dataOffset - 8,
        severity: 'high',
      });
    }

    if (c.type === 'IHDR' && c.length >= 13) {
      width = readUint32BE(data, c.dataOffset);
      height = readUint32BE(data, c.dataOffset + 4);
      depth = data[c.dataOffset + 8];
      colorType = data[c.dataOffset + 9];
      interlace = data[c.dataOffset + 12] === 1;
      chunks.push({ kind: 'IHDR', offset: c.dataOffset - 8, length: c.length });
    } else if (c.type === 'tEXt') {
      const payload = printableSlice(data, c.dataOffset, c.length);
      const nul = payload.indexOf('\u0000');
      const keyword = nul >= 0 ? payload.slice(0, nul) : payload;
      const text = nul >= 0 ? payload.slice(nul + 1) : '';
      chunks.push({
        kind: 'tEXt',
        offset: c.dataOffset - 8,
        length: c.length,
        keyword,
        text,
        hexPreview: hexPreview(data, c.dataOffset, c.length),
      });
    } else if (c.type === 'zTXt') {
      const keywordEnd = (() => {
        for (let i = c.dataOffset; i < c.dataOffset + c.length; i++) {
          if (data[i] === 0) return i;
        }
        return -1;
      })();
      const keyword =
        keywordEnd >= 0
          ? printableSlice(data, c.dataOffset, keywordEnd - c.dataOffset)
          : '';
      chunks.push({
        kind: 'zTXt',
        offset: c.dataOffset - 8,
        length: c.length,
        keyword,
        text: '(zlib-compressed — decompress to read)',
        hexPreview: hexPreview(data, c.dataOffset, c.length, 48),
      });
      anomalies.push({
        kind: 'compressed-text-chunk',
        detail: `zTXt chunk (keyword "${keyword}") is zlib-compressed.`,
        offset: c.dataOffset - 8,
        severity: 'medium',
      });
    } else if (c.type === 'iTXt') {
      const payload = printableSlice(data, c.dataOffset, c.length);
      const nul = payload.indexOf('\u0000');
      const keyword = nul >= 0 ? payload.slice(0, nul) : payload;
      chunks.push({
        kind: 'iTXt',
        offset: c.dataOffset - 8,
        length: c.length,
        keyword,
        text: payload.slice(nul + 1),
        hexPreview: hexPreview(data, c.dataOffset, c.length),
      });
    } else if (c.type === 'eXIf') {
      const exif = parseExif(data, c.dataOffset, c.length);
      if (exif) {
        chunks.push({
          kind: 'eXIf',
          offset: c.dataOffset - 8,
          length: c.length,
          text: '(EXIF block — see exif field)',
        });
      }
    } else {
      chunks.push({
        kind: c.type,
        offset: c.dataOffset - 8,
        length: c.length,
        hexPreview: hexPreview(data, c.dataOffset, c.length, 16),
      });
    }
    chunkIndex++;
  }

  const last = pngChunks[pngChunks.length - 1];
  if (last && last.type === 'IEND' && last.totalEnd < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      detail: `${data.length - last.totalEnd} bytes after IEND (possible appended payload).`,
      offset: last.totalEnd,
      severity: 'high',
    });
  }

  if (width && height) {
    const pixels = width * height;
    if (pixels > 1000 && data.length / pixels < 0.002) {
      anomalies.push({
        kind: 'size-ratio',
        detail: `Only ${data.length} bytes for ${width}×${height} pixels — unusually small.`,
        offset: 8,
        severity: 'low',
      });
    }
  }

  return {
    dims: width && height ? { width, height } : null,
    depth,
    colorType,
    interlace,
    chunks,
    anomalies,
  };
}

// ---------------------------------------------------------------------------
// GIF
// ---------------------------------------------------------------------------

function readGif(data: Uint8Array): {
  dims: ImageDimensions | null;
  frameCount: number | null;
  chunks: ImageChunk[];
  anomalies: ImageAnomaly[];
} {
  const chunks: ImageChunk[] = [];
  const anomalies: ImageAnomaly[] = [];

  // Minimum to read dimensions: 6-byte header + 4 bytes of width/height.
  if (data.length < 10) {
    return { dims: null, frameCount: null, chunks, anomalies };
  }

  const header = asciiAt(data, 0, 6);
  if (header !== 'GIF87a' && header !== 'GIF89a') {
    return { dims: null, frameCount: null, chunks, anomalies };
  }

  const width = readUint16LE(data, 6);
  const height = readUint16LE(data, 8);
  if (width === null || height === null || width === 0 || height === 0) {
    return { dims: null, frameCount: null, chunks, anomalies };
  }

  const dims: ImageDimensions = { width, height };

  // Not enough data to walk the logical screen descriptor + blocks.
  // Dimensions are still valid; frame count is unknown rather than zero.
  if (data.length < 13) {
    return { dims, frameCount: null, chunks, anomalies };
  }

  let offset = 13;
  let frameCount = 0;

  // Skip the global color table if present (packed field bit 7).
  const packed = data[10];
  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 0x07) + 1));
    offset += gctSize;
  }

  const CAP = 8192;
  let guard = 0;
  while (offset < data.length && guard++ < CAP) {
    const b = data[offset];
    if (b === 0x3b) {
      // Trailer — anything past this is appended data.
      if (offset + 1 < data.length) {
        anomalies.push({
          kind: 'trailing-data',
          detail: `${data.length - offset - 1} bytes after GIF trailer.`,
          offset: offset + 1,
          severity: 'high',
        });
      }
      break;
    }
    if (b === 0x21) {
      // Extension introducer.
      if (offset + 2 > data.length) break;
      const label = data[offset + 1];
      if (label === 0xf9 && offset + 8 <= data.length) {
        offset += 8; // Graphic Control Extension — fixed length.
      } else if (label === 0xfe) {
        const [text, next] = readGifSubBlocks(data, offset + 2);
        chunks.push({
          kind: 'gif-comment',
          offset,
          length: next - offset,
          text,
        });
        offset = next;
      } else if (label === 0xff) {
        const [appText, next] = readGifSubBlocks(data, offset + 2);
        chunks.push({
          kind: 'gif-app',
          offset,
          length: next - offset,
          text: appText,
        });
        offset = next;
      } else {
        const [, next] = readGifSubBlocks(data, offset + 2);
        offset = next > offset ? next : offset + 2;
      }
    } else if (b === 0x2c) {
      // Image descriptor.
      if (offset + 10 > data.length) break;
      frameCount++;
      const packed = data[offset + 9];
      offset += 10;
      if (packed & 0x80) {
        const lctSize = 3 * (1 << ((packed & 0x07) + 1));
        offset += lctSize;
      }
      offset += 1; // LZW minimum code size.
      const [, next] = readGifSubBlocks(data, offset);
      offset = next > offset ? next : offset + 1;
    } else {
      // Unknown byte — resync one step.
      offset++;
    }
  }

  return { dims, frameCount, chunks, anomalies };
}

function readGifSubBlocks(data: Uint8Array, offset: number): [string, number] {
  let text = '';
  let cur = offset;
  const CAP = 4096;
  let guard = 0;
  while (cur < data.length && guard++ < CAP) {
    const size = data[cur];
    if (size === 0) {
      cur++;
      break;
    }
    if (cur + 1 + size > data.length) {
      cur = data.length;
      break;
    }
    text += printableSlice(data, cur + 1, size);
    cur += 1 + size;
  }
  return [text, cur];
}

// ---------------------------------------------------------------------------
// BMP
// ---------------------------------------------------------------------------

function readBmp(data: Uint8Array): {
  dims: ImageDimensions | null;
  anomalies: ImageAnomaly[];
} {
  const anomalies: ImageAnomaly[] = [];
  if (data.length < 26) return { dims: null, anomalies };
  if (data[0] !== 0x42 || data[1] !== 0x4d) return { dims: null, anomalies };

  const dibSize = readUint32LE(data, 14);
  if (dibSize === null) return { dims: null, anomalies };

  if (dibSize === 12) {
    const width = readUint16LE(data, 18);
    const height = readUint16LE(data, 20);
    if (width && height && width > 0 && height > 0)
      return { dims: { width, height }, anomalies };
    return { dims: null, anomalies };
  }
  if (dibSize >= 40 && data.length >= 26) {
    const width = readUint32LE(data, 18);
    const heightRaw = readUint32LE(data, 22);
    if (width === null || heightRaw === null) return { dims: null, anomalies };
    const height = Math.abs(heightRaw);
    if (width > 0 && height > 0) return { dims: { width, height }, anomalies };
  }
  return { dims: null, anomalies };
}

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

interface JpegSegment {
  marker: number;
  offset: number;
  length: number;
  dataOffset: number;
}

function walkJpegSegments(data: Uint8Array, cap = 4096): JpegSegment[] {
  const segs: JpegSegment[] = [];
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return segs;
  let offset = 2;
  let guard = 0;
  while (offset + 4 <= data.length && guard++ < cap) {
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
    if (marker === 0xd9) break;
    const length = readUint16BE(data, offset + 2);
    if (length === null || length < 2) break;
    const dataOffset = offset + 4;
    const end = offset + 2 + length;
    if (end > data.length) {
      segs.push({ marker, offset, length, dataOffset });
      break;
    }
    segs.push({ marker, offset, length, dataOffset });
    if (SOF_MARKERS.has(marker)) break;
    offset = end;
  }
  return segs;
}

function readJpeg(data: Uint8Array): {
  dims: ImageDimensions | null;
  chunks: ImageChunk[];
  exif: ExifData | null;
  anomalies: ImageAnomaly[];
} {
  const chunks: ImageChunk[] = [];
  const anomalies: ImageAnomaly[] = [];
  let dims: ImageDimensions | null = null;
  let exif: ExifData | null = null;

  const segs = walkJpegSegments(data);
  for (const s of segs) {
    if (SOF_MARKERS.has(s.marker) && s.dataOffset + 5 <= data.length) {
      const height = readUint16BE(data, s.dataOffset + 1);
      const width = readUint16BE(data, s.dataOffset + 3);
      if (width && height && width > 0 && height > 0) dims = { width, height };
    } else if (s.marker === 0xfe) {
      chunks.push({
        kind: 'COM',
        offset: s.offset,
        length: s.length,
        text: printableSlice(data, s.dataOffset, s.length - 2),
      });
    } else if (s.marker === 0xe1) {
      const header = asciiAt(data, s.dataOffset, 6);
      if (header === 'Exif\u0000\u0000') {
        exif = parseExif(data, s.dataOffset + 6, s.length - 8);
        chunks.push({
          kind: 'APP1/Exif',
          offset: s.offset,
          length: s.length,
          text: '(EXIF block — see exif field)',
        });
      } else if (header && header.startsWith('http')) {
        chunks.push({
          kind: 'APP1/XMP',
          offset: s.offset,
          length: s.length,
          text: printableSlice(data, s.dataOffset, Math.min(s.length - 2, 512)),
        });
      } else {
        chunks.push({
          kind: 'APP1',
          offset: s.offset,
          length: s.length,
          hexPreview: hexPreview(data, s.dataOffset, s.length, 32),
        });
      }
    } else if (s.marker >= 0xe0 && s.marker <= 0xef) {
      chunks.push({
        kind: `APP${s.marker - 0xe0}`,
        offset: s.offset,
        length: s.length,
        hexPreview: hexPreview(data, s.dataOffset, s.length, 24),
      });
    }
  }

  const EOI = findJpegEOI(data);
  if (EOI !== -1 && EOI + 2 < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      detail: `${data.length - (EOI + 2)} bytes after JPEG EOI.`,
      offset: EOI + 2,
      severity: 'high',
    });
  }

  return { dims, chunks, exif, anomalies };
}

function findJpegEOI(data: Uint8Array): number {
  for (let i = data.length - 2; i >= 2; i--) {
    if (data[i] === 0xff && data[i + 1] === 0xd9) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// WebP (VP8 lossy + VP8L lossless + VP8X extended)
// ---------------------------------------------------------------------------

function readWebp(data: Uint8Array): {
  dims: ImageDimensions | null;
  anomalies: ImageAnomaly[];
} {
  const anomalies: ImageAnomaly[] = [];
  if (data.length < 16) return { dims: null, anomalies };
  if (asciiAt(data, 0, 4) !== 'RIFF' || asciiAt(data, 8, 4) !== 'WEBP')
    return { dims: null, anomalies };

  let offset = 12;
  while (offset + 8 <= data.length) {
    const id = asciiAt(data, offset, 4);
    const size = readUint32LE(data, offset + 4);
    if (size === null) break;
    const payload = offset + 8;

    if (id === 'VP8 ') {
      if (payload + 10 <= data.length) {
        const width = (data[payload + 6] | (data[payload + 7] << 8)) & 0x3fff;
        const height = (data[payload + 8] | (data[payload + 9] << 8)) & 0x3fff;
        if (width > 0 && height > 0)
          return { dims: { width, height }, anomalies };
      }
      return { dims: null, anomalies };
    }
    if (id === 'VP8L') {
      if (payload + 5 <= data.length && data[payload] === 0x2f) {
        const b0 = data[payload + 1];
        const b1 = data[payload + 2];
        const b2 = data[payload + 3];
        const b3 = data[payload + 4];
        const width = 1 + (((b1 & 0x3f) << 8) | b0);
        const height =
          1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
        if (width > 0 && height > 0)
          return { dims: { width, height }, anomalies };
      }
      return { dims: null, anomalies };
    }
    if (id === 'VP8X') {
      if (payload + 10 <= data.length) {
        const w1 =
          data[payload + 4] |
          (data[payload + 5] << 8) |
          (data[payload + 6] << 16);
        const h1 =
          data[payload + 7] |
          (data[payload + 8] << 8) |
          (data[payload + 9] << 16);
        const width = w1 + 1;
        const height = h1 + 1;
        if (width > 0 && height > 0)
          return { dims: { width, height }, anomalies };
      }
      return { dims: null, anomalies };
    }
    offset = payload + size + (size & 1);
  }
  return { dims: null, anomalies };
}

// ---------------------------------------------------------------------------
// EXIF / TIFF IFD parser
// ---------------------------------------------------------------------------

const EXIF_TAG_NAMES: Record<number, string> = {
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'ExifIFDPointer',
  0x8825: 'GPSInfoIFDPointer',
  0x9003: 'DateTimeOriginal',
  0x9286: 'UserComment',
  0xa002: 'PixelXDimension',
  0xa003: 'PixelYDimension',
};

const TYPE_SIZE: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

interface TiffReader {
  data: Uint8Array;
  little: boolean;
  base: number;
}

function readTiffU16(r: TiffReader, offset: number): number | null {
  const a = r.data[offset];
  const b = r.data[offset + 1];
  if (a === undefined || b === undefined) return null;
  return r.little ? a | (b << 8) : (a << 8) | b;
}

function readTiffU32(r: TiffReader, offset: number): number | null {
  if (offset + 4 > r.data.length) return null;
  const b = r.data;
  return r.little
    ? b[offset] +
        (b[offset + 1] << 8) +
        (b[offset + 2] << 16) +
        b[offset + 3] * 0x1000000
    : b[offset] * 0x1000000 +
        ((b[offset + 1] << 16) | (b[offset + 2] << 8) | b[offset + 3]);
}

function readTiffValue(
  r: TiffReader,
  type: number,
  count: number,
  valueOffset: number,
): string | number | number[] | null {
  const size = TYPE_SIZE[type];
  if (!size) return null;
  const totalBytes = size * count;
  const inline = totalBytes <= 4;
  const dataOffset = inline
    ? valueOffset
    : (() => {
        const ptr = readTiffU32(r, valueOffset);
        return ptr === null ? -1 : r.base + ptr;
      })();
  if (dataOffset < 0 || dataOffset + totalBytes > r.data.length) return null;

  if (type === 2) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const b = r.data[dataOffset + i];
      if (b === 0) break;
      s += String.fromCharCode(b);
    }
    return s;
  }
  if (type === 3) {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      const v = readTiffU16(r, dataOffset + i * 2);
      if (v === null) return null;
      arr.push(v);
    }
    return arr.length === 1 ? arr[0] : arr;
  }
  if (type === 4 || type === 9) {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      const v = readTiffU32(r, dataOffset + i * 4);
      if (v === null) return null;
      arr.push(v);
    }
    return arr.length === 1 ? arr[0] : arr;
  }
  if (type === 5 || type === 10) {
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      const num = readTiffU32(r, dataOffset + i * 8);
      const den = readTiffU32(r, dataOffset + i * 8 + 4);
      if (num === null || den === null || den === 0) continue;
      arr.push(num / den);
    }
    return arr.length === 1 ? arr[0] : arr;
  }
  if (type === 7) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const b = r.data[dataOffset + i];
      s += b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '';
    }
    return s;
  }
  return null;
}

function parseExifIfd(
  r: TiffReader,
  ifdOffset: number,
  out: Array<{ tag: number; name: string; value: string }>,
  depth = 0,
): void {
  if (depth > 3) return;
  const count = readTiffU16(r, ifdOffset);
  if (count === null || count === 0 || count > 4096) return;
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > r.data.length) return;
    const tag = readTiffU16(r, entryOffset);
    const type = readTiffU16(r, entryOffset + 2);
    const valueCount = readTiffU32(r, entryOffset + 4);
    if (tag === null || type === null || valueCount === null) return;

    if (tag === 0x8769 || tag === 0x8825) {
      const ptr = readTiffU32(r, entryOffset + 8);
      if (ptr !== null) parseExifIfd(r, r.base + ptr, out, depth + 1);
      continue;
    }

    const value = readTiffValue(r, type, valueCount, entryOffset + 8);
    if (value === null) continue;
    const name = EXIF_TAG_NAMES[tag] ?? `0x${tag.toString(16)}`;
    let display: string;
    if (Array.isArray(value)) display = value.slice(0, 8).join(', ');
    else display = String(value);
    if (display.length > 300) display = display.slice(0, 300) + '…';
    out.push({ tag, name, value: display });
  }
}

function parseExif(
  data: Uint8Array,
  offset: number,
  _length: number,
): ExifData | null {
  if (offset + 8 > data.length) return null;
  const byteOrder = asciiAt(data, offset, 2);
  if (byteOrder !== 'II' && byteOrder !== 'MM') return null;
  const little = byteOrder === 'II';
  const r: TiffReader = { data, little, base: offset };
  const magic = readTiffU16(r, offset + 2);
  if (magic !== 42) return null;
  const firstIfd = readTiffU32(r, offset + 4);
  if (firstIfd === null) return null;

  const raw: Array<{ tag: number; name: string; value: string }> = [];
  parseExifIfd(r, offset + firstIfd, raw);

  if (raw.length === 0) return null;

  const exif: ExifData = { raw };
  const find = (name: string): string | undefined =>
    raw.find((e) => e.name === name)?.value;

  exif.make = find('Make');
  exif.model = find('Model');
  exif.software = find('Software');
  exif.dateTime = find('DateTime');
  exif.dateTimeOriginal = find('DateTimeOriginal');
  exif.imageDescription = find('ImageDescription');
  exif.copyright = find('Copyright');
  exif.userComment = find('UserComment');
  const orientStr = find('Orientation');
  if (orientStr) {
    const n = parseInt(orientStr, 10);
    if (!Number.isNaN(n)) exif.orientation = n;
  }
  const px = find('PixelXDimension');
  const py = find('PixelYDimension');
  if (px) exif.pixelXDimension = parseInt(px, 10) || undefined;
  if (py) exif.pixelYDimension = parseInt(py, 10) || undefined;

  return exif;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function readImageDimensions(
  data: Uint8Array,
  format: string,
): ImageDimensions | null {
  switch (format) {
    case 'PNG image':
      return readPng(data).dims;
    case 'GIF image':
      return readGif(data).dims;
    case 'BMP image':
      return readBmp(data).dims;
    case 'JPEG image':
      return readJpeg(data).dims;
    case 'WebP image':
      return readWebp(data).dims;
    default:
      return null;
  }
}

export function analyzeImage(
  data: Uint8Array,
  format: string,
  mime: string | null,
  objectUrl: string | null,
): ImageInformation {
  switch (format) {
    case 'PNG image': {
      const r = readPng(data);
      return {
        format,
        mime,
        width: r.dims?.width ?? null,
        height: r.dims?.height ?? null,
        hasAlpha:
          r.colorType === 4 || r.colorType === 6
            ? true
            : r.colorType === 0 || r.colorType === 2 || r.colorType === 3
              ? false
              : null,
        colorInfo: describeColorType(r.colorType),
        colorDepth: r.depth,
        interlaced: r.interlace,
        frameCount: 1,
        chunks: r.chunks,
        anomalies: r.anomalies,
        exifAvailable: false,
        exif: null,
        objectUrl,
      };
    }
    case 'GIF image': {
      const r = readGif(data);
      return {
        format,
        mime,
        width: r.dims?.width ?? null,
        height: r.dims?.height ?? null,
        hasAlpha: true,
        colorInfo: 'Paletted',
        colorDepth: 8,
        interlaced: null,
        frameCount: r.frameCount,
        chunks: r.chunks,
        anomalies: r.anomalies,
        exifAvailable: false,
        exif: null,
        objectUrl,
      };
    }
    case 'BMP image': {
      const r = readBmp(data);
      return {
        format,
        mime,
        width: r.dims?.width ?? null,
        height: r.dims?.height ?? null,
        hasAlpha: false,
        colorInfo: null,
        colorDepth: null,
        interlaced: null,
        frameCount: 1,
        chunks: [],
        anomalies: r.anomalies,
        exifAvailable: false,
        exif: null,
        objectUrl,
      };
    }
    case 'JPEG image': {
      const r = readJpeg(data);
      return {
        format,
        mime,
        width: r.dims?.width ?? null,
        height: r.dims?.height ?? null,
        hasAlpha: false,
        colorInfo: 'YCbCr (typical)',
        colorDepth: 8,
        interlaced: null,
        frameCount: 1,
        chunks: r.chunks,
        anomalies: r.anomalies,
        exifAvailable: r.exif !== null,
        exif: r.exif,
        objectUrl,
      };
    }
    case 'WebP image': {
      const r = readWebp(data);
      return {
        format,
        mime,
        width: r.dims?.width ?? null,
        height: r.dims?.height ?? null,
        hasAlpha: null,
        colorInfo: null,
        colorDepth: null,
        interlaced: null,
        frameCount: null,
        chunks: [],
        anomalies: r.anomalies,
        exifAvailable: false,
        exif: null,
        objectUrl,
      };
    }
    default:
      return {
        format,
        mime,
        width: null,
        height: null,
        hasAlpha: null,
        colorInfo: null,
        colorDepth: null,
        interlaced: null,
        frameCount: null,
        chunks: [],
        anomalies: [],
        exifAvailable: false,
        exif: null,
        objectUrl,
      };
  }
}

function describeColorType(ct: number | null): string | null {
  if (ct === null) return null;
  const map: Record<number, string> = {
    0: 'Grayscale',
    2: 'Truecolor (RGB)',
    3: 'Indexed (palette)',
    4: 'Grayscale + alpha',
    6: 'Truecolor + alpha (RGBA)',
  };
  return map[ct] ?? null;
}
