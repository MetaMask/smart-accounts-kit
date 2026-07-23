import { decodeTimestampTerms } from '@metamask/delegation-core';

import type { RuleDecoder } from '../types';
import { getTermsByEnforcer } from '../utils';

export const EXECUTION_PERMISSION_START_TIME_RULE_TYPE = 'startTime' as const;

/**
 * Execution permission rule derived from the TimestampEnforcer's afterThreshold.
 */
export type StartTimeRule = {
  type: 'startTime';
  data: {
    startTime: number;
  };
};

/**
 * Rule decoder that extracts the start-time threshold from a TimestampEnforcer
 * caveat, when present.
 *
 * @param options0 - Rule decoder arguments.
 * @param options0.contractAddresses - Checksummed enforcer addresses for the chain.
 * @param options0.caveats - Checksummed caveats from the delegation.
 * @returns The decoded start-time rule when present, otherwise `null`.
 */
export const startTimeRuleDecoder: RuleDecoder = ({
  contractAddresses,
  caveats,
}) => {
  const { timestampEnforcer } = contractAddresses;

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: timestampEnforcer,
    throwIfNotFound: false,
  });

  if (!terms) {
    return null;
  }

  if (terms.length !== 66) {
    throw new Error('Invalid TimestampEnforcer terms length');
  }

  const { afterThreshold } = decodeTimestampTerms(terms);
  const startTime = Number(afterThreshold);

  if (startTime <= 0) {
    return null;
  }

  return {
    type: EXECUTION_PERMISSION_START_TIME_RULE_TYPE,
    data: { startTime },
  };
};
