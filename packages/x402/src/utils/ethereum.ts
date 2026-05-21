/**
 * Ethereum address type (0x-prefixed 40-character hex string)
 */
export type Address = `0x${string}`;

/**
 * Hex string type (0x-prefixed hex data)
 */
export type Hex = `0x${string}`;

/**
 * Validates that a value is a hex string with 0x prefix.
 *
 * @param value - Value to check
 * @returns True if value is a hex string with 0x prefix
 */
export function isHex(value: unknown): value is Hex {
  if (typeof value !== 'string') {
    return false;
  }

  if (value.length < 2 || !value.startsWith('0x')) {
    return false;
  }

  const hexChars = value.slice(2);
  return /^[0-9a-fA-F]*$/.test(hexChars);
}

/**
 * Validates and normalizes an Ethereum address to lowercase format.
 *
 * @param address - Address string to validate
 * @returns Normalized lowercase address
 * @throws Error if address is invalid
 */
export function getAddress(address: string): Address {
  if (typeof address !== 'string') {
    throw new Error('Address must be a string');
  }

  const normalizedAddress = address.toLowerCase();

  if (!/^0x[0-9a-f]{40}$/.test(normalizedAddress)) {
    throw new Error('Invalid address format');
  }

  return normalizedAddress as Address;
}
