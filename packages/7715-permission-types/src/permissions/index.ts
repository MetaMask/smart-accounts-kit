import { getChecksumAddress } from '@metamask/utils';

import { makeErc20TokenAllowanceDecoderConfig } from './caveats/erc20TokenAllowance';
import { makeErc20TokenPeriodicDecoderConfig } from './caveats/erc20TokenPeriodic';
import { makeErc20TokenRevocationDecoderConfig } from './caveats/erc20TokenRevocation';
import { makeErc20TokenStreamDecoderConfig } from './caveats/erc20TokenStream';
import { makeNativeTokenAllowanceDecoderConfig } from './caveats/nativeTokenAllowance';
import { makeNativeTokenPeriodicDecoderConfig } from './caveats/nativeTokenPeriodic';
import { makeNativeTokenStreamDecoderConfig } from './caveats/nativeTokenStream';
import { makeTokenApprovalRevocationDecoderConfig } from './caveats/tokenApprovalRevocation';
import type {
  Caveat,
  DeployedContractsByName,
  PermissionDecoder,
  PermissionDecoderConfig,
  ValidateAndDecodeResult,
} from './types';
import type { Hex } from '../types';
import { getChecksumEnforcersByChainId } from './utils';

export type {
  Caveat,
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DeployedContractsByName,
  DecodedPermission,
  MakePermissionDecoderConfig,
  PermissionDecoder,
  PermissionDecoderConfig,
  PermissionDecoderSpec,
  PermissionType,
  RuleDecoder,
  ValidateAndDecodeResult,
} from './types';

export type { ExpiryRule } from './rules/expiry';
export type { PayeeRule } from './rules/payee';
export type { RedeemerRule } from './rules/redeemer';

export {
  EXECUTION_PERMISSION_EXPIRY_RULE_TYPE,
  expiryRule,
} from './rules/expiry';
export {
  EXECUTION_PERMISSION_PAYEE_RULE_TYPE,
  erc20PayeeRuleDecoder,
  nativePayeeRuleDecoder,
} from './rules/payee';
export {
  EXECUTION_PERMISSION_REDEEMER_RULE_TYPE,
  redeemerRuleDecoder,
} from './rules/redeemer';
export { makeNativeTokenStreamDecoderConfig } from './caveats/nativeTokenStream';
export { makeNativeTokenPeriodicDecoderConfig } from './caveats/nativeTokenPeriodic';
export { makeNativeTokenAllowanceDecoderConfig } from './caveats/nativeTokenAllowance';
export { makeErc20TokenStreamDecoderConfig } from './caveats/erc20TokenStream';
export { makeErc20TokenPeriodicDecoderConfig } from './caveats/erc20TokenPeriodic';
export { makeErc20TokenAllowanceDecoderConfig } from './caveats/erc20TokenAllowance';
export { makeErc20TokenRevocationDecoderConfig } from './caveats/erc20TokenRevocation';
export { makeTokenApprovalRevocationDecoderConfig } from './caveats/tokenApprovalRevocation';

/**
 * Builds the canonical set of permission decoders for a chain.
 *
 * @param contracts - Deployed delegation framework contracts for one chain.
 * @returns The full set of permission decoders for the chain.
 */
export const makePermissionDecoderConfigs = (
  contracts: DeployedContractsByName,
): PermissionDecoderConfig[] => {
  const contractAddresses = getChecksumEnforcersByChainId(contracts);

  return [
    makeNativeTokenStreamDecoderConfig(contractAddresses),
    makeNativeTokenPeriodicDecoderConfig(contractAddresses),
    makeNativeTokenAllowanceDecoderConfig(contractAddresses),
    makeErc20TokenStreamDecoderConfig(contractAddresses),
    makeErc20TokenPeriodicDecoderConfig(contractAddresses),
    makeErc20TokenAllowanceDecoderConfig(contractAddresses),
    makeErc20TokenRevocationDecoderConfig(contractAddresses),
    makeTokenApprovalRevocationDecoderConfig(contractAddresses),
  ];
};

/**
 * Creates a runtime decoder from one permission decoder configuration.
 *
 * @param config - Permission decoder configuration.
 * @returns Permission decoder.
 */
export const makePermissionDecoder = (
  config: PermissionDecoderConfig,
): PermissionDecoder => {
  const requiredEnforcers = new Map<Hex, number>(
    Object.entries(config.requiredEnforcers) as [Hex, number][],
  );
  const optionalEnforcers = new Set(config.optionalEnforcers);

  const caveatAddressesMatch = (caveatAddresses: Hex[]): boolean => {
    const counts = new Map<Hex, number>();

    for (const address of caveatAddresses) {
      counts.set(address, (counts.get(address) ?? 0) + 1);
    }
    for (const [address, count] of counts) {
      const maxAllowedCount =
        requiredEnforcers.get(address) ??
        (optionalEnforcers.has(address) ? 1 : 0);
      if (maxAllowedCount === 0 || count > maxAllowedCount) {
        return false;
      }
    }

    return true;
  };

  const validateAndDecodePermission = (
    caveats: Caveat[],
  ): ValidateAndDecodeResult => {
    try {
      const normalizedCaveats = caveats.map((caveat) => ({
        ...caveat,
        enforcer: getChecksumAddress(caveat.enforcer),
      }));

      const caveatAddresses = normalizedCaveats.map(
        (caveat) => caveat.enforcer,
      );

      if (!caveatAddressesMatch(caveatAddresses)) {
        throw new Error('Invalid caveats');
      }

      const data = config.validateAndDecodeData(
        normalizedCaveats,
        config.contractAddresses,
      );
      const rules = config.rules
        .map((decodeRule) =>
          decodeRule({
            contractAddresses: config.contractAddresses,
            caveats: normalizedCaveats,
            requiredEnforcers,
          }),
        )
        .filter((rule) => rule !== null);
      const expiryRule = rules.find((rule) => rule.type === 'expiry');

      return {
        isValid: true,
        expiry:
          expiryRule?.type === 'expiry' ? expiryRule.data.timestamp : null,
        data,
        rules: rules.length > 0 ? rules : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error : new Error('Invalid caveats'),
      };
    }
  };

  return {
    permissionType: config.permissionType,
    requiredEnforcers,
    optionalEnforcers,
    caveatAddressesMatch,
    validateAndDecodePermission,
  };
};

/**
 * Creates permission decoders for all supported permission types.
 *
 * @param contracts - Deployed delegation framework contracts for one chain.
 * @returns Runtime permission decoders.
 */
export const createPermissionDecodersForContracts = (
  contracts: DeployedContractsByName,
): PermissionDecoder[] => {
  return makePermissionDecoderConfigs(contracts).map(makePermissionDecoder);
};
