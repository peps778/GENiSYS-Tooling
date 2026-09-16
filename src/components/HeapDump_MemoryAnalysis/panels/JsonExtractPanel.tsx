/**
 * JsonExtractPanel.tsx
 *
 * Lists JSON-shaped substrings found in the heap strings, pretty
 * printing valid entries and flagging near-miss/invalid candidates.
 */
import type { JsonExtractResult } from "../types/heap";
import { CheckIcon, CodeIcon, XIcon } from "../components/icons";

export interface JsonExtractPanelProps {
  results: JsonExtractResult[] | null;
  loading: boolean;
  onExtract: () => void;
}

export default function JsonExtractPanel({ results, loading, onExtract }: JsonExtractPanelProps) {
  if (results === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-[#E5E7EB] bg-white py-12 text-center">
        <CodeIcon width={22} height={22} className="text-[#9CA3AF]" />
        <p className="text-sm text-[#4B5563]">Scan the extracted strings for JSON-shaped data.</p>
        <button
          type="button"
          disabled={loading}
          onClick={onExtract}
          className="rounded-md bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
        >
          {loading ? "Extracting\u2026" : "Extract JSON"}
        </button>
      </div>
    );
  }

  const validCount = results.filter((r) => r.valid).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#4B5563]">
          {validCount.toLocaleString()} valid &middot; {(results.length - validCount).toLocaleString()} invalid
        </p>
        <button
          type="button"
          onClick={onExtract}
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-wide text-[#15803D] hover:text-[#16A34A] disabled:opacity-60"
        >
          {loading ? "Extracting\u2026" : "Re-scan"}
        </button>
      </div>

      <div className="max-h-[500px] space-y-2 overflow-y-auto">
        {results.length === 0 && (
          <div className="rounded-md border border-[#E5E7EB] bg-white p-6 text-center text-sm text-[#4B5563]">
            No JSON-shaped data was found.
          </div>
        )}
        {results.map((result) => (
          <div key={result.id} className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5">
              {result.valid ? (
                <CheckIcon width={12} height={12} className="text-[#16A34A]" />
              ) : (
                <XIcon width={12} height={12} className="text-[#9CA3AF]" />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4B5563]">
                {result.valid ? "Valid JSON" : "Invalid / partial"}
              </span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[11px] text-[#111827]">
              {result.valid ? JSON.stringify(result.parsed, null, 2) : result.raw}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
