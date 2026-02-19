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
 * Terms for configuring a NativeBalanceChange caveat.
 */
export type NativeBalanceChangeTerms = {
  /** The recipient address. */
  recipient: BytesLike;
  /** The balance change amount. */
  balance: bigint;
  /** The balance change type. */
  changeType: number;
};

/**
 * Creates terms for a NativeBalanceChange caveat that checks recipient balance changes.
 *
 * @param terms - The terms for the NativeBalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as changeType + recipient + balance.
 * @throws Error if the recipient address is invalid or balance/changeType are invalid.
 */
export function createNativeBalanceChangeTerms(
  terms: NativeBalanceChangeTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNativeBalanceChangeTerms(
  terms: NativeBalanceChangeTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a NativeBalanceChange caveat that checks recipient balance changes.
 *
 * @param terms - The terms for the NativeBalanceChange caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as changeType + recipient + balance.
 * @throws Error if the recipient address is invalid or balance/changeType are invalid.
 */
export function createNativeBalanceChangeTerms(
  terms: NativeBalanceChangeTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { recipient, balance, changeType: changeTypeNumber } = terms;

  const recipientHex = normalizeAddressLowercase(
    recipient,
    'Invalid recipient: must be a valid Address',
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
  const hexValue = concatHex([changeTypeHex, recipientHex, balanceHex]);

  return prepareResult(hexValue, encodingOptions);
}
