import {
  getChecksumAddress,
  isHexChecksumAddress,
  type Hex,
} from '@metamask/utils';

/**
 * Validate and normalize an Ethereum address to its EIP-55 checksum form.
 *
 * @param value - Address string to normalize.
 * @returns The checksummed address.
 */
export function getAddress(value: string): Hex {
  if (!isHexChecksumAddress(value)) {
    throw new Error('Invalid Ethereum address');
  }

  const lowerAddress = value.toLowerCase();
  const upperAddress = `0x${value.slice(2).toUpperCase()}`;
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
