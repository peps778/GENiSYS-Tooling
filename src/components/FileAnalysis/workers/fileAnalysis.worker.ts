/// <reference lib="webworker" />

/**
 * Forensics analysis worker.
 *
 * Handles the expensive, potentially large-buffer operations so the main
 * thread / React UI never blocks: identification, string extraction,
 * signature scanning, binary statistics, hashing, and archive indexing.
 *
 * Protocol: typed request/response messages (see fileAnalysisWorkerClient.ts
 * for the shared type definitions). Buffers are transferred, not copied,
 * wherever the operation allows it.
 */

import { identifyFile } from '../lib/fileIdentifier';
import { extractMetadata } from '../lib/metadataExtractor';
import { extractStrings } from '../lib/stringExtractor';
import { analyzeBinary } from '../lib/binaryAnalyzer';
import { findEmbeddedCandidates } from '../lib/fileReconstructor';
import { inspectForAnomalies } from '../lib/steganography';
import { inspectZipArchive, looksLikeZip } from '../lib/archiveInspector';
import { readHexRange } from '../lib/hexReader';
import { decodeAsciiBitstream } from '../lib/binaryTextDecoder';
import { analyzeCtfContent } from '../lib/ctfAnalyzer';
import { analyzeExecutable } from '../lib/executableAnalyzer';

import type {
  AnalysisResult,
  AnalysisStage,
  StringEncoding,
} from '../types/fileAnalysis';
import type {
  WorkerRequest,
  WorkerResponse,
} from '../lib/fileAnalysisWorkerClient';

const ctx: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;

function post(response: WorkerResponse) {
  ctx.postMessage(response);
}

function progress(
  requestId: string,
  stage: AnalysisStage,
  percent: number | null,
  message: string,
) {
  post({
    type: 'progress',
    requestId,
    stage,
    percent,
    message,
  });
}

async function computeSha256(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function handleAnalyze(
  requestId: string,
  data: Uint8Array,
  filename: string,
  _mime: string,
) {
  progress(requestId, 'identifying', 10, 'Reading file signature...');
  const identification = identifyFile(data, filename);

  progress(requestId, 'identifying', 25, 'Extracting format-aware metadata...');
  const metadata = extractMetadata(data, identification, data.length);

  progress(requestId, 'extracting', 45, 'Extracting printable strings...');
  const strings = extractStrings(data, { minLength: 4, maxMatches: 5000 });

  progress(requestId, 'analyzing', 60, 'Computing binary statistics...');
  const binaryStatistics = analyzeBinary(data);

  progress(requestId, 'scanning', 66, 'Running CTF-oriented indicator scan...');
  const executable = analyzeExecutable(data);

  progress(
    requestId,
    'scanning',
    75,
    'Scanning for embedded file signatures...',
  );
  const embeddedCandidates = findEmbeddedCandidates(data);
  progress(
    requestId,
    'scanning',
    78,
    'Correlating strings, signatures, and challenge indicators...',
  );
  const ctf = analyzeCtfContent(data, strings, embeddedCandidates);

  progress(requestId, 'scanning', 85, 'Checking for anomalies...');
  const stego = inspectForAnomalies(data, identification.detectedType);
  const { anomalies, lsbFindings, pcm } = stego;

  let archive = null;
  if (looksLikeZip(data)) {
    progress(requestId, 'scanning', 90, 'Indexing archive contents...');
    archive = inspectZipArchive(data);
  }

  progress(
    requestId,
    'scanning',
    95,
    'Checking for text-encoded binary content...',
  );
  let encodedContent = null;
  // Only worth attempting when the raw bytes didn't already resolve to a
  // confident, known format -- a real JPEG/PNG/etc. is never also a valid
  // all-'0'/'1' ASCII bitstream, so this is cheap to skip in the common case.
  if (identification.confidence !== 'confirmed') {
    const decoded = decodeAsciiBitstream(data);
    if (decoded && decoded.length > 0) {
      const decodedIdentification = identifyFile(decoded, filename);
      if (decodedIdentification.confidence !== 'unknown') {
        encodedContent = {
          encoding: 'ascii-binary-text' as const,
          originalLength: data.length,
          decodedLength: decoded.length,
          decodedIdentification,
        };
      }
    }
  }

  progress(requestId, 'ready', 100, 'Analysis complete.');

  const result: AnalysisResult = {
    identification,
    metadata,
    strings,
    binaryStatistics,
    embeddedCandidates,
    anomalies,
    archive,
    image: null, // image preview/objectURL is created on the main thread
    sha256: null,
    encodedContent,
    ctf,
    executable,
    lsbFindings,
    pcm,
  };

  post({ type: 'result', requestId, result });
}

async function handleHash(requestId: string, data: Uint8Array) {
  progress(requestId, 'hashing', null, 'Computing SHA-256...');
  const sha256 = await computeSha256(data);
  post({ type: 'hash-result', requestId, sha256 });
}

function handleExtractStrings(
  requestId: string,
  data: Uint8Array,
  minLength: number,
  encoding: StringEncoding,
) {
  const result = extractStrings(data, {
    minLength,
    encoding,
    maxMatches: 10000,
  });
  post({ type: 'strings-result', requestId, result });
}

function handleReadRange(
  requestId: string,
  data: Uint8Array,
  offset: number,
  length: number,
  bytesPerRow: number,
) {
  const range = readHexRange(data, offset, length, bytesPerRow);
  post({ type: 'hex-range-result', requestId, range });
}

function handleInspectArchive(requestId: string, data: Uint8Array) {
  if (!looksLikeZip(data)) {
    post({
      type: 'archive-result',
      requestId,
      archive: {
        archiveType: 'unsupported',
        entryCount: 0,
        entries: [],
        supported: false,
        limitations: ['Not a ZIP archive.'],
      },
    });
    return;
  }
  const archive = inspectZipArchive(data);
  post({ type: 'archive-result', requestId, archive });
}

// Track in-flight requestIds so `cancel` can short-circuit cooperative loops
// in future long-running operations. Current pure functions run
// synchronously and to completion, but the flag is honored between stages.
const cancelled = new Set<string>();

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  if (msg.type === 'cancel') {
    cancelled.add(msg.requestId);
    post({ type: 'cancelled', requestId: msg.requestId });
    return;
  }

  try {
    switch (msg.type) {
      case 'analyze':
        handleAnalyze(
          msg.requestId,
          new Uint8Array(msg.buffer),
          msg.filename,
          msg.mime,
        );
        break;
      case 'hash':
        handleHash(msg.requestId, new Uint8Array(msg.buffer));
        break;
      case 'extract-strings':
        handleExtractStrings(
          msg.requestId,
          new Uint8Array(msg.buffer),
          msg.minLength,
          msg.encoding,
        );
        break;
      case 'read-range':
        handleReadRange(
          msg.requestId,
          new Uint8Array(msg.buffer),
          msg.offset,
          msg.length,
          msg.bytesPerRow,
        );
        break;
      case 'inspect-archive':
        handleInspectArchive(msg.requestId, new Uint8Array(msg.buffer));
        break;
      default:
        break;
    }
  } catch (err) {
    post({
      type: 'error',
      requestId: (msg as { requestId: string }).requestId,
      message: err instanceof Error ? err.message : 'Unknown worker error',
    });
  }
});
