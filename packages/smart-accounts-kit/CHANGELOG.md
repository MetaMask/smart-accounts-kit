# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0]

### Uncategorized

- Function call scope no longer accepts native token value, unless explicitly configured. ([#118](https://github.com/MetaMask/smart-accounts-kit/pull/118))
- Add typesVersions to package.json so that 'node' moduleResolution can resolve the types for the subpath exports ([#112](https://github.com/MetaMask/smart-accounts-kit/pull/112))

## [0.2.0]

### Added

- New permission type `erc20-token-revocation` to ERC-7715 actions ([#110](https://github.com/MetaMask/smart-accounts-kit/pull/110))

### Fixed

- Throw meaningful errors in validation of ERC-7715 request parameters ([#107](https://github.com/MetaMask/smart-accounts-kit/pull/107), [#103](https://github.com/MetaMask/smart-accounts-kit/pull/103))

## [0.1.0]

### Changed

- Promote readable permissions actions (`requestExecutionPermissions`, `sendTransactionWithDelegation`, and `sendUserOperationWithDelegation`) from experimental ([#91](https://github.com/MetaMask/smart-accounts-kit/pull/91))

[Unreleased]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.3.0...HEAD
[0.3.0]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.2.0...@metamask/smart-accounts-kit@0.3.0
[0.2.0]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/smart-accounts-kit@0.1.0...@metamask/smart-accounts-kit@0.2.0
[0.1.0]: https://github.com/MetaMask/smart-accounts-kit/releases/tag/@metamask/smart-accounts-kit@0.1.0
