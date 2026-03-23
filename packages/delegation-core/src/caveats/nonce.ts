import { isHexString } from '@metamask/utils';
import type { BytesLike } from '@metamask/utils';

import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

// char length of 32 byte hex string (including 0x prefix)
const MAX_NONCE_STRING_LENGTH = 66;

/**
 * Terms for configuring a Nonce caveat.
 */
export type NonceTerms = {
  /** The nonce as BytesLike (0x-prefixed hex string or Uint8Array) to allow bulk revocation of delegations. */
  nonce: BytesLike;
};

/**
 * Creates terms for a Nonce caveat that uses a nonce value for bulk revocation of delegations.
 *
 * @param terms - The terms for the Nonce caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte hex string.
 * @throws Error if the nonce is invalid.
 */
export function createNonceTerms(
  terms: NonceTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNonceTerms(
  terms: NonceTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a Nonce caveat that uses a nonce value for bulk revocation of delegations.
 *
 * @param terms - The terms for the Nonce caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as a 32-byte padded value in the specified encoding format.
 * @throws Error if the nonce is invalid or empty.
 */
export function createNonceTerms(
  terms: NonceTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { nonce } = terms;

  // Handle zero-length Uint8Array specifically
  if (nonce instanceof Uint8Array && nonce.length === 0) {
    throw new Error('Invalid nonce: Uint8Array must not be empty');
  }

  // Validate that strings have 0x prefix (as required by BytesLike)
  if (typeof nonce === 'string' && !nonce.startsWith('0x')) {
    throw new Error('Invalid nonce: string must have 0x prefix');
  }

  // Convert to hex string for consistent processing
  const hexNonce = bytesLikeToHex(nonce);

  // Check for empty hex string (0x) first - more specific error
  if (hexNonce === '0x') {
    throw new Error('Invalid nonce: must not be empty');
  }

  if (!isHexString(hexNonce)) {
    throw new Error('Invalid nonce: must be a valid BytesLike value');
  }

  if (hexNonce.length > MAX_NONCE_STRING_LENGTH) {
    throw new Error('Invalid nonce: must be 32 bytes or less in length');
  }

  // Remove '0x' prefix for padding, then add it back
  const nonceWithoutPrefix = hexNonce.slice(2);
  const paddedNonce = nonceWithoutPrefix.padStart(64, '0'); // 64 hex chars = 32 bytes
  const hexValue = `0x${paddedNonce}`;

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a Nonce caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded NonceTerms object.
 */
export function decodeNonceTerms(terms: BytesLike): NonceTerms {
  const hexTerms = bytesLikeToHex(terms);

  // The nonce is stored as a 32-byte padded value
  // We return it as-is (padded) to maintain consistency
  const nonce = hexTerms;

  return { nonce };
}
