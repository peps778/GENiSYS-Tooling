import { createContext, useContext, type ReactNode } from 'react';

import { useSidebarCollapse } from './useSidebarCollapse';

interface SidebarCollapseContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

/**
 * Shares the sidebar's collapsed state with any layout element that
 * needs to react to it — most importantly the page's main content
 * wrapper, which must shrink its left offset to match the sidebar's
 * current width instead of always reserving space for the expanded
 * width. Wrap the app shell (sidebar + main content) in this once,
 * above both of them.
 */
export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const { collapsed, toggleCollapsed } = useSidebarCollapse();

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggleCollapsed }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapseContext(): SidebarCollapseContextValue {
  const context = useContext(SidebarCollapseContext);

  if (!context) {
    throw new Error(
      'useSidebarCollapseContext must be used within a SidebarCollapseProvider'
    );
  }

  return context;
}