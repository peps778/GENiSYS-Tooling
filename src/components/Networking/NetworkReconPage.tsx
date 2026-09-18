import { useMemo, useState } from 'react';
import ReconSidebar, { reconSections } from './components/ReconSidebar';
import SearchBar from './components/SearchBar';
import SectionHeader from './components/SectionHeader';
import StatCard from './components/StatCard';
import NetworkDiagram from './components/NetworkDiagram';
import WorkflowDiagram from './components/WorkflowDiagram';
import CommandBlock from './components/CommandBlock';
import ConceptCard from './components/ConceptCard';
import IpMacPanel from './components/IpMacPanel';
import TcpUdpPanel from './components/TcpUdpPanel';
import DnsPanel from './components/DnsPanel';
import HttpPanel from './components/HttpPanel';
import PortsPanel from './components/PortsPanel';
import CidrPanel from './components/CidrPanel';
import RoutingPanel from './components/RoutingPanel';
import NatPanel from './components/NatPanel';
import FirewallPanel from './components/FirewallPanel';
import ProxyPanel from './components/ProxyPanel';
import CurlReference from './components/CurlReference';
import NmapReference from './components/NmapReference';
import PacketAnalysis from './components/PacketAnalysis';
import { concepts } from './data/concepts';
import { curlCommands } from './data/curl';
import { nmapCommands } from './data/nmap';
import { packetCommands } from './data/packetAnalysis';
import { ports } from './data/ports';
import type { SectionId } from './types/networkRecon';

