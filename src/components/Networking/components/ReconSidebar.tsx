import type { SectionId } from '../types/networkRecon';
const sections: [SectionId, string][] = [
  ['overview', 'Overview'],
  ['ip-mac', 'IP / MAC'],
  ['tcp-udp', 'TCP / UDP'],
  ['dns', 'DNS'],
  ['http', 'HTTP / HTTPS'],
  ['ports', 'Common Ports'],
  ['cidr', 'CIDR / Subnets'],
  ['routing', 'Routing'],
  ['nat', 'NAT'],
  ['firewall', 'Firewall'],
  ['proxy', 'Proxy'],
  ['reverse-proxy', 'Reverse Proxy'],
  ['curl', 'curl Inspection'],
  ['nmap', 'Nmap Reference'],
  ['packets', 'Packet Analysis'],
  ['workflows', 'Recon Workflows'],
  ['quick-reference', 'Quick Reference'],
];
export default function ReconSidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <aside className="nr-sidebar">
      <div className="nr-sidebar-title">Reference</div>
      {sections.map(([id, label]) => (
        <button
          key={id}
          className={active === id ? 'active' : ''}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </aside>
  );
}
