import { config } from 'dotenv';
import express from 'express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import {
  type Network,
  type PaymentRequirements,
} from '@x402/core/types';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { x402Erc7710Server } from '@metamask/smart-accounts-kit/experimental';
import type { Hex } from 'viem';

config();

const facilitatorUrl = process.env.FACILITATOR_URL;
if (!facilitatorUrl) {
  throw new Error('Missing FACILITATOR_URL environment variable');
}

const payTo = process.env.EVM_PAY_TO as Hex | undefined;
if (!payTo) {
  throw new Error('Missing EVM_PAY_TO environment variable');
}

const network = (process.env.NETWORK ?? 'eip155:84532') as Network;
const port = Number(process.env.PORT ?? 4021);
const acceptedToken = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

class ExactEvmErc7710ServerScheme extends ExactEvmScheme {
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

    const enhancedRequirements = (await this.#erc7710Server.enhancePaymentRequirements(
      baseRequirements,
      supportedKind,
    )) as PaymentRequirements;

    return enhancedRequirements;
  }
}

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const app = express();

app.use(
  paymentMiddleware(
    {
      'GET /random': {
        accepts: {
          scheme: 'exact',
          network,
          payTo,
          price: {
            amount: '1000',
            asset: acceptedToken,
          },
        },
        description: 'Random integer from 1 to 10',
        mimeType: 'text/plain',
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      network,
      new ExactEvmErc7710ServerScheme(),
    ),
  ),
);

app.get('/random', (_req: unknown, res: { type: (value: string) => { send: (value: string) => void } }) => {
  const value = Math.floor(Math.random() * 10) + 1;
  res.type('text/plain').send(String(value));
});

app.listen(port, () => {
  console.log(
    `x402 ERC-7710 example server listening on http://localhost:${port}/random`,
  );
});
