import { bytesToHex, remove0x, type BytesLike } from '@metamask/utils';

import { toHexString } from '../internalUtils';
import {
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
 * @returns The terms as the calldata itself.
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
 * @returns The terms as the calldata itself.
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

  // The terms are the index encoded as 32 bytes followed by the expected value.
  return prepareResult(`0x${indexHex}${unprefixedValue}`, encodingOptions);
}
