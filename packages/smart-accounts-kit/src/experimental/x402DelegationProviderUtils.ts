import {
  createAllowedCalldataTerms,
  createRedeemerTerms,
  decodeRedeemerTerms,
} from '@metamask/delegation-core';
import type { Account, Address, Hex } from 'viem';

import type { Caveats } from '../caveatBuilder';
import { resolveCaveats } from '../caveatBuilder';
import { ScopeType } from '../constants';
import type { createOpenDelegation } from '../delegation';
import { decodeDelegations } from '../delegation';
import type {
  Caveat,
  Delegation,
  PermissionContext,
  SmartAccountsEnvironment,
} from '../types';
import { generateSalt } from '../utils/';

type EnsureRedeemerSufficientlyConstrainedParams = {
  redeemerEnforcer: Hex;
  caveats: Caveat[];
  existingDelegations: Delegation[];
  facilitatorAddresses: Hex[] | undefined;
};

type EnsurePayeeSufficientlyConstrainedParams = {
  allowedCalldataEnforcer: Hex;
  caveats: Caveat[];
  existingDelegations: Delegation[];
  payee: Hex;
};

type Deferred<TResult, TRequirements> = (
  requirements: TRequirements,
) => TResult;

type MaybeDeferred<TResult, TRequirements> =
  | TResult
  | Deferred<TResult, TRequirements>;

type ResolveDelegationCreationContextRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
};

type ResolveDelegationCreationContextConfig = {
  account: Account;
  environment: SmartAccountsEnvironment;
  from?: Hex;
  salt?: Hex;
  caveats?: MaybeDeferred<
    Caveats | undefined,
    ResolveDelegationCreationContextRequirements
  >;
  parentPermissionContext?: MaybeDeferred<
    PermissionContext | undefined,
    ResolveDelegationCreationContextRequirements
  >;
};

export type DelegationCreationContext = {
  account: Account;
  delegationManager: Address;
  existingDelegations: Delegation[];
  createDelegationConfig: Parameters<typeof createOpenDelegation>[0];
};

export type Resolvex402DelegationCaveatsParams = {
  environment: SmartAccountsEnvironment;
  caveatsConfig: Caveats | undefined;
  existingDelegations: Delegation[];
  facilitatorAddresses: Hex[] | undefined;
  payee: Hex;
};

const resolveMaybeDeferred = async <TResult, TRequirements>(
  maybeDeferred: MaybeDeferred<TResult, TRequirements> | undefined,
  requirements: TRequirements,
): Promise<TResult | undefined> => {
  if (typeof maybeDeferred === 'function') {
    return (maybeDeferred as Deferred<TResult, TRequirements>)(requirements);
  }

  return maybeDeferred;
};

// ERC-20 transfer(to, value), `to` parameter starts at index 4
const TRANSFER_PAYEE_INDEX = 4;

const normalizeAddress = (address: Hex): string => address.toLowerCase();

const isSubset = (subset: string[], superset: string[]): boolean =>
  subset.every((item) => superset.includes(item));

const hasMatchingCaveats = (
  caveats: Caveat[],
  delegations: Delegation[],
  match: (caveat: Caveat) => boolean,
): boolean =>
  [...caveats, ...delegations.flatMap((delegation) => delegation.caveats)].some(
    match,
  );

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
 * @param options0.facilitatorAddresses - Optional facilitator addresses from payment requirements used to bound redeemers.
 * @returns The original caveats when sufficiently constrained, otherwise caveats with a redeemer caveat appended.
 * @throws If no facilitator addresses are provided and no redeemer constraint exists.
 */
