interface CommandSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
}

export function CommandSearch({ query, onQueryChange, resultCount }: CommandSearchProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <label className="sr-only" htmlFor="linux-command-search">Search commands</label>
      <input id="linux-command-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search commands, tags, syntax, examples..." className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:ring-2" />
      <span className="text-xs text-slate-500">{resultCount} match{resultCount === 1 ? "" : "es"}</span>
    </div>
  );
}
