export type SectionId =
  | 'overview'
  | 'ip-mac'
  | 'tcp-udp'
  | 'dns'
  | 'http'
  | 'ports'
  | 'cidr'
  | 'routing'
  | 'nat'
  | 'firewall'
  | 'proxy'
  | 'reverse-proxy'
  | 'curl'
  | 'nmap'
  | 'packets'
  | 'workflows'
  | 'quick-reference';

export interface ReferenceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  section: SectionId;
}

export interface CommandReference {
  command: string;
  description: string;
  notes?: string;
  tags?: string[];
}

export interface PortEntry {
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP';
  service: string;
  purpose: string;
  reconNotes: string;
  enumeration?: string;
}

export interface CidrResult {
  input: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  prefixLength: number;
  totalAddresses: number;
  usableHostCount: number;
  firstHost: string;
  lastHost: string;
}
