import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a LimitedCalls caveat.
 */
export type LimitedCallsTerms = {
  /** The maximum number of times this delegation may be redeemed. */
  limit: number;
};

/**
 * Creates terms for a LimitedCalls caveat that restricts the number of redeems.
 *
 * @param terms - The terms for the LimitedCalls caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the limit is not a positive integer.
 */
export function createLimitedCallsTerms(
  terms: LimitedCallsTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createLimitedCallsTerms(
  terms: LimitedCallsTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a LimitedCalls caveat that restricts the number of redeems.
 *
 * @param terms - The terms for the LimitedCalls caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the limit is not a positive integer.
 */
export function createLimitedCallsTerms(
  terms: LimitedCallsTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { limit } = terms;

  if (!Number.isInteger(limit)) {
    throw new Error('Invalid limit: must be an integer');
  }

  if (limit <= 0) {
    throw new Error('Invalid limit: must be a positive integer');
  }

  const hexValue = `0x${toHexString({ value: limit, size: 32 })}`;
  return prepareResult(hexValue, encodingOptions);
}
