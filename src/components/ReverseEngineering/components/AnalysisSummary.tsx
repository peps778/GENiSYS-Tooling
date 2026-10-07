import React from 'react';

interface Props { fileName: string | null; size: number; type: string; }

export default function AnalysisSummary({ fileName, size, type }: Props) {
  return <div className="grid gap-3 sm:grid-cols-3">
    {[
      ['Target', fileName ?? 'Manual bytes'],
      ['Size', `${size.toLocaleString()} bytes`],
      ['Identified type', type],
    ].map(([label, value]) => <div key={label} className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-[#111827]">{value}</p>
    </div>)}
  </div>;
}