const styles = `
  .nr-root {
    min-height: 100%;
    width: 100%;
    background: #f7f9f8;
    color: #111827;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .nr-module {
    min-height: 100vh;
    width: 100%;
  }

  /* Module chrome: deliberately flat, compact and separate from the global GENiSYS shell. */
  .nr-main {
    min-width: 0;
    min-height: 100vh;
    background: #f7f9f8;
    overflow: auto;
  }

  .nr-header {
    position: sticky;
    top: 0;
    z-index: 20;
    min-height: 64px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    padding: 10px 32px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .nr-header-brand { min-width: 0; }
  .nr-header-title { margin: 0; color: #172b1f; font-size: 16px; line-height: 1.2; font-weight: 750; letter-spacing: -.015em; }
  .nr-header-subtitle { margin: 3px 0 0; color: #6b7280; font-size: 11px; line-height: 1.3; }

  .nr-reference-sidebar {
    position: sticky;
    top: 64px;
    z-index: 15;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .nr-reference-scroll {
    width: min(1320px, calc(100% - 64px));
    margin: 0 auto;
    display: flex;
    align-items: stretch;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }

  .nr-reference-scroll::-webkit-scrollbar { height: 5px; }
  .nr-reference-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }

  .nr-reference-item {
    flex: 0 0 auto;
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 10px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #4b5563;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
    font: inherit;
  }

  .nr-reference-item:hover { color: #166534; background: #f8faf9; }
  .nr-reference-item.is-active { color: #166534; border-bottom-color: #16a34a; background: #f0fdf4; }

  .nr-reference-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 21px;
    height: 21px;
    padding: 0 4px;
    box-sizing: border-box;
    border-radius: 5px;
    background: #f3f4f6;
    color: #6b7280;
    font-size: 9px;
    line-height: 1;
    font-weight: 800;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .nr-reference-item.is-active .nr-reference-number { background: #166534; color: #fff; }
  .nr-reference-copy { font-size: 11px; line-height: 1; font-weight: 650; }

  .nr-search-field {
    position: relative;
    flex: 0 1 360px;
    width: min(360px, 42vw);
  }
  .nr-search-field > span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 14px; }
  .nr-search-field input {
    width: 100%;
    box-sizing: border-box;
    height: 36px;
    padding: 0 12px 0 34px;
    border: 1px solid #d1d5db;
    border-radius: 7px;
    outline: none;
    background: #fff;
    color: #111827;
    font-size: 12px;
  }
  .nr-search-field input::placeholder { color: #9ca3af; }
  .nr-search-field input:focus { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,.10); }

  .nr-search-results {
    position: fixed;
    right: 32px;
    top: 56px;
    z-index: 30;
    width: min(360px, calc(100vw - 64px));
    max-height: 320px;
    overflow: auto;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 12px 28px rgba(15,23,42,.10);
  }
  .nr-search-result { display: block; width: 100%; padding: 10px 12px; border: 0; border-bottom: 1px solid #f3f4f6; background: #fff; text-align: left; cursor: pointer; }
  .nr-search-result:last-child { border-bottom: 0; }
  .nr-search-result:hover { background: #f0fdf4; }
  .nr-search-result strong { display: block; color: #166534; font-size: 11px; }
  .nr-search-result span { display: block; margin-top: 3px; color: #6b7280; font-size: 10px; line-height: 1.4; }
  .nr-reference-empty { padding: 13px; color: #6b7280; font-size: 11px; }

  .nr-content {
    width: min(1320px, calc(100% - 64px));
    margin: 0 auto;
    padding: 32px 0 56px;
    box-sizing: border-box;
  }
  .nr-section { scroll-margin-top: 126px; }
  .nr-content-heading { margin: 0 0 22px; max-width: 900px; }
  .nr-content-heading > p { margin: 0 0 6px; color: #16a34a; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .nr-content-heading h1 { margin: 0; color: #172b1f; font-size: 28px; line-height: 1.12; font-weight: 760; letter-spacing: -.025em; }
  .nr-content-heading > div { max-width: 760px; margin-top: 8px; color: #4b5563; font-size: 12px; line-height: 1.65; }

  .nr-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 0; }
  .nr-stat-card { min-width: 0; border: 1px solid #dfe7e1; border-radius: 8px; background: #fff; padding: 15px 16px; }
  .nr-stat-card > span { display: block; color: #4b5563; font-size: 10px; font-weight: 700; }
  .nr-stat-card > strong { display: block; margin-top: 7px; color: #166534; font-size: 24px; line-height: 1; font-weight: 760; }
  .nr-stat-card > small { display: block; margin-top: 7px; color: #6b7280; font-size: 10px; line-height: 1.4; }

  .nr-card { margin-top: 14px; border: 1px solid #dfe7e1; border-radius: 8px; background: #fff; overflow: hidden; }
  .nr-card-heading { padding: 14px 16px; border-bottom: 1px solid #edf1ee; }
  .nr-card-heading h2 { margin: 0; color: #172b1f; font-size: 13px; font-weight: 750; }
  .nr-card-heading p { margin: 4px 0 0; color: #6b7280; font-size: 10px; line-height: 1.5; }
  .nr-card-body { padding: 16px; }
  .nr-card-body > p { color: #4b5563; font-size: 12px; line-height: 1.7; }
  .nr-card-body > p:first-child { margin-top: 0; }
  .nr-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .nr-list li { position: relative; padding-left: 14px; color: #4b5563; font-size: 11px; line-height: 1.55; }
  .nr-list li::before { content: ""; position: absolute; left: 0; top: 7px; width: 4px; height: 4px; border-radius: 999px; background: #22c55e; }
  .nr-card-body .nr-list + * { margin-top: 14px; }

  .nr-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .nr-grid .nr-card { margin-top: 0; }
  .nr-table-wrap { overflow-x: auto; }
  .nr-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .nr-table th { background: #f8faf9; color: #166534; text-align: left; font-size: 9px; letter-spacing: .05em; text-transform: uppercase; }
  .nr-table th, .nr-table td { padding: 9px 10px; border-bottom: 1px solid #edf1ee; vertical-align: top; }
  .nr-table td { color: #4b5563; line-height: 1.45; }
  .nr-table tr:last-child td { border-bottom: 0; }
  .nr-table td:first-child { color: #166534; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; white-space: nowrap; }

  .nr-code-grid { display: grid; gap: 7px; margin-top: 14px; }
  .nr-code-grid code, .nr-command-list code { display: block; border-radius: 6px; background: #111827; padding: 9px 10px; color: #d1fae5; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; overflow-x: auto; }
  .nr-command-list { display: grid; gap: 7px; margin: 14px 0 0; padding: 0; list-style: none; }
  .nr-code-block, .nr-diagram { overflow-x: auto; border-radius: 7px; background: #111827; color: #d1fae5; padding: 12px; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; line-height: 1.6; white-space: pre-wrap; }
  .nr-diagram { margin: 0; }
  .nr-muted { color: #6b7280; font-size: 10px; line-height: 1.55; }
  .nr-error { color: #b45309 !important; font-size: 10px !important; }
  .nr-inline-input { box-sizing: border-box; width: 100%; min-height: 34px; border: 1px solid #d1d5db; border-radius: 7px; padding: 7px 9px; outline: none; color: #374151; font-size: 11px; }
  .nr-inline-input:focus { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,.08); }
  .nr-form-row { display: flex; align-items: flex-end; gap: 9px; flex-wrap: wrap; }
  .nr-button { border: 1px solid #15803d; border-radius: 6px; background: #15803d; padding: 8px 12px; color: #fff; font-size: 11px; font-weight: 750; cursor: pointer; }
  .nr-button:hover { background: #166534; }
  .nr-stat { border: 1px solid #e1e8e2; border-radius: 7px; background: #f8faf9; padding: 11px; }
  .nr-stat-grid .nr-stat span { display: block; color: #6b7280; font-size: 9px; }
  .nr-stat-grid .nr-stat b { display: block; margin-top: 4px; color: #166534; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; }

  .nr-flow { display: flex; align-items: center; justify-content: flex-start; gap: 8px; padding: 18px 2px; overflow-x: auto; }
  .nr-flow-part { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .nr-flow-node { min-width: 108px; border: 1px solid #cfe2d4; border-radius: 7px; background: #f8fcf9; padding: 12px 10px; text-align: center; }
  .nr-flow-node strong { display: block; color: #166534; font-size: 11px; }
  .nr-flow-node span { display: block; margin-top: 4px; color: #6b7280; font-size: 9px; }
  .nr-flow-arrow { color: #16a34a; font-size: 17px; font-weight: 800; }

  .nr-workflow-sequence { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }
  .nr-workflow-step { position: relative; min-height: 68px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 6px; border: 1px solid #e1e8e2; border-radius: 7px; background: #f8faf9; padding: 10px 11px; color: #166534; font-size: 10px; font-weight: 700; }
  .nr-workflow-index { color: #16a34a; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 9px; }
  .nr-workflow-chevron { position: absolute; right: -8px; top: 50%; transform: translateY(-50%); color: #22c55e; font-size: 13px; z-index: 1; }

  .nr-command-block { margin-top: 9px; border: 1px solid #1f2937; border-radius: 7px; overflow: hidden; background: #111827; }
  .nr-command-topline { display: flex; align-items: center; justify-content: space-between; padding: 6px 9px; border-bottom: 1px solid #273244; color: #94a3b8; font-size: 8px; font-weight: 800; letter-spacing: .08em; }
  .nr-command-topline button { border: 1px solid #374151; border-radius: 5px; background: transparent; color: #cbd5e1; padding: 3px 7px; font-size: 8px; cursor: pointer; }
  .nr-command-block > code { display: block; padding: 10px; color: #d1fae5; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; white-space: pre-wrap; overflow-x: auto; }
  .nr-command-block > p, .nr-command-block > small { display: block; padding: 0 10px; color: #94a3b8; font-size: 9px; line-height: 1.5; }
  .nr-command-block > small { padding-bottom: 9px; }

  .nr-footer { margin-top: 26px; padding-top: 14px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9px; text-align: left; }

  @media (max-width: 1100px) {
    .nr-header, .nr-content { width: auto; }
    .nr-header { padding-left: 24px; padding-right: 24px; }
    .nr-reference-scroll, .nr-content { width: calc(100% - 48px); }
    .nr-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 760px) {
    .nr-header { position: sticky; padding: 11px 16px; align-items: stretch; flex-direction: column; gap: 9px; }
    .nr-search-field { width: 100%; flex-basis: auto; }
    .nr-reference-sidebar { top: 102px; }
    .nr-reference-scroll { width: calc(100% - 32px); }
    .nr-reference-item { min-height: 42px; padding: 0 8px; }
    .nr-reference-copy { font-size: 10px; }
    .nr-search-results { left: 16px; right: 16px; top: 104px; width: auto; }
    .nr-content { width: calc(100% - 32px); padding: 24px 0 40px; }
    .nr-grid { grid-template-columns: 1fr; }
    .nr-workflow-sequence { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .nr-workflow-chevron { display: none; }
    .nr-content-heading h1 { font-size: 25px; }
  }

  @media (max-width: 480px) {
    .nr-stat-grid { grid-template-columns: 1fr; }
    .nr-workflow-sequence { grid-template-columns: 1fr; }
    .nr-flow { align-items: stretch; flex-direction: column; }
    .nr-flow-part { flex-direction: column; width: 100%; }
    .nr-flow-node { width: 100%; box-sizing: border-box; }
    .nr-flow-arrow { transform: rotate(90deg); }
  }
`;


