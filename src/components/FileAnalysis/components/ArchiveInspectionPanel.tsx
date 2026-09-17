import React, { useState } from 'react';
import type { ArchiveInformation } from '../types/fileAnalysis';

interface ArchiveInspectionPanelProps {
  archive: ArchiveInformation;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function ArchiveInspectionPanel({
  archive,
}: ArchiveInspectionPanelProps) {
  const [filter, setFilter] = useState('');

  if (!archive.supported) {
    return (
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="text-sm text-[#111827]">
          This archive type isn't supported for detailed inspection.
        </p>
        {archive.limitations.map((note, i) => (
          <p key={i} className="mt-1 text-xs text-[#6B7280]">
            {note}
          </p>
        ))}
      </div>
    );
  }

  const filtered = archive.entries.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <p className="text-sm text-[#111827]">
          {archive.entryCount} entr{archive.entryCount === 1 ? 'y' : 'ies'} ·{' '}
          {archive.archiveType.toUpperCase()}
        </p>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter entries..."
          className="w-56 rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#111827] outline-none focus:border-[#16A34A]"
        />
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-left text-xs uppercase tracking-wide text-[#9CA3AF]">
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-4 py-2 font-normal">Compressed</th>
              <th className="px-4 py-2 font-normal">Uncompressed</th>
              <th className="px-4 py-2 font-normal">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9FAFB]">
            {filtered.map((entry, i) => (
              <tr key={i} className="hover:bg-[#F9FAFB]">
                <td className="px-4 py-2 font-mono text-[#111827]">
                  {entry.isDirectory ? `${entry.name}` : entry.name}
                  {entry.isDirectory && (
                    <span className="ml-2 text-xs text-[#9CA3AF]">
                      (directory)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-[#6B7280]">
                  {formatBytes(entry.compressedSize)}
                </td>
                <td className="px-4 py-2 font-mono text-[#6B7280]">
                  {formatBytes(entry.uncompressedSize)}
                </td>
                <td className="px-4 py-2 text-[#6B7280]">
                  {entry.compressionMethod}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-[#6B7280]">
            No entries match your filter.
          </p>
        )}
      </div>

      {archive.limitations.length > 0 && (
        <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Notes
          </p>
          {archive.limitations.map((note, i) => (
            <p key={i} className="mt-1 text-xs text-[#6B7280]">
              {note}
            </p>
          ))}
        </div>
      )}

      <div className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-xs text-[#6B7280]">
        Contents are listed only. Extraction is a separate, explicit action and
        is not performed automatically.
      </div>
    </div>
  );
}

export default ArchiveInspectionPanel;
