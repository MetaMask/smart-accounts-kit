import { concat, toHex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createErc20TransferCaveatBuilder } from '../../../src/caveatBuilder/scope/erc20TransferScope';
import type { Erc20TransferScopeConfig } from '../../../src/caveatBuilder/scope/erc20TransferScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createErc20TransferCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      ValueLteEnforcer: randomAddress(),
      ERC20TransferAmountEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates an ERC20 transfer CaveatBuilder', () => {
    const config: Erc20TransferScopeConfig = {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: randomAddress(),
      maxAmount: 1000n,
    };

    const caveatBuilder = createErc20TransferCaveatBuilder(environment, config);

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
      {
        enforcer: environment.caveatEnforcers.ERC20TransferAmountEnforcer,
        args: '0x00',
        terms: concat([
          config.tokenAddress,
          toHex(config.maxAmount, { size: 32 }),
        ]),
      },
    ]);
  });
});
