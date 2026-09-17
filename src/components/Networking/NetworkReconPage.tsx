import { useMemo, useState } from 'react';

type SectionKey =
  | 'overview'
  | 'ip-mac'
  | 'tcp-udp'
  | 'dns'
  | 'http'
  | 'ports'
  | 'cidr'
  | 'routing'
  | 'nat'
  | 'firewall'
  | 'proxy'
  | 'curl'
  | 'nmap'
  | 'packets'
  | 'workflows';

type ReferenceItem = {
  id: SectionKey;
  label: string;
  description: string;
};

const references: ReferenceItem[] = [
  {
    id: 'overview',
    label: 'Network Overview',
    description: 'Core networking concepts and traffic flow',
  },
  {
    id: 'ip-mac',
    label: 'IP / MAC',
    description: 'Addressing, ARP, IPv4, and IPv6',
  },
  {
    id: 'tcp-udp',
    label: 'TCP / UDP',
    description: 'Transport protocols and connection behavior',
  },
  {
    id: 'dns',
    label: 'DNS',
    description: 'Name resolution and DNS records',
  },
  {
    id: 'http',
    label: 'HTTP / HTTPS',
    description: 'Web requests, headers, and status codes',
  },
  {
    id: 'ports',
    label: 'Common Ports',
    description: 'Frequently encountered network services',
  },
  {
    id: 'cidr',
    label: 'CIDR Calculator',
    description: 'Subnet and address-range calculations',
  },
  {
    id: 'routing',
    label: 'Routing',
    description: 'Routes, gateways, and forwarding',
  },
  {
    id: 'nat',
    label: 'NAT',
    description: 'Network address translation',
  },
  {
    id: 'firewall',
    label: 'Firewalls',
    description: 'Filtering and access control',
  },
  {
    id: 'proxy',
    label: 'Proxies',
    description: 'Forward and reverse proxy behavior',
  },
  {
    id: 'curl',
    label: 'cURL Reference',
    description: 'Useful HTTP and network commands',
  },
  {
    id: 'nmap',
    label: 'Nmap Reference',
    description: 'Host discovery and port scanning',
  },
  {
    id: 'packets',
    label: 'Packet Analysis',
    description: 'tcpdump and Wireshark filters',
  },
  {
    id: 'workflows',
    label: 'Recon Workflows',
    description: 'Repeatable investigation procedures',
  },
];

const commonPorts = [
  ['20/21', 'FTP', 'File Transfer Protocol'],
  ['22', 'SSH', 'Secure Shell'],
  ['23', 'Telnet', 'Unencrypted remote terminal'],
  ['25', 'SMTP', 'Mail transfer'],
  ['53', 'DNS', 'Domain Name System'],
  ['67/68', 'DHCP', 'Dynamic host configuration'],
  ['80', 'HTTP', 'Unencrypted web traffic'],
  ['110', 'POP3', 'Mail retrieval'],
  ['123', 'NTP', 'Network Time Protocol'],
  ['143', 'IMAP', 'Mail retrieval'],
  ['161/162', 'SNMP', 'Network monitoring'],
  ['389', 'LDAP', 'Directory services'],
  ['443', 'HTTPS', 'Encrypted web traffic'],
  ['445', 'SMB', 'Windows file sharing'],
  ['636', 'LDAPS', 'Secure LDAP'],
  ['3306', 'MySQL', 'Database server'],
  ['3389', 'RDP', 'Remote Desktop Protocol'],
  ['5432', 'PostgreSQL', 'Database server'],
  ['6379', 'Redis', 'In-memory data store'],
  ['8080', 'HTTP Proxy', 'Alternate HTTP service'],
];

