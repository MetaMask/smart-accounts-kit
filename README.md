# DeleGator SDK Monorepo

This monorepo consists of a suite of tools to enable developers to build using the MetaMask Smart Contract Accounts, and Delegation system.

### Project Structure

- `./packages` contains top level packages that will be deployed for external use
  - `/delegation-abis` has  collection of ABIs corresponding to a specific version of the [Delegation Framework](https://github.com/metamask/delegation-framework).
  - `/delegation-deployments` contains deployments for different versions of the [Delegation Framework](https://github.com/metamask/delegation-framework).
  - `/smart-accounts-kit` has utilities for creating a [DeleGator SCA](https://github.com/MetaMask/delegation-framework/blob/main/documents/DeleGatorCore.md#metamasks-delegatorcore) know as MetaMask smart account, setting up delegations, and redeeming them.
  - `/delegator-e2e` has end-to-end tests for the Smart Accounts Kit.
- `./shared` contains basic shared resources for configuring and testing the packages.
- `./skills` contains agent skills that help AI coding assistants use the Smart Accounts Kit correctly.
  - [`/smart-accounts-kit`](./skills/smart-accounts-kit/SKILL.md) — build dApps with MetaMask Smart Accounts, ERC-7710 delegations, and ERC-7715 Advanced Permissions.
  - [`/x402-payments`](./skills/x402-payments/SKILL.md) — build x402 (HTTP 402) machine-to-machine payment flows using ERC-7710 delegations and ERC-7715 Advanced Permissions.

## Getting Started

To get started with the monorepo, please make sure to review the [requirements](/CONTRIBUTING.md#requirements).

```sh
yarn install && yarn dev
```

## Contributing

If you are interested in contributing, please [see the contribution guide](/CONTRIBUTING.md#Contributing).

## Useful Links

- [Viem](https://viem.sh/)
- [Wagmi](https://wagmi.sh/)
- [Turbo Repo](https://turbo.build/repo/docs)
- [Turbo Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712)
- [EIP-1014](https://eips.ethereum.org/EIPS/eip-1014)
- [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271)
- [EIP-1822](https://eips.ethereum.org/EIPS/eip-1822)
- [EIP-1967](https://eips.ethereum.org/EIPS/eip-1967)
- [EIP-4337](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-7201](https://eips.ethereum.org/EIPS/eip-7201)
- [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710)
- [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715)
- [EIP-7212](https://eips.ethereum.org/EIPS/eip-7212)
