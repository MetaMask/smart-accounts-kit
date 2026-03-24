/**
 * ## NativeBalanceChangeEnforcer
 *
 * Constrains native balance change for a recipient relative to a reference balance.
 *
 * Terms are encoded as 1-byte change type, 20-byte recipient (normalized lowercase), then 32-byte big-endian balance in wei.
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a NativeBalanceChange caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded NativeBalanceChangeTerms object.
 */
export function decodeNativeBalanceChangeTerms(
  terms: BytesLike,
): NativeBalanceChangeTerms {
  const hexTerms = bytesLikeToHex(terms);

  const changeType = extractNumber(hexTerms, 0, 1);
  const recipient = extractAddress(hexTerms, 1);
  const balance = extractBigInt(hexTerms, 21, 32);

  return { changeType, recipient, balance };
}
