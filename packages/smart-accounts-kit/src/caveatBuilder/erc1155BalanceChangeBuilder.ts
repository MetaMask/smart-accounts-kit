import { createERC1155BalanceChangeTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';
import { BalanceChangeType } from './types';

export const erc1155BalanceChange = 'erc1155BalanceChange';

export type Erc1155BalanceChangeBuilderConfig = {
  /**
   * The ERC-1155 contract address as a hex string.
   */
  tokenAddress: Address;
  /**
   * The recipient's address as a hex string.
   */
  recipient: Address;
  /**
   * The ID of the ERC-1155 token as a bigint.
   */
  tokenId: bigint;
  /**
   * The amount by which the balance must have changed as a bigint.
   */
  balance: bigint;
  /**
   * The balance change type for the ERC-1155 token.
   * Specifies whether the balance should have increased or decreased.
   * Valid parameters are BalanceChangeType.Increase and BalanceChangeType.Decrease.
   */
  changeType: BalanceChangeType;
};

/**
 * Builds a caveat struct for the ERC1155BalanceChangeEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the ERC1155 balance change.
 * @returns The Caveat.
 * @throws Error if the token address is invalid, the recipient address is invalid, or the amount is not a positive number.
 */
export const erc1155BalanceChangeBuilder = (
  environment: SmartAccountsEnvironment,
  config: Erc1155BalanceChangeBuilderConfig,
): Caveat => {
  const { tokenAddress, recipient, tokenId, balance, changeType } = config;

  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  if (balance <= 0n) {
    throw new Error('Invalid balance: must be a positive number');
  }

  if (tokenId < 0n) {
    throw new Error('Invalid tokenId: must be a non-negative number');
  }

  if (
    changeType !== BalanceChangeType.Increase &&
    changeType !== BalanceChangeType.Decrease
  ) {
    throw new Error('Invalid changeType: must be either Increase or Decrease');
  }

  const terms = createERC1155BalanceChangeTerms({
    tokenAddress,
    recipient,
    tokenId,
    balance,
    changeType,
  });

  const {
    caveatEnforcers: { ERC1155BalanceChangeEnforcer },
  } = environment;

  if (!ERC1155BalanceChangeEnforcer) {
    throw new Error('ERC1155BalanceChangeEnforcer not found in environment');
  }

  return {
    enforcer: ERC1155BalanceChangeEnforcer,
    terms,
    args: '0x00',
  };
};
