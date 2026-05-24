import { getChecksumAddress, isHexChecksumAddress } from '@metamask/utils';

export type Address = `0x${string}`;
export type Hex = `0x${string}`;

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
  if (!isHexChecksumAddress(value)) {
    throw new Error('Invalid Ethereum address');
  }

  const lowerAddress = value.toLowerCase();
  const upperAddress = value.toUpperCase();
  const checksummedAddress = getChecksumAddress(value);

  if (
    value !== lowerAddress &&
    value !== upperAddress &&
    value !== checksummedAddress
  ) {
    throw new Error('Invalid Ethereum address checksum');
  }

  return checksummedAddress;
}
