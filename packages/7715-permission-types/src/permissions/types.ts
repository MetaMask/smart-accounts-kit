import type { Caveat } from '@metamask/delegation-core';

import type { Hex, PermissionTypes, Rule } from '../types';

/**
 * Checksummed enforcer contract addresses for a chain (from getChecksumEnforcersByChainId).
 */
export type ChecksumEnforcersByChainId = {
  erc20StreamingEnforcer: Hex;
  erc20PeriodicEnforcer: Hex;
  nativeTokenStreamingEnforcer: Hex;
  nativeTokenPeriodicEnforcer: Hex;
  approvalRevocationEnforcer: Hex;
  exactCalldataEnforcer: Hex;
  valueLteEnforcer: Hex;
  timestampEnforcer: Hex;
  nonceEnforcer: Hex;
  allowedCalldataEnforcer: Hex;
  allowedTargetsEnforcer: Hex;
  redeemerEnforcer: Hex;
};

/** Caveat with checksummed enforcer address; used by rule decode functions. */
export type ChecksumCaveat = Caveat<Hex>;

/**
 * Type of the `data` parameter of a decoded permission.
 */
export type DecodedPermissionData<
  TPermissionType extends PermissionTypes = PermissionTypes,
> = TPermissionType['data'];

/**
 * Supported permission type identifiers that can be decoded from a permission context.
 */
export type PermissionType = PermissionTypes['type'];

/**
 * A function that inspects checksummed caveats and optionally produces a Rule.
 */
export type RuleDecoder = (args: {
  contractAddresses: ChecksumEnforcersByChainId;
  caveats: ChecksumCaveat[];
  requiredEnforcers: Map<Hex, number>;
}) => Rule | null;

/**
 * Configuration object describing how to decode a single permission type.
 */
export type PermissionDecoderConfig = {
  permissionType: PermissionType;
  contractAddresses: ChecksumEnforcersByChainId;
  optionalEnforcers: Hex[];
  requiredEnforcers: Record<Hex, number>;
  rules: RuleDecoder[];
  validateAndDecodeData: (
    caveats: ChecksumCaveat[],
    contractAddresses: ChecksumEnforcersByChainId,
  ) => DecodedPermissionData;
};

/**
 * Alias kept to align with existing decoder factory naming.
 */
export type MakePermissionDecoderConfig = PermissionDecoderConfig;

export type PermissionDecoderSpec = (
  contractAddresses: ChecksumEnforcersByChainId,
) => PermissionDecoderConfig;

/**
 * Result of validating and decoding permission terms from caveats.
 */
export type ValidateAndDecodeResult =
  | {
      isValid: true;
      expiry: number | null;
      data: DecodedPermissionData;
      rules?: Rule[];
    }
  | { isValid: false; error: Error };

/**
 * Decoder object used to match caveats and decode permission payloads.
 */
export type PermissionDecoder = {
  permissionType: PermissionType;
  requiredEnforcers: Map<Hex, number>;
  optionalEnforcers: Set<Hex>;
  caveatAddressesMatch: (caveatAddresses: Hex[]) => boolean;
  validateAndDecodePermission: (caveats: Caveat[]) => ValidateAndDecodeResult;
};

/**
 * A map of deployed contract names to addresses for one chain.
 */
export type DeployedContractsByName = Record<string, Hex>;
