import { decodeAllowedTargetsTerms } from '@metamask/delegation-core';
import { getChecksumAddress } from '@metamask/utils';

import { EXECUTION_PERMISSION_PAYEE_RULE_TYPE } from './erc20PayeeRuleDecoder';
import type { RuleDecoder } from './types';

/**
 * Rule decoder for native-token style payees from AllowedTargetsEnforcer caveats.
 *
 * @param options0 - Rule decoder arguments.
 * @param options0.contractAddresses - Checksummed enforcer addresses for the chain.
 * @param options0.caveats - Checksummed caveats from the delegation.
 * @param options0.requiredEnforcers - Required enforcer counts for this decoder.
 * @returns The decoded payee rule when present, otherwise `null`.
 */
export const nativePayeeRuleDecoder: RuleDecoder = ({
  contractAddresses,
  caveats,
  requiredEnforcers,
}) => {
  const { allowedTargetsEnforcer } = contractAddresses;

  if (requiredEnforcers.has(allowedTargetsEnforcer)) {
    throw new Error(
      'Invalid payee caveats: payee enforcer may not be a required caveat',
    );
  }

  const matchingCaveats = caveats.filter(
    (caveat) => caveat.enforcer === allowedTargetsEnforcer,
  );

  if (matchingCaveats.length === 0) {
    return null;
  }

  if (matchingCaveats.length > 1) {
    throw new Error(
      'Invalid payee caveats: multiple AllowedTargetsEnforcer caveats',
    );
  }

  const [caveat] = matchingCaveats;
  if (!caveat) {
    throw new Error(
      'Invalid payee caveats: multiple AllowedTargetsEnforcer caveats',
    );
  }

  const decoded = decodeAllowedTargetsTerms(caveat.terms);

  return {
    type: EXECUTION_PERMISSION_PAYEE_RULE_TYPE,
    data: { addresses: decoded.targets.map(getChecksumAddress) },
  };
};
