/**
 * FileInfoPanel.tsx
 *
 * Presentational summary strip shown once a snapshot has been parsed.
 * Pure display component — all values are passed in as props.
 */
import type { HeapSummary } from "../types/heap";
import { AlertIcon, FileIcon } from "./icons";

export interface FileInfoPanelProps {
  summary: HeapSummary;
  onClear: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

const FORMAT_LABEL: Record<HeapSummary["format"], string> = {
  "v8-json": "V8 / Chromium JSON",
  unknown: "Unrecognized (raw extraction)",
  malformed: "Malformed (raw extraction)",
};

const FORMAT_BADGE_CLASS: Record<HeapSummary["format"], string> = {
  "v8-json": "bg-[#F0FDF4] text-[#15803D] border-[#16A34A]/30",
  unknown: "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]",
  malformed: "bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB]",
};

export default function FileInfoPanel({ summary, onClear }: FileInfoPanelProps) {
  return (
    <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#F9FAFB] text-[#4B5563]">
            <FileIcon width={16} height={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{summary.fileName}</p>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              {formatBytes(summary.fileSizeBytes)} &middot; parsed in {summary.parseTimeMs} ms
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium uppercase tracking-wide text-[#4B5563] hover:text-[#111827]"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Format</p>
          <span
            className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${FORMAT_BADGE_CLASS[summary.format]}`}
          >
            {FORMAT_LABEL[summary.format]}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Strings</p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">{summary.stringCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Nodes</p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">
            {summary.nodeCount !== undefined ? summary.nodeCount.toLocaleString() : "\u2014"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Edges</p>
          <p className="mt-1 text-sm font-semibold text-[#111827]">
            {summary.edgeCount !== undefined ? summary.edgeCount.toLocaleString() : "\u2014"}
          </p>
        </div>
      </div>

      {summary.warnings.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-[#E5E7EB] pt-3">
          {summary.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#4B5563]">
              <AlertIcon width={14} height={14} className="mt-0.5 flex-none text-[#9CA3AF]" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
