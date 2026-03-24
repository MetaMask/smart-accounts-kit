/**
 * ## AllowedTargetsEnforcer
 *
 * Restricts which contract addresses the delegate may call.
 *
 * Terms are encoded as the concatenation of 20-byte addresses in order with no padding between addresses.
 */

import type { BytesLike } from '@metamask/utils';

import { concatHex, extractAddress, normalizeAddress } from '../internalUtils';
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
 * Terms for configuring an AllowedTargets caveat.
 */
export type AllowedTargetsTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** An array of target addresses that the delegate is allowed to call. */
  targets: TBytesLike[];
};

/**
 * Creates terms for an AllowedTargets caveat that restricts calls to a set of target addresses.
 *
 * @param terms - The terms for the AllowedTargets caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the targets array is empty or contains invalid addresses.
 */
export function createAllowedTargetsTerms(
  terms: AllowedTargetsTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createAllowedTargetsTerms(
  terms: AllowedTargetsTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an AllowedTargets caveat that restricts calls to a set of target addresses.
 *
 * @param terms - The terms for the AllowedTargets caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the targets array is empty or contains invalid addresses.
 */
export function createAllowedTargetsTerms(
  terms: AllowedTargetsTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { targets } = terms;

  if (!targets || targets.length === 0) {
    throw new Error(
      'Invalid targets: must provide at least one target address',
    );
  }

  const normalizedTargets = targets.map((target) =>
    normalizeAddress(target, 'Invalid targets: must be valid addresses'),
  );

  const hexValue = concatHex(normalizedTargets);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an AllowedTargets caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses are returned as hex or bytes.
 * @returns The decoded AllowedTargetsTerms object.
 */
export function decodeAllowedTargetsTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): AllowedTargetsTerms<DecodedBytesLike<'hex'>>;
export function decodeAllowedTargetsTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): AllowedTargetsTerms<DecodedBytesLike<'bytes'>>;
/**
 *
 * @param terms
 * @param encodingOptions
 */
export function decodeAllowedTargetsTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | AllowedTargetsTerms<DecodedBytesLike<'hex'>>
  | AllowedTargetsTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const addressSize = 20;
  const totalBytes = (hexTerms.length - 2) / 2; // Remove '0x' and divide by 2
  const addressCount = totalBytes / addressSize;

  const targets: (Hex | Uint8Array)[] = [];
  for (let i = 0; i < addressCount; i++) {
    const target = extractAddress(hexTerms, i * addressSize);
    targets.push(prepareResult(target, encodingOptions));
  }

  return { targets } as
    | AllowedTargetsTerms<DecodedBytesLike<'hex'>>
    | AllowedTargetsTerms<DecodedBytesLike<'bytes'>>;
}
