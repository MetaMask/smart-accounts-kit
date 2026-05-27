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
import {
  parseEip155ChainId,
  resolveDelegationCreationContext,
} from './x402DelegationProviderUtils';

export type {
  MaybeDeferred,
  PaymentRequirements,
  x402DelegationProvider,
  x402DelegationProviderConfig,
  x402DelegationProviderPaymentPayload,
} from './x402DelegationProviderTypes';

export { parseEip155ChainId } from './x402DelegationProviderUtils';

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
      createDelegationConfig,
      delegationManager,
      existingDelegations,
      rootDelegator,
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
      delegator: rootDelegator,
    };
  };
}
