import type { Network, PaymentRequirements } from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';

import { x402Erc7710Server } from './x402Server';

/**
 * Exact EVM server scheme that injects ERC-7710 payment requirement fields.
 */
export class x402ExactEvmErc7710ServerScheme extends ExactEvmScheme {
  readonly #erc7710Server = new x402Erc7710Server();

  /**
   * Enhance payment requirements, adding ERC-7710 fields when requested.
   *
   * @param paymentRequirements - Payment requirements to enhance.
   * @param supportedKind - Facilitator-supported kind metadata.
   * @param supportedKind.x402Version - x402 protocol version.
   * @param supportedKind.scheme - Payment scheme identifier.
   * @param supportedKind.network - Network identifier for the payment.
   * @param supportedKind.extra - Optional extra fields from the facilitator.
   * @param facilitatorExtensions - Facilitator extension identifiers.
   * @returns Enhanced payment requirements.
   */
  async enhancePaymentRequirements(
    paymentRequirements: PaymentRequirements,
    supportedKind: {
      /** x402 protocol version. */
      x402Version: number;
      /** Payment scheme identifier. */
      scheme: string;
      /** Network identifier for the payment. */
      network: Network;
      /** Optional extra fields from the facilitator. */
      extra?: Record<string, unknown>;
    },
    facilitatorExtensions: string[],
  ): Promise<PaymentRequirements> {
    const baseRequirements = await super.enhancePaymentRequirements(
      paymentRequirements,
      supportedKind,
      facilitatorExtensions,
    );

    if (baseRequirements.extra?.assetTransferMethod !== 'erc7710') {
      return baseRequirements;
    }

    const enhancedRequirements =
      await this.#erc7710Server.enhancePaymentRequirements(
        baseRequirements,
        supportedKind,
      );

    return enhancedRequirements as PaymentRequirements;
  }
}
