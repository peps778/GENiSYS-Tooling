import { useState } from 'react';

interface CopyCommandButtonProps {
  command: string;
  label?: string;
}

export function CopyCommandButton({
  command,
  label = 'Copy',
}: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
