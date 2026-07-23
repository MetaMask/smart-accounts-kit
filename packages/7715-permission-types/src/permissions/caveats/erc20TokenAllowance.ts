import type { Caveat } from '@metamask/delegation-core';
import {
  createERC20TransferAmountTerms,
  createTimestampTerms,
  createValueLteTerms,
  decodeTimestampTerms,
} from '@metamask/delegation-core';
import { hexToBigInt } from '@metamask/utils';

import type { Erc20TokenAllowancePermission, Populated } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { erc20PayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  EnforcerAddressesByName,
  DecodedPermissionData,
  PermissionDecoderConfig,
} from '../types';
import {
  getByteLength,
  getTermsByEnforcer,
  splitHex,
  ZERO_32_BYTES,
} from '../utils';

/**
 * Builds the configuration for the erc20-token-allowance permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The erc20-token-allowance permission decoder configuration.
 */
export function makeErc20TokenAllowanceDecoderConfig(
  contractAddresses: EnforcerAddressesByName,
): PermissionDecoderConfig {
  const {
    timestampEnforcer,
    erc20TransferAmountEnforcer,
    valueLteEnforcer,
    nonceEnforcer,
    allowedCalldataEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'erc20-token-allowance',
    contractAddresses,
    optionalEnforcers: [
      redeemerEnforcer, // redeemer rule
      allowedCalldataEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [erc20TransferAmountEnforcer]: 1,
      [valueLteEnforcer]: 1,
      [timestampEnforcer]: 1,
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
  contractAddresses: EnforcerAddressesByName,
): DecodedPermissionData<Erc20TokenAllowancePermission> {
  const { erc20TransferAmountEnforcer, valueLteEnforcer, timestampEnforcer } =
    contractAddresses;

  const valueLteTerms = getTermsByEnforcer({
    caveats,
    enforcer: valueLteEnforcer,
  });
  if (valueLteTerms !== ZERO_32_BYTES) {
    throw new Error(`Invalid value-lte terms: must be ${ZERO_32_BYTES}`);
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: erc20TransferAmountEnforcer,
  });

  const EXPECTED_TERMS_BYTELENGTH = 52; // 20 + 32

  if (getByteLength(terms) !== EXPECTED_TERMS_BYTELENGTH) {
    throw new Error('Invalid erc20-token-allowance terms: expected 52 bytes');
  }

  const [tokenAddress, allowanceAmount] = splitHex(terms, [20, 32]);

  if (allowanceAmount === ZERO_32_BYTES) {
    throw new Error(
      'Invalid erc20-token-allowance terms: allowanceAmount must be a positive number',
    );
  }

  const timestampTerms = getTermsByEnforcer({
    caveats,
    enforcer: timestampEnforcer,
  });

  const { afterThreshold: startTime } = decodeTimestampTerms(timestampTerms);

  if (startTime === 0) {
    throw new Error(
      'Invalid erc20-token-allowance terms: startTime must be a positive number',
    );
  }

  return { tokenAddress, allowanceAmount, startTime };
}

/**
 * Enforcers required to build ERC-20 token allowance caveats.
 */
export type Erc20TokenAllowanceEnforcers = Pick<
  EnforcerAddressesByName,
  'erc20TransferAmountEnforcer' | 'valueLteEnforcer' | 'timestampEnforcer'
>;

/**
 * Builds the erc20-token-allowance caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated erc20-token-allowance permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The ERC-20 allowance, zero-value, and start-time caveats.
 */
export function createErc20TokenAllowanceCaveats({
  permission,
  contracts,
}: {
  permission: Populated<Erc20TokenAllowancePermission>;
  contracts: Erc20TokenAllowanceEnforcers;
}): Caveat[] {
  const { tokenAddress, allowanceAmount, startTime } = permission.data;
  const allowanceAmountBigInt = hexToBigInt(allowanceAmount);

  if (allowanceAmountBigInt === 0n) {
    throw new Error(
      'Invalid erc20-token-allowance permission: allowanceAmount must be a positive number.',
    );
  }

  if (startTime <= 0) {
    throw new Error(
      'Invalid erc20-token-allowance permission: startTime must be a positive number.',
    );
  }

  const erc20TransferAmountCaveat: Caveat = {
    enforcer: contracts.erc20TransferAmountEnforcer,
    terms: createERC20TransferAmountTerms({
      tokenAddress,
      maxAmount: allowanceAmountBigInt,
    }),
    args: '0x',
  };

  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({ maxValue: 0n }),
    args: '0x',
  };

  const timestampCaveat: Caveat = {
    enforcer: contracts.timestampEnforcer,
    terms: createTimestampTerms({
      afterThreshold: startTime,
      beforeThreshold: 0,
    }),
    args: '0x',
  };

  return [erc20TransferAmountCaveat, valueLteCaveat, timestampCaveat];
}
