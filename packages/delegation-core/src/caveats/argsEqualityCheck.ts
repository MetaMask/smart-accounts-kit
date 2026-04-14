/**
 * ## ArgsEqualityCheckEnforcer
 *
 * Requires args on the caveat to equal an expected byte sequence.
 *
 * Terms are encoded as the raw expected args hex.
 */

import type { BytesLike } from '@metamask/utils';

import { normalizeHex } from '../internalUtils';
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
 * Terms for configuring an ArgsEqualityCheck caveat.
 */
export type ArgsEqualityCheckTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The expected args that must match exactly when redeeming the delegation. */
  args: TBytesLike;
};

/**
 * Creates terms for an ArgsEqualityCheck caveat that requires exact args matching.
 *
 * @param terms - The terms for the ArgsEqualityCheck caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if args is not a valid hex string.
 */
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ArgsEqualityCheck caveat that requires exact args matching.
 *
 * @param terms - The terms for the ArgsEqualityCheck caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if args is not a valid hex string.
 */
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { args } = terms;

  if (typeof args === 'string' && args === '0x') {
    return prepareResult(args, encodingOptions);
  }

  const hexValue = normalizeHex(
    args,
    'Invalid config: args must be a valid hex string',
  );

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ArgsEqualityCheck caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded args are returned as hex or bytes.
 * @returns The decoded ArgsEqualityCheckTerms object.
 */
export function decodeArgsEqualityCheckTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ArgsEqualityCheckTerms<DecodedBytesLike<'hex'>>;
export function decodeArgsEqualityCheckTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ArgsEqualityCheckTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded args are returned as hex or bytes.
 * @returns The decoded ArgsEqualityCheckTerms object.
 */
export function decodeArgsEqualityCheckTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ArgsEqualityCheckTerms<DecodedBytesLike<'hex'>>
  | ArgsEqualityCheckTerms<DecodedBytesLike<'bytes'>> {
  const argsHex = bytesLikeToHex(terms);
  const args = prepareResult(argsHex, encodingOptions);
  return { args } as
    | ArgsEqualityCheckTerms<DecodedBytesLike<'hex'>>
    | ArgsEqualityCheckTerms<DecodedBytesLike<'bytes'>>;
}
