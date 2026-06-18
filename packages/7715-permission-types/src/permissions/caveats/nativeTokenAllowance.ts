import { hexToNumber } from '@metamask/utils';

import type { NativeTokenAllowancePermission } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { nativePayeeRuleDecoder } from '../rules/payee';
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
 * Builds the configuration for the native-token-allowance permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The native-token-allowance permission decoder configuration.
 */
export function makeNativeTokenAllowanceDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): MakePermissionDecoderConfig {
  const {
    timestampEnforcer,
    nativeTokenPeriodicEnforcer,
    exactCalldataEnforcer,
    nonceEnforcer,
    allowedTargetsEnforcer,
    redeemerEnforcer,
  } = contractAddresses;

  return {
    permissionType: 'native-token-allowance',
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
 * Decodes native-token-allowance permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded allowance terms.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<NativeTokenAllowancePermission> {
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

  const EXPECTED_TERMS_BYTELENGTH = 96; // 32 + 32 + 32

  if (getByteLength(terms) !== EXPECTED_TERMS_BYTELENGTH) {
    throw new Error('Invalid native-token-allowance terms: expected 96 bytes');
  }

  const [allowanceAmount, periodDurationRaw, startTimeRaw] = splitHex(
    terms,
    [32, 32, 32],
  );

  if (periodDurationRaw.toLowerCase() !== UINT256_MAX) {
    throw new Error(
      'Invalid native-token-allowance terms: periodDuration must be UINT256_MAX',
    );
  }

  const startTime = hexToNumber(startTimeRaw);

  if (startTime === 0) {
    throw new Error(
      'Invalid native-token-allowance terms: startTime must be a positive number',
    );
  }

  if (allowanceAmount === ZERO_32_BYTES) {
    throw new Error(
      'Invalid native-token-allowance terms: allowanceAmount must be a positive number',
    );
  }

  return { allowanceAmount, startTime };
}
