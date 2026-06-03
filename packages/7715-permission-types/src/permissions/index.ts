import { makeErc20TokenAllowanceDecoderConfig } from './erc20TokenAllowance';
import { makeErc20TokenPeriodicDecoderConfig } from './erc20TokenPeriodic';
import { makeErc20TokenRevocationDecoderConfig } from './erc20TokenRevocation';
import { makeErc20TokenStreamDecoderConfig } from './erc20TokenStream';
import { makeNativeTokenAllowanceDecoderConfig } from './nativeTokenAllowance';
import { makeNativeTokenPeriodicDecoderConfig } from './nativeTokenPeriodic';
import { makeNativeTokenStreamDecoderConfig } from './nativeTokenStream';
import { makeTokenApprovalRevocationDecoderConfig } from './tokenApprovalRevocation';
import type { DeployedContractsByName, PermissionDecoderConfig } from './types';
import { getChecksumEnforcersByChainId } from './utils';

export type {
  Caveat,
  ChecksumCaveat,
  ChecksumEnforcersByChainId,
  DeployedContractsByName,
  DecodedPermission,
  MakePermissionDecoderConfig,
} from './types';

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
