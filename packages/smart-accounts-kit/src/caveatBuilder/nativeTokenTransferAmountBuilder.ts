import { createNativeTokenTransferAmountTerms } from '@metamask/delegation-core';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const nativeTokenTransferAmount = 'nativeTokenTransferAmount';

export type NativeTokenTransferAmountBuilderConfig = {
  /**
   * The maximum amount of native tokens that can be transferred.
   */
  maxAmount: bigint;
};

/**
 * Builds a caveat struct for the NativeTokenTransferAmountEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the maxAmount.
 * @returns The Caveat.
 * @throws Error if the maxAmount is negative.
 */
export const nativeTokenTransferAmountBuilder = (
  environment: SmartAccountsEnvironment,
  config: NativeTokenTransferAmountBuilderConfig,
): Caveat => {
  const { maxAmount } = config;

  if (maxAmount < 0n) {
    throw new Error('Invalid maxAmount: must be zero or positive');
  }

  const terms = createNativeTokenTransferAmountTerms({ maxAmount });

  const {
    caveatEnforcers: { NativeTokenTransferAmountEnforcer },
  } = environment;

  if (!NativeTokenTransferAmountEnforcer) {
    throw new Error(
      'NativeTokenTransferAmountEnforcer not found in environment',
    );
  }

  return {
    enforcer: NativeTokenTransferAmountEnforcer,
    terms,
    args: '0x00',
  };
};
