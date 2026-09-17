import ConceptCard from './ConceptCard';
import ReferenceList from './ReferenceList';
import { packetCommands } from '../data/packetAnalysis';
export default function PacketAnalysis() {
  return (
    <>
      <ConceptCard title="Packet Analysis">
        <p>
          Read captures from the outside in: frame → Ethernet → IP → TCP/UDP →
          application protocol → payload.
        </p>
        <p>
          Important fields include source/destination MAC, source/destination
          IP, source/destination port, protocol, TCP flags, sequence number,
          acknowledgement, and payload.
        </p>
        <ReferenceList items={packetCommands} />
      </ConceptCard>
      <ConceptCard title="Useful filters">
        <div className="nr-code-grid">
          <code>host 192.168.1.10</code>
          <code>port 53</code>
          <code>src host 10.0.0.5</code>
          <code>dst port 443</code>
          <code>tcp</code>
          <code>udp</code>
          <code>icmp</code>
        </div>
      </ConceptCard>
    </>
  );
}
