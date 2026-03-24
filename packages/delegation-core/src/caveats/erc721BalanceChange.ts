/**
 * ## ERC721BalanceChangeEnforcer
 *
 * Constrains ERC-721 balance (id count) change for a recipient.
 *
 * Terms are encoded as 1-byte direction (`0x00` = minimum increase, any non-zero e.g. `0x01` = maximum decrease), 20-byte token address, 20-byte recipient, then 32-byte big-endian amount.
 */

import type { BytesLike } from '@metamask/utils';

import {
  concatHex,
  extractAddress,
  extractBigInt,
  extractNumber,
  normalizeAddressLowercase,
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
import { BalanceChangeType } from './types';

/**
 * Terms for configuring an ERC721BalanceChange caveat.
 */
export type ERC721BalanceChangeTerms<TBytesLike extends BytesLike = BytesLike> =
  {
    /** The ERC-721 token address. */
    tokenAddress: TBytesLike;
    /** The recipient address. */
    recipient: TBytesLike;
    /** The balance change amount. */
    amount: bigint;
    /** The balance change type. */
    changeType: number;
  };

/**
 * Creates terms for an ERC721BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC721BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any parameter is invalid.
 */
export function createERC721BalanceChangeTerms(
  terms: ERC721BalanceChangeTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC721BalanceChangeTerms(
  terms: ERC721BalanceChangeTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC721BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC721BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any parameter is invalid.
 */
export function createERC721BalanceChangeTerms(
  terms: ERC721BalanceChangeTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const {
    tokenAddress,
    recipient,
    amount,
    changeType: changeTypeNumber,
  } = terms;

  const tokenAddressHex = normalizeAddressLowercase(
    tokenAddress,
    'Invalid tokenAddress: must be a valid address',
  );
  const recipientHex = normalizeAddressLowercase(
    recipient,
    'Invalid recipient: must be a valid address',
  );

  if (amount <= 0n) {
    throw new Error('Invalid balance: must be a positive number');
  }

  const changeType = changeTypeNumber as BalanceChangeType;

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const changeTypeHex = `0x${toHexString({ value: changeType, size: 1 })}`;
  const amountHex = `0x${toHexString({ value: amount, size: 32 })}`;
  const hexValue = concatHex([
    changeTypeHex,
    tokenAddressHex,
    recipientHex,
    amountHex,
  ]);

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ERC721BalanceChange caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses are returned as hex or bytes.
 * @returns The decoded ERC721BalanceChangeTerms object.
 */
export function decodeERC721BalanceChangeTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ERC721BalanceChangeTerms<DecodedBytesLike<'hex'>>;
export function decodeERC721BalanceChangeTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ERC721BalanceChangeTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses are returned as hex or bytes.
 * @returns The decoded ERC721BalanceChangeTerms object.
 */
export function decodeERC721BalanceChangeTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ERC721BalanceChangeTerms<DecodedBytesLike<'hex'>>
  | ERC721BalanceChangeTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const changeType = extractNumber(hexTerms, 0, 1);
  const tokenAddressHex = extractAddress(hexTerms, 1);
  const recipientHex = extractAddress(hexTerms, 21);
  const amount = extractBigInt(hexTerms, 41, 32);

  return {
    changeType,
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    recipient: prepareResult(recipientHex, encodingOptions),
    amount,
  } as
    | ERC721BalanceChangeTerms<DecodedBytesLike<'hex'>>
    | ERC721BalanceChangeTerms<DecodedBytesLike<'bytes'>>;
}
