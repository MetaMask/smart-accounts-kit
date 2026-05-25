import { isStrictHexString, type Hex } from '@metamask/utils';

import { getAddress } from './ethereum';

export type x402PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
};

export type x402PaymentPayloadResult = {
  x402Version: number;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
};

export type x402DelegationPaymentPayload = {
  delegationManager: Hex;
  permissionContext: Hex;
  delegator: Hex;
};

export type x402DelegationProvider = (
  paymentRequirements: x402PaymentRequirements,
) => Promise<x402DelegationPaymentPayload>;

export type x402SchemeNetworkClientLike = {
  readonly scheme: string;
  createPaymentPayload: (
    x402Version: number,
    paymentRequirements: x402PaymentRequirements,
    context?: Record<string, unknown>,
  ) => Promise<x402PaymentPayloadResult>;
};

export type x402Erc7710ClientConfig = {
  delegationProvider: x402DelegationProvider;
  fallbackClient?: x402SchemeNetworkClientLike;
};

/**
 * Normalize and validate a delegation payload before publishing it.
 *
 * @param payload - Delegation payload returned by the configured provider.
 * @returns The normalized payload with checksum addresses.
 */
function normalizeDelegationPayload(
  payload: x402DelegationPaymentPayload,
): x402DelegationPaymentPayload {
  if (!isStrictHexString(payload.permissionContext)) {
    throw new Error(
      'Invalid delegation payload: permissionContext must be non-empty hex data',
    );
  }

  return {
    delegationManager: getAddress(payload.delegationManager),
    permissionContext: payload.permissionContext,
    delegator: getAddress(payload.delegator),
  };
}

/**
 * x402 `SchemeNetworkClient`-compatible implementation for ERC-7710 payments.
 *
 * This class uses structural typing and intentionally does not import x402 types,
 * so it can be consumed without adding a direct dependency on x402 packages.
 */
export class x402Erc7710Client {
  readonly scheme = 'exact';

  readonly #delegationProvider: x402DelegationProvider;

  readonly #fallbackClient?: x402SchemeNetworkClientLike;

  constructor(config: x402Erc7710ClientConfig) {
    this.#delegationProvider = config.delegationProvider;
    this.#fallbackClient = config.fallbackClient;
  }

  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: x402PaymentRequirements,
    context?: Record<string, unknown>,
  ): Promise<x402PaymentPayloadResult> {
    const assetTransferMethod = paymentRequirements.extra?.assetTransferMethod;

    if (assetTransferMethod !== 'erc7710') {
      if (this.#fallbackClient) {
        return this.#fallbackClient.createPaymentPayload(
          x402Version,
          paymentRequirements,
          context,
        );
      }

      const invalidAssetTransferMethod =
        typeof assetTransferMethod === 'string'
          ? `"${assetTransferMethod}"`
          : JSON.stringify(assetTransferMethod);

      throw new Error(
        `x402Erc7710Client can only process assetTransferMethod "erc7710". Received: ${invalidAssetTransferMethod}`,
      );
    }

    const delegation = await this.#delegationProvider(paymentRequirements);

    return {
      x402Version,
      payload: normalizeDelegationPayload(delegation),
    };
  }
}
