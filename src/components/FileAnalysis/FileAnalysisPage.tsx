import React, { useCallback, useEffect, useRef, useState } from "react";

import { FileDropzone } from "./components/FileDropzone";
import { FileInfoPanel } from "./components/FileInfoPanel";
import { AnalysisStatus } from "./components/AnalysisStatus";
import { ToolCategoryNav, type AnalysisTabId } from "./components/ToolCategoryNav";
import { DetectionResults } from "./components/DetectionResults";
import { MetadataPanel } from "./components/MetadataPanel";
import { StringsPanel } from "./components/StringsPanel";
import { HexViewer } from "./components/HexViewer";
import { ImageAnalysisPanel } from "./components/ImageAnalysisPanel";
import { ArchiveInspectionPanel } from "./components/ArchiveInspectionPanel";
import { SteganographyPanel } from "./components/SteganographyPanel";
import { RecoveryConceptsPanel } from "./components/RecoveryConceptsPanel";
import { BinaryAnalysisPanel } from "./components/BinaryAnalysisPanel";
import { ExportActions, exportCandidateAsFile, exportStringsAsText, exportDecodedContent } from "./components/ExportActions";

import { FileAnalysisWorkerClient } from "./lib/fileAnalysisWorkerClient";
import { analyzeImage } from "./lib/imageAnalyzer";
import { decodeAsciiBitstream } from "./lib/binaryTextDecoder";

import type {
  AnalysisProgress,
  AnalysisResult,
  EmbeddedFileCandidate,
  LoadedFileSummary,
} from "./types/fileAnalysis";

const IMAGE_FORMATS = new Set([
  "PNG image",
  "JPEG image",
  "GIF image",
  "BMP image",
  "WebP image",
  "TIFF image (little-endian)",
  "TIFF image (big-endian)",
]);

