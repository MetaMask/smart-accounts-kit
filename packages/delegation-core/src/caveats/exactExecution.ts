import { bytesToHex, type BytesLike } from '@metamask/utils';

import { concatHex, normalizeAddress, toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ExactExecution caveat.
 */
export type ExactExecutionTerms = {
  /** The execution that must be matched exactly. */
  execution: {
    target: BytesLike;
    value: bigint;
    callData: BytesLike;
  };
};

/**
 * Creates terms for an ExactExecution caveat that matches a single execution.
 *
 * @param terms - The terms for the ExactExecution caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated target + value + calldata.
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
 * @returns The terms as concatenated target + value + calldata.
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
