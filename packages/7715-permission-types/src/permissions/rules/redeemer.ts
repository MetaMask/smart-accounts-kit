import { decodeRedeemerTerms } from '@metamask/delegation-core';
import { getChecksumAddress } from '@metamask/utils';

import type { Hex } from '../../types';
import type { RuleDecoder } from '../types';
import { getTermsByEnforcer } from '../utils';

export const EXECUTION_PERMISSION_REDEEMER_RULE_TYPE = 'redeemer' as const;

/**
 * Execution permission rule restricting which addresses may redeem the delegation
 * (on-chain RedeemerEnforcer caveat).
 */
export type RedeemerRule = {
  type: 'redeemer';
  data: {
    addresses: Hex[];
  };
};

/**
 * Rule decoder that extracts a redeemer allowlist from a RedeemerEnforcer caveat.
 *
 * @param options0 - Rule decoder arguments.
 * @param options0.contractAddresses - Checksummed enforcer addresses for the chain.
 * @param options0.caveats - Checksummed caveats from the delegation.
 * @returns The decoded redeemer rule when present, otherwise `null`.
 */
export const redeemerRuleDecoder: RuleDecoder = ({
  contractAddresses,
  caveats,
}) => {
  const { redeemerEnforcer } = contractAddresses;

  const terms = getTermsByEnforcer({
    caveats,
    enforcer: redeemerEnforcer,
    throwIfNotFound: false,
  });

  if (!terms) {
    return null;
  }

  const { redeemers } = decodeRedeemerTerms(terms);

  const addresses = redeemers.map(getChecksumAddress);

  return {
    type: EXECUTION_PERMISSION_REDEEMER_RULE_TYPE,
    data: {
      addresses,
    },
  };
};
