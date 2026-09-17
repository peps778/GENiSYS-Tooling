export function isSafeReferenceCommand(command: string): boolean {
  const value = command.trim().toLowerCase();
  if (!value) return false;
  return /^(ip|ss|dig|nslookup|curl|nmap|tcpdump|tshark|route|ufw|iptables|nft)\b/.test(
    value,
  );
}
