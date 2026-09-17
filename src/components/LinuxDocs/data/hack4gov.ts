export const workflows = [
  { title: "Target reconnaissance", steps: ["DNS lookup", "Host/port discovery", "Service/version identification", "HTTP validation"], commands: ["dig +short A TARGET", "nmap -Pn -p- TARGET", "nmap -sV TARGET", "curl -I https://TARGET"] },
  { title: "Web enumeration", steps: ["Identify technology", "Crawl authorized application", "Collect endpoints", "Filter and validate",], commands: ["whatweb https://TARGET", "katana -u https://TARGET -jc", "katana -u https://TARGET -jc | sort -u", "curl -s https://TARGET/api | jq ."] },
  { title: "File analysis", steps: ["Identify type", "Inspect strings", "Inspect header/bytes", "Hash artifact"], commands: ["file FILE", "strings -n 8 FILE", "xxd -l 128 FILE", "sha256sum FILE"] },
  { title: "Process investigation", steps: ["List processes", "Inspect sockets", "Map process/network context", "Collect evidence"], commands: ["ps aux", "ss -tunap", "lsof -i", "find /proc -maxdepth 2 -type f 2>/dev/null"] },
];

export const cheatSheet = [
  ["DNS", "dig +short A TARGET"],
  ["All TCP ports", "nmap -Pn -p- TARGET"],
  ["Services", "nmap -sV TARGET"],
  ["HTTP headers", "curl -I https://TARGET"],
  ["Web crawl", "katana -u https://TARGET -jc"],
  ["File type", "file FILE"],
  ["Strings", "strings FILE"],
  ["Hex", "xxd -l 128 FILE"],
  ["JSON", "jq . data.json"],
  ["Processes", "ps aux"],
  ["Sockets", "ss -tunap"],
  ["Hash", "sha256sum FILE"],
];
