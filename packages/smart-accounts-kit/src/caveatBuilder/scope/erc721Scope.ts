import type { ScopeType } from '../../constants';
import type { SmartAccountsEnvironment } from '../../types';
import { hasProperties } from '../../utils';
import { createCaveatBuilder } from '../coreCaveatBuilder';
import type { CoreCaveatBuilder } from '../coreCaveatBuilder';
import type { Erc721TransferBuilderConfig } from '../erc721TransferBuilder';

export type Erc721ScopeBaseConfig = {
  type: ScopeType.Erc721Transfer;
};

export type Erc721ScopeConfig = Erc721ScopeBaseConfig &
  Erc721TransferBuilderConfig;

const isErc721TransferConfig = (
  config: Erc721ScopeBaseConfig,
): config is Erc721TransferBuilderConfig & Erc721ScopeBaseConfig => {
  return hasProperties(
    config as Erc721TransferBuilderConfig & Erc721ScopeBaseConfig,
    ['tokenAddress', 'tokenId'],
  );
};

/**
 * Creates a caveat builder configured for ERC721 unit of authority.
 *
 * @param environment - The SmartAccountsEnvironment.
 * @param config - Configuration object containing permitted contract and token ID.
 * @returns A configured caveat builder with the specified caveats.
 * @throws Error if any of the required parameters are invalid.
 */
export function createErc721CaveatBuilder(
  environment: SmartAccountsEnvironment,
  config: Erc721ScopeConfig,
): CoreCaveatBuilder {
  if (!isErc721TransferConfig(config)) {
    throw new Error('Invalid ERC721 configuration');
  }

  const caveatBuilder = createCaveatBuilder(environment).addCaveat(
    'erc721Transfer',
    config,
  );

  return caveatBuilder;
}
