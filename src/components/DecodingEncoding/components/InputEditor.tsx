import React from 'react';
import { MAX_REASONABLE_INPUT_LENGTH } from '../types/decoding';

interface InputEditorProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  rows?: number;
}

export default function InputEditor({
  id,
  label,
  value,
  placeholder,
  onChange,
  rows = 8,
}: InputEditorProps) {
  const isLarge = value.length > MAX_REASONABLE_INPUT_LENGTH;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-[#111827]">
          {label}
        </label>
        <span className="text-xs text-[#6B7280]">
          {value.length.toLocaleString()} chars
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className={[
          'w-full resize-y rounded-[10px] border bg-white px-3 py-2.5 font-mono text-sm text-[#111827]',
          'placeholder:text-[#9CA3AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]',
          isLarge ? 'border-[#FCA5A5]' : 'border-[#E5E7EB]',
        ].join(' ')}
      />
      {isLarge && (
        <p className="text-xs text-[#B91C1C]" role="alert">
          Input is unusually large ({value.length.toLocaleString()} characters).
          Processing may be slow.
        </p>
      )}
    </div>
  );
}
