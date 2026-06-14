import { decodeERC20StreamingTerms } from '@metamask/delegation-core';
import { bigIntToHex } from '@metamask/utils';

import type { Erc20TokenStreamPermission } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import { erc20PayeeRuleDecoder } from '../rules/payee';
import { redeemerRuleDecoder } from '../rules/redeemer';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  MakePermissionDecoderConfig,
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
): MakePermissionDecoderConfig {
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
