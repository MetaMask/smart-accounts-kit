import { createRedeemerTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const redeemer = 'redeemer';

export type RedeemerBuilderConfig = {
  /**
   * An array of addresses that are allowed to redeem the delegation.
   * Each address must be a valid hex string.
   */
  redeemers: Address[];
};

/**
 * Builds a caveat struct for the RedeemerEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing redeemers.
 * @returns The Caveat.
 * @throws Error if the redeemer address is invalid or the array is empty.
 */
export const redeemerBuilder = (
  environment: SmartAccountsEnvironment,
  config: RedeemerBuilderConfig,
): Caveat => {
  const { redeemers } = config;

  if (redeemers.length === 0) {
    throw new Error(
      'Invalid redeemers: must specify at least one redeemer address',
    );
  }

  for (const redeemerAddress of redeemers) {
    if (!isAddress(redeemerAddress)) {
      throw new Error('Invalid redeemers: must be a valid address');
    }
  }

  const terms = createRedeemerTerms({ redeemers });

  const {
    caveatEnforcers: { RedeemerEnforcer },
  } = environment;

  if (!RedeemerEnforcer) {
    throw new Error('RedeemerEnforcer not found in environment');
  }

  return {
    enforcer: RedeemerEnforcer,
    terms,
    args: '0x00',
  };
};
