/**
 * ## LogicalOrWrapperEnforcer
 *
 * Wraps multiple groups of caveats in a logical OR — redemption succeeds if any single group passes.
 *
 * Terms are ABI-encoded as `(address,bytes,bytes)[][]`, an array of caveat groups where each
 * caveat is `(enforcer, terms, args)`.
 *
 * Args are ABI-encoded as `uint256`, the index of the caveat group to evaluate.
 */

import { decodeSingle, encodeSingle } from '@metamask/abi-utils';
import { bytesToHex, type BytesLike } from '@metamask/utils';

import { normalizeAddress, normalizeHex } from '../internalUtils';
import {
  bytesLikeToHex,
  defaultOptions,
  prepareResult,
  type DecodedBytesLike,
  type EncodingOptions,
  type ResultValue,
} from '../returns';
import type { CaveatStruct, Hex } from '../types';

/**
 * Terms for configuring a LogicalOrWrapper caveat.
 */
export type LogicalOrWrapperTerms<TBytesLike extends BytesLike = BytesLike> = {
  /** An array of caveat groups — redemption succeeds if any single group passes. */
  caveatGroups: CaveatStruct<TBytesLike>[][];
};

/**
 * Args for a LogicalOrWrapper caveat at redemption time.
 */
export type LogicalOrWrapperArgs = {
  /** The zero-based index of the caveat group to evaluate. */
  groupIndex: bigint;
};

const CAVEAT_GROUPS_ABI = '(address,bytes,bytes)[][]';
const GROUP_INDEX_ABI = 'uint256';

/**
 * Creates terms for a LogicalOrWrapper caveat.
 *
 * @param terms - The terms for the LogicalOrWrapper caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if caveatGroups is empty or contains invalid data.
 */
export function createLogicalOrWrapperTerms(
  terms: LogicalOrWrapperTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createLogicalOrWrapperTerms(
  terms: LogicalOrWrapperTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
export function createLogicalOrWrapperTerms(
  terms: LogicalOrWrapperTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { caveatGroups } = terms;

  if (!caveatGroups || caveatGroups.length === 0) {
    throw new Error(
      'Invalid caveatGroups: must provide at least one caveat group',
    );
  }

  for (let i = 0; i < caveatGroups.length; i++) {
    const group = caveatGroups[i];
    if (!group || group.length === 0) {
      throw new Error(
        `Invalid caveatGroups: group at index ${i} must contain at least one caveat`,
      );
    }
  }

  const encodableGroups = caveatGroups.map((group) =>
    group.map((caveat) => {
      const enforcer = normalizeAddress(
        caveat.enforcer,
        'Invalid enforcer: must be a valid address',
      );
      const termsHex = normalizeHex(
        caveat.terms,
        'Invalid terms: must be a valid hex string',
      );
      const argsHex = normalizeHex(
        caveat.args,
        'Invalid args: must be a valid hex string',
      );
      return [enforcer, termsHex, argsHex];
    }),
  );

  const hexValue = encodeSingle(CAVEAT_GROUPS_ABI, encodableGroups);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a LogicalOrWrapper caveat from encoded data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded values are returned as hex or bytes.
 * @returns The decoded LogicalOrWrapperTerms object.
 */
export function decodeLogicalOrWrapperTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): LogicalOrWrapperTerms<DecodedBytesLike<'hex'>>;
export function decodeLogicalOrWrapperTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): LogicalOrWrapperTerms<DecodedBytesLike<'bytes'>>;
export function decodeLogicalOrWrapperTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | LogicalOrWrapperTerms<DecodedBytesLike<'hex'>>
  | LogicalOrWrapperTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const decoded = decodeSingle(CAVEAT_GROUPS_ABI, hexTerms) as [
    string,
    Uint8Array,
    Uint8Array,
  ][][];

  const caveatGroups = decoded.map((group) =>
    group.map(([enforcer, caveatTerms, args]) => ({
      enforcer: prepareResult(enforcer, encodingOptions),
      terms: prepareResult(bytesToHex(caveatTerms), encodingOptions),
      args: prepareResult(bytesToHex(args), encodingOptions),
    })),
  );

  return { caveatGroups } as
    | LogicalOrWrapperTerms<DecodedBytesLike<'hex'>>
    | LogicalOrWrapperTerms<DecodedBytesLike<'bytes'>>;
}

/**
 * Creates args for a LogicalOrWrapper caveat specifying which group to evaluate.
 *
 * @param args - The args containing the group index.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded args.
 */
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  if (args.groupIndex < 0n) {
    throw new Error('Invalid groupIndex: must be a non-negative number');
  }

  const hexValue = encodeSingle(GROUP_INDEX_ABI, args.groupIndex);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes args for a LogicalOrWrapper caveat.
 *
 * @param args - The encoded args as a hex string or Uint8Array.
 * @returns The decoded LogicalOrWrapperArgs object.
 */
export function decodeLogicalOrWrapperArgs(args: BytesLike): LogicalOrWrapperArgs {
  const hexArgs = bytesLikeToHex(args);
  const groupIndex = decodeSingle(GROUP_INDEX_ABI, hexArgs) as bigint;
  return { groupIndex };
}
