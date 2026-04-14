/**
 * ## ExactCalldataEnforcer
 *
 * Requires the full execution calldata to match exactly.
 *
 * Terms are encoded as the calldata bytes only with no additional encoding.
 */

import type { BytesLike } from '@metamask/utils';

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
 * Terms for configuring an ExactCalldata caveat.
 */
export type ExactCalldataTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The expected calldata to match against. */
  calldata: TBytesLike;
};

/**
 * Creates terms for an ExactCalldata caveat that ensures the provided execution calldata
 * matches exactly the expected calldata.
 *
 * @param terms - The terms for the ExactCalldata caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the `calldata` is invalid.
 */
export function createExactCalldataTerms(
  terms: ExactCalldataTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createExactCalldataTerms(
  terms: ExactCalldataTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ExactCalldata caveat that ensures the provided execution calldata
 * matches exactly the expected calldata.
 *
 * @param terms - The terms for the ExactCalldata caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the `calldata` is invalid.
 */
export function createExactCalldataTerms(
  terms: ExactCalldataTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { calldata } = terms;

  if (calldata === undefined || calldata === null) {
    throw new Error('Invalid calldata: calldata is required');
  }

  if (typeof calldata === 'string' && !calldata.startsWith('0x')) {
    throw new Error('Invalid calldata: must be a hex string starting with 0x');
  }

  return prepareResult(calldata, encodingOptions);
}

/**
 * Decodes terms for an ExactCalldata caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded calldata is returned as hex or bytes.
 * @returns The decoded ExactCalldataTerms object.
 */
export function decodeExactCalldataTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ExactCalldataTerms<DecodedBytesLike<'hex'>>;
export function decodeExactCalldataTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ExactCalldataTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded calldata is returned as hex or bytes.
 * @returns The decoded ExactCalldataTerms object.
 */
export function decodeExactCalldataTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ExactCalldataTerms<DecodedBytesLike<'hex'>>
  | ExactCalldataTerms<DecodedBytesLike<'bytes'>> {
  const calldataHex = bytesLikeToHex(terms);
  const calldata = prepareResult(calldataHex, encodingOptions);
  return { calldata } as
    | ExactCalldataTerms<DecodedBytesLike<'hex'>>
    | ExactCalldataTerms<DecodedBytesLike<'bytes'>>;
}
