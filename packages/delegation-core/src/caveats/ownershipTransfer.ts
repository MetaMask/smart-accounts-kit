import type { BytesLike } from '@metamask/utils';

import { normalizeAddress } from '../internalUtils';
import {
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring an OwnershipTransfer caveat.
 */
export type OwnershipTransferTerms = {
  /** The contract address for which ownership transfers are allowed. */
  contractAddress: BytesLike;
};

/**
 * Creates terms for an OwnershipTransfer caveat that constrains ownership transfers to a contract.
 *
 * @param terms - The terms for the OwnershipTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as the contract address.
 * @throws Error if the contract address is invalid.
 */
export function createOwnershipTransferTerms(
  terms: OwnershipTransferTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createOwnershipTransferTerms(
  terms: OwnershipTransferTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for an OwnershipTransfer caveat that constrains ownership transfers to a contract.
 *
 * @param terms - The terms for the OwnershipTransfer caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as the contract address.
 * @throws Error if the contract address is invalid.
 */
export function createOwnershipTransferTerms(
  terms: OwnershipTransferTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { contractAddress } = terms;

  const contractAddressHex = normalizeAddress(
    contractAddress,
    'Invalid contractAddress: must be a valid address',
  );

  return prepareResult(contractAddressHex, encodingOptions);
}
