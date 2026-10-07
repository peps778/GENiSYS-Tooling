import type {
  AnomalyFinding,
  LsbFinding,
  PcmData,
} from '../types/fileAnalysis';

// ---------------------------------------------------------------------------
// Bounds-safe primitives. All return null or 0 on OOB; never throw.
// ---------------------------------------------------------------------------

function readUint32BE(data: Uint8Array, offset: number): number {
  if (offset + 4 > data.length) return 0;
  return (
    data[offset] * 0x1000000 +
    data[offset + 1] * 0x10000 +
    data[offset + 2] * 0x100 +
    data[offset + 3]
  );
}

function readUint32LE(data: Uint8Array, offset: number): number {
  if (offset + 4 > data.length) return 0;
  return (
    data[offset] +
    data[offset + 1] * 0x100 +
    data[offset + 2] * 0x10000 +
    data[offset + 3] * 0x1000000
  );
}

function readUint16LE(data: Uint8Array, offset: number): number {
  if (offset + 2 > data.length) return 0;
  return data[offset] + data[offset + 1] * 0x100;
}

function asciiAt(data: Uint8Array, offset: number, length: number): string {
  if (offset + length > data.length) return '';
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(data[offset + i]);
  return s;
}

/** Latin-1 view: every byte maps to exactly one char; binary-safe. */
function latin1(data: Uint8Array, start = 0, length = data.length - start): string {
  const end = Math.min(start + length, data.length);
  let s = '';
  for (let i = start; i < end; i++) s += String.fromCharCode(data[i]);
  return s;
}

/** Longest printable-ASCII run in a string. */
function longestPrintableRun(s: string): number {
  let best = 0;
  let run = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Known chunk-type allowlists. Anything else is reported as unknown, not
// as "hidden data" — an unknown chunk is a lead, not a conclusion.
// ---------------------------------------------------------------------------

const KNOWN_PNG_CHUNKS = new Set([
  'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'cHRM', 'gAMA', 'iCCP',
  'sBIT', 'sRGB', 'tEXt', 'zTXt', 'iTXt', 'bKGD', 'hIST', 'pHYs',
  'sPLT', 'tIME', 'acTL', 'fcTL', 'fdAT', 'eXIf',
]);

const KNOWN_WEBP_CHUNKS = new Set([
  'VP8 ', 'VP8L', 'VP8X', 'ICCP', 'ANIM', 'ANMF', 'ALPH', 'EXIF', 'XMP ',
]);

const KNOWN_RIFF_CHUNKS = new Set([
  'fmt ', 'data', 'LIST', 'INFO', 'fact', 'cue ', 'plst', 'labl',
  'note', 'ltxt', 'smpl', 'inst', 'bext', 'iXML', 'axml', 'id3 ', 'ID3 ',
]);

// ---------------------------------------------------------------------------
// Known file signatures for embedded-payload detection.
// ---------------------------------------------------------------------------

interface Sig { name: string; bytes: number[] }

const EMBEDDED_SIGS: Sig[] = [
  { name: 'ZIP', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { name: 'ZIP (empty)', bytes: [0x50, 0x4b, 0x05, 0x06] },
  { name: 'RAR', bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] },
  { name: '7-Zip', bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { name: 'GZIP', bytes: [0x1f, 0x8b] },
  { name: 'BZIP2', bytes: [0x42, 0x5a, 0x68] },
  { name: 'XZ', bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] },
  { name: 'PNG', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: 'JPEG', bytes: [0xff, 0xd8, 0xff] },
  { name: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38] },
  { name: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46] },
  { name: 'ELF', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: 'PE (MZ)', bytes: [0x4d, 0x5a] },
  { name: 'SQLite', bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] },
  { name: 'WASM', bytes: [0x00, 0x61, 0x73, 0x6d] },
  { name: 'RAR5', bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00] },
];

