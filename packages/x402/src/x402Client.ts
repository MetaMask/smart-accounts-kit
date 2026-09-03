import { isStrictHexString } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import { getAddress } from './ethereum';

/**
 * Minimal x402 payment requirements used by the ERC-7710 client.
 */
export type x402PaymentRequirements = {
  /** Payment scheme identifier, such as `"exact"`. */
  scheme: string;
  /** Network identifier for the payment. */
  network: string;
  /** Asset identifier the payment is denominated in. */
  asset: string;
  /** Payment amount as a string. */
  amount: string;
  /** Recipient address for the payment. */
  payTo: string;
  /** Maximum time in seconds the payment remains valid. */
  maxTimeoutSeconds: number;
  /** Optional scheme-specific metadata, including `assetTransferMethod`. */
  extra?: Record<string, unknown>;
};

/**
 * Payment payload returned to an x402 client after creating a payment.
 */
export type x402PaymentPayloadResult = {
  /** x402 protocol version used to create the payload. */
  x402Version: number;
  /** Scheme-specific payment payload data. */
  payload: Record<string, unknown>;
  /** Optional protocol extensions to include with the payload. */
  extensions?: Record<string, unknown>;
};

/**
 * ERC-7710 delegation data published as an x402 payment payload.
 */
export type x402DelegationPaymentPayload = {
  /** Delegation manager contract address. */
  delegationManager: Hex;
  /** Encoded permission context for the delegation. */
  permissionContext: Hex;
  /** Delegator account address. */
  delegator: Hex;
};

/**
 * Resolves ERC-7710 delegation data for a set of payment requirements.
 *
 * @param paymentRequirements - Payment requirements received from the resource server.
 * @returns Delegation payload used to settle the x402 payment.
 */
export type x402DelegationProvider = (
  paymentRequirements: x402PaymentRequirements,
) => Promise<x402DelegationPaymentPayload>;

/**
 * Structural x402 scheme-network client used as a fallback for non-ERC-7710 payments.
 */
export type x402SchemeNetworkClientLike = {
  /** Payment scheme implemented by the fallback client. */
  readonly scheme: string;
  /**
   * Creates a payment payload for the given requirements.
   *
   * @param x402Version - x402 protocol version.
   * @param paymentRequirements - Payment requirements from the resource server.
   * @param context - Optional client context forwarded to the fallback.
   * @returns A payment payload result.
   */
  createPaymentPayload: (
    x402Version: number,
    paymentRequirements: x402PaymentRequirements,
    context?: Record<string, unknown>,
  ) => Promise<x402PaymentPayloadResult>;
};

/**
 * Configuration for {@link x402Erc7710Client}.
 */
export type x402Erc7710ClientConfig = {
  /** Provider that returns ERC-7710 delegation data for matching payments. */
  delegationProvider: x402DelegationProvider;
  /** Optional client used when `assetTransferMethod` is not `"erc7710"`. */
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

  /**
   * Create an ERC-7710 x402 client.
   *
   * @param config - Client configuration, including the delegation provider.
   */
  constructor(config: x402Erc7710ClientConfig) {
    this.#delegationProvider = config.delegationProvider;
    this.#fallbackClient = config.fallbackClient;
  }

  /**
   * Create a payment payload for ERC-7710 requirements, or delegate to the fallback client.
   *
   * @param x402Version - x402 protocol version.
   * @param paymentRequirements - Payment requirements from the resource server.
   * @param context - Optional client context forwarded to the fallback client.
   * @returns A payment payload result.
   */
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
