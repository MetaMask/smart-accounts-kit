import {
  createRedeemerTerms,
  decodeRedeemerTerms,
} from '@metamask/delegation-core';
import type { Account, Address, Hex } from 'viem';

import type { Caveats } from '../caveatBuilder';
import { resolveCaveats } from '../caveatBuilder';
import type { ScopeConfig } from '../caveatBuilder/scope';
import { ScopeType } from '../constants';
import {
  createOpenDelegation,
  decodeDelegations,
  encodeDelegations,
  prepareSignDelegationTypedData,
} from '../delegation';
import type {
  Caveat,
  Delegation,
  PermissionContext,
  SmartAccountsEnvironment,
} from '../types';
import { generateSalt } from '../utils/';

/**
 * Payment requirement details supplied by an x402 server challenge.
 *
 * These values are used to scope and construct the delegation that will be
 * returned by a {@link x402DelegationProvider}.
 */
export type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
};

/**
 * Encoded delegation response consumed by x402 payment flows.
 *
 * The payload includes the delegation manager address, the encoded permission
 * context to use for execution, and the delegator account that signed it.
 */
export type x402DelegationProviderPaymentPayload = {
  delegationManager: `0x${string}`;
  permissionContext: `0x${string}`;
  delegator: `0x${string}`;
};

/**
 * Function that turns payment requirements into a signed delegation payload.
 */
export type x402DelegationProvider = (
  paymentRequirements: PaymentRequirements,
) => Promise<x402DelegationProviderPaymentPayload>;

type Deferred<TResult> = (requirements: PaymentRequirements) => TResult;

type MaybeDeferred<TResult> = TResult | Deferred<TResult>;

const resolveMaybeDeferred = async <TResult>(
  maybeDeferred: MaybeDeferred<TResult>,
  requirements: PaymentRequirements,
): Promise<TResult> => {
  if (typeof maybeDeferred === 'function') {
    return (maybeDeferred as Deferred<TResult>)(requirements);
  }

  return maybeDeferred;
};

/**
 * Configuration used to create a x402DelegationProvider.
 *
 * `account` is required and is used for signing the delegation.
 */
export type x402DelegationProviderConfig = {
  account: Account;
  environment: SmartAccountsEnvironment;
  from?: Hex;
  salt?: Hex;
  caveats?: MaybeDeferred<Caveats>;
  parentPermissionContext?: MaybeDeferred<PermissionContext>;
};

type DelegationCreationContext = {
  account: Account;
  delegationManager: Address;
  existingDelegations: Delegation[];
  createDelegationConfig: Parameters<typeof createOpenDelegation>[0];
};

type Resolvex402DelegationCaveatsParams = {
  environment: SmartAccountsEnvironment;
  caveatsConfig: Caveats | undefined;
  existingDelegations: Delegation[];
  facilitatorAddresses: Hex[] | undefined;
};

const normalizeAddress = (address: Hex): string => address.toLowerCase();

const isSubset = (subset: string[], superset: string[]): boolean =>
  subset.every((item) => superset.includes(item));

const resolvex402DelegationCaveats = ({
  environment,
  caveatsConfig,
  existingDelegations,
  facilitatorAddresses,
}: Resolvex402DelegationCaveatsParams): Caveat[] => {
  const {
    caveatEnforcers: { RedeemerEnforcer: redeemerEnforcer },
  } = environment;

  if (!redeemerEnforcer) {
    throw new Error('RedeemerEnforcer not found in environment');
  }

  const redeemerAddressNormalized = normalizeAddress(redeemerEnforcer);

  const caveats = resolveCaveats({
    environment,
    caveats: caveatsConfig,
    // Resolve caveats first so we can append a redeemer caveat when needed.
    // Scope is still attached later during delegation creation.
    isScopeOptional: true,
  });

  const redeemerCaveats = [
    ...caveats,
    ...existingDelegations.flatMap((delegation) => delegation.caveats),
  ].filter(
    ({ enforcer }) => normalizeAddress(enforcer) === redeemerAddressNormalized,
  );

  const hasExistingRedeemerConstraint = redeemerCaveats.length > 0;

  if (!facilitatorAddresses || facilitatorAddresses.length === 0) {
    // Without facilitators, a redeemer constraint must already exist.
    if (!hasExistingRedeemerConstraint) {
      throw new Error(
        'Redeemer must be constrained, either in the specified `caveats`, `parentPermissionContext`, or the `PaymentRequirements` as `extra.facilitatorAddresses`.',
      );
    }

    return caveats;
  }

  const facilitatorAddressesLowerCase =
    facilitatorAddresses.map(normalizeAddress);

  // If an existing redeemer caveat is already within facilitator bounds, no new caveat is needed.
  const hasSufficientlyConstrainedRedeemerCaveat = redeemerCaveats.some(
    (caveat) => {
      const allowedRedeemerAddresses = decodeRedeemerTerms(
        caveat.terms,
      ).redeemers.map(normalizeAddress);

      return isSubset(allowedRedeemerAddresses, facilitatorAddressesLowerCase);
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

const resolveDelegationCreationContext = async (
  config: x402DelegationProviderConfig,
  requirements: PaymentRequirements,
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
  } as ScopeConfig;

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

/**
 * Creates a delegation provider function for x402 payment requirements.
 *
 * The returned provider resolves deferred config values using incoming payment
 * requirements, creates an open delegation, signs it, and returns an encoded
 * permission context payload.
 *
 * @param config - Delegation creation and signing configuration.
 * @returns A provider that maps payment requirements to a signed delegation payload.
 */
export function createx402DelegationProvider(
  config: x402DelegationProviderConfig,
): x402DelegationProvider {
  return async (
    requirements: PaymentRequirements,
  ): Promise<x402DelegationProviderPaymentPayload> => {
    const {
      account,
      delegationManager,
      existingDelegations,
      createDelegationConfig,
    } = await resolveDelegationCreationContext(config, requirements);

    const delegation = createOpenDelegation(createDelegationConfig);

    // todo: extract chainId from the network parameter
    const chainId = requirements.network as unknown as number;

    const typedData = prepareSignDelegationTypedData({
      delegationManager,
      chainId,
      delegation,
    });

    if (!account.signTypedData) {
      throw new Error('Account does not support signTypedData');
    }

    const signature = await account.signTypedData(typedData);

    const signedDelegation = {
      ...delegation,
      signature,
    };

    const permissionContext = encodeDelegations([
      signedDelegation,
      ...existingDelegations,
    ]);

    return {
      delegationManager,
      permissionContext,
      delegator: delegation.delegator,
    };
  };
}
