import React from 'react';

interface ConversionTableProps {
  rows: { label: string; value: string }[];
}

/** Small summary table used under conversions (byte counts, offsets, etc.). */
export default function ConversionTable({ rows }: ConversionTableProps) {
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col">
          <dt className="text-xs text-[#6B7280]">{row.label}</dt>
          <dd className="font-mono text-sm text-[#111827] break-all">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
