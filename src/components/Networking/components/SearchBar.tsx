import { SearchIcon } from './icons';
export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="nr-search">
      <SearchIcon />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search concepts, commands, ports, protocols..."
        aria-label="Search network reference"
      />
    </label>
  );
}
