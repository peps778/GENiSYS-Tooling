import React from 'react';
import { TOOL_CATEGORIES, type ToolCategoryId } from '../types/reverseEngineering';

interface Props { activeCategory: ToolCategoryId; onSelect: (category: ToolCategoryId) => void; }

export default function ToolCategoryNav({ activeCategory, onSelect }: Props) {
  return <div role="tablist" aria-label="Reverse engineering categories" className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
    {TOOL_CATEGORIES.map((category) => {
      const active = category.id === activeCategory;
      return <button key={category.id} type="button" role="tab" aria-selected={active} onClick={() => onSelect(category.id)} className={[
        'rounded-[10px] px-3.5 py-2 text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2',
        active ? 'bg-[#16A34A] text-white border border-[#16A34A]' : 'bg-white text-[#111827] border border-[#E5E7EB] hover:border-[#16A34A] hover:text-[#15803D]',
      ].join(' ')}>{active && <span aria-hidden="true" className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white align-middle" />}{category.label}</button>;
    })}
  </div>;
}
