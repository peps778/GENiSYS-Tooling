/**
 * heapSnapshot.worker.ts
 *
 * Owns all expensive heap-snapshot processing off the main thread.
 * The full parsed string table lives ONLY in this worker's memory —
 * React state on the main thread only ever receives summaries, pages,
 * and capped result sets. This keeps the UI responsive for large
 * (multi-hundred-MB) .heapsnapshot files.
 */

import { parseHeapSnapshot } from "../lib/heapSnapshotParser";
import { detectSecrets } from "../lib/secretDetectors";
import { searchStrings } from "../lib/regexSearch";
import { extractJsonFromStrings } from "../lib/jsonExtractor";
import type {
  HeapSummary,
  WorkerRequest,
  WorkerResponse,
} from "../types/heap";

/** Module-level state: the currently loaded snapshot's string table. */
let currentStrings: string[] = [];
let currentSummary: HeapSummary | null = null;

function post(message: WorkerResponse) {
  // eslint-disable-next-line no-restricted-globals
  (self as unknown as Worker).postMessage(message);
}

function handleParse(req: Extract<WorkerRequest, { type: "parse" }>) {
  post({ type: "progress", requestId: req.requestId, stage: "Parsing snapshot", percent: 10 });

  const { summary, strings } = parseHeapSnapshot(req.buffer, req.fileName, req.fileSize);

  currentStrings = strings;
  currentSummary = summary;

  post({ type: "progress", requestId: req.requestId, stage: "Done", percent: 100 });
  post({ type: "parseResult", requestId: req.requestId, summary });
}

function handleGetStringsPage(req: Extract<WorkerRequest, { type: "getStringsPage" }>) {
  const filterTerm = req.filter?.toLowerCase();
  const filtered = filterTerm
    ? currentStrings.filter((s) => s.toLowerCase().includes(filterTerm))
    : currentStrings;

  const start = req.page * req.pageSize;
  const items = filtered.slice(start, start + req.pageSize).map((value, i) => ({
    id: start + i,
    value,
  }));

  post({
    type: "stringsPageResult",
    requestId: req.requestId,
    page: { items, page: req.page, pageSize: req.pageSize, total: filtered.length },
  });
}

function handleGetSecrets(req: Extract<WorkerRequest, { type: "getSecrets" }>) {
  const secrets = detectSecrets(currentStrings);
  post({ type: "secretsResult", requestId: req.requestId, secrets });
}

function handleRegexSearch(req: Extract<WorkerRequest, { type: "regexSearch" }>) {
  const outcome = searchStrings(currentStrings, req.pattern, req.flags, { limit: req.limit });
  if (outcome.error) {
    post({ type: "error", requestId: req.requestId, message: outcome.error });
    return;
  }
  post({
    type: "regexSearchResult",
    requestId: req.requestId,
    results: outcome.results,
    truncated: outcome.truncated,
  });
}

function handleExtractJson(req: Extract<WorkerRequest, { type: "extractJson" }>) {
  const results = extractJsonFromStrings(currentStrings);
  post({ type: "jsonExtractResult", requestId: req.requestId, results });
}

// eslint-disable-next-line no-restricted-globals
(self as unknown as Worker).onmessage = (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    switch (req.type) {
      case "parse":
        handleParse(req);
        break;
      case "getStringsPage":
        handleGetStringsPage(req);
        break;
      case "getSecrets":
        handleGetSecrets(req);
        break;
      case "regexSearch":
        handleRegexSearch(req);
        break;
      case "extractJson":
        handleExtractJson(req);
        break;
      default: {
        const _exhaustive: never = req;
        void _exhaustive;
      }
    }
  } catch (err) {
    post({
      type: "error",
      requestId: (req as { requestId?: number }).requestId ?? -1,
      message: err instanceof Error ? err.message : "Unknown worker error",
    });
  }
};

// Referenced so `currentSummary` isn't flagged unused if a future
// handler doesn't happen to read it in some build configurations.
void currentSummary;
