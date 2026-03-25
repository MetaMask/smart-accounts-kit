/**
 * ## TimestampEnforcer
 *
 * Restricts redemption to a unix timestamp window (strict inequalities on-chain: valid when `block.timestamp > afterThreshold` if after is set, and `block.timestamp < beforeThreshold` if before is set).
 *
 * Terms are encoded as two 16-byte big-endian fields: timestamp after, then timestamp before (each zero-padded; interpreted as `uint128`).
 */

import type { BytesLike } from '@metamask/utils';

import {
  assertHexByteExactLength,
  extractNumber,
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

// Upper bound for timestamps (equivalent to January 1, 10000 CE)
const TIMESTAMP_UPPER_BOUND_SECONDS = 253402300799;

/**
 * Terms for configuring a timestamp threshold for delegation usage.
 */
export type TimestampTerms = {
  /** The timestamp (in seconds) after which the delegation can be used. */
  afterThreshold: number;
  /** The timestamp (in seconds) before which the delegation can be used. */
  beforeThreshold: number;
};

/**
 * Creates terms for a Timestamp caveat that enforces time-based constraints on delegation usage.
 *
 * @param terms - The terms for the Timestamp caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the timestamps are invalid.
 */
export function createTimestampTerms(
  terms: TimestampTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createTimestampTerms(
  terms: TimestampTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a Timestamp caveat that enforces time-based constraints on delegation usage.
 *
 * @param terms - The terms for the Timestamp caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the timestamps are invalid.
 */
export function createTimestampTerms(
  terms: TimestampTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { afterThreshold, beforeThreshold } = terms;

  if (afterThreshold < 0) {
    throw new Error('Invalid afterThreshold: must be zero or positive');
  }

  if (beforeThreshold < 0) {
    throw new Error('Invalid beforeThreshold: must be zero or positive');
  }

  if (beforeThreshold > TIMESTAMP_UPPER_BOUND_SECONDS) {
    throw new Error(
      `Invalid beforeThreshold: must be less than or equal to ${TIMESTAMP_UPPER_BOUND_SECONDS}`,
    );
  }

  if (afterThreshold > TIMESTAMP_UPPER_BOUND_SECONDS) {
    throw new Error(
      `Invalid afterThreshold: must be less than or equal to ${TIMESTAMP_UPPER_BOUND_SECONDS}`,
    );
  }

  if (beforeThreshold !== 0 && afterThreshold >= beforeThreshold) {
    throw new Error(
      'Invalid thresholds: beforeThreshold must be greater than afterThreshold when both are specified',
    );
  }

  const afterThresholdHex = toHexString({
    value: afterThreshold,
    size: 16,
  });
  const beforeThresholdHex = toHexString({
    value: beforeThreshold,
    size: 16,
  });

  const hexValue = `0x${afterThresholdHex}${beforeThresholdHex}`;

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a Timestamp caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded TimestampTerms object.
 */
export function decodeTimestampTerms(terms: BytesLike): TimestampTerms {
  const hexTerms = bytesLikeToHex(terms);
  assertHexByteExactLength(
    hexTerms,
    32,
    'Invalid Timestamp terms: must be exactly 32 bytes',
  );
  const afterThreshold = extractNumber(hexTerms, 0, 16);
  const beforeThreshold = extractNumber(hexTerms, 16, 16);
  return { afterThreshold, beforeThreshold };
}
