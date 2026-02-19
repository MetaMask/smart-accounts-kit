import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a ValueLte caveat.
 */
export type ValueLteTerms = {
  /** The maximum value allowed for the transaction as a bigint. */
  maxValue: bigint;
};

/**
 * Creates terms for a ValueLte caveat that limits the maximum value of native tokens that can be spent.
 *
 * @param terms - The terms for the ValueLte caveat.
 * @param options - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the maxValue is negative.
 */
export function createValueLteTerms(
  terms: ValueLteTerms,
  options?: EncodingOptions<'hex'>,
): Hex;
export function createValueLteTerms(
  terms: ValueLteTerms,
  options: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a ValueLte caveat that limits the maximum value of native tokens that can be spent.
 *
 * @param terms - The terms for the ValueLte caveat.
 * @param options - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the maxValue is negative.
 */
export function createValueLteTerms(
  terms: ValueLteTerms,
  options: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { maxValue } = terms;

  if (maxValue < 0n) {
    throw new Error('Invalid maxValue: must be greater than or equal to zero');
  }
  const hexValue = toHexString({ value: maxValue, size: 32 });

  return prepareResult(hexValue, options);
}
