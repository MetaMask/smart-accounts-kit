# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0]

### Uncategorized

- feat: add terms decoding utils ([#191](https://github.com/metamask/smart-accounts-kit/pull/191))
- Remove unused dependency on buffer polyfill. Use hexToBytes from viem instead. ([#201](https://github.com/metamask/smart-accounts-kit/pull/201))
- Fix yarn constraints ([#202](https://github.com/metamask/smart-accounts-kit/pull/202))
- Add analytics tracking to smart accounts kit ([#185](https://github.com/metamask/smart-accounts-kit/pull/185))

## [1.1.0]

### Added

- A `nonceKeyManager` can now be specified when calling `toMetaMaskSmartAccount` ([#199](https://github.com/metamask/smart-accounts-kit/pull/199))

### Fixed

- Nonce is always generated with nonce key `0n`, ignoring any specified nonce key value ([#199](https://github.com/metamask/smart-accounts-kit/pull/199))

## [1.0.0]

### Changed

- Migrate from `webauthn-p256` to `0x` p256 module ([#193](https://github.com/metamask/smart-accounts-kit/pull/193))
- `signer` param is now optional in `toMetaMaskSmartAccount` ([#178](https://github.com/metamask/smart-accounts-kit/pull/178))

## [0.4.0-beta.2]

### Added

- Add `encodeDelegation` and `decodeDelegation` utilities for encoding and decoding single delegations. ([#153](https://github.com/MetaMask/smart-accounts-kit/pull/153))
- Add DelegationManager validation for EIP-7710 actions (#150) ([#150](https://github.com/metamask/smart-accounts-kit/pull/150))
- Support for Tempo Mainnet and Tempo Moderato Testnet ([#177](https://github.com/metamask/smart-accounts-kit/pull/177))

### Changed

- Introduce `PermissionContext` to represent a delegation chain (ABI-encoded `Hex` or decoded `Delegation[]`). ([#140](https://github.com/MetaMask/smart-accounts-kit/pull/140))
  - **Breaking**: Replace usages of raw `Hex` _or_ `Delegation[]` with `PermissionContext`, and rename `permissionsContext` to `permissionContext` (note the singular "permission") where applicable:
    - `SendTransactionWithDelegation`: `permissionsContext: Hex` → `permissionContext: PermissionContext`
    - `SendUserOperationWithDelegation`: within `calls: DelegatedCall`, `permissionsContext: Hex` → `permissionContext: PermissionContext`
    - `redeemDelegations`: parameter `Delegation[]` → `PermissionContext`
    - `encodeDelegations` and `decodeDelegations` now accept `PermissionContext` (if the input is already the expected type, the input is returned)
    - `encode`, `execute`, and `simulate` functions for `DelegationManager.redeemDelegations` from `@metamask/smart-accounts-kit/contracts`: parameter `delegations: Delegation[]` → `delegations: PermissionContext`
- **Breaking**: ERC-7715 actions now return developer-friendly types: `chainId` as number, token amounts as `bigint`. ([#172](https://github.com/MetaMask/smart-accounts-kit/pull/172))
- **Breaking**: Rename `getDelegationHashOffchain` to `hashDelegation` for improved clarity. ([#162](https://github.com/MetaMask/smart-accounts-kit/pull/162))
- **Breaking**: EIP-7715 permission requests nest `isAdjustmentAllowed` inside each permission object per specification. ([#159](https://github.com/MetaMask/smart-accounts-kit/pull/159))
- **Breaking**: `sendUserOperationWithDelegation` now accepts `dependencies` instead of deprecated `accountMetadata`. ([#157](https://github.com/MetaMask/smart-accounts-kit/pull/157))
- **Breaking**: Validate that the provided `DelegationManager` address matches the known contract address for the chain in EIP-7710 actions. ([#156](https://github.com/MetaMask/smart-accounts-kit/pull/156))
- **Breaking**: Default `delegation.salt` and `caveat.args` to `0x00` instead of invalid `0x`. ([#138](https://github.com/MetaMask/smart-accounts-kit/pull/138))
- Allow scope type to be specified either as `ScopeType` enum, or string literal. ([#133](https://github.com/MetaMask/smart-accounts-kit/pull/133))
- Allow caveat type to be specified either as `CaveatType` enum, or string literal. ([#179](https://github.com/MetaMask/smart-accounts-kit/pull/179))

### Removed

- **Breaking**: `encodePermissionContexts` and `decodePermissionContexts` utilities; use `encodeDelegations` and `decodeDelegations` directly. ([#148](https://github.com/MetaMask/smart-accounts-kit/pull/148))
- **Breaking**: `redeemDelegations` helper and `Redemption` type; use `redeemDelegations` encoding / execution utilities directly. ([#160](https://github.com/MetaMask/smart-accounts-kit/pull/160))

### Fixed

- Fix delegation storage to throw a proper `Error` instance so stack traces are correct across environments. ([#171](https://github.com/MetaMask/smart-accounts-kit/pull/171))
- Fix `signDelegation` to correctly await the signer and return the signed signature. ([#168](https://github.com/MetaMask/smart-accounts-kit/pull/168))

## [0.4.0-beta.1]

### Added

- Exports 2 new types: `PermissionRequestParameter` and `Erc7715Client` ([#134](https://github.com/MetaMask/smart-accounts-kit/pull/134))

### Fixed

- Improve @metamask/delegation-abis tree-shakability ([#131](https://github.com/metamask/smart-accounts-kit/pull/131))

## [0.4.0-beta.0]

### Added

- feat: add discoverability methods ([#127](https://github.com/metamask/smart-accounts-kit/pull/127))

### Fixed

- **Breaking** Implement erc-7715 type scheme revisions across packages ([#128](https://github.com/metamask/smart-accounts-kit/pull/128))
- Resolve yarn peer dependency warnings ([#123](https://github.com/metamask/smart-accounts-kit/pull/123))
- Allow expiry to be omitted when requesting 7715 permissions ([#122](https://github.com/metamask/smart-accounts-kit/pull/122))

## [0.3.0]

### Fixed

- **Breaking** `function-call` scope no longer allows native token value, unless explicitly configured ([#118](https://github.com/MetaMask/smart-accounts-kit/pull/118))
- Add `typesVersions` to `package.json` so that subpath exports can be resolved for packages using `moduleResolution: node` ([#112](https://github.com/MetaMask/smart-accounts-kit/pull/112))

## [0.2.0]

### Added

- New permission type `erc20-token-revocation` to ERC-7715 actions ([#110](https://github.com/MetaMask/smart-accounts-kit/pull/110))

### Fixed

- Throw meaningful errors in validation of ERC-7715 request parameters ([#107](https://github.com/MetaMask/smart-accounts-kit/pull/107), [#103](https://github.com/MetaMask/smart-accounts-kit/pull/103))

## [0.1.0]

### Changed

- Promote readable permissions actions (`requestExecutionPermissions`, `sendTransactionWithDelegation`, and `sendUserOperationWithDelegation`) from experimental ([#91](https://github.com/MetaMask/smart-accounts-kit/pull/91))

[Unreleased]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@1.2.0...HEAD
[1.2.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@1.1.0...@metamask/smart-accounts-kit@1.2.0
[1.1.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@1.0.0...@metamask/smart-accounts-kit@1.1.0
[1.0.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.4.0-beta.2...@metamask/smart-accounts-kit@1.0.0
[0.4.0-beta.2]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.4.0-beta.1...@metamask/smart-accounts-kit@0.4.0-beta.2
[0.4.0-beta.1]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.4.0-beta.0...@metamask/smart-accounts-kit@0.4.0-beta.1
[0.4.0-beta.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.3.0...@metamask/smart-accounts-kit@0.4.0-beta.0
[0.3.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.2.0...@metamask/smart-accounts-kit@0.3.0
[0.2.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.1.0...@metamask/smart-accounts-kit@0.2.0
[0.1.0]: https://github.com/metamask/smart-accounts-kit/releases/tag/@metamask/smart-accounts-kit@0.1.0
