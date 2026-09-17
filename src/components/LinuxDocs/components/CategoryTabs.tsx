import type { CommandCategory, CommandCategoryInfo } from '../types/linuxDocs';

interface CategoryTabsProps {
  categories: CommandCategoryInfo[];
  selected: CommandCategory | 'all';
  onChange: (category: CommandCategory | 'all') => void;
}

export function CategoryTabs({
  categories,
  selected,
  onChange,
}: CategoryTabsProps) {
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${selected === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${selected === category.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
