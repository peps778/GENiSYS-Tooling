/**
 * heapWorkerClient.ts
 *
 * Thin, promise-based wrapper around heapSnapshot.worker.ts. This is
 * the ONLY file outside the worker that should know about postMessage
 * plumbing — HeapDumpPage just calls plain async methods.
 */

import type {
  HeapSummary,
  JsonExtractResult,
  RegexSearchResult,
  SecretMatch,
  StringsPage,
  WorkerRequest,
  WorkerResponse,
} from '../types/heap';

export type ProgressListener = (stage: string, percent: number) => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export class HeapWorkerClient {
  private worker: Worker;
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private progressListeners = new Set<ProgressListener>();

  constructor() {
    this.worker = new Worker(
      new URL('../workers/heapSnapshot.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
      this.handleMessage(event.data);
    this.worker.onerror = (event: ErrorEvent) => {
      // Surface a fatal worker-level error to every pending request
      // rather than hanging callers forever.
      const message =
        event.message || 'The analysis worker crashed unexpectedly.';
      for (const [, pending] of this.pending) {
        pending.reject(new Error(message));
      }
      this.pending.clear();
    };
  }

  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private handleMessage(message: WorkerResponse) {
    if (message.type === 'progress') {
      for (const listener of this.progressListeners) {
        listener(message.stage, message.percent);
      }
      return;
    }

    const pending = this.pending.get(message.requestId);
    if (!pending) return;
    this.pending.delete(message.requestId);

    if (message.type === 'error') {
      pending.reject(new Error(message.message));
      return;
    }
    pending.resolve(message);
  }

  private send<T>(request: WorkerRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.set(request.requestId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.worker.postMessage(
        request,
        request.type === 'parse' ? [request.buffer] : [],
      );
    });
  }

  async parseFile(file: File): Promise<HeapSummary> {
    const buffer = await file.arrayBuffer();
    const requestId = this.nextRequestId++;
    const response = await this.send<
      Extract<WorkerResponse, { type: 'parseResult' }>
    >({
      type: 'parse',
      requestId,
      buffer,
      fileName: file.name,
      fileSize: file.size,
    });
    return response.summary;
  }

  async getStringsPage(
    page: number,
    pageSize: number,
    filter?: string,
  ): Promise<StringsPage> {
    const requestId = this.nextRequestId++;
    const response = await this.send<
      Extract<WorkerResponse, { type: 'stringsPageResult' }>
    >({
      type: 'getStringsPage',
      requestId,
      page,
      pageSize,
      filter,
    });
    return response.page;
  }

  async getSecrets(): Promise<SecretMatch[]> {
    const requestId = this.nextRequestId++;
    const response = await this.send<
      Extract<WorkerResponse, { type: 'secretsResult' }>
    >({
      type: 'getSecrets',
      requestId,
    });
    return response.secrets;
  }

  async regexSearch(
    pattern: string,
    flags: string,
    limit?: number,
  ): Promise<{ results: RegexSearchResult[]; truncated: boolean }> {
    const requestId = this.nextRequestId++;
    const response = await this.send<
      Extract<WorkerResponse, { type: 'regexSearchResult' }>
    >({
      type: 'regexSearch',
      requestId,
      pattern,
      flags,
      limit,
    });
    return { results: response.results, truncated: response.truncated };
  }

  async extractJson(): Promise<JsonExtractResult[]> {
    const requestId = this.nextRequestId++;
    const response = await this.send<
      Extract<WorkerResponse, { type: 'jsonExtractResult' }>
    >({
      type: 'extractJson',
      requestId,
    });
    return response.results;
  }

  terminate() {
    this.worker.terminate();
    this.pending.clear();
    this.progressListeners.clear();
  }
}
