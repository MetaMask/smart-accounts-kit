import type { BytesLike } from '@metamask/utils';
import { remove0x } from '@metamask/utils';

import {
  concatHex,
  extractAddress,
  extractHex,
  extractRemainingHex,
  normalizeAddress,
  normalizeHex,
} from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a Deployed caveat.
 */
export type DeployedTerms = {
  /** The contract address. */
  contractAddress: BytesLike;
  /** The deployment salt. */
  salt: BytesLike;
  /** The contract bytecode. */
  bytecode: BytesLike;
};

/**
 * Creates terms for a Deployed caveat that constrains deployments by address, salt, and bytecode.
 *
 * @param terms - The terms for the Deployed caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated contractAddress + salt (32 bytes) + bytecode.
 * @throws Error if the contract address, salt, or bytecode is invalid.
 */
export function createDeployedTerms(
  terms: DeployedTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createDeployedTerms(
  terms: DeployedTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a Deployed caveat that constrains deployments by address, salt, and bytecode.
 *
 * @param terms - The terms for the Deployed caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated contractAddress + salt (32 bytes) + bytecode.
 * @throws Error if the contract address, salt, or bytecode is invalid.
 */
export function createDeployedTerms(
  terms: DeployedTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { contractAddress, salt, bytecode } = terms;

  const contractAddressHex = normalizeAddress(
    contractAddress,
    'Invalid contractAddress: must be a valid Ethereum address',
  );
  const saltHex = normalizeHex(
    salt,
    'Invalid salt: must be a valid hexadecimal string',
  );
  const bytecodeHex = normalizeHex(
    bytecode,
    'Invalid bytecode: must be a valid hexadecimal string',
  );

  const unprefixedSalt = remove0x(saltHex);
  if (unprefixedSalt.length > 64) {
    throw new Error('Invalid salt: must be a valid hexadecimal string');
  }
  const paddedSalt = `0x${unprefixedSalt.padStart(64, '0')}`;

  const hexValue = concatHex([contractAddressHex, paddedSalt, bytecodeHex]);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a Deployed caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @returns The decoded DeployedTerms object.
 */
export function decodeDeployedTerms(terms: BytesLike): DeployedTerms {
  const hexTerms = bytesLikeToHex(terms);

  // Structure: contractAddress (20 bytes) + salt (32 bytes) + bytecode (remaining)
  const contractAddress = extractAddress(hexTerms, 0);
  const salt = extractHex(hexTerms, 20, 32);
  const bytecode = extractRemainingHex(hexTerms, 52);

  return { contractAddress, salt, bytecode };
}
