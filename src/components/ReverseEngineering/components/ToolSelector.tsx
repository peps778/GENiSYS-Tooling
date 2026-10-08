import React from 'react';
import {
  getToolsForCategory,
  type ToolCategoryId,
  type ToolId,
} from '../types/reverseEngineering';

interface Props {
  category: ToolCategoryId;
  activeTool: ToolId;
  onSelect: (tool: ToolId) => void;
}

export default function ToolSelector({
  category,
  activeTool,
  onSelect,
}: Props) {
  return (
    <div
      role="tablist"
      aria-label="Reverse engineering tools"
      className="flex flex-wrap gap-2"
    >
      {getToolsForCategory(category).map((tool) => {
        const active = tool.id === activeTool;
        return (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tool.id)}
            className={[
              'rounded-[10px] px-3 py-1.5 text-sm font-medium border transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2',
              active
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:border-[#16A34A]',
            ].join(' ')}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
