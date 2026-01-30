import { createDeployedTerms } from '@metamask/delegation-core';
import { isAddress, isHex, type Address, type Hex } from 'viem';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const deployed = 'deployed';

export type DeployedBuilderConfig = {
  /**
   * The contract address as a hex string.
   */
  contractAddress: Address;
  /**
   * The salt to use with the deployment, as a hex string.
   */
  salt: Hex;
  /**
   * The bytecode of the contract as a hex string.
   */
  bytecode: Hex;
};

/**
 * Builds a caveat struct for a DeployedEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration for the deployed builder.
 * @returns The Caveat.
 * @throws Error if the contract address, factory address, or bytecode is invalid.
 */
export const deployedBuilder = (
  environment: SmartAccountsEnvironment,
  config: DeployedBuilderConfig,
): Caveat => {
  const { contractAddress, salt, bytecode } = config;

  // we check that the addresses are valid, but don't need to be checksummed
  if (!isAddress(contractAddress, { strict: false })) {
    throw new Error(
      `Invalid contractAddress: must be a valid Ethereum address`,
    );
  }

  if (!isHex(salt)) {
    throw new Error('Invalid salt: must be a valid hexadecimal string');
  }

  if (!isHex(bytecode)) {
    throw new Error('Invalid bytecode: must be a valid hexadecimal string');
  }

  const terms = createDeployedTerms({ contractAddress, salt, bytecode });

  const {
    caveatEnforcers: { DeployedEnforcer },
  } = environment;

  if (!DeployedEnforcer) {
    throw new Error('DeployedEnforcer not found in environment');
  }

  return {
    enforcer: DeployedEnforcer,
    terms,
    args: '0x00',
  };
};
