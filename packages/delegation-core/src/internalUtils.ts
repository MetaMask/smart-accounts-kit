import {
  bytesToHex,
  hexToBytes,
  isHexString,
  remove0x,
  type BytesLike,
} from '@metamask/utils';

/**
 * Converts a numeric value to a hexadecimal string with zero-padding, without 0x prefix.
 *
 * @param options - The options for the conversion.
 * @param options.value - The numeric value to convert to hex (bigint or number).
 * @param options.size - The size in bytes for the resulting hex string (each byte = 2 hex characters).
 * @returns A hexadecimal string prefixed with zeros to match the specified size.
 * @example
 * ```typescript
 * toHexString({ value: 255, size: 2 }) // Returns "00ff"
 * toHexString({ value: 16n, size: 1 }) // Returns "10"
 * ```
 */
export const toHexString = ({
  value,
  size,
}: {
  value: bigint | number;
  size: number;
}): string => {
  return value.toString(16).padStart(size * 2, '0');
};

/**
 * Normalizes a bytes-like value into a hex string.
 *
 * @param value - The value to normalize.
 * @param errorMessage - Error message used for invalid input.
 * @returns The normalized hex string (0x-prefixed).
 * @throws Error if the input is an invalid hex string.
 */
export const normalizeHex = (
  value: BytesLike,
  errorMessage: string,
): string => {
  if (typeof value === 'string') {
    if (!isHexString(value)) {
      throw new Error(errorMessage);
    }
    return value;
  }

  return bytesToHex(value);
};

/**
 * Normalizes an address into a hex string without changing casing.
 *
 * @param value - The address as a hex string or bytes.
 * @param errorMessage - Error message used for invalid input.
 * @returns The address as a 0x-prefixed hex string.
 * @throws Error if the input is not a 20-byte address.
 */
export const normalizeAddress = (
  value: BytesLike,
  errorMessage: string,
): string => {
  if (typeof value === 'string') {
    if (!isHexString(value) || value.length !== 42) {
      throw new Error(errorMessage);
    }
    return value;
  }

  if (value.length !== 20) {
    throw new Error(errorMessage);
  }

  return bytesToHex(value);
};

/**
 * Normalizes an address into a lowercased hex string.
 *
 * @param value - The address as a hex string or bytes.
 * @param errorMessage - Error message used for invalid input.
 * @returns The address as a lowercased 0x-prefixed hex string.
 * @throws Error if the input is not a 20-byte address.
 */
export const normalizeAddressLowercase = (
  value: BytesLike,
  errorMessage: string,
): string => {
  if (typeof value === 'string') {
    if (!isHexString(value) || value.length !== 42) {
      throw new Error(errorMessage);
    }
    return bytesToHex(hexToBytes(value));
  }

  if (value.length !== 20) {
    throw new Error(errorMessage);
  }

  return bytesToHex(value);
};

/**
 * Concatenates 0x-prefixed hex strings into a single 0x-prefixed hex string.
 *
 * @param parts - The hex string parts to concatenate.
 * @returns The concatenated hex string.
 */
export const concatHex = (parts: string[]): string => {
  return `0x${parts.map(remove0x).join('')}`;
};
