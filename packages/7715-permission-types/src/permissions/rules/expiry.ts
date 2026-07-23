import { decodeTimestampTerms } from '@metamask/delegation-core';

import type { RuleDecoder } from '../types';
import { getTermsByEnforcer } from '../utils';

export const EXECUTION_PERMISSION_EXPIRY_RULE_TYPE = 'expiry' as const;

/**
 * Execution permission rule derived from TimestampEnforcer caveats.
 *
 * data.timestamp - the expiry (beforeThreshold), when the enforcer sets an upper bound.
 * data.startTime - the start time (afterThreshold), when the enforcer sets a lower bound.
 */
export type ExpiryRule = {
  type: 'expiry';
  data: {
    timestamp?: number;
    startTime?: number;
  };
};

/**
 * Rule decoder that extracts the expiry and/or start-time thresholds from a
 * TimestampEnforcer caveat, when present.
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

  return {
    type: EXECUTION_PERMISSION_EXPIRY_RULE_TYPE,
    data: {
      ...(timestampBeforeThreshold > 0 && {
        timestamp: timestampBeforeThreshold,
      }),
      ...(timestampAfterThreshold > 0 && {
        startTime: timestampAfterThreshold,
      }),
    },
  };
};
