import { concat, toHex } from 'viem';
import { describe, it, expect } from 'vitest';

import { createErc20StreamingCaveatBuilder } from '../../../src/caveatBuilder/scope/erc20StreamingScope';
import type { Erc20StreamingScopeConfig } from '../../../src/caveatBuilder/scope/erc20StreamingScope';
import { ScopeType } from '../../../src/constants';
import type { SmartAccountsEnvironment } from '../../../src/types';
import { randomAddress } from '../../utils';

describe('createErc20StreamingCaveatBuilder', () => {
  const environment = {
    caveatEnforcers: {
      ValueLteEnforcer: randomAddress(),
      ERC20StreamingEnforcer: randomAddress(),
    },
  } as unknown as SmartAccountsEnvironment;

  it('creates an ERC20 streaming CaveatBuilder', () => {
    const config: Erc20StreamingScopeConfig = {
      type: ScopeType.Erc20Streaming,
      tokenAddress: randomAddress(),
      initialAmount: 1000n,
      maxAmount: 10000n,
      amountPerSecond: 1n,
      startTime: Math.floor(Date.now() / 1000),
    };

    const caveatBuilder = createErc20StreamingCaveatBuilder(
      environment,
      config,
    );

    const caveats = caveatBuilder.build();

    expect(caveats).to.deep.equal([
      {
        enforcer: environment.caveatEnforcers.ValueLteEnforcer,
        args: '0x00',
        terms:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
      {
        enforcer: environment.caveatEnforcers.ERC20StreamingEnforcer,
        args: '0x00',
        terms: concat([
          config.tokenAddress,
          toHex(config.initialAmount, { size: 32 }),
          toHex(config.maxAmount, { size: 32 }),
          toHex(config.amountPerSecond, { size: 32 }),
          toHex(config.startTime, { size: 32 }),
        ]),
      },
    ]);
  });
});
