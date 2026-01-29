import { createValueLteTerms } from '@metamask/delegation-core';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const valueLte = 'valueLte';

export type ValueLteBuilderConfig = {
  /**
   * The maximum value that may be specified when redeeming this delegation.
   */
  maxValue: bigint;
};

/**
 * Builds a caveat struct for ValueLteEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the maximum value allowed for the transaction.
 * @returns The Caveat.
 * @throws Error if any of the parameters are invalid.
 */
export const valueLteBuilder = (
  environment: SmartAccountsEnvironment,
  config: ValueLteBuilderConfig,
): Caveat => {
  const { maxValue } = config;

  const terms = createValueLteTerms({ maxValue });

  const {
    caveatEnforcers: { ValueLteEnforcer },
  } = environment;

  if (!ValueLteEnforcer) {
    throw new Error('ValueLteEnforcer not found in environment');
  }

  return {
    enforcer: ValueLteEnforcer,
    terms,
    args: '0x00',
  };
};
