import ConceptCard from './ConceptCard';
export default function DnsPanel() {
  return (
    <>
      <ConceptCard title="DNS lookup path">
        <pre className="nr-diagram">
          Application\n↓\nLocal cache / resolver\n↓\nRecursive resolver\n↓\nRoot
          → TLD → authoritative server\n↓\nAnswer
        </pre>
        <p>
          Important records: A, AAAA, CNAME, MX, NS, TXT, SOA, PTR, and SRV.
        </p>
        <CodeList
          items={[
            'dig example.com',
            'dig example.com A',
            'dig example.com MX',
            'dig example.com NS',
            'dig example.com TXT',
            'dig -x 192.168.1.10',
            'dig +short example.com',
            'dig +trace example.com',
            'nslookup example.com',
          ]}
        />
      </ConceptCard>
    </>
  );
}
function CodeList({ items }: { items: string[] }) {
  return (
    <div className="nr-code-grid">
      {items.map((x) => (
        <code key={x}>{x}</code>
      ))}
    </div>
  );
}
