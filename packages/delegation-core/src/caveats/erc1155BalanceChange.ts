import type { BytesLike } from '@metamask/utils';

import {
  concatHex,
  normalizeAddressLowercase,
  toHexString,
} from '../internalUtils';
import {
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
 * @returns The terms as changeType + tokenAddress + recipient + tokenId + balance.
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
 * @returns The terms as changeType + tokenAddress + recipient + tokenId + balance.
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
