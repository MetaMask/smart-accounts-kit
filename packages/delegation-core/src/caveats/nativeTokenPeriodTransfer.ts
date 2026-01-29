import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a periodic transfer allowance of native tokens.
 */
export type NativeTokenPeriodTransferTerms = {
  /** The maximum amount that can be transferred within each period (in wei). */
  periodAmount: bigint;
  /** The duration of each period in seconds. */
  periodDuration: number;
  /** Unix timestamp when the first period begins. */
  startDate: number;
};

/**
 * Creates terms for a NativeTokenPeriodTransfer caveat that validates that native token (ETH) transfers
 * do not exceed a specified amount within a given time period. The transferable amount resets at the
 * beginning of each period, and any unused ETH is forfeited once the period ends.
 *
 * @param terms - The terms for the NativeTokenPeriodTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 96-byte hex string (32 bytes for each parameter).
 * @throws Error if any of the numeric parameters are invalid.
 */
export function createNativeTokenPeriodTransferTerms(
  terms: NativeTokenPeriodTransferTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNativeTokenPeriodTransferTerms(
  terms: NativeTokenPeriodTransferTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a NativeTokenPeriodTransfer caveat that validates that native token (ETH) transfers
 * do not exceed a specified amount within a given time period.
 *
 * @param terms - The terms for the NativeTokenPeriodTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 96-byte hex string (32 bytes for each parameter).
 * @throws Error if any of the numeric parameters are invalid.
 */
export function createNativeTokenPeriodTransferTerms(
  terms: NativeTokenPeriodTransferTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { periodAmount, periodDuration, startDate } = terms;

  if (periodAmount <= 0n) {
    throw new Error('Invalid periodAmount: must be a positive number');
  }

  if (periodDuration <= 0) {
    throw new Error('Invalid periodDuration: must be a positive number');
  }

  if (startDate <= 0) {
    throw new Error('Invalid startDate: must be a positive number');
  }

  const periodAmountHex = toHexString({ value: periodAmount, size: 32 });
  const periodDurationHex = toHexString({ value: periodDuration, size: 32 });
  const startDateHex = toHexString({ value: startDate, size: 32 });

  const hexValue = `0x${periodAmountHex}${periodDurationHex}${startDateHex}`;

  return prepareResult(hexValue, encodingOptions);
}
