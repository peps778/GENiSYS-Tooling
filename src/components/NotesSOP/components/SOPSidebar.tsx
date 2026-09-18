import type { SOPSection } from '../types/notesSop';

interface Props {
  sections: SOPSection[];
  active: string;
  onSelect: (id: string) => void;
}

export default function SOPSidebar({ sections, active, onSelect }: Props) {
  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:w-[264px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Workspace
            </p>
            <p className="mt-0.5 text-xs font-semibold text-gray-600">
              Reference library
            </p>
          </div>
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">
            {sections.length}
          </span>
        </div>

        <nav aria-label="SOP sections" className="space-y-1">
          {sections.map((section) => {
            const selected = active === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSelect(section.id)}
                aria-current={selected ? 'page' : undefined}
                className={`group relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                  selected
                    ? 'bg-green-50 text-green-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {selected && (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-green-700" />
                )}
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${selected ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}
                >
                  {section.number}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-semibold ${selected ? 'text-green-900' : 'text-gray-800'}`}
                  >
                    {section.title}
                  </span>
                  <span
                    className={`mt-0.5 block text-[11px] leading-4 ${selected ? 'text-green-700/80' : 'text-gray-400'}`}
                  >
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
