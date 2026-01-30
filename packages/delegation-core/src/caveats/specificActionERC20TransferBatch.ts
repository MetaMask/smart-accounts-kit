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
 * Terms for configuring a SpecificActionERC20TransferBatch caveat.
 */
export type SpecificActionERC20TransferBatchTerms = {
  /** The address of the ERC-20 token contract. */
  tokenAddress: BytesLike;
  /** The recipient of the ERC-20 transfer. */
  recipient: BytesLike;
  /** The amount of tokens to transfer. */
  amount: bigint;
  /** The target address for the first transaction. */
  target: BytesLike;
  /** The calldata for the first transaction. */
  calldata: BytesLike;
};

/**
 * Creates terms for a SpecificActionERC20TransferBatch caveat that enforces a
 * specific action followed by an ERC20 transfer.
 *
 * @param terms - The terms for the SpecificActionERC20TransferBatch caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated tokenAddress + recipient + amount + target + calldata.
 * @throws Error if any address is invalid or amount is not positive.
 */
export function createSpecificActionERC20TransferBatchTerms(
  terms: SpecificActionERC20TransferBatchTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createSpecificActionERC20TransferBatchTerms(
  terms: SpecificActionERC20TransferBatchTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a SpecificActionERC20TransferBatch caveat that enforces a
 * specific action followed by an ERC20 transfer.
 *
 * @param terms - The terms for the SpecificActionERC20TransferBatch caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated tokenAddress + recipient + amount + target + calldata.
 * @throws Error if any address is invalid or amount is not positive.
 */
export function createSpecificActionERC20TransferBatchTerms(
  terms: SpecificActionERC20TransferBatchTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, recipient, amount, target, calldata } = terms;

  const tokenAddressHex = normalizeAddress(
    tokenAddress,
    'Invalid tokenAddress: must be a valid address',
  );
  const recipientHex = normalizeAddress(
    recipient,
    'Invalid recipient: must be a valid address',
  );
  const targetHex = normalizeAddress(
    target,
    'Invalid target: must be a valid address',
  );

  let calldataHex: string;
  if (typeof calldata === 'string') {
    if (!calldata.startsWith('0x')) {
      throw new Error(
        'Invalid calldata: must be a hex string starting with 0x',
      );
    }
    calldataHex = calldata;
  } else {
    calldataHex = bytesToHex(calldata);
  }

  if (amount <= 0n) {
    throw new Error('Invalid amount: must be a positive number');
  }

  const amountHex = `0x${toHexString({ value: amount, size: 32 })}`;

  const hexValue = concatHex([
    tokenAddressHex,
    recipientHex,
    amountHex,
    targetHex,
    calldataHex,
  ]);

  return prepareResult(hexValue, encodingOptions);
}
