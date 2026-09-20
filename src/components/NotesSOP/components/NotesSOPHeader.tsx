interface NotesSOPHeaderProps {
  caseCount: number;
  referenceCount: number;
  flagCount: number;
  query: string;
  onQueryChange: (value: string) => void;
}

export default function NotesSOPHeader({
  caseCount,
  referenceCount,
  flagCount,
  query,
  onQueryChange,
}: NotesSOPHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-3 py-2 sm:px-5 lg:flex-nowrap">
        <div className="min-w-0 shrink-0">
          <p className="text-sm font-bold tracking-tight text-slate-950">
            Notes / SOP
          </p>
          <p className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:block">
            Investigation reference
          </p>
        </div>

        <div className="hidden h-7 w-px bg-slate-200 lg:block" />

        <div className="order-3 w-full min-w-0 lg:order-none lg:flex-1 lg:max-w-2xl">
          <div className="relative">
            <label htmlFor="notes-sop-search" className="sr-only">
              Search investigation notes and SOP
            </label>
            <input
              id="notes-sop-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search cases, vulnerabilities, and references..."
              className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <HeaderStat label="Cases" value={String(caseCount)} />
          <HeaderStat label="Refs" value={String(referenceCount)} />
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
