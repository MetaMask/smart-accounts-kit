import type { BytesLike } from '@metamask/utils';

import { concatHex, normalizeAddress } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a Redeemer caveat.
 */
export type RedeemerTerms = {
  /** An array of addresses allowed to redeem the delegation. */
  redeemers: BytesLike[];
};

/**
 * Creates terms for a Redeemer caveat that restricts who may redeem.
 *
 * @param terms - The terms for the Redeemer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated redeemer addresses.
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
 * @returns The terms as concatenated redeemer addresses.
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
