import type { EntityDefinition } from '../../core/types';

const OCTET = String.raw`(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)`;

export const IP_ADDRESS: EntityDefinition = {
  name: 'IP_ADDRESS',
  description: 'IP address',
  patterns: [
    {
      name: 'ipv4',
      regex: String.raw`\b${OCTET}(?:\.${OCTET}){3}(?:/(?:[0-2]?[0-9]|3[0-2]))?\b`,
      score: 0.6,
    },
    {
      // Only the full eight-group form. The compressed forms (`::`) need a real
      // parser to tell them from a MAC address or a time range, and the source
      // document recommends delegating that rather than replicating 5 patterns.
      name: 'ipv6-full',
      regex: String.raw`(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}(?![0-9A-Fa-f:])`,
      score: 0.6,
    },
  ],
  context: ['ip', 'address', 'host', 'servidor', 'direccion'],
};
