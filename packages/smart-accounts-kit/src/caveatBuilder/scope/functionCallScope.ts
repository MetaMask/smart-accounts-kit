import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import { hasProperties } from '../../utils';
import type { AllowedCalldataBuilderConfig } from '../allowedCalldataBuilder';
import type { AllowedMethodsBuilderConfig } from '../allowedMethodsBuilder';
import type { AllowedTargetsBuilderConfig } from '../allowedTargetsBuilder';
import { CaveatType, createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { ExactCalldataBuilderConfig } from '../exactCalldataBuilder';
import type { ValueLteBuilderConfig } from '../valueLteBuilder';

type FunctionCallScopeBaseConfig = {
  type: ScopeType.FunctionCall;
  allowedCalldata?: AllowedCalldataBuilderConfig[];
  exactCalldata?: ExactCalldataBuilderConfig;
  valueLte?: ValueLteBuilderConfig;
};

export type FunctionCallScopeConfig = FunctionCallScopeBaseConfig &
  AllowedTargetsBuilderConfig &
  AllowedMethodsBuilderConfig;

const isFunctionCallConfig = (
  config: FunctionCallScopeConfig,
): config is FunctionCallScopeConfig => {
  return hasProperties(config, ['targets', 'selectors']);
};

/**
 * Creates a caveat builder configured for function call unit of authority.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing allowed targets, methods, and optionally calldata.
 * @returns A configured caveat builder with the specified caveats.
 * @throws Error if any of the required parameters are invalid.
 * @throws Error if both allowedCalldata and exactCalldata are provided simultaneously.
 */
export function createFunctionCallCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: FunctionCallScopeConfig,
): CoreCaveatBuilder {
  const { targets, selectors, allowedCalldata, exactCalldata } = config;

  if (!isFunctionCallConfig(config)) {
    throw new Error('Invalid Function Call configuration');
  }

  if (allowedCalldata && allowedCalldata.length > 0 && exactCalldata) {
    throw new Error(
      'Cannot specify both allowedCalldata and exactCalldata. Please use only one calldata restriction type.',
    );
  }

  const valueLteConfig = config.valueLte ?? { maxValue: 0n };

  const caveatBuilder = createCaveatBuilder(environment)
    .addCaveat(CaveatType.AllowedTargets, { targets })
    .addCaveat(CaveatType.AllowedMethods, { selectors })
    .addCaveat(CaveatType.ValueLte, valueLteConfig);

  if (allowedCalldata && allowedCalldata.length > 0) {
    allowedCalldata.forEach((calldataConfig) => {
      caveatBuilder.addCaveat(CaveatType.AllowedCalldata, calldataConfig);
    });
  } else if (exactCalldata) {
    caveatBuilder.addCaveat(CaveatType.ExactCalldata, exactCalldata);
  }

  return caveatBuilder;
}
