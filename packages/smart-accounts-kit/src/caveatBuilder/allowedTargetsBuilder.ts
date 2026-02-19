import { createAllowedTargetsTerms } from '@metamask/delegation-core';
import { isAddress, type Address } from 'viem';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const allowedTargets = 'allowedTargets';

export type AllowedTargetsBuilderConfig = {
  /**
   * An array of addresses that the delegate is allowed to call.
   * Each address must be a valid hex string.
   */
  targets: Address[];
};

/**
 * Builds a caveat struct for AllowedTargetsEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the targets.
 * @returns The Caveat.
 * @throws Error if no targets are provided or if any of the addresses are invalid.
 */
export const allowedTargetsBuilder = (
  environment: SmartAccountsEnvironment,
  config: AllowedTargetsBuilderConfig,
): Caveat => {
  const { targets } = config;

  if (targets.length === 0) {
    throw new Error(
      'Invalid targets: must provide at least one target address',
    );
  }

  // we check that the address is valid, but doesn't need to be checksummed
  const invalidAddresses = targets.filter(
    (target) => !isAddress(target, { strict: false }),
  );

  if (invalidAddresses.length > 0) {
    throw new Error('Invalid targets: must be valid addresses');
  }

  const terms = createAllowedTargetsTerms({ targets });

  const {
    caveatEnforcers: { AllowedTargetsEnforcer },
  } = environment;

  if (!AllowedTargetsEnforcer) {
    throw new Error('AllowedTargetsEnforcer not found in environment');
  }

  return {
    enforcer: AllowedTargetsEnforcer,
    terms,
    args: '0x00',
  };
};
