import type {
  AnalysisResult,
  AnalysisStage,
  ArchiveInformation,
  HexRange,
  StringEncoding,
  StringExtractionResult,
} from '../types/fileAnalysis';

// ---------------------------------------------------------------------------
// Protocol: requests (main thread -> worker)
// ---------------------------------------------------------------------------

interface BaseRequest {
  requestId: string;
}

export interface AnalyzeRequest extends BaseRequest {
  type: 'analyze';
  buffer: ArrayBuffer;
  filename: string;
  mime: string;
}

export interface HashRequest extends BaseRequest {
  type: 'hash';
  buffer: ArrayBuffer;
}

export interface ExtractStringsRequest extends BaseRequest {
  type: 'extract-strings';
  buffer: ArrayBuffer;
  minLength: number;
  encoding: StringEncoding;
}

export interface ReadRangeRequest extends BaseRequest {
  type: 'read-range';
  buffer: ArrayBuffer;
  offset: number;
  length: number;
  bytesPerRow: number;
}

export interface InspectArchiveRequest extends BaseRequest {
  type: 'inspect-archive';
  buffer: ArrayBuffer;
}

export interface CancelRequest extends BaseRequest {
  type: 'cancel';
}

export type WorkerRequest =
  | AnalyzeRequest
  | HashRequest
  | ExtractStringsRequest
  | ReadRangeRequest
  | InspectArchiveRequest
  | CancelRequest;

// ---------------------------------------------------------------------------
// Protocol: responses (worker -> main thread)
// ---------------------------------------------------------------------------

export interface ProgressResponse {
  type: 'progress';
  requestId: string;
  stage: AnalysisStage;
  percent: number | null;
  message: string;
}

export interface ResultResponse {
  type: 'result';
  requestId: string;
  result: AnalysisResult;
}

export interface HashResultResponse {
  type: 'hash-result';
  requestId: string;
  sha256: string;
}

export interface StringsResultResponse {
  type: 'strings-result';
  requestId: string;
  result: StringExtractionResult;
}

export interface HexRangeResultResponse {
  type: 'hex-range-result';
  requestId: string;
  range: HexRange;
}

export interface ArchiveResultResponse {
  type: 'archive-result';
  requestId: string;
  archive: ArchiveInformation;
}

export interface ErrorResponse {
  type: 'error';
  requestId: string;
  message: string;
}

export interface CancelledResponse {
  type: 'cancelled';
  requestId: string;
}

export type WorkerResponse =
  | ProgressResponse
  | ResultResponse
  | HashResultResponse
  | StringsResultResponse
  | HexRangeResultResponse
  | ArchiveResultResponse
  | ErrorResponse
  | CancelledResponse;

// ---------------------------------------------------------------------------
// Client wrapper
// ---------------------------------------------------------------------------

export interface AnalysisWorkerCallbacks {
  onProgress?: (progress: ProgressResponse) => void;
  onResult?: (result: AnalysisResult) => void;
  onError?: (message: string) => void;
  onCancelled?: () => void;
}

export interface HashCallbacks {
  onResult?: (sha256: string) => void;
  onError?: (message: string) => void;
}

export interface StringsCallbacks {
  onResult?: (result: StringExtractionResult) => void;
  onError?: (message: string) => void;
}

export interface HexRangeCallbacks {
  onResult?: (range: HexRange) => void;
  onError?: (message: string) => void;
}

export interface ArchiveCallbacks {
  onResult?: (archive: ArchiveInformation) => void;
  onError?: (message: string) => void;
}

let requestCounter = 0;
function nextRequestId(): string {
  requestCounter += 1;
  return `req-${Date.now()}-${requestCounter}`;
}

type PendingEntry =
  | { kind: 'analyze'; callbacks: AnalysisWorkerCallbacks }
  | { kind: 'hash'; callbacks: HashCallbacks }
  | { kind: 'strings'; callbacks: StringsCallbacks }
  | { kind: 'range'; callbacks: HexRangeCallbacks }
  | { kind: 'archive'; callbacks: ArchiveCallbacks };

