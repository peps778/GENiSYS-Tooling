export const workflows = [
  {
    title: 'Basic Network Recon',
    steps: [
      'Identify IP configuration',
      'Inspect DNS',
      'Discover reachable hosts',
      'Enumerate ports',
      'Identify services',
      'Inspect HTTP/HTTPS where present',
    ],
  },
  {
    title: 'Web Recon',
    steps: [
      'Resolve DNS',
      'Check 80/443/8080/8443',
      'Inspect headers with curl',
      'Review redirects and cookies',
      'Identify technologies',
      'Perform authorized endpoint discovery',
    ],
  },
  {
    title: 'Local Network Analysis',
    steps: [
      'ip addr',
      'ip route',
      'ip neigh',
      'ss -tulpn',
      'tcpdump or tshark',
    ],
  },
  {
    title: 'Service Enumeration',
    steps: [
      'Run Nmap',
      'Record open ports',
      'Detect service versions',
      'Select protocol-specific enumeration',
      'Validate findings manually',
    ],
  },
] as const;
