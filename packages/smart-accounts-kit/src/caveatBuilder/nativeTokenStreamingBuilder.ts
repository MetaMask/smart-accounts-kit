import { createNativeTokenStreamingTerms } from '@metamask/delegation-core';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const nativeTokenStreaming = 'nativeTokenStreaming';

export type NativeTokenStreamingBuilderConfig = {
  /**
   * The initial amount available at start time as a bigint.
   */
  initialAmount: bigint;
  /**
   * Maximum total amount that can be unlocked as a bigint.
   */
  maxAmount: bigint;
  /**
   * Rate at which tokens accrue per second as a bigint.
   */
  amountPerSecond: bigint;
  /**
   * Start timestamp as a number in seconds.
   */
  startTime: number;
};

/**
 * Builds a caveat struct for the NativeTokenStreamingEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the NativeTokenStreamingEnforcer.
 * @returns The Caveat.
 * @throws Error if any of the parameters are invalid.
 */
export const nativeTokenStreamingBuilder = (
  environment: SmartAccountsEnvironment,
  config: NativeTokenStreamingBuilderConfig,
): Caveat => {
  const { initialAmount, maxAmount, amountPerSecond, startTime } = config;

  const terms = createNativeTokenStreamingTerms({
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
  });

  const {
    caveatEnforcers: { NativeTokenStreamingEnforcer },
  } = environment;

  if (!NativeTokenStreamingEnforcer) {
    throw new Error('NativeTokenStreamingEnforcer not found in environment');
  }

  return {
    enforcer: NativeTokenStreamingEnforcer,
    terms,
    args: '0x00',
  };
};
