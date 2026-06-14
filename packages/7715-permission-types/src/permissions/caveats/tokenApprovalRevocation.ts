import { decodeApprovalRevocationTerms } from '@metamask/delegation-core';

import type { TokenApprovalRevocationPermission } from '../../types';
import { expiryRuleDecoder } from '../rules/expiry';
import type {
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DecodedPermissionData,
  MakePermissionDecoderConfig,
} from '../types';
import { getTermsByEnforcer } from '../utils';

/**
 * Builds the configuration for the token-approval-revocation permission decoder.
 *
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns The token-approval-revocation permission decoder configuration.
 */
export function makeTokenApprovalRevocationDecoderConfig(
  contractAddresses: ChecksumEnforcersByChainId,
): MakePermissionDecoderConfig {
  const { timestampEnforcer, approvalRevocationEnforcer, nonceEnforcer } =
    contractAddresses;

  return {
    permissionType: 'token-approval-revocation',
    contractAddresses,
    optionalEnforcers: [
      timestampEnforcer, // expiry rule
    ],
    requiredEnforcers: {
      [approvalRevocationEnforcer]: 1,
      [nonceEnforcer]: 1,
    },
    rules: [expiryRuleDecoder],
    validateAndDecodeData,
  };
}

/**
 * Decodes token-approval-revocation permission data from caveats; throws on invalid.
 *
 * @param caveats - Caveats from the permission context (checksummed).
 * @param contractAddresses - Checksummed enforcer addresses for the chain.
 * @returns Decoded approval-revocation capability flags.
 */
function validateAndDecodeData(
  caveats: ChecksumCaveat[],
  contractAddresses: ChecksumEnforcersByChainId,
): DecodedPermissionData<TokenApprovalRevocationPermission> {
  const { approvalRevocationEnforcer } = contractAddresses;

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: approvalRevocationEnforcer,
  });

  const {
    erc20Approve,
    erc721Approve,
    erc721SetApprovalForAll,
    permit2Approve,
    permit2Lockdown,
    permit2InvalidateNonces,
  } = decodeApprovalRevocationTerms(terms);

  return {
    erc20Approve,
    erc721Approve,
    erc721SetApprovalForAll,
    permit2Approve,
    permit2Lockdown,
    permit2InvalidateNonces,
  };
}
