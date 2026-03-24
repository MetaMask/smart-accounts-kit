/**
 * ## ExactCalldataBatchEnforcer
 *
 * Requires a batch of executions to match exactly on calldata and metadata.
 *
 * Terms are encoded as ABI-encoded (address,uint256,bytes)[].
 */

import { decodeSingle, encodeSingle } from '@metamask/abi-utils';
import { bytesToHex, type BytesLike } from '@metamask/utils';

import { normalizeAddress } from '../internalUtils';
import {
  bytesLikeToHex,
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for an ExactCalldataBatch caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded ExactCalldataBatchTerms object.
 */
export function decodeExactCalldataBatchTerms(
  terms: BytesLike,
): ExactCalldataBatchTerms {
  const hexTerms = bytesLikeToHex(terms);

  const decoded = decodeSingle(EXECUTION_ARRAY_ABI, hexTerms);

  const executions = (decoded as [string, bigint, Uint8Array][]).map(
    ([target, value, callData]) => ({
      target: target as `0x${string}`,
      value,
      callData: bytesToHex(callData),
    }),
  );

  return { executions };
}
