import { CopyCommandButton } from './CopyCommandButton';

export function GeneratedCommand({
  command,
  valid,
  issues,
}: {
  command: string;
  valid: boolean;
  issues: string[];
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Generated command
        </p>
        <CopyCommandButton command={command} />
      </div>
      <pre className="min-w-0 overflow-x-auto rounded bg-slate-950 p-3 text-xs leading-5 text-slate-100">
        <code>{command}</code>
      </pre>
      {!valid && (
        <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      {valid && (
        <p className="mt-2 text-[11px] text-emerald-700">
          Command passed the module's destructive-pattern check.
        </p>
      )}
    </section>
  );
}
