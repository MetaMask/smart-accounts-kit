import { createOwnershipTransferTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const ownershipTransfer = 'ownershipTransfer';

export type OwnershipTransferBuilderConfig = {
  /**
   * The target contract address as a hex string for which ownership transfers are allowed.
   */
  contractAddress: Address;
};

/**
 * Builds a caveat struct for the OwnershipTransferEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the ownership transfer builder.
 * @returns The Caveat representing the caveat for ownership transfer.
 * @throws Error if the target contract address is invalid.
 */
export const ownershipTransferBuilder = (
  environment: SmartAccountsEnvironment,
  config: OwnershipTransferBuilderConfig,
): Caveat => {
  const { contractAddress } = config;

  if (!isAddress(contractAddress, { strict: false })) {
    throw new Error('Invalid contractAddress: must be a valid address');
  }

  const terms = createOwnershipTransferTerms({ contractAddress });

  const {
    caveatEnforcers: { OwnershipTransferEnforcer },
  } = environment;

  if (!OwnershipTransferEnforcer) {
    throw new Error('OwnershipTransferEnforcer not found in environment');
  }

  return {
    enforcer: OwnershipTransferEnforcer,
    terms,
    args: '0x00',
  };
};
