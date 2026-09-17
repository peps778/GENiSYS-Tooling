export type PacketFilterOptions = {
  interfaceName?: string;
  protocol?: 'tcp' | 'udp' | 'icmp';
  host?: string;
  port?: string;
  writeFile?: string;
};
export function generateTcpdumpCommand(options: PacketFilterOptions): string {
  const args = ['tcpdump'];
  if (options.interfaceName) args.push('-i', options.interfaceName);
  args.push('-nn');
  const filters: string[] = [];
  if (options.protocol) filters.push(options.protocol);
  if (options.host) filters.push(`host ${options.host}`);
  if (options.port) filters.push(`port ${options.port}`);
  if (filters.length) args.push(filters.join(' and '));
  if (options.writeFile) args.splice(1, 0, '-w', options.writeFile);
  return args.join(' ');
}
