import { makeErc20TokenAllowanceDecoderConfig } from './caveats/erc20TokenAllowance';
import { makeErc20TokenPeriodicDecoderConfig } from './caveats/erc20TokenPeriodic';
import { makeErc20TokenStreamDecoderConfig } from './caveats/erc20TokenStream';
import { makeNativeTokenAllowanceDecoderConfig } from './caveats/nativeTokenAllowance';
import { makeNativeTokenPeriodicDecoderConfig } from './caveats/nativeTokenPeriodic';
import { makeNativeTokenStreamDecoderConfig } from './caveats/nativeTokenStream';
import { makeTokenApprovalRevocationDecoderConfig } from './caveats/tokenApprovalRevocation';
import type { DeployedContractsByName, PermissionDecoderConfig } from './types';
import { getChecksumEnforcersByChainId } from './utils';

export {
  createErc20TokenStreamCaveats,
  type Erc20TokenStreamEnforcers,
} from './caveats/erc20TokenStream';
export {
  createErc20TokenPeriodicCaveats,
  type Erc20TokenPeriodicEnforcers,
} from './caveats/erc20TokenPeriodic';
export {
  createErc20TokenAllowanceCaveats,
  type Erc20TokenAllowanceEnforcers,
} from './caveats/erc20TokenAllowance';
export {
  createNativeTokenStreamCaveats,
  type NativeTokenStreamEnforcers,
} from './caveats/nativeTokenStream';
export {
  createNativeTokenPeriodicCaveats,
  type NativeTokenPeriodicEnforcers,
} from './caveats/nativeTokenPeriodic';
export {
  createNativeTokenAllowanceCaveats,
  type NativeTokenAllowanceEnforcers,
} from './caveats/nativeTokenAllowance';
export {
  createTokenApprovalRevocationCaveats,
  type TokenApprovalRevocationEnforcers,
} from './caveats/tokenApprovalRevocation';

export type { ExpiryRule } from './rules/expiry';
export type { PayeeRule } from './rules/payee';
export type { RedeemerRule } from './rules/redeemer';
export type { DeployedContractsByName, PermissionDecoderConfig };
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