const styles = `
  .nr-root {
    min-height: 100%;
    width: 100%;
    background: #f0fdf4;
    color: #17251b;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .nr-container {
    display: flex;
    min-height: 100vh;
    width: 100%;
  }

  .nr-sidebar {
    width: 285px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid #bbf7d0;
    background: #ffffff;
    padding: 20px 14px;
  }

  .nr-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 24px;
    padding: 4px 8px;
  }

  .nr-brand-icon {
    display: flex;
    height: 38px;
    width: 38px;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #166534;
    color: #ffffff;
    font-size: 20px;
    font-weight: 800;
  }

  .nr-brand-title {
    margin: 0;
    color: #14532d;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .nr-brand-subtitle {
    margin: 2px 0 0;
    color: #6b7280;
    font-size: 11px;
  }

  .nr-sidebar-heading {
    margin: 0 8px 9px;
    color: #6b7280;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .nr-nav {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .nr-nav-button {
    display: flex;
    width: 100%;
    cursor: pointer;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    padding: 9px 10px;
    text-align: left;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
  }

  .nr-nav-button:hover {
    border-color: #bbf7d0;
    background: #f0fdf4;
  }

  .nr-nav-button.active {
    border-color: #86efac;
    background: #dcfce7;
  }

  .nr-nav-number {
    display: flex;
    height: 21px;
    width: 21px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 10px;
    font-weight: 800;
  }

  .nr-nav-button.active .nr-nav-number {
    background: #166534;
    color: #ffffff;
  }

  .nr-nav-text {
    min-width: 0;
  }

  .nr-nav-label {
    display: block;
    color: #374151;
    font-size: 12px;
    font-weight: 700;
  }

  .nr-nav-button.active .nr-nav-label {
    color: #14532d;
  }

  .nr-nav-description {
    display: block;
    margin-top: 2px;
    color: #9ca3af;
    font-size: 10px;
    line-height: 1.35;
  }

  .nr-main {
    min-width: 0;
    flex: 1;
    overflow-x: hidden;
  }

  .nr-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid #bbf7d0;
    background: rgba(255, 255, 255, 0.94);
    padding: 15px 28px;
    backdrop-filter: blur(12px);
  }

  .nr-header-title {
    margin: 0;
    color: #14532d;
    font-size: 18px;
    font-weight: 800;
  }

  .nr-header-description {
    margin: 3px 0 0;
    color: #6b7280;
    font-size: 12px;
  }

  .nr-search-wrapper {
    position: relative;
    width: min(360px, 100%);
  }

  .nr-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    color: #9ca3af;
    font-size: 14px;
    transform: translateY(-50%);
  }

  .nr-search {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    padding: 9px 12px 9px 34px;
    color: #111827;
    font-size: 12px;
    outline: none;
  }

  .nr-search:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14);
  }

  .nr-content {
    max-width: 1440px;
    margin: 0 auto;
    padding: 28px;
  }

  .nr-section {
    scroll-margin-top: 90px;
  }

  .nr-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .nr-eyebrow {
    margin: 0 0 5px;
    color: #16a34a;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .nr-title {
    margin: 0;
    color: #14532d;
    font-size: 27px;
    font-weight: 850;
    letter-spacing: -0.035em;
  }

  .nr-description {
    max-width: 760px;
    margin: 7px 0 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.6;
  }

  .nr-card {
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }

  .nr-card + .nr-card {
    margin-top: 16px;
  }

  .nr-card-header {
    border-bottom: 1px solid #dcfce7;
    padding: 16px 18px;
  }

  .nr-card-title {
    margin: 0;
    color: #166534;
    font-size: 14px;
    font-weight: 800;
  }

  .nr-card-subtitle {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.5;
  }

  .nr-card-body {
    padding: 18px;
  }

  .nr-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .nr-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .nr-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .nr-stat {
    border: 1px solid #dcfce7;
    border-radius: 10px;
    background: #f7fff9;
    padding: 14px;
  }

  .nr-stat-label {
    margin-bottom: 5px;
    color: #6b7280;
    font-size: 11px;
    font-weight: 700;
  }

  .nr-stat-value {
    color: #166534;
    font-size: 20px;
    font-weight: 850;
  }

  .nr-stat-description {
    margin-top: 4px;
    color: #9ca3af;
    font-size: 10px;
  }

  .nr-text {
    color: #4b5563;
    font-size: 13px;
    line-height: 1.7;
  }

  .nr-text strong {
    color: #166534;
  }

  .nr-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .nr-list li {
    position: relative;
    padding-left: 17px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.55;
  }

  .nr-list li::before {
    position: absolute;
    left: 0;
    top: 8px;
    height: 5px;
    width: 5px;
    border-radius: 999px;
    background: #22c55e;
    content: "";
  }

  .nr-code {
    overflow-x: auto;
    border-radius: 9px;
    background: #0f172a;
    padding: 15px;
    color: #d1fae5;
    font-family:
      "Cascadia Code",
      "SFMono-Regular",
      Consolas,
      monospace;
    font-size: 12px;
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .nr-inline-code {
    border-radius: 4px;
    background: #dcfce7;
    padding: 2px 5px;
    color: #166534;
    font-family: monospace;
    font-size: 11px;
  }

  .nr-table-wrapper {
    overflow-x: auto;
  }

  .nr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .nr-table th {
    background: #f0fdf4;
    color: #166534;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-align: left;
    text-transform: uppercase;
  }

  .nr-table th,
  .nr-table td {
    border-bottom: 1px solid #dcfce7;
    padding: 10px 12px;
    vertical-align: top;
  }

  .nr-table td {
    color: #4b5563;
  }

  .nr-table tr:last-child td {
    border-bottom: 0;
  }

  .nr-table td:first-child {
    color: #166534;
    font-family: monospace;
    font-weight: 700;
    white-space: nowrap;
  }

  .nr-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #dcfce7;
    padding: 4px 8px;
    color: #166534;
    font-size: 10px;
    font-weight: 800;
  }

  .nr-callout {
    border-left: 4px solid #22c55e;
    border-radius: 0 8px 8px 0;
    background: #f0fdf4;
    padding: 13px 15px;
    color: #166534;
    font-size: 12px;
    line-height: 1.6;
  }

  .nr-warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
    color: #92400e;
  }

  .nr-diagram {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    overflow-x: auto;
    padding: 20px 4px;
  }

  .nr-diagram-node {
    min-width: 105px;
    border: 1px solid #86efac;
    border-radius: 10px;
    background: #f0fdf4;
    padding: 13px 10px;
    text-align: center;
  }

  .nr-diagram-node strong {
    display: block;
    color: #166534;
    font-size: 12px;
  }

  .nr-diagram-node span {
    display: block;
    margin-top: 4px;
    color: #6b7280;
    font-size: 10px;
  }

  .nr-diagram-arrow {
    color: #22c55e;
    font-size: 20px;
    font-weight: 800;
  }

  .nr-form-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .nr-field {
    display: flex;
    min-width: 180px;
    flex: 1;
    flex-direction: column;
    gap: 6px;
  }

  .nr-label {
    color: #166534;
    font-size: 11px;
    font-weight: 800;
  }

  .nr-input,
  .nr-select {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    background: #ffffff;
    padding: 9px 10px;
    color: #374151;
    font-size: 12px;
    outline: none;
  }

  .nr-input:focus,
  .nr-select:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
  }

  .nr-button {
    cursor: pointer;
    border: 1px solid #16a34a;
    border-radius: 8px;
    background: #16a34a;
    padding: 9px 14px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }

  .nr-button:hover {
    background: #15803d;
  }

  .nr-button.secondary {
    border-color: #bbf7d0;
    background: #ffffff;
    color: #166534;
  }

  .nr-button.secondary:hover {
    background: #f0fdf4;
  }

  .nr-result {
    margin-top: 16px;
    border: 1px solid #bbf7d0;
    border-radius: 9px;
    background: #f7fff9;
    padding: 15px;
  }

  .nr-result-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .nr-result-item {
    border-bottom: 1px solid #dcfce7;
    padding-bottom: 8px;
  }

  .nr-result-item-label {
    color: #6b7280;
    font-size: 10px;
    font-weight: 700;
  }

  .nr-result-item-value {
    margin-top: 3px;
    color: #166534;
    font-family: monospace;
    font-size: 12px;
    font-weight: 700;
  }

  .nr-workflow {
    display: flex;
    gap: 12px;
    border-bottom: 1px solid #dcfce7;
    padding: 14px 0;
  }

  .nr-workflow:first-child {
    padding-top: 0;
  }

  .nr-workflow:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .nr-workflow-number {
    display: flex;
    height: 27px;
    width: 27px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #166534;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }

  .nr-workflow-title {
    margin: 0;
    color: #166534;
    font-size: 13px;
    font-weight: 800;
  }

  .nr-workflow-description {
    margin: 4px 0 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.55;
  }

  .nr-empty {
    border: 1px dashed #86efac;
    border-radius: 10px;
    background: #f7fff9;
    padding: 35px 20px;
    color: #6b7280;
    text-align: center;
  }

  .nr-footer {
    margin-top: 35px;
    border-top: 1px solid #dcfce7;
    padding-top: 18px;
    color: #9ca3af;
    font-size: 11px;
    text-align: center;
  }

  @media (max-width: 1100px) {
    .nr-sidebar {
      width: 240px;
    }

    .nr-grid-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 800px) {
    .nr-container {
      display: block;
    }

    .nr-sidebar {
      width: auto;
      max-height: none;
      border-right: 0;
      border-bottom: 1px solid #bbf7d0;
    }

    .nr-nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .nr-header {
      align-items: stretch;
      flex-direction: column;
      padding: 16px;
    }

    .nr-search-wrapper {
      width: 100%;
    }

    .nr-content {
      padding: 18px 14px;
    }

    .nr-grid,
    .nr-grid-3 {
      grid-template-columns: 1fr;
    }

    .nr-title {
      font-size: 23px;
    }
  }

  @media (max-width: 500px) {
    .nr-nav {
      grid-template-columns: 1fr;
    }

    .nr-grid-4,
    .nr-result-grid {
      grid-template-columns: 1fr;
    }

    .nr-diagram {
      align-items: stretch;
      flex-direction: column;
    }

    .nr-diagram-arrow {
      transform: rotate(90deg);
      text-align: center;
    }
  }
`;

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="nr-section-header">
      <div>
        <p className="nr-eyebrow">{eyebrow}</p>
        <h1 className="nr-title">{title}</h1>
        <p className="nr-description">{description}</p>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="nr-card">
      <div className="nr-card-header">
        <h2 className="nr-card-title">{title}</h2>
        {subtitle && <p className="nr-card-subtitle">{subtitle}</p>}
      </div>
      <div className="nr-card-body">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="nr-code">{children}</pre>;
}

function OverviewSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Network Reference"
        title="Network / Recon"
        description="An offline-first reference for network fundamentals, reconnaissance commands, packet analysis, addressing, services, and repeatable investigation workflows."
      />

      <div className="nr-grid-4">
        <div className="nr-stat">
          <div className="nr-stat-label">OSI Layers</div>
          <div className="nr-stat-value">7</div>
          <div className="nr-stat-description">Conceptual networking model</div>
        </div>

        <div className="nr-stat">
          <div className="nr-stat-label">Transport Protocols</div>
          <div className="nr-stat-value">2</div>
          <div className="nr-stat-description">TCP and UDP</div>
        </div>

        <div className="nr-stat">
          <div className="nr-stat-label">Common Ports</div>
          <div className="nr-stat-value">20+</div>
          <div className="nr-stat-description">
            Frequently encountered services
          </div>
        </div>

        <div className="nr-stat">
          <div className="nr-stat-label">Recon Tools</div>
          <div className="nr-stat-value">6+</div>
          <div className="nr-stat-description">
            CLI and packet-analysis utilities
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <Card
        title="What happens when a client connects to a service?"
        subtitle="A simplified end-to-end request path"
      >
        <div className="nr-diagram">
          <div className="nr-diagram-node">
            <strong>Client</strong>
            <span>Browser / CLI</span>
          </div>

          <div className="nr-diagram-arrow">→</div>

          <div className="nr-diagram-node">
            <strong>DNS</strong>
            <span>Name resolution</span>
          </div>

          <div className="nr-diagram-arrow">→</div>

          <div className="nr-diagram-node">
            <strong>Router</strong>
            <span>Default gateway</span>
          </div>

          <div className="nr-diagram-arrow">→</div>

          <div className="nr-diagram-node">
            <strong>Firewall / NAT</strong>
            <span>Policy translation</span>
          </div>

          <div className="nr-diagram-arrow">→</div>

          <div className="nr-diagram-node">
            <strong>Server</strong>
            <span>Listening service</span>
          </div>
        </div>
      </Card>

      <Card title="Core investigation sequence">
        <ul className="nr-list">
          <li>
            Identify the local host, interface, address, and default gateway.
          </li>
          <li>Resolve the target hostname and inspect DNS responses.</li>
          <li>Check route selection and reachability.</li>
          <li>Identify listening ports and exposed services.</li>
          <li>Inspect TCP connection state and application-layer behavior.</li>
          <li>Capture packets only when command output is insufficient.</li>
          <li>
            Document evidence, timestamps, commands, and observed results.
          </li>
        </ul>
      </Card>
    </div>
  );
}

function IpMacSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Layer 2 / Layer 3"
        title="IP and MAC Addressing"
        description="Understand the difference between local-link hardware addressing and routed network addressing."
      />

      <div className="nr-grid">
        <Card title="MAC address">
          <p className="nr-text">
            A MAC address identifies a network interface on a local Layer 2
            segment. Ethernet switches use MAC addresses to forward frames
            within a broadcast domain.
          </p>
          <CodeBlock>
            {`Example:
00:1A:2B:3C:4D:5E

Used by:
- Ethernet switching
- ARP cache entries
- Local-link frame delivery`}
          </CodeBlock>
        </Card>

        <Card title="IP address">
          <p className="nr-text">
            An IP address identifies a logical network endpoint and allows
            packets to travel across routed networks.
          </p>
          <CodeBlock>
            {`IPv4:
192.168.1.25

IPv6:
2001:db8::25

Used by:
- Routing
- Subnet membership
- Network-layer communication`}
          </CodeBlock>
        </Card>
      </div>

      <Card title="ARP resolution">
        <p className="nr-text">
          When a host knows the destination IPv4 address but needs the local MAC
          address, it uses ARP. The host broadcasts an ARP request and the
          destination responds with its MAC address.
        </p>
        <CodeBlock>
          {`arp -a
ip neigh
arping -I eth0 192.168.1.1`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function TcpUdpSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Transport Layer"
        title="TCP / UDP"
        description="Compare connection-oriented and connectionless transport behavior."
      />

      <div className="nr-grid">
        <Card title="TCP">
          <ul className="nr-list">
            <li>Connection-oriented.</li>
            <li>Reliable, ordered byte stream.</li>
            <li>Uses sequence numbers and acknowledgements.</li>
            <li>Performs connection establishment with a handshake.</li>
            <li>Commonly used by HTTPS, SSH, SMTP, and databases.</li>
          </ul>
          <CodeBlock>
            {`TCP handshake:

Client  → SYN       → Server
Client  ← SYN/ACK   ← Server
Client  → ACK       → Server`}
          </CodeBlock>
        </Card>

        <Card title="UDP">
          <ul className="nr-list">
            <li>Connectionless.</li>
            <li>No delivery or ordering guarantee.</li>
            <li>Lower protocol overhead.</li>
            <li>Useful for DNS, streaming, VoIP, and telemetry.</li>
            <li>Applications handle reliability when required.</li>
          </ul>
          <CodeBlock>
            {`UDP has no TCP-style handshake.

Application
    ↓
UDP datagram
    ↓
Destination socket`}
          </CodeBlock>
        </Card>
      </div>

      <Card title="Useful socket inspection commands">
        <CodeBlock>
          {`ss -tulpen
ss -tan
netstat -ano
lsof -i -P -n
Get-NetTCPConnection`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function DnsSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Name Resolution"
        title="DNS"
        description="DNS maps names to addresses and provides service-discovery information."
      />

      <Card title="Common DNS record types">
        <div className="nr-table-wrapper">
          <table className="nr-table">
            <thead>
              <tr>
                <th>Record</th>
                <th>Purpose</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A</td>
                <td>Maps a hostname to an IPv4 address.</td>
                <td>example.com → 93.184.216.34</td>
              </tr>
              <tr>
                <td>AAAA</td>
                <td>Maps a hostname to an IPv6 address.</td>
                <td>example.com → 2001:db8::1</td>
              </tr>
              <tr>
                <td>CNAME</td>
                <td>Alias pointing to another hostname.</td>
                <td>www → example.com</td>
              </tr>
              <tr>
                <td>MX</td>
                <td>Mail exchanger for a domain.</td>
                <td>mail.example.com</td>
              </tr>
              <tr>
                <td>NS</td>
                <td>Authoritative name server.</td>
                <td>ns1.example.com</td>
              </tr>
              <tr>
                <td>TXT</td>
                <td>Arbitrary text, SPF, DKIM, and verification data.</td>
                <td>v=spf1 include:...</td>
              </tr>
              <tr>
                <td>PTR</td>
                <td>Reverse lookup from IP to hostname.</td>
                <td>34.216.184.93.in-addr.arpa</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="DNS query commands">
        <CodeBlock>
          {`dig example.com
dig example.com A
dig example.com MX
dig -x 8.8.8.8
nslookup example.com
host example.com
resolvectl query example.com`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function HttpSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Application Layer"
        title="HTTP / HTTPS"
        description="Inspect request methods, headers, status codes, and TLS-protected traffic."
      />

      <Card title="HTTP methods">
        <div className="nr-table-wrapper">
          <table className="nr-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Purpose</th>
                <th>Typical behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GET</td>
                <td>Retrieve a resource.</td>
                <td>Should not modify server state.</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>Submit data or create a subordinate resource.</td>
                <td>May change server state.</td>
              </tr>
              <tr>
                <td>PUT</td>
                <td>Create or replace a resource.</td>
                <td>Idempotent in normal usage.</td>
              </tr>
              <tr>
                <td>PATCH</td>
                <td>Partially modify a resource.</td>
                <td>Updates selected fields.</td>
              </tr>
              <tr>
                <td>DELETE</td>
                <td>Remove a resource.</td>
                <td>May change server state.</td>
              </tr>
              <tr>
                <td>HEAD</td>
                <td>Retrieve headers without a response body.</td>
                <td>Useful for metadata checks.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="HTTP status families">
        <div className="nr-grid-3">
          <div className="nr-stat">
            <div className="nr-stat-label">1xx</div>
            <div className="nr-stat-value">Informational</div>
          </div>
          <div className="nr-stat">
            <div className="nr-stat-label">2xx</div>
            <div className="nr-stat-value">Success</div>
          </div>
          <div className="nr-stat">
            <div className="nr-stat-label">3xx</div>
            <div className="nr-stat-value">Redirect</div>
          </div>
          <div className="nr-stat">
            <div className="nr-stat-label">4xx</div>
            <div className="nr-stat-value">Client Error</div>
          </div>
          <div className="nr-stat">
            <div className="nr-stat-label">5xx</div>
            <div className="nr-stat-value">Server Error</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PortsSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Service Discovery"
        title="Common Ports"
        description="A quick reference for frequently encountered TCP and UDP services."
      />

      <Card title="Port reference">
        <div className="nr-table-wrapper">
          <table className="nr-table">
            <thead>
              <tr>
                <th>Port</th>
                <th>Service</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {commonPorts.map(([port, service, description]) => (
                <tr key={port}>
                  <td>{port}</td>
                  <td>{service}</td>
                  <td>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CidrSection() {
  const [cidr, setCidr] = useState('192.168.1.0/24');
  const [result, setResult] = useState<{
    network: string;
    broadcast: string;
    firstHost: string;
    lastHost: string;
    total: number;
    usable: number;
    mask: string;
  } | null>(null);
  const [error, setError] = useState('');

  function ipToNumber(ip: string) {
    const parts = ip.split('.').map(Number);

    if (
      parts.length !== 4 ||
      parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      throw new Error('Invalid IPv4 address');
    }

    return (
      ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
    );
  }

  function numberToIp(value: number) {
    return [
      (value >>> 24) & 255,
      (value >>> 16) & 255,
      (value >>> 8) & 255,
      value & 255,
    ].join('.');
  }

  function calculateCidr() {
    try {
      const [ip, prefixText] = cidr.trim().split('/');
      const prefix = Number(prefixText);

      if (!ip || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
        throw new Error('Use CIDR notation such as 192.168.1.0/24');
      }

      const address = ipToNumber(ip);
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = address & mask;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const total = 2 ** (32 - prefix);
      const usable = prefix >= 31 ? total : Math.max(total - 2, 0);

      setResult({
        network: numberToIp(network),
        broadcast: numberToIp(broadcast),
        firstHost: prefix >= 31 ? numberToIp(network) : numberToIp(network + 1),
        lastHost:
          prefix >= 31 ? numberToIp(broadcast) : numberToIp(broadcast - 1),
        total,
        usable,
        mask: numberToIp(mask),
      });
      setError('');
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to calculate CIDR information',
      );
    }
  }

  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Address Planning"
        title="CIDR Calculator"
        description="Calculate network boundaries, broadcast address, host range, and subnet mask."
      />

      <Card title="IPv4 CIDR calculation">
        <div className="nr-form-row">
          <label className="nr-field">
            <span className="nr-label">CIDR block</span>
            <input
              className="nr-input"
              value={cidr}
              onChange={(event) => setCidr(event.target.value)}
              placeholder="192.168.1.0/24"
              onKeyDown={(event) => {
                if (event.key === 'Enter') calculateCidr();
              }}
            />
          </label>

          <button className="nr-button" onClick={calculateCidr}>
            Calculate
          </button>
        </div>

        {error && (
          <div className="nr-callout nr-warning" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {result && (
          <div className="nr-result">
            <div className="nr-result-grid">
              <div className="nr-result-item">
                <div className="nr-result-item-label">Network Address</div>
                <div className="nr-result-item-value">{result.network}</div>
              </div>

              <div className="nr-result-item">
                <div className="nr-result-item-label">Broadcast Address</div>
                <div className="nr-result-item-value">{result.broadcast}</div>
              </div>

              <div className="nr-result-item">
                <div className="nr-result-item-label">First Host</div>
                <div className="nr-result-item-value">{result.firstHost}</div>
              </div>

              <div className="nr-result-item">
                <div className="nr-result-item-label">Last Host</div>
                <div className="nr-result-item-value">{result.lastHost}</div>
              </div>

              <div className="nr-result-item">
                <div className="nr-result-item-label">Subnet Mask</div>
                <div className="nr-result-item-value">{result.mask}</div>
              </div>

              <div className="nr-result-item">
                <div className="nr-result-item-label">Usable Hosts</div>
                <div className="nr-result-item-value">
                  {result.usable.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function RoutingSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Forwarding"
        title="Routing"
        description="Routing determines where packets are sent next based on destination prefixes."
      />

      <Card title="Routing concepts">
        <div className="nr-grid">
          <div>
            <h3 className="nr-card-title">Default gateway</h3>
            <p className="nr-text">
              The router used when no more-specific route exists for the
              destination.
            </p>
          </div>

          <div>
            <h3 className="nr-card-title">Longest-prefix match</h3>
            <p className="nr-text">
              The most specific matching route is selected over broader routes.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Route inspection commands">
        <CodeBlock>
          {`ip route
ip -6 route
route -n
netstat -rn
traceroute example.com
tracert example.com
Get-NetRoute`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function NatSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Address Translation"
        title="NAT"
        description="Network Address Translation changes source or destination addressing as traffic crosses a boundary."
      />

      <Card title="Common NAT forms">
        <div className="nr-grid">
          <div>
            <h3 className="nr-card-title">SNAT</h3>
            <p className="nr-text">
              Source NAT changes the source address, commonly allowing private
              hosts to access external networks.
            </p>
          </div>

          <div>
            <h3 className="nr-card-title">DNAT</h3>
            <p className="nr-text">
              Destination NAT changes the destination address, commonly used for
              port forwarding or publishing internal services.
            </p>
          </div>

          <div>
            <h3 className="nr-card-title">PAT</h3>
            <p className="nr-text">
              Port Address Translation multiplexes many internal connections
              through one public address using source ports.
            </p>
          </div>

          <div>
            <h3 className="nr-card-title">Static NAT</h3>
            <p className="nr-text">
              A fixed one-to-one mapping between internal and external
              addresses.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FirewallSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Traffic Control"
        title="Firewalls"
        description="Firewalls enforce policy by evaluating traffic against rules."
      />

      <Card title="Firewall evaluation checklist">
        <ul className="nr-list">
          <li>Is the traffic inbound, outbound, or forwarded?</li>
          <li>What interface or zone is involved?</li>
          <li>What source and destination addresses are present?</li>
          <li>What protocol and destination port are used?</li>
          <li>Does an earlier rule match the traffic?</li>
          <li>Is the default policy allow or deny?</li>
          <li>Are connection states tracked?</li>
          <li>Is logging enabled for the relevant rule?</li>
        </ul>
      </Card>

      <Card title="Useful commands">
        <CodeBlock>
          {`sudo nft list ruleset
sudo iptables -L -n -v
sudo ufw status verbose
Get-NetFirewallProfile
Get-NetFirewallRule`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function ProxySection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Intermediaries"
        title="Proxies"
        description="Understand how forward proxies and reverse proxies sit between clients and services."
      />

      <div className="nr-grid">
        <Card title="Forward proxy">
          <p className="nr-text">
            A forward proxy represents the client. It is commonly used for
            outbound filtering, caching, access control, and traffic auditing.
          </p>
          <CodeBlock>{`Client → Forward Proxy → Internet`}</CodeBlock>
        </Card>

        <Card title="Reverse proxy">
          <p className="nr-text">
            A reverse proxy represents the server. It can terminate TLS, balance
            traffic, cache responses, and route requests to backend services.
          </p>
          <CodeBlock>{`Client → Reverse Proxy → Backend Service`}</CodeBlock>
        </Card>
      </div>
    </div>
  );
}

function CurlSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Command Reference"
        title="cURL"
        description="Useful cURL patterns for connectivity, headers, authentication, and troubleshooting."
      />

      <Card title="Common cURL commands">
        <CodeBlock>
          {`# Basic request
curl https://example.com

# Show response headers
curl -I https://example.com

# Verbose connection details
curl -v https://example.com

# Follow redirects
curl -L https://example.com

# Show timing information
curl -o /dev/null -s -w \\
'http_code=%{http_code}\\nconnect=%{time_connect}\\ntotal=%{time_total}\\n' \\
https://example.com

# Send a custom header
curl -H "X-Debug: true" https://example.com

# Send JSON
curl -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"name":"test"}' \\
  https://example.com/api

# Ignore certificate validation for testing only
curl -k https://example.com`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function NmapSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Command Reference"
        title="Nmap"
        description="Host discovery, port enumeration, service detection, and focused scanning examples."
      />

      <Card title="Nmap examples">
        <CodeBlock>
          {`# Host discovery
nmap -sn 192.168.1.0/24

# Basic port scan
nmap 192.168.1.10

# Scan selected ports
nmap -p 22,80,443 192.168.1.10

# Scan all TCP ports
nmap -p- 192.168.1.10

# Service and version detection
nmap -sV 192.168.1.10

# Operating system detection
nmap -O 192.168.1.10

# Default scripts plus version detection
nmap -sC -sV 192.168.1.10

# UDP scan of selected ports
nmap -sU -p 53,123,161 192.168.1.10`}
        </CodeBlock>

        <div className="nr-callout nr-warning" style={{ marginTop: 16 }}>
          Only scan systems and networks for which you have explicit
          authorization.
        </div>
      </Card>
    </div>
  );
}

function PacketsSection() {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Traffic Inspection"
        title="Packet Analysis"
        description="Use packet captures to validate assumptions about DNS, TCP, TLS, HTTP, routing, and retransmissions."
      />

      <Card title="tcpdump filters">
        <CodeBlock>
          {`# Capture on an interface
sudo tcpdump -i eth0

# Capture a host
sudo tcpdump -i eth0 host 192.168.1.10

# Capture TCP traffic
sudo tcpdump -i eth0 tcp

# Capture a port
sudo tcpdump -i eth0 port 443

# DNS traffic
sudo tcpdump -i eth0 port 53

# Save to a pcap file
sudo tcpdump -i eth0 -w capture.pcap

# Read a pcap file
tcpdump -nn -r capture.pcap

# Show packet contents in ASCII
tcpdump -A -s 0 -i eth0 tcp port 80`}
        </CodeBlock>
      </Card>

      <Card title="Wireshark display filters">
        <CodeBlock>
          {`dns
tcp
udp
http
tls
ip.addr == 192.168.1.10
tcp.port == 443
http.request
http.response.code >= 400
tcp.flags.syn == 1
tcp.analysis.retransmission
tcp.analysis.duplicate_ack
dns.qry.name contains "example"`}
        </CodeBlock>
      </Card>
    </div>
  );
}

function WorkflowsSection() {
  const workflows = [
    {
      title: 'Basic host triage',
      description:
        'Identify interfaces, addresses, routes, DNS configuration, and active connections before testing the target.',
    },
    {
      title: 'Connectivity troubleshooting',
      description:
        'Test local gateway reachability, DNS resolution, route path, TCP connection establishment, and application response.',
    },
    {
      title: 'Service exposure review',
      description:
        'Enumerate listening sockets, identify process ownership, compare against expected services, and validate firewall exposure.',
    },
    {
      title: 'DNS investigation',
      description:
        'Compare resolver behavior, query record types, inspect authoritative responses, and test reverse resolution.',
    },
    {
      title: 'HTTP troubleshooting',
      description:
        'Inspect status codes, redirects, TLS negotiation, request headers, proxy behavior, and response timing.',
    },
    {
      title: 'Packet-level investigation',
      description:
        'Capture only the relevant interface and filter, then look for handshake failures, retransmissions, resets, fragmentation, or unexpected endpoints.',
    },
  ];

  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="Operational Playbooks"
        title="Recon Workflows"
        description="Repeatable workflows for diagnosing and documenting network behavior."
      />

      <Card title="Recommended workflows">
        {workflows.map((workflow, index) => (
          <div className="nr-workflow" key={workflow.title}>
            <div className="nr-workflow-number">{index + 1}</div>
            <div>
              <h3 className="nr-workflow-title">{workflow.title}</h3>
              <p className="nr-workflow-description">{workflow.description}</p>
            </div>
          </div>
        ))}
      </Card>

      <Card title="Evidence collection checklist">
        <ul className="nr-list">
          <li>Record the exact command and timestamp.</li>
          <li>Record the source host and interface.</li>
          <li>Record the destination hostname and resolved address.</li>
          <li>Preserve relevant stdout, stderr, and packet captures.</li>
          <li>Separate observed facts from assumptions.</li>
          <li>Repeat tests from a known-good comparison point.</li>
        </ul>
      </Card>
    </div>
  );
}

function renderSection(section: SectionKey) {
  switch (section) {
    case 'overview':
      return <OverviewSection />;
    case 'ip-mac':
      return <IpMacSection />;
    case 'tcp-udp':
      return <TcpUdpSection />;
    case 'dns':
      return <DnsSection />;
    case 'http':
      return <HttpSection />;
    case 'ports':
      return <PortsSection />;
    case 'cidr':
      return <CidrSection />;
    case 'routing':
      return <RoutingSection />;
    case 'nat':
      return <NatSection />;
    case 'firewall':
      return <FirewallSection />;
    case 'proxy':
      return <ProxySection />;
    case 'curl':
      return <CurlSection />;
    case 'nmap':
      return <NmapSection />;
    case 'packets':
      return <PacketsSection />;
    case 'workflows':
      return <WorkflowsSection />;
    default:
      return <OverviewSection />;
  }
}

export default function NetworkReconPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [search, setSearch] = useState('');

  const filteredReferences = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return references;
    }

    return references.filter((item) => {
      return (
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [search]);

  function selectSection(section: SectionKey) {
    setActiveSection(section);
    setSearch('');

    window.setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 0);
  }

  return (
    <>
      <style>{styles}</style>

      <div className="nr-root">
        <div className="nr-container">
          <aside className="nr-sidebar">
            <div className="nr-brand">
              <div className="nr-brand-icon">⌁</div>
              <div>
                <h2 className="nr-brand-title">Network / Recon</h2>
                <p className="nr-brand-subtitle">GENiSYS reference module</p>
              </div>
            </div>

            <p className="nr-sidebar-heading">Reference Sections</p>

            <nav className="nr-nav">
              {filteredReferences.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nr-nav-button ${
                    activeSection === item.id ? 'active' : ''
                  }`}
                  onClick={() => selectSection(item.id)}
                >
                  <span className="nr-nav-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="nr-nav-text">
                    <span className="nr-nav-label">{item.label}</span>
                    <span className="nr-nav-description">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </nav>

            {filteredReferences.length === 0 && (
              <div className="nr-empty">No matching reference sections.</div>
            )}
          </aside>

          <main className="nr-main">
            <header className="nr-header">
              <div>
                <h1 className="nr-header-title">GENiSYS Network / Recon</h1>
                <p className="nr-header-description">
                  Offline-first networking and reconnaissance reference
                </p>
              </div>

              <div className="nr-search-wrapper">
                <span className="nr-search-icon">⌕</span>
                <input
                  className="nr-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reference sections..."
                  aria-label="Search reference sections"
                />
              </div>
            </header>

            <div className="nr-content">
              {renderSection(activeSection)}

              <footer className="nr-footer">
                Network / Recon Reference · GENiSYS Tooling
              </footer>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
