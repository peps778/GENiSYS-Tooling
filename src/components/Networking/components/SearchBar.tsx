import { SearchIcon } from './icons';

export default function SearchBar({
  value,
  onChange,
  onFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}) {
  return (
    <label className="nr-search-field">
      <SearchIcon />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder="Search networking reference..."
        aria-label="Search reference sections"
      />
    </label>
  );
}
