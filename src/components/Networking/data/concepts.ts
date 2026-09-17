import type { ReferenceItem } from '../types/networkRecon';
export const concepts: ReferenceItem[] = [
  {
    id: 'overview',
    title: 'Overview',
    category: 'Concept',
    description:
      'A practical path from networking fundamentals to inspection commands and reconnaissance workflows.',
    tags: ['network', 'fundamentals', 'recon'],
    section: 'overview',
  },
  {
    id: 'ip-mac',
    title: 'IP / MAC',
    category: 'Networking',
    description:
      'Logical addressing, link-layer addressing, ARP, IPv4, IPv6, loopback, private and public addresses.',
    tags: ['ip', 'ipv4', 'ipv6', 'mac', 'arp'],
    section: 'ip-mac',
  },
  {
    id: 'tcp-udp',
    title: 'TCP / UDP',
    category: 'Protocols',
    description:
      'Transport-layer behavior, connection states, reliability, ports, and the TCP handshake.',
    tags: ['tcp', 'udp', 'syn', 'ack', 'ports'],
    section: 'tcp-udp',
  },
  {
    id: 'dns',
    title: 'DNS',
    category: 'Protocols',
    description:
      'Resolvers, authoritative servers, record types, recursive lookups, and dig workflows.',
    tags: ['dns', 'dig', 'a', 'aaaa', 'mx', 'txt'],
    section: 'dns',
  },
  {
    id: 'http',
    title: 'HTTP / HTTPS',
    category: 'Protocols',
    description:
      'Requests, responses, methods, headers, cookies, status codes, and TLS.',
    tags: ['http', 'https', 'headers', 'cookies', 'tls'],
    section: 'http',
  },
  {
    id: 'ports',
    title: 'Common Ports',
    category: 'Reference',
    description:
      'Searchable TCP and UDP service-port reference with reconnaissance notes.',
    tags: ['ports', 'services', 'tcp', 'udp'],
    section: 'ports',
  },
  {
    id: 'cidr',
    title: 'CIDR / Subnets',
    category: 'Networking',
    description:
      'Interactive IPv4 CIDR calculator for network, broadcast, mask, and host ranges.',
    tags: ['cidr', 'subnet', '/24', 'mask'],
    section: 'cidr',
  },
  {
    id: 'routing',
    title: 'Routing',
    category: 'Networking',
    description:
      'Routing tables, gateways, interfaces, metrics, and next-hop selection.',
    tags: ['route', 'gateway', 'ip route'],
    section: 'routing',
  },
  {
    id: 'nat',
    title: 'NAT',
    category: 'Networking',
    description:
      'SNAT, DNAT, PAT, port forwarding, and private-to-public translation.',
    tags: ['nat', 'snat', 'dnat', 'pat'],
    section: 'nat',
  },
  {
    id: 'firewall',
    title: 'Firewall',
    category: 'Security',
    description: 'Allow, deny, drop, reject, stateful and stateless filtering.',
    tags: ['firewall', 'iptables', 'nft', 'ufw'],
    section: 'firewall',
  },
  {
    id: 'proxy',
    title: 'Forward Proxy',
    category: 'Architecture',
    description:
      'A proxy representing the client for routing, filtering, logging, and controlled testing.',
    tags: ['proxy', 'socks', 'forward'],
    section: 'proxy',
  },
  {
    id: 'reverse-proxy',
    title: 'Reverse Proxy',
    category: 'Architecture',
    description:
      'A server-facing intermediary handling TLS termination, routing, caching, and load balancing.',
    tags: ['reverse proxy', 'nginx', 'haproxy'],
    section: 'reverse-proxy',
  },
  {
    id: 'curl',
    title: 'curl Inspection',
    category: 'Commands',
    description:
      'Inspect HTTP headers, redirects, cookies, request bodies, and verbose connection details.',
    tags: ['curl', 'headers', 'http inspection'],
    section: 'curl',
  },
  {
    id: 'nmap',
    title: 'Nmap Reference',
    category: 'Commands',
    description:
      'Host discovery, port scanning, service detection, OS detection, and output formats.',
    tags: ['nmap', 'scan', 'service detection'],
    section: 'nmap',
  },
  {
    id: 'packets',
    title: 'Packet Analysis',
    category: 'Commands',
    description:
      'tcpdump, tshark, BPF filters, packet layers, and TCP field interpretation.',
    tags: ['tcpdump', 'tshark', 'pcap', 'packets'],
    section: 'packets',
  },
  {
    id: 'workflows',
    title: 'Recon Workflows',
    category: 'Workflow',
    description:
      'Repeatable basic network, web, local-network, and service-enumeration workflows.',
    tags: ['workflow', 'recon', 'enumeration'],
    section: 'workflows',
  },
  {
    id: 'quick-reference',
    title: 'Quick Reference',
    category: 'Reference',
    description: 'Frequently used inspection commands with copy actions.',
    tags: ['quick', 'commands'],
    section: 'quick-reference',
  },
];
