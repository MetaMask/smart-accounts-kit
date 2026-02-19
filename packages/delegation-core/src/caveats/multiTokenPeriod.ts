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
 * Configuration for a single token in MultiTokenPeriod terms.
 */
export type TokenPeriodConfig = {
  token: BytesLike;
  periodAmount: bigint;
  periodDuration: number;
  startDate: number;
};

/**
 * Terms for configuring a MultiTokenPeriod caveat.
 */
export type MultiTokenPeriodTerms = {
  tokenConfigs: TokenPeriodConfig[];
};

/**
 * Creates terms for a MultiTokenPeriod caveat that configures multiple token periods.
 *
 * @param terms - The terms for the MultiTokenPeriod caveat.
 * @param encodingOptions - The encoding options for the result.
 * @returns The terms as concatenated token period configs.
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
 * @returns The terms as concatenated token period configs.
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
