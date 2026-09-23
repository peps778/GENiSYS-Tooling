import React from 'react';
import type { AnalysisProgress } from '../types/fileAnalysis';

interface AnalysisStatusProps {
  progress: AnalysisProgress;
  onCancel?: () => void;
}

const STAGE_LABELS: Record<AnalysisProgress['stage'], string> = {
  idle: 'Idle',
  reading: 'Reading file',
  identifying: 'Identifying format',
  analyzing: 'Analyzing binary data',
  extracting: 'Extracting strings',
  scanning: 'Scanning for signatures',
  hashing: 'Computing hash',
  ready: 'Ready',
  error: 'Error',
  cancelled: 'Cancelled',
};

export function AnalysisStatus({ progress, onCancel }: AnalysisStatusProps) {
  const isActive = !['idle', 'ready', 'error', 'cancelled'].includes(
    progress.stage,
  );

  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          File Analysis
        </p>
        {isActive && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-[#6B7280] hover:text-[#111827]"
          >
            Cancel Analysis
          </button>
        )}
      </div>

      <p className="mt-1 text-sm font-medium text-[#111827]">
        {STAGE_LABELS[progress.stage]}
      </p>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F0FDF4]">
        {progress.percent !== null ? (
          <div
            className="h-full rounded-full bg-[#16A34A] transition-[width]"
            style={{
              width: `${Math.max(0, Math.min(100, progress.percent))}%`,
            }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        ) : isActive ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[#16A34A]" />
        ) : (
          <div className="h-full w-full rounded-full bg-[#E5E7EB]" />
        )}
      </div>

      <p className="mt-2 text-xs text-[#6B7280]">{progress.message}</p>

      {progress.processedBytes !== null && progress.totalBytes !== null && (
        <p className="mt-1 text-xs text-[#9CA3AF] font-mono">
          {progress.processedBytes.toLocaleString()} /{' '}
          {progress.totalBytes.toLocaleString()} bytes
        </p>
      )}
    </div>
  );
}

export default AnalysisStatus;
