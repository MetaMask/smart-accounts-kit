import type { Network, PaymentRequirements } from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';

import { x402Erc7710Server } from './x402Server';

/**
 * Exact EVM server scheme that injects ERC-7710 payment requirement fields.
 */
export class x402ExactEvmErc7710ServerScheme extends ExactEvmScheme {
  readonly #erc7710Server = new x402Erc7710Server();

  async enhancePaymentRequirements(
    paymentRequirements: PaymentRequirements,
    supportedKind: {
      x402Version: number;
      scheme: string;
      network: Network;
      extra?: Record<string, unknown>;
    },
    facilitatorExtensions: string[],
  ): Promise<PaymentRequirements> {
    const baseRequirements = await super.enhancePaymentRequirements(
      paymentRequirements,
      supportedKind,
      facilitatorExtensions,
    );

    const enhancedRequirements = await this.#erc7710Server.enhancePaymentRequirements(
      baseRequirements,
      supportedKind,
    );

    return enhancedRequirements as PaymentRequirements;
  }
}
