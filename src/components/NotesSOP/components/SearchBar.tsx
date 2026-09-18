interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <label className="relative block">
      <span className="sr-only">Search the SOP library</span>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400" aria-hidden="true">⌕</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search cases, commands, vulnerabilities..."
        className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 hidden items-center md:flex">
        <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-400">⌘ K</kbd>
      </span>
    </label>
  );
}
