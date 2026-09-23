export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  title?: string;
}

/**
 * Primary navigation definitions.
 *
 * Routes are handled by React Router so the persistent application shell
 * remains mounted while only the active tool view changes.
 */
export const navigationItems: NavigationItem[] = [
  {
    label: 'Decoding / Encoding',
    href: '/decode',
    icon: 'decode',
    // title: "GENiSYS | Decoder/Encoder"
  },
  {
    label: 'File Analysis',
    href: '/files',
    icon: 'file',
    // title: "GENiSYS | File Analyzer"
  },
  {
    label: 'Heap Dump / Memory',
    href: '/heap',
    icon: 'memory',
    // title: "GENiSYS | Memory Dump"
  },
  {
    label: 'Linux Docs',
    href: '/linux',
    icon: 'terminal',
    // title: "GENiSYS | Create Linux Commands"
  },
  // {
  //   label: "Navigation",
  //   href: "/navigation",
  //   icon: "navigation",
  // },
  {
    label: 'Networking',
    href: '/networking',
    icon: 'network',
    // title: "GENiSYS | Networking Docs and Tools"
  },
  {
    label: 'Notes / SOP',
    href: '/notes',
    icon: 'notes',
    title: 'GENiSYS | SOP for exploit and manuals',
  },
  {
    label: 'OSINT',
    href: '/osint',
    icon: 'search',
    // title: "GENiSYS | OSINT Resources"
  },
  {
    label: 'Web Automation / Exploit',
    href: '/web',
    icon: 'web',
    // title: "GENiSYS | Automate Web Exploit"
  },
];
