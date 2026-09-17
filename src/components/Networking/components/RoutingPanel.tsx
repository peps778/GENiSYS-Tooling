import ConceptCard from './ConceptCard';
export default function RoutingPanel() {
  return (
    <ConceptCard
      title="Routing"
      description="Linux selects routes using the most specific matching destination prefix, then considers route metrics."
    >
      <p>
        Key fields are destination, gateway, interface, metric, and next hop.
      </p>
      <div className="nr-code-grid">
        <code>ip route</code>
        <code>ip route get 8.8.8.8</code>
        <code>route -n</code>
      </div>
      <p>
        Troubleshooting targets: no route, wrong gateway, wrong interface, and
        missing default route.
      </p>
    </ConceptCard>
  );
}
