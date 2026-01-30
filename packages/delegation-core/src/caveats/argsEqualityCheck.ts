import type { BytesLike } from '@metamask/utils';

import { normalizeHex } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ArgsEqualityCheck caveat.
 */
export type ArgsEqualityCheckTerms = {
  /** The expected args that must match exactly when redeeming the delegation. */
  args: BytesLike;
};

/**
 * Creates terms for an ArgsEqualityCheck caveat that requires exact args matching.
 *
 * @param terms - The terms for the ArgsEqualityCheck caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as the args themselves.
 * @throws Error if args is not a valid hex string.
 */
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ArgsEqualityCheck caveat that requires exact args matching.
 *
 * @param terms - The terms for the ArgsEqualityCheck caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as the args themselves.
 * @throws Error if args is not a valid hex string.
 */
export function createArgsEqualityCheckTerms(
  terms: ArgsEqualityCheckTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { args } = terms;

  if (typeof args === 'string' && args === '0x') {
    return prepareResult(args, encodingOptions);
  }

  const hexValue = normalizeHex(
    args,
    'Invalid config: args must be a valid hex string',
  );

  return prepareResult(hexValue, encodingOptions);
}
