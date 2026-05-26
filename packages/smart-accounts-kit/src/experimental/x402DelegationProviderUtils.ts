import {
  createAllowedCalldataTerms,
  createRedeemerTerms,
  createTimestampTerms,
  decodeRedeemerTerms,
  decodeTimestampTerms,
} from '@metamask/delegation-core';
import { parseCaipChainId } from '@metamask/utils';
import type { Account, Address, Hex } from 'viem';

import type { Caveats } from '../caveatBuilder';
import { resolveCaveats } from '../caveatBuilder';
import { ScopeType } from '../constants';
import type { createOpenDelegation } from '../delegation';
import { decodeDelegations } from '../delegation';
import { getSmartAccountsEnvironment } from '../smartAccountsEnvironment';
import type {
  Caveat,
  Delegation,
  PermissionContext,
  SmartAccountsEnvironment,
} from '../types';
import type {
  MaybeDeferred,
  PaymentRequirements,
  x402DelegationProviderConfig,
} from './x402DelegationProviderTypes';
import { generateSalt } from '../utils/';

/**
 * Inputs for redeemer constraint enforcement.
 */
type EnsureRedeemerSufficientlyConstrainedParams = {
  redeemerEnforcer: Hex;
  caveats: Caveat[];
  existingDelegations: Delegation[];
  redeemerAddresses: Hex[];
  requireRedeemers: boolean;
};

/**
 * Inputs for payee constraint enforcement.
 */
type EnsurePayeeSufficientlyConstrainedParams = {
  allowedCalldataEnforcer: Hex;
  caveats: Caveat[];
  existingDelegations: Delegation[];
  payee: Hex;
};

/**
 * Inputs for expiry constraint enforcement.
 */
type EnsureExpirySufficientlyConstrainedParams = {
  timestampEnforcer: Hex;
  caveats: Caveat[];
  existingDelegations: Delegation[];
  expirySeconds: number;
};

/**
 * Resolved context required to build and sign an x402 delegation.
 */
export type DelegationCreationContext = {
  account: Account;
  delegationManager: Address;
  existingDelegations: Delegation[];
  createDelegationConfig: Parameters<typeof createOpenDelegation>[0];
};

/**
 * Inputs for resolving delegation caveats with x402-specific constraints.
 */
export type Resolvex402DelegationCaveatsParams = {
  environment: SmartAccountsEnvironment;
  caveatsConfig: Caveats | undefined;
  existingDelegations: Delegation[];
  facilitatorAddresses: Hex[] | undefined;
  payee: Hex;
  expirySeconds?: number;
  requireRedeemers: boolean;
  redeemerAddresses: Address[] | undefined;
};

/**
 * Resolves eager or deferred values against payment requirements.
 *
 * @param maybeDeferred - Value or async resolver function.
 * @param requirements - Payment requirements passed to deferred resolvers.
 * @returns The resolved value, or undefined when no value is provided.
 */
async function resolveMaybeDeferred<TResult>(
  maybeDeferred: MaybeDeferred<TResult>,
  requirements: PaymentRequirements,
): Promise<TResult> {
  if (typeof maybeDeferred === 'function') {
    const deferred = maybeDeferred as (
      deferredRequirements: PaymentRequirements,
    ) => Promise<TResult> | TResult;

    return await deferred(requirements);
  }

  return maybeDeferred;
}

/**
 * Parses an EIP-155 CAIP network identifier into a numeric chain ID.
 *
 * @param network - CAIP network identifier (for example, `eip155:1`).
 * @returns Parsed numeric chain ID.
 * @throws If the CAIP namespace is not `eip155`.
 */
export function parseEip155ChainId(
  network: PaymentRequirements['network'],
): number {
  const { namespace, reference } = parseCaipChainId(
    network as `${string}:${string}`,
  );

  if (namespace !== 'eip155') {
    throw new Error('Unsupported chain namespace');
  }

  return parseInt(reference, 10);
}

/**
 * ERC-20 `transfer(address to, uint256 value)` calldata index for `to`.
 */
const TRANSFER_PAYEE_INDEX = 4;

/**
 * Normalizes an address-like hex string for case-insensitive comparisons.
 *
 * @param address - Address value to normalize.
 * @returns Lowercased hex string.
 */
const normalizeAddress = (address: Address): Address =>
  address.toLowerCase() as Address;

/**
 * Returns whether any caveat in local or inherited delegations matches a predicate.
 *
 * @param caveats - Current caveat list.
 * @param delegations - Existing delegations whose caveats should also be searched.
 * @param match - Predicate used to match caveats.
 * @returns True when at least one caveat satisfies `match`.
 */
