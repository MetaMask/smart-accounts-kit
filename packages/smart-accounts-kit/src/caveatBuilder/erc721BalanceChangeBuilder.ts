import { createERC721BalanceChangeTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';
import { BalanceChangeType } from './types';

export const erc721BalanceChange = 'erc721BalanceChange';

export type Erc721BalanceChangeBuilderConfig = {
  /**
   * The ERC-721 contract address as a hex string.
   */
  tokenAddress: Address;
  /**
   * The recipient's address as a hex string.
   */
  recipient: Address;
  /**
   * The amount by which the balance must have changed as a bigint.
   */
  amount: bigint;
  /**
   * The balance change type for the ERC-721 token.
   * Specifies whether the balance should have increased or decreased.
   * Valid parameters are BalanceChangeType.Increase and BalanceChangeType.Decrease.
   */
  changeType: BalanceChangeType;
};

/**
 * Builds a caveat struct for the ERC721BalanceChangeEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the ERC721 balance change.
 * @returns The Caveat.
 * @throws Error if the token address is invalid, the recipient address is invalid, or the amount is not a positive number.
 */
export const erc721BalanceChangeBuilder = (
  environment: SmartAccountsEnvironment,
  config: Erc721BalanceChangeBuilderConfig,
): Caveat => {
  const { tokenAddress, recipient, amount, changeType } = config;

  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  if (amount <= 0n) {
    throw new Error('Invalid balance: must be a positive number');
  }

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const terms = createERC721BalanceChangeTerms({
    tokenAddress,
    recipient,
    amount,
    changeType,
  });

  const {
    caveatEnforcers: { ERC721BalanceChangeEnforcer },
  } = environment;

  if (!ERC721BalanceChangeEnforcer) {
    throw new Error('ERC721BalanceChangeEnforcer not found in environment');
  }

  return {
    enforcer: ERC721BalanceChangeEnforcer,
    terms,
    args: '0x00',
  };
};
