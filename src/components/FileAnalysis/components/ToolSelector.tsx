import React from "react";

export interface ToolSelectorOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ToolSelectorProps<T extends string> {
  options: ToolSelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * Compact segmented control. Used for things like bytes-per-row, string
 * encoding, and similar small mutually-exclusive settings -- not the main
 * tab navigation (see ToolCategoryNav for that).
 */
export function ToolSelector<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: ToolSelectorProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center rounded-[10px] border border-[#E5E7EB] bg-white p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={[
              "px-2.5 py-1 text-xs font-medium rounded-[8px] transition-colors",
              active
                ? "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
                : "text-[#6B7280] border border-transparent hover:text-[#111827]",
              option.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ToolSelector;
