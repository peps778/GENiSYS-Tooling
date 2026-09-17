import type { CommandCategory, CommandCategoryInfo } from "../types/linuxDocs";

interface LinuxDocsSidebarProps {
  categories: CommandCategoryInfo[];
  selected: CommandCategory | "all";
  onChange: (category: CommandCategory | "all") => void;
}

export function LinuxDocsSidebar({ categories, selected, onChange }: LinuxDocsSidebarProps) {
  return (
    <aside className="hidden min-h-0 w-44 shrink-0 border-r border-slate-200 bg-slate-50 lg:block">
      <div className="h-full overflow-y-auto p-3">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reference areas</p>
        <button type="button" onClick={() => onChange("all")} className={`mb-1 w-full rounded-md px-2.5 py-2 text-left text-xs font-semibold ${selected === "all" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:bg-white"}`}>All commands</button>
        {categories.map((category) => <button key={category.id} type="button" title={category.description} onClick={() => onChange(category.id)} className={`mb-1 w-full rounded-md px-2.5 py-2 text-left text-xs ${selected === category.id ? "bg-white font-semibold text-emerald-700 shadow-sm" : "text-slate-600 hover:bg-white"}`}>{category.label}</button>)}
      </div>
    </aside>
  );
}
