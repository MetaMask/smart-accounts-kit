import { createERC721TransferTerms } from '@metamask/delegation-core';
import { type Address, isAddress } from 'viem';

import type { SmartAccountsEnvironment, Caveat } from '../types';

export const erc721Transfer = 'erc721Transfer';

export type Erc721TransferBuilderConfig = {
  /**
   * The ERC-721 contract address as a hex string.
   */
  tokenAddress: Address;
  /**
   * The token ID as a bigint.
   */
  tokenId: bigint;
};

/**
 * Builds a caveat struct for the ERC721TransferEnforcer.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - The configuration object for the ERC721 transfer builder.
 * @returns The Caveat representing the caveat for ERC721 transfer.
 * @throws Error if the permitted contract address is invalid.
 */
export const erc721TransferBuilder = (
  environment: SmartAccountsEnvironment,
  config: Erc721TransferBuilderConfig,
): Caveat => {
  const { tokenAddress, tokenId } = config;

  if (!isAddress(tokenAddress, { strict: false })) {
    throw new Error('Invalid tokenAddress: must be a valid address');
  }

  if (tokenId < 0n) {
    throw new Error('Invalid tokenId: must be a non-negative number');
  }

  const terms = createERC721TransferTerms({ tokenAddress, tokenId });

  const {
    caveatEnforcers: { ERC721TransferEnforcer },
  } = environment;

  if (!ERC721TransferEnforcer) {
    throw new Error('ERC721TransferEnforcer not found in environment');
  }

  return {
    enforcer: ERC721TransferEnforcer,
    terms,
    args: '0x00',
  };
};