const searchText: Record<SectionId, string> = {
  overview: 'network overview osi layers transport protocols common ports recon tools client dns router firewall nat server traffic flow investigation sequence',
  'ip-mac': 'ip mac ipv4 ipv6 arp addressing private public loopback network broadcast commands ip addr ip link ip neigh arp -a',
  'tcp-udp': 'tcp udp transport protocols handshake syn ack socket connection reliability ordering ss netstat lsof',
  dns: 'dns domain name resolution resolver root tld authoritative a aaaa cname mx ns txt ptr dig nslookup host',
  http: 'http https web requests response headers methods cookies status codes tls get post put patch delete head options',
  ports: `common ports tcp udp ftp ssh telnet smtp dns dhcp http pop3 ntp imap snmp ldap https smb rdp mysql postgresql redis mongodb ${ports.map((p) => `${p.port} ${p.service} ${p.purpose} ${p.reconNotes}`).join(' ')}`,
  cidr: 'cidr calculator subnet ipv4 network broadcast subnet mask prefix host range address planning /24 /16 /8',
  routing: 'routing routes gateway forwarding longest prefix metric next hop ip route traceroute tracert',
  nat: 'nat snat dnat pat source destination address translation port forwarding private public',
  firewall: 'firewall filtering traffic policy stateful stateless allow deny drop reject iptables nft ufw',
  proxy: 'forward proxy proxy client internet outbound filtering caching access control socks',
  'reverse-proxy': 'reverse proxy backend server tls termination routing caching load balancing nginx haproxy',
  curl: `curl inspection http headers redirects cookies request body verbose status timing ${curlCommands.flat().join(' ')}`,
  nmap: `nmap reference host discovery port scan service version os detection scripts output ${nmapCommands.flat().join(' ')}`,
  packets: `packet analysis tcpdump tshark pcap filters ethernet ip tcp udp dns tls http retransmission ${packetCommands.flat().join(' ')}`,
  workflows: 'recon workflows investigation triage connectivity service exposure dns http packet level evidence collection',
  'quick-reference': 'quick reference commands syntax ip ss dig nslookup curl nmap tcpdump tshark route ufw iptables nft',
};

