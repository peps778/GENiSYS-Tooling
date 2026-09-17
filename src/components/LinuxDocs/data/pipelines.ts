import type { Pipeline } from '../types/linuxDocs';

export const pipelines: Pipeline[] = [
  {
    id: 'linux-triage',
    name: 'Linux triage',
    description: 'Compact first-pass host triage for an authorized machine.',
    steps: [
      {
        title: 'Identity',
        purpose: 'Record user and groups.',
        command: 'whoami && id && groups',
      },
      {
        title: 'System',
        purpose: 'Record OS/kernel and hostname.',
        command: 'hostname && uname -a',
      },
      {
        title: 'Network',
        purpose: 'Record interfaces, routes, and listeners.',
        command: 'ip addr && ip route && ss -lntup',
      },
      {
        title: 'Processes',
        purpose: 'Record active processes.',
        command: 'ps aux',
      },
      {
        title: 'Storage',
        purpose: 'Record filesystem usage.',
        command: 'df -h',
      },
    ],
  },
  {
    id: 'web-triage',
    name: 'Web endpoint triage',
    description: 'Controlled inspection of an approved web application.',
    steps: [
      {
        title: 'HTTP',
        purpose: 'Capture response headers and status.',
        command: 'curl -i https://example.test/',
      },
      {
        title: 'Technology',
        purpose: 'Identify exposed technologies.',
        command: 'whatweb https://example.test',
      },
      {
        title: 'Crawl',
        purpose: 'Discover application URLs.',
        command: 'katana -u https://example.test -jc -o endpoints.txt',
      },
      {
        title: 'Filter',
        purpose: 'Review common application endpoints.',
        command: "grep -Ei '/(api|admin|login|graphql)' endpoints.txt",
      },
    ],
  },
  {
    id: 'dns-enumeration',
    name: 'DNS enumeration',
    description: 'Basic record collection for an approved domain.',
    steps: [
      {
        title: 'A / AAAA',
        purpose: 'Resolve IPv4 and IPv6 records.',
        command: 'dig example.test A && dig example.test AAAA',
      },
      {
        title: 'Mail',
        purpose: 'Inspect MX records.',
        command: 'dig example.test MX',
      },
      {
        title: 'Text',
        purpose: 'Inspect TXT records.',
        command: 'dig example.test TXT',
      },
      {
        title: 'Authority',
        purpose: 'Inspect NS and CNAME records.',
        command: 'dig example.test NS && dig www.example.test CNAME',
      },
    ],
  },
  {
    id: 'binary-triage',
    name: 'Binary triage',
    description:
      'Non-destructive first-pass inspection of a suspicious artifact.',
    steps: [
      {
        title: 'Type',
        purpose: 'Identify the file using content signatures.',
        command: 'file --mime artifact.bin',
      },
      {
        title: 'Magic bytes',
        purpose: 'Inspect the first bytes.',
        command: 'xxd -l 64 artifact.bin',
      },
      {
        title: 'Strings',
        purpose: 'Extract printable indicators.',
        command: 'strings artifact.bin | less',
      },
      {
        title: 'Hash',
        purpose: 'Record a SHA-256 reference.',
        command: 'sha256sum artifact.bin | tee artifact.sha256',
      },
    ],
  },
  {
    id: 'log-triage',
    name: 'Log triage',
    description:
      'Search logs for errors, authentication failures, and common indicators.',
    steps: [
      {
        title: 'Errors',
        purpose: 'Find error and failure terms.',
        command: "grep -nEi 'error|critical|exception|failed' app.log",
      },
      {
        title: 'IPs',
        purpose: 'Extract IP-like indicators.',
        command: "grep -Eo '([0-9]{1,3}\\.){3}[0-9]{1,3}' app.log | sort -u",
      },
      {
        title: 'URLs',
        purpose: 'Extract URL-like indicators.',
        command: "grep -Eo 'https?://[^[:space:]\"<>]+' app.log | sort -u",
      },
      {
        title: 'Counts',
        purpose: 'Rank repeated indicators.',
        command: 'sort indicators.txt | uniq -c | sort -nr',
      },
    ],
  },
  {
    id: 'json-api',
    name: 'JSON / API triage',
    description:
      'Capture an authorized JSON response and inspect selected fields.',
    steps: [
      {
        title: 'Capture',
        purpose: 'Request JSON with an explicit Accept header.',
        command:
          "curl -sS -H 'Accept: application/json' https://example.test/api/status -o response.json",
      },
      {
        title: 'Validate',
        purpose: 'Pretty-print the JSON.',
        command: 'jq . response.json',
      },
      {
        title: 'Extract',
        purpose: 'Select a relevant field.',
        command: "jq '.data[] | {id,name}' response.json",
      },
    ],
  },
  {
    id: 'hash-evidence',
    name: 'Hash / evidence workflow',
    description:
      'Preserve an original artifact and analyze a separate working copy.',
    steps: [
      {
        title: 'Capture',
        purpose: 'Record the raw artifact as received.',
        command: 'cp --preserve=all artifact.bin evidence-original.bin',
      },
      {
        title: 'Preserve',
        purpose: 'Avoid editing the preserved original.',
        command:
          'sha256sum evidence-original.bin | tee evidence-original.sha256',
      },
      {
        title: 'Analyze copy',
        purpose: 'Work from a separate copy.',
        command: 'cp --preserve=all evidence-original.bin analysis-copy.bin',
      },
      {
        title: 'Indicators',
        purpose: 'Extract and record findings.',
        command:
          'file analysis-copy.bin && strings analysis-copy.bin > strings.txt',
      },
      {
        title: 'Findings',
        purpose: 'Record hashes, observations, and source paths.',
        command: 'sha256sum analysis-copy.bin | tee analysis-copy.sha256',
      },
    ],
  },
];
