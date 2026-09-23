import type { ReactNode } from 'react';

export default function OSINTHeader({
  caseCount,
  toolCount,
  flagCount,
  query,
  onQueryChange,
  searchResults,
  onSearchResult,
}: {
  caseCount: number;
  toolCount: number;
  flagCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  searchResults?: ReactNode;
  onSearchResult?: () => void;
}) {
  return (
    <header className="relative z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-3 py-2 sm:px-5 lg:flex-nowrap">
        <div className="min-w-0 shrink-0">
          <p className="text-sm font-bold tracking-tight text-slate-950">
            OSINT Reference
          </p>
          <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:block">
            Investigation reference
          </p>
        </div>
        <div className="hidden h-7 w-px bg-slate-200 lg:block" />
        <div className="relative order-3 w-full min-w-0 lg:order-none lg:max-w-2xl lg:flex-1">
          <label htmlFor="osint-search" className="sr-only">
            Search the OSINT reference
          </label>
          <input
            id="osint-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search cases, tools, DNS, metadata, evidence..."
            autoComplete="off"
            className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          {query.trim() && searchResults}
        </div>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <HeaderStat label="Cases" value={String(caseCount)} />
          <HeaderStat label="Tools" value={String(toolCount)} />
          <HeaderStat label="Flags" value={String(flagCount)} />
        </div>
      </div>
    </header>
  );
}
function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-xs font-bold text-slate-700">{value}</p>
    </div>
  );
}
