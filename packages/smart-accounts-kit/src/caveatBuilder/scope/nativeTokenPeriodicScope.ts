import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import type { AllowedCalldataBuilderConfig } from '../allowedCalldataBuilder';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { ExactCalldataBuilderConfig } from '../exactCalldataBuilder';
import type { NativeTokenPeriodTransferBuilderConfig } from '../nativeTokenPeriodTransferBuilder';

export type NativeTokenPeriodicScopeConfig = {
  type: ScopeType.NativeTokenPeriodTransfer;
  allowedCalldata?: AllowedCalldataBuilderConfig[];
  exactCalldata?: ExactCalldataBuilderConfig;
} & NativeTokenPeriodTransferBuilderConfig;

/**
 * Creates a caveat builder configured for native token periodic transfers with recurring limits.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing native token periodic transfer parameters.
 * @returns A configured caveat builder with native token period transfer and exact calldata caveats.
 * @throws Error if any of the native token periodic transfer parameters are invalid.
 * @throws Error if both allowedCalldata and exactCalldata are provided simultaneously.
 * @throws Error if the environment is not properly configured.
 */
export function createNativeTokenPeriodicCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: NativeTokenPeriodicScopeConfig,
): CoreCaveatBuilder {
  const {
    periodAmount,
    periodDuration,
    startDate,
    allowedCalldata,
    exactCalldata,
  } = config;

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

  // Add native token period transfer restriction
  caveatBuilder.addCaveat('nativeTokenPeriodTransfer', {
    periodAmount,
    periodDuration,
    startDate,
  });

  return caveatBuilder;
}
