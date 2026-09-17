export const kaliTools = [
  { name: "nmap", purpose: "Host, port, and service discovery", command: "nmap -sV TARGET" },
  { name: "httpx", purpose: "Probe HTTP services and collect response metadata", command: "httpx -u https://TARGET" },
  { name: "ffuf", purpose: "Authorized web content and parameter discovery", command: "ffuf -u https://TARGET/FUZZ -w wordlist.txt" },
  { name: "gobuster", purpose: "Authorized directory and DNS enumeration", command: "gobuster dir -u https://TARGET -w wordlist.txt" },
  { name: "feroxbuster", purpose: "Authorized recursive content discovery", command: "feroxbuster -u https://TARGET" },
  { name: "nikto", purpose: "Web server configuration and known-issue checks", command: "nikto -h https://TARGET" },
  { name: "whatweb", purpose: "Web technology identification", command: "whatweb https://TARGET" },
  { name: "katana", purpose: "Web crawling and endpoint discovery", command: "katana -u https://TARGET -jc" },
];
