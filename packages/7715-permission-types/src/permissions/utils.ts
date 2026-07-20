import { getChecksumAddress } from '@metamask/utils';

import type { ChecksumCaveat, EnforcerAddressesByName } from './types';
import type { Hex } from '../types';

/**
 * 32 bytes of zero (0x + 64 hex chars).
 */
export const ZERO_32_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

/**
 * Maximum unsigned 256-bit integer encoded as 32 bytes (0x + 64 hex chars).
 */
export const UINT256_MAX =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' as const;

/** AllowedCalldataEnforcer terms for ERC20 approve selector. */
export const ERC20_APPROVE_SELECTOR_TERMS =
  '0x0000000000000000000000000000000000000000000000000000000000000000095ea7b3' as const;

/** AllowedCalldataEnforcer terms for ERC20 approve zero amount. */
export const ERC20_APPROVE_ZERO_AMOUNT_TERMS =
  '0x00000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000000' as const;

/** Maximum period duration in seconds. */
export const MAX_PERIOD_DURATION = 10 * 365 * 24 * 60 * 60;

/**
 * Gets the terms for a given enforcer from a list of caveats.
 *
 * @param options0 - Terms lookup arguments.
 * @param options0.caveats - Caveats to search.
 * @param options0.enforcer - Enforcer address to match.
 * @param options0.throwIfNotFound - Whether to throw if no match is found.
 * @returns The matched terms, or `null` when disabled and no caveat is found.
 */
export function getTermsByEnforcer({
  caveats,
  enforcer,
  throwIfNotFound,
}: {
  caveats: ChecksumCaveat[];
  enforcer: Hex;
  throwIfNotFound?: true;
}): Hex;
export function getTermsByEnforcer({
  caveats,
  enforcer,
  throwIfNotFound,
}: {
  caveats: ChecksumCaveat[];
  enforcer: Hex;
  throwIfNotFound: false;
}): Hex | null;
/**
 * Implementation signature for getTermsByEnforcer overloads.
 *
 * @param options0 - Terms lookup arguments.
 * @param options0.caveats - Caveats to search.
 * @param options0.enforcer - Enforcer address to match.
 * @param options0.throwIfNotFound - Whether to throw if no match is found.
 * @returns The matched terms, or `null` when disabled and no caveat is found.
 */
export function getTermsByEnforcer({
  caveats,
  enforcer,
  throwIfNotFound = true,
}: {
  caveats: ChecksumCaveat[];
  enforcer: Hex;
  throwIfNotFound?: boolean;
}): Hex | null {
  let matchingCaveat: ChecksumCaveat | undefined;

  for (const caveat of caveats) {
    if (caveat.enforcer !== enforcer) {
      continue;
    }

    if (matchingCaveat) {
      throw new Error(
        `Invalid caveats: multiple caveats found matching enforcer ${enforcer}`,
      );
    }

    matchingCaveat = caveat;
  }

  if (!matchingCaveat) {
    if (throwIfNotFound) {
      throw new Error(
        `Invalid caveats: no caveat found matching enforcer ${enforcer}`,
      );
    }

    return null;
  }

  return matchingCaveat.terms;
}

/**
 * Get the byte length of a hex string.
 *
 * @param hexString - A 0x-prefixed hex string.
 * @returns The byte length of the provided hex string.
 */
export const getByteLength = (hexString: Hex): number => {
  return (hexString.length - 2) / 2;
};

/**
 * A tuple of TElement, the same length as the specified type TInput
 */
type Tuple<TElement, TInput extends readonly unknown[]> = {
  [K in keyof TInput]: TElement;
};

/**
 * Splits a 0x-prefixed hex string into parts according to the provided byte lengths.
 *
 * @param value - The hex value to split.
 * @param lengths - Segment lengths in bytes.
 * @returns The split hex segments, each with `0x` prefix.
 */
export function splitHex<const TLengths extends readonly number[]>(
  value: Hex,
  lengths: TLengths,
): Tuple<Hex, TLengths> {
  let start = 2;
  const parts: Hex[] = [];
  for (const partLength of lengths) {
    const partCharLength = partLength * 2;
    const part = value.slice(start, start + partCharLength);
    start += partCharLength;
    parts.push(`0x${part}` as const);
  }
  return parts as Tuple<Hex, TLengths>;
}

/**
 * Resolves and returns checksummed enforcer addresses from deployed contracts.
 *
 * @param contracts - Deployed contract-name-to-address map for a chain.
 * @returns Checksummed enforcer addresses keyed by known enforcer role.
 */
export const checksumEnforcerAddresses = (
  contracts: EnforcerAddressesByName,
): EnforcerAddressesByName => {
  return {
    erc20StreamingEnforcer: getChecksumAddress(
      contracts.erc20StreamingEnforcer,
    ),
    erc20PeriodTransferEnforcer: getChecksumAddress(
      contracts.erc20PeriodTransferEnforcer,
    ),
    nativeTokenStreamingEnforcer: getChecksumAddress(
      contracts.nativeTokenStreamingEnforcer,
    ),
    nativeTokenPeriodTransferEnforcer: getChecksumAddress(
      contracts.nativeTokenPeriodTransferEnforcer,
    ),
    approvalRevocationEnforcer: getChecksumAddress(
      contracts.approvalRevocationEnforcer,
    ),
    exactCalldataEnforcer: getChecksumAddress(contracts.exactCalldataEnforcer),
    valueLteEnforcer: getChecksumAddress(contracts.valueLteEnforcer),
    timestampEnforcer: getChecksumAddress(contracts.timestampEnforcer),
    nonceEnforcer: getChecksumAddress(contracts.nonceEnforcer),
    allowedCalldataEnforcer: getChecksumAddress(
      contracts.allowedCalldataEnforcer,
    ),
    allowedTargetsEnforcer: getChecksumAddress(
      contracts.allowedTargetsEnforcer,
    ),
    redeemerEnforcer: getChecksumAddress(contracts.redeemerEnforcer),
  };
};