function OverviewSection({ onSelect }: { onSelect: (id: SectionId) => void }) {
  return (
    <div className="nr-section">
      <SectionHeader
        eyebrow="NETWORK REFERENCE"
        title="Network Overview"
        description="An offline-first reference for network fundamentals, reconnaissance commands, packet analysis, addressing, services, and repeatable investigation workflows."
      />

      <div className="nr-stat-grid">
        <StatCard label="OSI Layers" value="7" description="Conceptual networking model" />
        <StatCard label="Transport Protocols" value="2" description="TCP and UDP" />
        <StatCard label="Common Ports" value="20+" description="Frequently encountered services" />
        <StatCard label="Recon Tools" value="6+" description="CLI and packet-analysis utilities" />
      </div>

      <ConceptCard title="What happens when a client connects to a service?" description="A simplified end-to-end request path">
        <NetworkDiagram
          nodes={[
            { title: 'Client', subtitle: 'Browser / CLI' },
            { title: 'DNS', subtitle: 'Name resolution' },
            { title: 'Router', subtitle: 'Default gateway' },
            { title: 'Firewall / NAT', subtitle: 'Policy translation' },
            { title: 'Server', subtitle: 'Listening service' },
          ]}
        />
      </ConceptCard>

      <ConceptCard title="Core investigation sequence" description="A repeatable educational workflow for working from basic connectivity toward packet evidence.">
        <WorkflowDiagram
          steps={['Identify target', 'Resolve DNS', 'Check routing', 'Inspect ports', 'Identify services', 'Inspect HTTP/TLS', 'Capture/analyze packets', 'Document findings']}
        />
      </ConceptCard>

    </div>
  );
}

