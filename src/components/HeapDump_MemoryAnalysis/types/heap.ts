/**
 * Shared TypeScript contracts for the HeapDump_MemoryAnalysis module.
 * Nothing in this file depends on React or the DOM so it can be reused
 * freely by lib/, workers/, panels/, and tests/.
 */

/** Internal tab identifiers. These are local UI state, NOT routes. */
export type HeapDumpTabId = "overview" | "strings" | "secrets" | "search" | "json";

/** Detected snapshot format after best-effort inspection of the file. */
export type HeapSnapshotFormat = "v8-json" | "unknown" | "malformed";

/** High-level summary produced once a file has been processed. */
export interface HeapSummary {
  fileName: string;
  fileSizeBytes: number;
  format: HeapSnapshotFormat;
  /** Present only when format === "v8-json" and node data was parsed. */
  nodeCount?: number;
  /** Present only when format === "v8-json" and edge data was parsed. */
  edgeCount?: number;
  stringCount: number;
  totalStringBytes: number;
  parseTimeMs: number;
  warnings: string[];
}

/** A single printable string pulled out of the snapshot. */
export interface ExtractedString {
  id: number;
  value: string;
}

/** A page of extracted strings, for cheap transfer out of the worker. */
export interface StringsPage {
  items: ExtractedString[];
  page: number;
  pageSize: number;
  total: number;
}

export type SecretType =
  | "api_key"
  | "aws_key"
  | "jwt"
  | "private_key"
  | "password"
  | "token"
  | "url"
  | "endpoint"
  | "flag"
  | "generic_secret";

export type SecretSeverity = "high" | "medium" | "low";

export interface SecretMatch {
  id: number;
  type: SecretType;
  severity: SecretSeverity;
  /** The raw matched value. Kept in memory only; never persisted or logged. */
  value: string;
  /** A masked version safe to render by default. */
  redacted: string;
  /** A short surrounding snippet for context. */
  context: string;
  /** Index of the source string this was extracted from. */
  sourceStringId: number;
}

export interface RegexSearchResult {
  id: number;
  match: string;
  index: number;
  context: string;
  groups: string[];
  sourceStringId: number;
}

export interface JsonExtractResult {
  id: number;
  raw: string;
  valid: boolean;
  parsed?: unknown;
  sourceStringId: number;
}

/** ---------------- Worker protocol ---------------- */

export interface WorkerParseRequest {
  type: "parse";
  requestId: number;
  buffer: ArrayBuffer;
  fileName: string;
  fileSize: number;
}

export interface WorkerStringsPageRequest {
  type: "getStringsPage";
  requestId: number;
  page: number;
  pageSize: number;
  filter?: string;
}

export interface WorkerSecretsRequest {
  type: "getSecrets";
  requestId: number;
}

export interface WorkerRegexSearchRequest {
  type: "regexSearch";
  requestId: number;
  pattern: string;
  flags: string;
  limit?: number;
}

export interface WorkerJsonExtractRequest {
  type: "extractJson";
  requestId: number;
}

export type WorkerRequest =
  | WorkerParseRequest
  | WorkerStringsPageRequest
  | WorkerSecretsRequest
  | WorkerRegexSearchRequest
  | WorkerJsonExtractRequest;

export interface WorkerProgressMessage {
  type: "progress";
  requestId: number;
  stage: string;
  percent: number;
}

export interface WorkerErrorMessage {
  type: "error";
  requestId: number;
  message: string;
}

export interface WorkerParseResponse {
  type: "parseResult";
  requestId: number;
  summary: HeapSummary;
}

export interface WorkerStringsPageResponse {
  type: "stringsPageResult";
  requestId: number;
  page: StringsPage;
}

export interface WorkerSecretsResponse {
  type: "secretsResult";
  requestId: number;
  secrets: SecretMatch[];
}

export interface WorkerRegexSearchResponse {
  type: "regexSearchResult";
  requestId: number;
  results: RegexSearchResult[];
  truncated: boolean;
}

export interface WorkerJsonExtractResponse {
  type: "jsonExtractResult";
  requestId: number;
  results: JsonExtractResult[];
}

export type WorkerResponse =
  | WorkerProgressMessage
  | WorkerErrorMessage
  | WorkerParseResponse
  | WorkerStringsPageResponse
  | WorkerSecretsResponse
  | WorkerRegexSearchResponse
  | WorkerJsonExtractResponse;
