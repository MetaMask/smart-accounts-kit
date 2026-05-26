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
 * Parses an EIP-155 CAIP network identifier into a numeric chain ID.
 *
 * @param network - CAIP network identifier (for example, `eip155:1`).
 * @returns Parsed numeric chain ID.
 * @throws If the CAIP namespace is not `eip155`.
 */
export function parseEip155ChainId(network: PaymentRequirements['network']): number {
  const { namespace, reference } = parseCaipChainId(
    network as `${string}:${string}`,
  );

  if (namespace !== 'eip155') {
    throw new Error('Unsupported chain namespace');
  }

  return parseInt(reference, 10);
}

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

    const chainId = parseEip155ChainId(requirements.network);

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
