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

/**
 * Decodes terms for an ERC20BalanceChange caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded ERC20BalanceChangeTerms object.
 */
export function decodeERC20BalanceChangeTerms(
  terms: BytesLike,
): ERC20BalanceChangeTerms {
  const hexTerms = bytesLikeToHex(terms);

  // Structure: changeType (1 byte) + tokenAddress (20 bytes) + recipient (20 bytes) + balance (32 bytes)
  const changeType = extractNumber(hexTerms, 0, 1);
  const tokenAddress = extractAddress(hexTerms, 1);
  const recipient = extractAddress(hexTerms, 21);
  const balance = extractBigInt(hexTerms, 41, 32);

  return { changeType, tokenAddress, recipient, balance };
}
