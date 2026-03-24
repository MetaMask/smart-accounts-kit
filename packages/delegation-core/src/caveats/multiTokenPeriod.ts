/**
 * ## MultiTokenPeriodEnforcer
 *
 * Sets independent periodic transfer limits for multiple tokens (ERC-20 or native).
 *
 * Terms are encoded by repeating, per entry: 20-byte token address (`address(0)` denotes native token) then three 32-byte big-endian uint256 words (period amount, period duration, start date).
 */

import type { BytesLike } from '@metamask/utils';

import {
  concatHex,
  extractAddress,
  extractBigInt,
  extractNumber,
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
 * Configuration for a single token in MultiTokenPeriod terms.
 */
export type TokenPeriodConfig<TBytesLike extends BytesLike = BytesLike> = {
  token: TBytesLike;
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

/**
 * Terms for configuring a MultiTokenPeriod caveat.
 */
export type MultiTokenPeriodTerms<TBytesLike extends BytesLike = BytesLike> = {
  tokenConfigs: TokenPeriodConfig<TBytesLike>[];
};

/**
 * Creates terms for a MultiTokenPeriod caveat that configures multiple token periods.
 *
 * @param terms - The terms for the MultiTokenPeriod caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the tokenConfigs array is empty or contains invalid parameters.
 */
export function createMultiTokenPeriodTerms(
  terms: MultiTokenPeriodTerms,
  encodingOptions?: EncodingOptions<'hex'>,
): Hex;
export function createMultiTokenPeriodTerms(
  terms: MultiTokenPeriodTerms,
  encodingOptions: EncodingOptions<'bytes'>,
): Uint8Array;
/**
 * Creates terms for a MultiTokenPeriod caveat that configures multiple token periods.
 *
 * @param terms - The terms for the MultiTokenPeriod caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns Encoded terms.
 * @throws Error if the tokenConfigs array is empty or contains invalid parameters.
 */
export function createMultiTokenPeriodTerms(
  terms: MultiTokenPeriodTerms,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
): Hex | Uint8Array {
  const { tokenConfigs } = terms;

  if (!tokenConfigs || tokenConfigs.length === 0) {
    throw new Error(
      'MultiTokenPeriodBuilder: tokenConfigs array cannot be empty',
    );
  }

  const hexParts: string[] = [];

  for (const tokenConfig of tokenConfigs) {
    const tokenHex = normalizeAddress(
      tokenConfig.token,
      `Invalid token address: ${String(tokenConfig.token)}`,
    );

    if (tokenConfig.periodAmount <= 0n) {
      throw new Error('Invalid period amount: must be greater than 0');
    }

    if (tokenConfig.periodDuration <= 0) {
      throw new Error('Invalid period duration: must be greater than 0');
    }

    if (tokenConfig.startDate <= 0) {
      throw new Error('Invalid start date: must be greater than 0');
    }

    hexParts.push(
      tokenHex,
      `0x${toHexString({ value: tokenConfig.periodAmount, size: 32 })}`,
      `0x${toHexString({ value: tokenConfig.periodDuration, size: 32 })}`,
      `0x${toHexString({ value: tokenConfig.startDate, size: 32 })}`,
    );
  }

  const hexValue = concatHex(hexParts);
  return prepareResult(hexValue, encodingOptions);
}

/**
 * Decodes terms for a MultiTokenPeriod caveat from encoded hex data.
 *
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token addresses are returned as hex or bytes.
 * @returns The decoded MultiTokenPeriodTerms object.
 */
export function decodeMultiTokenPeriodTerms(
  terms: BytesLike,
  encodingOptions?: EncodingOptions<'hex'>,
): MultiTokenPeriodTerms<DecodedBytesLike<'hex'>>;
export function decodeMultiTokenPeriodTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<'bytes'>,
): MultiTokenPeriodTerms<DecodedBytesLike<'bytes'>>;
/**
 * @param terms - The encoded terms as a hex string or Uint8Array.
 * @param encodingOptions - Whether decoded token addresses are returned as hex or bytes.
 * @returns The decoded MultiTokenPeriodTerms object.
 */
export function decodeMultiTokenPeriodTerms(
  terms: BytesLike,
  encodingOptions: EncodingOptions<ResultValue> = defaultOptions,
):
  | MultiTokenPeriodTerms<DecodedBytesLike<'hex'>>
  | MultiTokenPeriodTerms<DecodedBytesLike<'bytes'>> {
  const hexTerms = bytesLikeToHex(terms);

  const configSize = 116;
  const totalBytes = (hexTerms.length - 2) / 2; // Remove '0x' and divide by 2
  const configCount = totalBytes / configSize;

  const tokenConfigs: TokenPeriodConfig[] = [];
  for (let i = 0; i < configCount; i++) {
    const offset = i * configSize;
    const tokenHex = extractAddress(hexTerms, offset);
    const periodAmount = extractBigInt(hexTerms, offset + 20, 32);
    const periodDuration = extractNumber(hexTerms, offset + 52, 32);
    const startDate = extractNumber(hexTerms, offset + 84, 32);

    tokenConfigs.push({
      token: prepareResult(tokenHex, encodingOptions),
      periodAmount,
      periodDuration,
      startDate,
    });
  }

  return { tokenConfigs } as
    | MultiTokenPeriodTerms<DecodedBytesLike<'hex'>>
    | MultiTokenPeriodTerms<DecodedBytesLike<'bytes'>>;
}
