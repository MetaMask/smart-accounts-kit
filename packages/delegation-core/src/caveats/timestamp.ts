/**
 * ## TimestampEnforcer
 *
 * Restricts redemption to a unix timestamp window (after / before thresholds).
 *
 * Terms are encoded as two 16-byte big-endian fields: timestamp after, then timestamp before (each zero-padded).
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

// Upper bound for timestamps (equivalent to January 1, 10000 CE)
const TIMESTAMP_UPPER_BOUND_SECONDS = 253402300799;

/**
 * Terms for configuring a timestamp threshold for delegation usage.
 */
export type TimestampTerms = {
  /** The timestamp (in seconds) after which the delegation can be used. */
  timestampAfterThreshold: number;
  /** The timestamp (in seconds) before which the delegation can be used. */
  timestampBeforeThreshold: number;
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
  const { timestampAfterThreshold, timestampBeforeThreshold } = terms;

  if (timestampAfterThreshold < 0) {
    throw new Error(
      'Invalid timestampAfterThreshold: must be zero or positive',
    );
  }

  if (timestampBeforeThreshold < 0) {
    throw new Error(
      'Invalid timestampBeforeThreshold: must be zero or positive',
    );
  }

  if (timestampBeforeThreshold > TIMESTAMP_UPPER_BOUND_SECONDS) {
    throw new Error(
      `Invalid timestampBeforeThreshold: must be less than or equal to ${TIMESTAMP_UPPER_BOUND_SECONDS}`,
    );
  }

  if (timestampAfterThreshold > TIMESTAMP_UPPER_BOUND_SECONDS) {
    throw new Error(
      `Invalid timestampAfterThreshold: must be less than or equal to ${TIMESTAMP_UPPER_BOUND_SECONDS}`,
    );
  }

  if (
    timestampBeforeThreshold !== 0 &&
    timestampAfterThreshold >= timestampBeforeThreshold
  ) {
    throw new Error(
      'Invalid thresholds: timestampBeforeThreshold must be greater than timestampAfterThreshold when both are specified',
    );
  }

  const afterThresholdHex = toHexString({
    value: timestampAfterThreshold,
    size: 16,
  });
  const beforeThresholdHex = toHexString({
    value: timestampBeforeThreshold,
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
  const timestampAfterThreshold = extractNumber(hexTerms, 0, 16);
  const timestampBeforeThreshold = extractNumber(hexTerms, 16, 16);
  return { timestampAfterThreshold, timestampBeforeThreshold };
}
