/**
 * StringsPanel.tsx
 *
 * Paginated browser over the extracted string table. Pagination and
 * filtering are delegated to the worker (via props/callbacks) so the
 * full string table never needs to live in React state for large files.
 */
import { useEffect, useState } from 'react';
import type { StringsPage } from '../types/heap';
import { SearchIcon } from '../components/icons';

export interface StringsPanelProps {
  page: StringsPage | null;
  loading: boolean;
  onRequestPage: (page: number, pageSize: number, filter?: string) => void;
  pageSize?: number;
}

export default function StringsPanel({
  page,
  loading,
  onRequestPage,
  pageSize = 50,
}: StringsPanelProps) {
  const [filterInput, setFilterInput] = useState('');

  // Debounce the filter so we don't spam the worker on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      onRequestPage(0, pageSize, filterInput || undefined);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInput]);

  const totalPages = page
    ? Math.max(1, Math.ceil(page.total / page.pageSize))
    : 1;
  const currentPage = page?.page ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-2">
        <SearchIcon width={14} height={14} className="text-[#9CA3AF]" />
        <input
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          placeholder="Filter strings (plain text, case-insensitive)"
          className="w-full border-none bg-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
        <div className="max-h-[420px] overflow-y-auto">
          {loading && (
            <p className="p-4 text-xs text-[#9CA3AF]">Loading\u2026</p>
          )}
          {!loading && page && page.items.length === 0 && (
            <p className="p-4 text-xs text-[#9CA3AF]">
              No strings match this filter.
            </p>
          )}
          {!loading &&
            page?.items.map((item) => (
              <div
                key={item.id}
                className="border-b border-[#E5E7EB] px-3 py-2 font-mono text-xs text-[#111827] last:border-b-0"
              >
                <span className="mr-2 text-[#9CA3AF]">#{item.id}</span>
                <span className="break-all">{item.value}</span>
              </div>
            ))}
        </div>
      </div>

      {page && page.total > 0 && (
        <div className="flex items-center justify-between text-xs text-[#4B5563]">
          <span>
            Page {currentPage + 1} of {totalPages} &middot;{' '}
            {page.total.toLocaleString()} strings
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 0 || loading}
              onClick={() =>
                onRequestPage(
                  currentPage - 1,
                  pageSize,
                  filterInput || undefined,
                )
              }
              className="rounded-md border border-[#E5E7EB] px-2 py-1 font-semibold uppercase tracking-wide disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={currentPage + 1 >= totalPages || loading}
              onClick={() =>
                onRequestPage(
                  currentPage + 1,
                  pageSize,
                  filterInput || undefined,
                )
              }
              className="rounded-md border border-[#E5E7EB] px-2 py-1 font-semibold uppercase tracking-wide disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
