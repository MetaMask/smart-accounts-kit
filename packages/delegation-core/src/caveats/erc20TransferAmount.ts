/**
 * ## ERC20TransferAmountEnforcer
 *
 * Limits the amount of a given ERC-20 token that may be transferred.
 *
 * Terms are encoded as 20-byte token address followed by a 32-byte big-endian uint256 max amount.
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
 * Terms for configuring an ERC20TransferAmount caveat.
 */
export type ERC20TransferAmountTerms<TBytesLike extends BytesLike = BytesLike> =
  {
    /** The ERC-20 token address. */
    tokenAddress: TBytesLike;
    /** The maximum amount of tokens that can be transferred. */
    maxAmount: bigint;
  };

/**
 * Creates terms for an ERC20TransferAmount caveat that caps transfer amount.
 *
 * @param terms - The terms for the ERC20TransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the token address is invalid or maxAmount is not positive.
 */
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC20TransferAmount caveat that caps transfer amount.
 *
 * @param terms - The terms for the ERC20TransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the token address is invalid or maxAmount is not positive.
 */
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, maxAmount } = terms;

  const tokenAddressHex = normalizeAddress(
    tokenAddress,
    'Invalid tokenAddress: must be a valid address',
  );

  if (maxAmount <= 0n) {
    throw new Error('Invalid maxAmount: must be a positive number');
  }

  const maxAmountHex = `0x${toHexString({ value: maxAmount, size: 32 })}`;
  const hexValue = concatHex([tokenAddressHex, maxAmountHex]);

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ERC20TransferAmount caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token address is returned as hex or bytes.
 * @returns The decoded ERC20TransferAmountTerms object.
 */
export function decodeERC20TransferAmountTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ERC20TransferAmountTerms<DecodedBytesLike<'hex'>>;
export function decodeERC20TransferAmountTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ERC20TransferAmountTerms<DecodedBytesLike<'bytes'>>;
/**
 *
 * @param terms
 * @param encodingOptions
 */
export function decodeERC20TransferAmountTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ERC20TransferAmountTerms<DecodedBytesLike<'hex'>>
  | ERC20TransferAmountTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const tokenAddressHex = extractAddress(hexTerms, 0);
  const maxAmount = extractBigInt(hexTerms, 20, 32);

  return {
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    maxAmount,
  } as
    | ERC20TransferAmountTerms<DecodedBytesLike<'hex'>>
    | ERC20TransferAmountTerms<DecodedBytesLike<'bytes'>>;
}