function findEmbeddedSignatureAt(buf: Uint8Array | string, offset = 0): string | null {
  const bytes =
    typeof buf === 'string'
      ? (() => {
          const out = new Uint8Array(buf.length);
          for (let i = 0; i < buf.length; i++) out[i] = buf.charCodeAt(i) & 0xff;
          return out;
        })()
      : buf;
  for (const sig of EMBEDDED_SIGS) {
    if (offset + sig.bytes.length > bytes.length) continue;
    let ok = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[offset + i] !== sig.bytes[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return sig.name;
  }
  return null;
}

/** Common CTF flag prefixes. Kept in sync with the CTF triage module. */
const FLAG_PREFIX_RE =
  /\b(?:flag|ctf|picoctf|htb|thm|academy|uiuctf|dice|pico|ctflearn|hackthebox|tryhackme|ritsec|angstrom|buckeye|utflag|ictf|ductf|corctf|grey|hsctf|vsctf|sekaictf|maple|irisctf|bi0s|lactl|downunder|uiuctf)\b\{/i;

// ---------------------------------------------------------------------------
// Generic LSB bit extraction.
//
// `bits` is an array of 0/1 values, in order. Groups of 8 produce bytes
// MSB-first. Returns the decoded Latin-1 string.
// ---------------------------------------------------------------------------

function packBits(bits: Uint8Array, maxBytes = 8192): string {
  const limit = Math.min(bits.length, maxBytes * 8);
  let out = '';
  let byte = 0;
  let count = 0;
  for (let i = 0; i < limit; i++) {
    byte = (byte << 1) | bits[i];
    if (++count === 8) {
      out += String.fromCharCode(byte);
      byte = 0;
      count = 0;
    }
  }
  return out;
}

function bytesToLatin1(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function summarizeLsb(
  channel: string,
  bit: number,
  bitsRead: number,
  decoded: string,
  offset: number,
): LsbFinding {
  const preview = decoded
    .slice(0, 200)
    .replace(/[^\x20-\x7e\n]/g, '.');
  const looksLikeFlag = FLAG_PREFIX_RE.test(decoded);
  const embeddedSignature = findEmbeddedSignatureAt(bytesToLatin1(decoded.slice(0, 16)));
  return {
    channel,
    bit,
    bitsRead,
    decoded,
    preview,
    offset,
    looksLikeFlag,
    embeddedSignature,
  };
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

export function inspectPngChunks(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  if (
    data.length < 8 ||
    data[0] !== 0x89 || data[1] !== 0x50 ||
    data[2] !== 0x4e || data[3] !== 0x47
  ) {
    return { anomalies, lsbFindings };
  }

  let offset = 8;
  let iendEnd: number | null = null;
  let ihdrWidth = 0;
  let ihdrHeight = 0;
  let ihdrBitDepth = 0;
  let ihdrColorType = 0;

  const MAX_CHUNKS = 8192;
  let chunks = 0;

  while (offset + 12 <= data.length && chunks++ < MAX_CHUNKS) {
    const length = readUint32BE(data, offset);
    const type = asciiAt(data, offset + 4, 4);
    const dataOffset = offset + 8;
    const crcOffset = dataOffset + length;
    const totalEnd = crcOffset + 4;

    if (totalEnd > data.length) {
      anomalies.push({
        kind: 'structural-note',
        description: `PNG chunk '${type}' is truncated (declared ${length}, available ${data.length - dataOffset}).`,
        offset,
        length: data.length - offset,
        confidence: 'confirmed',
      });
      break;
    }

    if (!KNOWN_PNG_CHUNKS.has(type)) {
      anomalies.push({
        kind: 'unknown-chunk',
        description: `Unknown PNG chunk type '${type}' (${length} bytes).`,
        offset,
        length: length + 12,
        confidence: 'probable',
      });
    }

    if (type === 'IHDR' && length >= 13) {
      ihdrWidth = readUint32BE(data, dataOffset);
      ihdrHeight = readUint32BE(data, dataOffset + 4);
      ihdrBitDepth = data[dataOffset + 8];
      ihdrColorType = data[dataOffset + 9];
    }

    if (type === 'IEND') {
      iendEnd = totalEnd;
      break;
    }

    offset = totalEnd;
  }

  if (iendEnd !== null && iendEnd < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - iendEnd} byte(s) after IEND.`,
      offset: iendEnd,
      length: data.length - iendEnd,
      confidence: 'confirmed',
    });

    const embedded = findEmbeddedSignatureAt(data, iendEnd);
    if (embedded) {
      anomalies.push({
        kind: 'appended-archive',
        description: `Appended payload after IEND starts with a ${embedded} signature.`,
        offset: iendEnd,
        length: data.length - iendEnd,
        confidence: 'confirmed',
      });
    }
  }

  // LSB extraction. Only attempt on non-interlaced 8-bit RGB/RGBA data.
  // Palette-indexed and 16-bit PNGs need per-pixel de-interlacing we don't do here.
  if (
    ihdrWidth > 0 &&
    ihdrHeight > 0 &&
    ihdrBitDepth === 8 &&
    (ihdrColorType === 2 || ihdrColorType === 6)
  ) {
    const lsb = extractPngLsb(data);
    if (lsb) lsbFindings.push(lsb);
  }

  return { anomalies, lsbFindings };
}

/**
 * Extract LSB of the first colour channel across PNG IDAT bytes.
 *
 * NOTE: this is a heuristic. It does not decompress the zlib stream, so it
 * only works when the PNG encoder stored IDAT unfiltered (rare) or when the
 * hidden data tolerates the filter bytes being interleaved. Real LSB stego
 * tools operate on decompressed pixel data. The extracted bytes here are
 * still worth surfacing — false positives are cheap and the analyst can
 * cross-check against `pngcheck -v` output.
 */
function extractPngLsb(data: Uint8Array): LsbFinding | null {
  const bits: number[] = [];
  let offset = 8;
  let firstIdat = -1;
  let chunks = 0;

  while (offset + 12 <= data.length && chunks++ < 8192) {
    const length = readUint32BE(data, offset);
    const type = asciiAt(data, offset + 4, 4);
    const dataOffset = offset + 8;
    const totalEnd = dataOffset + length + 4;

    if (totalEnd > data.length) break;

    if (type === 'IDAT') {
      if (firstIdat < 0) firstIdat = dataOffset;
      for (let i = dataOffset; i < dataOffset + length; i++) {
        bits.push(data[i] & 1);
        if (bits.length >= 8192 * 8) break;
      }
    }

    if (type === 'IEND') break;
    offset = totalEnd;
  }

  if (bits.length < 64) return null;
  const decoded = packBits(Uint8Array.from(bits));
  // Reject obvious noise: require at least 6 consecutive printable chars.
  if (longestPrintableRun(decoded) < 6) return null;
  return summarizeLsb('IDAT-LSB', 0, bits.length, decoded, firstIdat);
}

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

/**
 * Walk JPEG segments forward to locate the true end of the encoded image.
 *
 * Returns the offset *after* the last marker the parser recognises plus
 * SOS-encoded scan data (which ends at EOI by definition). Any bytes past
 * that offset are appended data — this is more reliable than scanning
 * backwards for FF D9, because an appended payload may itself contain FF D9.
 */
function findJpegEnd(data: Uint8Array): number {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return -1;
  let offset = 2;
  const MAX_SEGS = 8192;

  for (let i = 0; i < MAX_SEGS && offset + 4 <= data.length; i++) {
    if (data[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];

    // Standalone markers: no length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    // End of image.
    if (marker === 0xd9) return offset + 2;

    const length = readUint16LE.call(null, data, offset + 2);
    if (length < 2) return -1;

    // Start of scan: entropy-coded data follows until the next FF D9.
    if (marker === 0xda) {
      // Skip the SOS header.
      let scan = offset + 2 + length;
      // Scan for the real EOI, skipping FF 00 (byte stuffing) and RST markers.
      while (scan + 1 < data.length) {
        if (data[scan] === 0xff) {
          const next = data[scan + 1];
          if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
            scan += 2;
            continue;
          }
          if (next === 0xd9) return scan + 2;
          // Another marker segment — bail out.
          break;
        }
        scan++;
      }
      // No EOI found; treat end-of-file as end-of-image.
      return data.length;
    }

    const next = offset + 2 + length;
    if (next > data.length) return -1;
    offset = next;
  }
  return -1;
}

export function inspectJpegTrailingData(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return { anomalies, lsbFindings };
  }

  // Steghide and other tools stuff hints into COM segments.
  const scan = scanJpegSegments(data);
  for (const seg of scan) {
    if (seg.marker === 0xfe && seg.length > 2) {
      const text = latin1(data, seg.dataOffset, seg.length - 2).replace(
        /[^\x20-\x7e\n]/g,
        '.',
      );
      if (/\b\w+\s*[:=]\s*\S+/.test(text)) {
        anomalies.push({
          kind: 'metadata-injection',
          description: `JPEG COM segment contains tool-like directive: "${text.slice(0, 120)}"`,
          offset: seg.offset,
          length: seg.length,
          confidence: 'probable',
        });
      }
    }
  }

  const end = findJpegEnd(data);
  if (end > 0 && end < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - end} byte(s) after JPEG end-of-image.`,
      offset: end,
      length: data.length - end,
      confidence: 'confirmed',
    });

    const embedded = findEmbeddedSignatureAt(data, end);
    if (embedded) {
      anomalies.push({
        kind: 'appended-archive',
        description: `Appended payload starts with a ${embedded} signature.`,
        offset: end,
        length: data.length - end,
        confidence: 'confirmed',
      });
    }
  }

  // LSB extraction over the entropy-coded scan data. This is a heuristic:
  // JPEG DCT is lossy, so any LSB data survives only if it was encoded
  // before compression (rare) or written into the coefficients directly
  // (JSteg-style — needs a DCT-aware decoder we don't have).
  const sosStart = scan.find((s) => s.marker === 0xda);
  if (sosStart) {
    const start = sosStart.dataOffset + sosStart.length - 2;
    const bits: number[] = [];
    for (let i = start; i < data.length && bits.length < 8192 * 8; i++) {
      bits.push(data[i] & 1);
    }
    if (bits.length >= 64) {
      const decoded = packBits(Uint8Array.from(bits));
      if (longestPrintableRun(decoded) >= 6) {
        lsbFindings.push(
          summarizeLsb('JPEG-scan-LSB', 0, bits.length, decoded, start),
        );
      }
    }
  }

  return { anomalies, lsbFindings };
}

interface JpegSegment {
  marker: number;
  offset: number;
  length: number;
  dataOffset: number;
}

function scanJpegSegments(data: Uint8Array): JpegSegment[] {
  const out: JpegSegment[] = [];
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return out;
  let offset = 2;
  const MAX_SEGS = 8192;

  for (let i = 0; i < MAX_SEGS && offset + 4 <= data.length; i++) {
    if (data[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) break;
    if (offset + 4 > data.length) break;
    const length = (data[offset + 2] << 8) | data[offset + 3];
    if (length < 2) break;
    out.push({
      marker,
      offset,
      length,
      dataOffset: offset + 4,
    });
    if (marker === 0xda) break; // scan data follows; stop segment walk
    const next = offset + 2 + length;
    if (next > data.length) break;
    offset = next;
  }
  return out;
}

// ---------------------------------------------------------------------------
// GIF
// ---------------------------------------------------------------------------

export function inspectGif(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  if (data.length < 13) return { anomalies, lsbFindings };
  const header = asciiAt(data, 0, 6);
  if (header !== 'GIF87a' && header !== 'GIF89a') return { anomalies, lsbFindings };

  const packed = data[10];
  let offset = 13;
  if (packed & 0x80) {
    offset += 3 * (1 << ((packed & 0x07) + 1));
  }

  let frames = 0;
  const MAX = 8192;
  let guard = 0;
  while (offset < data.length && guard++ < MAX) {
    const b = data[offset];
    if (b === 0x3b) {
      if (offset + 1 < data.length) {
        anomalies.push({
          kind: 'trailing-data',
          description: `${data.length - offset - 1} byte(s) after GIF trailer.`,
          offset: offset + 1,
          length: data.length - offset - 1,
          confidence: 'confirmed',
        });
        const embedded = findEmbeddedSignatureAt(data, offset + 1);
        if (embedded) {
          anomalies.push({
            kind: 'appended-archive',
            description: `Appended payload starts with a ${embedded} signature.`,
            offset: offset + 1,
            length: data.length - offset - 1,
            confidence: 'confirmed',
          });
        }
      }
      break;
    }
    if (b === 0x21) {
      const label = data[offset + 1];
      if (label === 0xf9) {
        offset += 8;
      } else if (label === 0xfe || label === 0xff) {
        const start = offset + 2;
        let p = start;
        while (p < data.length && data[p] !== 0) {
          p += 1 + data[p];
        }
        const payload = latin1(data, start, p - start);
        const printable = payload.replace(/[^\x20-\x7e\n]/g, '.');
        if (label === 0xfe && longestPrintableRun(payload) >= 4) {
          anomalies.push({
            kind: 'metadata-injection',
            description: `GIF comment extension contains text: "${printable.slice(0, 120)}"`,
            offset,
            length: p - offset,
            confidence: 'probable',
          });
        }
        offset = p + 1;
      } else {
        let p = offset + 2;
        while (p < data.length && data[p] !== 0) p += 1 + data[p];
        offset = p + 1;
      }
    } else if (b === 0x2c) {
      frames++;
      if (offset + 10 > data.length) break;
      const p = data[offset + 9];
      offset += 10;
      if (p & 0x80) offset += 3 * (1 << ((p & 0x07) + 1));
      offset += 1;
      while (offset < data.length && data[offset] !== 0) {
        offset += 1 + data[offset];
      }
      offset += 1;
    } else {
      offset++;
    }
  }

  // GIF LSB is normally in the palette (each entry is 3 bytes RGB). We could
  // extract from image sub-block indices, but that requires LZW decoding.
  // Report the palette as a metadata-injection candidate when unusual.
  if (packed & 0x80) {
    const paletteSize = 3 * (1 << ((packed & 0x07) + 1));
    const paletteText = latin1(data, 13, paletteSize);
    if (longestPrintableRun(paletteText) >= 12) {
      anomalies.push({
        kind: 'structural-note',
        description: `GIF global colour table contains ${longestPrintableRun(paletteText)} bytes of printable run — palette may carry encoded text.`,
        offset: 13,
        length: paletteSize,
        confidence: 'unknown',
      });
    }
  }

  return { anomalies, lsbFindings };
}

// ---------------------------------------------------------------------------
// BMP
// ---------------------------------------------------------------------------

export function inspectBmp(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  if (data.length < 26 || data[0] !== 0x42 || data[1] !== 0x4d) {
    return { anomalies, lsbFindings };
  }

  const pixelDataOffset = readUint32LE(data, 10);
  const dibSize = readUint32LE(data, 14);
  const declaredFileSize = readUint32LE(data, 2);

  if (declaredFileSize > 0 && declaredFileSize < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - declaredFileSize} byte(s) beyond the declared BMP file size.`,
      offset: declaredFileSize,
      length: data.length - declaredFileSize,
      confidence: 'probable',
    });
  }

  // LSB of pixel data. 24-bit BGR is the common case.
  if (dibSize >= 40 && pixelDataOffset > 0 && pixelDataOffset < data.length) {
    const bitsPerPixel = data[28] | (data[29] << 8);
    if (bitsPerPixel === 24 || bitsPerPixel === 32) {
      const bits: number[] = [];
      for (let i = pixelDataOffset; i < data.length && bits.length < 8192 * 8; i++) {
        bits.push(data[i] & 1);
      }
      if (bits.length >= 64) {
        const decoded = packBits(Uint8Array.from(bits));
        if (longestPrintableRun(decoded) >= 6) {
          lsbFindings.push(
            summarizeLsb(`BMP-${bitsPerPixel}bpp-LSB`, 0, bits.length, decoded, pixelDataOffset),
          );
        }
      }
    }
  }

  return { anomalies, lsbFindings };
}

// ---------------------------------------------------------------------------
// WebP
// ---------------------------------------------------------------------------

export function inspectWebp(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  if (
    data.length < 16 ||
    asciiAt(data, 0, 4) !== 'RIFF' ||
    asciiAt(data, 8, 4) !== 'WEBP'
  ) {
    return { anomalies, lsbFindings };
  }

  const declaredSize = readUint32LE(data, 4);
  const declaredEnd = 8 + declaredSize;
  if (declaredSize > 0 && declaredEnd < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - declaredEnd} byte(s) beyond the declared WebP size.`,
      offset: declaredEnd,
      length: data.length - declaredEnd,
      confidence: 'probable',
    });
    const embedded = findEmbeddedSignatureAt(data, declaredEnd);
    if (embedded) {
      anomalies.push({
        kind: 'appended-archive',
        description: `Appended payload starts with a ${embedded} signature.`,
        offset: declaredEnd,
        length: data.length - declaredEnd,
        confidence: 'confirmed',
      });
    }
  }

  let offset = 12;
  while (offset + 8 <= data.length) {
    const id = asciiAt(data, offset, 4);
    const size = readUint32LE(data, offset + 4);
    if (!KNOWN_WEBP_CHUNKS.has(id)) {
      anomalies.push({
        kind: 'unknown-chunk',
        description: `Unknown WebP chunk '${id}' (${size} bytes).`,
        offset,
        length: size + 8,
        confidence: 'probable',
      });
    }
    offset += 8 + size + (size & 1);
  }

  return { anomalies, lsbFindings };
}

