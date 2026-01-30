import { createBlockNumberTerms } from '@metamask/delegation-core';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const blockNumber = 'blockNumber';

export type BlockNumberBuilderConfig = {
  /**
   * The block number after which the delegation is valid.
   * Set to 0n to disable this threshold.
   */
  afterThreshold: bigint;
  /**
   * The block number before which the delegation is valid.
   * Set to 0n to disable this threshold.
   */
  beforeThreshold: bigint;
};

/**
 * Builds a caveat struct for the BlockNumberEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the BlockNumberEnforcer.
 * @returns The Caveat.
 * @throws Error if both thresholds are zero, if blockAfterThreshold is greater than or equal to blockBeforeThreshold, or if BlockNumberEnforcer is not available in the environment.
 */
export const blockNumberBuilder = (
  environment: SmartAccountsEnvironment,
  config: BlockNumberBuilderConfig,
): Caveat => {
  const { afterThreshold, beforeThreshold } = config;

  if (afterThreshold === 0n && beforeThreshold === 0n) {
    throw new Error(
      'Invalid thresholds: At least one of afterThreshold or beforeThreshold must be specified',
    );
  }

  if (beforeThreshold !== 0n && afterThreshold >= beforeThreshold) {
    throw new Error(
      'Invalid thresholds: afterThreshold must be less than beforeThreshold if both are specified',
    );
  }

  const terms = createBlockNumberTerms({ afterThreshold, beforeThreshold });

  const {
    caveatEnforcers: { BlockNumberEnforcer },
  } = environment;

  if (!BlockNumberEnforcer) {
    throw new Error('BlockNumberEnforcer not found in environment');
  }

  return {
    enforcer: BlockNumberEnforcer,
    terms,
    args: '0x00',
  };
};
