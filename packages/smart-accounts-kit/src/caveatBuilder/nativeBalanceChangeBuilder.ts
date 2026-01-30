import { createNativeBalanceChangeTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';
import { BalanceChangeType } from './types';

export const nativeBalanceChange = 'nativeBalanceChange';

export type NativeBalanceChangeBuilderConfig = {
  /**
   * The recipient's address as a hex string.
   */
  recipient: Address;
  /**
   * The amount by which the balance must have changed as a bigint.
   */
  balance: bigint;
  /**
   * The balance change type for the native currency.
   * Specifies whether the balance should have increased or decreased.
   * Valid parameters are BalanceChangeType.Increase and BalanceChangeType.Decrease.
   */
  changeType: BalanceChangeType;
};

/**
 * Builds a caveat struct for the NativeBalanceChangeEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the NativeBalanceChangeEnforcer.
 * @returns The Caveat.
 * @throws Error if the recipient address is invalid or the amount is not a positive number.
 */
export const nativeBalanceChangeBuilder = (
  environment: SmartAccountsEnvironment,
  config: NativeBalanceChangeBuilderConfig,
): Caveat => {
  const { recipient, balance, changeType } = config;

  if (!isAddress(recipient)) {
    throw new Error('Invalid recipient: must be a valid Address');
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

  const terms = createNativeBalanceChangeTerms({
    recipient,
    balance,
    changeType,
  });

  const {
    caveatEnforcers: { NativeBalanceChangeEnforcer },
  } = environment;

  if (!NativeBalanceChangeEnforcer) {
    throw new Error('NativeBalanceChangeEnforcer not found in environment');
  }

  return {
    enforcer: NativeBalanceChangeEnforcer,
    terms,
    args: '0x00',
  };
};
