import React from 'react';
import type { LoadedFileSummary } from '../types/fileAnalysis';

interface FileInfoPanelProps {
  summary: LoadedFileSummary;
  onComputeHash: () => void;
  hashInProgress: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-xs text-[#6B7280]">{label}</span>
      <span
        className={[
          'text-sm text-[#111827] text-right break-all',
          mono ? 'font-mono' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

export function FileInfoPanel({
  summary,
  onComputeHash,
  hashInProgress,
}: FileInfoPanelProps) {
  const identification = summary.identification;

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          Loaded File
        </p>
        <p
          className="mt-1 truncate text-sm font-semibold text-[#111827]"
          title={summary.name}
        >
          {summary.name}
        </p>
        <p className="text-xs text-[#9CA3AF]">
          {formatBytes(summary.sizeBytes)}
        </p>
      </div>

      <div className="divide-y divide-[#E5E7EB] border-t border-[#E5E7EB] pt-1">
        <Row
          label="Type"
          value={identification?.detectedType ?? 'Analyzing...'}
        />
        <Row
          label="MIME"
          value={identification?.mime ?? (summary.reportedMime || 'Unknown')}
          mono
        />
        <Row
          label="Detected format"
          value={
            identification
              ? identification.confidence === 'unknown'
                ? 'Unknown'
                : identification.detectedType
              : 'Analyzing...'
          }
        />
        <Row
          label="Size"
          value={`${summary.sizeBytes.toLocaleString()} bytes`}
          mono
        />
        <Row
          label="SHA-256"
          value={
            summary.sha256 ?? (
              <button
                type="button"
                onClick={onComputeHash}
                disabled={hashInProgress}
                className="text-xs font-medium text-[#16A34A] hover:text-[#15803D] disabled:opacity-50"
              >
                {hashInProgress ? 'Computing...' : 'Calculate'}
              </button>
            )
          }
          mono
        />
      </div>
    </div>
  );
}

export default FileInfoPanel;
