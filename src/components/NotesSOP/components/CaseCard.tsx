import type { SOPCase } from '../types/notesSop';

interface Props {
  item: SOPCase;
  selected: boolean;
  onClick: () => void;
}

export default function CaseCard({ item, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={`group relative w-full border-b px-3 py-3 text-left transition last:border-b-0 ${
        selected
          ? 'bg-green-50/70'
          : 'border-gray-100 bg-white hover:bg-gray-50'
      }`}
    >
      {selected && (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-green-700" />
      )}
      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-semibold ${selected ? 'text-green-900' : 'text-gray-900'}`}
          >
            {item.title}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500">
            {item.summary}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide ${selected ? 'bg-white text-green-700 ring-1 ring-green-200' : 'bg-gray-100 text-gray-500'}`}
        >
          {item.difficulty}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 pl-1">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded bg-white px-1.5 py-0.5 text-[9px] text-gray-500 ring-1 ring-gray-200"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
