import type { EmbeddedFileCandidate } from "../types/fileAnalysis";

interface EmbeddedSignatureDef {
  format: string;
  mime: string;
  extension: string;
  bytes: number[];
  /** When present, used to try to locate a reliable end offset. */
  findEnd?: (data: Uint8Array, startOffset: number) => number | null;
}

function findBytes(data: Uint8Array, pattern: number[], fromOffset: number): number | null {
  outer: for (let i = fromOffset; i <= data.length - pattern.length; i++) {
    for (let j = 0; j < pattern.length; j++) {
      if (data[i + j] !== pattern[j]) continue outer;
    }
    return i;
  }
  return null;
}

/** JPEG ends at the EOI marker FF D9. */
function findJpegEnd(data: Uint8Array, start: number): number | null {
  const idx = findBytes(data, [0xff, 0xd9], start + 3);
  return idx === null ? null : idx + 2;
}

/** PNG ends after the IEND chunk (4-byte length=0, "IEND", 4-byte CRC). */
function findPngEnd(data: Uint8Array, start: number): number | null {
  const iend = [0x49, 0x45, 0x4e, 0x44];
  const idx = findBytes(data, iend, start + 8);
  if (idx === null) return null;
  return idx + 4 + 4; // "IEND" + CRC32
}

/** PDF conventionally ends at the last "%%EOF" marker. */
function findPdfEnd(data: Uint8Array, start: number): number | null {
  const marker = [0x25, 0x25, 0x45, 0x4f, 0x46]; // %%EOF
  let lastEnd: number | null = null;
  let searchFrom = start;
  while (true) {
    const idx = findBytes(data, marker, searchFrom);
    if (idx === null) break;
    lastEnd = idx + marker.length;
    searchFrom = idx + marker.length;
  }
  return lastEnd;
}

const EMBEDDED_SIGNATURES: EmbeddedSignatureDef[] = [
  {
    format: "PNG",
    mime: "image/png",
    extension: ".png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    findEnd: findPngEnd,
  },
  {
    format: "JPEG",
    mime: "image/jpeg",
    extension: ".jpg",
    bytes: [0xff, 0xd8, 0xff],
    findEnd: findJpegEnd,
  },
  {
    format: "PDF",
    mime: "application/pdf",
    extension: ".pdf",
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2d],
    findEnd: findPdfEnd,
  },
  {
    format: "ZIP",
    mime: "application/zip",
    extension: ".zip",
    bytes: [0x50, 0x4b, 0x03, 0x04],
  },
  {
    format: "GIF",
    mime: "image/gif",
    extension: ".gif",
    bytes: [0x47, 0x49, 0x46, 0x38],
  },
];

export interface ReconstructorOptions {
  maxCandidatesPerFormat?: number;
  maxTotalCandidates?: number;
}

/**
 * Searches the whole buffer (not just offset 0) for known file signatures,
 * to support "embedded file" / recovery-candidate workflows. Offsets found
 * beyond a reasonable candidate cap are ignored rather than exhaustively
 * enumerated, to keep this bounded on large files.
 */
export function findEmbeddedCandidates(
  data: Uint8Array,
  options: ReconstructorOptions = {}
): EmbeddedFileCandidate[] {
  const maxPerFormat = options.maxCandidatesPerFormat ?? 25;
  const maxTotal = options.maxTotalCandidates ?? 100;
  const candidates: EmbeddedFileCandidate[] = [];
  let id = 0;

  for (const sig of EMBEDDED_SIGNATURES) {
    let searchFrom = 0;
    let foundForFormat = 0;
    while (foundForFormat < maxPerFormat && candidates.length < maxTotal) {
      const offset = findBytes(data, sig.bytes, searchFrom);
      if (offset === null) break;

      const endOffset = sig.findEnd ? sig.findEnd(data, offset) : null;
      const isAtStart = offset === 0;

      candidates.push({
        id: id++,
        format: sig.format,
        mime: sig.mime,
        signatureHex: sig.bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "),
        offset,
        endOffset,
        // Signature at offset 0 spanning most of the file is the "whole file
        // is this format" case, not a hidden embedded file -- still reported,
        // but callers can filter by offset === 0 if only embedded matches matter.
        confidence: isAtStart ? "probable" : "probable",
        suggestedExtension: sig.extension,
      });

      foundForFormat++;
      searchFrom = offset + sig.bytes.length;
    }
  }

  return candidates.sort((a, b) => a.offset - b.offset);
}

/** Extracts a candidate's byte range as a new Uint8Array (for export). */
export function extractCandidateBytes(
  data: Uint8Array,
  offset: number,
  endOffset: number | null
): Uint8Array {
  const end = endOffset ?? data.length;
  const safeEnd = Math.max(offset, Math.min(end, data.length));
  return data.slice(offset, safeEnd);
}