// ---------------------------------------------------------------------------
// WAV (audio)
// ---------------------------------------------------------------------------

export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataOffset: number;
  dataLength: number;
  format: 'PCM' | 'IEEE_FLOAT' | 'OTHER';
  audioFormatCode: number;
}

export function parseWavHeader(data: Uint8Array): WavInfo | null {
  if (
    data.length < 44 ||
    asciiAt(data, 0, 4) !== 'RIFF' ||
    asciiAt(data, 8, 4) !== 'WAVE'
  ) {
    return null;
  }

  let offset = 12;
  let fmt: {
    audioFormat: number;
    channels: number;
    sampleRate: number;
    bitsPerSample: number;
  } | null = null;
  let dataOffset = -1;
  let dataLength = 0;
  const MAX = 256;

  for (let i = 0; i < MAX && offset + 8 <= data.length; i++) {
    const id = asciiAt(data, offset, 4);
    const size = readUint32LE(data, offset + 4);
    const payload = offset + 8;

    if (id === 'fmt ' && size >= 16 && payload + 16 <= data.length) {
      fmt = {
        audioFormat: readUint16LE(data, payload),
        channels: readUint16LE(data, payload + 2),
        sampleRate: readUint32LE(data, payload + 4),
        bitsPerSample: readUint16LE(data, payload + 14),
      };
    } else if (id === 'data') {
      dataOffset = payload;
      dataLength = size;
      if (fmt) break;
    }

    offset = payload + size + (size & 1);
  }

  if (!fmt || dataOffset < 0) return null;
  const format: WavInfo['format'] =
    fmt.audioFormat === 1 ? 'PCM' : fmt.audioFormat === 3 ? 'IEEE_FLOAT' : 'OTHER';

  return {
    sampleRate: fmt.sampleRate,
    channels: fmt.channels,
    bitsPerSample: fmt.bitsPerSample,
    dataOffset,
    dataLength,
    format,
    audioFormatCode: fmt.audioFormat,
  };
}