function ReverseProxySection() {
  return (
    <div className="nr-section">
      <SectionHeader eyebrow="INTERMEDIARIES" title="Reverse Proxy" description="A reverse proxy represents the server side of a connection and can terminate, route, cache, or balance application traffic." />
      <ConceptCard title="Request path" description="A simple server-facing intermediary model.">
        <NetworkDiagram nodes={[
          { title: 'Client', subtitle: 'Browser / API client' },
          { title: 'Reverse Proxy', subtitle: 'TLS / routing' },
          { title: 'Backend Server', subtitle: 'Application service' },
        ]} />
      </ConceptCard>
      <ConceptCard title="Common responsibilities">
        <ul className="nr-list">
          <li>Terminate TLS connections and forward requests to upstream services.</li>
          <li>Route requests by host, path, or other application metadata.</li>
          <li>Balance traffic across backend instances where configured.</li>
          <li>Cache selected responses or apply request/response policy.</li>
        </ul>
      </ConceptCard>
    </div>
  );
}

function QuickReferenceSection() {
  const commands = [
    { command: 'ip addr', description: 'Display network interfaces and assigned addresses.' },
    { command: 'ip route', description: 'Inspect the routing table and default gateway.' },
    { command: 'ip neigh', description: 'Inspect the local neighbor/ARP table.' },
    { command: 'ss -tulpen', description: 'Inspect listening TCP/UDP sockets and process details.' },
    { command: 'dig example.com', description: 'Query DNS records.' },
    { command: 'curl -I https://example.com', description: 'Inspect HTTP response headers.' },
    { command: 'nmap -sV TARGET', description: 'Identify services and versions on an authorized target.' },
    { command: 'tcpdump -i eth0', description: 'Capture packets on a selected interface.' },
    { command: 'tshark -r capture.pcap -Y "dns"', description: 'Filter DNS packets from a saved capture.' },
  ];
  return (
    <div className="nr-section">
      <SectionHeader eyebrow="QUICK REFERENCE" title="Quick Reference" description="Frequently used commands and syntax for network inspection and authorized reconnaissance." />
      <ConceptCard title="Command reference" description="Commands are displayed for study and copying; this module does not execute them.">
        {commands.map((item) => <CommandBlock key={item.command} {...item} />)}
      </ConceptCard>
      <ConceptCard title="Operational reminder">
        <p className="nr-muted">Ports and command output provide evidence, not guarantees. Validate the actual service, context, and authorization before drawing conclusions or testing a system.</p>
      </ConceptCard>
    </div>
  );
}

