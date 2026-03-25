/**
 * ## ValueLteEnforcer
 *
 * Limits the native token (wei) value allowed per execution.
 *
 * Terms are encoded as a single 32-byte big-endian uint256 max value.
 */

import type { BytesLike } from '@metamask/utils';

import {
  assertHexByteExactLength,
  extractBigInt,
  toHexString,
} from '../internalUtils';
import {
  bytesLikeToHex,
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a ValueLte caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded ValueLteTerms object.
 */
export function decodeValueLteTerms(terms: BytesLike): ValueLteTerms {
  const hexTerms = bytesLikeToHex(terms);
  assertHexByteExactLength(
    hexTerms,
    32,
    'Invalid ValueLte terms: must be exactly 32 bytes',
  );
  const maxValue = extractBigInt(hexTerms, 0, 32);
  return { maxValue };
}
