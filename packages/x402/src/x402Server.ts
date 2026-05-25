import type { Hex } from '@metamask/utils';

import { getAddress } from './ethereum';
import type { x402PaymentRequirements } from './x402Client';

export type x402Erc7710ServerConfig = {
  allowAssetTransferMethodOverride?: boolean;
};

/**
 * Validate and normalize optional facilitator address metadata.
 *
 * @param publishedAddresses - Optional facilitator address list from `supportedKind.extra`.
 * @returns A normalized checksum address list, or `undefined` when no list is provided.
 */
function validateFacilitatorAddresses(
  publishedAddresses: unknown,
): Hex[] | undefined {
  if (publishedAddresses === undefined) {
    return undefined;
  }

  if (!Array.isArray(publishedAddresses)) {
    throw new Error(
      'Invalid facilitatorAddresses specified: expected an array of addresses',
    );
  }

  if (publishedAddresses.length === 0) {
    throw new Error(
      'Invalid facilitatorAddresses specified: expected at least one address',
    );
  }

  const normalizedAddresses: Hex[] = [];
  const validationErrors: string[] = [];

  publishedAddresses.forEach((address, index) => {
    if (typeof address !== 'string') {
      validationErrors.push(`facilitatorAddresses[${index}] must be a string`);
      return;
    }

    try {
      normalizedAddresses.push(getAddress(address));
    } catch {
      validationErrors.push(
        `facilitatorAddresses[${index}] is not a valid address: "${address}"`,
      );
    }
  });

  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid facilitatorAddresses specified: ${validationErrors.join('; ')}`,
    );
  }

  return normalizedAddresses;
}

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

    if (
      typeof existingMethod === 'string' &&
      existingMethod !== 'erc7710' &&
      !this.#allowAssetTransferMethodOverride
    ) {
      throw new Error(
        `Cannot overwrite existing assetTransferMethod "${existingMethod}" with "erc7710"`,
      );
    }

    const facilitatorAddresses = validateFacilitatorAddresses(
      supportedKind.extra?.facilitatorAddresses,
    );

    return {
      ...paymentRequirements,
      extra: {
        ...(paymentRequirements.extra ?? {}),
        ...(facilitatorAddresses ? { facilitatorAddresses } : {}),
        assetTransferMethod: 'erc7710',
      },
    };
  }
}
