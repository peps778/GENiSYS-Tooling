import type { LinuxCommand } from "../types/linuxDocs";

export const commands: LinuxCommand[] = [
  {
    id: "grep", name: "grep", category: "Text Processing",
    summary: "Search text using fixed strings or regular expressions.",
    description: "grep reads input and prints lines matching a pattern. It is one of the most useful tools for filtering logs, command output, configuration files, and reconnaissance results.",
    syntax: "grep [OPTIONS] PATTERN [FILE...]",
    tags: ["search", "regex", "logs", "filter"],
    options: [
      { flag: "-i", description: "Ignore case." }, { flag: "-n", description: "Show line numbers." },
      { flag: "-r", description: "Recursively search directories." }, { flag: "-v", description: "Invert the match." },
      { flag: "-E", description: "Use extended regular expressions." }, { flag: "-o", description: "Print only matching portions." },
      { flag: "-A/-B/-C N", description: "Show context after, before, or around matches." },
    ],
    examples: [
      { description: "Search a log recursively", command: "grep -Rni \"error\" ./logs" },
      { description: "Extract unique HTTP paths from a log", command: "grep \"404\" access.log | awk '{print $7}' | sort -u" },
    ], relatedCommands: ["awk", "sed", "sort", "uniq"],
  },
  {
    id: "sed", name: "sed", category: "Text Processing", summary: "Stream editor for selecting, replacing, and deleting text.",
    description: "sed processes text one line at a time. It is useful for transforming command output and making repeatable text substitutions.", syntax: "sed [OPTIONS] 'SCRIPT' [FILE...]", tags: ["stream", "replace", "filter"],
    options: [{ flag: "-n", description: "Suppress automatic output." }, { flag: "-i", description: "Edit files in place; use carefully." }],
    examples: [{ description: "Replace a value in a stream", command: "printf '%s\\n' 'host=TARGET' | sed 's/TARGET/example.local/'" }, { description: "Delete matching lines", command: "sed '/^#/d' config.txt" }], relatedCommands: ["grep", "awk", "cut"],
  },
  {
    id: "awk", name: "awk", category: "Text Processing", summary: "Process structured text by fields, patterns, and expressions.",
    description: "awk is especially effective for column-oriented output such as logs, process lists, and scanner results.", syntax: "awk [OPTIONS] 'PROGRAM' [FILE...]", tags: ["columns", "fields", "logs", "filter"],
    options: [{ flag: "-F SEP", description: "Set the input field separator." }, { flag: "$1, $2, $NF", description: "Reference fields; NF is the number of fields." }],
    examples: [{ description: "Print the first field", command: "awk '{print $1}' file.txt" }, { description: "Extract the last field", command: "awk '{print $NF}' access.log" }], relatedCommands: ["grep", "cut", "sort"],
  },
  {
    id: "cut", name: "cut", category: "Text Processing", summary: "Extract selected characters or delimiter-separated fields.",
    description: "cut is a lightweight way to extract columns from predictable text formats.", syntax: "cut [OPTIONS] [FILE]", tags: ["columns", "fields", "text"],
    options: [{ flag: "-d DELIM", description: "Use DELIM as the field delimiter." }, { flag: "-f LIST", description: "Select fields." }, { flag: "-c LIST", description: "Select character positions." }],
    examples: [{ description: "Extract a colon-separated field", command: "cut -d: -f1 /etc/passwd" }], relatedCommands: ["awk", "sort"],
  },
  {
    id: "sort", name: "sort", category: "Text Processing", summary: "Sort lines for easier analysis and deduplication.", description: "sort orders lines and is commonly paired with uniq for counting or removing duplicates.", syntax: "sort [OPTIONS] [FILE...]", tags: ["sort", "deduplicate", "logs"], options: [{ flag: "-n", description: "Numeric sort." }, { flag: "-r", description: "Reverse order." }, { flag: "-u", description: "Output unique lines." }], examples: [{ description: "Rank repeated values", command: "sort values.txt | uniq -c | sort -nr" }], relatedCommands: ["uniq", "awk", "grep"],
  },
  {
    id: "uniq", name: "uniq", category: "Text Processing", summary: "Filter or count adjacent duplicate lines.", description: "uniq operates on adjacent duplicates, so sort is normally used first when counting arbitrary repeated values.", syntax: "uniq [OPTIONS] [INPUT] [OUTPUT]", tags: ["count", "deduplicate"], options: [{ flag: "-c", description: "Prefix lines with occurrence counts." }, { flag: "-d", description: "Show only duplicated lines." }], examples: [{ description: "Count repeated values", command: "sort values.txt | uniq -c | sort -nr" }], relatedCommands: ["sort"],
  },
  {
    id: "strings", name: "strings", category: "File Analysis", summary: "Extract printable character sequences from binary files.", description: "strings is useful during initial inspection of binaries, dumps, firmware, and unknown files. It is an indicator, not a substitute for deeper analysis.", syntax: "strings [OPTIONS] FILE", tags: ["binary", "forensics", "file-analysis"], options: [{ flag: "-n N", description: "Require at least N printable characters." }], examples: [{ description: "Find likely URLs or tokens in a sample", command: "strings -n 8 sample.bin | grep -Ei 'https?://|token|key'" }], relatedCommands: ["file", "xxd", "hexdump"],
  },
  {
    id: "file", name: "file", category: "File Analysis", summary: "Identify a file using its contents and magic signatures.", description: "file helps determine the likely format of a file even when the filename extension is misleading or missing.", syntax: "file [OPTIONS] FILE...", tags: ["magic", "signature", "forensics"], options: [], examples: [{ description: "Identify an unknown artifact", command: "file sample.bin" }, { description: "Inspect files in a directory", command: "file *" }], relatedCommands: ["xxd", "strings"],
  },
  {
    id: "xxd", name: "xxd", category: "File Analysis", summary: "Create and reverse hexadecimal dumps.", description: "xxd provides a convenient byte-level view for inspecting file headers and binary content.", syntax: "xxd [OPTIONS] [FILE]", tags: ["hex", "binary", "forensics"], options: [{ flag: "-l N", description: "Limit output to N bytes." }, { flag: "-r", description: "Reverse a hex dump back to binary." }], examples: [{ description: "Inspect the first 64 bytes", command: "xxd -l 64 sample.bin" }], relatedCommands: ["file", "strings"],
  },
  {
    id: "base64", name: "base64", category: "File Analysis", summary: "Encode or decode Base64 data.", description: "Base64 is an encoding scheme, not encryption. It is frequently encountered in HTTP data, configuration, tokens, and files.", syntax: "base64 [OPTIONS] [FILE]", tags: ["encoding", "decode", "web"], options: [{ flag: "-d", description: "Decode Base64 input." }], examples: [{ description: "Decode a value", command: "printf '%s' 'VEFSR0VU' | base64 -d" }], relatedCommands: ["xxd", "python3"],
  },
  {
    id: "curl", name: "curl", category: "HTTP", summary: "Make HTTP and other network requests from the terminal.", description: "curl is useful for checking HTTP headers, APIs, redirects, request methods, and response bodies during authorized testing.", syntax: "curl [OPTIONS] URL", tags: ["http", "api", "headers", "web"], options: [{ flag: "-I", description: "Request headers only." }, { flag: "-v", description: "Show verbose request/response details." }, { flag: "-L", description: "Follow redirects." }, { flag: "-H", description: "Add a request header." }, { flag: "-d", description: "Send request data." }, { flag: "-o FILE", description: "Write output to a file." }], examples: [{ description: "Inspect response headers", command: "curl -I https://TARGET" }, { description: "Pretty-print JSON when jq is installed", command: "curl -s https://TARGET/api | jq ." }], relatedCommands: ["wget", "jq", "katana"],
  },
  {
    id: "wget", name: "wget", category: "HTTP", summary: "Retrieve files and resources over HTTP and related protocols.", description: "wget is useful for repeatable downloads and controlled retrieval of authorized resources.", syntax: "wget [OPTIONS] URL", tags: ["http", "download", "web"], options: [{ flag: "-O FILE", description: "Write the response to FILE." }, { flag: "-q", description: "Quiet output." }, { flag: "-c", description: "Continue a partial download." }], examples: [{ description: "Save a response under a known name", command: "wget -O response.bin https://TARGET/file" }], relatedCommands: ["curl"],
  },
  {
    id: "find", name: "find", category: "Filesystem", summary: "Search directory trees by name, type, size, time, permissions, and more.", description: "find performs live filesystem traversal and is preferable when current filesystem state matters.", syntax: "find PATH [TESTS] [ACTIONS]", tags: ["files", "search", "forensics"], options: [{ flag: "-name PATTERN", description: "Match a filename pattern." }, { flag: "-type f/d", description: "Restrict to files or directories." }, { flag: "-size", description: "Filter by file size." }, { flag: "-mtime", description: "Filter by modification age." }, { flag: "-perm", description: "Filter by permissions." }, { flag: "-exec", description: "Run an action for matching entries." }], examples: [{ description: "Find log files", command: "find /var/log -type f -name '*.log'" }, { description: "Find files in the current project", command: "find . -type f -name '*.json'" }], relatedCommands: ["locate", "file", "grep"],
  },
  {
    id: "locate", name: "locate", category: "Filesystem", summary: "Find paths using a prebuilt filename database.", description: "locate is usually faster than find for name lookups but depends on an updated database and may not include newly created files.", syntax: "locate [OPTIONS] PATTERN", tags: ["files", "search"], options: [], examples: [{ description: "Search the locate database", command: "locate filename" }], relatedCommands: ["find"],
  },
  {
    id: "tar", name: "tar", category: "Filesystem", summary: "Create, inspect, and extract tar archives.", description: "tar is a standard archive utility and commonly appears in Linux packages, backups, source trees, and collected evidence.", syntax: "tar [OPTIONS] ARCHIVE [FILES...]", tags: ["archive", "extract"], options: [{ flag: "-c", description: "Create an archive." }, { flag: "-x", description: "Extract an archive." }, { flag: "-t", description: "List archive contents." }, { flag: "-f", description: "Specify the archive file." }, { flag: "-z", description: "Use gzip compression." }], examples: [{ description: "List a gzip-compressed archive", command: "tar -tzf archive.tar.gz" }, { description: "Extract an archive", command: "tar -xzf archive.tar.gz" }], relatedCommands: ["unzip", "gzip"],
  },
  {
    id: "unzip", name: "unzip", category: "Filesystem", summary: "Inspect and extract ZIP archives.", description: "Use unzip -l to inspect an archive before extraction when working with untrusted files.", syntax: "unzip [OPTIONS] ARCHIVE", tags: ["archive", "zip", "extract"], options: [{ flag: "-l", description: "List archive contents." }], examples: [{ description: "Inspect a ZIP archive", command: "unzip -l sample.zip" }], relatedCommands: ["tar"],
  },
  {
    id: "chmod", name: "chmod", category: "Permissions", summary: "Change file and directory permissions.", description: "chmod changes read, write, and execute permissions for the owner, group, and others.", syntax: "chmod [OPTIONS] MODE FILE...", tags: ["permissions", "linux", "security"], options: [{ flag: "755", description: "Owner rwx; group and others rx." }, { flag: "644", description: "Owner rw; group and others r." }, { flag: "+x", description: "Add execute permission." }, { flag: "-R", description: "Apply recursively; use carefully." }], examples: [{ description: "Make a script executable", command: "chmod +x script.sh" }, { description: "Set conventional file permissions", command: "chmod 644 config.txt" }], relatedCommands: ["chown", "ls"],
  },
  {
    id: "ps", name: "ps", category: "Processes", summary: "Display running processes.", description: "ps provides a point-in-time process listing and is useful for identifying process IDs, users, commands, and process relationships.", syntax: "ps [OPTIONS]", tags: ["process", "system", "investigation"], options: [{ flag: "aux", description: "Show processes for all users with detailed information." }, { flag: "-ef", description: "Full-format process listing." }], examples: [{ description: "List processes", command: "ps aux" }, { description: "Filter a process list", command: "ps aux | grep -i process" }], relatedCommands: ["pgrep", "ss", "top"],
  },
  {
    id: "ss", name: "ss", category: "Processes", summary: "Inspect sockets, listening ports, and network connections.", description: "ss is a modern socket inspection utility. It can associate sockets with processes when sufficient privileges are available.", syntax: "ss [OPTIONS]", tags: ["network", "ports", "process"], options: [{ flag: "-t", description: "TCP sockets." }, { flag: "-u", description: "UDP sockets." }, { flag: "-l", description: "Listening sockets." }, { flag: "-n", description: "Do not resolve service names." }, { flag: "-p", description: "Show process information when permitted." }], examples: [{ description: "Show listening TCP/UDP sockets", command: "ss -tuln" }, { description: "Show sockets with process information", command: "ss -tunap" }], relatedCommands: ["ps", "lsof", "ip"],
  },
  {
    id: "dig", name: "dig", category: "DNS", summary: "Query DNS records and inspect DNS responses.", description: "dig is a precise DNS troubleshooting and reconnaissance utility.", syntax: "dig [@SERVER] NAME [TYPE]", tags: ["dns", "recon", "network"], options: [{ flag: "+short", description: "Show concise output." }, { flag: "A/MX/NS/TXT", description: "Query common record types." }], examples: [{ description: "Get an IPv4 address", command: "dig +short A TARGET" }, { description: "Inspect TXT records", command: "dig TXT TARGET" }], relatedCommands: ["nslookup", "host"],
  },
  {
    id: "nslookup", name: "nslookup", category: "DNS", summary: "Perform DNS queries from the terminal.", description: "nslookup is a portable DNS lookup utility useful for quick record checks.", syntax: "nslookup [-type=TYPE] NAME [SERVER]", tags: ["dns", "network"], options: [{ flag: "-type=TYPE", description: "Select the DNS record type." }], examples: [{ description: "Look up a host", command: "nslookup TARGET" }, { description: "Query MX records", command: "nslookup -type=MX TARGET" }], relatedCommands: ["dig", "host"],
  },
  {
    id: "nmap", name: "nmap", category: "Reconnaissance", summary: "Discover hosts, ports, and services on authorized targets.", description: "Nmap is a network discovery and security auditing tool. Use it only against systems and networks where scanning is authorized.", syntax: "nmap [SCAN OPTIONS] TARGET", tags: ["recon", "ports", "services", "network"], options: [{ flag: "-Pn", description: "Skip host discovery and treat hosts as online." }, { flag: "-p-", description: "Scan all TCP ports." }, { flag: "-p PORTS", description: "Scan selected ports." }, { flag: "-sV", description: "Probe services for version information." }, { flag: "-sC", description: "Run the default NSE script set." }, { flag: "-oN FILE", description: "Save normal output." }], examples: [{ description: "Service/version enumeration in an authorized lab", command: "nmap -sV TARGET" }, { description: "Full TCP port discovery", command: "nmap -Pn -p- TARGET" }], relatedCommands: ["curl", "dig", "katana"],
  },
  {
    id: "jq", name: "jq", category: "JSON", summary: "Query, filter, transform, and format JSON data.", description: "jq is especially useful when command-line security tools or APIs return structured JSON.", syntax: "jq [OPTIONS] FILTER [FILE...]", tags: ["json", "api", "filter"], options: [{ flag: ".", description: "Pretty-print JSON." }, { flag: "-r", description: "Output raw strings." }, { flag: "select(...) ", description: "Filter objects by a condition." }], examples: [{ description: "Pretty-print an API response", command: "curl -s https://TARGET/api | jq ." }, { description: "Extract a field from every array element", command: "jq -r '.[] | .url' endpoints.json" }], relatedCommands: ["curl", "grep", "awk"],
  },
  {
    id: "ip", name: "ip", category: "Networking", summary: "Inspect and manage Linux interfaces, addresses, routes, and links.", description: "The ip utility is the standard modern interface for Linux networking configuration and inspection.", syntax: "ip OBJECT COMMAND", tags: ["network", "interface", "route"], options: [], examples: [{ description: "Show addresses", command: "ip addr" }, { description: "Show routes", command: "ip route" }], relatedCommands: ["ss", "ping"],
  },
  {
    id: "whois", name: "whois", category: "Reconnaissance", summary: "Query registration information where a WHOIS service provides it.", description: "WHOIS can provide domain or network registration information. Availability and output depend on registry and privacy practices.", syntax: "whois DOMAIN_OR_IP", tags: ["recon", "domain"], options: [], examples: [{ description: "Query a domain", command: "whois TARGET" }], relatedCommands: ["dig", "nslookup"],
  },
  {
    id: "sha256sum", name: "sha256sum", category: "File Analysis", summary: "Calculate SHA-256 checksums for files or input.", description: "Checksums help verify file integrity and compare artifacts without relying on filenames.", syntax: "sha256sum [FILE...]", tags: ["hash", "integrity", "forensics"], options: [], examples: [{ description: "Hash an artifact", command: "sha256sum sample.bin" }], relatedCommands: ["md5sum", "sha1sum"],
  },
  {
    id: "python3", name: "python3", category: "Python", summary: "Run concise Python scripts and one-liners from the shell.", description: "Python is useful for parsing, encoding, hashing, JSON processing, and small repeatable transformations.", syntax: "python3 -c 'CODE'", tags: ["python", "script", "automation"], options: [{ flag: "-c", description: "Execute code supplied as a string." }], examples: [{ description: "Decode Base64", command: "python3 -c \"import base64; print(base64.b64decode('VEFSR0VU').decode())\"" }, { description: "Read JSON", command: "python3 -c \"import json; print(json.load(open('data.json')))\"" }], relatedCommands: ["jq", "base64"],
  },
];
