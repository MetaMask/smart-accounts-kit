/**
 * ## AllowedCalldataEnforcer
 *
 * Constrains the calldata bytes starting at a given byte offset to match an expected fragment.
 *
 * Terms are encoded as a 32-byte big-endian start index followed by the expected calldata bytes (not ABI-wrapped).
 */

import { bytesToHex, remove0x, type BytesLike } from '@metamask/utils';

import {
  extractNumber,
  extractRemainingHex,
  toHexString,
} from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an AllowedCalldata caveat.
 */
export type AllowedCalldataTerms = {
  startIndex: number;
  value: BytesLike;
};

/**
 * Creates terms for an AllowedCalldata caveat that ensures the provided execution calldata
 * matches the expected calldata at the specified index.
 *
 * @param terms - The terms for the AllowedCalldata caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the `calldata` is invalid.
 */
export function createAllowedCalldataTerms(
  terms: AllowedCalldataTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createAllowedCalldataTerms(
  terms: AllowedCalldataTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an AllowedCalldata caveat that ensures the provided execution calldata
 * matches the expected calldata at the specified index.
 *
 * @param terms - The terms for the AllowedCalldata caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the `calldata` is invalid.
 */
export function createAllowedCalldataTerms(
  terms: AllowedCalldataTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { startIndex, value } = terms;

  if (startIndex < 0) {
    throw new Error('Invalid startIndex: must be zero or positive');
  }

  if (!Number.isInteger(startIndex)) {
    throw new Error('Invalid startIndex: must be a whole number');
  }

  let unprefixedValue: string;

  if (typeof value === 'string') {
    if (!value.startsWith('0x')) {
      throw new Error('Invalid value: must be a hex string starting with 0x');
    }
    unprefixedValue = remove0x(value);
  } else {
    unprefixedValue = remove0x(bytesToHex(value));
  }

  const indexHex = toHexString({ value: startIndex, size: 32 });

  return prepareResult(`0x${indexHex}${unprefixedValue}`, encodingOptions);
}

/**
 * Decodes terms for an AllowedCalldata caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded AllowedCalldataTerms object.
 */
export function decodeAllowedCalldataTerms(
  terms: BytesLike,
): AllowedCalldataTerms {
  const hexTerms = bytesLikeToHex(terms);

  const startIndex = extractNumber(hexTerms, 0, 32);
  const value = extractRemainingHex(hexTerms, 32);

  return { startIndex, value };
}
