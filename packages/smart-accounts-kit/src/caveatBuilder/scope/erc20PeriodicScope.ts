import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { Erc20PeriodTransferBuilderConfig } from '../erc20PeriodTransferBuilder';

export type Erc20PeriodicScopeConfig = {
  type: ScopeType.Erc20PeriodTransfer;
} & Erc20PeriodTransferBuilderConfig;

/**
 * Creates a caveat builder configured for ERC20 token periodic transfers with recurring limits.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing ERC20 periodic transfer parameters.
 * @returns A configured caveat builder with ERC20 period transfer and value limit caveats.
 * @throws Error if any of the ERC20 periodic transfer parameters are invalid.
 * @throws Error if the environment is not properly configured.
 */
export function createErc20PeriodicCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: Erc20PeriodicScopeConfig,
): CoreCaveatBuilder {
  return createCaveatBuilder(environment)
    .addCaveat('valueLte', {
      maxValue: 0n,
    })
    .addCaveat('erc20PeriodTransfer', {
      tokenAddress: config.tokenAddress,
      periodAmount: config.periodAmount,
      periodDuration: config.periodDuration,
      startDate: config.startDate,
    });
}
