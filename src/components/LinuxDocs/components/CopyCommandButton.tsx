import { useState } from "react";

export default function CopyCommandButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} disabled={!value} className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40">
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
