/**
 * ## AllowedMethodsEnforcer
 *
 * Specifies 4 byte method selectors that the delegate is allowed to call.
 *
 * Terms are encoded as a concatenation of 4-byte function selectors with no padding between selectors.
 */

import { bytesToHex, isHexString, type BytesLike } from '@metamask/utils';

import {
  assertHexByteLengthAtLeastOneMultipleOf,
  concatHex,
  extractHex,
  getByteLength,
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
 * Terms for configuring an AllowedMethods caveat.
 */
export type AllowedMethodsTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** An array of 4-byte method selectors that the delegate is allowed to call. */
  selectors: TBytesLike[];
};

const FUNCTION_SELECTOR_STRING_LENGTH = 10; // 0x + 8 hex chars
const INVALID_SELECTOR_ERROR =
  'Invalid selector: must be a 4 byte hex string, abi function signature, or AbiFunction';

/**
 * Creates terms for an AllowedMethods caveat that restricts calls to a set of method selectors.
 *
 * @param terms - The terms for the AllowedMethods caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for an AllowedMethods caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded selector values are returned as hex or bytes.
 * @returns The decoded AllowedMethodsTerms object.
 */
export function decodeAllowedMethodsTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): AllowedMethodsTerms<DecodedBytesLike<'hex'>>;
export function decodeAllowedMethodsTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): AllowedMethodsTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded selector values are returned as hex or bytes.
 * @returns The decoded AllowedMethodsTerms object.
 */
export function decodeAllowedMethodsTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | AllowedMethodsTerms<DecodedBytesLike<'hex'>>
  | AllowedMethodsTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const selectorSize = 4;
  assertHexByteLengthAtLeastOneMultipleOf(
    hexTerms,
    selectorSize,
    'Invalid selectors: must be a multiple of 4',
  );
  const selectorCount = getByteLength(hexTerms) / selectorSize;

  const selectors: (Hex | Uint8Array)[] = [];
  for (let i = 0; i < selectorCount; i++) {
    const selector = extractHex(hexTerms, i * selectorSize, selectorSize);
    selectors.push(prepareResult(selector, encodingOptions));
  }

  return { selectors } as
    | AllowedMethodsTerms<DecodedBytesLike<'hex'>>
    | AllowedMethodsTerms<DecodedBytesLike<'bytes'>>;
}
