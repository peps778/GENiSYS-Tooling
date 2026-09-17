import { useMemo, useState } from 'react';
import { ports } from '../data/ports';
import ConceptCard from './ConceptCard';
export default function PortsPanel() {
  const [q, setQ] = useState('');
  const rows = useMemo(
    () =>
      ports.filter((p) =>
        `${p.port} ${p.protocol} ${p.service} ${p.purpose} ${p.reconNotes}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [q],
  );
  return (
    <ConceptCard
      title="Common Ports"
      description="A port suggests an endpoint; it does not guarantee which service is actually running."
    >
      <input
        className="nr-inline-input"
        placeholder="Filter ports, services, protocols..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="nr-table-wrap">
        <table className="nr-table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Transport</th>
              <th>Service</th>
              <th>Purpose</th>
              <th>Recon notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.port}-${p.protocol}`}>
                <td>
                  <code>{p.port}</code>
                </td>
                <td>{p.protocol}</td>
                <td>{p.service}</td>
                <td>{p.purpose}</td>
                <td>{p.reconNotes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ConceptCard>
  );
}
