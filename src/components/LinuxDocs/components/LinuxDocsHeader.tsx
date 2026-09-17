export function LinuxDocsHeader({ commandCount }: { commandCount: number }) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            GENiSYS / Linux Reference
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Linux Docs / Command Reference
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            Compact command reference for Linux triage, authorized security
            testing, file analysis, and Hack4Gov preparation.
          </p>
        </div>
        <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Reference library
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {commandCount} commands
          </p>
        </div>
      </div>
    </header>
  );
}
