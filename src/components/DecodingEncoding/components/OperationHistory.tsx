import React from 'react';
import type { HistoryEntry } from '../types/decoding';

interface OperationHistoryProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function OperationHistory({
  entries,
  onClear,
}: OperationHistoryProps) {
  return (
    <section
      aria-labelledby="operation-history-heading"
      className="flex flex-col gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2
          id="operation-history-heading"
          className="text-sm font-semibold text-[#111827]"
        >
          Operation History
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={entries.length === 0}
          className="rounded-[10px] border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
        >
          Clear History
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[#6B7280]">No operations recorded yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#E5E7EB]">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#111827]">
                  {entry.toolLabel}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              <p className="truncate font-mono text-xs text-[#6B7280]">
                in: {entry.inputSummary || '(empty)'}
              </p>
              <p className="truncate font-mono text-xs text-[#6B7280]">
                out: {entry.outputSummary || '(empty)'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
