import type { SOPSection } from '../types/notesSop';

interface Props {
  sections: SOPSection[];
  active: string;
  onSelect: (id: string) => void;
}

export default function SOPSidebar({ sections, active, onSelect }: Props) {
  return (
    <aside className="hidden min-h-0 w-48 shrink-0 border-r border-slate-200 bg-slate-50 lg:block">
      <div className="h-full overflow-y-auto p-3">
        <div className="mb-3 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Reference areas
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            SOP and investigation library
          </p>
        </div>

        <nav aria-label="Notes and SOP sections" className="space-y-1">
          {sections.map((section) => {
            const selected = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={selected ? 'page' : undefined}
                title={section.description}
                className={`group relative flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition ${
                  selected
                    ? 'bg-white font-semibold text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {selected && (
                  <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-600" />
                )}
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${
                    selected
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                  }`}
                >
                  {section.number}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-[9px] leading-3.5 text-slate-400">
                    {section.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
