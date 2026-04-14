# MetaMask Smart Accounts Kit

The MetaMask Smart Accounts Kit is a [Viem](https://viem.sh)-based collection of tools for integrating MetaMask Smart Account and creating frictionless new experiences based on granular permission sharing and trust.

## Features

---

- **Smart Account Support**: Provides high-level API for deploying, and managing MetaMask smart account.
- **Delegation Framework Support**: Comprehensive support for [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) to create, manage, and redeem delegations.
- **Prebuilt Caveat Enforcers**: Prebuilt caveat enforcers for adding restrictions and conditions to delegations.
- **Modular and Extensible**: Enables configuration of custom bundlers, paymasters, signers, and specialized caveat enforcers.
- and many more...

## Installation

---

Yarn:

```sh
yarn add @metamask/smart-accounts-kit viem
```

Npm:

```sh
npm install @metamask/smart-accounts-kit viem
```

`viem` is a peer dependency; install a compatible version alongside the kit.

## Overview

---

```ts
import { createPublicClient, http } from 'viem';
import { sepolia as chain } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Implementation,
  toMetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const account = privateKeyToAccount('0x...');

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: '0x',
  signer: { account },
});
```

## Documentation

---

[Head to our documentation](https://docs.gator.metamask.io) to learn more about the MetaMask Smart Accounts Kit.

## Analytics

This package collects anonymous usage analytics to help us understand how it's being used and prioritize improvements. No personal information is collected. **[Analytics can be disabled](#disabling-analytics)**.

### What's collected

Two event types are sent (namespace `metamask/smart-accounts-kit`): a one-time **initialized** event when the first instrumented API runs (just before the first **function called** event), and **function called** events when those APIs run afterward. Both include a small **session base**; function events add which API was used and optional **parameters**.

- **`sdk_version`** — Kit version.
- **`anon_id`** — Random id regenerated on each SDK initialization for correlating events within that session. It is not derived from wallet or personal data, is not written to local storage or cookies for tracking purposes, and is not used to identify or track a user across sites or apps.
- **`platform`** — Coarse runtime (`web-desktop`, `web-mobile`, or `nodejs`).
- **`domain`** *(web only, when available)* — Current page hostname.

- **`function_name`** — Stable internal name of the API that was called.
- **`parameters`** *(optional)* — Only coarse, non-identifying data: things like numeric **chain id**, **counts** (e.g. calls, caveats, signatures), **booleans** (whether optional inputs were present), **implementation or scope _type_** from fixed enums, and **high-level labels** (e.g. which known delegation-storage tier or filter mode). No raw addresses, hashes, calldata, keys, or permission payloads.

### What's NOT collected

- **Secrets and credentials** — Private keys, API keys, bearer tokens, RPC or bundler URLs, and similar.
- **On-chain identifiers and payloads** — Account or contract addresses, transaction `to` / `data` / `value`, user operation calldata, delegation bodies, delegation hashes, permission request or response payloads, and signature bytes.
- **Personal information** — No names, emails, or other PII is sent as part of this analytics design.

### Disabling analytics

Analytics is not initialized when any of the following is set to: `1`, or `yes` / `true` (case-insensitive):

- **`CI`** environment variable (Node.js)
- **`DO_NOT_TRACK`** environment variable (Node.js)
- **`navigator.doNotTrack`** or **`window.doNotTrack`** (in browsers).

## Contributing

---

If you are interested in contributing, please [see the contribution guide](/CONTRIBUTING.md#Contributing).

## Useful Links

- [MetaMask Smart Accounts Kit Quick start](https://docs.metamask.io/smart-accounts-kit/get-started/quickstart/)
- [MetaMask Smart Accounts Kit CLI Quick start](https://docs.metamask.io/smart-accounts-kit/get-started/use-the-cli)
- [Scaffold ETH extension](https://github.com/metamask/gator-extension)
- [API reference](https://docs.metamask.io/smart-accounts-kit/reference/smart-account/)
