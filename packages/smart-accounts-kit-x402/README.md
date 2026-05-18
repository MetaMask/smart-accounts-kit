# @metamask/smart-accounts-kit-x402

x402 adapters for ERC-7710 payment requirement publishing and payload creation.

## Installation

```bash
yarn add @metamask/smart-accounts-kit-x402
npm install @metamask/smart-accounts-kit-x402
```

## Exports

- `x402Erc7710Client`
- `x402Erc7710Server`
- `x402ExactEvmErc7710ServerScheme`

## Notes

This package intentionally does not depend on `@metamask/smart-accounts-kit`.
Consumers provide delegation payloads via `x402DelegationProvider`.
