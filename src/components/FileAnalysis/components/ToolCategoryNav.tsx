import React from "react";

export type AnalysisTabId =
  | "overview"
  | "identification"
  | "metadata"
  | "strings"
  | "hex"
  | "image"
  | "archive"
  | "steganography"
  | "recovery"
  | "binary";

interface TabDefinition {
  id: AnalysisTabId;
  label: string;
}

const ALWAYS_AVAILABLE: TabDefinition[] = [
  { id: "overview", label: "Overview" },
  { id: "identification", label: "Identification" },
  { id: "metadata", label: "Metadata" },
  { id: "strings", label: "Strings" },
  { id: "hex", label: "Hex" },
  { id: "binary", label: "Binary Analysis" },
  { id: "steganography", label: "Steganography" },
  { id: "recovery", label: "Recovery" },
];

interface ToolCategoryNavProps {
  activeTab: AnalysisTabId;
  onSelectTab: (tab: AnalysisTabId) => void;
  showImageTab: boolean;
  showArchiveTab: boolean;
}

/**
 * Primary analysis tab bar. Hex, Strings, Identification, and Binary
 * Analysis always remain available (they work on arbitrary binary data);
 * Image and Archive appear only when the loaded file matches that category.
 */
export function ToolCategoryNav({
  activeTab,
  onSelectTab,
  showImageTab,
  showArchiveTab,
}: ToolCategoryNavProps) {
  const tabs: TabDefinition[] = [...ALWAYS_AVAILABLE];
  if (showImageTab) tabs.splice(6, 0, { id: "image", label: "Image" });
  if (showArchiveTab) tabs.splice(showImageTab ? 7 : 6, 0, { id: "archive", label: "Archive" });

  return (
    <nav
      aria-label="Analysis tools"
      className="flex flex-wrap gap-1 border-b border-[#E5E7EB] overflow-x-auto"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            aria-current={active ? "page" : undefined}
            className={[
              "shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-[#16A34A] text-[#16A34A]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default ToolCategoryNav;
