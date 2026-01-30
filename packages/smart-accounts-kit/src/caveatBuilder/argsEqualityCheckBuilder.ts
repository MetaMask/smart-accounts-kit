import { createArgsEqualityCheckTerms } from '@metamask/delegation-core';
import { type Hex, isHex } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const argsEqualityCheck = 'argsEqualityCheck';

export type ArgsEqualityCheckBuilderConfig = {
  /**
   * The expected args as a hex string that must match exactly when redeeming the delegation.
   */
  args: Hex;
};

/**
 * Builds a caveat struct for the ArgsEqualityCheckEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the builder.
 * @returns The Caveat.
 * @throws Error if the config is invalid.
 */
export const argsEqualityCheckBuilder = (
  environment: SmartAccountsEnvironment,
  config: ArgsEqualityCheckBuilderConfig,
): Caveat => {
  const { args } = config;
  if (!isHex(args)) {
    throw new Error('Invalid config: args must be a valid hex string');
  }

  const {
    caveatEnforcers: { ArgsEqualityCheckEnforcer },
  } = environment;

  if (!ArgsEqualityCheckEnforcer) {
    throw new Error('ArgsEqualityCheckEnforcer not found in environment');
  }

  return {
    enforcer: ArgsEqualityCheckEnforcer,
    terms: createArgsEqualityCheckTerms({ args }),
    args: '0x00',
  };
};
