import { hexToNumber } from '@metamask/utils';

import type { Erc20TokenAllowancePermission } from '../../types';
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
  getByteLength,
  getTermsByEnforcer,
  splitHex,
  UINT256_MAX,
  ZERO_32_BYTES,
} from '../utils';

/**
 * Builds the configuration for the erc20-token-allowance permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The erc20-token-allowance permission decoder configuration.
 */
export function makeErc20TokenAllowanceDecoderConfig(
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
    permissionType: 'erc20-token-allowance',
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
 * Decodes erc20-token-allowance permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded allowance terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<Erc20TokenAllowancePermission> {
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

  const EXPECTED_TERMS_BYTELENGTH = 116; // 20 + 32 + 32 + 32

  if (getByteLength(terms) !== EXPECTED_TERMS_BYTELENGTH) {
    throw new Error('Invalid erc20-token-allowance terms: expected 116 bytes');
  }

  const [tokenAddress, allowanceAmount, periodDurationRaw, startTimeRaw] =
    splitHex(terms, [20, 32, 32, 32]);

  if (periodDurationRaw.toLowerCase() !== UINT256_MAX) {
    throw new Error(
      'Invalid erc20-token-allowance terms: periodDuration must be UINT256_MAX',
    );
  }

  const startTime = hexToNumber(startTimeRaw);

  if (startTime === 0) {
    throw new Error(
      'Invalid erc20-token-allowance terms: startTime must be a positive number',
    );
  }

  if (allowanceAmount === ZERO_32_BYTES) {
    throw new Error(
      'Invalid erc20-token-allowance terms: allowanceAmount must be a positive number',
    );
  }

  return { tokenAddress, allowanceAmount, startTime };
}
