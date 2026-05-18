# x402 example

Minimal x402 server example that publishes ERC-7710 payment requirements using:

- x402 Foundation SDK (`@x402/core`, `@x402/express`, `@x402/evm`)
- Smart Accounts Kit experimental helper (`x402Erc7710Server`)

## Endpoint

- `GET /random` returns `text/plain` with a random integer in `[1, 10]`
- The route is protected by x402 with the `exact` scheme
- Payment requirements are rewritten to `extra.assetTransferMethod = "erc7710"`

## Environment variables

- `FACILITATOR_URL` - x402 facilitator base URL
- `EVM_PAY_TO` - recipient address
- `NETWORK` - optional CAIP-2 network (default: `eip155:84532`)
- `PORT` - optional server port (default: `4021`)

## Run

```bash
yarn workspace @metamask/x402-example start:server
```

## Client CLI

`src/client.ts` is a minimal x402 CLI payer:

- accepts a private key (`--private-key 0x...` or `PRIVATE_KEY`)
- requests the protected resource
- creates an exact ERC-7710 delegation with Smart Accounts Kit
- builds the x402 payment payload via experimental `X402Erc7710Client`
- retries the request with `PAYMENT-SIGNATURE`

Run:

```bash
yarn workspace @metamask/x402-example start:client --private-key 0x...
```
