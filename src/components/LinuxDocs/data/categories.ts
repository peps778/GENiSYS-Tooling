import type { CommandCategoryInfo } from '../types/linuxDocs';

export const commandCategories: CommandCategoryInfo[] = [
  {
    id: 'core',
    label: 'Core Linux',
    description:
      'Navigation, identity, permissions, environment, and basic file operations.',
  },
  {
    id: 'text',
    label: 'Text Processing',
    description: 'Search, transform, compare, sort, and stream text.',
  },
  {
    id: 'forensics',
    label: 'File / Forensics',
    description:
      'Metadata, magic bytes, strings, archives, hashes, and artifact inspection.',
  },
  {
    id: 'process',
    label: 'Processes / System',
    description: 'Processes, sockets, services, resources, and system logs.',
  },
  {
    id: 'network',
    label: 'Networking',
    description: 'Interfaces, routes, connectivity, sockets, and HTTP clients.',
  },
  {
    id: 'dns',
    label: 'DNS',
    description:
      'Record queries, reverse lookups, and domain registration information.',
  },
  {
    id: 'web',
    label: 'Web / HTTP',
    description:
      'Authorized web assessment, HTTP inspection, endpoint discovery, and content discovery.',
  },
  {
    id: 'nmap',
    label: 'Nmap',
    description:
      'Host discovery, TCP scanning, service detection, scripts, and output.',
  },
  {
    id: 'logs',
    label: 'Logs',
    description:
      'Authentication, errors, IPs, URLs, user agents, and frequency analysis.',
  },
  {
    id: 'security',
    label: 'Security References',
    description: 'Security-oriented utilities and controlled lab references.',
  },
];
