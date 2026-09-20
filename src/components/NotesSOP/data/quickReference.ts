export interface QuickReferenceGroup {
  id: string;
  title: string;
  description: string;
  items: QuickReferenceItem[];
}

export interface QuickReferenceItem {
  id: string;
  name: string;
  summary: string;
  command?: string;
  details: string[];
  tags: string[];
}

export const quickReferenceGroups: QuickReferenceGroup[] = [
  {
    id: 'triage',
    title: 'Initial Triage',
    description: 'Establish scope, preserve evidence, and identify the first information-producing actions.',
    items: [
      { id: 'triage-scope', name: 'Scope first', summary: 'Confirm target, allowed systems, supplied artifacts, time limits, and prohibited actions.', details: ['Record target identifiers exactly.', 'Do not assume every discovered host is in scope.', 'Keep raw artifacts immutable; work on copies.', 'Record UTC/local time consistently.'], tags: ['scope', 'evidence', 'start'] },
      { id: 'triage-record', name: 'Create a working record', summary: 'Start a timeline before making changes or tests.', details: ['Timestamp significant actions.', 'Record commands and relevant output.', 'Separate observation from interpretation.', 'Mark dead ends so they are not repeated.'], tags: ['notes', 'timeline'] },
      { id: 'triage-low-impact', name: 'Prefer information gain', summary: 'Start with read-oriented discovery and pivot based on evidence.', details: ['Identify exposed services.', 'Inspect supplied files before aggressive tooling.', 'Validate interesting behavior with the smallest useful test.', 'Stop a branch when results are reproducibly negative or out of scope.'], tags: ['methodology', 'pivot'] },
    ],
  },
  {
    id: 'network',
    title: 'Network Quick Reference',
    description: 'Common protocols, ports, DNS checks, and connection triage.',
    items: [
      { id: 'ports-core', name: 'Common ports', summary: 'Use port numbers as clues, not proof of service identity.', command: 'nmap -sV -Pn <target>', details: ['21 FTP', '22 SSH', '23 Telnet', '25 SMTP', '53 DNS', '80 HTTP', '110 POP3', '123 NTP', '135 RPC', '139/445 SMB', '1433 MSSQL', '3306 MySQL/MariaDB', '3389 RDP', '5432 PostgreSQL', '5900 VNC', '8080/8443 common alternate web ports'], tags: ['ports', 'nmap'] },
      { id: 'dns-baseline', name: 'DNS baseline', summary: 'Identify A/AAAA, CNAME, MX, NS, TXT, and reverse-DNS relationships.', command: 'dig <domain> ANY; dig <domain> A; dig <domain> MX; dig <domain> TXT', details: ['Compare authoritative and recursive answers when relevant.', 'Check subdomains discovered from supplied scope or authorized sources.', 'Treat TXT data as potentially useful metadata, not automatically as a secret.'], tags: ['dns', 'domain'] },
      { id: 'socket-triage', name: 'Local socket triage', summary: 'Identify listening services and active connections on a Linux host.', command: 'ss -tulpn; ss -tpn', details: ['Record address, port, protocol, process, and state.', 'Loopback-only services are different from externally bound services.', 'Correlate process ownership with configuration and logs.'], tags: ['sockets', 'linux'] },
      { id: 'pcap-first', name: 'PCAP first pass', summary: 'Establish conversations, protocols, endpoints, and unusual traffic before deep inspection.', command: 'tshark -r capture.pcap -q -z conv,tcp', details: ['Identify top talkers.', 'Inspect DNS, HTTP, TLS metadata, ICMP, SMB, and unusual ports.', 'Follow streams only after locating a relevant conversation.', 'Export artifacts without modifying the original capture.'], tags: ['pcap', 'wireshark'] },
    ],
  },
  {
    id: 'http',
    title: 'HTTP / API Reference',
    description: 'Headers, methods, status codes, cookies, CORS, and request comparison.',
    items: [
      { id: 'http-methods', name: 'HTTP methods', summary: 'Map what the endpoint accepts before testing how it handles input.', details: ['GET: retrieve representation.', 'POST: submit/create/process data.', 'PUT: replace/update a resource.', 'PATCH: partial update.', 'DELETE: remove a resource.', 'OPTIONS: capability/CORS preflight context.', 'HEAD: headers without a response body.'], tags: ['http', 'api'] },
      { id: 'http-status', name: 'Status code triage', summary: 'Status codes are evidence about application behavior, not vulnerability proof.', details: ['2xx: request generally succeeded.', '3xx: redirect or cache-related behavior.', '400: malformed/invalid request.', '401: authentication required or failed.', '403: request understood but access denied.', '404: resource not found or intentionally hidden.', '405: method not allowed.', '409: state/conflict condition.', '429: rate limiting/throttling.', '5xx: server-side failure; compare input and timing before interpreting.'], tags: ['status', 'http'] },
      { id: 'http-headers', name: 'High-value headers', summary: 'Inspect security, caching, content, routing, and identity-related headers.', details: ['Authorization', 'Cookie / Set-Cookie', 'Content-Type', 'Location', 'Host', 'Origin / Referer', 'Access-Control-Allow-Origin / Credentials', 'Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'Cache-Control', 'ETag', 'Vary', 'Server / X-Powered-By as implementation clues'], tags: ['headers', 'security'] },
      { id: 'http-cookie', name: 'Cookie review', summary: 'Check session scope and browser protections.', details: ['Secure', 'HttpOnly', 'SameSite', 'Domain', 'Path', 'Expiration/max-age', 'Compare cookie state before login, after login, logout, and reset flows.'], tags: ['cookies', 'session'] },
      { id: 'http-cors', name: 'CORS decision points', summary: 'Evaluate whether an origin can actually read protected browser responses.', details: ['Test a controlled Origin value.', 'Check whether the server reflects it.', 'Check Access-Control-Allow-Credentials.', 'Check preflight behavior for non-simple requests.', 'A discoverable API endpoint is not by itself a CORS vulnerability.', 'Evaluate the sensitivity of the response and whether credentials are involved.'], tags: ['cors', 'api'] },
    ],
  },
  {
    id: 'web',
    title: 'Web Testing Checklist',
    description: 'A compact attack-surface map for authorized CTF or assessment targets.',
    items: [
      { id: 'web-map', name: 'Map the application', summary: 'Build an endpoint and input inventory before chasing individual bugs.', details: ['Pages/routes', 'API endpoints', 'Parameters and body fields', 'HTTP methods', 'Authentication boundaries', 'Roles and object identifiers', 'Uploads/downloads', 'WebSockets or alternate services', 'Error/debug surfaces'], tags: ['web', 'mapping'] },
      { id: 'web-input', name: 'Input classes', summary: 'Classify every input before choosing a test.', details: ['Query parameters', 'Path parameters', 'JSON/XML bodies', 'Form fields', 'Headers', 'Cookies', 'File names/content', 'URL fetchers', 'Object IDs', 'JWT claims'], tags: ['input', 'api'] },
      { id: 'web-authz', name: 'Authorization matrix', summary: 'Compare the same object/action across identities and ownership states.', details: ['Anonymous vs authenticated', 'User A vs User B', 'Owner vs non-owner', 'Low privilege vs elevated role', 'Read vs write vs delete', 'Direct endpoint access vs UI path'], tags: ['idor', 'access-control'] },
      { id: 'web-xss', name: 'XSS evidence chain', summary: 'Prove source-to-sink behavior and execution context; reflection alone is not proof of impact.', details: ['Identify controllable input.', 'Locate reflection/storage.', 'Determine output encoding/context.', 'Validate only within authorized scope.', 'Record exact request, response, context, and reproducible result.'], tags: ['xss', 'web'] },
      { id: 'web-sqli', name: 'SQL injection triage', summary: 'Look for reproducible input-dependent query behavior and distinguish parser errors from actual data access.', details: ['Establish baseline response.', 'Use a minimal controlled comparison.', 'Look for consistent boolean/time/error differences.', 'Do not treat a generic 500 as SQL injection proof.', 'Record database-specific error clues when exposed.'], tags: ['sqli', 'database'] },
    ],
  },
  {
    id: 'forensics',
    title: 'Forensics Reference',
    description: 'Preservation, file triage, strings, hashes, logs, memory, and artifact recovery.',
    items: [
      { id: 'forensics-hash', name: 'Hash before analysis', summary: 'Hash original artifacts and working copies so changes can be detected.', command: 'sha256sum evidence.bin', details: ['Prefer SHA-256 for general integrity logging.', 'Record filename, size, timestamp, and hash.', 'Hash extracted artifacts separately.', 'Do not overwrite the original.'], tags: ['hash', 'integrity'] },
      { id: 'forensics-file', name: 'File triage', summary: 'Identify content from bytes rather than trusting the filename or extension.', command: 'file sample.bin; xxd -l 64 sample.bin; strings -a -n 6 sample.bin', details: ['Check magic bytes.', 'Inspect ASCII and UTF-8/UTF-16 strings.', 'Look for embedded signatures at non-zero offsets.', 'Compare declared extension with detected type.'], tags: ['file', 'magic-bytes'] },
      { id: 'forensics-logs', name: 'Log triage', summary: 'Search for timestamps, identities, IPs, URLs, errors, and repeated events.', command: 'grep -RniE "failed|error|denied|login|session|sudo" /var/log 2>/dev/null', details: ['Preserve original log files.', 'Normalize timestamps only in notes; retain source format.', 'Correlate multiple logs by time, IP, username, and process.'], tags: ['logs', 'timeline'] },
      { id: 'forensics-memory', name: 'Memory triage', summary: 'Determine image type/profile before interpreting process, network, and credential artifacts.', details: ['Identify image format and OS/profile.', 'Start with process listing and network artifacts.', 'Inspect command lines, environment, loaded modules, and suspicious processes.', 'Treat recovered strings as candidates until corroborated.'], tags: ['memory', 'volatility'] },
    ],
  },
  {
    id: 'signatures',
    title: 'File Signatures',
    description: 'Common magic-byte clues for file identification and embedded-file recovery.',
    items: [
      { id: 'sig-png', name: 'PNG', summary: 'PNG signature', command: '89 50 4E 47 0D 0A 1A 0A', details: ['Usually starts at offset 0 for a normal PNG.', 'IHDR follows the signature.'], tags: ['png', 'magic'] },
      { id: 'sig-jpeg', name: 'JPEG', summary: 'JPEG start/end markers', command: 'FF D8 FF ... FF D9', details: ['FFD8FF commonly identifies the beginning.', 'FFD9 commonly identifies the end marker.'], tags: ['jpg', 'magic'] },
      { id: 'sig-pdf', name: 'PDF', summary: 'PDF header', command: '%PDF-', details: ['Search for embedded PDF signatures at non-zero offsets.', 'Validate the recovered range rather than relying only on the header.'], tags: ['pdf', 'magic'] },
      { id: 'sig-zip', name: 'ZIP / Office', summary: 'ZIP container signatures', command: '50 4B 03 04', details: ['Many DOCX/XLSX/PPTX files are ZIP-based containers.', 'Inspect the archive structure before assuming generic ZIP content.'], tags: ['zip', 'office'] },
      { id: 'sig-gzip', name: 'GZIP', summary: 'GZIP header', command: '1F 8B', details: ['Check compression type and decompress into a separate working path.'], tags: ['gzip', 'compression'] },
      { id: 'sig-sqlite', name: 'SQLite', summary: 'SQLite database header', command: 'SQLite format 3\\x00', details: ['Inspect tables/schema after preserving the original database.'], tags: ['sqlite', 'database'] },
    ],
  },
  {
    id: 'encoding',
    title: 'Encoding Decision Tree',
    description: 'Identify transformations from structure and alphabet before brute forcing possibilities.',
    items: [
      { id: 'enc-base64', name: 'Base64', summary: 'Alphabet commonly contains A-Z, a-z, 0-9, +, / and optional = padding.', command: 'echo "<value>" | base64 -d', details: ['Length is often a multiple of 4 with padding.', 'URL-safe variants use - and _.', 'Decoded bytes may be binary rather than text.'], tags: ['base64', 'encoding'] },
      { id: 'enc-hex', name: 'Hex', summary: 'Mostly hexadecimal characters with even-length byte representation.', command: 'echo "48656c6c6f" | xxd -r -p', details: ['Group into two-character bytes.', 'After decoding, inspect whether the result is text or another encoded layer.'], tags: ['hex', 'encoding'] },
      { id: 'enc-url', name: 'URL encoding', summary: 'Percent-encoded bytes or reserved characters in URL components.', command: 'python3 -c "from urllib.parse import unquote; print(unquote(input()))"', details: ['%HH represents a byte.', 'Decode the correct URL component; do not blindly decode structured URLs multiple times.'], tags: ['url', 'encoding'] },
      { id: 'enc-xor', name: 'XOR hypothesis', summary: 'Consider XOR when output has high entropy or repeated structure suggests a short key.', details: ['Record key length assumptions.', 'Use known plaintext only as a hypothesis.', 'Validate decoded output for structure and context.'], tags: ['xor', 'crypto'] },
    ],
  },
  {
    id: 'evidence',
    title: 'Evidence & Reporting',
    description: 'Minimum evidence package for a reproducible finding.',
    items: [
      { id: 'evidence-min', name: 'Minimum finding package', summary: 'A strong finding should be reproducible by another investigator.', details: ['Target and exact location', 'Timestamp', 'Input/request or command', 'Relevant response/output', 'Observed fact', 'Interpretation', 'Verification method', 'Confidence/status', 'Hash or artifact reference where applicable'], tags: ['evidence', 'reporting'] },
      { id: 'evidence-language', name: 'Observation vs interpretation', summary: 'Keep raw evidence separate from conclusions.', details: ['Observation: what the system returned or what the artifact contains.', 'Interpretation: what that observation may indicate.', 'Confirmation: independent or controlled evidence that establishes the finding.', 'Candidate: interesting but not yet verified.'], tags: ['methodology', 'notes'] },
      { id: 'evidence-deadend', name: 'Dead-end logging', summary: 'Record negative results when they prevent repeated work.', details: ['What was tested', 'Exact scope/input', 'Observed result', 'Why the branch was closed', 'Any remaining uncertainty'], tags: ['dead-end', 'time'] },
    ],
  },
  {
    id: 'memory',
    title: 'Memory / Heap Triage',
    description: 'Prioritize memory-image and heap-snapshot questions without loading every artifact into the main workflow at once.',
    items: [
      { id: 'memory-preserve', name: 'Preserve and identify', summary: 'Hash the original image or snapshot and determine its format before parsing.', details: ['Record original filename and size.', 'Compute SHA-256.', 'Determine whether the artifact is a V8 heap snapshot, process memory image, minidump, or another format.', 'Work from a copy when transformations are required.'], tags: ['memory', 'heap', 'evidence'] },
      { id: 'memory-heap', name: 'Heap snapshot triage', summary: 'Look for strings, tokens, URLs, credentials, object properties, and application-specific markers.', command: 'strings -a -n 6 snapshot.heapsnapshot | less', details: ['Search for flag-like patterns and URLs.', 'Inspect JSON structure when valid.', 'Treat strings as candidates until correlated with object context.', 'For large snapshots, prefer streaming/worker-based parsing rather than blocking the UI.'], tags: ['heap', 'v8', 'javascript'] },
      { id: 'memory-process', name: 'Process-memory triage', summary: 'Identify processes and then narrow to network, command-line, credential, and suspicious-artifact questions.', details: ['Process list and parent/child relationships', 'Command lines', 'Network connections', 'Loaded modules', 'Environment/configuration', 'Interesting strings and file paths'], tags: ['memory', 'process', 'forensics'] },
    ],
  },
  {
    id: 'tools',
    title: 'Tool Selection',
    description: 'Choose tools by the question being answered rather than by habit.',
    items: [
      { id: 'tool-nmap', name: 'Nmap', summary: 'Host, port, service, and script-oriented network enumeration.', command: 'nmap -sV -Pn <target>', details: ['Use discovery options appropriate to the lab network.', 'Save output with timestamps when it is evidence.', 'Correlate service detection with actual application behavior.'], tags: ['nmap', 'network'] },
      { id: 'tool-katana', name: 'Katana', summary: 'Authorized web crawling and endpoint discovery.', command: 'katana -u https://target.example -d 2', details: ['Review scope before crawling.', 'Use output as an endpoint inventory, not as proof of vulnerability.', 'Feed discovered endpoints into manual validation.'], tags: ['katana', 'web'] },
      { id: 'tool-burp', name: 'Burp Suite', summary: 'HTTP interception, request editing, comparison, and controlled replay.', details: ['Capture baseline requests.', 'Compare one variable at a time.', 'Keep credentials and sensitive evidence inside the authorized environment.'], tags: ['burp', 'http'] },
      { id: 'tool-wireshark', name: 'Wireshark / TShark', summary: 'Packet capture inspection and protocol analysis.', details: ['Start with conversations and protocol hierarchy.', 'Use display filters to narrow evidence.', 'Follow streams after identifying a relevant flow.'], tags: ['pcap', 'network'] },
    ],
  },
];
