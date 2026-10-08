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
export type Confidence = 'confirmed' | 'probable' | 'unknown';

/** A byte offset within a file. Always a non-negative integer. */
export type ByteOffset = number;

// ---------------------------------------------------------------------------
// File identification
// ---------------------------------------------------------------------------

export interface SignatureMatch {
  format: string;
  mime: string | null;
  extensions: string[];
  magicHex: string;
  offset: ByteOffset;
  confidence: Confidence;
  reason: string;
}

export interface FileIdentification {
  detectedType: string;
  mime: string | null;
  reportedExtension: string;
  expectedExtensions: string[];
  signature: SignatureMatch | null;
  candidates: SignatureMatch[];
  confidence: Confidence;
  extensionMismatch: boolean;
}

// ---------------------------------------------------------------------------
// Format guessing
// ---------------------------------------------------------------------------

export interface FormatGuessEvidence {
  source: 'signature' | 'structural' | 'mime' | 'extension';
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

export type MetadataFieldStatus =
  'available' | 'unavailable' | 'not-applicable';

export interface MetadataField {
  label: string;
  value: string | number | null;
  status: MetadataFieldStatus;
}

export type MetadataCategory =
  'generic' | 'image' | 'pdf' | 'archive' | 'audio';

export interface FileMetadata {
  category: MetadataCategory;
  fields: MetadataField[];
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Strings extraction
// ---------------------------------------------------------------------------

export type StringEncoding = 'ascii' | 'utf8';

export interface StringMatch {
  id: number;
  value: string;
  offset: ByteOffset;
  length: number;
  encoding: StringEncoding;
}

export interface StringExtractionResult {
  matches: StringMatch[];
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

export interface ImageChunk {
  kind: string;
  offset: ByteOffset;
  length: number;
  keyword?: string;
  text?: string;
  hexPreview?: string;
}

export interface ImageAnomaly {
  kind: string;
  detail: string;
  offset: ByteOffset | null;
  severity: 'high' | 'medium' | 'low' | 'info';
}

export interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  orientation?: number;
  imageDescription?: string;
  copyright?: string;
  userComment?: string;
  gps?: { latitude?: number; longitude?: number; altitude?: number };
  pixelXDimension?: number;
  pixelYDimension?: number;
  raw?: Array<{ tag: number; name: string; value: string }>;
}

export interface ImageInformation {
  format: string;
  mime: string | null;
  width: number | null;
  height: number | null;
  hasAlpha: boolean | null;
  colorInfo: string | null;
  colorDepth: number | null;
  interlaced: boolean | null;
  frameCount: number | null;
  chunks: ImageChunk[];
  anomalies: ImageAnomaly[];
  exifAvailable: boolean;
  exif: ExifData | null;
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
  archiveType: 'zip' | 'unsupported';
  entryCount: number;
  entries: ArchiveEntry[];
  supported: boolean;
  limitations: string[];
}

// ---------------------------------------------------------------------------
// Steganography / anomaly helpers
// ---------------------------------------------------------------------------

export type AnomalyKind =
  | 'trailing-data'
  | 'unknown-chunk'
  | 'embedded-signature'
  | 'structural-note'
  | 'lsb-data'
  | 'silent-region'
  | 'stego-signature'
  | 'metadata-injection'
  | 'appended-archive';

export interface AnomalyFinding {
  kind: AnomalyKind;
  description: string;
  offset: ByteOffset | null;
  length: number | null;
  confidence: Confidence;
}

/** One LSB plane extraction attempt from an image or audio buffer. */
export interface LsbFinding {
  channel: string;
  bit: number;
  bitsRead: number;
  decoded: string;
  preview: string;
  offset: ByteOffset;
  looksLikeFlag: boolean;
  embeddedSignature: string | null;
}

// ---------------------------------------------------------------------------
// Audio analysis
// ---------------------------------------------------------------------------

export interface AudioWaveform {
  peaks: number[];
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface AudioSpectrogram {
  width: number;
  height: number;
  magnitudes: Float32Array;
  fftSize: number;
  timeStep: number;
  freqStep: number;
  minDb: number;
  maxDb: number;
}

export interface PcmData {
  channels: Float32Array[];
  sampleRate: number;
}

export interface AudioInformation {
  format: string;
  mime: string | null;
  duration: number | null;
  sampleRate: number | null;
  channels: number | null;
  bitsPerSample: number | null;
  bitrate: number | null;
  pcm: PcmData | null;
  waveform: AudioWaveform | null;
  spectrogram: AudioSpectrogram | null;
  tags: Array<{ key: string; value: string }>;
  anomalies: AnomalyFinding[];
  lsbFindings: LsbFinding[];
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
  entropyEstimate: number;
  printableRatio: number;
  nullByteRatio: number;
  topBytes: ByteFrequencyEntry[];
  detectedTextRegions: { offset: ByteOffset; length: number }[];
}

// ---------------------------------------------------------------------------
// Overall analysis status / progress
// ---------------------------------------------------------------------------

export type AnalysisStage =
  | 'idle'
  | 'reading'
  | 'identifying'
  | 'analyzing'
  | 'extracting'
  | 'scanning'
  | 'hashing'
  | 'ready'
  | 'error'
  | 'cancelled';

export interface AnalysisProgress {
  stage: AnalysisStage;
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
// Encoded content
// ---------------------------------------------------------------------------

export type EncodedContentEncoding = 'ascii-binary-text';

export interface EncodedContentCandidate {
  encoding: EncodedContentEncoding;
  originalLength: number;
  decodedLength: number;
  decodedIdentification: FileIdentification;
}

// ---------------------------------------------------------------------------
// CTF triage / executable analysis
// ---------------------------------------------------------------------------

export type CtfSeverity = 'high' | 'medium' | 'low' | 'info';

export interface CtfFinding {
  id: string;
  severity: CtfSeverity;
  category:
    | 'flag'
    | 'credential'
    | 'network'
    | 'encoding'
    | 'command'
    | 'format'
    | 'executable'
    | 'anomaly';
  title: string;
  value: string;
  offset: number | null;
  why: string;
  nextStep: string;
}

export interface CtfTransform {
  name: string;
  description: string;
  output: string;
}

export interface CtfTriageResult {
  score: number;
  findings: CtfFinding[];
  transforms: CtfTransform[];
  recommendedCommands: string[];
}

export interface ExecutableSection {
  name: string;
  offset: number;
  size: number;
  virtualAddress: number;
  flags: string;
}

export interface DisassembledInstruction {
  offset: number;
  address: number;
  bytes: string;
  mnemonic: string;
  operands: string;
  pseudo: string;
  confidence: 'decoded' | 'heuristic' | 'unknown';
}

export interface ExecutableAnalysis {
  format: 'ELF' | 'PE' | 'Mach-O' | 'Unknown';
  architecture: string;
  bits: 32 | 64 | null;
  entryPoint: number | null;
  entryFileOffset: number | null;
  sections: ExecutableSection[];
  imports: string[];
  exports: string[];
  strings: string[];
  instructions: DisassembledInstruction[];
  notes: string[];
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
  encodedContent: EncodedContentCandidate | null;
  ctf: CtfTriageResult | null;
  executable: ExecutableAnalysis | null;
  /** LSB stego findings surfaced by the steganography analyzer. */
  lsbFindings: LsbFinding[];
  /** Decoded PCM when the input is a raw WAV container. Null otherwise. */
  pcm: PcmData | null;
}