export const ensureRedeemerSufficientlyConstrained = ({
  redeemerEnforcer,
  caveats,
  existingDelegations,
  facilitatorAddresses,
}: EnsureRedeemerSufficientlyConstrainedParams): Caveat[] => {
  const redeemerAddressNormalized = normalizeAddress(redeemerEnforcer);

  if (!facilitatorAddresses || facilitatorAddresses.length === 0) {
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

  const facilitatorAddressesNormalized =
    facilitatorAddresses.map(normalizeAddress);

  const hasSufficientlyConstrainedRedeemerCaveat = hasMatchingCaveats(
    caveats,
    existingDelegations,
    (caveat) => {
      if (normalizeAddress(caveat.enforcer) !== redeemerAddressNormalized) {
        return false;
      }

      const allowedRedeemerAddresses = decodeRedeemerTerms(
        caveat.terms,
      ).redeemers.map(normalizeAddress);

      // if this redeemer caveat only allows (some of) thefacilitator addresses, it is sufficiently constrained
      return isSubset(allowedRedeemerAddresses, facilitatorAddressesNormalized);
    },
  );

  if (hasSufficientlyConstrainedRedeemerCaveat) {
    return caveats;
  }

  const redeemerCaveat: Caveat = {
    enforcer: redeemerEnforcer,
    terms: createRedeemerTerms({ redeemers: facilitatorAddresses }),
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

  const hasMatchingAllowedCalldataConstraint = hasMatchingCaveats(
    caveats,
    existingDelegations,
    ({ enforcer, terms }) =>
      normalizeAddress(enforcer) === allowedCalldataEnforcerNormalized &&
      normalizeAddress(terms) === normalizedAllowedCalldataTerms,
  );

  if (hasMatchingAllowedCalldataConstraint) {
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
 * @returns Caveats after redeemer and payee constraints are enforced.
 */
export const resolvex402DelegationCaveats = ({
  environment,
  caveatsConfig,
  existingDelegations,
  facilitatorAddresses,
  payee,
}: Resolvex402DelegationCaveatsParams): Caveat[] => {
  const {
    caveatEnforcers: {
      RedeemerEnforcer: redeemerEnforcer,
      AllowedCalldataEnforcer: allowedCalldataEnforcer,
    },
  } = environment;

  if (!redeemerEnforcer) {
    throw new Error('RedeemerEnforcer not found in environment');
  }

  if (!allowedCalldataEnforcer) {
    throw new Error('AllowedCalldataEnforcer not found in environment');
  }

  const initialCaveats = resolveCaveats({
    environment,
    caveats: caveatsConfig,
    // Resolve caveats first so downstream constraint checks can append as needed.
    // Scope is still attached later during delegation creation.
    isScopeOptional: true,
  });

  const caveatsWithRedeemer = ensureRedeemerSufficientlyConstrained({
    redeemerEnforcer,
    caveats: initialCaveats,
    existingDelegations,
    facilitatorAddresses,
  });

  const caveatsWithPayee = ensurePayeeSufficientlyConstrained({
    allowedCalldataEnforcer,
    caveats: caveatsWithRedeemer,
    existingDelegations,
    payee,
  });

  return caveatsWithPayee;
};

/**
 * Builds the delegation creation context from provider config and requirements.
 *
 * @param config - Delegation provider config for context construction.
 * @param requirements - Payment requirements used to scope caveats.
 * @returns The resolved context used to create and sign a delegation.
 */
export const resolveDelegationCreationContext = async (
  config: ResolveDelegationCreationContextConfig,
  requirements: ResolveDelegationCreationContextRequirements,
): Promise<DelegationCreationContext> => {
  const caveatsConfig = await resolveMaybeDeferred(
    config.caveats,
    requirements,
  );
  const parentPermissionContext = await resolveMaybeDeferred(
    config.parentPermissionContext,
    requirements,
  );

  const { account } = config;
  const from = config.from ?? account.address;
  const salt = config.salt ?? generateSalt();

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

  const { DelegationManager: delegationManager } = config.environment;
  const caveats = resolvex402DelegationCaveats({
    environment: config.environment,
    caveatsConfig,
    existingDelegations,
    facilitatorAddresses,
    payee: requirements.payTo as Hex,
  });

  let createDelegationConfig: Parameters<typeof createOpenDelegation>[0];

  if (parentPermissionContext) {
    const parentDelegation = existingDelegations[0];

    if (!parentDelegation) {
      throw new Error('Parent permission context is not a valid delegation');
    }

    createDelegationConfig = {
      environment: config.environment,
      from,
      caveats,
      salt,
      scope,
      parentDelegation,
    };
  } else {
    createDelegationConfig = {
      environment: config.environment,
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
