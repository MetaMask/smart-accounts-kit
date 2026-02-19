import { toHexString } from '../internalUtils';
import {
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
 * @returns The terms as a 32-byte hex string (16 bytes for each threshold).
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
 * @returns The terms as a 32-byte hex string (16 bytes for each threshold).
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
