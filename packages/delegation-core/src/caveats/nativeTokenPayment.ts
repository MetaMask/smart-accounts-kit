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

/**
 * Terms for configuring a NativeTokenPayment caveat.
 */
export type NativeTokenPaymentTerms = {
  /** The recipient address. */
  recipient: BytesLike;
  /** The amount that must be paid. */
  amount: bigint;
};

/**
 * Creates terms for a NativeTokenPayment caveat that requires a payment to a recipient.
 *
 * @param terms - The terms for the NativeTokenPayment caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as recipient + amount.
 * @throws Error if the recipient address is invalid or amount is not positive.
 */
export function createNativeTokenPaymentTerms(
  terms: NativeTokenPaymentTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createNativeTokenPaymentTerms(
  terms: NativeTokenPaymentTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a NativeTokenPayment caveat that requires a payment to a recipient.
 *
 * @param terms - The terms for the NativeTokenPayment caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as recipient + amount.
 * @throws Error if the recipient address is invalid or amount is not positive.
 */
export function createNativeTokenPaymentTerms(
  terms: NativeTokenPaymentTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { recipient, amount } = terms;

  const recipientHex = normalizeAddressLowercase(
    recipient,
    'Invalid recipient: must be a valid address',
  );

  if (amount <= 0n) {
    throw new Error('Invalid amount: must be positive');
  }

  const amountHex = `0x${toHexString({ value: amount, size: 32 })}`;
  const hexValue = concatHex([recipientHex, amountHex]);

  return prepareResult(hexValue, encodingOptions);
}
