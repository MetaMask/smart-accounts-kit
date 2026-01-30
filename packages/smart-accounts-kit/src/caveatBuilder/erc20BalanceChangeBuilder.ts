import { createERC20BalanceChangeTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';
import { BalanceChangeType } from './types';

export const erc20BalanceChange = 'erc20BalanceChange';

export type Erc20BalanceChangeBuilderConfig = {
  /**
   * The ERC-20 contract address as a hex string.
   */
  tokenAddress: Address;
  /**
   * The recipient's address as a hex string.
   */
  recipient: Address;
  /**
   * The amount by which the balance must have changed as a bigint.
   */
  balance: bigint;
  /**
   * The balance change type for the ERC-20 token.
   * Specifies whether the balance should have increased or decreased.
   * Valid parameters are BalanceChangeType.Increase and BalanceChangeType.Decrease.
   */
  changeType: BalanceChangeType;
};

/**
 * Builds a caveat struct for the ERC20BalanceChangeEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the ERC20 balance change.
 * @returns The Caveat.
 * @throws Error if the token address is invalid, the amount is not a positive number, or the change type is invalid.
 */
export const erc20BalanceChangeBuilder = (
  environment: SmartAccountsEnvironment,
  config: Erc20BalanceChangeBuilderConfig,
): Caveat => {
  const { tokenAddress, recipient, balance, changeType } = config;

  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (balance <= 0n) {
    throw new Error('Invalid balance: must be a positive number');
  }

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const terms = createERC20BalanceChangeTerms({
    tokenAddress,
    recipient,
    balance,
    changeType,
  });

  const {
    caveatEnforcers: { ERC20BalanceChangeEnforcer },
  } = environment;

  if (!ERC20BalanceChangeEnforcer) {
    throw new Error('ERC20BalanceChangeEnforcer not found in environment');
  }

  return {
    enforcer: ERC20BalanceChangeEnforcer,
    terms,
    args: '0x00',
  };
};
