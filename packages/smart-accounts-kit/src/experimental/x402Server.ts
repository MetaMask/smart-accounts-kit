import { getAddress } from 'viem';
import { trackSmartAccountsKitFunctionCall } from '../analytics';
import type { x402PaymentRequirements } from './x402Client';

export type x402Erc7710ServerConfig = {
  allowAssetTransferMethodOverride?: boolean;
};

/**
 * x402 `SchemeNetworkServer`-compatible implementation for publishing
 * `assetTransferMethod: "erc7710"` in payment requirements.
 *
 * This class uses structural typing and intentionally does not import x402 types,
 * so it can be consumed without adding a direct dependency on x402 packages.
 */
export class x402Erc7710Server {
  readonly scheme = 'exact';

  readonly #allowAssetTransferMethodOverride: boolean;

  constructor(config?: x402Erc7710ServerConfig) {
    this.#allowAssetTransferMethodOverride =
      config?.allowAssetTransferMethodOverride ?? false;
  }

  async enhancePaymentRequirements(
    paymentRequirements: x402PaymentRequirements,
    supportedKind: {
      extra?: Record<string, unknown>;
    },
  ): Promise<x402PaymentRequirements> {
    const existingMethod = paymentRequirements.extra?.assetTransferMethod;

    trackSmartAccountsKitFunctionCall(
      'experimental.x402Erc7710Server.enhancePaymentRequirements',
      {
        network: paymentRequirements.network,
        existingAssetTransferMethod:
          typeof existingMethod === 'string' ? existingMethod : 'undefined',
      },
    );

    if (
      typeof existingMethod === 'string' &&
      existingMethod !== 'erc7710' &&
      !this.#allowAssetTransferMethodOverride
    ) {
      throw new Error(
        `Cannot overwrite existing assetTransferMethod "${existingMethod}" with "erc7710"`,
      );
    }

    const facilitatorAddress = (() => {
      const publishedAddress = supportedKind.extra?.facilitatorAddress;
      if (typeof publishedAddress !== 'string') {
        return undefined;
      }

      try {
        return getAddress(publishedAddress);
      } catch {
        return undefined;
      }
    })();

    return {
      ...paymentRequirements,
      extra: {
        ...(paymentRequirements.extra ?? {}),
        ...(facilitatorAddress ? { facilitatorAddress } : {}),
        assetTransferMethod: 'erc7710',
      },
    };
  }
}
