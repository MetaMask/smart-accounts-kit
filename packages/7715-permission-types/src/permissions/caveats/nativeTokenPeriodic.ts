import type { Caveat } from '@metamask/delegation-core';
import {
  createExactCalldataTerms,
  createNativeTokenPeriodTransferTerms,
  decodeNativeTokenPeriodTransferTerms,
} from '@metamask/delegation-core';
import { bigIntToHex, hexToBigInt } from '@metamask/utils';

import type { NativeTokenPeriodicPermission, Populated } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { nativePayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  PermissionDecoderConfig,
} from '../types';
import { getTermsByEnforcer, MAX_PERIOD_DURATION } from '../utils';

/**
 * Builds the configuration for the native-token-periodic permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The native-token-periodic permission decoder configuration.
 */
export function makeNativeTokenPeriodicDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): PermissionDecoderConfig {
  const {
    timestampEnforcer,
    nativeTokenPeriodicEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'native-token-periodic',
    contractAddresses,
    optionalEnforcers: [
      timestampEnforcer, // expiry rule
      redeemerEnforcer, // redeemer rule
      allowedTargetsEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [nativeTokenPeriodicEnforcer]: 1,
      [exactCalldataEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [expiryRuleDecoder, redeemerRuleDecoder, nativePayeeRuleDecoder],
    validateAndDecodeData,
  };
}

/**
 * Decodes native-token-periodic permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded periodic terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<NativeTokenPeriodicPermission> {
  const { nativeTokenPeriodicEnforcer, exactCalldataEnforcer } =
    contractAddresses;

  const exactCalldataTerms = getTermsByEnforcer({
    caveats,
    enforcer: exactCalldataEnforcer,
  });

  if (exactCalldataTerms !== '0x') {
    throw new Error('Invalid exact-calldata terms: must be 0x');
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: nativeTokenPeriodicEnforcer,
  });
  const {
    periodAmount,
    periodDuration,
    startDate: startTime,
  } = decodeNativeTokenPeriodTransferTerms(terms);

  if (periodAmount === 0n) {
    throw new Error(
      'Invalid native-token-periodic terms: periodAmount must be a positive number',
    );
  }

  if (periodDuration === 0) {
    throw new Error(
      'Invalid native-token-periodic terms: periodDuration must be a positive number',
    );
  }

  if (periodDuration > MAX_PERIOD_DURATION) {
    throw new Error(
      'Invalid native-token-periodic terms: periodDuration must be less than or equal to MAX_PERIOD_DURATION',
    );
  }

  if (startTime === 0) {
    throw new Error(
      'Invalid native-token-periodic terms: startTime must be a positive number',
    );
  }

  return {
    periodAmount: bigIntToHex(periodAmount),
    periodDuration,
    startTime,
  };
}

/**
 * Enforcers required to build native token periodic caveats.
 */
export type NativeTokenPeriodicEnforcers = Pick<
  ChecksumEnforcersByChainId,
  'nativeTokenPeriodicEnforcer' | 'exactCalldataEnforcer'
>;

/**
 * Builds the native-token-periodic caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated native-token-periodic permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The native token periodic and exact-calldata caveats.
 */
export function createNativeTokenPeriodicCaveats({
  permission,
  contracts,
}: {
  permission: Populated<NativeTokenPeriodicPermission>;
  contracts: NativeTokenPeriodicEnforcers;
}): Caveat[] {
  const { periodAmount, periodDuration, startTime } = permission.data;
  const periodAmountBigInt = hexToBigInt(periodAmount);

  if (periodAmountBigInt === 0n) {
    throw new Error(
      'Invalid native-token-periodic permission: periodAmount must be a positive number.',
    );
  }

  if (periodDuration <= 0) {
    throw new Error(
      'Invalid native-token-periodic permission: periodDuration must be a positive number.',
    );
  }

  if (periodDuration > MAX_PERIOD_DURATION) {
    throw new Error(
      'Invalid native-token-periodic permission: periodDuration must be less than or equal to MAX_PERIOD_DURATION.',
    );
  }

  if (startTime <= 0) {
    throw new Error(
      'Invalid native-token-periodic permission: startTime must be a positive number.',
    );
  }

  const nativeTokenPeriodTransferCaveat: Caveat = {
    enforcer: contracts.nativeTokenPeriodicEnforcer,
    terms: createNativeTokenPeriodTransferTerms({
      periodAmount: periodAmountBigInt,
      periodDuration,
      startDate: startTime,
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({ calldata: '0x' }),
    args: '0x',
  };

  return [nativeTokenPeriodTransferCaveat, exactCalldataCaveat];
}
