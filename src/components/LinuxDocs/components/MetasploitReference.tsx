import { metasploitReferences } from "../data/metasploit";
import { CopyCommandButton } from "./CopyCommandButton";

export function MetasploitReference() {
  return (
    <div className="space-y-1">
      {metasploitReferences.map((item) => <details key={item.command} className="rounded-md border border-slate-200 bg-white">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-slate-800">{item.command}<span className="ml-2 font-normal text-slate-400">{item.purpose}</span></summary>
        <div className="border-t border-slate-100 p-3"><div className="flex gap-2"><pre className="min-w-0 flex-1 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100"><code>{item.example}</code></pre><CopyCommandButton command={item.example} /></div>{item.notes.length > 0 && <ul className="mt-2 list-disc pl-5 text-[11px] text-slate-500">{item.notes.map((note) => <li key={note}>{note}</li>)}</ul>}</div>
      </details>)}
    </div>
  );
}
