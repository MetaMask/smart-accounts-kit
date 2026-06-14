import { decodeTimestampTerms } from '@metamask/delegation-core';

import type { RuleDecoder } from '../types';
import { getTermsByEnforcer } from '../utils';

export const EXECUTION_PERMISSION_EXPIRY_RULE_TYPE = 'expiry' as const;

/**
 * Execution permission rule derived from TimestampEnforcer caveats.
 */
export type ExpiryRule = {
  type: 'expiry';
  data: {
    timestamp: number;
  };
};

/**
 * Rule decoder that extracts the expiry timestamp from a TimestampEnforcer
 * caveat, when present.
 *
 * @param options0 - Rule decoder arguments.
 * @param options0.contractAddresses - Checksummed enforcer addresses for the chain.
 * @param options0.caveats - Checksummed caveats from the delegation.
 * @returns The decoded expiry rule when present, otherwise `null`.
 */
export const expiryRuleDecoder: RuleDecoder = ({
  contractAddresses,
  caveats,
}) => {
  const { timestampEnforcer } = contractAddresses;

  const expiryTerms = getTermsByEnforcer({
    caveats,
    enforcer: timestampEnforcer,
    throwIfNotFound: false,
  });

  if (!expiryTerms) {
    return null;
  }

  if (expiryTerms.length !== 66) {
    throw new Error('Invalid TimestampEnforcer terms length');
  }

  const decodedTerms = decodeTimestampTerms(expiryTerms);
  const timestampBeforeThreshold = Number(decodedTerms.beforeThreshold);
  const timestampAfterThreshold = Number(decodedTerms.afterThreshold);

  if (timestampBeforeThreshold <= 0) {
    throw new Error(
      'Invalid expiry: timestampBeforeThreshold must be greater than 0',
    );
  }

  if (timestampAfterThreshold !== 0) {
    throw new Error('Invalid expiry: timestampAfterThreshold must be 0');
  }

  return {
    type: EXECUTION_PERMISSION_EXPIRY_RULE_TYPE,
    data: { timestamp: timestampBeforeThreshold },
  };
};
