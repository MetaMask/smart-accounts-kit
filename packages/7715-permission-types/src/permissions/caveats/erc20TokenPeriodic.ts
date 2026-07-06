import type { Caveat } from '@metamask/delegation-core';
import {
  createERC20TokenPeriodTransferTerms,
  createValueLteTerms,
  decodeERC20TokenPeriodTransferTerms,
} from '@metamask/delegation-core';
import { bigIntToHex, hexToBigInt } from '@metamask/utils';

import type { Erc20TokenPeriodicPermission, Populated } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { erc20PayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  PermissionDecoderConfig,
} from '../types';
import {
  getTermsByEnforcer,
  MAX_PERIOD_DURATION,
  ZERO_32_BYTES,
} from '../utils';

/**
 * Builds the configuration for the erc20-token-periodic permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The erc20-token-periodic permission decoder configuration.
 */
export function makeErc20TokenPeriodicDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): PermissionDecoderConfig {
  const {
    timestampEnforcer,
    erc20PeriodicEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'erc20-token-periodic',
    contractAddresses,
    optionalEnforcers: [
      timestampEnforcer, // expiry rule
      redeemerEnforcer, // redeemer rule
      allowedCalldataEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [erc20PeriodicEnforcer]: 1,
      [valueLteEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [expiryRuleDecoder, redeemerRuleDecoder, erc20PayeeRuleDecoder],
    validateAndDecodeData,
  };
}

/**
 * Decodes erc20-token-periodic permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded periodic terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<Erc20TokenPeriodicPermission> {
  const { erc20PeriodicEnforcer, valueLteEnforcer } = contractAddresses;

  const valueLteTerms = getTermsByEnforcer({
    caveats,
    enforcer: valueLteEnforcer,
  });
  if (valueLteTerms !== ZERO_32_BYTES) {
    throw new Error(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: erc20PeriodicEnforcer,
  });

  const {
    tokenAddress,
    periodAmount,
    periodDuration,
    startDate: startTime,
  } = decodeERC20TokenPeriodTransferTerms(terms);

  if (periodAmount === 0n) {
    throw new Error(
      'Invalid erc20-token-periodic terms: periodAmount must be a positive number',
    );
  }

  if (periodDuration === 0) {
    throw new Error(
      'Invalid erc20-token-periodic terms: periodDuration must be a positive number',
    );
  }

  if (periodDuration > MAX_PERIOD_DURATION) {
    throw new Error(
      'Invalid erc20-token-periodic terms: periodDuration must be less than or equal to MAX_PERIOD_DURATION',
    );
  }

  if (startTime === 0) {
    throw new Error(
      'Invalid erc20-token-periodic terms: startTime must be a positive number',
    );
  }

  return {
    tokenAddress,
    periodAmount: bigIntToHex(periodAmount),
    periodDuration,
    startTime,
  };
}

/**
 * Enforcers required to build ERC-20 token periodic caveats.
 */
export type Erc20TokenPeriodicEnforcers = Pick<
  ChecksumEnforcersByChainId,
  'erc20PeriodicEnforcer' | 'valueLteEnforcer'
>;

/**
 * Builds the erc20-token-periodic caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated erc20-token-periodic permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The ERC-20 periodic and zero-value caveats.
 */
export function createErc20TokenPeriodicCaveats({
  permission,
  contracts,
}: {
  permission: Populated<Erc20TokenPeriodicPermission>;
  contracts: Erc20TokenPeriodicEnforcers;
}): Caveat[] {
  const { tokenAddress, periodAmount, periodDuration, startTime } =
    permission.data;
  const periodAmountBigInt = hexToBigInt(periodAmount);

  if (periodAmountBigInt === 0n) {
    throw new Error(
      'Invalid erc20-token-periodic permission: periodAmount must be a positive number.',
    );
  }

  if (periodDuration <= 0) {
    throw new Error(
      'Invalid erc20-token-periodic permission: periodDuration must be a positive number.',
    );
  }

  if (periodDuration > MAX_PERIOD_DURATION) {
    throw new Error(
      'Invalid erc20-token-periodic permission: periodDuration must be less than or equal to MAX_PERIOD_DURATION.',
    );
  }

  if (startTime <= 0) {
    throw new Error(
      'Invalid erc20-token-periodic permission: startTime must be a positive number.',
    );
  }

  const erc20PeriodCaveat: Caveat = {
    enforcer: contracts.erc20PeriodicEnforcer,
    terms: createERC20TokenPeriodTransferTerms({
      tokenAddress,
      periodAmount: periodAmountBigInt,
      periodDuration,
      startDate: startTime,
    }),
    args: '0x',
  };

  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({ maxValue: 0n }),
    args: '0x',
  };

  return [erc20PeriodCaveat, valueLteCaveat];
}
