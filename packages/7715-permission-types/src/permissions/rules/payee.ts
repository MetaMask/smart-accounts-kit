import {
  decodeAllowedCalldataTerms,
  decodeAllowedTargetsTerms,
} from '@metamask/delegation-core';
import { getChecksumAddress } from '@metamask/utils';

import type { Hex } from '../../types';
import type { RuleDecoder } from '../types';
import { getByteLength } from '../utils';

export const EXECUTION_PERMISSION_PAYEE_RULE_TYPE = 'payee' as const;

const ERC20_TRANSFER_PAYEE_START_INDEX = 4;
const ERC20_PAYEE_VALUE_BYTE_LENGTH = 32;

/**
 * Execution permission rule restricting which addresses may receive payments
 * (on-chain AllowedCalldataEnforcer / AllowedTargetsEnforcer caveat).
 */
export type PayeeRule = {
  type: 'payee';
  data: {
    addresses: Hex[];
  };
};

/**
 * Rule decoder for ERC-20 style payees from AllowedCalldataEnforcer caveats.
 *
 * @param options0 - Rule decoder arguments.
 * @param options0.contractAddresses - Checksummed enforcer addresses for the chain.
 * @param options0.caveats - Checksummed caveats from the delegation.
 * @param options0.requiredEnforcers - Required enforcer counts for this decoder.
 * @returns The decoded payee rule when present, otherwise `null`.
 */
export const erc20PayeeRuleDecoder: RuleDecoder = ({
  contractAddresses,
  caveats,
  requiredEnforcers,
}) => {
  const { allowedCalldataEnforcer } = contractAddresses;

  if (requiredEnforcers.has(allowedCalldataEnforcer)) {
    throw new Error(
      'Invalid payee caveats: payee enforcer may not be a required caveat',
    );
  }

  const matchingCaveats = caveats.filter(
    (caveat) => caveat.enforcer === allowedCalldataEnforcer,
  );

  if (matchingCaveats.length === 0) {
    return null;
  }

  if (matchingCaveats.length > 1) {
    throw new Error(
      'Invalid payee caveats: multiple AllowedCalldataEnforcer caveats',
    );
  }

  const [caveat] = matchingCaveats;
  if (!caveat) {
    throw new Error(
      'Invalid payee caveats: multiple AllowedCalldataEnforcer caveats',
    );
  }

  const decoded = decodeAllowedCalldataTerms(caveat.terms);

  if (decoded.startIndex !== ERC20_TRANSFER_PAYEE_START_INDEX) {
    throw new Error(
      `Invalid payee caveat: AllowedCalldataEnforcer startIndex must be ${ERC20_TRANSFER_PAYEE_START_INDEX}`,
    );
  }

  if (getByteLength(decoded.value) !== ERC20_PAYEE_VALUE_BYTE_LENGTH) {
    throw new Error(
      `Invalid payee caveat: AllowedCalldataEnforcer value must be ${ERC20_PAYEE_VALUE_BYTE_LENGTH} bytes long`,
    );
  }

  const address: Hex = `0x${decoded.value.slice(-40)}`;

  return {
    type: EXECUTION_PERMISSION_PAYEE_RULE_TYPE,
    data: { addresses: [getChecksumAddress(address)] },
  };
};

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
