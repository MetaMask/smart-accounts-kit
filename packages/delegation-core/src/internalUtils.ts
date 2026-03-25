import {
  bytesToHex,
  hexToBytes,
  isHexString,
  remove0x,
  type Hex,
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

/**
 * Extracts a bigint value from a hex string at a specific byte offset.
 *
 * @param value - The hex string to extract from.
 * @param offset - The byte offset to start extraction.
 * @param size - The number of bytes to extract.
 * @returns The extracted bigint value.
 */
export const extractBigInt = (
  value: Hex,
  offset: number,
  size: number,
): bigint => {
  const start = 2 + offset * 2;
  const end = start + size * 2;
  const slice = value.slice(start, end);

  return BigInt(`0x${slice}`);
};

/**
 * Extracts a number value from a hex string at a specific byte offset.
 *
 * @param value - The hex string to extract from.
 * @param offset - The byte offset to start extraction.
 * @param size - The number of bytes to extract.
 * @returns The extracted number value.
 */
export const extractNumber = (
  value: Hex,
  offset: number,
  size: number,
): number => {
  const bigIntValue = extractBigInt(value, offset, size);

  if (bigIntValue > Number.MAX_SAFE_INTEGER) {
    throw new Error('Number is too large');
  }

  return Number(bigIntValue);
};

/**
 * Extracts an address from a hex string at a specific byte offset.
 *
 * @param value - The hex string to extract from.
 * @param offset - The byte offset to start extraction.
 * @returns The extracted address as a 0x-prefixed hex string.
 */
export const extractAddress = (value: Hex, offset: number): Hex => {
  const start = 2 + offset * 2;
  const end = start + 40;

  return `0x${value.slice(start, end)}`;
};

/**
 * Extracts a hex slice from a hex string at a specific byte offset.
 *
 * @param value - The hex string to extract from.
 * @param offset - The byte offset to start extraction.
 * @param size - The number of bytes to extract.
 * @returns The extracted hex string (0x-prefixed).
 */
export const extractHex = (value: Hex, offset: number, size: number): Hex => {
  const start = 2 + offset * 2;
  const end = start + size * 2;

  return `0x${value.slice(start, end)}`;
};

/**
 * Extracts the remaining hex data from a hex string starting at a specific byte offset.
 *
 * @param value - The hex string to extract from.
 * @param offset - The byte offset to start extraction.
 * @returns The extracted hex string (0x-prefixed).
 */
export const extractRemainingHex = (value: Hex, offset: number): Hex => {
  const start = 2 + offset * 2;

  return `0x${value.slice(start)}`;
};

/**
 * @param value - `0x`-prefixed hex string.
 * @returns Byte length of the hex data (excluding the `0x` prefix).
 */
export function getByteLength(value: Hex): number {
  return (value.length - 2) / 2;
}

/**
 * @param hexTerms - `0x`-prefixed hex string (encoded caveat terms).
 * @param expectedBytes - Required payload length in bytes.
 * @param errorMessage - Message for the thrown `Error` when length does not match.
 * @throws Error if the payload is not exactly `expectedBytes` long.
 */
export function assertHexByteExactLength(
  hexTerms: Hex,
  expectedBytes: number,
  errorMessage: string,
): void {
  if (getByteLength(hexTerms) !== expectedBytes) {
    throw new Error(errorMessage);
  }
}

/**
 * @param hexTerms - `0x`-prefixed hex string (encoded caveat terms).
 * @param unitBytes - Payload length must be divisible by this many bytes.
 * @param errorMessage - Message for the thrown `Error` when length is not a multiple.
 * @throws Error if the payload length is not a multiple of `unitBytes`.
 */
export function assertHexByteLengthMultipleOf(
  hexTerms: Hex,
  unitBytes: number,
  errorMessage: string,
): void {
  if (getByteLength(hexTerms) % unitBytes !== 0) {
    throw new Error(errorMessage);
  }
}

/**
 * @param hexTerms - `0x`-prefixed hex string (encoded caveat terms).
 * @param minBytes - Minimum payload length in bytes (inclusive).
 * @param errorMessage - Message for the thrown `Error` when payload is too short.
 * @throws Error if the payload is shorter than `minBytes`.
 */
export function assertHexBytesMinLength(
  hexTerms: Hex,
  minBytes: number,
  errorMessage: string,
): void {
  if (getByteLength(hexTerms) < minBytes) {
    throw new Error(errorMessage);
  }
}
