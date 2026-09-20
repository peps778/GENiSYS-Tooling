import { FILE_SIGNATURES, RIFF_SUBTYPES } from "./fileSignatures";
import type {
  FileIdentification,
  SignatureMatch,
} from "../types/fileAnalysis";

/** Reads N bytes from `data` starting at `offset`, or null if out of range. */
function sliceSafe(data: Uint8Array, offset: number, length: number): Uint8Array | null {
  if (offset < 0 || offset + length > data.length) return null;
  return data.subarray(offset, offset + length);
}

function matchesAt(data: Uint8Array, offset: number, pattern: (number | null)[]): boolean {
  const slice = sliceSafe(data, offset, pattern.length);
  if (!slice) return false;
  for (let i = 0; i < pattern.length; i++) {
    const expected = pattern[i];
    if (expected === null) continue;
    if (slice[i] !== expected) return false;
  }
  return true;
}

function toHexPreview(data: Uint8Array, offset: number, count = 8): string {
  const slice = sliceSafe(data, offset, Math.min(count, data.length - offset));
  if (!slice || slice.length === 0) return "";
  return Array.from(slice)
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

/**
 * Scans the known signature table and returns every match found. Handles
 * the RIFF container special case (WAV/WebP) by checking the 4-byte
 * subtype tag at offset 8.
 */
export function findSignatureMatches(data: Uint8Array): SignatureMatch[] {
  const matches: SignatureMatch[] = [];

  for (const sig of FILE_SIGNATURES) {
    if (!matchesAt(data, sig.offset, sig.bytes)) continue;

    if (sig.format === "WAV audio" || sig.format === "WebP image") {
      // Disambiguate RIFF subtype instead of emitting the generic guess twice.
      const subtypeBytes = sliceSafe(data, 8, 4);
      const subtype = subtypeBytes ? new TextDecoder("ascii").decode(subtypeBytes) : "";
      const resolved = RIFF_SUBTYPES[subtype];
      if (resolved && resolved.format === sig.format) {
        matches.push({
          format: resolved.format,
          mime: resolved.mime,
          extensions: resolved.extensions,
          magicHex: `${toHexPreview(data, 0, 4)} .. ${subtype}`,
          offset: 0,
          confidence: "confirmed",
          reason: `RIFF container with '${subtype}' subtype confirmed`,
        });
      }
      continue;
    }

    matches.push({
      format: sig.format,
      mime: sig.mime,
      extensions: sig.extensions,
      magicHex: toHexPreview(data, sig.offset, sig.bytes.length),
      offset: sig.offset,
      confidence: sig.confidence,
      reason: sig.reason,
    });
  }

  return matches;
}

/**
 * Normalizes a filename's extension, lower-cased and including the leading
 * dot (e.g. "photo.JPG" -> ".jpg"). Returns "" when there is no extension.
 */
export function extractReportedExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  // idx <= 0 covers "no dot" and "dotfile with no extension" (e.g. ".gitignore").
  if (idx <= 0 || idx === filename.length - 1) return "";
  return filename.slice(idx).toLowerCase();
}

/**
 * Identifies a file from its contents. Extension is used only for
 * mismatch detection -- it never upgrades a match's confidence.
 */
export function identifyFile(data: Uint8Array, filename: string): FileIdentification {
  const candidates = findSignatureMatches(data);
  const reportedExtension = extractReportedExtension(filename);

  // Prefer confirmed matches over probable ones; keep original order otherwise.
  const best =
    candidates.find((c) => c.confidence === "confirmed") ??
    candidates.find((c) => c.confidence === "probable") ??
    null;

  const expectedExtensions = best ? best.extensions : [];
  const extensionMismatch =
    best !== null &&
    reportedExtension !== "" &&
    !expectedExtensions.includes(reportedExtension);

  if (!best) {
    return {
      detectedType: "Unknown",
      mime: null,
      reportedExtension,
      expectedExtensions: [],
      signature: null,
      candidates,
      confidence: "unknown",
      extensionMismatch: false,
    };
  }

  return {
    detectedType: best.format,
    mime: best.mime,
    reportedExtension,
    expectedExtensions,
    signature: best,
    candidates,
    confidence: best.confidence,
    extensionMismatch,
  };
}
