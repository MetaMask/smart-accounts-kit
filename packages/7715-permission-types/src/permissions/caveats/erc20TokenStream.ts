import type { Caveat } from '@metamask/delegation-core';
import {
  createERC20StreamingTerms,
  createValueLteTerms,
  decodeERC20StreamingTerms,
} from '@metamask/delegation-core';
import { bigIntToHex, hexToBigInt } from '@metamask/utils';

import type { Erc20TokenStreamPermission, Populated } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { erc20PayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  DecodedPermissionData,
  ChecksumEnforcersByChainId,
  PermissionDecoderConfig,
} from '../types';
import { getTermsByEnforcer, ZERO_32_BYTES } from '../utils';

/**
 * Builds the configuration for the erc20-token-stream permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The erc20-token-stream permission decoder configuration.
 */
export function makeErc20TokenStreamDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): PermissionDecoderConfig {
  const {
    timestampEnforcer,
    erc20StreamingEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'erc20-token-stream',
    contractAddresses,
    optionalEnforcers: [
      timestampEnforcer, // expiry rule
      redeemerEnforcer, // redeemer rule
      allowedCalldataEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [erc20StreamingEnforcer]: 1,
      [valueLteEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [expiryRuleDecoder, redeemerRuleDecoder, erc20PayeeRuleDecoder],
    validateAndDecodeData,
  };
}

/**
 * Decodes erc20-token-stream permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded stream terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<Erc20TokenStreamPermission> {
  const { erc20StreamingEnforcer, valueLteEnforcer } = contractAddresses;

  const valueLteTerms = getTermsByEnforcer({
    caveats,
    enforcer: valueLteEnforcer,
  });

  if (valueLteTerms !== ZERO_32_BYTES) {
    throw new Error(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: erc20StreamingEnforcer,
  });
  const { tokenAddress, initialAmount, maxAmount, amountPerSecond, startTime } =
    decodeERC20StreamingTerms(terms);

  if (maxAmount <= initialAmount) {
    throw new Error(
      'Invalid erc20-token-stream terms: maxAmount must be greater than initialAmount',
    );
  }

  if (amountPerSecond === 0n) {
    throw new Error(
      'Invalid erc20-token-stream terms: amountPerSecond must be a positive number',
    );
  }

  if (startTime === 0) {
    throw new Error(
      'Invalid erc20-token-stream terms: startTime must be a positive number',
    );
  }

  return {
    tokenAddress,
    initialAmount: bigIntToHex(initialAmount),
    maxAmount: bigIntToHex(maxAmount),
    amountPerSecond: bigIntToHex(amountPerSecond),
    startTime,
  };
}

/**
 * Enforcers required to build ERC-20 token stream caveats.
 */
export type Erc20TokenStreamEnforcers = Pick<
  ChecksumEnforcersByChainId,
  'erc20StreamingEnforcer' | 'valueLteEnforcer'
>;

/**
 * Builds the ERC-20 stream caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated ERC-20 stream permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The ERC20 streaming and zero-value caveats.
 */
export function createErc20TokenStreamCaveats({
  permission,
  contracts,
}: {
  permission: Populated<Erc20TokenStreamPermission>;
  contracts: Erc20TokenStreamEnforcers;
}): Caveat[] {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;
  const initialAmountBigInt = hexToBigInt(initialAmount);
  const maxAmountBigInt = hexToBigInt(maxAmount);
  const amountPerSecondBigInt = hexToBigInt(amountPerSecond);

  if (maxAmountBigInt <= initialAmountBigInt) {
    throw new Error(
      'Invalid erc20-token-stream permission: maxAmount must be greater than initialAmount.',
    );
  }

  if (amountPerSecondBigInt === 0n) {
    throw new Error(
      'Invalid erc20-token-stream permission: amountPerSecond must be a positive number.',
    );
  }

  if (startTime <= 0) {
    throw new Error(
      'Invalid erc20-token-stream permission: startTime must be a positive number.',
    );
  }

  // ERC20StreamingEnforcer: enforce token address, initial/max amount, amount per second, and start time.
  const erc20StreamingCaveat: Caveat = {
    enforcer: contracts.erc20StreamingEnforcer,
    terms: createERC20StreamingTerms({
      tokenAddress: permission.data.tokenAddress,
      initialAmount: initialAmountBigInt,
      maxAmount: maxAmountBigInt,
      amountPerSecond: amountPerSecondBigInt,
      startTime,
    }),
    args: '0x',
  };

  // ValueLteEnforcer: allow no native value (e.g. msg.value must be 0).
  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({
      maxValue: 0n,
    }),
    args: '0x',
  };

  return [erc20StreamingCaveat, valueLteCaveat];
}
