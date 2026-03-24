/**
 * ## OwnershipTransferEnforcer
 *
 * Constrains ownership transfer for a specific contract.
 *
 * Terms are encoded as the 20-byte contract address only.
 */

import type { BytesLike } from '@metamask/utils';

import { extractAddress, normalizeAddress } from '../internalUtils';
import {
  bytesLikeToHex,
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
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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

/**
 * Decodes terms for an OwnershipTransfer caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded OwnershipTransferTerms object.
 */
export function decodeOwnershipTransferTerms(
  terms: BytesLike,
): OwnershipTransferTerms {
  const hexTerms = bytesLikeToHex(terms);
  const contractAddress = extractAddress(hexTerms, 0);
  return { contractAddress };
}
