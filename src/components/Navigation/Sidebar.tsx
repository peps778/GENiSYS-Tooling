import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

/**
 * Primary navigation definitions.
 *
 * Routes are handled by React Router so the persistent application shell
 * remains mounted while only the active tool view changes.
 */
const navigationItems: NavigationItem[] = [
  {
    label: "Decoding / Encoding",
    href: "/decode",
    icon: "decode",
  },
  {
    label: "File Analysis",
    href: "/files",
    icon: "file",
  },
  {
    label: "Heap Dump / Memory",
    href: "/heap",
    icon: "memory",
  },
  {
    label: "Linux Docs",
    href: "/linux",
    icon: "terminal",
  },
  {
    label: "Navigation",
    href: "/navigation",
    icon: "navigation",
  },
  {
    label: "Networking",
    href: "/networking",
    icon: "network",
  },
  {
    label: "Notes / SOP",
    href: "/notes",
    icon: "notes",
  },
  {
    label: "OSINT",
    href: "/osint",
    icon: "search",
  },
  {
    label: "Web Automation / Exploit",
    href: "/web",
    icon: "web",
  },
];

/**
 * Minimal SVG icon component.
 *
 * Inline SVGs avoid introducing an additional icon dependency while
 * keeping the navigation bundle lightweight and deterministic.
 */
function Icon({ name }: { name: string }) {
  const common = "h-4 w-4 shrink-0 stroke-[1.8]";

  switch (name) {
    case "decode":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 8l-3 4 3 4" />
          <path d="M16 8l3 4-3 4" />
          <path d="M14 5l-4 14" />
        </svg>
      );

    case "file":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      );

    case "memory":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M8 10h8v4H8z" />
          <path d="M8 2v4M12 2v4M16 2v4" />
          <path d="M8 18v4M12 18v4M16 18v4" />
        </svg>
      );

    case "terminal":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m7 9 3 3-3 3" />
          <path d="M13 15h4" />
        </svg>
      );

    case "navigation":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="m8 6 4-4 4 4" />
          <path d="M5 8h14" />
          <path d="M5 16h14" />
        </svg>
      );

    case "network":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2.5" />
          <circle cx="5" cy="18" r="2.5" />
          <circle cx="19" cy="18" r="2.5" />
          <path d="M10.5 7 6.5 16" />
          <path d="M13.5 7 17.5 16" />
          <path d="M7.5 18h9" />
        </svg>
      );

    case "notes":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "search":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      );

    case "web":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9" />
          <path d="M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9" />
        </svg>
      );

    default:
      return null;
  }
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  /**
   * React Router owns the current path. This keeps active navigation
   * synchronized with client-side route changes without full reloads.
   */
  const currentPath = location.pathname.replace(/\/$/, "") || "/";

  return (
    <>
      {/* Mobile navigation trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-green-300 hover:text-green-700 lg:hidden"
      >
        {mobileOpen ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col",
          "border-r border-gray-200 bg-white",
          "transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="flex h-20 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
              G
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-gray-950">
                GENiSYS
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Tooling
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="GENiSYS Tooling navigation"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Modules
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const itemPath = item.href.replace(/\/$/, "");

              const isActive =
                currentPath === itemPath ||
                (itemPath !== "/" &&
                  currentPath.startsWith(`${itemPath}/`));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-950",
                  ].join(" ")}
                >
                  <span
                    className={
                      isActive
                        ? "text-green-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  >
                    <Icon name={item.icon} />
                  </span>

                  <span className="truncate">{item.label}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-400">
              GENiSYS Tooling
            </span>

            <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-400">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
