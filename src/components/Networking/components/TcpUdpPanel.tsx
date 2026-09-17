import ConceptCard from './ConceptCard';
export default function TcpUdpPanel() {
  return (
    <>
      <ConceptCard title="TCP vs UDP">
        <table className="nr-table">
          <thead>
            <tr>
              <th>TCP</th>
              <th>UDP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Connection-oriented</td>
              <td>Connectionless</td>
            </tr>
            <tr>
              <td>Reliable, ordered delivery</td>
              <td>No built-in delivery guarantee</td>
            </tr>
            <tr>
              <td>Retransmission and flow control</td>
              <td>Low overhead and latency</td>
            </tr>
            <tr>
              <td>HTTP, SSH, SMTP</td>
              <td>DNS, DHCP, streaming, VoIP</td>
            </tr>
          </tbody>
        </table>
      </ConceptCard>
      <ConceptCard title="TCP three-way handshake">
        <pre className="nr-diagram">
          Client Server\n | ---- SYN ---------&gt; |\n | &lt;--- SYN/ACK ------
          |\n | ---- ACK ---------&gt; |\n | connection ready |
        </pre>
        <p>
          SYN starts a connection, SYN-ACK acknowledges and synchronizes, ACK
          completes setup. Other useful flags include FIN for orderly close and
          RST for abrupt reset.
        </p>
        <p>
          States to recognize: LISTEN, SYN-SENT, SYN-RECV, ESTABLISHED,
          TIME-WAIT, CLOSE-WAIT.
        </p>
        <code>ss -tulpn</code> <code>ss -tan</code>
      </ConceptCard>
    </>
  );
}