export function inspectWav(data: Uint8Array): {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
  pcm: PcmData | null;
} {
  const anomalies: AnomalyFinding[] = [];
  const lsbFindings: LsbFinding[] = [];
  const info = parseWavHeader(data);
  if (!info) return { anomalies, lsbFindings, pcm: null };

  const declaredEnd = info.dataOffset + info.dataLength;
  if (declaredEnd < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - declaredEnd} byte(s) after the WAV data chunk.`,
      offset: declaredEnd,
      length: data.length - declaredEnd,
      confidence: 'confirmed',
    });
    const embedded = findEmbeddedSignatureAt(data, declaredEnd);
    if (embedded) {
      anomalies.push({
        kind: 'appended-archive',
        description: `Appended payload starts with a ${embedded} signature.`,
        offset: declaredEnd,
        length: data.length - declaredEnd,
        confidence: 'confirmed',
      });
    }
  }

  // Walk RIFF sub-chunks to look for unusual INFO metadata.
  let offset = 12;
  const MAX = 256;
  for (let i = 0; i < MAX && offset + 8 <= data.length; i++) {
    const id = asciiAt(data, offset, 4);
    const size = readUint32LE(data, offset + 4);
    const payload = offset + 8;
    if (id !== 'RIFF' && id !== 'fmt ' && id !== 'data' && !KNOWN_RIFF_CHUNKS.has(id)) {
      anomalies.push({
        kind: 'unknown-chunk',
        description: `Unknown RIFF chunk '${id}' (${size} bytes).`,
        offset,
        length: size + 8,
        confidence: 'probable',
      });
    }
    if (id === 'data') break;
    offset = payload + size + (size & 1);
  }

  const pcm = decodeWavToPcm(data, info);
  if (pcm) {
    lsbFindings.push(...extractAudioLsb(pcm, info.bitsPerSample));
  }

  return { anomalies, lsbFindings, pcm };
}

function decodeWavToPcm(data: Uint8Array, info: WavInfo): PcmData | null {
  if (info.format !== 'PCM') return null;
  const bytesPerSample = info.bitsPerSample / 8;
  if (![1, 2, 3, 4].includes(bytesPerSample)) return null;

  const end = Math.min(info.dataOffset + info.dataLength, data.length);
  const totalSamples = Math.floor((end - info.dataOffset) / bytesPerSample);
  const perChannel = Math.floor(totalSamples / info.channels);

  const channels: Float32Array[] = Array.from(
    { length: info.channels },
    () => new Float32Array(perChannel),
  );

  let pos = info.dataOffset;
  let maxSamples = perChannel * info.channels;
  for (let s = 0; s < maxSamples; s++) {
    const ch = s % info.channels;
    const idx = Math.floor(s / info.channels);
    let value = 0;
    if (bytesPerSample === 1) {
      value = (data[pos] - 128) / 128;
    } else if (bytesPerSample === 2) {
      const v = data[pos] | (data[pos + 1] << 8);
      const signed = v & 0x8000 ? v - 0x10000 : v;
      value = signed / 32768;
    } else if (bytesPerSample === 3) {
      const v = data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16);
      const signed = v & 0x800000 ? v - 0x1000000 : v;
      value = signed / 8388608;
    } else {
      const v =
        data[pos] | (data[pos + 1] << 8) | (data[pos + 2] << 16) | (data[pos + 3] << 24);
      value = v / 2147483648;
    }
    channels[ch][idx] = value;
    pos += bytesPerSample;
  }

  return { channels, sampleRate: info.sampleRate };
}

/**
 * Extract LSB from each PCM channel. Tries bit 0 first, then bit 1, then
 * both channels interleaved. The first extraction that yields a printable
 * run ≥ 6 bytes is kept.
 */
function extractAudioLsb(pcm: PcmData, bitsPerSample: number): LsbFinding[] {
  const results: LsbFinding[] = [];
  const MAX_BITS = 8192 * 8;
  const byteWidth = bitsPerSample / 8;

  // For 8-bit unsigned audio, "LSB" is bit 0 of the sample byte.
  // For 16/24/32-bit, it's bit 0 of the low byte.
  const bitIndices = byteWidth === 1 ? [0] : [0, 1];

  for (let ch = 0; ch < pcm.channels.length; ch++) {
    const channel = pcm.channels[ch];
    for (const bitIdx of bitIndices) {
      if (bitIdx * 8 >= bitsPerSample) continue;

      // Reconstruct the raw sample bytes. For 16-bit LE, sample bytes are
      // [low, high]; the LSB of the sample is bit 0 of the low byte. The
      // decoded PCM lost that, so we approximate by re-quantising.
      const bits: number[] = [];
      for (let i = 0; i < channel.length && bits.length < MAX_BITS; i++) {
        const raw =
          bytesPerSampleToInt(channel[i], bitsPerSample) |
          0;
        bits.push((raw >> bitIdx) & 1);
      }

      if (bits.length < 64) continue;
      const decoded = packBits(Uint8Array.from(bits));
      if (longestPrintableRun(decoded) < 6) continue;
      results.push(
        summarizeLsb(
          `audio-ch${ch}-bit${bitIdx}`,
          bitIdx,
          bits.length,
          decoded,
          0,
        ),
      );
    }
  }
  return results;
}

function bytesPerSampleToInt(value: number, bitsPerSample: number): number {
  if (bitsPerSample === 8) return Math.round((value + 1) * 127.5) & 0xff;
  if (bitsPerSample === 16) return Math.round(value * 32767) & 0xffff;
  if (bitsPerSample === 24) return Math.round(value * 8388607) & 0xffffff;
  return Math.round(value * 2147483647) | 0;
}

// ---------------------------------------------------------------------------
// MP3 / FLAC / OGG — metadata-level checks only.
//
// Full LSB extraction requires a decoder; we surface structural anomalies
// and metadata that CTF challenges commonly stuff.
// ---------------------------------------------------------------------------

export function inspectMp3(data: Uint8Array): AnomalyFinding[] {
  const anomalies: AnomalyFinding[] = [];
  // ID3v2 header: "ID3" + version(2) + flags(1) + size(4, synchsafe)
  if (asciiAt(data, 0, 3) === 'ID3' && data.length >= 10) {
    const size =
      ((data[6] & 0x7f) << 21) |
      ((data[7] & 0x7f) << 14) |
      ((data[8] & 0x7f) << 7) |
      (data[9] & 0x7f);
    const end = 10 + size;
    if (end > data.length) {
      anomalies.push({
        kind: 'structural-note',
        description: `ID3v2 tag declares ${size} bytes but only ${data.length - 10} are present.`,
        offset: 0,
        length: data.length,
        confidence: 'confirmed',
      });
    } else {
      anomalies.push({
        kind: 'metadata-injection',
        description: `ID3v2 tag present (${size} bytes). Inspect for embedded comments, lyrics, or attached pictures.`,
        offset: 0,
        length: end,
        confidence: 'confirmed',
      });
    }
  }
  // Trailing data after ID3v1 (128-byte "TAG" block at end).
  if (data.length >= 128) {
    const tail = asciiAt(data, data.length - 128, 3);
    if (tail === 'TAG' && data.length > 128) {
      const before = data.length - 128;
      const embedded = findEmbeddedSignatureAt(data, before);
      if (embedded) {
        anomalies.push({
          kind: 'appended-archive',
          description: `A ${embedded} signature sits just before the ID3v1 tag — likely appended payload.`,
          offset: before,
          length: 0,
          confidence: 'probable',
        });
      }
    }
  }
  return anomalies;
}

export function inspectFlac(data: Uint8Array): AnomalyFinding[] {
  const anomalies: AnomalyFinding[] = [];
  if (asciiAt(data, 0, 4) !== 'fLaC') return anomalies;

  let offset = 4;
  const MAX = 256;
  for (let i = 0; i < MAX && offset + 4 <= data.length; i++) {
    const header = data[offset];
    const last = (header & 0x80) !== 0;
    const type = header & 0x7f;
    const size =
      (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];

    if (type === 4) {
      anomalies.push({
        kind: 'metadata-injection',
        description: 'FLAC Vorbis comment block present — check for embedded comments.',
        offset,
        length: size + 4,
        confidence: 'confirmed',
      });
    } else if (type === 6) {
      anomalies.push({
        kind: 'metadata-injection',
        description: 'FLAC picture block present — may contain embedded image.',
        offset,
        length: size + 4,
        confidence: 'confirmed',
      });
    }

    offset += 4 + size;
    if (last) break;
  }

  if (offset < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - offset} byte(s) after the last FLAC metadata block.`,
      offset,
      length: data.length - offset,
      confidence: 'probable',
    });
  }
  return anomalies;
}

