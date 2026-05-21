# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING:** Address normalization now returns lowercase addresses instead of EIP-55 checksummed addresses ([#244](https://github.com/MetaMask/smart-accounts-kit/pull/244))

### Removed

- **BREAKING:** Removed `viem` peer dependency - now using custom Ethereum address and hex validation utilities ([#244](https://github.com/MetaMask/smart-accounts-kit/pull/244))

## [0.1.0]

### Added

- New @metamask/x402 package providing plugins to @x402 packages ([#236](https://github.com/MetaMask/smart-accounts-kit/pull/236))

[Unreleased]: https://github.com/metamask/smart-accounts-kit/compare/@metamask/x402@0.1.0...HEAD
[0.1.0]: https://github.com/metamask/smart-accounts-kit/releases/tag/@metamask/x402@0.1.0
