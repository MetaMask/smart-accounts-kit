/**
 * ## ERC20StreamingEnforcer
 *
 * Configures a linear streaming allowance for an ERC-20 token over time.
 *
 * Terms are encoded as 20-byte token address then four 32-byte big-endian uint256 words: initial amount, max amount, amount per second, start time.
 */

import { type BytesLike, bytesToHex, isHexString } from '@metamask/utils';

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

// Upper bound for timestamps (January 1, 10000 CE)
const TIMESTAMP_UPPER_BOUND_SECONDS = 253402300799;

/**
 * Terms for configuring a linear streaming allowance of ERC20 tokens.
 */
export type ERC20StreamingTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The address of the ERC20 token contract. */
  tokenAddress: TBytesLike;
  /** The initial amount available immediately. */
  initialAmount: bigint;
  /** The maximum total amount that can be transferred. */
  maxAmount: bigint;
  /** The rate at which allowance increases per second. */
  amountPerSecond: bigint;
  /** Unix timestamp when streaming begins. */
  startTime: number;
};

/**
 * Creates terms for the ERC20Streaming caveat, configuring a linear
 * streaming allowance of ERC20 tokens.
 *
 * @param terms - The terms for the ERC20Streaming caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Hex-encoded terms for the caveat (160 bytes).
 * @throws Error if tokenAddress is invalid.
 * @throws Error if initialAmount is negative.
 * @throws Error if maxAmount is not positive.
 * @throws Error if maxAmount is less than initialAmount.
 * @throws Error if amountPerSecond is not positive.
 * @throws Error if startTime is not positive.
 * @throws Error if startTime exceeds upper bound.
 */
export function createERC20StreamingTerms(
  terms: ERC20StreamingTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC20StreamingTerms(
  terms: ERC20StreamingTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for the ERC20Streaming caveat, configuring a linear
 * streaming allowance of ERC20 tokens.
 *
 * @param terms - The terms for the ERC20Streaming caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any of the parameters are invalid.
 */
export function createERC20StreamingTerms(
  terms: ERC20StreamingTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, initialAmount, maxAmount, amountPerSecond, startTime } =
    terms;

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

  if (initialAmount < 0n) {
    throw new Error('Invalid initialAmount: must be greater than zero');
  }

  if (maxAmount <= 0n) {
    throw new Error('Invalid maxAmount: must be a positive number');
  }

  if (maxAmount < initialAmount) {
    throw new Error('Invalid maxAmount: must be greater than initialAmount');
  }

  if (amountPerSecond <= 0n) {
    throw new Error('Invalid amountPerSecond: must be a positive number');
  }

  if (startTime <= 0) {
    throw new Error('Invalid startTime: must be a positive number');
  }

  if (startTime > TIMESTAMP_UPPER_BOUND_SECONDS) {
    throw new Error(
      'Invalid startTime: must be less than or equal to 253402300799',
    );
  }

  const initialAmountHex = toHexString({ value: initialAmount, size: 32 });
  const maxAmountHex = toHexString({ value: maxAmount, size: 32 });
  const amountPerSecondHex = toHexString({ value: amountPerSecond, size: 32 });
  const startTimeHex = toHexString({ value: startTime, size: 32 });

  const hexValue = `${prefixedTokenAddressHex}${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ERC20Streaming caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC20StreamingTerms object.
 */
export function decodeERC20StreamingTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ERC20StreamingTerms<DecodedBytesLike<'hex'>>;
export function decodeERC20StreamingTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ERC20StreamingTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC20StreamingTerms object.
 */
export function decodeERC20StreamingTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ERC20StreamingTerms<DecodedBytesLike<'hex'>>
  | ERC20StreamingTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const tokenAddressHex = extractAddress(hexTerms, 0);
  const initialAmount = extractBigInt(hexTerms, 20, 32);
  const maxAmount = extractBigInt(hexTerms, 52, 32);
  const amountPerSecond = extractBigInt(hexTerms, 84, 32);
  const startTime = extractNumber(hexTerms, 116, 32);

  return {
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
  } as
    | ERC20StreamingTerms<DecodedBytesLike<'hex'>>
    | ERC20StreamingTerms<DecodedBytesLike<'bytes'>>;
}
