import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { Erc20TransferAmountBuilderConfig } from '../erc20TransferAmountBuilder';

export type Erc20TransferScopeConfig = {
  type: ScopeType.Erc20TransferAmount;
} & Erc20TransferAmountBuilderConfig;

/**
 * Creates a caveat builder configured for ERC20 token transfers with amount limits.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing ERC20 transfer parameters.
 * @returns A configured caveat builder with ERC20 transfer amount and value limit caveats.
 * @throws Error if any of the ERC20 transfer parameters are invalid.
 * @throws Error if the environment is not properly configured.
 */
export function createErc20TransferCaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: Erc20TransferScopeConfig,
): CoreCaveatBuilder {
  return createCaveatBuilder(environment)
    .addCaveat('valueLte', {
      maxValue: 0n,
    })
    .addCaveat('erc20TransferAmount', {
      tokenAddress: config.tokenAddress,
      maxAmount: config.maxAmount,
    });
}
