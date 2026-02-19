import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a NativeTokenTransferAmount caveat.
 */
export type NativeTokenTransferAmountTerms = {
  /** The maximum amount of native tokens that can be transferred. */
  maxAmount: bigint;
};

/**
 * Creates terms for a NativeTokenTransferAmount caveat that caps native transfers.
 *
 * @param terms - The terms for the NativeTokenTransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if maxAmount is negative.
 */
export function createNativeTokenTransferAmountTerms(
  terms: NativeTokenTransferAmountTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNativeTokenTransferAmountTerms(
  terms: NativeTokenTransferAmountTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a NativeTokenTransferAmount caveat that caps native transfers.
 *
 * @param terms - The terms for the NativeTokenTransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if maxAmount is negative.
 */
export function createNativeTokenTransferAmountTerms(
  terms: NativeTokenTransferAmountTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { maxAmount } = terms;

  if (maxAmount < 0n) {
    throw new Error('Invalid maxAmount: must be zero or positive');
  }

  const hexValue = `0x${toHexString({ value: maxAmount, size: 32 })}`;
  return prepareResult(hexValue, encodingOptions);
}