export function inspectOgg(data: Uint8Array): AnomalyFinding[] {
  const anomalies: AnomalyFinding[] = [];
  if (asciiAt(data, 0, 4) !== 'OggS') return anomalies;

  // Ogg pages: "OggS" + version(1) + type(1) + granule(8) + serial(4) +
  // seq(4) + crc(4) + segCount(1) + segTable(N)
  let offset = 0;
  let pages = 0;
  const MAX = 4096;

  while (offset + 27 <= data.length && pages++ < MAX) {
    if (asciiAt(data, offset, 4) !== 'OggS') break;
    const segCount = data[offset + 26];
    let pageLen = 27 + segCount;
    for (let i = 0; i < segCount; i++) pageLen += data[offset + 27 + i];
    offset += pageLen;
  }

  if (offset < data.length) {
    anomalies.push({
      kind: 'trailing-data',
      description: `${data.length - offset} byte(s) after the last Ogg page.`,
      offset,
      length: data.length - offset,
      confidence: 'probable',
    });
    const embedded = findEmbeddedSignatureAt(data, offset);
    if (embedded) {
      anomalies.push({
        kind: 'appended-archive',
        description: `Appended payload starts with a ${embedded} signature.`,
        offset,
        length: data.length - offset,
        confidence: 'confirmed',
      });
    }
  }
  return anomalies;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export interface StegoResult {
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
  /** Decoded PCM when the input is a raw WAV we can parse. */
  pcm: PcmData | null;
}

export function inspectForAnomalies(
  data: Uint8Array,
  detectedFormat: string,
): StegoResult {
  const empty: StegoResult = { anomalies: [], lsbFindings: [], pcm: null };

  switch (detectedFormat) {
    case 'PNG image': {
      const r = inspectPngChunks(data);
      return { ...r, pcm: null };
    }
    case 'JPEG image': {
      const r = inspectJpegTrailingData(data);
      return { ...r, pcm: null };
    }
    case 'GIF image': {
      const r = inspectGif(data);
      return { ...r, pcm: null };
    }
    case 'BMP image': {
      const r = inspectBmp(data);
      return { ...r, pcm: null };
    }
    case 'WebP image': {
      const r = inspectWebp(data);
      return { ...r, pcm: null };
    }
    case 'WAV audio': {
      const r = inspectWav(data);
      return { anomalies: r.anomalies, lsbFindings: r.lsbFindings, pcm: r.pcm };
    }
    case 'MP3 audio':
      return { anomalies: inspectMp3(data), lsbFindings: [], pcm: null };
    case 'FLAC audio':
      return { anomalies: inspectFlac(data), lsbFindings: [], pcm: null };
    case 'OGG audio':
      return { anomalies: inspectOgg(data), lsbFindings: [], pcm: null };
    default:
      return empty;
  }
}

// ---------------------------------------------------------------------------
// Backwards-compatible aliases. The old module exported `inspectPngChunks`
// returning only AnomalyFinding[]; keep a thin adapter for existing callers.
// ---------------------------------------------------------------------------

export function inspectPngChunksLegacy(data: Uint8Array): AnomalyFinding[] {
  return inspectPngChunks(data).anomalies;
}

export function inspectJpegTrailingDataLegacy(data: Uint8Array): AnomalyFinding[] {
  return inspectJpegTrailingData(data).anomalies;
}