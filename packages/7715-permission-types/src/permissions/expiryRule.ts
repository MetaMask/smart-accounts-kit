import type { RuleDecoder } from './types';
import { extractExpiryFromCaveatTerms, getTermsByEnforcer } from './utils';

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
export const expiryRule: RuleDecoder = ({ contractAddresses, caveats }) => {
  const { timestampEnforcer } = contractAddresses;

  const expiryTerms = getTermsByEnforcer({
    caveats,
    enforcer: timestampEnforcer,
    throwIfNotFound: false,
  });

  if (!expiryTerms) {
    return null;
  }

  return {
    type: EXECUTION_PERMISSION_EXPIRY_RULE_TYPE,
    data: { timestamp: extractExpiryFromCaveatTerms(expiryTerms) },
  };
};
