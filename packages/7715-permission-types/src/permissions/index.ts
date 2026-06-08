import { makeErc20TokenAllowanceDecoderConfig } from './caveats/erc20TokenAllowance';
import { makeErc20TokenPeriodicDecoderConfig } from './caveats/erc20TokenPeriodic';
import { makeErc20TokenStreamDecoderConfig } from './caveats/erc20TokenStream';
import { makeNativeTokenAllowanceDecoderConfig } from './caveats/nativeTokenAllowance';
import { makeNativeTokenPeriodicDecoderConfig } from './caveats/nativeTokenPeriodic';
import { makeNativeTokenStreamDecoderConfig } from './caveats/nativeTokenStream';
import { makeTokenApprovalRevocationDecoderConfig } from './caveats/tokenApprovalRevocation';
import type { DeployedContractsByName, PermissionDecoderConfig } from './types';
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
    makeTokenApprovalRevocationDecoderConfig(contractAddresses),
  ];
};
