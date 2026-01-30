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
 * Terms for configuring an AllowedTargets caveat.
 */
export type AllowedTargetsTerms = {
  /** An array of target addresses that the delegate is allowed to call. */
  targets: BytesLike[];
};

/**
 * Creates terms for an AllowedTargets caveat that restricts calls to a set of target addresses.
 *
 * @param terms - The terms for the AllowedTargets caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated target addresses.
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
 * @returns The terms as concatenated target addresses.
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
