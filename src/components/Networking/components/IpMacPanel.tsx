import ConceptCard from './ConceptCard';
export default function IpMacPanel() {
  return (
    <>
      <ConceptCard
        title="IP Address"
        description="An IP address is a logical network-layer address used to identify an interface or endpoint."
      >
        <p>
          <b>IPv4</b> uses 32 bits; <b>IPv6</b> uses 128 bits. Private IPv4
          ranges include 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16. Loopback
          is 127.0.0.0/8, commonly 127.0.0.1.
        </p>
        <p>
          IP identifies the logical destination; MAC identifies a link-layer
          interface on the local network. ARP maps an IPv4 address to a local
          MAC address.
        </p>
        <CodeList items={['ip addr', 'ip link', 'ip neigh', 'arp -a']} />
      </ConceptCard>
      <ConceptCard title="IP ↔ MAC">
        <pre className="nr-diagram">
          Application → IP packet → Ethernet frame\n IP destination\n ↓\n ARP
          resolution\n ↓\n Destination MAC
        </pre>
      </ConceptCard>
    </>
  );
}
function CodeList({ items }: { items: string[] }) {
  return (
    <ul className="nr-command-list">
      {items.map((x) => (
        <li key={x}>
          <code>{x}</code>
        </li>
      ))}
    </ul>
  );
}
