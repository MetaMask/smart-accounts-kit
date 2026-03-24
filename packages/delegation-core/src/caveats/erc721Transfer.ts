/**
 * ## ERC721TransferEnforcer
 *
 * Constrains transfer of a specific ERC-721 token id for a collection.
 *
 * Terms are encoded as 20-byte token address followed by a 32-byte big-endian uint256 token id.
 */

import type { BytesLike } from '@metamask/utils';

import {
  concatHex,
  extractAddress,
  extractBigInt,
  normalizeAddress,
  toHexString,
} from '../internalUtils';
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
 * Terms for configuring an ERC721Transfer caveat.
 */
export type ERC721TransferTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The ERC-721 token address. */
  tokenAddress: TBytesLike;
  /** The token id. */
  tokenId: bigint;
};

/**
 * Creates terms for an ERC721Transfer caveat that restricts transfers to a token and id.
 *
 * @param terms - The terms for the ERC721Transfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the token address is invalid or tokenId is negative.
 */
export function createERC721TransferTerms(
  terms: ERC721TransferTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC721TransferTerms(
  terms: ERC721TransferTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC721Transfer caveat that restricts transfers to a token and id.
 *
 * @param terms - The terms for the ERC721Transfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the token address is invalid or tokenId is negative.
 */
export function createERC721TransferTerms(
  terms: ERC721TransferTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, tokenId } = terms;

  const tokenAddressHex = normalizeAddress(
    tokenAddress,
    'Invalid tokenAddress: must be a valid address',
  );

  if (tokenId < 0n) {
    throw new Error('Invalid tokenId: must be a non-negative number');
  }

  const tokenIdHex = `0x${toHexString({ value: tokenId, size: 32 })}`;
  const hexValue = concatHex([tokenAddressHex, tokenIdHex]);

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ERC721Transfer caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC721TransferTerms object.
 */
export function decodeERC721TransferTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ERC721TransferTerms<DecodedBytesLike<'hex'>>;
export function decodeERC721TransferTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ERC721TransferTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC721TransferTerms object.
 */
export function decodeERC721TransferTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ERC721TransferTerms<DecodedBytesLike<'hex'>>
  | ERC721TransferTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const tokenAddressHex = extractAddress(hexTerms, 0);
  const tokenId = extractBigInt(hexTerms, 20, 32);

  return {
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    tokenId,
  } as
    | ERC721TransferTerms<DecodedBytesLike<'hex'>>
    | ERC721TransferTerms<DecodedBytesLike<'bytes'>>;
}
