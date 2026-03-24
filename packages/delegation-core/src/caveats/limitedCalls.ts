/**
 * ## LimitedCallsEnforcer
 *
 * Caps how many times the delegation may be redeemed.
 *
 * Terms are encoded as a single 32-byte big-endian uint256 call limit.
 */

import type { BytesLike } from '@metamask/utils';

import { extractNumber, toHexString } from '../internalUtils';
import {
  bytesLikeToHex,
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a LimitedCalls caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded LimitedCallsTerms object.
 */
export function decodeLimitedCallsTerms(terms: BytesLike): LimitedCallsTerms {
  const hexTerms = bytesLikeToHex(terms);
  const limit = extractNumber(hexTerms, 0, 32);
  return { limit };
}
