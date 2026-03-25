/**
 * ## ExactExecutionEnforcer
 *
 * Requires a single execution (target, value, calldata) to match exactly.
 *
 * Terms are encoded as 20-byte target, 32-byte big-endian value, then calldata bytes.
 */

import { bytesToHex, type BytesLike } from '@metamask/utils';

import {
  assertHexBytesMinLength,
  concatHex,
  extractAddress,
  extractBigInt,
  extractRemainingHex,
  normalizeAddress,
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
 * Terms for configuring an ExactExecution caveat.
 */
export type ExactExecutionTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The execution that must be matched exactly. */
  execution: {
    target: TBytesLike;
    value: bigint;
    callData: TBytesLike;
  };
};

/**
 * Creates terms for an ExactExecution caveat that matches a single execution.
 *
 * @param terms - The terms for the ExactExecution caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any execution parameters are invalid.
 */
export function createExactExecutionTerms(
  terms: ExactExecutionTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createExactExecutionTerms(
  terms: ExactExecutionTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ExactExecution caveat that matches a single execution.
 *
 * @param terms - The terms for the ExactExecution caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if any execution parameters are invalid.
 */
export function createExactExecutionTerms(
  terms: ExactExecutionTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { execution } = terms;

  const targetHex = normalizeAddress(
    execution.target,
    'Invalid target: must be a valid address',
  );

  if (execution.value < 0n) {
    throw new Error('Invalid value: must be a non-negative number');
  }

  let callDataHex: string;
  if (typeof execution.callData === 'string') {
    if (!execution.callData.startsWith('0x')) {
      throw new Error(
        'Invalid calldata: must be a hex string starting with 0x',
      );
    }
    callDataHex = execution.callData;
  } else {
    callDataHex = bytesToHex(execution.callData);
  }

  const valueHex = `0x${toHexString({ value: execution.value, size: 32 })}`;
  const hexValue = concatHex([targetHex, valueHex, callDataHex]);

  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for an ExactExecution caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded target and calldata are returned as hex or bytes.
 * @returns The decoded ExactExecutionTerms object.
 */
export function decodeExactExecutionTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): ExactExecutionTerms<DecodedBytesLike<'hex'>>;
export function decodeExactExecutionTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): ExactExecutionTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded target and calldata are returned as hex or bytes.
 * @returns The decoded ExactExecutionTerms object.
 */
export function decodeExactExecutionTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | ExactExecutionTerms<DecodedBytesLike<'hex'>>
  | ExactExecutionTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);
  assertHexBytesMinLength(
    hexTerms,
    52,
    'Invalid ExactExecution terms: must be at least 52 bytes',
  );

  const targetHex = extractAddress(hexTerms, 0);
  const value = extractBigInt(hexTerms, 20, 32);
  const callDataHex = extractRemainingHex(hexTerms, 52);

  return {
    execution: {
      target: prepareResult(targetHex, encodingOptions),
      value,
      callData: prepareResult(callDataHex, encodingOptions),
    },
  } as
    | ExactExecutionTerms<DecodedBytesLike<'hex'>>
    | ExactExecutionTerms<DecodedBytesLike<'bytes'>>;
}
