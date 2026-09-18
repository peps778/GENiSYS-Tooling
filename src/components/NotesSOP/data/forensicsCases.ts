import type { SOPCase } from "../types/notesSop";

export const forensicsCases: SOPCase[] = [
  {
    id: "forensics-unknown-file",
    category: "forensics",
    title: "Unknown File",
    summary: "A file has an uncertain type or a misleading extension.",
    whenToUse: ["Unknown .bin", "Extension mismatch", "Challenge artifact"],
    prerequisites: ["Original file preserved"],
    observations: ["Filename", "Size", "Magic bytes", "Strings"],
    initialChecks: ["Hash the file", "Run file identification", "Inspect strings"],
    steps: [
      { id: "a", action: "Identify by content", purpose: "Determine whether the extension matches the file structure.", command: "file suspicious.bin", expectedObservation: "Detected file type or generic data.", possibleResults: ["Known type", "Generic data", "Mismatch"], evidence: ["file output"] },
      { id: "b", action: "Inspect printable strings", purpose: "Find readable clues without changing the artifact.", command: "strings -a suspicious.bin", expectedObservation: "URLs, labels, text fragments, or flag-like patterns.", possibleResults: ["Useful strings", "No useful strings"], evidence: ["Relevant strings"] },
      { id: "c", action: "Inspect signatures/bytes", purpose: "Find embedded or misleading format markers.", command: "xxd -l 256 suspicious.bin", expectedObservation: "Header bytes and recognizable signatures.", possibleResults: ["Known signature", "Unknown bytes"], evidence: ["Hex offset"] },
    ],
    branches: [
      { id: "image", condition: "An image signature is identified", result: "Image analysis", nextAction: "Open/parse the candidate image and inspect metadata and embedded data.", evidence: ["Signature", "Offset"] },
      { id: "archive", condition: "An archive signature is identified", result: "Archive analysis", nextAction: "Inspect archive contents and nested artifacts.", evidence: ["Signature", "Archive listing"] },
      { id: "unknown", condition: "No format is identified", result: "Raw-byte investigation", nextAction: "Search for embedded signatures and structured regions.", evidence: ["Offsets", "Hex excerpts"] },
    ],
    alternativePaths: ["GENiSYS File Analysis module", "Signature carving", "Metadata extraction", "Hash comparison"],
    evidenceToRecord: ["Original filename", "Hash", "Size", "Magic bytes", "Offsets", "Strings"],
    stopConditions: ["Do not overwrite the original", "Do not claim recovery from a header alone"],
    relatedCases: ["stego-image", "forensics-embedded"],
    estimatedTime: "5–20 min",
    difficulty: "beginner",
    tags: ["forensics", "file", "bin", "magic", "strings", "hex"],
  },
  {
    id: "forensics-embedded",
    category: "forensics",
    title: "Embedded File Candidate",
    summary: "A signature appears inside a larger artifact.",
    whenToUse: ["PNG/JPEG/PDF/ZIP signature at non-zero offset", "Carving candidate"],
    prerequisites: ["Original artifact preserved"],
    observations: ["Signature offset", "Possible length", "Trailing data"],
    initialChecks: ["Record exact offset", "Identify signature", "Check for structural end marker"],
    steps: [
      { id: "a", action: "Bound the candidate", purpose: "Avoid claiming a complete file when only a header is present.", expectedObservation: "Candidate start and possible end boundary.", possibleResults: ["Complete structure", "Truncated structure", "Unknown boundary"], evidence: ["Start/end offsets"] },
    ],
    branches: [
      { id: "valid", condition: "Candidate parses as a valid file", result: "Recovered artifact", nextAction: "Hash and analyze the recovered artifact independently.", evidence: ["Recovered file", "Hash"] },
      { id: "partial", condition: "Candidate is truncated", result: "Partial recovery", nextAction: "Record the limitation and inspect surrounding bytes for additional structure.", evidence: ["Truncation point"] },
    ],
    alternativePaths: ["Manual hex inspection", "File Analysis recovery engine"],
    evidenceToRecord: ["Parent file", "Offset", "Length", "Signature", "Hash", "Recovery method"],
    stopConditions: ["Boundary cannot be justified", "Recovery would overwrite original data"],
    relatedCases: ["forensics-unknown-file", "stego-image"],
    estimatedTime: "10–25 min",
    difficulty: "intermediate",
    tags: ["carving", "embedded", "recovery", "offset"],
  },
  {
    id: "forensics-pcap",
    category: "forensics",
    title: "PCAP as Evidence",
    summary: "Treat a packet capture as a forensic artifact: preserve it, hash it, then analyze copies/derived outputs.",
    whenToUse: ["Incident-style PCAP", "CTF packet evidence"],
    prerequisites: ["Original capture file"],
    observations: ["Capture duration", "Hosts", "Protocols", "Streams"],
    initialChecks: ["Hash capture", "Record filename/size", "Build protocol overview"],
    steps: [
      { id: "a", action: "Create a protocol overview", purpose: "Determine which protocols deserve focused analysis.", command: "tshark -r capture.pcap -q -z io,phs", expectedObservation: "Protocol hierarchy.", possibleResults: ["HTTP/DNS", "File-transfer protocol", "Mostly encrypted traffic"], evidence: ["Protocol hierarchy"] },
    ],
    branches: [
      { id: "web", condition: "Web traffic dominates", result: "HTTP investigation", nextAction: "Filter HTTP and correlate requests with hosts.", evidence: ["HTTP packets"] },
      { id: "dns", condition: "DNS is prominent", result: "DNS investigation", nextAction: "Extract queries and correlate timing/hosts.", evidence: ["DNS queries"] },
      { id: "encrypted", condition: "Traffic is encrypted", result: "Metadata-focused investigation", nextAction: "Use endpoints, timing, SNI where available, and connection metadata.", evidence: ["Endpoints", "Ports"] },
    ],
    alternativePaths: ["Wireshark", "tshark field extraction", "TCP stream analysis"],
    evidenceToRecord: ["Capture hash", "Packet numbers", "Filters", "Extracted files", "Relevant endpoints"],
    stopConditions: ["Sensitive unrelated traffic is encountered", "Further extraction is unnecessary to answer the current question"],
    relatedCases: ["network-pcap"],
    estimatedTime: "15–40 min",
    difficulty: "intermediate",
    tags: ["pcap", "forensics", "network", "tshark"],
  },

  {
    id: "forensics-memory",
    category: "forensics",
    title: "Memory Image Triage",
    summary: "A RAM image may contain process, network, credential, or injected-code artifacts.",
    whenToUse: ["mem.raw", "RAM dump", "Live-response image"],
    prerequisites: ["Original image preserved", "Sufficient storage for derived output"],
    observations: ["OS profile", "Processes", "Connections", "Loaded modules", "Command lines"],
    initialChecks: ["Hash image", "Identify acquisition metadata", "Determine likely OS/profile"],
    steps: [
      { id: "a", action: "Establish image metadata", purpose: "Record provenance and avoid analyzing the wrong artifact.", expectedObservation: "Hash, size, acquisition notes, likely OS.", possibleResults: ["Profile identified", "Profile uncertain"], evidence: ["Hash", "Metadata"] },
      { id: "b", action: "Build a process and network overview", purpose: "Prioritize suspicious processes and connections.", expectedObservation: "Process tree, command lines, sockets.", possibleResults: ["Normal baseline", "Suspicious process", "Unknown process"], evidence: ["Process/network output"] }
    ],
    branches: [
      { id: "process", condition: "Suspicious process or injected region appears", result: "Process-focused investigation", nextAction: "Correlate PID, parent, command line, modules, and memory regions.", evidence: ["PID", "Process tree"] },
      { id: "network", condition: "Unexpected connection is present", result: "Network-focused investigation", nextAction: "Correlate endpoint, PID, timestamps, and related files.", evidence: ["Socket record"] },
      { id: "none", condition: "No obvious anomaly appears", result: "Broaden artifact review", nextAction: "Inspect handles, services, persistence clues, and strings.", evidence: ["Triage summary"] }
    ],
    alternativePaths: ["Volatility/Volatility 3", "Strings and YARA on extracted regions", "Timeline correlation"],
    evidenceToRecord: ["Image hash", "Profile", "PID", "Command line", "Connections", "Offsets"],
    stopConditions: ["Never modify the original image", "Avoid extracting unrelated sensitive content"],
    relatedCases: ["forensics-process", "forensics-timeline"],
    estimatedTime: "20–60 min",
    difficulty: "advanced",
    tags: ["memory", "ram", "volatility", "process", "incident-response"]
  },
  {
    id: "forensics-process",
    category: "forensics",
    title: "Suspicious Process / Persistence",
    summary: "A process, service, scheduled task, or startup artifact appears unusual and needs correlation.",
    whenToUse: ["Unknown process", "Unexpected service", "Persistence clue"],
    prerequisites: ["Process list or disk image", "Timestamp context"],
    observations: ["Parent-child relationship", "Path", "Signer/hash", "Execution time", "Persistence location"],
    initialChecks: ["Record process metadata", "Hash executable if available", "Locate persistence mechanism"],
    steps: [
      { id: "a", action: "Correlate process metadata", purpose: "Separate unusual naming from actual anomalous behavior.", expectedObservation: "Path, parent, user, command line, hash.", possibleResults: ["Legitimate path", "Suspicious path", "Missing artifact"], evidence: ["Metadata"] },
      { id: "b", action: "Check persistence linkage", purpose: "Determine whether execution is tied to a startup or scheduled mechanism.", expectedObservation: "Service/task/run-key/cron linkage.", possibleResults: ["Linked", "Not linked", "Unknown"], evidence: ["Persistence record"] }
    ],
    branches: [
      { id: "linked", condition: "Process is linked to persistence", result: "Persistence candidate", nextAction: "Build a timeline and preserve the relevant configuration/artifact.", evidence: ["Persistence entry"] },
      { id: "orphan", condition: "Process has no obvious persistence", result: "Execution-only anomaly", nextAction: "Correlate shell history, logs, downloads, and parent process.", evidence: ["Parent/timeline"] }
    ],
    alternativePaths: ["Windows event logs", "Linux auth/journal logs", "Prefetch/SRUM/Amcache where applicable"],
    evidenceToRecord: ["PID", "Path", "Hash", "Parent", "User", "Persistence location", "Timestamps"],
    stopConditions: ["Do not execute suspicious binaries", "Do not delete persistence artifacts during collection"],
    relatedCases: ["forensics-memory", "forensics-timeline", "forensics-logs"],
    estimatedTime: "20–45 min",
    difficulty: "intermediate",
    tags: ["process", "persistence", "service", "scheduled-task"]
  },
  {
    id: "forensics-timeline",
    category: "forensics",
    title: "Timeline Correlation",
    summary: "Multiple artifacts need to be ordered to reconstruct what happened and distinguish access from execution.",
    whenToUse: ["Many timestamps", "Incident reconstruction", "File plus log evidence"],
    prerequisites: ["At least two artifact sources", "Timezone information if known"],
    observations: ["MACB timestamps", "Logon events", "Process starts", "Downloads", "Clock skew"],
    initialChecks: ["Normalize timezone", "Record source reliability", "Separate event time from collection time"],
    steps: [
      { id: "a", action: "Build an event table", purpose: "Place artifacts on a common chronological axis.", expectedObservation: "Ordered events with source and confidence.", possibleResults: ["Coherent sequence", "Conflicting timestamps"], evidence: ["Timeline rows"] },
      { id: "b", action: "Correlate independent sources", purpose: "Avoid relying on a single mutable timestamp.", expectedObservation: "Agreement or conflict between logs, files, and network data.", possibleResults: ["Corroborated", "Uncorroborated", "Clock skew"], evidence: ["Cross-source comparison"] }
    ],
    branches: [
      { id: "corroborated", condition: "Two or more independent sources agree", result: "Corroborated event", nextAction: "Raise confidence and preserve source references.", evidence: ["Matching events"] },
      { id: "conflict", condition: "Timestamps conflict", result: "Timeline uncertainty", nextAction: "Document timezone, clock drift, and timestamp semantics.", evidence: ["Conflict notes"] }
    ],
    alternativePaths: ["Plaso/log2timeline", "Filesystem metadata", "PCAP timestamps", "Browser history"],
    evidenceToRecord: ["Event time", "Collection time", "Timezone", "Source", "Confidence", "Correlation ID"],
    stopConditions: ["Do not present a timestamp as proof of execution without corroboration"],
    relatedCases: ["forensics-logs", "forensics-pcap", "forensics-process"],
    estimatedTime: "20–60 min",
    difficulty: "intermediate",
    tags: ["timeline", "timestamps", "correlation", "plaso"]
  },
  {
    id: "forensics-logs",
    category: "forensics",
    title: "Log Artifact Investigation",
    summary: "System, authentication, web, or application logs may reveal access, errors, persistence, or lateral movement clues.",
    whenToUse: ["auth.log", "Windows event logs", "Web access logs", "Application logs"],
    prerequisites: ["Original logs preserved", "Known time range or host"],
    observations: ["Source IP", "User", "Event ID", "URI", "Status", "User agent"],
    initialChecks: ["Hash/archive logs", "Identify format and timezone", "Find high-signal event types"],
    steps: [
      { id: "a", action: "Profile the log", purpose: "Understand fields, rotation, and coverage gaps.", expectedObservation: "Format, date range, host, missing intervals.", possibleResults: ["Complete range", "Rotated logs", "Gaps"], evidence: ["Log metadata"] },
      { id: "b", action: "Filter and correlate high-signal events", purpose: "Reduce noise while preserving exact source lines.", expectedObservation: "Repeated failures, successful access, unusual user agents, or rare paths.", possibleResults: ["Pattern found", "No pattern", "Insufficient coverage"], evidence: ["Exact lines"] }
    ],
    branches: [
      { id: "auth", condition: "Authentication anomalies appear", result: "Account activity investigation", nextAction: "Correlate source, user, success/failure, and nearby events.", evidence: ["Auth events"] },
      { id: "web", condition: "Suspicious web requests appear", result: "Web event correlation", nextAction: "Correlate URI, status, response size, and application errors.", evidence: ["Access/error lines"] },
      { id: "gap", condition: "Coverage is incomplete", result: "Evidence limitation", nextAction: "Locate rotated, centralized, or alternate logs before concluding absence.", evidence: ["Coverage notes"] }
    ],
    alternativePaths: ["SIEM export", "Journal/Event Viewer", "Web access/error log pairing"],
    evidenceToRecord: ["Log hash", "Host", "Timezone", "Exact line", "Event ID", "Source IP", "Time range"],
    stopConditions: ["Do not alter original logs", "Do not infer absence of activity from missing coverage"],
    relatedCases: ["forensics-timeline", "web-api", "forensics-pcap"],
    estimatedTime: "15–45 min",
    difficulty: "beginner",
    tags: ["logs", "auth", "events", "web-logs", "incident-response"]
  },
  {
    id: "forensics-browser",
    category: "forensics",
    title: "Browser Artifact Review",
    summary: "Browser history, downloads, cookies metadata, cache, and session artifacts can establish user activity and downloaded files.",
    whenToUse: ["Browser history DB", "Downloads list", "Cache directory", "Incident user profile"],
    prerequisites: ["Disk image or exported browser profile", "Privacy-safe scope"],
    observations: ["URLs", "Visit times", "Download paths", "Referrers", "Profile/user"],
    initialChecks: ["Identify browser/profile", "Copy database read-only", "Record artifact hashes"],
    steps: [
      { id: "a", action: "Extract activity records", purpose: "Build a readable view of history and downloads.", expectedObservation: "URLs, timestamps, titles, filenames.", possibleResults: ["Relevant activity", "No relevant activity", "Corrupt DB"], evidence: ["Extracted rows"] },
      { id: "b", action: "Correlate downloads with filesystem artifacts", purpose: "Determine whether a browser event corresponds to a file on disk.", expectedObservation: "Matching filename/path/hash/time.", possibleResults: ["Corroborated", "Mismatch", "Missing file"], evidence: ["Cross-reference"] }
    ],
    branches: [
      { id: "match", condition: "Download and file artifact correlate", result: "Corroborated browser activity", nextAction: "Record URL, timestamp, path, and file hash.", evidence: ["History/download/file"] },
      { id: "missing", condition: "History references a missing file", result: "Activity without retained payload", nextAction: "Document the limitation and search only other in-scope copies.", evidence: ["History row"] }
    ],
    alternativePaths: ["SQLite queries", "Cache extraction", "Shell/link files"],
    evidenceToRecord: ["Profile", "Database hash", "URL", "Timestamp", "Download path", "File hash"],
    stopConditions: ["Do not expose unrelated personal browsing data", "Do not treat history alone as proof a file was executed"],
    relatedCases: ["forensics-timeline", "forensics-unknown-file"],
    estimatedTime: "15–40 min",
    difficulty: "intermediate",
    tags: ["browser", "history", "downloads", "sqlite", "cache"]
  },
];