const IDLE_PROGRESS: AnalysisProgress = {
  stage: "idle",
  percent: null,
  message: "Select a file to begin.",
  processedBytes: null,
  totalBytes: null,
  startedAt: null,
  updatedAt: Date.now(),
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium tracking-wide text-[#16A34A]">{children}</p>;
}

export function FileAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [fileSummary, setFileSummary] = useState<LoadedFileSummary | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>(IDLE_PROGRESS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTabId>("overview");
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [hashInProgress, setHashInProgress] = useState(false);
  const [stringsMinLength, setStringsMinLength] = useState(4);
  const [stringsLoading, setStringsLoading] = useState(false);
  const [hexJump, setHexJump] = useState<{ offset: number | null; nonce: number }>({ offset: null, nonce: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const workerClientRef = useRef<FileAnalysisWorkerClient | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const getWorkerClient = useCallback(() => {
    if (!workerClientRef.current) {
      workerClientRef.current = new FileAnalysisWorkerClient();
    }
    return workerClientRef.current;
  }, []);

  // Terminate the worker and revoke any object URL on unmount.
  useEffect(() => {
    return () => {
      workerClientRef.current?.terminate();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const resetForNewFile = useCallback(() => {
    workerClientRef.current?.terminate();
    workerClientRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageObjectUrl(null);
    setResult(null);
    setActiveTab("overview");
    setErrorMessage(null);
    setStringsMinLength(4);
  }, []);

  const handleFileSelected = useCallback(
    async (selectedFile: File) => {
      resetForNewFile();
      setFile(selectedFile);

      const startedAt = Date.now();
      setProgress({
        stage: "reading",
        percent: 5,
        message: "Reading file into memory...",
        processedBytes: null,
        totalBytes: selectedFile.size,
        startedAt,
        updatedAt: Date.now(),
      });

      let buffer: ArrayBuffer;
      try {
        buffer = await selectedFile.arrayBuffer();
      } catch {
        setProgress({
          stage: "error",
          percent: null,
          message: "Could not read the selected file.",
          processedBytes: null,
          totalBytes: selectedFile.size,
          startedAt,
          updatedAt: Date.now(),
        });
        return;
      }

      // Keep one copy on the main thread for the hex viewer, string export,
      // and candidate export -- and send a *clone* to the worker so it can
      // be transferred (zero-copy) without detaching the copy we still need
      // here. This is a deliberate one-time duplication, not a repeated one.
      const mainCopy = new Uint8Array(buffer.slice(0));
      const workerCopy = buffer;

      setRawData(mainCopy);
      setFileSummary({
        name: selectedFile.name,
        sizeBytes: selectedFile.size,
        lastModified: selectedFile.lastModified,
        reportedMime: selectedFile.type,
        identification: null,
        sha256: null,
      });

      const client = getWorkerClient();
      client.analyze(workerCopy, selectedFile.name, selectedFile.type, {
        onProgress: (p) => {
          setProgress({
            stage: p.stage,
            percent: p.percent,
            message: p.message,
            processedBytes: null,
            totalBytes: selectedFile.size,
            startedAt,
            updatedAt: Date.now(),
          });
        },
        onResult: (analysisResult) => {
          setResult(analysisResult);
          setFileSummary((prev) =>
            prev ? { ...prev, identification: analysisResult.identification } : prev
          );
          setProgress({
            stage: "ready",
            percent: 100,
            message: "Analysis complete.",
            processedBytes: null,
            totalBytes: selectedFile.size,
            startedAt,
            updatedAt: Date.now(),
          });

          if (IMAGE_FORMATS.has(analysisResult.identification.detectedType)) {
            const url = URL.createObjectURL(selectedFile);
            objectUrlRef.current = url;
            setImageObjectUrl(url);
          }
        },
        onError: (message) => {
          setErrorMessage(message);
          setProgress({
            stage: "error",
            percent: null,
            message,
            processedBytes: null,
            totalBytes: selectedFile.size,
            startedAt,
            updatedAt: Date.now(),
          });
        },
        onCancelled: () => {
          setProgress({
            stage: "cancelled",
            percent: null,
            message: "Analysis cancelled.",
            processedBytes: null,
            totalBytes: selectedFile.size,
            startedAt,
            updatedAt: Date.now(),
          });
        },
      });
    },
    [getWorkerClient, resetForNewFile]
  );

  const handleCancel = useCallback(() => {
    workerClientRef.current?.cancel();
  }, []);

  const handleComputeHash = useCallback(() => {
    if (!rawData || hashInProgress) return;
    setHashInProgress(true);
    const client = getWorkerClient();
    client.hash(rawData, {
      onResult: (sha256) => {
        setHashInProgress(false);
        setFileSummary((prev) => (prev ? { ...prev, sha256 } : prev));
      },
      onError: () => {
        setHashInProgress(false);
      },
    });
  }, [rawData, hashInProgress, getWorkerClient]);

  const handleMinLengthChange = useCallback(
    (length: number) => {
      setStringsMinLength(length);
      if (!rawData) return;
      setStringsLoading(true);
      const client = getWorkerClient();
      client.extractStrings(rawData, length, "ascii", {
        onResult: (stringsResult) => {
          setStringsLoading(false);
          setResult((prev) => (prev ? { ...prev, strings: stringsResult } : prev));
        },
        onError: () => setStringsLoading(false),
      });
    },
    [rawData, getWorkerClient]
  );

  const handleInspectCandidate = useCallback((candidate: EmbeddedFileCandidate) => {
    setHexJump({ offset: candidate.offset, nonce: Date.now() });
    setActiveTab("hex");
  }, []);

  const handleOpenInHexViewer = useCallback((offset: number) => {
    setHexJump({ offset, nonce: Date.now() });
    setActiveTab("hex");
  }, []);

  const handleExportCandidate = useCallback(
    (candidate: EmbeddedFileCandidate) => {
      if (!fileSummary || !rawData) return;
      exportCandidateAsFile(fileSummary, candidate, rawData);
    },
    [fileSummary, rawData]
  );

  const handleOpenDecodedContent = useCallback(() => {
    if (!rawData || !fileSummary || !result?.encodedContent) return;
    const decoded = decodeAsciiBitstream(rawData);
    if (!decoded) return;
    const decodedIdentification = result.encodedContent.decodedIdentification;
    const extension = decodedIdentification.expectedExtensions[0] ?? ".bin";
    const mime = decodedIdentification.mime ?? "application/octet-stream";
    const decodedFile = new File([decoded as unknown as BlobPart], `${fileSummary.name}.decoded${extension}`, {
      type: mime,
    });
    handleFileSelected(decodedFile);
  }, [rawData, fileSummary, result, handleFileSelected]);

  const handleExportDecodedContent = useCallback(() => {
    if (!rawData || !fileSummary || !result?.encodedContent) return;
    const decoded = decodeAsciiBitstream(rawData);
    if (!decoded) return;
    const decodedIdentification = result.encodedContent.decodedIdentification;
    const extension = decodedIdentification.expectedExtensions[0] ?? ".bin";
    exportDecodedContent(fileSummary, decoded, extension, decodedIdentification.mime);
  }, [rawData, fileSummary, result]);

  const identification = result?.identification ?? fileSummary?.identification ?? null;
  const isImage = identification ? IMAGE_FORMATS.has(identification.detectedType) : false;
  const isArchive = identification ? identification.detectedType.startsWith("ZIP archive") : false;
  const image =
    result && isImage && rawData && identification
      ? analyzeImage(rawData, identification.detectedType, identification.mime, imageObjectUrl)
      : null;

  const isBusy = !["idle", "ready", "error", "cancelled"].includes(progress.stage);

  return (
    <div className="flex flex-col gap-6 bg-[#F9FAFB] p-6">
      <header className="max-w-3xl">
        <Eyebrow>DIGITAL FORENSICS</Eyebrow>
        <h1 className="mt-1 text-xl font-semibold text-[#111827]">Forensics / File Analysis</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Identify, inspect, and analyze files for metadata, strings, binary structures, file
          signatures, embedded content, archives, images, and other forensic artifacts.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Input / analysis column */}
        <div className="flex flex-col gap-4">
          <FileDropzone onFileSelected={handleFileSelected} disabled={isBusy} />

          {fileSummary && (
            <FileInfoPanel
              summary={fileSummary}
              onComputeHash={handleComputeHash}
              hashInProgress={hashInProgress}
            />
          )}

          {file && <AnalysisStatus progress={progress} onCancel={handleCancel} />}

          {errorMessage && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {errorMessage}
            </div>
          )}

          {result && fileSummary && rawData && (
            <ExportActions fileSummary={fileSummary} result={result} rawData={rawData} />
          )}
        </div>

        {/* Results / details column */}
        <div className="min-w-0">
          {!fileSummary ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-[12px] border border-dashed border-[#E5E7EB] bg-white text-sm text-[#9CA3AF]">
              Load a file to see identification, metadata, strings, hex, and analysis results here.
            </div>
          ) : !result ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-sm text-[#6B7280]">
              Analyzing {fileSummary.name}...
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ToolCategoryNav
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                showImageTab={isImage}
                showArchiveTab={isArchive}
              />

              {activeTab === "overview" && (
                <OverviewTab fileSummary={fileSummary} result={result} />
              )}
              {activeTab === "identification" && (
                <DetectionResults
                  identification={result.identification}
                  encodedContent={result.encodedContent}
                  onOpenDecodedContent={handleOpenDecodedContent}
                  onExportDecodedContent={handleExportDecodedContent}
                />
              )}
              {activeTab === "metadata" && <MetadataPanel metadata={result.metadata} />}
              {activeTab === "strings" && (
                <StringsPanel
                  result={result.strings}
                  minLength={stringsMinLength}
                  onMinLengthChange={handleMinLengthChange}
                  onExport={() => {
                    if (fileSummary && result) exportStringsAsText(fileSummary, result);
                  }}
                  loading={stringsLoading}
                />
              )}
              {activeTab === "hex" && rawData && (
                <HexViewer
                  data={rawData}
                  externalJumpOffset={hexJump.offset}
                  externalJumpNonce={hexJump.nonce}
                />
              )}
              {activeTab === "image" && image && <ImageAnalysisPanel image={image} />}
              {activeTab === "archive" && result.archive && (
                <ArchiveInspectionPanel archive={result.archive} />
              )}
              {activeTab === "steganography" && (
                <SteganographyPanel
                  findings={result.anomalies}
                  detectedFormat={result.identification.detectedType}
                />
              )}
              {activeTab === "recovery" && (
                <RecoveryConceptsPanel
                  candidates={result.embeddedCandidates}
                  onInspect={handleInspectCandidate}
                  onOpenInHexViewer={handleOpenInHexViewer}
                  onExport={handleExportCandidate}
                />
              )}
              {activeTab === "binary" && result.binaryStatistics && (
                <BinaryAnalysisPanel stats={result.binaryStatistics} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  fileSummary,
  result,
}: {
  fileSummary: LoadedFileSummary;
  result: AnalysisResult;
}) {
  const extensionNote = result.identification.extensionMismatch
    ? `Extension mismatch: reported ${result.identification.reportedExtension || "(none)"}, detected ${result.identification.detectedType}`
    : `Extension matches detected format`;

  const findings: string[] = [extensionNote];
  if (result.encodedContent) {
    findings.push(
      `File content is ASCII binary-text; decoded bytes identify as ${result.encodedContent.decodedIdentification.detectedType} — see Identification tab`
    );
  }
  if (result.embeddedCandidates.length > 0) {
    findings.push(`${result.embeddedCandidates.length} embedded signature candidate(s) detected`);
  }
  if (result.anomalies.length > 0) {
    findings.push(`${result.anomalies.length} anomaly finding(s) reported — see Steganography tab`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">File Overview</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Filename</dt>
            <dd className="text-right text-[#111827]">{fileSummary.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Size</dt>
            <dd className="text-right font-mono text-[#111827]">{fileSummary.sizeBytes.toLocaleString()} bytes</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Detected Type</dt>
            <dd className="text-right text-[#111827]">{result.identification.detectedType}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">MIME</dt>
            <dd className="text-right font-mono text-[#111827]">{result.identification.mime ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Signature</dt>
            <dd className="text-right font-mono text-[#111827]">
              {result.identification.signature?.magicHex ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">SHA-256</dt>
            <dd className="text-right font-mono text-[#111827]">{fileSummary.sha256 ?? "Not calculated"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Strings</dt>
            <dd className="text-right text-[#111827]">
              {result.strings ? `${result.strings.totalFound.toLocaleString()} candidates` : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Embedded Files</dt>
            <dd className="text-right text-[#111827]">{result.embeddedCandidates.length} candidates</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6B7280]">Metadata</dt>
            <dd className="text-right text-[#111827]">
              {result.metadata.fields.some((f) => f.status === "available") ? "Available" : "Limited"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Potential Findings</p>
        <ul className="mt-3 space-y-2">
          {findings.map((finding, i) => (
            <li key={i} className="flex gap-2 text-sm text-[#111827]">
              <span className="text-[#16A34A]">–</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#9CA3AF]">
          Findings reflect what the checks in this tool could observe. They are not a malware or
          integrity verdict — interpret them alongside the detailed tabs.
        </p>
      </div>
    </div>
  );
}

export default FileAnalysisPage;
