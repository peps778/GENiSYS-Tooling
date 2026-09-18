import type { SectionId } from '../types/networkRecon';

export const reconSections: Array<{
  id: SectionId;
  number: string;
  title: string;
  description: string;
}> = [
  {
    id: 'overview',
    number: '01',
    title: 'Overview',
    description: 'Core networking concepts and traffic flow',
  },
  {
    id: 'ip-mac',
    number: '02',
    title: 'IP / MAC',
    description: 'Addressing, ARP, IPv4, and IPv6',
  },
  {
    id: 'tcp-udp',
    number: '03',
    title: 'TCP / UDP',
    description: 'Transport protocols and connection behavior',
  },
  {
    id: 'dns',
    number: '04',
    title: 'DNS',
    description: 'Name resolution and DNS records',
  },
  {
    id: 'http',
    number: '05',
    title: 'HTTP / HTTPS',
    description: 'Web requests, headers, and status codes',
  },
  {
    id: 'ports',
    number: '06',
    title: 'Common Ports',
    description: 'Frequently encountered network services',
  },
  {
    id: 'cidr',
    number: '07',
    title: 'CIDR',
    description: 'Subnet and address-range calculations',
  },
  {
    id: 'routing',
    number: '08',
    title: 'Routing',
    description: 'Routes, gateways, and forwarding',
  },
  {
    id: 'nat',
    number: '09',
    title: 'NAT',
    description: 'Network address translation',
  },
  {
    id: 'firewall',
    number: '10',
    title: 'Firewalls',
    description: 'Filtering and traffic policy',
  },
  {
    id: 'proxy',
    number: '11',
    title: 'Proxy',
    description: 'Forward proxy concepts and traffic routing',
  },
  {
    id: 'reverse-proxy',
    number: '12',
    title: 'Reverse Proxy',
    description: 'Backend routing and traffic termination',
  },
  {
    id: 'curl',
    number: '13',
    title: 'curl',
    description: 'HTTP request and response inspection',
  },
  {
    id: 'nmap',
    number: '14',
    title: 'Nmap',
    description: 'Host, port, and service discovery syntax',
  },
  {
    id: 'packets',
    number: '15',
    title: 'Packet Analysis',
    description: 'tcpdump, tshark, and packet inspection',
  },
  {
    id: 'workflows',
    number: '16',
    title: 'Workflows',
    description: 'Repeatable network investigation workflows',
  },
  {
    id: 'quick-reference',
    number: '17',
    title: 'Quick Reference',
    description: 'Common commands and syntax',
  },
];

export default function ReconSidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav
      className="nr-reference-sidebar"
      aria-label="Networking reference sections"
    >
      <div
        className="nr-reference-scroll"
        role="tablist"
        aria-label="Networking sections"
      >
        {reconSections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            aria-selected={active === section.id}
            className={`nr-reference-item ${active === section.id ? 'is-active' : ''}`}
            onClick={() => onSelect(section.id)}
            title={section.description}
          >
            <span className="nr-reference-number">{section.number}</span>
            <span className="nr-reference-copy">{section.title}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
