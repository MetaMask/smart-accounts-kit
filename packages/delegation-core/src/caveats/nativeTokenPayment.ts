/**
 * ## NativeTokenPaymentEnforcer
 *
 * Requires a fixed native token payment to a recipient.
 *
 * Terms are encoded as 20-byte recipient followed by a 32-byte big-endian uint256 amount in wei.
 */

import type { BytesLike } from '@metamask/utils';

import {
  concatHex,
  extractAddress,
  extractBigInt,
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

/**
 * Terms for configuring a NativeTokenPayment caveat.
 */
export type NativeTokenPaymentTerms<TBytesLike extends BytesLike = BytesLike> =
  {
    /** The recipient address. */
    recipient: TBytesLike;
    /** The amount that must be paid. */
    amount: bigint;
  };

/**
 * Creates terms for a NativeTokenPayment caveat that requires a payment to a recipient.
 *
 * @param terms - The terms for the NativeTokenPayment caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a NativeTokenPayment caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded recipient is returned as hex or bytes.
 * @returns The decoded NativeTokenPaymentTerms object.
 */
export function decodeNativeTokenPaymentTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): NativeTokenPaymentTerms<DecodedBytesLike<'hex'>>;
export function decodeNativeTokenPaymentTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): NativeTokenPaymentTerms<DecodedBytesLike<'bytes'>>;
/**
 *
 * @param terms
 * @param encodingOptions
 */
export function decodeNativeTokenPaymentTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | NativeTokenPaymentTerms<DecodedBytesLike<'hex'>>
  | NativeTokenPaymentTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const recipientHex = extractAddress(hexTerms, 0);
  const amount = extractBigInt(hexTerms, 20, 32);

  return {
    recipient: prepareResult(recipientHex, encodingOptions),
    amount,
  } as
    | NativeTokenPaymentTerms<DecodedBytesLike<'hex'>>
    | NativeTokenPaymentTerms<DecodedBytesLike<'bytes'>>;
}
