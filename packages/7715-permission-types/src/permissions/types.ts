import type { Caveat } from '@metamask/delegation-core';

import type { Hex, PermissionTypes, Rule } from '../types';

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
  contractAddresses: EnforcerAddressesByName;
  caveats: ChecksumCaveat[];
  requiredEnforcers: Map<Hex, number>;
}) => Rule | null;

/**
 * Configuration object describing how to decode a single permission type.
 */
export type PermissionDecoderConfig = {
  permissionType: PermissionType;
  contractAddresses: EnforcerAddressesByName;
  optionalEnforcers: Hex[];
  requiredEnforcers: Record<Hex, number>;
  rules: RuleDecoder[];
  validateAndDecodeData: (
    caveats: ChecksumCaveat[],
    contractAddresses: EnforcerAddressesByName,
  ) => DecodedPermissionData;
};

export type PermissionDecoderSpec = (
  contractAddresses: EnforcerAddressesByName,
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

export type EnforcerContractName =
  | 'erc20StreamingEnforcer'
  | 'erc20PeriodTransferEnforcer'
  | 'nativeTokenStreamingEnforcer'
  | 'nativeTokenPeriodTransferEnforcer'
  | 'approvalRevocationEnforcer'
  | 'exactCalldataEnforcer'
  | 'valueLteEnforcer'
  | 'timestampEnforcer'
  | 'nonceEnforcer'
  | 'allowedCalldataEnforcer'
  | 'allowedTargetsEnforcer'
  | 'redeemerEnforcer';

/**
 * A map of enforcer contract names to addresses.
 */
export type EnforcerAddressesByName = Record<EnforcerContractName, Hex>;
