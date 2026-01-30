import type { BytesLike } from '@metamask/utils';

import { concatHex, normalizeAddress, toHexString } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an ERC20TransferAmount caveat.
 */
export type ERC20TransferAmountTerms = {
  /** The ERC-20 token address. */
  tokenAddress: BytesLike;
  /** The maximum amount of tokens that can be transferred. */
  maxAmount: bigint;
};

/**
 * Creates terms for an ERC20TransferAmount caveat that caps transfer amount.
 *
 * @param terms - The terms for the ERC20TransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as tokenAddress + maxAmount.
 * @throws Error if the token address is invalid or maxAmount is not positive.
 */
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an ERC20TransferAmount caveat that caps transfer amount.
 *
 * @param terms - The terms for the ERC20TransferAmount caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as tokenAddress + maxAmount.
 * @throws Error if the token address is invalid or maxAmount is not positive.
 */
export function createERC20TransferAmountTerms(
  terms: ERC20TransferAmountTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenAddress, maxAmount } = terms;

  const tokenAddressHex = normalizeAddress(
    tokenAddress,
    'Invalid tokenAddress: must be a valid address',
  );

  if (maxAmount <= 0n) {
    throw new Error('Invalid maxAmount: must be a positive number');
  }

  const maxAmountHex = `0x${toHexString({ value: maxAmount, size: 32 })}`;
  const hexValue = concatHex([tokenAddressHex, maxAmountHex]);

  return prepareResult(hexValue, encodingOptions);
}
