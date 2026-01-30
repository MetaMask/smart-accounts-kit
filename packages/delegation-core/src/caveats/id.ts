import { toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

const MAX_UINT256 = BigInt(`0x${'f'.repeat(64)}`);

/**
 * Terms for configuring an Id caveat.
 */
export type IdTerms = {
  /** An id for the delegation. Only one delegation may be redeemed with any given id. */
  id: bigint | number;
};

/**
 * Creates terms for an Id caveat that restricts delegations by unique identifier.
 *
 * @param terms - The terms for the Id caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the id is invalid or out of range.
 */
export function createIdTerms(
  terms: IdTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createIdTerms(
  terms: IdTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an Id caveat that restricts delegations by unique identifier.
 *
 * @param terms - The terms for the Id caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the id is invalid or out of range.
 */
export function createIdTerms(
  terms: IdTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { id } = terms;

  let idBigInt: bigint;

  if (typeof id === 'number') {
    if (!Number.isInteger(id)) {
      throw new Error('Invalid id: must be an integer');
    }
    idBigInt = BigInt(id);
  } else if (typeof id === 'bigint') {
    idBigInt = id;
  } else {
    throw new Error('Invalid id: must be a bigint or number');
  }

  if (idBigInt < 0n) {
    throw new Error('Invalid id: must be a non-negative number');
  }

  if (idBigInt > MAX_UINT256) {
    throw new Error('Invalid id: must be less than 2^256');
  }

  const hexValue = `0x${toHexString({ value: idBigInt, size: 32 })}`;
  return prepareResult(hexValue, encodingOptions);
}
