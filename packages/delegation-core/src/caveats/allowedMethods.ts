import { bytesToHex, isHexString, type BytesLike } from '@metamask/utils';

import { concatHex } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an AllowedMethods caveat.
 */
export type AllowedMethodsTerms = {
  /** An array of 4-byte method selectors that the delegate is allowed to call. */
  selectors: BytesLike[];
};

const FUNCTION_SELECTOR_STRING_LENGTH = 10; // 0x + 8 hex chars
const INVALID_SELECTOR_ERROR =
  'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction';

/**
 * Creates terms for an AllowedMethods caveat that restricts calls to a set of method selectors.
 *
 * @param terms - The terms for the AllowedMethods caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated method selectors.
 * @throws Error if the selectors array is empty or contains invalid selectors.
 */
export function createAllowedMethodsTerms(
  terms: AllowedMethodsTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createAllowedMethodsTerms(
  terms: AllowedMethodsTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an AllowedMethods caveat that restricts calls to a set of method selectors.
 *
 * @param terms - The terms for the AllowedMethods caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated method selectors.
 * @throws Error if the selectors array is empty or contains invalid selectors.
 */
export function createAllowedMethodsTerms(
  terms: AllowedMethodsTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { selectors } = terms;

  if (!selectors || selectors.length === 0) {
    throw new Error('Invalid selectors: must provide at least one selector');
  }

  const normalizedSelectors = selectors.map((selector) => {
    if (typeof selector === 'string') {
      if (
        isHexString(selector) &&
        selector.length === FUNCTION_SELECTOR_STRING_LENGTH
      ) {
        return selector;
      }
      throw new Error(INVALID_SELECTOR_ERROR);
    }

    if (selector.length !== 4) {
      throw new Error(INVALID_SELECTOR_ERROR);
    }

    return bytesToHex(selector);
  });

  const hexValue = concatHex(normalizedSelectors);
  return prepareResult(hexValue, encodingOptions);
}
