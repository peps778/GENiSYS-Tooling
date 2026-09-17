import { describe, it, expect } from 'vitest';
import { calculateCidr } from '../lib/cidrCalculator';
describe('CIDR calculator', () => {
  it.each([
    ['192.168.1.0/24', '192.168.1.0', '192.168.1.255', 254],
    ['10.0.0.0/8', '10.0.0.0', '10.255.255.255', 16777214],
    ['192.168.1.0/30', '192.168.1.0', '192.168.1.3', 2],
    ['127.0.0.1/32', '127.0.0.1', '127.0.0.1', 1],
  ])('%s', (input, network, broadcast, hosts) => {
    const r = calculateCidr(input);
    expect(r.networkAddress).toBe(network);
    expect(r.broadcastAddress).toBe(broadcast);
    expect(r.usableHostCount).toBe(hosts);
  });
  it('rejects invalid CIDR', () =>
    expect(() => calculateCidr('10.0.0.0/33')).toThrow());
});
