import type { BytesLike } from '@metamask/utils';

import { concatHex, normalizeAddress, toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ERC721Transfer caveat.
 */
export type ERC721TransferTerms = {
  /** The ERC-721 token address. */
  tokenAddress: BytesLike;
  /** The token id. */
  tokenId: bigint;
};

/**
 * Creates terms for an ERC721Transfer caveat that restricts transfers to a token and id.
 *
 * @param terms - The terms for the ERC721Transfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as tokenAddress + tokenId.
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
 * @returns The terms as tokenAddress + tokenId.
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
