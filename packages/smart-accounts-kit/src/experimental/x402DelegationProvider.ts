import { parseCaipChainId } from '@metamask/utils';

import {
  createOpenDelegation,
  encodeDelegations,
  prepareSignDelegationTypedData,
} from '../delegation';
import type {
  PaymentRequirements,
  x402DelegationProvider,
  x402DelegationProviderConfig,
  x402DelegationProviderPaymentPayload,
} from './x402DelegationProviderTypes';
import { resolveDelegationCreationContext } from './x402DelegationProviderUtils';

export type {
  MaybeDeferred,
  PaymentRequirements,
  x402DelegationProvider,
  x402DelegationProviderConfig,
  x402DelegationProviderPaymentPayload,
} from './x402DelegationProviderTypes';

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
