interface CollapseToggleButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Small chevron button that toggles the desktop sidebar between its
 * full width and an icon-only rail. Hidden below the `lg` breakpoint
 * since the mobile drawer already has its own hamburger toggle.
 */
export function CollapseToggleButton({
  collapsed,
  onToggle,
}: CollapseToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-pressed={collapsed}
      className="absolute -right-3 top-8 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors duration-150 hover:border-green-300 hover:text-green-700 lg:flex"
    >
      <svg
        className={`h-3.5 w-3.5 stroke-[2] transition-transform duration-200 ${
          collapsed ? 'rotate-180' : ''
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m14 6-6 6 6 6" />
      </svg>
    </button>
  );
}
