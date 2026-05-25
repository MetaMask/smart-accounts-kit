import { parseCaipChainId } from '@metamask/utils';
import type { Account, Hex } from 'viem';

import type { Caveats } from '../caveatBuilder';
import {
  createOpenDelegation,
  encodeDelegations,
  prepareSignDelegationTypedData,
} from '../delegation';
import type { PermissionContext, SmartAccountsEnvironment } from '../types';
import { resolveDelegationCreationContext } from './x402DelegationProviderUtils';

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
  delegationManager: Hex;
  permissionContext: Hex;
  delegator: Hex;
};

/**
 * Function that turns payment requirements into a signed delegation payload.
 */
export type x402DelegationProvider = (
  paymentRequirements: PaymentRequirements,
) => Promise<x402DelegationProviderPaymentPayload>;

/**
 * Value that can be provided eagerly or derived lazily from payment requirements.
 *
 * @template TResult - Resolved value type.
 */
export type MaybeDeferred<TResult> =
  | TResult
  | ((requirements: PaymentRequirements) => TResult);

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

    const { namespace, reference } = parseCaipChainId(
      requirements.network as `${string}:${string}`,
    );

    if (namespace !== 'eip155') {
      throw new Error('Unsupported chain namespace');
    }

    const chainId = parseInt(reference, 10);

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
