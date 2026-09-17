import { useState } from "react";
import type { LinuxCommand } from "../types/linuxDocs";
import { CommandDetail } from "./CommandDetail";

export function CommandCard({ command, defaultOpen = false }: { command: LinuxCommand; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full min-w-0 items-start justify-between gap-4 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-sm font-bold text-slate-900">{command.name}</code>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{command.category}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{command.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">{command.tags.slice(0, 5).map((tag) => <span key={tag} className="text-[10px] text-slate-400">#{tag}</span>)}</div>
        </div>
        <span className="shrink-0 text-xs text-slate-400">{open ? "Hide" : "View"}</span>
      </button>
      {open && <div className="px-4 pb-4"><CommandDetail command={command} /></div>}
    </article>
  );
}
