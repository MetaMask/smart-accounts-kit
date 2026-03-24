/**
 * ## NativeTokenPeriodTransferEnforcer
 *
 * Limits periodic native token transfers using amount, period length, and start date.
 *
 * Terms are encoded as three consecutive 32-byte big-endian uint256 words: period amount, period duration, start date.
 */

import type { BytesLike } from '@metamask/utils';

import { extractBigInt, extractNumber, toHexString } from '../internalUtils';
import {
  bytesLikeToHex,
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a NativeTokenPeriodTransfer caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded NativeTokenPeriodTransferTerms object.
 */
export function decodeNativeTokenPeriodTransferTerms(
  terms: BytesLike,
): NativeTokenPeriodTransferTerms {
  const hexTerms = bytesLikeToHex(terms);

  const periodAmount = extractBigInt(hexTerms, 0, 32);
  const periodDuration = extractNumber(hexTerms, 32, 32);
  const startDate = extractNumber(hexTerms, 64, 32);

  return { periodAmount, periodDuration, startDate };
}
