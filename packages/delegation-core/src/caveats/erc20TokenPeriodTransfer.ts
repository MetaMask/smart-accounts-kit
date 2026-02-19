import { type BytesLike, isHexString, bytesToHex } from '@metamask/utils';

import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a periodic transfer allowance of ERC20 tokens.
 */
export type ERC20TokenPeriodTransferTerms = {
  /** The address of the ERC20 token. */
  tokenAddress: BytesLike;
  /** The maximum amount that can be transferred within each period. */
  periodAmount: bigint;
  /** The duration of each period in seconds. */
  periodDuration: number;
  /** Unix timestamp when the first period begins. */
  startDate: number;
};

/**
 * Creates terms for an ERC20TokenPeriodTransfer caveat that validates that ERC20 token transfers
 * do not exceed a specified amount within a given time period. The transferable amount resets at the
 * beginning of each period, and any unused tokens are forfeited once the period ends.
 *
 * @param terms - The terms for the ERC20TokenPeriodTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 128-byte hex string (32 bytes for each parameter).
 * @throws Error if any of the numeric parameters are invalid.
 */
export function createERC20TokenPeriodTransferTerms(
  terms: ERC20TokenPeriodTransferTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC20TokenPeriodTransferTerms(
  terms: ERC20TokenPeriodTransferTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC20TokenPeriodTransfer caveat that validates that ERC20 token transfers
 * do not exceed a specified amount within a given time period.
 *
 * @param terms - The terms for the ERC20TokenPeriodTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 128-byte hex string (32 bytes for each parameter).
 * @throws Error if any of the numeric parameters are invalid.
 */
export function createERC20TokenPeriodTransferTerms(
  terms: ERC20TokenPeriodTransferTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, periodAmount, periodDuration, startDate } = terms;

  if (!tokenAddress) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  let prefixedTokenAddressHex: string;

  if (typeof tokenAddress === 'string') {
    if (!isHexString(tokenAddress) || tokenAddress.length !== 42) {
      throw new Error('Invalid tokenAddress: must be a valid address');
    }
    prefixedTokenAddressHex = tokenAddress;
  } else {
    if (tokenAddress.length !== 20) {
      throw new Error('Invalid tokenAddress: must be a valid address');
    }
    prefixedTokenAddressHex = bytesToHex(tokenAddress);
  }

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

  const hexValue = `${prefixedTokenAddressHex}${periodAmountHex}${periodDurationHex}${startDateHex}`;

  return prepareResult(hexValue, encodingOptions);
}
