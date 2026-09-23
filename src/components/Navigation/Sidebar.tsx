import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../Authentication/logout';

import { navigationItems } from '../Navigation/navigationItems';
import { NavigationIcon } from '../Navigation/NavigationIcon';
import { useSidebarCollapseContext } from '../Navigation/SidebarCollapseContext';
import { CollapseToggleButton } from '../Navigation/CollapseToggleButton';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useSidebarCollapseContext();
  const location = useLocation();

  /**
   * React Router owns the current path. This keeps active navigation
   * synchronized with client-side route changes without full reloads.
   */
  const currentPath = location.pathname.replace(/\/$/, '') || '/';

  // Applied to text/decoration elements that should disappear only
  // once the desktop rail is collapsed — the mobile drawer is always
  // shown at full width, so `lg:hidden` has no effect there.
  const hiddenWhenCollapsed = collapsed ? 'lg:hidden' : '';

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
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
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
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col',
          'border-r border-gray-200 bg-white',
          'transition-[transform,width] duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-64',
        ].join(' ')}
      >
        <CollapseToggleButton collapsed={collapsed} onToggle={toggleCollapsed} />

        {/* Brand */}
        <div
          className={[
            'flex h-20 items-center border-b border-gray-200 px-6',
            collapsed ? 'lg:justify-center lg:px-0' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
              G
            </div>

            <div className={hiddenWhenCollapsed}>
              <p className="text-sm font-semibold tracking-tight text-green-700">
                GENiSYS
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Toolkit
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="GENiSYS Tooling navigation"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <p
            className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 ${hiddenWhenCollapsed}`}
          >
            Modules
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const itemPath = item.href.replace(/\/$/, '');

              const isActive =
                currentPath === itemPath ||
                (itemPath !== '/' && currentPath.startsWith(`${itemPath}/`));

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                  className={[
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-sm font-medium transition-colors duration-150',
                    collapsed ? 'lg:justify-center lg:px-2' : '',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950',
                  ].join(' ')}
                >
                  <span
                    className={
                      isActive
                        ? 'text-green-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }
                  >
                    <NavigationIcon name={item.icon} />
                  </span>

                  <span className={`truncate ${hiddenWhenCollapsed}`}>{item.label}</span>

                  {isActive && (
                    <span
                      className={`ml-auto h-1.5 w-1.5 rounded-full bg-green-600 ${hiddenWhenCollapsed}`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={logout}
            title={collapsed ? 'Log out' : undefined}
            className={[
              'group mb-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
              'text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-green-50 hover:text-green-700',
              collapsed ? 'lg:justify-center lg:px-0' : '',
            ].join(' ')}
          >
            <span className="text-gray-400 transition-colors group-hover:text-green-600">
              <NavigationIcon name="logout" />
            </span>

            <span className={hiddenWhenCollapsed}>Log out</span>
          </button>

          <div className={`flex items-center justify-between ${hiddenWhenCollapsed}`}>
            <span className="text-[11px] font-medium text-green-700">
              GENiSYS Tooling
            </span>

            <span className="rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-green-700">
              v1.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}