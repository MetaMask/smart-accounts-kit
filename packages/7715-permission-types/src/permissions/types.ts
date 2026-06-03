import type { Hex, PermissionRequest, PermissionTypes, Rule } from '../types';

/**
 * Minimal caveat representation used by permission decoders.
 */
export type Caveat<TEnforcer extends Hex = Hex> = {
  enforcer: TEnforcer;
  terms: Hex;
};

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
export type ChecksumCaveat = Caveat;

/**
 * A partially reconstructed permission object decoded from a permission context.
 */
export type DecodedPermission = Pick<
  PermissionRequest<PermissionTypes>,
  'chainId' | 'from' | 'to'
> & {
  permission: Omit<
    PermissionRequest<PermissionTypes>['permission'],
    'isAdjustmentAllowed' | 'type' | 'data'
  > & {
    type: PermissionTypes['type'];
    data: PermissionTypes['data'];
    justification?: string;
  };
  /**
   * @deprecated Use `rules` instead.
   */
  expiry: number | null;
  origin: string;
  /** Rules recovered from caveats (e.g. redeemer allowlist). */
  rules?: Rule[];
};

/**
 * Supported permission type identifiers that can be decoded from a permission context.
 */
export type PermissionType = DecodedPermission['permission']['type'];

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
  ) => DecodedPermission['permission']['data'];
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
      data: DecodedPermission['permission']['data'];
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
