/**
 * ## DeployedEnforcer
 *
 * Constrains contract deployment to a specific address, salt, and bytecode.
 *
 * Terms are encoded as 20-byte contract address, 32-byte left-padded salt, then creation bytecode bytes.
 */

import type { BytesLike } from '@metamask/utils';
import { remove0x } from '@metamask/utils';

import {
  assertHexBytesMinLength,
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
  type DecodedBytesLike,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { Hex } from '../types';

/**
 * Terms for configuring a Deployed caveat.
 */
export type DeployedTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** The contract address. */
  contractAddress: TBytesLike;
  /** The deployment salt. */
  salt: TBytesLike;
  /** The contract bytecode. */
  bytecode: TBytesLike;
};

/**
 * Creates terms for a Deployed caveat that constrains deployments by address, salt, and bytecode.
 *
 * @param terms - The terms for the Deployed caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
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
 * @returns Encoded terms.
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
 * @param encodingOptions - Whether decoded address, salt, and bytecode are returned as hex or bytes.
 * @returns The decoded DeployedTerms object.
 */
export function decodeDeployedTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): DeployedTerms<DecodedBytesLike<'hex'>>;
export function decodeDeployedTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): DeployedTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded address, salt, and bytecode are returned as hex or bytes.
 * @returns The decoded DeployedTerms object.
 */
export function decodeDeployedTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | DeployedTerms<DecodedBytesLike<'hex'>>
  | DeployedTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);
  assertHexBytesMinLength(
    hexTerms,
    52,
    'Invalid Deployed terms: must be at least 52 bytes',
  );

  const contractAddressHex = extractAddress(hexTerms, 0);
  const saltHex = extractHex(hexTerms, 20, 32);
  const bytecodeHex = extractRemainingHex(hexTerms, 52);

  return {
    contractAddress: prepareResult(contractAddressHex, encodingOptions),
    salt: prepareResult(saltHex, encodingOptions),
    bytecode: prepareResult(bytecodeHex, encodingOptions),
  } as
    | DeployedTerms<DecodedBytesLike<'hex'>>
    | DeployedTerms<DecodedBytesLike<'bytes'>>;
}
