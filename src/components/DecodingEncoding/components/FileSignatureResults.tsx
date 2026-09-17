import React from 'react';

export interface FileSignatureViewModel {
  fileName: string;
  fileSize: number;
  detectedType: string;
  mime: string;
  extension: string;
  magicBytes: string;
  offset: number;
  hexPreview: string;
}

interface FileSignatureResultsProps {
  data: FileSignatureViewModel;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileSignatureResults({
  data,
}: FileSignatureResultsProps) {
  const rows: { label: string; value: string }[] = [
    { label: 'Filename', value: data.fileName },
    { label: 'File size', value: formatBytes(data.fileSize) },
    { label: 'Detected type', value: data.detectedType },
    { label: 'MIME type', value: data.mime },
    { label: 'Common extension', value: data.extension },
    { label: 'Signature offset', value: `${data.offset}` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-xs text-[#6B7280]">{row.label}</dt>
            <dd className="font-mono text-sm text-[#111827] break-all">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#111827]">Magic bytes</p>
        <p className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-xs text-[#111827]">
          {data.magicBytes}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-[#111827]">Hex preview</p>
        <p className="max-h-32 overflow-y-auto rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-xs leading-relaxed text-[#111827] break-all">
          {data.hexPreview}
        </p>
      </div>
    </div>
  );
}
