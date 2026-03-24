/**
 * ## ERC20TokenPeriodTransferEnforcer
 *
 * Limits periodic ERC-20 transfers for a token using amount, period length, and start date.
 *
 * Terms are encoded as 20-byte token address then three 32-byte big-endian uint256 words: period amount, period duration, start date.
 */

import { type BytesLike, isHexString, bytesToHex } from '@metamask/utils';

import {
  extractAddress,
  extractBigInt,
  extractNumber,
  toHexString,
} from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type DecodedBytesLike,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a periodic transfer allowance of ERC20 tokens.
 */
export type ERC20TokenPeriodTransferTerms<
  TBytesLike extends BytesLike = BytesLike,
> = {
  /** The address of the ERC20 token. */
  tokenAddress: TBytesLike;
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for an ERC20TokenPeriodTransfer caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC20TokenPeriodTransferTerms object.
 */
export function decodeERC20TokenPeriodTransferTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ERC20TokenPeriodTransferTerms<DecodedBytesLike<'hex'>>;
export function decodeERC20TokenPeriodTransferTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ERC20TokenPeriodTransferTerms<DecodedBytesLike<'bytes'>>;
/**
 *
 * @param terms
 * @param encodingOptions
 */
export function decodeERC20TokenPeriodTransferTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ERC20TokenPeriodTransferTerms<DecodedBytesLike<'hex'>>
  | ERC20TokenPeriodTransferTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const tokenAddressHex = extractAddress(hexTerms, 0);
  const periodAmount = extractBigInt(hexTerms, 20, 32);
  const periodDuration = extractNumber(hexTerms, 52, 32);
  const startDate = extractNumber(hexTerms, 84, 32);

  return {
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    periodAmount,
    periodDuration,
    startDate,
  } as
    | ERC20TokenPeriodTransferTerms<DecodedBytesLike<'hex'>>
    | ERC20TokenPeriodTransferTerms<DecodedBytesLike<'bytes'>>;
}
