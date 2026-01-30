import type { BytesLike } from '@metamask/utils';

import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ExactCalldata caveat.
 */
export type ExactCalldataTerms = {
  /** The expected calldata to match against. */
  calldata: BytesLike;
};

/**
 * Creates terms for an ExactCalldata caveat that ensures the provided execution calldata
 * matches exactly the expected calldata.
 *
 * @param terms - The terms for the ExactCalldata caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as the calldata itself.
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
 * @returns The terms as the calldata itself.
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

  // For exact calldata, the terms are simply the expected calldata
  return prepareResult(calldata, encodingOptions);
}
