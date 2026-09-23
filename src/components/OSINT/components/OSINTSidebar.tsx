import { useMemo, useState } from 'react';
import type { OSINTSection } from '../types/osint';

const groups = [
  { id: 'core', label: 'Start', range: ['overview', 'quick-reference'] },
  {
    id: 'reference',
    label: 'Reference',
    range: [
      'dns',
      'whois',
      'subdomains',
      'url-domain',
      'metadata',
      'search',
      'username-email',
    ],
  },
  {
    id: 'evidence',
    label: 'Evidence',
    range: ['public-evidence', 'tools', 'evidence-workflow'],
  },
  { id: 'workspace', label: 'Workspace', range: ['cases', 'logbook'] },
];

export default function OSINTSidebar({
  sections,
  active,
  onSelect,
}: {
  sections: OSINTSection[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    reference: true,
    evidence: true,
    workspace: true,
  });
  const byId = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  return (
    <aside
      className={`hidden min-h-0 shrink-0 border-r border-slate-200 bg-slate-50 transition-[width] duration-200 lg:flex lg:flex-col ${collapsed ? 'w-14' : 'w-60'}`}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2">
        {!collapsed && (
          <div className="min-w-0 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              OSINT
            </p>
            <p className="truncate text-[11px] font-semibold text-slate-700">
              Reference navigation
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={
            collapsed ? 'Expand OSINT navigation' : 'Collapse OSINT navigation'
          }
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <span aria-hidden="true" className="text-sm">
            {collapsed ? '›' : '‹'}
          </span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <nav aria-label="OSINT sections" className="space-y-2">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? true;
            const groupSections = group.range
              .map((id) => byId.get(id))
              .filter(Boolean) as OSINTSection[];
            const groupActive = groupSections.some(
              (section) => section.id === active,
            );
            return (
              <section key={group.id}>
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.id]: !isOpen,
                      }))
                    }
                    className="flex w-full items-center justify-between px-2 py-1 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 hover:text-slate-700"
                  >
                    <span>{group.label}</span>
                    <span className="text-[11px]">{isOpen ? '−' : '+'}</span>
                  </button>
                ) : (
                  <div
                    className={`mx-auto mb-1 h-px w-7 ${groupActive ? 'bg-emerald-400' : 'bg-slate-200'}`}
                  />
                )}
                {isOpen && (
                  <div className="space-y-0.5">
                    {groupSections.map((section) => {
                      const selected = active === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => onSelect(section.id)}
                          aria-current={selected ? 'page' : undefined}
                          title={
                            collapsed
                              ? `${section.number} — ${section.title}`
                              : section.description
                          }
                          className={`group relative flex w-full items-center rounded-md text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${collapsed ? 'justify-center px-1 py-2' : 'gap-2 px-2 py-1.5'} ${selected ? 'bg-white font-semibold text-emerald-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                        >
                          {selected && (
                            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-600" />
                          )}
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${selected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'}`}
                          >
                            {section.number}
                          </span>
                          {!collapsed && (
                            <span className="min-w-0">
                              <span className="block truncate text-[11px] font-semibold">
                                {section.title}
                              </span>
                              <span className="mt-0.5 block truncate text-[9px] text-slate-400">
                                {section.description}
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
