import type { AnomalyFinding } from '../types/fileAnalysis';

const KNOWN_PNG_CHUNK_TYPES = new Set([
  'IHDR',
  'PLTE',
  'IDAT',
  'IEND',
  'tRNS',
  'cHRM',
  'gAMA',
  'iCCP',
  'sBIT',
  'sRGB',
  'tEXt',
  'zTXt',
  'iTXt',
  'bKGD',
  'hIST',
  'pHYs',
  'sPLT',
  'tIME',
  'acTL',
  'fcTL',
  'fdAT', // APNG extensions, commonly seen and legitimate
]);

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  );
}

/**
 * Walks PNG chunks and flags unknown chunk types. Does not claim hidden
 * data exists -- an unknown chunk type is reported as a candidate anomaly
 * for the analyst to inspect, nothing more.
 */
export function inspectPngChunks(data: Uint8Array): AnomalyFinding[] {
  const findings: AnomalyFinding[] = [];
  if (data.length < 8 || data[0] !== 0x89 || data[1] !== 0x50) return findings;

  let offset = 8;
  let iendOffset: number | null = null;

  while (offset + 8 <= data.length) {
    const length = readUint32BE(data, offset);
    const type = String.fromCharCode(
      data[offset + 4],
      data[offset + 5],
      data[offset + 6],
      data[offset + 7],
    );

    if (!KNOWN_PNG_CHUNK_TYPES.has(type)) {
      findings.push({
        kind: 'unknown-chunk',
        description: `Unknown PNG chunk type '${type}'`,
        offset,
        length: length + 12,
        confidence: 'probable',
      });
    }

    if (type === 'IEND') {
      iendOffset = offset + 12; // header(8) + length already counted; IEND has 0-length data + 4-byte CRC
      break;
    }

    offset += 8 + length + 4; // length field + type(4) + data + CRC(4)
    if (length < 0 || offset > data.length) break;
  }

  if (iendOffset !== null && iendOffset < data.length) {
    findings.push({
      kind: 'trailing-data',
      description: `${data.length - iendOffset} byte(s) found after the IEND chunk`,
      offset: iendOffset,
      length: data.length - iendOffset,
      confidence: 'probable',
    });
  }

  return findings;
}

/**
 * Checks for bytes after a JPEG's End-Of-Image (FFD9) marker. JPEGs can
 * legitimately contain some trailer content, so this is reported as a
 * candidate observation, not a definitive finding.
 */
export function inspectJpegTrailingData(data: Uint8Array): AnomalyFinding[] {
  const findings: AnomalyFinding[] = [];
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return findings;

  // Find the last FFD9 marker (EOI is normally the final two bytes of a JPEG).
  for (let i = data.length - 2; i >= 2; i--) {
    if (data[i] === 0xff && data[i + 1] === 0xd9) {
      const trailingLength = data.length - (i + 2);
      if (trailingLength > 0) {
        findings.push({
          kind: 'trailing-data',
          description: `${trailingLength} byte(s) found after the JPEG end-of-image marker`,
          offset: i + 2,
          length: trailingLength,
          confidence: 'probable',
        });
      }
      break;
    }
  }
  return findings;
}

/**
 * Runs the appropriate format-specific anomaly checks for the detected
 * format. Returns an empty array (not an error) for formats without a
 * dedicated check -- absence of findings is not evidence of absence.
 */
export function inspectForAnomalies(
  data: Uint8Array,
  detectedFormat: string,
): AnomalyFinding[] {
  switch (detectedFormat) {
    case 'PNG image':
      return inspectPngChunks(data);
    case 'JPEG image':
      return inspectJpegTrailingData(data);
    default:
      return [];
  }
}
