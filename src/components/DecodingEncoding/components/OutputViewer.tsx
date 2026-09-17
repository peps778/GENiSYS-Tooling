import React, { useState } from 'react';

interface OutputViewerProps {
  id: string;
  label: string;
  value: string;
  error?: string | null;
  rows?: number;
  downloadFileName?: string;
}

export default function OutputViewer({
  id,
  label,
  value,
  error,
  rows = 8,
  downloadFileName,
}: OutputViewerProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable; fail silently but don't throw.
    }
  }

  function handleDownload() {
    if (!value) return;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadFileName ?? 'output.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-[#111827]">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            className="rounded-[10px] border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {downloadFileName && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={!value}
              className="rounded-[10px] border border-[#E5E7EB] px-2.5 py-1 text-xs font-medium text-[#374151] hover:border-[#16A34A] hover:text-[#15803D] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            >
              Download
            </button>
          )}
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        readOnly
        rows={rows}
        spellCheck={false}
        aria-invalid={!!error}
        className={[
          'w-full resize-y rounded-[10px] border bg-[#F9FAFB] px-3 py-2.5 font-mono text-sm text-[#111827]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]',
          error ? 'border-[#FCA5A5]' : 'border-[#E5E7EB]',
        ].join(' ')}
      />
      {error && (
        <p
          role="alert"
          className="rounded-[10px] border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
