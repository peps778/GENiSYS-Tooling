/**
 * Domain types for the Forensics / File Analysis module.
 *
 * These types describe the shape of forensic findings only. They make no
 * claims beyond what the analysis code can actually support -- confidence
 * levels are first-class so the UI can distinguish confirmed evidence from
 * probable or unknown results.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** How strongly the evidence supports a given finding. */
export type Confidence = "confirmed" | "probable" | "unknown";

/** A byte offset within a file. Always a non-negative integer. */
export type ByteOffset = number;

// ---------------------------------------------------------------------------
// File identification
// ---------------------------------------------------------------------------

export interface SignatureMatch {
  /** Canonical format name, e.g. "PNG image" */
  format: string;
  /** MIME type, when known. */
  mime: string | null;
  /** Common extension(s) for this format, e.g. [".png"] */
  extensions: string[];
  /** The magic bytes that were matched, as hex pairs, e.g. "89 50 4E 47" */
  magicHex: string;
  /** Offset in the buffer where the signature was found. */
  offset: ByteOffset;
  /** How confident this match is. */
  confidence: Confidence;
  /** Short human-readable reason, e.g. "Signature match at offset 0x00". */
  reason: string;
}

export interface FileIdentification {
  /** Best-guess canonical type name, or "Unknown" if nothing matched. */
  detectedType: string;
  mime: string | null;
  /** Extension reported by the filename, e.g. ".jpg" (may be empty string). */
  reportedExtension: string;
  /** Extension(s) implied by the detected signature, if any. */
  expectedExtensions: string[];
  /** The winning signature match, if any. */
  signature: SignatureMatch | null;
  /** All signature matches found at offset 0 or via structural checks. */
  candidates: SignatureMatch[];
  confidence: Confidence;
  /** True when the reported extension conflicts with the detected signature. */
  extensionMismatch: boolean;
}

// ---------------------------------------------------------------------------
// Format guessing (combines multiple evidence sources)
// ---------------------------------------------------------------------------

export interface FormatGuessEvidence {
  source: "signature" | "structural" | "mime" | "extension";
  value: string;
  weight: number;
}

export interface FormatGuessResult {
  bestGuess: string;
  mime: string | null;
  confidence: Confidence;
  evidence: FormatGuessEvidence[];
  conflict: boolean;
  conflictDetail: string | null;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export type MetadataFieldStatus = "available" | "unavailable" | "not-applicable";

export interface MetadataField {
  label: string;
  value: string | number | null;
  status: MetadataFieldStatus;
}

export type MetadataCategory =
  | "generic"
  | "image"
  | "pdf"
  | "archive"
  | "audio";

export interface FileMetadata {
  category: MetadataCategory;
  fields: MetadataField[];
  /** Free-text notes about extraction limitations, if any. */
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Strings extraction
// ---------------------------------------------------------------------------

export type StringEncoding = "ascii" | "utf8";

export interface StringMatch {
  id: number;
  value: string;
  offset: ByteOffset;
  length: number;
  encoding: StringEncoding;
}

export interface StringExtractionResult {
  matches: StringMatch[];
  /** Total matches found before any pagination/truncation was applied. */
  totalFound: number;
  truncated: boolean;
  minLength: number;
}

// ---------------------------------------------------------------------------
// Hex inspection
// ---------------------------------------------------------------------------

export interface HexRow {
  offset: ByteOffset;
  hex: string[];
  ascii: string;
}

export interface HexRange {
  startOffset: ByteOffset;
  endOffset: ByteOffset;
  bytesPerRow: number;
  rows: HexRow[];
}

// ---------------------------------------------------------------------------
// Image analysis
// ---------------------------------------------------------------------------

export interface ImageInformation {
  format: string;
  mime: string | null;
  width: number | null;
  height: number | null;
  hasAlpha: boolean | null;
  colorInfo: string | null;
  exifAvailable: boolean;
  exif: Record<string, string> | null;
  objectUrl: string | null;
}

// ---------------------------------------------------------------------------
// Archive inspection
// ---------------------------------------------------------------------------

export interface ArchiveEntry {
  name: string;
  isDirectory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: string;
}

export interface ArchiveInformation {
  archiveType: "zip" | "unsupported";
  entryCount: number;
  entries: ArchiveEntry[];
  supported: boolean;
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Steganography / anomaly helpers
// ---------------------------------------------------------------------------

export type AnomalyKind =
  | "trailing-data"
  | "unknown-chunk"
  | "embedded-signature"
  | "structural-note";

export interface AnomalyFinding {
  kind: AnomalyKind;
  description: string;
  offset: ByteOffset | null;
  length: number | null;
  confidence: Confidence;
}

// ---------------------------------------------------------------------------
// Embedded file / recovery candidates
// ---------------------------------------------------------------------------

export interface EmbeddedFileCandidate {
  id: number;
  format: string;
  mime: string | null;
  signatureHex: string;
  offset: ByteOffset;
  /** End offset, only when a reliable end-of-data marker was found. */
  endOffset: ByteOffset | null;
  confidence: Confidence;
  suggestedExtension: string;
}

// ---------------------------------------------------------------------------
// Binary analysis
// ---------------------------------------------------------------------------

export interface ByteFrequencyEntry {
  byte: number;
  count: number;
}

export interface BinaryStatistics {
  sizeBytes: number;
  /** Shannon entropy estimate, 0-8 bits/byte. */
  entropyEstimate: number;
  printableRatio: number;
  nullByteRatio: number;
  /** Top byte-frequency entries, sorted descending by count. */
  topBytes: ByteFrequencyEntry[];
  detectedTextRegions: { offset: ByteOffset; length: number }[];
}

// ---------------------------------------------------------------------------
// Overall analysis status / progress
// ---------------------------------------------------------------------------

export type AnalysisStage =
  | "idle"
  | "reading"
  | "identifying"
  | "analyzing"
  | "extracting"
  | "scanning"
  | "hashing"
  | "ready"
  | "error"
  | "cancelled";

export interface AnalysisProgress {
  stage: AnalysisStage;
  /** 0-100 when measurable, null for indeterminate progress. */
  percent: number | null;
  message: string;
  processedBytes: number | null;
  totalBytes: number | null;
  startedAt: number | null;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Loaded file summary
// ---------------------------------------------------------------------------

export interface LoadedFileSummary {
  name: string;
  sizeBytes: number;
  lastModified: number;
  reportedMime: string;
  identification: FileIdentification | null;
  sha256: string | null;
}

// ---------------------------------------------------------------------------
// Aggregate analysis result (what the worker resolves with)
// ---------------------------------------------------------------------------

export interface AnalysisResult {
  identification: FileIdentification;
  metadata: FileMetadata;
  strings: StringExtractionResult | null;
  binaryStatistics: BinaryStatistics | null;
  embeddedCandidates: EmbeddedFileCandidate[];
  anomalies: AnomalyFinding[];
  archive: ArchiveInformation | null;
  image: ImageInformation | null;
  sha256: string | null;
}
