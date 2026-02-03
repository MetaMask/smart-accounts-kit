# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Introduce `PermissionContext` to represent a delegation chain (ABI-encoded `Hex` or decoded `Delegation[]`). ([#140](https://github.com/MetaMask/smart-accounts-kit/pull/140))
  - **Breaking**: Replace usages of raw `Hex` _or_ `Delegation[]` with `PermissionContext`, and rename `permissionsContext` to `permissionContext` (note the singular "permission") where applicable:
    - `SendTransactionWithDelegation`: `permissionsContext: Hex` → `permissionContext: PermissionContext`
    - `SendUserOperationWithDelegation`: within `calls: DelegatedCall`, `permissionsContext: Hex` → `permissionContext: PermissionContext`
    - `redeemDelegations`: parameter `Delegation[]` → `PermissionContext`
    - `encodeDelegations` and `decodeDelegations` now accept `PermissionContext` (if the input is already the expected type, the input is returned)
    - `encode`, `execute`, and `simulate` functions for `DelegationManager.redeemDelegations` from `@metamask/smart-accounts-kit/contracts`: parameter `delegations: Delegation[]` → `delegations: PermissionContext`

### Fixed

- Allow scope type to be specified either as `ScopeType` enum, or string literal ([#133](https://github.com/MetaMask/smart-accounts-kit/pull/133))

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

[Unreleased]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.4.0-beta.1...HEAD
[0.4.0-beta.1]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.4.0-beta.0...@metamask/smart-accounts-kit@0.4.0-beta.1
[0.4.0-beta.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.3.0...@metamask/smart-accounts-kit@0.4.0-beta.0
[0.3.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.2.0...@metamask/smart-accounts-kit@0.3.0
[0.2.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.1.0...@metamask/smart-accounts-kit@0.2.0
[0.1.0]: https://github.com/metamask/smart-accounts-kit/releases/tag/@metamask/smart-accounts-kit@0.1.0
