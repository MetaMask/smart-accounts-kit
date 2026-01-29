import {
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
} from 'viem';

import type { Caveat } from './types';

export const CAVEAT_ABI_TYPE_COMPONENTS = [
  { type: 'address', name: 'enforcer' },
  { type: 'bytes', name: 'terms' },
  { type: 'bytes', name: 'args' },
];

export const CAVEAT_TYPEHASH: Hex = keccak256(
  toHex('Caveat(address enforcer,bytes terms)'),
);

/**
 * Calculates the hash of a single Caveat.
 *
 * @param input - The Caveat data.
 * @returns The keccak256 hash of the encoded Caveat packet.
 */
export const getCaveatPacketHash = (input: Caveat): Hex => {
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, bytes32'),
    [CAVEAT_TYPEHASH, input.enforcer, keccak256(input.terms)],
  );
  return keccak256(encoded);
};

/**
 * Creates a caveat.
 *
 * @param enforcer - The contract that guarantees the caveat is upheld.
 * @param terms - The data that the enforcer will use to verify the caveat (unique per enforcer).
 * @param args - Additional arguments for the caveat (optional).
 * @returns A Caveat.
 */
export const createCaveat = (
  enforcer: Hex,
  terms: Hex,
  args: Hex = '0x00',
): Caveat => ({
  enforcer,
  terms,
  args,
});