function WorkflowsSection() {
  return (
    <div className="nr-section">
      <SectionHeader eyebrow="OPERATIONAL PLAYBOOKS" title="Recon Workflows" description="Repeatable workflows for diagnosing and documenting network behavior." />
      <ConceptCard title="Core workflow">
        <WorkflowDiagram steps={['Identify target', 'Resolve DNS', 'Check routing', 'Inspect ports', 'Identify services', 'Inspect HTTP/TLS', 'Capture/analyze packets', 'Document findings']} />
      </ConceptCard>
      <ConceptCard title="Evidence collection checklist">
        <ul className="nr-list">
          <li>Record the exact command and timestamp.</li>
          <li>Record the source host and interface.</li>
          <li>Record the destination hostname and resolved address.</li>
          <li>Preserve relevant stdout, stderr, and packet captures.</li>
          <li>Separate observed facts from assumptions.</li>
          <li>Repeat tests from a known-good comparison point.</li>
        </ul>
      </ConceptCard>
    </div>
  );
}

function renderSection(section: SectionId, onSelect: (id: SectionId) => void) {
  switch (section) {
    case 'overview': return <OverviewSection onSelect={onSelect} />;
    case 'ip-mac': return <IpMacPanel />;
    case 'tcp-udp': return <TcpUdpPanel />;
    case 'dns': return <DnsPanel />;
    case 'http': return <HttpPanel />;
    case 'ports': return <PortsPanel />;
    case 'cidr': return <CidrPanel />;
    case 'routing': return <RoutingPanel />;
    case 'nat': return <NatPanel />;
    case 'firewall': return <FirewallPanel />;
    case 'proxy': return <ProxyPanel />;
    case 'reverse-proxy': return <ReverseProxySection />;
    case 'curl': return <CurlReference />;
    case 'nmap': return <NmapReference />;
    case 'packets': return <PacketAnalysis />;
    case 'workflows': return <WorkflowsSection />;
    case 'quick-reference': return <QuickReferenceSection />;
  }
}

export default function NetworkReconPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return reconSections.filter(({ id }) => {
      const concept = concepts.find((item) => item.section === id);
      const section = reconSections.find((item) => item.id === id);
      return `${section?.title ?? ''} ${section?.description ?? ''} ${searchText[id]} ${concept?.description ?? ''} ${concept?.tags.join(' ') ?? ''}`.toLowerCase().includes(q);
    });
  }, [search]);

  function selectSection(id: SectionId) {
    setActiveSection(id);
    setSearch('');
    setSearchOpen(false);
    window.requestAnimationFrame(() => {
      const main = document.querySelector('.nr-main');
      main?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return (
    <>
      <style>{styles}</style>
      <div className="nr-root">
        <div className="nr-module">
          <main className="nr-main">
            <header className="nr-header">
              <div className="nr-header-brand">
                <h1 className="nr-header-title">Networking</h1>
                <p className="nr-header-subtitle">Network reference &amp; investigation</p>
              </div>
              <SearchBar value={search} onChange={(value) => { setSearch(value); setSearchOpen(Boolean(value.trim())); }} onFocus={() => setSearchOpen(Boolean(search.trim()))} />
            </header>

            <ReconSidebar active={activeSection} onSelect={selectSection} />

            {searchOpen && search.trim() && (
              <div className="nr-search-results">
                {results.length > 0 ? results.map((result) => (
                  <button key={result.id} type="button" className="nr-search-result" onClick={() => selectSection(result.id)}>
                    <strong>{result.number} · {result.title}</strong>
                    <span>{result.description}</span>
                  </button>
                )) : <div className="nr-reference-empty">No matching reference content.</div>}
              </div>
            )}

            <div className="nr-content">
              {renderSection(activeSection, selectSection)}
              <footer className="nr-footer">Networking reference · offline-first documentation</footer>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
