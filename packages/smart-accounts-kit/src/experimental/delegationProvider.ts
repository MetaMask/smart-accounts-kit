import { createRedeemerTerms } from '@metamask/delegation-core';
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
import { generateSalt } from '../utils/index';

/**
 * Payment requirement details supplied by an x402 server challenge.
 *
 * These values are used to scope and construct the delegation that will be
 * returned by a {@link DelegationProvider}.
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
export type DelegationProviderPaymentPayload = {
  delegationManager: `0x${string}`;
  permissionContext: `0x${string}`;
  delegator: `0x${string}`;
};

/**
 * Function that turns payment requirements into a signed delegation payload.
 */
export type DelegationProvider = (
  paymentRequirements: PaymentRequirements,
) => Promise<DelegationProviderPaymentPayload>;

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
 * Configuration used to create a DelegationProvider.
 *
 * `account` is required and is used for signing the delegation.
 */
export type DelegationProviderConfig = {
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

const resolveDelegationCreationContext = async (
  config: DelegationProviderConfig,
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

  if (!facilitatorAddresses || facilitatorAddresses.length === 0) {
    throw new Error('Facilitator addresses are required');
  }

  const {
    DelegationManager: delegationManager,
    caveatEnforcers: { RedeemerEnforcer },
  } = config.environment;

  if (!RedeemerEnforcer) {
    throw new Error('RedeemerEnforcer not found in environment');
  }

  const redeemerCaveat: Caveat = {
    enforcer: RedeemerEnforcer,
    terms: createRedeemerTerms({ redeemers: facilitatorAddresses }),
    args: '0x',
  };

  const caveats = [
    ...resolveCaveats({
      environment: config.environment,
      caveats: caveatsConfig,
      // we need to resolve the caveats so that we can add more, the scope is added in the createDelegation call
      isScopeOptional: true,
    }),
    redeemerCaveat,
  ];

  let createDelegationConfig: Parameters<typeof createOpenDelegation>[0];
  let existingDelegations: Delegation[];

  if (parentPermissionContext) {
    const decodedPermissionContext = decodeDelegations(parentPermissionContext);
    const parentDelegation = decodedPermissionContext[0];

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

    existingDelegations = decodedPermissionContext;
  } else {
    createDelegationConfig = {
      environment: config.environment,
      from,
      caveats,
      salt,
      scope,
    };

    existingDelegations = [];
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
export function createDelegationProvider(
  config: DelegationProviderConfig,
): DelegationProvider {
  return async (
    requirements: PaymentRequirements,
  ): Promise<DelegationProviderPaymentPayload> => {
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
