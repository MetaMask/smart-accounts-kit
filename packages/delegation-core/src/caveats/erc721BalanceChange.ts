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
 * Terms for configuring an ERC721BalanceChange caveat.
 */
export type ERC721BalanceChangeTerms = {
  /** The ERC-721 token address. */
  tokenAddress: BytesLike;
  /** The recipient address. */
  recipient: BytesLike;
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
 * @returns The terms as changeType + tokenAddress + recipient + amount.
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
 * @returns The terms as changeType + tokenAddress + recipient + amount.
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
