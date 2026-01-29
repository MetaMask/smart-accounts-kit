import { createNativeTokenPeriodTransferTerms } from '@metamask/delegation-core';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const nativeTokenPeriodTransfer = 'nativeTokenPeriodTransfer';

export type NativeTokenPeriodTransferBuilderConfig = {
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

/**
 * Builds a caveat struct for NativeTokenPeriodTransferEnforcer.
 * This enforcer validates that native token (ETH) transfers do not exceed a specified amount
 * within a given time period. The transferable amount resets at the beginning of each period,
 * and any unused ETH is forfeited once the period ends.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing periodAmount, periodDuration, and startDate.
 * @returns The Caveat.
 * @throws Error if any of the parameters are invalid.
 */
export const nativeTokenPeriodTransferBuilder = (
  environment: SmartAccountsEnvironment,
  config: NativeTokenPeriodTransferBuilderConfig,
): Caveat => {
  const { periodAmount, periodDuration, startDate } = config;

  const terms = createNativeTokenPeriodTransferTerms({
    periodAmount,
    periodDuration,
    startDate,
  });

  const {
    caveatEnforcers: { NativeTokenPeriodTransferEnforcer },
  } = environment;

  if (!NativeTokenPeriodTransferEnforcer) {
    throw new Error(
      'NativeTokenPeriodTransferEnforcer not found in environment',
    );
  }

  return {
    enforcer: NativeTokenPeriodTransferEnforcer,
    terms,
    args: '0x00',
  };
};
