import { keccak_256 as keccak256 } from '@noble/hashes/sha3';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

export type Address = `0x${string}`;
export type Hex = `0x${string}`;

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/u;
const HEX_REGEX = /^0x[0-9a-fA-F]*$/u;

/**
 * Check whether a value is a 0x-prefixed hexadecimal string.
 *
 * @param value - Value to inspect.
 * @returns True when the value is hex data.
 */
export function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && HEX_REGEX.test(value);
}

/**
 * Validate and normalize an Ethereum address to its EIP-55 checksum form.
 *
 * @param value - Address string to normalize.
 * @returns The checksummed address.
 */
export function getAddress(value: string): Address {
  if (!ADDRESS_REGEX.test(value)) {
    throw new Error('Invalid Ethereum address');
  }

  const address = value.slice(2);
  const lowerAddress = address.toLowerCase();
  const upperAddress = address.toUpperCase();
  const checksummedAddress = checksumAddress(lowerAddress);

  if (
    address !== lowerAddress &&
    address !== upperAddress &&
    `0x${address}` !== checksummedAddress
  ) {
    throw new Error('Invalid Ethereum address checksum');
  }

  return checksummedAddress;
}

/**
 * Convert a lowercase Ethereum address body to EIP-55 checksum form.
 *
 * @param lowerAddress - 40-character lowercase hex address without 0x prefix.
 * @returns The checksummed address with 0x prefix.
 */
function checksumAddress(lowerAddress: string): Address {
  const addressHash = bytesToHex(keccak256(utf8ToBytes(lowerAddress)));
  let checksummed = '0x';

  for (let index = 0; index < lowerAddress.length; index += 1) {
    const character = lowerAddress[index] as string;
    const hashNibble = addressHash[index] as string;
    checksummed +=
      Number.parseInt(hashNibble, 16) >= 8
        ? character.toUpperCase()
        : character;
  }

  return checksummed as Address;
}
