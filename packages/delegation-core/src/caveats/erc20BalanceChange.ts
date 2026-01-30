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
 * Terms for configuring an ERC20BalanceChange caveat.
 */
export type ERC20BalanceChangeTerms = {
  /** The ERC-20 token address. */
  tokenAddress: BytesLike;
  /** The recipient address. */
  recipient: BytesLike;
  /** The balance change amount. */
  balance: bigint;
  /** The balance change type. */
  changeType: number;
};

/**
 * Creates terms for an ERC20BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC20BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as changeType + tokenAddress + recipient + balance.
 * @throws Error if any parameter is invalid.
 */
export function createERC20BalanceChangeTerms(
  terms: ERC20BalanceChangeTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC20BalanceChangeTerms(
  terms: ERC20BalanceChangeTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC20BalanceChange caveat that checks token balance changes.
 *
 * @param terms - The terms for the ERC20BalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as changeType + tokenAddress + recipient + balance.
 * @throws Error if any parameter is invalid.
 */
export function createERC20BalanceChangeTerms(
  terms: ERC20BalanceChangeTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const {
    tokenAddress,
    recipient,
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

  const changeType = changeTypeNumber as BalanceChangeType;

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const changeTypeHex = `0x${toHexString({ value: changeType, size: 1 })}`;
  const balanceHex = `0x${toHexString({ value: balance, size: 32 })}`;
  const hexValue = concatHex([
    changeTypeHex,
    tokenAddressHex,
    recipientHex,
    balanceHex,
  ]);

  return prepareResult(hexValue, encodingOptions);
}
