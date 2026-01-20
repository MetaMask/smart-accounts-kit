import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import type { AllowedCalldataBuilderConfig } from '../allowedCalldataBuilder';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { ExactCalldataBuilderConfig } from '../exactCalldataBuilder';
import type { NativeTokenTransferAmountBuilderConfig } from '../nativeTokenTransferAmountBuilder';

export type NativeTokenTransferScopeConfig = {
  type: ScopeType.NativeTokenTransferAmount;
  allowedCalldata?: AllowedCalldataBuilderConfig[];
  exactCalldata?: ExactCalldataBuilderConfig;
} & NativeTokenTransferAmountBuilderConfig;

/**
 * Creates a caveat builder configured for native token transfers with amount limits.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing native token transfer parameters.
 * @returns A configured caveat builder with native token transfer amount and exact calldata caveats.
 * @throws Error if any of the native token transfer parameters are invalid.
 * @throws Error if both allowedCalldata and exactCalldata are provided simultaneously.
 * @throws Error if the environment is not properly configured.
 */
export function createNativeTokenTransferCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: NativeTokenTransferScopeConfig,
): CoreCaveatBuilder {
  const { maxAmount, allowedCalldata, exactCalldata } = config;

  if (allowedCalldata && allowedCalldata.length > 0 && exactCalldata) {
    throw new Error(
      'Cannot specify both allowedCalldata and exactCalldata. Please use only one calldata restriction type.',
    );
  }

  const caveatBuilder = createCaveatBuilder(environment);

  // Add calldata restrictions
  if (allowedCalldata && allowedCalldata.length > 0) {
    allowedCalldata.forEach((calldataConfig) => {
      caveatBuilder.addCaveat('allowedCalldata', calldataConfig);
    });
  } else if (exactCalldata) {
    caveatBuilder.addCaveat('exactCalldata', exactCalldata);
  } else {
    // Default behavior: only allow empty calldata
    caveatBuilder.addCaveat('exactCalldata', {
      calldata: '0x',
    });
  }

  // Add native token transfer amount restriction
  caveatBuilder.addCaveat('nativeTokenTransferAmount', {
    maxAmount,
  });

  return caveatBuilder;
}
