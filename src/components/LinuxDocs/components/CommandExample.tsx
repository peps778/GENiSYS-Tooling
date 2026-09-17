import type { CommandExample } from "../types/linuxDocs";
import { CopyCommandButton } from "./CopyCommandButton";

export function CommandExample({ example }: { example: CommandExample }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs text-slate-600">{example.description}</p>
        <CopyCommandButton command={example.command} />
      </div>
      <pre className="min-w-0 overflow-x-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100"><code>{example.command}</code></pre>
      {example.authorizedOnly && <p className="mt-2 text-[11px] font-medium text-amber-700">Authorized testing only.</p>}
    </div>
  );
}
