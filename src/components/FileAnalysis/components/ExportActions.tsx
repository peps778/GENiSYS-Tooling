import React from "react";
import type { AnalysisResult, EmbeddedFileCandidate, LoadedFileSummary } from "../types/fileAnalysis";
import { extractCandidateBytes } from "../lib/fileReconstructor";
import { getRecognizedFileExport, withExtension } from "../lib/recognizedFileExport";

interface ExportActionsProps {
  fileSummary: LoadedFileSummary;
  result: AnalysisResult;
  rawData: Uint8Array;
}

function downloadBlob(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportStringsAsText(fileSummary: LoadedFileSummary, result: AnalysisResult) {
  if (!result.strings) return;
  const lines = result.strings.matches.map(
    (m) => `0x${m.offset.toString(16).toUpperCase().padStart(8, "0")}\t${m.value}\t${m.length} bytes`
  );
  downloadBlob(`${fileSummary.name}.strings.txt`, lines.join("\n"), "text/plain");
}

export function exportMetadataJson(fileSummary: LoadedFileSummary, result: AnalysisResult) {
  downloadBlob(`${fileSummary.name}.metadata.json`, JSON.stringify(result.metadata, null, 2), "application/json");
}

export function exportSignatureFindingsJson(fileSummary: LoadedFileSummary, result: AnalysisResult) {
  const payload = {
    identification: result.identification,
    embeddedCandidates: result.embeddedCandidates,
    anomalies: result.anomalies,
  };
  downloadBlob(`${fileSummary.name}.signatures.json`, JSON.stringify(payload, null, 2), "application/json");
}

export function exportArchiveListingJson(fileSummary: LoadedFileSummary, result: AnalysisResult) {
  if (!result.archive) return;
  downloadBlob(`${fileSummary.name}.archive.json`, JSON.stringify(result.archive, null, 2), "application/json");
}

export function exportFullReportJson(fileSummary: LoadedFileSummary, result: AnalysisResult) {
  const report = {
    file: {
      name: fileSummary.name,
      sizeBytes: fileSummary.sizeBytes,
      lastModified: fileSummary.lastModified,
      reportedMime: fileSummary.reportedMime,
      sha256: fileSummary.sha256,
    },
    ...result,
  };
  downloadBlob(`${fileSummary.name}.analysis-report.json`, JSON.stringify(report, null, 2), "application/json");
}

export function exportCandidateAsFile(fileSummary: LoadedFileSummary, candidate: EmbeddedFileCandidate, rawData: Uint8Array) {
  const bytes = extractCandidateBytes(rawData, candidate.offset, candidate.endOffset);
  const name = `${fileSummary.name}.candidate-0x${candidate.offset.toString(16)}${candidate.suggestedExtension}`;
  downloadBlob(name, bytes as unknown as BlobPart, candidate.mime ?? "application/octet-stream");
}

export function exportDecodedContent(fileSummary: LoadedFileSummary, decodedBytes: Uint8Array, extension: string, mime: string | null) {
  const name = `${fileSummary.name}.decoded${extension}`;
  downloadBlob(name, decodedBytes as unknown as BlobPart, mime ?? "application/octet-stream");
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-left text-sm text-[#111827] shadow-sm hover:border-[#BBF7D0] hover:bg-[#F0FDF4] disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export function ExportActions({ fileSummary, result, rawData }: ExportActionsProps) {
  const recognized = getRecognizedFileExport(result, rawData);
  const embeddedCount = result.embeddedCandidates.length;

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280]">Export Findings</p>

      {recognized && (
        <div className="mb-3 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-3">
          <p className="text-sm text-[#111827]">
            Recognized as <span className="font-medium">{recognized.formatLabel}</span>
            {!recognized.isWholeFile && " (after decoding)"}
          </p>
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                withExtension(fileSummary.name, recognized.extension),
                recognized.bytes as unknown as BlobPart,
                recognized.mime ?? "application/octet-stream"
              )
            }
            className="mt-2 rounded-[8px] bg-[#16A34A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#15803D]"
          >
            Export as {recognized.extension.replace(".", "").toUpperCase()} file
          </button>
        </div>
      )}

      {!recognized && embeddedCount > 0 && (
        <div className="mb-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-xs text-[#6B7280]">
          No single recognized format covers the whole file, but {embeddedCount} embedded signature
          candidate{embeddedCount === 1 ? "" : "s"} were found at specific offsets. Export those
          individually from the Recovery tab, where each one's exact byte range can be reviewed first.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <ActionButton
          label="Extracted strings (.txt)"
          onClick={() => exportStringsAsText(fileSummary, result)}
          disabled={!result.strings || result.strings.matches.length === 0}
        />
        <ActionButton label="Metadata (.json)" onClick={() => exportMetadataJson(fileSummary, result)} />
        <ActionButton
          label="Signature findings (.json)"
          onClick={() => exportSignatureFindingsJson(fileSummary, result)}
        />
        <ActionButton
          label="Archive listing (.json)"
          onClick={() => exportArchiveListingJson(fileSummary, result)}
          disabled={!result.archive}
        />
        <ActionButton label="Full analysis report (.json)" onClick={() => exportFullReportJson(fileSummary, result)} />
      </div>
      <p className="mt-3 text-xs text-[#9CA3AF]">
        Exports never overwrite the original file. Reconstructed candidates preserve source offset and length.
      </p>
    </div>
  );
}

export default ExportActions;
