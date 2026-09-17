import ConceptCard from './ConceptCard';
export default function FirewallPanel() {
  return (
    <ConceptCard title="Firewall">
      <pre className="nr-diagram">
        Packet → rules → ALLOW / DROP / REJECT → application
      </pre>
      <p>
        Stateful filtering tracks connection state; stateless filtering
        evaluates each packet independently. DROP silently discards traffic,
        while REJECT actively responds that it was refused.
      </p>
      <div className="nr-code-grid">
        <code>iptables</code>
        <code>nft</code>
        <code>ufw</code>
      </div>
    </ConceptCard>
  );
}
