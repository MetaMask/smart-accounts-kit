/**
 * ## ERC1155BalanceChangeEnforcer
 *
 * Constrains ERC-1155 balance change for a token id and recipient.
 *
 * Terms are encoded as 1-byte change type, 20-byte token and recipient (normalized lowercase), then two 32-byte big-endian uint256 words: token id and balance.
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
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';
import { BalanceChangeType } from './types';

/**
 * Terms for configuring an ERC1155BalanceChange caveat.
 */
export type ERC1155BalanceChangeTerms = {
  /** The ERC-1155 token address. */
  tokenAddress: BytesLike;
  /** The recipient address. */
  recipient: BytesLike;
  /** The token id. */
  tokenId: bigint;
  /** The balance change amount. */
  balance: bigint;
  /** The balance change type. */
  changeType: number;
};

/**
 * Creates terms for an ERC1155BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC1155BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any parameter is invalid.
 */
export function createERC1155BalanceChangeTerms(
  terms: ERC1155BalanceChangeTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC1155BalanceChangeTerms(
  terms: ERC1155BalanceChangeTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC1155BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC1155BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any parameter is invalid.
 */
export function createERC1155BalanceChangeTerms(
  terms: ERC1155BalanceChangeTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const {
    tokenAddress,
    recipient,
    tokenId,
    balance,
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

  if (balance <= 0n) {
    throw new Error('Invalid balance: must be a positive number');
  }

  if (tokenId < 0n) {
    throw new Error('Invalid tokenId: must be a non-negative number');
  }

  const changeType = changeTypeNumber as BalanceChangeType;

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const changeTypeHex = `0x${toHexString({ value: changeType, size: 1 })}`;
  const tokenIdHex = `0x${toHexString({ value: tokenId, size: 32 })}`;
  const balanceHex = `0x${toHexString({ value: balance, size: 32 })}`;
  const hexValue = concatHex([
    changeTypeHex,
    tokenAddressHex,
    recipientHex,
    tokenIdHex,
    balanceHex,
  ]);

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ERC1155BalanceChange caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded ERC1155BalanceChangeTerms object.
 */
export function decodeERC1155BalanceChangeTerms(
  terms: BytesLike,
): ERC1155BalanceChangeTerms {
  const hexTerms = bytesLikeToHex(terms);

  const changeType = extractNumber(hexTerms, 0, 1);
  const tokenAddress = extractAddress(hexTerms, 1);
  const recipient = extractAddress(hexTerms, 21);
  const tokenId = extractBigInt(hexTerms, 41, 32);
  const balance = extractBigInt(hexTerms, 73, 32);

  return { changeType, tokenAddress, recipient, tokenId, balance };
}
