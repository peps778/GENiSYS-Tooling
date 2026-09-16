/**
 * TabNav.tsx
 *
 * Local (non-router) tab navigation for the Heap Dump module's five
 * analysis views. These are UI state inside /heap, not separate routes.
 */
import type { HeapDumpTabId } from "../types/heap";
import { CodeIcon, KeyIcon, LayersIcon, SearchIcon } from "./icons";

export interface TabNavProps {
  activeTab: HeapDumpTabId;
  onChange: (tab: HeapDumpTabId) => void;
  counts?: Partial<Record<HeapDumpTabId, number>>;
}

interface TabDef {
  id: HeapDumpTabId;
  label: string;
  icon: (props: { width?: number; height?: number; className?: string }) => JSX.Element;
} 

export const HEAP_DUMP_TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: LayersIcon },
  { id: "strings", label: "Strings", icon: CodeIcon },
  { id: "secrets", label: "Secrets", icon: KeyIcon },
  { id: "search", label: "Regex Search", icon: SearchIcon },
  { id: "json", label: "JSON Extract", icon: CodeIcon },
];

export default function TabNav({ activeTab, onChange, counts }: TabNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
      {HEAP_DUMP_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const count = counts?.[tab.id];
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "border-[#16A34A] text-[#15803D]"
                : "border-transparent text-[#4B5563] hover:text-[#111827]",
            ].join(" ")}
          >
            <Icon width={14} height={14} />
            {tab.label}
            {typeof count === "number" && (
              <span className="ml-1 rounded-full bg-[#F9FAFB] px-1.5 py-0.5 text-[10px] font-semibold text-[#4B5563]">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
