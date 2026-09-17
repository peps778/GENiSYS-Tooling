import type { LinuxCommand } from "../types/linuxDocs";
import { CommandExample } from "./CommandExample";
import { CommandFlags } from "./CommandFlags";

export function CommandDetail({ command }: { command: LinuxCommand }) {
  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Syntax</p>
        <pre className="min-w-0 overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100"><code>{command.syntax}</code></pre>
      </div>
      {command.examples.length > 0 && (
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Examples</p>
          <div className="space-y-2">{command.examples.map((example) => <CommandExample key={example.command} example={example} />)}</div>
        </section>
      )}
      {command.flags.length > 0 && (
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Common flags</p>
          <CommandFlags flags={command.flags} />
        </section>
      )}
      {command.notes.length > 0 && (
        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notes</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">{command.notes.map((note) => <li key={note}>{note}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
