import { useMemo, useState } from 'react';
import { quickReferenceGroups } from '../data/quickReference';

export default function QuickReference() {
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState(quickReferenceGroups[0]?.id ?? '');

  const group =
    quickReferenceGroups.find((item) => item.id === groupId) ??
    quickReferenceGroups[0];
  const filteredItems = useMemo(() => {
    if (!group) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return group.items;
    return group.items.filter((item) =>
      [item.name, item.summary, item.command, ...item.details, ...item.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [group, query]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Reference areas
            </p>
          </div>
          <nav
            className="max-h-[520px] overflow-y-auto p-2"
            aria-label="Quick reference areas"
          >
            {quickReferenceGroups.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setGroupId(item.id)}
                className={`mb-1 w-full rounded-md px-2.5 py-2 text-left text-xs transition ${
                  groupId === item.id
                    ? 'bg-emerald-50 font-semibold text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Quick reference
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                  {group?.title}
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                  {group?.description}
                </p>
              </div>
              <div className="w-full sm:w-64">
                <label htmlFor="quick-reference-search" className="sr-only">
                  Search this reference area
                </label>
                <input
                  id="quick-reference-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter this reference..."
                  className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-xs outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-4 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.summary}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 ring-1 ring-slate-200">
                      ref
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {item.command && (
                    <pre className="overflow-x-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-slate-200">
                      <code>{item.command}</code>
                    </pre>
                  )}
                  <ul className="space-y-1.5 text-xs leading-5 text-slate-700">
                    {item.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!filteredItems.length && (
            <div className="m-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-xs text-slate-500">
              No reference items match this filter.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
