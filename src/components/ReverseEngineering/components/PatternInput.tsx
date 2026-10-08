import React from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}
export default function PatternInput({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="pattern-input"
        className="text-sm font-medium text-[#111827]"
      >
        Hex pattern
      </label>
      <input
        id="pattern-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="48 65 6C 6C 6F"
        spellCheck={false}
        className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5 font-mono text-sm text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
      />
    </div>
  );
}
