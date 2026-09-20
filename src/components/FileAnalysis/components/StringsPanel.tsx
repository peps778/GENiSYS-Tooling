import React, { useMemo, useState } from "react";
import type { StringExtractionResult } from "../types/fileAnalysis";

interface StringsPanelProps {
  result: StringExtractionResult | null;
  minLength: number;
  onMinLengthChange: (length: number) => void;
  onExport: () => void;
  loading: boolean;
}

const PAGE_SIZE = 100;

export function StringsPanel({ result, minLength, onMinLengthChange, onExport, loading }: StringsPanelProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!result) return [];
    if (!query.trim()) return result.matches;
    const q = query.toLowerCase();
    return result.matches.filter((m) => m.value.toLowerCase().includes(q));
  }, [result, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const copy = async (id: number, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
    } catch {
      // Clipboard access can fail silently in restrictive contexts; no UI
      // change is a reasonable fallback rather than throwing.
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search extracted strings..."
          className="min-w-[180px] flex-1 rounded-[10px] border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#111827] outline-none focus:border-[#16A34A]"
        />

        <label className="flex items-center gap-2 text-xs text-[#6B7280]">
          Min length
          <input
            type="number"
            min={1}
            max={64}
            value={minLength}
            onChange={(e) => onMinLengthChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded-[8px] border border-[#E5E7EB] px-2 py-1 text-sm font-mono text-[#111827] outline-none focus:border-[#16A34A]"
          />
        </label>

        <button
          type="button"
          onClick={onExport}
          disabled={!result || result.matches.length === 0}
          className="rounded-[8px] border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#111827] hover:border-[#BBF7D0] hover:bg-[#F0FDF4] disabled:opacity-40"
        >
          Export
        </button>
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white shadow-sm">
        {loading ? (
          <p className="p-4 text-sm text-[#6B7280]">Extracting strings...</p>
        ) : !result || result.matches.length === 0 ? (
          <p className="p-4 text-sm text-[#6B7280]">No strings of at least {minLength} characters found.</p>
        ) : (
          <>
            <div className="max-h-[480px] overflow-y-auto divide-y divide-[#E5E7EB]">
              {pageItems.map((match) => (
                <div key={match.id} className="flex items-center justify-between gap-3 px-4 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-[#111827]">{match.value}</p>
                    <p className="font-mono text-xs text-[#9CA3AF]">
                      0x{match.offset.toString(16).toUpperCase().padStart(8, "0")} · {match.length} bytes ·{" "}
                      {match.encoding.toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(match.id, match.value)}
                    className="shrink-0 text-xs font-medium text-[#16A34A] hover:text-[#15803D]"
                  >
                    {copiedId === match.id ? "Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-2 text-xs text-[#6B7280]">
              <span>
                {filtered.length.toLocaleString()} match{filtered.length === 1 ? "" : "es"}
                {result.truncated ? ` (of ${result.totalFound.toLocaleString()} found; results capped)` : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-[6px] border border-[#E5E7EB] px-2 py-1 disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="rounded-[6px] border border-[#E5E7EB] px-2 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StringsPanel;
