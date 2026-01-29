import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import type { AllowedCalldataBuilderConfig } from '../allowedCalldataBuilder';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { ExactCalldataBuilderConfig } from '../exactCalldataBuilder';
import type { NativeTokenStreamingBuilderConfig } from '../nativeTokenStreamingBuilder';

export type NativeTokenStreamingScopeConfig = {
  type: ScopeType.NativeTokenStreaming;
  allowedCalldata?: AllowedCalldataBuilderConfig[];
  exactCalldata?: ExactCalldataBuilderConfig;
} & NativeTokenStreamingBuilderConfig;

/**
 * Creates a caveat builder configured for native token streaming with time-based limits.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing native token streaming parameters.
 * @returns A configured caveat builder with native token streaming and exact calldata caveats.
 * @throws Error if any of the native token streaming parameters are invalid.
 * @throws Error if both allowedCalldata and exactCalldata are provided simultaneously.
 * @throws Error if the environment is not properly configured.
 */
export function createNativeTokenStreamingCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: NativeTokenStreamingScopeConfig,
): CoreCaveatBuilder {
  const {
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
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

  // Add native token streaming restriction
  caveatBuilder.addCaveat('nativeTokenStreaming', {
    initialAmount,
    maxAmount,
    amountPerSecond,
    startTime,
  });

  return caveatBuilder;
}
