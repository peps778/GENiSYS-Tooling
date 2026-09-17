export const packetCommands = [
  ['tcpdump -i eth0', 'Capture on interface eth0.'],
  ['tcpdump -nn', 'Disable DNS and service-name resolution.'],
  ['tcpdump -i eth0 tcp', 'Capture TCP packets.'],
  ['tcpdump -i eth0 udp', 'Capture UDP packets.'],
  ['tcpdump -i eth0 port 80', 'Capture traffic involving port 80.'],
  ['tcpdump -i eth0 host 192.168.1.10', 'Capture traffic to or from a host.'],
  ['tcpdump -i eth0 -w capture.pcap', 'Write capture to a pcap file.'],
  ['tcpdump -r capture.pcap', 'Read a saved capture.'],
  [
    'tshark -r capture.pcap -Y "http"',
    'Display HTTP packets using a display filter.',
  ],
  ['tshark -r capture.pcap -Y "dns"', 'Display DNS packets.'],
] as const;
