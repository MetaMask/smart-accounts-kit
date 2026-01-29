import { createTimestampTerms } from '@metamask/delegation-core';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const timestamp = 'timestamp';

export type TimestampBuilderConfig = {
  /**
   * The timestamp after which the delegation is valid in seconds.
   * Set to 0 to disable this threshold.
   */
  afterThreshold: number;
  /**
   * The timestamp before which the delegation is valid.
   * Set to 0 to disable this threshold.
   */
  beforeThreshold: number;
};

/**
 * Builds a caveat struct for the TimestampEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the TimestampEnforcer.
 * @returns The Caveat.
 * @throws Error if any of the parameters are invalid.
 */
export const timestampBuilder = (
  environment: SmartAccountsEnvironment,
  config: TimestampBuilderConfig,
): Caveat => {
  const { afterThreshold, beforeThreshold } = config;

  const terms = createTimestampTerms({
    timestampAfterThreshold: afterThreshold,
    timestampBeforeThreshold: beforeThreshold,
  });

  const {
    caveatEnforcers: { TimestampEnforcer },
  } = environment;

  if (!TimestampEnforcer) {
    throw new Error('TimestampEnforcer not found in environment');
  }

  return {
    enforcer: TimestampEnforcer,
    terms,
    args: '0x00',
  };
};
