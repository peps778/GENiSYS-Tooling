/**
 * RegexSearchPanel.tsx
 *
 * Free-form regex search over the extracted string table. The pattern
 * is compiled and executed inside the worker (see lib/regexSearch.ts);
 * this component only renders the form and the returned results.
 */
import { useState } from "react";
import type { RegexSearchResult } from "../types/heap";
import { SearchIcon } from "../components/icons";

export interface RegexSearchPanelProps {
  results: RegexSearchResult[] | null;
  truncated: boolean;
  loading: boolean;
  error: string | null;
  onSearch: (pattern: string, flags: string) => void;
}

export default function RegexSearchPanel({
  results,
  truncated,
  loading,
  error,
  onSearch,
}: RegexSearchPanelProps) {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("i");

  const submit = () => {
    if (!pattern.trim()) return;
    onSearch(pattern, flags);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
          <SearchIcon width={14} height={14} className="text-[#9CA3AF]" />
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Regular expression, e.g. sk_live_[A-Za-z0-9]{20,}"
            className="w-full border-none bg-transparent font-mono text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
          />
        </div>
        <input
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="flags"
          className="w-20 rounded-md border border-[#E5E7EB] bg-white px-2 py-2 text-center font-mono text-xs text-[#111827] focus:border-[#16A34A] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !pattern.trim()}
          className="rounded-md bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D] disabled:opacity-60"
        >
          {loading ? "Searching\u2026" : "Search"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {results && (
        <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#111827]">
              {results.length.toLocaleString()} match{results.length === 1 ? "" : "es"}
            </p>
            {truncated && <p className="text-[10px] text-[#9CA3AF]">Results truncated</p>}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {results.length === 0 && <p className="p-4 text-xs text-[#9CA3AF]">No matches.</p>}
            {results.map((result) => (
              <div key={result.id} className="border-b border-[#E5E7EB] px-3 py-2 last:border-b-0">
                <p className="break-all font-mono text-xs font-semibold text-[#15803D]">{result.match}</p>
                <p className="mt-1 break-all font-mono text-[11px] text-[#9CA3AF]">{result.context}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
