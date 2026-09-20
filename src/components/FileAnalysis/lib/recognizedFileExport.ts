import type { AnalysisResult, FileIdentification } from "../types/fileAnalysis";
import { decodeAsciiBitstream } from "./binaryTextDecoder";

export interface RecognizedFileExport {
  bytes: Uint8Array;
  extension: string;
  mime: string | null;
  formatLabel: string;
  /** True when the whole file's own bytes are the recognized format (no decoding needed). */
  isWholeFile: boolean;
}

/**
 * Determines whether there's an actual reconstructable file to export --
 * either because the file's own bytes are already a recognized format, or
 * because a whole-file text encoding (e.g. ASCII binary-text) was decoded
 * into one. Returns null when there's nothing concrete to export (e.g. the
 * only evidence is an embedded candidate at a non-zero offset -- those are
 * exported individually, since each one needs its own offset/length
 * decision rather than a single whole-file export).
 */
export function getRecognizedFileExport(
  result: AnalysisResult,
  rawData: Uint8Array
): RecognizedFileExport | null {
  const whole = result.identification;
  if (whole.confidence !== "unknown" && whole.expectedExtensions.length > 0) {
    return {
      bytes: rawData,
      extension: whole.expectedExtensions[0],
      mime: whole.mime,
      formatLabel: whole.detectedType,
      isWholeFile: true,
    };
  }

  if (result.encodedContent) {
    const decodedId: FileIdentification = result.encodedContent.decodedIdentification;
    if (decodedId.expectedExtensions.length > 0) {
      const decoded = decodeAsciiBitstream(rawData);
      if (decoded) {
        return {
          bytes: decoded,
          extension: decodedId.expectedExtensions[0],
          mime: decodedId.mime,
          formatLabel: decodedId.detectedType,
          isWholeFile: false,
        };
      }
    }
  }

  return null;
}

/** Swaps a filename's extension rather than appending one, so "digits.bin" -> "digits.jpg". */
export function withExtension(filename: string, extension: string): string {
  const idx = filename.lastIndexOf(".");
  const base = idx > 0 ? filename.slice(0, idx) : filename;
  return `${base}${extension}`;
}
