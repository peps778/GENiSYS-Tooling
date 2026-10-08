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
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `req-${crypto.randomUUID()}`;
  }
  requestCounter += 1;
  return `req-${Date.now()}-${requestCounter}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

type PendingEntry =
  | { kind: 'analyze'; callbacks: AnalysisWorkerCallbacks }
  | { kind: 'hash'; callbacks: HashCallbacks }
  | { kind: 'strings'; callbacks: StringsCallbacks }
  | { kind: 'range'; callbacks: HexRangeCallbacks }
  | { kind: 'archive'; callbacks: ArchiveCallbacks };

interface PendingMeta {
  entry: PendingEntry;
  /** setTimeout handle, or null when timeout is disabled. */
  timer: ReturnType<typeof setTimeout> | null;
}

/** Default per-request timeout (ms). Override per call via `timeoutMs`. */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Lifecycle-managed wrapper around the forensics Web Worker. Owns exactly
 * one Worker instance; callers must call `terminate()` on unmount, file
 * change, or navigation away to avoid leaking a running worker. Multiple
 * independent requests (e.g. a full analysis plus an on-demand hash) can be
 * in flight at once, each tracked by its own requestId.
 */
export class FileAnalysisWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingMeta>();

  private ensureWorker(): Worker {
    if (!this.worker) {
      const w = new Worker(
        new URL('../workers/fileAnalysis.worker.ts', import.meta.url),
        { type: 'module' },
      );
      w.addEventListener('message', this.handleMessage);
      w.addEventListener('error', this.handleWorkerError);
      w.addEventListener('messageerror', this.handleMessageError);
      this.worker = w;
    }
    return this.worker;
  }

  private handleMessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    const meta = this.pending.get(msg.requestId);
    if (!meta) return; // stale/unknown response, ignore

    switch (msg.type) {
      case 'progress':
        if (meta.entry.kind === 'analyze')
          meta.entry.callbacks.onProgress?.(msg);
        return; // progress does not resolve the request

      case 'result':
        if (meta.entry.kind === 'analyze')
          meta.entry.callbacks.onResult?.(msg.result);
        break;
      case 'hash-result':
        if (meta.entry.kind === 'hash')
          meta.entry.callbacks.onResult?.(msg.sha256);
        break;
      case 'strings-result':
        if (meta.entry.kind === 'strings')
          meta.entry.callbacks.onResult?.(msg.result);
        break;
      case 'hex-range-result':
        if (meta.entry.kind === 'range')
          meta.entry.callbacks.onResult?.(msg.range);
        break;
      case 'archive-result':
        if (meta.entry.kind === 'archive')
          meta.entry.callbacks.onResult?.(msg.archive);
        break;
      case 'error':
        meta.entry.callbacks.onError?.(msg.message);
        break;
      case 'cancelled':
        if (meta.entry.kind === 'analyze') meta.entry.callbacks.onCancelled?.();
        break;
      default:
        return;
    }
    this.resolve(msg.requestId);
  };

  /** Uncaught exception inside the worker: every in-flight request is dead. */
  private handleWorkerError = (event: ErrorEvent) => {
    const message = event.message || 'Worker crashed unexpectedly.';
    this.failAll(message);
    this.disposeWorker();
  };

  /** A message failed to deserialize. Fail pending but keep the worker alive. */
  private handleMessageError = (_event: MessageEvent) => {
    this.failAll('Worker message could not be deserialized.');
  };

  private resolve(requestId: string): void {
    const meta = this.pending.get(requestId);
    if (!meta) return;
    if (meta.timer !== null) clearTimeout(meta.timer);
    this.pending.delete(requestId);
  }

  private failAll(message: string): void {
    for (const [id, meta] of this.pending) {
      if (meta.timer !== null) clearTimeout(meta.timer);
      meta.entry.callbacks.onError?.(message);
      this.pending.delete(id);
    }
  }

  private disposeWorker(): void {
    if (!this.worker) return;
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.removeEventListener('messageerror', this.handleMessageError);
    this.worker.terminate();
    this.worker = null;
  }

  private track(
    requestId: string,
    entry: PendingEntry,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        const meta = this.pending.get(requestId);
        if (!meta) return;
        meta.entry.callbacks.onError?.(
          `Request timed out after ${timeoutMs} ms.`,
        );
        this.pending.delete(requestId);
      }, timeoutMs);
    }
    this.pending.set(requestId, { entry, timer });
  }

  // --- public API ---------------------------------------------------------

  /**
   * Runs a full analysis pass. The buffer is transferred (zero-copy), so the
   * caller must not use `buffer` after this call.
   */
  analyze(
    buffer: ArrayBuffer,
    filename: string,
    mime: string,
    callbacks: AnalysisWorkerCallbacks,
    timeoutMs?: number,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.track(requestId, { kind: 'analyze', callbacks }, timeoutMs);
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

  /** Computes SHA-256. `data` is copied first so the caller keeps it usable. */
  hash(data: Uint8Array, callbacks: HashCallbacks, timeoutMs?: number): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.track(requestId, { kind: 'hash', callbacks }, timeoutMs);
    const buffer = data.slice().buffer as ArrayBuffer;
    const request: HashRequest = { type: 'hash', requestId, buffer };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /** Re-extracts strings. `data` is copied first so the caller keeps it usable. */
  extractStrings(
    data: Uint8Array,
    minLength: number,
    encoding: StringEncoding,
    callbacks: StringsCallbacks,
    timeoutMs?: number,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.track(requestId, { kind: 'strings', callbacks }, timeoutMs);
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

  /** Reads a byte range as a hex dump. `data` is copied first. */
  readRange(
    data: Uint8Array,
    offset: number,
    length: number,
    bytesPerRow: number,
    callbacks: HexRangeCallbacks,
    timeoutMs?: number,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.track(requestId, { kind: 'range', callbacks }, timeoutMs);
    const buffer = data.slice().buffer as ArrayBuffer;
    const request: ReadRangeRequest = {
      type: 'read-range',
      requestId,
      buffer,
      offset,
      length,
      bytesPerRow,
    };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /** Inspects an archive's directory / entries. `data` is copied first. */
  inspectArchive(
    data: Uint8Array,
    callbacks: ArchiveCallbacks,
    timeoutMs?: number,
  ): string {
    const worker = this.ensureWorker();
    const requestId = nextRequestId();
    this.track(requestId, { kind: 'archive', callbacks }, timeoutMs);
    const buffer = data.slice().buffer as ArrayBuffer;
    const request: InspectArchiveRequest = {
      type: 'inspect-archive',
      requestId,
      buffer,
    };
    worker.postMessage(request, [buffer]);
    return requestId;
  }

  /**
   * Cooperative cancel. Only effective if the worker periodically yields to
   * its message loop; for a fully synchronous worker this is a no-op and you
   * should use `hardCancel()` instead.
   */
  cancel(requestId?: string): void {
    if (!this.worker) return;
    const targetId =
      requestId ??
      [...this.pending.entries()].find(
        ([, meta]) => meta.entry.kind === 'analyze',
      )?.[0];
    if (!targetId) return;
    const request: CancelRequest = { type: 'cancel', requestId: targetId };
    this.worker.postMessage(request);
  }

  /**
   * Hard cancel: terminates the worker and fails every in-flight request.
   * Use when you need a guaranteed stop (file change, navigation, huge input).
   */
  hardCancel(reason = 'Analysis cancelled.'): void {
    this.failAll(reason);
    this.disposeWorker();
  }

  /** Terminates the worker outright. Call on unmount / file change. */
  terminate(): void {
    this.failAll('Worker terminated.');
    this.disposeWorker();
  }
}
