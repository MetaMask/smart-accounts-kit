/**
 * ## RedeemerEnforcer
 *
 * Restricts which addresses may redeem the delegation.
 *
 * Terms are encoded as the concatenation of 20-byte redeemer addresses in order with no padding between addresses.
 */

import type { BytesLike } from '@metamask/utils';

import {
  assertHexByteLengthAtLeastOneMultipleOf,
  concatHex,
  extractAddress,
  getByteLength,
  normalizeAddress,
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
 * Terms for configuring a Redeemer caveat.
 */
export type RedeemerTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** An array of addresses allowed to redeem the delegation. */
  redeemers: TBytesLike[];
};

/**
 * Creates terms for a Redeemer caveat that restricts who may redeem.
 *
 * @param terms - The terms for the Redeemer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the redeemers array is empty or contains invalid addresses.
 */
export function createRedeemerTerms(
  terms: RedeemerTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createRedeemerTerms(
  terms: RedeemerTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a Redeemer caveat that restricts who may redeem.
 *
 * @param terms - The terms for the Redeemer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the redeemers array is empty or contains invalid addresses.
 */
export function createRedeemerTerms(
  terms: RedeemerTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { redeemers } = terms;

  if (!redeemers || redeemers.length === 0) {
    throw new Error(
      'Invalid redeemers: must specify at least one redeemer address',
    );
  }

  const normalizedRedeemers = redeemers.map((redeemer) =>
    normalizeAddress(redeemer, 'Invalid redeemers: must be a valid address'),
  );

  const hexValue = concatHex(normalizedRedeemers);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a Redeemer caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses are returned as hex or bytes.
 * @returns The decoded RedeemerTerms object.
 */
export function decodeRedeemerTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): RedeemerTerms<DecodedBytesLike<'hex'>>;
export function decodeRedeemerTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): RedeemerTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses are returned as hex or bytes.
 * @returns The decoded RedeemerTerms object.
 */
export function decodeRedeemerTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | RedeemerTerms<DecodedBytesLike<'hex'>>
  | RedeemerTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const addressSize = 20;
  assertHexByteLengthAtLeastOneMultipleOf(
    hexTerms,
    addressSize,
    'Invalid redeemers: must be a multiple of 20',
  );
  const addressCount = getByteLength(hexTerms) / addressSize;

  const redeemers: (Hex | Uint8Array)[] = [];
  for (let i = 0; i < addressCount; i++) {
    const redeemer = extractAddress(hexTerms, i * addressSize);
    redeemers.push(prepareResult(redeemer, encodingOptions));
  }

  return { redeemers } as
    | RedeemerTerms<DecodedBytesLike<'hex'>>
    | RedeemerTerms<DecodedBytesLike<'bytes'>>;
}
