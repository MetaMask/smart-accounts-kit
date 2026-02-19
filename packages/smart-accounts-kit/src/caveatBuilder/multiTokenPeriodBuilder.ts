import { createMultiTokenPeriodTerms } from '@metamask/delegation-core';
import type { Hex } from 'viem';
import { isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export type TokenPeriodConfig = {
  /**
   * The token contract address as a hex string.
   */
  token: Hex;
  /**
   * The maximum amount of tokens that can be transferred per period.
   */
  periodAmount: bigint;
  /**
   * The duration of each period in seconds.
   */
  periodDuration: number;
  /**
   * The timestamp when the first period begins in seconds.
   */
  startDate: number;
};

export type MultiTokenPeriodBuilderConfig = {
  tokenConfigs: TokenPeriodConfig[];
};

export const multiTokenPeriod = 'multiTokenPeriod';

/**
 * Creates a caveat for the MultiTokenPeriodEnforcer.
 * This enforcer allows setting periodic transfer limits for multiple tokens.
 * Each token can have its own period amount, duration, and start date.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration for the MultiTokenPeriodBuilder.
 * @param config.tokenConfigs - The token configurations for the MultiTokenPeriodBuilder.
 * @returns The caveat object for the MultiTokenPeriodEnforcer.
 */
export const multiTokenPeriodBuilder = (
  environment: SmartAccountsEnvironment,
  config: MultiTokenPeriodBuilderConfig,
): Caveat => {
  if (!config?.tokenConfigs || config.tokenConfigs.length === 0) {
    throw new Error(
      'MultiTokenPeriodBuilder: tokenConfigs array cannot be empty',
    );
  }

  config.tokenConfigs.forEach((tokenConfig) => {
    if (!isAddress(tokenConfig.token)) {
      throw new Error(`Invalid token address: ${String(tokenConfig.token)}`);
    }

    if (tokenConfig.periodAmount <= 0) {
      throw new Error('Invalid period amount: must be greater than 0');
    }

    if (tokenConfig.periodDuration <= 0) {
      throw new Error('Invalid period duration: must be greater than 0');
    }
  });

  const terms = createMultiTokenPeriodTerms({
    tokenConfigs: config.tokenConfigs,
  });

  const {
    caveatEnforcers: { MultiTokenPeriodEnforcer },
  } = environment;

  if (!MultiTokenPeriodEnforcer) {
    throw new Error('MultiTokenPeriodEnforcer not found in environment');
  }

  return {
    enforcer: MultiTokenPeriodEnforcer,
    terms,
    args: '0x00',
  };
};