const hasMatchingCaveats = (
  caveats: Caveat[],
  delegations: Delegation[],
  match: (caveat: Caveat) => boolean,
): boolean => {
  for (const caveat of caveats) {
    if (match(caveat)) {
      return true;
    }
  }

  for (const delegation of delegations) {
    for (const caveat of delegation.caveats) {
      if (match(caveat)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Ensures caveats include an expiry timestamp constraint when requested.
 *
 * If an existing timestamp caveat already enforces a tighter (earlier) or equal
 * `validBefore` threshold than requested, caveats are returned unchanged.
 * Otherwise a new timestamp caveat is appended with `afterThreshold = 0`.
 *
 * @param options0 - Expiry constraint evaluation inputs.
 * @param options0.timestampEnforcer - Address of the TimestampEnforcer caveat contract.
 * @param options0.caveats - Currently resolved caveats for the delegation being created.
 * @param options0.existingDelegations - Existing parent-chain delegations to inspect for inherited constraints.
 * @param options0.expirySeconds - Relative expiry from "now" in seconds.
 * @returns The original caveats when sufficiently constrained, otherwise caveats with a timestamp caveat appended.
 */
export const ensureExpirySufficientlyConstrained = ({
  timestampEnforcer,
  caveats,
  existingDelegations,
  expirySeconds,
}: EnsureExpirySufficientlyConstrainedParams): Caveat[] => {
  const beforeThreshold = Math.floor(Date.now() / 1000) + expirySeconds;
  const timestampEnforcerNormalized = normalizeAddress(timestampEnforcer);

  const hasSupersedingTimestampConstraint = hasMatchingCaveats(
    caveats,
    existingDelegations,
    (caveat) => {
      if (normalizeAddress(caveat.enforcer) !== timestampEnforcerNormalized) {
        return false;
      }

      const { beforeThreshold: existingBeforeThreshold } = decodeTimestampTerms(
        caveat.terms,
      );
      return (
        existingBeforeThreshold !== 0 &&
        existingBeforeThreshold <= beforeThreshold
      );
    },
  );

  if (hasSupersedingTimestampConstraint) {
    return caveats;
  }

  const timestampCaveat: Caveat = {
    enforcer: timestampEnforcer,
    terms: createTimestampTerms({
      afterThreshold: 0,
      beforeThreshold,
    }),
    args: '0x',
  };

  return [...caveats, timestampCaveat];
};

/**
 * Ensures caveats include a sufficiently strict redeemer constraint.
 *
 * Returns the caveat list unchanged when an existing redeemer caveat is already
 * strict enough, or appends a new redeemer caveat scoped to facilitator addresses.
 *
 * @param options0 - Redeemer constraint evaluation inputs.
 * @param options0.redeemerEnforcer - Address of the redeemer enforcer caveat contract.
 * @param options0.caveats - Currently resolved caveats for the delegation being created.
 * @param options0.existingDelegations - Existing parent-chain delegations to inspect for inherited constraints.
 * @param options0.redeemerAddresses - Optional addresses to which redemption should be constrained.
 * @param options0.requireRedeemers - Whether at least one redeemer constraint must exist when no redeemer addresses are supplied.
 * @returns The original caveats when sufficiently constrained, otherwise caveats with a redeemer caveat appended.
 * @throws If no facilitator addresses are provided and no redeemer constraint exists.
 */
export const ensureRedeemerSufficientlyConstrained = ({
  redeemerEnforcer,
  caveats,
  existingDelegations,
  redeemerAddresses,
  requireRedeemers,
}: EnsureRedeemerSufficientlyConstrainedParams): Caveat[] => {
  const redeemerAddressNormalized = normalizeAddress(redeemerEnforcer);

  if (redeemerAddresses.length === 0) {
    if (!requireRedeemers) {
      return caveats;
    }

    const hasExistingRedeemerCaveat = hasMatchingCaveats(
      caveats,
      existingDelegations,
      ({ enforcer }) =>
        normalizeAddress(enforcer) === redeemerAddressNormalized,
    );

    if (!hasExistingRedeemerCaveat) {
      throw new Error(
        'Redeemer must be constrained, either in the specified `caveats`, `parentPermissionContext`, or the `PaymentRequirements` as `extra.facilitatorAddresses`.',
      );
    }

    return caveats;
  }

  const redeemerAddressesNormalized = redeemerAddresses.map(normalizeAddress);
  const redeemerAddressesSet = new Set(redeemerAddressesNormalized);

  const hasSupersedingRedeemerCaveat = hasMatchingCaveats(
    caveats,
    existingDelegations,
    (caveat) => {
      if (normalizeAddress(caveat.enforcer) !== redeemerAddressNormalized) {
        return false;
      }

      const allowedRedeemerAddresses = decodeRedeemerTerms(
        caveat.terms,
      ).redeemers.map(normalizeAddress);

      // If this redeemer caveat only allows facilitator addresses, it is sufficiently constrained.
      return allowedRedeemerAddresses.every((item) =>
        redeemerAddressesSet.has(item),
      );
    },
  );

  if (hasSupersedingRedeemerCaveat) {
    return caveats;
  }

  const redeemerCaveat: Caveat = {
    enforcer: redeemerEnforcer,
    terms: createRedeemerTerms({ redeemers: redeemerAddresses }),
    args: '0x',
  };

  return [...caveats, redeemerCaveat];
};

/**
 * Ensures caveats include an allowed-calldata constraint for the payment payee.
 *
 * Scans both the in-progress caveat list and parent delegation caveats for an
 * `AllowedCalldataEnforcer` caveat whose terms match the encoded payee calldata
 * constraint. If found, returns caveats unchanged; otherwise appends a payee caveat.
 *
 * @param options0 - Payee constraint evaluation inputs.
 * @param options0.allowedCalldataEnforcer - Address of the AllowedCalldataEnforcer caveat contract.
 * @param options0.caveats - Currently resolved caveats for the delegation being created.
 * @param options0.existingDelegations - Existing parent-chain delegations to inspect for inherited constraints.
 * @param options0.payee - Expected ERC-20 transfer recipient to enforce in calldata.
 * @returns The original caveats when an equivalent payee constraint exists, otherwise caveats with a payee caveat appended.
 */
export const ensurePayeeSufficientlyConstrained = ({
  allowedCalldataEnforcer,
  caveats,
  existingDelegations,
  payee,
}: EnsurePayeeSufficientlyConstrainedParams): Caveat[] => {
  const allowedCalldataTerms = createAllowedCalldataTerms({
    startIndex: TRANSFER_PAYEE_INDEX,
    value: payee,
  });

  const allowedCalldataEnforcerNormalized = normalizeAddress(
    allowedCalldataEnforcer,
  );

  const normalizedAllowedCalldataTerms = normalizeAddress(allowedCalldataTerms);

  const hasSupersedingAllowedCalldataConstraint = hasMatchingCaveats(
    caveats,
    existingDelegations,
    ({ enforcer, terms }) =>
      normalizeAddress(enforcer) === allowedCalldataEnforcerNormalized &&
      normalizeAddress(terms) === normalizedAllowedCalldataTerms,
  );

  if (hasSupersedingAllowedCalldataConstraint) {
    return caveats;
  }

  const payeeCaveat: Caveat = {
    enforcer: allowedCalldataEnforcer,
    terms: allowedCalldataTerms,
    args: '0x',
  };

  return [...caveats, payeeCaveat];
};

/**
 * Resolves caveats and applies x402-specific redeemer and payee constraints.
 *
 * @param options0 - Caveat resolution inputs.
 * @param options0.environment - Environment containing caveat enforcer addresses.
 * @param options0.caveatsConfig - Optional caveat builder config.
 * @param options0.existingDelegations - Existing parent-chain delegations.
 * @param options0.facilitatorAddresses - Optional facilitator addresses used for redeemer constraints.
 * @param options0.payee - Payee address used for allowed calldata constraints.
 * @param options0.expirySeconds - Optional relative expiry in seconds for adding timestamp constraints.
 * @param options0.requireRedeemers - Whether redeemer constraints are mandatory when no facilitator or configured redeemer addresses are present.
 * @param options0.redeemerAddresses - Optional redeemer addresses from provider config to merge with facilitator addresses.
 * @returns Caveats after redeemer and payee constraints are enforced.
 */
export const resolvex402DelegationCaveats = ({
  environment,
  caveatsConfig,
  existingDelegations,
  facilitatorAddresses,
  payee,
  expirySeconds,
  requireRedeemers,
  redeemerAddresses,
}: Resolvex402DelegationCaveatsParams): Caveat[] => {
  const {
    caveatEnforcers: {
      RedeemerEnforcer: redeemerEnforcer,
      AllowedCalldataEnforcer: allowedCalldataEnforcer,
      TimestampEnforcer: timestampEnforcer,
    },
  } = environment;

  if (!redeemerEnforcer) {
    throw new Error('RedeemerEnforcer not found in environment');
  }

  if (!allowedCalldataEnforcer) {
    throw new Error('AllowedCalldataEnforcer not found in environment');
  }

  if (!timestampEnforcer) {
    throw new Error('TimestampEnforcer not found in environment');
  }

  const initialCaveats = resolveCaveats({
    environment,
    caveats: caveatsConfig,
    // Resolve caveats first so downstream constraint checks can append as needed.
    // Scope is still attached later during delegation creation.
    isScopeOptional: true,
  });

  const allRedeemerAddresses = new Set(
    [...(facilitatorAddresses ?? []), ...(redeemerAddresses ?? [])].map(
      normalizeAddress,
    ),
  );

  const caveatsWithRedeemer = ensureRedeemerSufficientlyConstrained({
    redeemerEnforcer,
    caveats: initialCaveats,
    existingDelegations,
    redeemerAddresses: Array.from(allRedeemerAddresses),
    requireRedeemers,
  });

  const caveatsWithPayee = ensurePayeeSufficientlyConstrained({
    allowedCalldataEnforcer,
    caveats: caveatsWithRedeemer,
    existingDelegations,
    payee,
  });

  if (expirySeconds === undefined) {
    return caveatsWithPayee;
  }

  return ensureExpirySufficientlyConstrained({
    timestampEnforcer,
    caveats: caveatsWithPayee,
    existingDelegations,
    expirySeconds,
  });
};

/**
 * Builds the delegation creation context from provider config and requirements.
 *
 * @param config - Delegation provider config for context construction.
 * @param requirements - Payment requirements used to scope caveats.
 * @returns The resolved context used to create and sign a delegation.
 */
export const resolveDelegationCreationContext = async (
  config: x402DelegationProviderConfig,
  requirements: PaymentRequirements,
): Promise<DelegationCreationContext> => {
  const account = await resolveMaybeDeferred(config.account, requirements);
  const redeemersConfig = await resolveMaybeDeferred(
    config.redeemers,
    requirements,
  );

  const requireRedeemers = redeemersConfig?.requireRedeemers ?? false;
  const redeemerAddresses = await resolveMaybeDeferred(
    redeemersConfig?.addresses,
    requirements,
  );

  const specifiedEnvironment = await resolveMaybeDeferred(
    config.environment,
    requirements,
  );
  const environment =
    specifiedEnvironment ??
    getSmartAccountsEnvironment(parseEip155ChainId(requirements.network));

  const caveatsConfig: Caveats | undefined = await resolveMaybeDeferred(
    config.caveats,
    requirements,
  );
  const parentPermissionContext: PermissionContext | undefined =
    await resolveMaybeDeferred(config.parentPermissionContext, requirements);
  const expirySeconds = await resolveMaybeDeferred(
    config.expirySeconds,
    requirements,
  );

  const from =
    (await resolveMaybeDeferred(config.from, requirements)) ?? account.address;
  const salt =
    (await resolveMaybeDeferred(config.salt, requirements)) ?? generateSalt();

  const scope = {
    type: ScopeType.Erc20TransferAmount,
    tokenAddress: requirements.asset as Hex,
    maxAmount: BigInt(requirements.amount),
  } as const;

  const facilitatorAddresses = requirements.extra?.facilitatorAddresses as
    | Hex[]
    | undefined;

  const existingDelegations = parentPermissionContext
    ? decodeDelegations(parentPermissionContext)
    : [];

  const { DelegationManager: delegationManager } = environment;
  const caveats = resolvex402DelegationCaveats({
    environment,
    caveatsConfig,
    existingDelegations,
    facilitatorAddresses,
    payee: requirements.payTo as Hex,
    expirySeconds,
    requireRedeemers,
    redeemerAddresses,
  });

  let createDelegationConfig: Parameters<typeof createOpenDelegation>[0];

  if (parentPermissionContext) {
    const parentDelegation = existingDelegations[0];

    if (!parentDelegation) {
      throw new Error('Parent permission context is not a valid delegation');
    }

    createDelegationConfig = {
      environment,
      from,
      caveats,
      salt,
      scope,
      parentDelegation,
    };
  } else {
    createDelegationConfig = {
      environment,
      from,
      caveats,
      salt,
      scope,
    };
  }

  return {
    account,
    delegationManager,
    existingDelegations,
    createDelegationConfig,
  };
};
