import { createNonceTerms } from '@metamask/delegation-core';
import { type Hex } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const nonce = 'nonce';

export type NonceBuilderConfig = {
  /**
   * A nonce as a hex string to allow bulk revocation of delegations.
   */
  nonce: Hex;
};

/**
 * Builds a caveat struct for the NonceEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the nonce value.
 * @returns The Caveat.
 * @throws Error if the nonce is invalid.
 */
export const nonceBuilder = (
  environment: SmartAccountsEnvironment,
  config: NonceBuilderConfig,
): Caveat => {
  const { nonce: nonceValue } = config;

  const terms = createNonceTerms({ nonce: nonceValue });

  const {
    caveatEnforcers: { NonceEnforcer },
  } = environment;

  if (!NonceEnforcer) {
    throw new Error('NonceEnforcer not found in environment');
  }

  return {
    enforcer: NonceEnforcer,
    terms,
    args: '0x00',
  };
};
