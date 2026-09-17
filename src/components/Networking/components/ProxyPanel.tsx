import ConceptCard from './ConceptCard';
export default function ProxyPanel() {
  return (
    <>
      <ConceptCard title="Forward Proxy">
        <pre className="nr-diagram">Client → Forward Proxy → Internet</pre>
        <p>
          A forward proxy represents the client. Common uses include routing,
          filtering, logging, caching, authentication, and controlled testing.
        </p>
        <code>curl -x http://proxy:8080 https://example.com</code>
      </ConceptCard>
      <ConceptCard title="Reverse Proxy">
        <pre className="nr-diagram">Client → Reverse Proxy → Backend</pre>
        <p>
          A reverse proxy represents the server/backend and commonly handles TLS
          termination, routing, load balancing, caching, compression, header
          manipulation, and access control.
        </p>
        <p>Examples include Nginx, Apache, HAProxy, and Traefik.</p>
      </ConceptCard>
    </>
  );
}
