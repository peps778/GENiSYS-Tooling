import ConceptCard from './ConceptCard';
export default function HttpPanel() {
  return (
    <>
      <ConceptCard title="HTTP request / response">
        <pre className="nr-code-block">
          GET / HTTP/1.1\nHost: example.com\nUser-Agent: ...\nAccept:
          ...\nCookie: ...
        </pre>
        <pre className="nr-code-block">
          HTTP/1.1 200 OK\nContent-Type: text/html\nContent-Length: ...
        </pre>
        <p>
          Methods include GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.
          Status codes commonly encountered include 200, 201, 204, 301, 302,
          304, 400, 401, 403, 404, 405, 429, 500, 502, 503, and 504.
        </p>
      </ConceptCard>
      <ConceptCard title="HTTPS">
        <p>
          HTTPS is HTTP carried through TLS, providing encryption and server
          authentication in transit. It does not automatically make the
          application secure.
        </p>
      </ConceptCard>
    </>
  );
}
