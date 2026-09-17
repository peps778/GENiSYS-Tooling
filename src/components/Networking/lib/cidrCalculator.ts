import type { CidrResult } from '../types/networkRecon';

function ipToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d+$/.test(p)))
    throw new Error('Invalid IPv4 address');
  const nums = parts.map(Number);
  if (nums.some((n) => n < 0 || n > 255))
    throw new Error('Invalid IPv4 address');
  return (
    (((nums[0] << 24) >>> 0) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0
  );
}
function intToIp(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');
}
export function calculateCidr(input: string): CidrResult {
  const match = input.trim().match(/^([^/]+)\/(\d{1,2})$/);
  if (!match) throw new Error('Use CIDR notation such as 192.168.1.0/24');
  const prefix = Number(match[2]);
  if (prefix < 0 || prefix > 32)
    throw new Error('Prefix must be between 0 and 32');
  const ip = ipToInt(match[1]);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable =
    prefix >= 31 ? (prefix === 32 ? 1 : 2) : Math.max(total - 2, 0);
  return {
    input: input.trim(),
    networkAddress: intToIp(network),
    broadcastAddress: intToIp(broadcast),
    subnetMask: intToIp(mask),
    prefixLength: prefix,
    totalAddresses: total,
    usableHostCount: usable,
    firstHost: prefix >= 31 ? intToIp(network) : intToIp(network + 1),
    lastHost: prefix >= 31 ? intToIp(broadcast) : intToIp(broadcast - 1),
  };
}
