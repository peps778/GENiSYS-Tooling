/**
 * heapSnapshotParser.ts
 *
 * Pure, framework-free parsing logic for heap/memory snapshot files.
 * Nothing here touches the DOM or React, so it can run inside the worker
 * AND be unit tested directly on the main thread.
 *
 * Strategy:
 *   1. Try to decode the buffer as UTF-8 JSON and detect a V8/Chromium
 *      heap-snapshot shape (nodes/edges/strings arrays).
 *   2. If that fails (invalid JSON, or JSON but not a recognizable heap
 *      snapshot), fall back to raw printable-string extraction so the
 *      tool still produces useful output for malformed, truncated,
 *      Firefox-compatible, or otherwise unknown snapshot formats.
 */

import type { HeapSnapshotFormat, HeapSummary } from "../types/heap";

export interface ParsedHeapData {
  summary: HeapSummary;
  strings: string[];
}

interface V8SnapshotShape {
  snapshot?: {
    node_count?: number;
    edge_count?: number;
    meta?: unknown;
  };
  strings?: unknown;
}

const MIN_PRINTABLE_RUN = 4;
/** Snapshots larger than this are still processed, but we surface a warning. */
const LARGE_FILE_WARNING_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * Attempts to identify whether a decoded JSON payload looks like a
 * V8/Chromium heap snapshot. We intentionally check structural shape
 * rather than requiring every field, since snapshot schemas vary
 * slightly across Chromium versions.
 */
export function isV8SnapshotShape(value: unknown): value is V8SnapshotShape {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const hasSnapshotMeta =
    typeof v.snapshot === "object" &&
    v.snapshot !== null &&
    ("node_count" in (v.snapshot as object) || "meta" in (v.snapshot as object));
  const hasStrings = Array.isArray(v.strings);
  return hasSnapshotMeta && hasStrings;
}

export type FormatDetectionResult =
  | { format: "v8-json"; data: V8SnapshotShape }
  | { format: "unknown" }
  | { format: "malformed"; reason: string };

/**
 * Detects the snapshot format from raw bytes without throwing.
 * Decoding is attempted once; large inputs are handled by TextDecoder
 * which streams internally rather than allocating multiple copies.
 */
export function detectFormat(buffer: ArrayBuffer): FormatDetectionResult {
  if (buffer.byteLength === 0) {
    return { format: "malformed", reason: "Empty file" };
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  } catch (err) {
    return { format: "unknown" };
  }

  const trimmed = text.trimStart();
  const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksLikeJson) {
    return { format: "unknown" };
  }

  try {
    const parsed = JSON.parse(text);
    if (isV8SnapshotShape(parsed)) {
      return { format: "v8-json", data: parsed };
    }
    // Valid JSON, but not a recognizable heap-snapshot shape.
    return { format: "unknown" };
  } catch (err) {
    // Looked like JSON but failed to parse: malformed/truncated file.
    const reason = err instanceof Error ? err.message : "Invalid JSON";
    return { format: "malformed", reason };
  }
}

/**
 * Extracts the `strings` table from a validated V8 snapshot shape.
 * V8 heap snapshots store all string content in a flat `strings` array,
 * which is exactly the data most useful for secret/credential scanning.
 */
export function extractV8Strings(data: V8SnapshotShape): string[] {
  if (!Array.isArray(data.strings)) return [];
  return data.strings.filter((s): s is string => typeof s === "string");
}

/**
 * Format-agnostic printable-string extraction, similar in spirit to the
 * Unix `strings` utility. Used as a fallback for malformed, truncated,
 * Firefox-compatible, or otherwise unrecognized snapshot formats, and
 * also useful as a raw safety net even for V8 snapshots with unusual
 * encodings.
 */
export function extractPrintableStrings(
  buffer: ArrayBuffer,
  minLength: number = MIN_PRINTABLE_RUN
): string[] {
  const bytes = new Uint8Array(buffer);
  const results: string[] = [];
  let current: number[] = [];

  const flush = () => {
    if (current.length >= minLength) {
      // Build in chunks to avoid blowing the call stack via a spread
      // of a very large array on pathological inputs (e.g. a file
      // with megabytes of contiguous printable bytes).
      let out = "";
      const CHUNK = 8192;
      for (let i = 0; i < current.length; i += CHUNK) {
        out += String.fromCharCode(...current.slice(i, i + CHUNK));
      }
      results.push(out);
    }
    current = [];
  };

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII range, plus tab.
    if ((byte >= 0x20 && byte <= 0x7e) || byte === 0x09) {
      current.push(byte);
    } else {
      flush();
    }
  }
  flush();

  return results;
}

/**
 * Top-level orchestration: given raw bytes, produce a summary plus the
 * flat list of extracted strings that downstream panels operate on.
 * This function never throws for malformed input; failures degrade to
 * printable-string extraction with a warning instead.
 */
export function parseHeapSnapshot(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): ParsedHeapData {
  const startedAt = Date.now();
  const warnings: string[] = [];

  if (fileSize > LARGE_FILE_WARNING_BYTES) {
    warnings.push(
      `File is ${(fileSize / (1024 * 1024)).toFixed(0)} MB. Processing large files may take a while.`
    );
  }

  const detection = detectFormat(buffer);

  let format: HeapSnapshotFormat;
  let strings: string[];
  let nodeCount: number | undefined;
  let edgeCount: number | undefined;

  if (detection.format === "v8-json") {
    format = "v8-json";
    strings = extractV8Strings(detection.data);
    nodeCount = detection.data.snapshot?.node_count;
    edgeCount = detection.data.snapshot?.edge_count;
    if (strings.length === 0) {
      warnings.push("Recognized V8 snapshot shape but found no string table entries.");
    }
  } else {
    if (detection.format === "malformed") {
      format = "malformed";
      warnings.push(`Could not parse as JSON (${detection.reason}). Falling back to raw string extraction.`);
    } else {
      format = "unknown";
      warnings.push("Snapshot format not recognized as V8 JSON. Falling back to raw string extraction.");
    }
    strings = extractPrintableStrings(buffer);
  }

  const totalStringBytes = strings.reduce((sum, s) => sum + s.length, 0);

  const summary: HeapSummary = {
    fileName,
    fileSizeBytes: fileSize,
    format,
    nodeCount,
    edgeCount,
    stringCount: strings.length,
    totalStringBytes,
    parseTimeMs: Date.now() - startedAt,
    warnings,
  };

  return { summary, strings };
}
