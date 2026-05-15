/**
 * ## LogicalOrWrapperEnforcer
 *
 * Wraps multiple caveat groups in a logical OR: redemption evaluates exactly one group, which passes only if every caveat in that group passes.
 *
 * Terms are encoded as ABI-encoded `CaveatGroup[]`, i.e. `((address,bytes,bytes)[])[]`, matching Solidity `CaveatGroup` / `Caveat`.
 *
 * Args are encoded as ABI-encoded `(uint256 groupIndex, bytes[] caveatArgs)` (`SelectedGroup`). On redemption, `groupIndex` must be less than the number of groups and `caveatArgs.length` must match the caveat count of the chosen group. Each child enforcer receives `Caveat.terms` from the encoded group and hook args from `caveatArgs[i]` (not `Caveat.args` in terms). If groups differ in restrictiveness, the redeemer can choose the weakest valid group.
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
  /** An array of caveat groups — redemption evaluates exactly one group via args. */
  caveatGroups: CaveatStruct<TBytesLike>[][];
};

/**
 * Args for a LogicalOrWrapper caveat at redemption time.
 */
export type LogicalOrWrapperArgs<TBytesLike extends BytesLike = BytesLike> = {
  /** Zero-based index into `terms.caveatGroups`; must be `< caveatGroups.length` on-chain. */
  groupIndex: bigint;
  /** One redemption-time arg blob per caveat in the selected group; length must match that group on-chain. */
  caveatArgs: TBytesLike[];
};

const CAVEAT_GROUPS_ABI = '((address,bytes,bytes)[])[]';
const SELECTED_GROUP_ABI = '(uint256,bytes[])';

type EncodedCaveatRow = readonly [string, string, string];

/**
 * Ensures there is at least one group and each group has at least one caveat.
 *
 * @param groups - Caveat groups from caller input.
 */
function assertValidCaveatGroups(groups: CaveatStruct[][]): void {
  if (!groups?.length) {
    throw new Error(
      'Invalid caveatGroups: must provide at least one caveat group',
    );
  }
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group?.length) {
      throw new Error(
        `Invalid caveatGroups: group at index ${i} must contain at least one caveat`,
      );
    }
  }
}

/**
 * Builds one ABI `(address,bytes,bytes)` caveat tuple from structured input.
 *
 * @param caveat - Caveat fields to normalize.
 * @returns Tuple accepted by `@metamask/abi-utils` encoders.
 */
function normalizeCaveatTuple(caveat: CaveatStruct): EncodedCaveatRow {
  return [
    normalizeAddress(
      caveat.enforcer,
      'Invalid enforcer: must be a valid address',
    ),
    normalizeHex(caveat.terms, 'Invalid terms: must be a valid hex string'),
    normalizeHex(caveat.args, 'Invalid args: must be a valid hex string'),
  ];
}

/**
 * Encodes one `CaveatGroup` as ABI `tuple(Caveat[] caveats)`.
 *
 * @param group - Caveats belonging to this OR-branch.
 * @returns Single-element tuple wrapping the inner caveat array (Solidity layout).
 */
function encodeCaveatGroupTuple(group: CaveatStruct[]): [EncodedCaveatRow[]] {
  return [group.map(normalizeCaveatTuple)];
}

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
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  assertValidCaveatGroups(terms.caveatGroups);

  const encodableGroups = terms.caveatGroups.map(encodeCaveatGroupTuple);
  const hexValue = encodeSingle(CAVEAT_GROUPS_ABI, encodableGroups);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a LogicalOrWrapper caveat from encoded hex data.
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
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded values are returned as hex or bytes.
 * @returns The decoded LogicalOrWrapperTerms object.
 */
export function decodeLogicalOrWrapperTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | LogicalOrWrapperTerms<DecodedBytesLike<'hex'>>
  | LogicalOrWrapperTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);
  const decoded = decodeSingle(
    CAVEAT_GROUPS_ABI,
    hexTerms,
  ) as unknown as readonly [readonly [string, Uint8Array, Uint8Array][]][];

  const caveatGroups = decoded.map(([caveats]) =>
    caveats.map(([enforcer, caveatTerms, args]) => ({
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
 * Creates args for a LogicalOrWrapper caveat that selects which group to evaluate.
 *
 * @param args - The group index and per-caveat arguments for redemption.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded args.
 * @throws Error if groupIndex is negative or caveatArgs entries are invalid hex.
 */
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates args for a LogicalOrWrapper caveat that selects which group to evaluate.
 *
 * @param args - The group index and per-caveat arguments for redemption.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded args.
 * @throws Error if groupIndex is negative or caveatArgs entries are invalid hex.
 */
export function createLogicalOrWrapperArgs(
  args: LogicalOrWrapperArgs,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  if (args.groupIndex < 0n) {
    throw new Error('Invalid groupIndex: must be a non-negative number');
  }

  const caveatArgsHex = args.caveatArgs.map((arg) =>
    normalizeHex(arg, 'Invalid caveatArgs: must be valid hex strings'),
  );

  const hexValue = encodeSingle(SELECTED_GROUP_ABI, [
    args.groupIndex,
    caveatArgsHex,
  ]);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes args for a LogicalOrWrapper caveat from encoded hex data.
 *
 * @param args - The encoded args as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded values are returned as hex or bytes.
 * @returns The decoded LogicalOrWrapperArgs object.
 */
export function decodeLogicalOrWrapperArgs(
  args: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): LogicalOrWrapperArgs<DecodedBytesLike<'hex'>>;
export function decodeLogicalOrWrapperArgs(
  args: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): LogicalOrWrapperArgs<DecodedBytesLike<'bytes'>>;
/**
 * @param args - The encoded args as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded values are returned as hex or bytes.
 * @returns The decoded LogicalOrWrapperArgs object.
 */
export function decodeLogicalOrWrapperArgs(
  args: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | LogicalOrWrapperArgs<DecodedBytesLike<'hex'>>
  | LogicalOrWrapperArgs<DecodedBytesLike<'bytes'>> {
  const hexArgs = bytesLikeToHex(args);
  const [groupIndex, caveatArgsRaw] = decodeSingle(
    SELECTED_GROUP_ABI,
    hexArgs,
  ) as [bigint, Uint8Array[]];

  const caveatArgs = caveatArgsRaw.map((arg) =>
    prepareResult(bytesToHex(arg), encodingOptions),
  );

  return { groupIndex, caveatArgs } as
    | LogicalOrWrapperArgs<DecodedBytesLike<'hex'>>
    | LogicalOrWrapperArgs<DecodedBytesLike<'bytes'>>;
}
