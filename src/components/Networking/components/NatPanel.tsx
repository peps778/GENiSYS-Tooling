import ConceptCard from './ConceptCard';
export default function NatPanel() {
  return (
    <ConceptCard
      title="NAT"
      description="Network Address Translation rewrites address and/or port information between network boundaries."
    >
      <pre className="nr-diagram">
        192.168.1.10:50000 → NAT router → 203.0.113.10:40000 → Internet
      </pre>
      <p>
        SNAT changes source addresses, DNAT changes destination addresses, and
        PAT multiplexes many private connections through translated ports. NAT
        is not the same as a firewall.
      </p>
    </ConceptCard>
  );
}
