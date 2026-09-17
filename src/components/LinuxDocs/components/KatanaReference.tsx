import { katanaReferences } from '../data/katana';
import { CopyCommandButton } from './CopyCommandButton';

export function KatanaReference() {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {katanaReferences.map((item) => (
        <article
          key={item.command}
          className="rounded-md border border-slate-200 bg-white p-3"
        >
          <p className="text-xs font-semibold text-slate-800">{item.purpose}</p>
          <pre className="mt-2 min-w-0 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100">
            <code>{item.example}</code>
          </pre>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span key={tag} className="text-[10px] text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
            <CopyCommandButton command={item.example} />
          </div>
        </article>
      ))}
    </div>
  );
}
