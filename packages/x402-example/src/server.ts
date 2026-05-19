import { config } from 'dotenv';
import express from 'express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import {
  type Network,
} from '@x402/core/types';
import { x402ExactEvmErc7710ServerScheme } from '@metamask/smart-accounts-kit-x402';

config();

const facilitatorUrl = process.env.FACILITATOR_URL;
if (!facilitatorUrl) {
  throw new Error('Missing FACILITATOR_URL environment variable');
}

const payTo = process.env.EVM_PAY_TO as string | undefined;
if (!payTo) {
  throw new Error('Missing EVM_PAY_TO environment variable');
}

const network = (process.env.NETWORK ?? 'eip155:84532') as Network;
const port = Number(process.env.PORT ?? 4021);
const price = '1000' as const;
const acceptedToken = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const acceptedTokenEip712Domain = {
  name: 'USD Coin',
  version: '2',
} as const;

const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
const app = express();

app.use(
  paymentMiddleware(
    {
      'GET /random': {
        accepts: [
          {
            scheme: 'exact',
            network,
            payTo,
            price: {
              amount: price,
              asset: acceptedToken,
            },
            extra: {
              assetTransferMethod: 'erc7710',
            },
          },
          {
            scheme: 'exact',
            network,
            payTo,
            price: {
              amount: price,
              asset: acceptedToken,
            },
            extra: {
              assetTransferMethod: 'eip3009',
              ...acceptedTokenEip712Domain,
            },
          },
        ],
        description: 'Random integer from 1 to 10',
        mimeType: 'text/plain',
      },
    },
    new x402ResourceServer(facilitatorClient).register(
      network,
      new x402ExactEvmErc7710ServerScheme(),
    ),
  ),
);

app.get('/random', (_req: unknown, res: { type: (value: string) => { send: (value: string) => void } }) => {
  const value = Math.floor(Math.random() * 10) + 1;
  res.type('text/plain').send(String(value));
});

app.listen(port, () => {
  console.log(
    `x402 ERC-7710 + EIP-3009 example server listening on http://localhost:${port}/random`,
  );
});
