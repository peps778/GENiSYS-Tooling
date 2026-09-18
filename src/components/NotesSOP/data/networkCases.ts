import type { SOPCase } from '../types/notesSop';

export const networkCases: SOPCase[] = [
  {
    id: 'network-listening-service',
    category: 'network',
    title: 'Unexpected Listening Service',
    summary:
      'A local or remote system exposes a service whose purpose is not yet understood.',
    whenToUse: [
      'ss shows an unexpected listener',
      'Nmap reports an unfamiliar service',
    ],
    prerequisites: ['System or target is in scope'],
    observations: ['IP', 'Port', 'Protocol', 'Process', 'State'],
    initialChecks: [
      'Determine TCP/UDP',
      'Identify local process if possible',
      'Check interface binding',
    ],
    steps: [
      {
        id: 'a',
        action: 'Inspect listeners',
        purpose: 'Map listening sockets to processes.',
        command: 'ss -tulpn',
        expectedObservation: 'Listening addresses, ports, and processes.',
        possibleResults: [
          'Expected listener',
          'Unknown listener',
          'Local-only listener',
        ],
        evidence: ['ss output'],
      },
      {
        id: 'b',
        action: 'Check route/interface context',
        purpose: 'Determine whether the service is externally reachable.',
        command: 'ip addr && ip route',
        expectedObservation: 'Interface addresses and routes.',
        possibleResults: ['Loopback/local', 'LAN', 'Externally routed'],
        evidence: ['Network configuration'],
      },
    ],
    branches: [
      {
        id: 'local',
        condition: 'Listener is loopback-only',
        result: 'Local service',
        nextAction: 'Identify process and expected application role.',
        evidence: ['Binding address'],
      },
      {
        id: 'remote',
        condition: 'Listener is reachable on a network interface',
        result: 'Exposed service',
        nextAction: 'Perform controlled service identification.',
        evidence: ['Interface', 'Port'],
      },
    ],
    alternativePaths: [
      'Process inspection with ps',
      'Service configuration review',
      'Packet capture if traffic is available',
    ],
    evidenceToRecord: [
      'Address',
      'Port',
      'Protocol',
      'PID/process',
      'Interface',
    ],
    stopConditions: [
      'Service is outside scope',
      'Further interaction risks modifying service state',
    ],
    relatedCases: ['enum-unknown-target', 'network-pcap'],
    estimatedTime: '5–15 min',
    difficulty: 'beginner',
    tags: ['ss', 'ports', 'tcp', 'udp', 'listeners'],
  },
  {
    id: 'network-pcap',
    category: 'network',
    title: 'PCAP Available',
    summary:
      'A packet capture is available but the useful traffic or protocol is unknown.',
    whenToUse: [
      'A .pcap/.pcapng file is supplied',
      'Network evidence is provided',
    ],
    prerequisites: ['Readable capture file'],
    observations: ['Protocols', 'Hosts', 'Ports', 'DNS', 'HTTP', 'TCP streams'],
    initialChecks: [
      'Identify capture metadata',
      'Summarize conversations',
      'Filter by major protocols',
    ],
    steps: [
      {
        id: 'a',
        action: 'List packet summary',
        purpose: 'Get a quick view of protocol and traffic distribution.',
        command: 'tshark -r capture.pcap -q -z io,phs',
        expectedObservation: 'Protocol hierarchy statistics.',
        possibleResults: [
          'Mostly TCP',
          'Mostly UDP',
          'DNS/HTTP visible',
          'Unknown traffic',
        ],
        evidence: ['Protocol statistics'],
      },
      {
        id: 'b',
        action: 'Inspect HTTP traffic when present',
        purpose: 'Find requests, responses, hosts, and URLs.',
        command: 'tshark -r capture.pcap -Y "http"',
        expectedObservation: 'HTTP packets matching the display filter.',
        possibleResults: ['HTTP present', 'No HTTP matches'],
        evidence: ['Filtered packet output'],
      },
      {
        id: 'c',
        action: 'Inspect DNS traffic when present',
        purpose: 'Identify queried names and DNS behavior.',
        command: 'tshark -r capture.pcap -Y "dns"',
        expectedObservation: 'DNS packets matching the display filter.',
        possibleResults: ['DNS present', 'No DNS matches'],
        evidence: ['DNS packet output'],
      },
    ],
    branches: [
      {
        id: 'http',
        condition: 'HTTP is present',
        result: 'Web traffic',
        nextAction: 'Inspect hosts, URIs, methods, and response codes.',
        evidence: ['HTTP requests'],
      },
      {
        id: 'dns',
        condition: 'DNS is present',
        result: 'Name-resolution evidence',
        nextAction: 'Extract queried domains and correlate them with hosts.',
        evidence: ['DNS queries'],
      },
      {
        id: 'unknown',
        condition: 'No obvious application protocol',
        result: 'Unknown traffic',
        nextAction:
          'Inspect endpoints, ports, packet sizes, and TCP/UDP streams.',
        evidence: ['Conversation summary'],
      },
    ],
    alternativePaths: [
      'Wireshark protocol hierarchy',
      'tshark field extraction',
      'Follow TCP streams in a packet-analysis GUI',
    ],
    evidenceToRecord: [
      'Capture filename/hash',
      'Relevant packet numbers',
      'Hosts',
      'Ports',
      'Filters',
      'Extracted artifacts',
    ],
    stopConditions: [
      'Capture contains out-of-scope sensitive data',
      'Repeated broad filters produce no new information',
    ],
    relatedCases: ['forensics-pcap', 'network-listening-service'],
    estimatedTime: '10–30 min',
    difficulty: 'intermediate',
    tags: ['pcap', 'tshark', 'tcpdump', 'wireshark', 'dns', 'http'],
  },
];
