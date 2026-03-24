/**
 * ## BlockNumberEnforcer
 *
 * Restricts redemption to a block number range.
 *
 * Terms are encoded as a 16-byte after threshold followed by a 16-byte before threshold (each big-endian, zero-padded).
 */

import type { BytesLike } from '@metamask/utils';

import { extractBigInt, toHexString } from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a BlockNumber caveat.
 */
export type BlockNumberTerms = {
  /** The block number after which the delegation is valid. Set to 0n to disable. */
  afterThreshold: bigint;
  /** The block number before which the delegation is valid. Set to 0n to disable. */
  beforeThreshold: bigint;
};

/**
 * Creates terms for a BlockNumber caveat that constrains delegation validity by block range.
 *
 * @param terms - The terms for the BlockNumber caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if both thresholds are zero or if afterThreshold >= beforeThreshold when both are set.
 */
export function createBlockNumberTerms(
  terms: BlockNumberTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createBlockNumberTerms(
  terms: BlockNumberTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a BlockNumber caveat that constrains delegation validity by block range.
 *
 * @param terms - The terms for the BlockNumber caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if both thresholds are zero or if afterThreshold >= beforeThreshold when both are set.
 */
export function createBlockNumberTerms(
  terms: BlockNumberTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { afterThreshold, beforeThreshold } = terms;

  if (afterThreshold < 0n || beforeThreshold < 0n) {
    throw new Error('Invalid thresholds: block numbers must be non-negative');
  }

  if (afterThreshold === 0n && beforeThreshold === 0n) {
    throw new Error(
      'Invalid thresholds: At least one of afterThreshold or beforeThreshold must be specified',
    );
  }

  if (beforeThreshold !== 0n && afterThreshold >= beforeThreshold) {
    throw new Error(
      'Invalid thresholds: afterThreshold must be less than beforeThreshold if both are specified',
    );
  }

  const afterThresholdHex = toHexString({ value: afterThreshold, size: 16 });
  const beforeThresholdHex = toHexString({ value: beforeThreshold, size: 16 });
  const hexValue = `0x${afterThresholdHex}${beforeThresholdHex}`;

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a BlockNumber caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded BlockNumberTerms object.
 */
export function decodeBlockNumberTerms(terms: BytesLike): BlockNumberTerms {
  const hexTerms = bytesLikeToHex(terms);
  const afterThreshold = extractBigInt(hexTerms, 0, 16);
  const beforeThreshold = extractBigInt(hexTerms, 16, 16);
  return { afterThreshold, beforeThreshold };
}
