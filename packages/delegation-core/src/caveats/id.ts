/**
 * ## IdEnforcer
 *
 * Ensures each delegation redemption uses a unique numeric id.
 *
 * Terms are encoded as a single 32-byte big-endian uint256 id.
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for an Id caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded IdTerms object.
 */
export function decodeIdTerms(terms: BytesLike): IdTerms {
  const hexTerms = bytesLikeToHex(terms);
  assertHexByteExactLength(
    hexTerms,
    32,
    'Invalid Id terms: must be exactly 32 bytes',
  );
  const id = extractBigInt(hexTerms, 0, 32);
  return { id };
}
