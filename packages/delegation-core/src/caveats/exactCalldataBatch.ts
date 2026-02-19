import { encodeSingle } from '@metamask/abi-utils';
import { bytesToHex, type BytesLike } from '@metamask/utils';

import { normalizeAddress } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ExactCalldataBatch caveat.
 */
export type ExactCalldataBatchTerms = {
  /** The executions that must be matched exactly in the batch. */
  executions: {
    target: BytesLike;
    value: bigint;
    callData: BytesLike;
  }[];
};

const EXECUTION_ARRAY_ABI = '(address,uint256,bytes)[]';

/**
 * Creates terms for an ExactCalldataBatch caveat that matches a batch of executions.
 *
 * @param terms - The terms for the ExactCalldataBatch caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as ABI-encoded execution array.
 * @throws Error if any execution parameters are invalid.
 */
export function createExactCalldataBatchTerms(
  terms: ExactCalldataBatchTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createExactCalldataBatchTerms(
  terms: ExactCalldataBatchTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ExactCalldataBatch caveat that matches a batch of executions.
 *
 * @param terms - The terms for the ExactCalldataBatch caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as ABI-encoded execution array.
 * @throws Error if any execution parameters are invalid.
 */
export function createExactCalldataBatchTerms(
  terms: ExactCalldataBatchTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { executions } = terms;

  if (executions.length === 0) {
    throw new Error('Invalid executions: array cannot be empty');
  }

  const encodableExecutions = executions.map((execution) => {
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

    return [targetHex, execution.value, callDataHex];
  });

  const hexValue = encodeSingle(EXECUTION_ARRAY_ABI, encodableExecutions);
  return prepareResult(hexValue, encodingOptions);
}
