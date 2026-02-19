import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

// Upper bound for timestamps (January 1, 10000 CE)
const TIMESTAMP_UPPER_BOUND_SECONDS = 253402300799;

/**
 * Terms for configuring a linear streaming allowance of native tokens.
 */
export type NativeTokenStreamingTerms = {
  /** The initial amount available immediately (in wei). */
  initialAmount: bigint;
  /** The maximum total amount that can be transferred (in wei). */
  maxAmount: bigint;
  /** The rate at which allowance increases per second (in wei). */
  amountPerSecond: bigint;
  /** Unix timestamp when streaming begins. */
  startTime: number;
};

/**
 * Creates terms for the NativeTokenStreaming caveat, configuring a linear
 * streaming allowance of native tokens.
 *
 * @param terms - The terms for the NativeTokenStreaming caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Hex-encoded terms for the caveat (128 bytes).
 * @throws Error if initialAmount is negative.
 * @throws Error if maxAmount is not positive.
 * @throws Error if maxAmount is less than initialAmount.
 * @throws Error if amountPerSecond is not positive.
 * @throws Error if startTime is not positive.
 * @throws Error if startTime exceeds upper bound.
 */
export function createNativeTokenStreamingTerms(
  terms: NativeTokenStreamingTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNativeTokenStreamingTerms(
  terms: NativeTokenStreamingTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for the NativeTokenStreaming caveat, configuring a linear
 * streaming allowance of native tokens.
 *
 * @param terms - The terms for the NativeTokenStreaming caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 128-byte hex string.
 * @throws Error if any of the numeric parameters are invalid.
 */
export function createNativeTokenStreamingTerms(
  terms: NativeTokenStreamingTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { initialAmount, maxAmount, amountPerSecond, startTime } = terms;

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

  const hexValue = `0x${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

  return prepareResult(hexValue, encodingOptions);
}
