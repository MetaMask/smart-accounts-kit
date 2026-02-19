import { createSpecificActionERC20TransferBatchTerms } from '@metamask/delegation-core';
import { isAddress, type Address, type Hex } from 'viem';

import type { Caveat, SmartAccountsEnvironment } from '../types';

export const specificActionERC20TransferBatch =
  'specificActionERC20TransferBatch';

export type SpecificActionErc20TransferBatchBuilderConfig = {
  /**
   * The address of the ERC-20 token contract.
   */
  tokenAddress: Address;
  /**
   * The address that will receive the tokens.
   */
  recipient: Address;
  /**
   * The amount of tokens to transfer.
   */
  amount: bigint;
  /**
   * The target address for the first transaction.
   */
  target: Address;
  /**
   * The calldata for the first transaction.
   */
  calldata: Hex;
};

/**
 * Builds a caveat struct for SpecificActionERC20TransferBatchEnforcer.
 * Enforces a batch of exactly 2 transactions: a specific action followed by an ERC20 transfer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration for the specific action ERC20 transfer batch builder.
 * @returns The Caveat.
 * @throws Error if any of the addresses are invalid or if the amount is not a positive number.
 */
export const specificActionERC20TransferBatchBuilder = (
  environment: SmartAccountsEnvironment,
  config: SpecificActionErc20TransferBatchBuilderConfig,
): Caveat => {
  const { tokenAddress, recipient, amount, target, calldata } = config;

  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (!isAddress(recipient, { strict: false })) {
    throw new Error('Invalid recipient: must be a valid address');
  }

  if (!isAddress(target, { strict: false })) {
    throw new Error('Invalid target: must be a valid address');
  }

  if (amount <= 0n) {
    throw new Error('Invalid amount: must be a positive number');
  }

  const terms = createSpecificActionERC20TransferBatchTerms({
    tokenAddress,
    recipient,
    amount,
    target,
    calldata,
  });

  const {
    caveatEnforcers: { SpecificActionERC20TransferBatchEnforcer },
  } = environment;

  if (!SpecificActionERC20TransferBatchEnforcer) {
    throw new Error(
      'SpecificActionERC20TransferBatchEnforcer not found in environment',
    );
  }

  return {
    enforcer: SpecificActionERC20TransferBatchEnforcer,
    terms,
    args: '0x00',
  };
};
