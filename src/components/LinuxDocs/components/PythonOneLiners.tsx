import { pythonOneLiners } from '../data/python';
import { CopyCommandButton } from './CopyCommandButton';

export function PythonOneLiners() {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {pythonOneLiners.map((item) => (
        <article
          key={item.title}
          className="rounded-md border border-slate-200 bg-white p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                {item.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {item.purpose}
              </p>
            </div>
            <CopyCommandButton command={item.command} />
          </div>
          <pre className="mt-2 min-w-0 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100">
            <code>{item.command}</code>
          </pre>
          {item.notes.length > 0 && (
            <p className="mt-2 text-[10px] text-slate-400">
              {item.notes.join(' ')}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
