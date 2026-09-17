import { useState } from 'react';
import { kaliTools } from '../data/kali';
import { CopyCommandButton } from './CopyCommandButton';
import type { KaliTool } from '../types/linuxDocs';

export function KaliReference() {
  const [open, setOpen] = useState<string | null>(kaliTools[0]?.name ?? null);
  return (
    <div className="space-y-1">
      {kaliTools.map((tool: KaliTool) => (
        <div
          key={tool.name}
          className="rounded-md border border-slate-200 bg-white"
        >
          <button
            type="button"
            onClick={() =>
              setOpen((current) => (current === tool.name ? null : tool.name))
            }
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
          >
            <div className="min-w-0">
              <code className="text-xs font-semibold text-slate-900">
                {tool.name}
              </code>
              <span className="ml-2 text-[10px] text-slate-400">
                {tool.category}
              </span>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {tool.purpose}
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {open === tool.name ? '−' : '+'}
            </span>
          </button>
          {open === tool.name && (
            <div className="border-t border-slate-100 p-3">
              <div className="flex min-w-0 items-start gap-2">
                <pre className="min-w-0 flex-1 overflow-x-auto rounded bg-slate-950 p-2.5 text-xs text-slate-100">
                  <code>{tool.command}</code>
                </pre>
                <CopyCommandButton command={tool.command} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
