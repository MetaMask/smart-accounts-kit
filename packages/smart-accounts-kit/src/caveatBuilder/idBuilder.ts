import { createIdTerms } from '@metamask/delegation-core';
import { maxUint256 } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export type IdBuilderConfig = {
  /**
   * An id for the delegation. Only one delegation may be redeemed with any given id.
   */
  id: bigint | number;
};

export const id = 'id';

/**
 * Builds a caveat struct for the IdEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object containing the id to use in the caveat.
 * @returns The Caveat.
 * @throws Error if the provided id is not a number, not an integer, or is not 32 bytes or fewer in length.
 */
export const idBuilder = (
  environment: SmartAccountsEnvironment,
  config: IdBuilderConfig,
): Caveat => {
  const { id: idValue } = config;

  let idBigInt: bigint;

  if (typeof idValue === 'number') {
    if (!Number.isInteger(idValue)) {
      throw new Error('Invalid id: must be an integer');
    }

    idBigInt = BigInt(idValue);
  } else if (typeof idValue === 'bigint') {
    idBigInt = idValue;
  } else {
    throw new Error('Invalid id: must be a bigint or number');
  }

  if (idBigInt < 0n) {
    throw new Error('Invalid id: must be a non-negative number');
  }

  if (idBigInt > maxUint256) {
    throw new Error('Invalid id: must be less than 2^256');
  }

  const terms = createIdTerms({ id: idBigInt });

  const {
    caveatEnforcers: { IdEnforcer },
  } = environment;

  if (!IdEnforcer) {
    throw new Error('IdEnforcer not found in environment');
  }

  return {
    enforcer: IdEnforcer,
    terms,
    args: '0x00',
  };
};
