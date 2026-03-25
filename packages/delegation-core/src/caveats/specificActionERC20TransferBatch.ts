/**
 * ## SpecificActionERC20TransferBatchEnforcer
 *
 * Encodes caveat terms for a batch of exactly two executions: first call must match
 * `target` + `calldata`; second must be `IERC20.transfer` to `recipient` for `amount`
 * on `tokenAddress` (see on-chain `beforeHook`).
 *
 * - bytes 0–19: ERC-20 token address
 * - bytes 20–39: transfer recipient
 * - bytes 40–71: transfer amount (uint256, 32 bytes)
 * - bytes 72–91: first execution target (`firstTarget` in Enforcer)
 * - bytes 92–end: first execution calldata, raw body only (no ABI length prefix; `firstCalldata` in Enforcer)
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
 * Terms for configuring a SpecificActionERC20TransferBatch caveat.
 */
export type SpecificActionERC20TransferBatchTerms<
  TBytesLike extends BytesLike = BytesLike,
> = {
  /** The address of the ERC-20 token contract. */
  tokenAddress: TBytesLike;
  /** The recipient of the ERC-20 transfer. */
  recipient: TBytesLike;
  /** The amount of tokens to transfer. */
  amount: bigint;
  /** The target address for the first batch execution (`firstTarget` in the enforcer). */
  target: TBytesLike;
  /** Calldata for the first execution only, without an ABI length prefix (`firstCalldata` on-chain). */
  calldata: TBytesLike;
};

/**
 * Creates terms for a SpecificActionERC20TransferBatch caveat that enforces a
 * specific action followed by an ERC20 transfer.
 *
 * @param terms - The terms for the SpecificActionERC20TransferBatch caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for a SpecificActionERC20TransferBatch caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses and calldata are returned as hex or bytes.
 * @returns The decoded SpecificActionERC20TransferBatchTerms object.
 */
export function decodeSpecificActionERC20TransferBatchTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'hex'>>;
export function decodeSpecificActionERC20TransferBatchTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded addresses and calldata are returned as hex or bytes.
 * @returns The decoded SpecificActionERC20TransferBatchTerms object.
 */
export function decodeSpecificActionERC20TransferBatchTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'hex'>>
  | SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);
  assertHexBytesMinLength(
    hexTerms,
    92,
    'Invalid SpecificActionERC20TransferBatch terms: must be at least 92 bytes',
  );

  const tokenAddressHex = extractAddress(hexTerms, 0);
  const recipientHex = extractAddress(hexTerms, 20);
  const amount = extractBigInt(hexTerms, 40, 32);
  const targetHex = extractAddress(hexTerms, 72);
  const calldataHex = extractRemainingHex(hexTerms, 92);

  return {
    tokenAddress: prepareResult(tokenAddressHex, encodingOptions),
    recipient: prepareResult(recipientHex, encodingOptions),
    amount,
    target: prepareResult(targetHex, encodingOptions),
    calldata: prepareResult(calldataHex, encodingOptions),
  } as
    | SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'hex'>>
    | SpecificActionERC20TransferBatchTerms<DecodedBytesLike<'bytes'>>;
}
