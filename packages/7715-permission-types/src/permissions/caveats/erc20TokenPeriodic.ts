import { decodeERC20TokenPeriodTransferTerms } from '@metamask/delegation-core';
import { bigIntToHex } from '@metamask/utils';

import type { Erc20TokenPeriodicPermission } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { erc20PayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  MakePermissionDecoderConfig,
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
): MakePermissionDecoderConfig {
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
