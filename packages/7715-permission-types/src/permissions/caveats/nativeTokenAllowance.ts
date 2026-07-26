import type { Caveat } from '@metamask/delegation-core';
import {
  createExactCalldataTerms,
  createNativeTokenTransferAmountTerms,
  createTimestampTerms,
  decodeNativeTokenTransferAmountTerms,
  decodeTimestampTerms,
} from '@metamask/delegation-core';
import { bigIntToHex, hexToBigInt } from '@metamask/utils';

import type { NativeTokenAllowancePermission, Populated } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { nativePayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import { startTimeRuleDecoder } from '../rules/startTime';
import type {
  ChecksumCaveat,
  EnforcerAddressesByName,
  DecodedPermissionData,
  PermissionDecoderConfig,
} from '../types';
import { getTermsByEnforcer } from '../utils';

/**
 * Builds the configuration for the native-token-allowance permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The native-token-allowance permission decoder configuration.
 */
export function makeNativeTokenAllowanceDecoderConfig(
  contractAddresses: EnforcerAddressesByName,
): PermissionDecoderConfig {
  const {
    timestampEnforcer,
    nativeTokenTransferAmountEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'native-token-allowance',
    contractAddresses,
    optionalEnforcers: [
      redeemerEnforcer, // redeemer rule
      allowedTargetsEnforcer, // payee rule
    ],
    requiredEnforcers: {
      [nativeTokenTransferAmountEnforcer]: 1,
      [exactCalldataEnforcer]: 1,
      [timestampEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [
      expiryRuleDecoder,
      startTimeRuleDecoder,
      redeemerRuleDecoder,
      nativePayeeRuleDecoder,
    ],
    validateAndDecodeData,
  };
}

/**
 * Decodes native-token-allowance permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded allowance terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: EnforcerAddressesByName,
): DecodedPermissionData<NativeTokenAllowancePermission> {
  const {
    nativeTokenTransferAmountEnforcer,
    exactCalldataEnforcer,
    timestampEnforcer,
  } = contractAddresses;

  const exactCalldataTerms = getTermsByEnforcer({
    caveats,
    enforcer: exactCalldataEnforcer,
  });

  if (exactCalldataTerms !== '0x') {
    throw new Error('Invalid exact-calldata terms: must be 0x');
  }

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: nativeTokenTransferAmountEnforcer,
  });

  const { maxAmount } = decodeNativeTokenTransferAmountTerms(terms);

  if (maxAmount === 0n) {
    throw new Error(
      'Invalid native-token-allowance terms: allowanceAmount must be a positive number',
    );
  }

  const allowanceAmount = bigIntToHex(maxAmount);

  const timestampTerms = getTermsByEnforcer({
    caveats,
    enforcer: timestampEnforcer,
  });

  const { afterThreshold: startTime } = decodeTimestampTerms(timestampTerms);

  if (startTime === 0) {
    throw new Error(
      'Invalid native-token-allowance terms: startTime must be a positive number',
    );
  }

  return { allowanceAmount, startTime };
}

/**
 * Enforcers required to build native token allowance caveats.
 */
export type NativeTokenAllowanceEnforcers = Pick<
  EnforcerAddressesByName,
  | 'nativeTokenTransferAmountEnforcer'
  | 'exactCalldataEnforcer'
  | 'timestampEnforcer'
>;

/**
 * Builds the native-token-allowance caveats required for this permission type.
 *
 * @param options0 - Caveat builder arguments.
 * @param options0.permission - Fully populated native-token-allowance permission data.
 * @param options0.contracts - Enforcer addresses used to construct caveats.
 * @returns The native token allowance, exact-calldata, and start-time caveats.
 */
export function createNativeTokenAllowanceCaveats({
  permission,
  contracts,
}: {
  permission: Populated<NativeTokenAllowancePermission>;
  contracts: NativeTokenAllowanceEnforcers;
}): Caveat[] {
  const { allowanceAmount, startTime } = permission.data;
  const allowanceAmountBigInt = hexToBigInt(allowanceAmount);

  if (allowanceAmountBigInt === 0n) {
    throw new Error(
      'Invalid native-token-allowance permission: allowanceAmount must be a positive number.',
    );
  }

  if (startTime <= 0) {
    throw new Error(
      'Invalid native-token-allowance permission: startTime must be a positive number.',
    );
  }

  const nativeTokenTransferAmountCaveat: Caveat = {
    enforcer: contracts.nativeTokenTransferAmountEnforcer,
    terms: createNativeTokenTransferAmountTerms({
      maxAmount: allowanceAmountBigInt,
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({ calldata: '0x' }),
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

  return [
    nativeTokenTransferAmountCaveat,
    exactCalldataCaveat,
    timestampCaveat,
  ];
}
