# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0]

### Uncategorized

- Fix casting of repo URL from https://github.com/metamask/smart-accounts-kit to https://github.com/MetaMask/smart-accounts-kit across package.json and CHANGELOG.md files ([#272](https://github.com/MetaMask/smart-accounts-kit/pull/272))
- chore(deps-dev): bump @metamask/auto-changelog from 5.3.2 to 6.1.1 ([#249](https://github.com/MetaMask/smart-accounts-kit/pull/249))

### Changed

- **BREAKING:** Removes support for Nodejs 18 - engines changed from `^18.18 || >=20` to `>=20` ([#286](https://github.com/MetaMask/smart-accounts-kit/pull/286))

## [1.1.0]

### Added

- Abis for `ApprovalRevocationEnforcer` ([#226](https://github.com/MetaMask/smart-accounts-kit/pull/226))

## [1.0.0]

### Changed

- Bumped from `0.12.0-beta.0` to `1.0.0` ([#194](https://github.com/MetaMask/smart-accounts-kit/pull/194))

## [0.12.0-beta.0]

### Fixed

- Improve @metamask/delegation-abis tree-shakability ([#131](https://github.com/MetaMask/smart-accounts-kit/pull/131))

[Unreleased]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/delegation-abis@2.0.0...HEAD
[2.0.0]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/delegation-abis@1.1.0...@metamask/delegation-abis@2.0.0
[1.1.0]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/delegation-abis@1.0.0...@metamask/delegation-abis@1.1.0
[1.0.0]: https://github.com/MetaMask/smart-accounts-kit/compare/@metamask/delegation-abis@0.12.0-beta.0...@metamask/delegation-abis@1.0.0
[0.12.0-beta.0]: https://github.com/MetaMask/smart-accounts-kit/releases/tag/@metamask/delegation-abis@0.12.0-beta.0
