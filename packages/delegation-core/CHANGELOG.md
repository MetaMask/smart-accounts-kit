# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Uncategorized

- fix: Balance change type enforcers now use `BalanceChangeType` enum instead of number type ([#205](https://github.com/metamask/smart-accounts-kit/pull/205))

## [1.1.0]

### Added

- `Caveat` terms decoding utils ([#191](https://github.com/metamask/smart-accounts-kit/pull/191))

## [1.0.0]

### Changed

- Bumped from `0.4.0` to `1.0.0` ([#194](https://github.com/metamask/smart-accounts-kit/pull/194))

## [0.4.0]

### Added

- Add terms builders for all enforcers implemented in @metamask/smart-accounts-kit ([#139](https://github.com/metamask/smart-accounts-kit/pull/139))
  - `createAllowedMethodsTerms`
  - `createAllowedTargetsTerms`
  - `createArgsEqualityCheckTerms`
  - `createBlockNumberTerms`
  - `createDeployedTerms`
  - `createERC1155BalanceChangeTerms`
  - `createERC20BalanceChangeTerms`
  - `createERC20TransferAmountTerms`
  - `createERC721BalanceChangeTerms`
  - `createERC721TransferTerms`
  - `createExactCalldataBatchTerms`
  - `createExactExecutionTerms`
  - `createExactExecutionBatchTerms`
  - `createIdTerms`
  - `createLimitedCallsTerms`
  - `createMultiTokenPeriodTerms`
  - `createNativeBalanceChangeTerms`
  - `createNativeTokenPaymentTerms`
  - `createNativeTokenTransferAmountTerms`
  - `createOwnershipTransferTerms`
  - `createRedeemerTerms`
  - `createSpecificActionERC20TransferBatchTerms`
- New utils `encodeDelegation` and `decodeDelegation` ([#153](https://github.com/metamask/smart-accounts-kit/pull/153))

### Changed

- Default `delegation.salt` and `caveat.args` should be `0x00` ([#138](https://github.com/metamask/smart-accounts-kit/pull/138))

### Fixed

- Resolve yarn peer dependency warnings ([#123](https://github.com/metamask/smart-accounts-kit/pull/123))

## [0.3.0]

### Added

- New `allowedCalldata` terms builder ([#108](https://github.com/MetaMask/smart-accounts-kit/pull/108))

## [0.2.0]

### Added

- Added a Nonce caveat enforcer terms builder `createNonceTerms` ([#44](https://github.com/metamask/smart-accounts-kit/pull/44))

### Changed

- The configuration parameter `callData` is now `calldata` in `createExactCalldataTerms` argument type. ([#24](https://github.com/metamask/smart-accounts-kit/pull/24))
- The package is explictly marked as ESM via `type: module`; with CJS compatibility maintained with dual export. ([#27](https://github.com/metamask/smart-accounts-kit/pull/27))

## [0.2.0-rc.1]

### Added

- Added a Nonce caveat enforcer terms builder `createNonceTerms` ([#44](https://github.com/metamask/smart-accounts-kit/pull/44))

### Changed

- The configuration parameter `callData` is now `calldata` in `createExactCalldataTerms` argument type. ([#24](https://github.com/metamask/smart-accounts-kit/pull/24))
- The package is explictly marked as ESM via `type: module`; with CJS compatibility maintained with dual export. ([#27](https://github.com/metamask/smart-accounts-kit/pull/27))

## [0.1.0]

### Changed

- Add @metamask/delegation-core package, providing utility types, delegation hashing, and terms encoding for a limited set of caveat enforcers.

[Unreleased]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@1.1.0...HEAD
[1.1.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@1.0.0...@metamask/delegation-core@1.1.0
[1.0.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@0.4.0...@metamask/delegation-core@1.0.0
[0.4.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@0.3.0...@metamask/delegation-core@0.4.0
[0.3.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@0.2.0...@metamask/delegation-core@0.3.0
[0.2.0]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@0.2.0-rc.1...@metamask/delegation-core@0.2.0
[0.2.0-rc.1]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/delegation-core@0.1.0...@metamask/delegation-core@0.2.0-rc.1
[0.1.0]: https://github.com/metamask/smart-accounts-kit/releases/tag/@metamask/delegation-core@0.1.0
