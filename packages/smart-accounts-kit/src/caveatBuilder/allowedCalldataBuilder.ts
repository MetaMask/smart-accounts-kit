import { createAllowedCalldataTerms } from '@metamask/delegation-core';
import { type Hex } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const allowedCalldata = 'allowedCalldata';

export type AllowedCalldataBuilderConfig = {
  /**
   * The index in the calldata byte array (including the 4-byte method selector)
   * where the expected calldata starts.
   */
  startIndex: number;
  /**
   * The expected calldata as a hex string that must match at the specified index.
   */
  value: Hex;
};

/**
 * Builds a caveat struct for AllowedCalldataEnforcer that restricts calldata to a specific value at a given index.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing startIndex and value.
 * @returns The Caveat.
 * @throws Error if the value is not a valid hex string, if startIndex is negative, or if startIndex is not a whole number.
 */
export const allowedCalldataBuilder = (
  environment: SmartAccountsEnvironment,
  config: AllowedCalldataBuilderConfig,
): Caveat => {
  const { startIndex, value } = config;

  const terms = createAllowedCalldataTerms({ startIndex, value });

  const {
    caveatEnforcers: { AllowedCalldataEnforcer },
  } = environment;

  if (!AllowedCalldataEnforcer) {
    throw new Error('AllowedCalldataEnforcer not found in environment');
  }

  return {
    enforcer: AllowedCalldataEnforcer,
    terms,
    args: '0x00',
  };
};