/**
 * Lifecycle-managed wrapper around the forensics Web Worker. Owns exactly
 * one Worker instance; callers must call `terminate()` on unmount, file
 * change, or navigation away to avoid leaking a running worker. Multiple
 * independent requests (e.g. a full analysis plus an on-demand hash) can be
 * in flight at once, each tracked by its own requestId.
 */
export class FileAnalysisWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingEntry>();

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/fileAnalysis.worker.ts', import.meta.url),
        {
          type: 'module',
        },
      );
      this.worker.addEventListener('message', this.handleMessage);
    }
    return this.worker;
  }

  private handleMessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    const entry = this.pending.get(msg.requestId);
    if (!entry) return; // stale/unknown response, ignore

    switch (msg.type) {
      case 'progress':
        if (entry.kind === 'analyze') entry.callbacks.onProgress?.(msg);
        break;
      case 'result':
        if (entry.kind === 'analyze') entry.callbacks.onResult?.(msg.result);
        this.pending.delete(msg.requestId);
        break;
      case 'hash-result':
        if (entry.kind === 'hash') entry.callbacks.onResult?.(msg.sha256);
        this.pending.delete(msg.requestId);
        break;
      case 'strings-result':
        if (entry.kind === 'strings') entry.callbacks.onResult?.(msg.result);
        this.pending.delete(msg.requestId);
        break;
      case 'hex-range-result':
        if (entry.kind === 'range') entry.callbacks.onResult?.(msg.range);
        this.pending.delete(msg.requestId);
        break;
      case 'archive-result':
        if (entry.kind === 'archive') entry.callbacks.onResult?.(msg.archive);
        this.pending.delete(msg.requestId);
        break;
      case 'error':
        entry.callbacks.onError?.(msg.message);
        this.pending.delete(msg.requestId);
        break;
      case 'cancelled':
        if (entry.kind === 'analyze') entry.callbacks.onCancelled?.();
        this.pending.delete(msg.requestId);
        break;
      default:
        break;
    }
  };

  /** Runs a full analysis pass. The buffer is transferred (zero-copy). */
  analyze(
    buffer: ArrayBuffer,
    filename: string,
    mime: string,
    callbacks: AnalysisWorkerCallbacks,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.pending.set(requestId, { kind: 'analyze', callbacks });
    const request: AnalyzeRequest = {
      type: 'analyze',
      requestId,
      buffer,
      filename,
      mime,
    };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /** Computes a SHA-256 hash. `buffer` is copied first so the caller keeps its own copy usable. */
  hash(data: Uint8Array, callbacks: HashCallbacks): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.pending.set(requestId, { kind: 'hash', callbacks });
    const buffer = data.slice().buffer as ArrayBuffer;
    const request: HashRequest = { type: 'hash', requestId, buffer };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /** Re-extracts strings with a new minimum length / encoding without a full re-analysis. */
  extractStrings(
    data: Uint8Array,
    minLength: number,
    encoding: StringEncoding,
    callbacks: StringsCallbacks,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.pending.set(requestId, { kind: 'strings', callbacks });
    const buffer = data.slice().buffer as ArrayBuffer;
    const request: ExtractStringsRequest = {
      type: 'extract-strings',
      requestId,
      buffer,
      minLength,
      encoding,
    };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /** Cancels the currently active analyze request, if any. */
  cancel(requestId?: string) {
    if (!this.worker) return;
    const targetId =
      requestId ??
      [...this.pending.entries()].find(([, e]) => e.kind === 'analyze')?.[0];
    if (!targetId) return;
    const request: CancelRequest = { type: 'cancel', requestId: targetId };
    this.worker.postMessage(request);
  }

  /** Terminates the worker outright. Call on unmount / file change. */
  terminate() {
    this.worker?.removeEventListener('message', this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
