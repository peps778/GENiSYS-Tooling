import React from "react";
import { getToolsForCategory, type ToolCategoryId, type ToolId } from "../types/decoding";

interface ToolSelectorProps {
  category: ToolCategoryId;
  activeTool: ToolId;
  onSelect: (tool: ToolId) => void;
}

export default function ToolSelector({ category, activeTool, onSelect }: ToolSelectorProps) {
  const tools = getToolsForCategory(category);

  return (
    <div role="tablist" aria-label="Tools" className="flex flex-wrap gap-2">
      {tools.map((tool) => {
        const isActive = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tool.id)}
            className={[
              "rounded-[10px] px-3 py-1.5 text-sm font-medium border transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2",
              isActive
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#16A34A]",
            ].join(" ")}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
