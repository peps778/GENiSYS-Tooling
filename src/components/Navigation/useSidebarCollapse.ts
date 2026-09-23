import { useEffect, useState } from 'react';

const STORAGE_KEY = 'genisys-sidebar-collapsed';

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // Private browsing / storage disabled — fall back to expanded.
    return false;
  }
}

/**
 * Tracks whether the desktop sidebar is collapsed to an icon-only
 * rail, persisting the choice across reloads. This only governs the
 * desktop (lg+) layout — the mobile off-canvas drawer is unaffected
 * and keeps its own open/closed state in the Sidebar component.
 */
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(readStoredPreference);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore storage failures — collapse state just won't persist.
    }
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((current) => !current);

  return { collapsed, toggleCollapsed };
}
